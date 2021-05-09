/*
    commandhistory
    fileSystemNode
*/
class Node {
    constructor(data) {
        this.data = data;
        this.prev = null;
        this.next = null;
    }
}

/*  
    連結リスト
*/
class DoublyLinkedList {
    static head = null;
    static tail = null;
    static curr = null;
    /*
        インスタンス化しないため、疑似的なconstructor
    */
    static initialize(newNode) {
        this.head = newNode;
        this.tail = this.head;
        this.curr = this.tail;
    }
}

/*
historyを管理
doubly linked listで前後のhistoryにaccess
 - up : next Nodeへ(upkeyCode = 38)
  - nextNode == nullの時最後のhistoryの表示
 - down : prev Nodeへ(downkeyCode = 40)
   - prevNode == nullの時最初のhistoryの表示
*/

class CLIHistory extends DoublyLinkedList {
    static latestKeyCode = null;
    /*
        userがenterを押したとき、historyに記録する
    */
    static record(command) {
        if (command.trim().length == 0) return;
        let newNode = new Node(command);
        if (this.head == null) this.initialize(new Node(command)); //疑似的なconstructor(1回のみ)
        if (this.tail.data == newNode.data) return;
        this.tail.next = newNode;
        newNode.next = null;
        newNode.prev = this.tail;
        this.tail = newNode;
        this.curr = this.tail;
    }

    /*
      upkeyCode = 38  downKeyCode = 40
      古いhistoryをたどる
  */
    static upAndDownKeyPressed(keyCode) {
        if (this.head == null) return; //historyがないときは、処理しない
        if (keyCode == '38') {
            if (this.curr != this.head && this.latestKeyCode != null) this.curr = this.curr.prev; //nodeの更新
            Render.CLITextInput.value = this.curr.data;
            this.latestKeyCode = keyCode;
        } else if (keyCode == '40') {
            if (this.curr.next != null) this.curr = this.curr.next; //nodeの更新
            Render.CLITextInput.value = this.curr.data;
            this.latestKeyCode = keyCode;
        }
    }
}

/*
  file system Node 
  fileとdirectoryのノード
    -name : 名前
    -type : fileかdir(directory)の区別 
    -prev : 親のノード(dir)　子ノードから親への参照で使用
    -next : 現在のdirのnextにdirにある場合使用
    -date : 作成日/変更日　変更があった際dateの更新
    -folderData : dirの場合、folderDataに、fileとdir(folder)を格納する。
    -path : directoryをstringで保存。ファイル名は、パスが違えば同じファイル名にできる。→　uniqueなファイル名とは限らないためnodeでの追跡ができない。
*/
class FileSystemNode extends Node {
    type = {
        "file": "file",
        "dir": "dir"
    };

    constructor(name, type) {
        super(null); // this.dataは使用しない。
        this.name = name;
        this.type = this.type[type];
        this.date = new Date().toString().split(" ").slice(0, 5).join(" ");
        this.folderData = this.type == "dir" ? [] : [-1]; //fileはfolderDataを持たないため、イレギュラーな値(-1)を格納
        this.path = null;
    }
}

/* 
  file system - doubly linked list
  fileとdirectoryの管理
    - head: root directory
    - curr : current directory
*/
class FileSystem extends DoublyLinkedList {
    static initialize() {
        this.head = new FileSystemNode("root", "dir");
        //headのpathを設定
        this.head.path = this.head.name;
        this.curr = this.head;
    }

    /*
      mkdirで作成したフォルダを保存
    */
    static storeDir(newFolder) {
        //フォルダをcurr directoryに保存
        this.curr.folderData.push(newFolder);
        newFolder.prev = this.curr;
        //pathをつなげる
        newFolder.path = newFolder.prev.path + '/' + newFolder.name;
    }

    /*
      touchで作成したファイルを保存　storeDir()と同じ。編集する必要がない場合削除。
    */
    static storeFile(newFile) {
        //フォルダをcurr directoryに保存
        this.curr.folderData.push(newFile);
        newFile.prev = this.curr;
        //pathをつなげる
        newFile.path = newFile.prev.path + '/' + newFile.name;
    }

    /* return boolean
        folderDataに同名があるか
    */
    static hasSameName(newData) {
        let hasSameName = false;
        this.curr.folderData.forEach((data) => {
            if (data.name == newData) hasSameName = true;
        });
        return hasSameName;
    }

    /* return String
       directory直下のfile list
       option
        -r: 逆順に一覧表示
        -a: .ファイル名の隠しフォルダを含む全ファイルを表示
        無し: 一覧表示
    */
    static currDirFileList(option = null) {
        let fileList = [];
        this.curr.folderData.forEach((data) => {
            if (option == '-r') {

            } else if (option == '-a') {
                if (data.type == 'dir') fileList.push(`/${data.name}`);
                else fileList.push(data.name);
            } else {
                //隠しファイルを除く
                if (data.name[0] != ".") {
                    if (data.type == 'dir') fileList.push(`/${data.name}`);
                    else fileList.push(data.name);
                }
            }
        });

        return fileList.join(" ");
    }

}


/*
    CLIのvalidator
    {'isValid': <Boolean>, 'errorMessage': <String>} の形をした連想配列を作成

    一般的なvalidatorをpassし、特定のコマンドのvalidatorをpassしたら、コマンド実行
*/
class CLIValidator {
    static parsedArray(parsedArray) {
        let validatorResponse = this.universal(parsedArray); //supportしているコマンドのvalidator
        if (!validatorResponse['isValid']) return validatorResponse;
        let command = parsedArray[0];
        let args = parsedArray.slice(1, parsedArray.length); //argumentの数のvalidator
        validatorResponse = this.arguments(command, args);
        if (!validatorResponse['isValid']) return validatorResponse;
        validatorResponse = this.command(command, args); // 入力されたcommandのvalidator
        if (!validatorResponse['isValid']) return validatorResponse;

        return validatorResponse;
    }

    /* 
         一般的なvalidatorをする
          -CLIがsupportしているコマンドであるか(arrayの先頭)
    */
    static universal(parsedArray) {
        if (!this.isSupportedCommand(parsedArray)) return { 'isValid': false, 'errorMessage': `"${parsedArray[0]}" is not supported.` };
        return { 'isValid': true, 'errorMessage': '' };
    }

    /*
        argmentsの数
        - 0個 : pwd
        - 1個 : touch, mkdir, cd, pwd, print, setContent, rm
        -　0 or 1 個: ls 
    */
    static arguments(command, args) {
        let zeroArgsCommand = ['pwd'];
        let singleArgsCommand = ['touch', 'mkdir', 'cd', 'pwd', 'print', 'setContent', 'rm'];
        let zeroOrSingleCommand = ['ls'];
        let response = null;

        if (zeroArgsCommand.indexOf(command) != -1) response = this.zeroArg(command, args);
        else if (singleArgsCommand.indexOf(command) != -1) response = this.singleArg(command, args);
        else if (zeroOrSingleCommand.indexOf(command) != -1) response = this.zeroOrSingleArg(command, args);
        else response = { 'isValid': true, 'errorMessage': '' }; //lsの時

        return response;
    }

    //argが0の場合
    static zeroArg(command, args) {
        if (args.length != 0) return { 'isValid': false, 'errorMessage': `invalid number of arguments. ${command} needs no arguments` };
        else return { 'isValid': true, 'errorMessage': '' };
    }
    //argが1の場合
    static singleArg(command, args) {
        if (args.length != 1) return { 'isValid': false, 'errorMessage': `invalid number of arguments. ${command} needs only one argument` };
        else return { 'isValid': true, 'errorMessage': '' };
    }

    //argが0 or 1 の場合
    static zeroOrSingleArg(command, args) {
        if (args.length != 0 && args.length != 1) return { 'isValid': false, 'errorMessage': `invalid number of arguments. ${command} needs zero or one argument` };
        else return { 'isValid': true, 'errorMessage': '' };
    }

    /*
         実行するcommandのvalidator
         {'isValid': <Boolean>, 'errorMessage': <String>} の形をした連想配列を作成
    */
    static command(command, args) {
        let response = null;
        if (command == "touch") response = this.touch(args);
        else if (command == "mkdir") response = this.mkdir(args);
        else if (command == "ls") response = this.ls(args);
        else if (command == "cd") response = this.cd(args);
        else if (command == "pwd") response = this.pwd(); // void
        else if (command == "print") response = this.print(args);
        else if (command == "setContent") response = this.setContent(args);
        else if (command == "rm") response = this.rm(args);

        return response;
    }

    /* cd 
        - pathが存在しない
    */
    static cd(args) {

        return { 'isValid': true, 'errorMessage': '' };
    }

    /* 
        invalid symbolの場合エラー
        folderDataに既に同じ名前が存在する場合エラー
        隠しファイルの場合(.が先頭)、エラー出ない。
    */
    static mkdir(args) {
        let invalidSymbol = /[%:;\[\],・~/「」｜￥#<>]/;

        if (args[0].match(invalidSymbol)) return { 'isValid': false, 'errorMessage': `invalid symbol are used.` };
        //隠しファイルの場合(.が先頭)、エラー出ない。
        if (args[0].indexOf(".") != -1 && args[0].indexOf(".") != 0) return { 'isValid': false, 'errorMessage': `invalid symbol are used.` };

        //現在のdirectoryに同名がある場合エラー
        if (FileSystem.hasSameName(args[0])) return { 'isValid': false, 'errorMessage': `cannot create directory "${args[0]}" : File exists` };

        return { 'isValid': true, 'errorMessage': '' };
    }

    /*  ls [option]
            optionが、-a、-r、無しでないときエラー
    */
    static ls(args) {
        let options = ['-r', '-a'];
        if (args[0] != null && options.indexOf(args[0]) == -1) return { 'isValid': false, 'errorMessage': `"${args[0]}" is not supported option` };
        return { 'isValid': true, 'errorMessage': '' };
    }

    /* return boolean
       userが入力したコマンドがsupportしているか
    */
    static isSupportedCommand(parsedArray) {
        return CLI.commands.indexOf(parsedArray[0]) != -1;
    }
}

/*
commandLineの操作を管理
*/
class CLI {
    //supportしているコマンド
    static commands = ['touch', 'mkdir', 'ls', 'cd', 'pwd', 'print', 'setContent', 'rm'];

    /* return String
       supportしているコマンドをexecuteする 
    */
    static execute(command, args) {
        let result = null;
        if (command == "touch") result = this.touch(args[0]);
        else if (command == "mkdir") result = this.mkdir(args[0]);
        else if (command == "ls") result = this.ls(args[0]);
        else if (command == "cd") result = this.cd(args[0]);
        else if (command == "pwd") result = this.pwd(); // void
        else if (command == "print") result = this.print(args[0]);
        else if (command == "setContent") result = this.setContent(args[0]);
        else if (command == "rm") result = this.rm(args[0]);
        return result;
    }

    /*
        inputからコマンド解析
    */
    static parse(inputValue) {
        return inputValue.trim().split(" ");
    }

    /*
      指定した名前のファイルをカレントディレクトリに作成 
      ファイルまたはディレクトリが既に存在する場合は、ノードのdateModified値を現在の日付に更新
    */
    static touch(fileOrDirName) {

    }

    /*
     与えられた名前でカレントディレクトリに新しいディレクトリを作成します。
   */
    static mkdir(dirName) {
        let newFolder = null;
        if (dirName.indexOf("/") == -1) {
            newFolder = new FileSystemNode(dirName, "dir");
            FileSystem.storeDir(newFolder);
        } else {

        }
        return "";
    }
    /*
      ターゲットノードがディレクトリの場合、ターゲットディレクトリノードの直下の全てのファイルリストを出力します。ターゲットノードがファイルの場合、与えられたノードのみ出力します。引数が存在しない場合、カレントディレクトリの全てのファイルリストを出力します。
    */
    static ls(option) {
        let options = ['-r', '-a'];
        let fileList = "";
        if (options.indexOf(option) == -1) {
            fileList = FileSystem.currDirFileList(option);
        } else {
            fileList = FileSystem.currDirFileList();
        }
        return fileList;
    }

    /*
        cd [..| dirName]: // 現在の作業ディレクトリを指定されたものに変更します。引数が'..'の場合はカレントディレクトリを親ディレクトリに、そうでない場合はカレントディレクトリを カレントディレクトリ内のdirNameに変更します。
    */

    static cd(dirName) {

    }

    /*
        pwd []: // 現在の作業ディレクトリのパスを出力します。
    */
    static pwd() {

    }
    /*
        print [fileName]: // カレントディレクトリ内の指定されたfileNameの.content値（ファイルの情報）を表示します。
    */
    static print(fileName) {

    }

    /*
        setContent [fileName]: // 与えられたfileNameの.content値をカレントディレクトリに設定します。
    */

    static setContent(fileName) {

    }

    /*
        rm [fileOrDirName]: // 指定したfileOrDirNameのファイルまたはディレクトリをカレントディレクトリから削除します。
    */
    static rm(fileOrDirName) {

    }


}

/*  Views
    consoleにコマンドを表示するRender
*/
class Render {
    static CLITextInput = document.getElementById("CLITextInput");
    static CLITextOutput = document.getElementById("CLIOutputDiv");

    static CLI() {
        //rootノードを作成
        FileSystem.initialize();
        this.CLITextInput.addEventListener("keyup", (event) => this.execute(event));
    }

    //current directoryを表示する
    static currDir() {
        return FileSystem.curr.path;
    }

    static appendResultParagraph(parentDiv, isValid, message) {
        let promptName = "";
        let promptColor = "";
        if (isValid) {
            promptName = "Execute";
            promptColor = "turquoise";
        }
        else {
            promptName = "Error";
            promptColor = "red";
        }

        parentDiv.innerHTML +=
            `<p class="m-0">
                    <span style='color: ${promptColor}'>${promptName}</span>: ${message}
                </p>`;
        return;
    }

    static appendEchoParagraph(parentDiv) {
        parentDiv.innerHTML +=
            `<p class="m-0">
                <span style='color:green'>user</span>
                 | <span style='color:magenta'>${Render.currDir()}</span>
            </p>
            $${this.CLITextInput.value}
            `;
        return;
    }

    static execute(event) {
        if (event.key == "Enter") {
            // commandを区切り、listとして要素を分解する。
            let parsedArray = CLI.parse(this.CLITextInput.value);

            // consoleに表示するテキスト　user + command 
            this.appendEchoParagraph(this.CLITextOutput);

            //historyとしてcommandを記録
            CLIHistory.record(CLITextInput.value);
            CLITextInput.value = '';
            //validateする
            let validator = CLIValidator.parsedArray(parsedArray);

            if (!validator['isValid']) this.appendResultParagraph(this.CLITextOutput, false, validator['errorMessage']);
            else {
                //ユーザーのコマンドがpassしたとき
                let command = parsedArray[0];
                let args = parsedArray.slice(1, parsedArray.length); //argument

                this.appendResultParagraph(this.CLITextOutput, true, CLI.execute(command, args));
            }

            // 出力divを常に下方向にスクロールします。
            CLIOutputDiv.scrollTop = CLIOutputDiv.scrollHeight;
        } else {
            CLIHistory.upAndDownKeyPressed(event.keyCode);
        }
    }
}

Render.CLI();