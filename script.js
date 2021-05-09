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
        this.createDate = Date.now();
        this.folderData = [];
    }
}

/* 
  file system - doubly linked list
  fileとdirectoryの管理
    - head: root directory
    - curr : current directory
*/
class FileSystem extends DoublyLinkedList {
    static head = new FileSystemNode("root");
    static curr = this.head;
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
        validatorResponse = this.command(command,args); // 入力されたcommandのvalidator
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
        -　0 or 1 個: ls → ls()にてvalidateする 
    */
    static arguments(command, args) {
        let zeroArgsCommand = ['pwd'];
        let singleArgsCommand = ['touch', 'mkdir', 'cd', 'pwd', 'print', 'setContent', 'rm'];
        let response = null;

        if (zeroArgsCommand.indexOf(command) != -1) response = this.zeroArg(command, args);
        else if (singleArgsCommand.indexOf(command) != -1) response = this.singleArg(command, args);
        else response = { 'isValid': true, 'errorMessage': '' }; //lsの時

        return response;
    }

    //argが0の場合
    static zeroArg(command, args) {
        if (args.length <= 0) return { 'isValid': false, 'errorMessage': `invalid number of arguments. ${command} needs no arguments` };
        else return { 'isValid': true, 'errorMessage': '' };
    }
    //argが1の場合
    static singleArg(command, args) {
        if (args.length != 1) return { 'isValid': false, 'errorMessage': `invalid number of arguments. ${command} needs only one argument` };
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
        else if (command == "pwd") response = this.pwd(args);
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

    /*
        supportしているコマンドをexecuteする
    */
    static execute(command, parsedArray) {

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

    }
    /*
      ターゲットノードがディレクトリの場合、ターゲットディレクトリノードの直下の全てのファイルリストを出力します。ターゲットノードがファイルの場合、与えられたノードのみ出力します。引数が存在しない場合、カレントディレクトリの全てのファイルリストを出力します。
    */
    static ls(fileOrDirName = null) {

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
        this.CLITextInput.addEventListener("keyup", (event) => this.execute(event));
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
                <span style='color:green'>student</span>
                <span style='color:magenta'>@</span>
                <span style='color:blue'>recursionist</span>
                : ${this.CLITextInput.value}
            </p>`;
        return;
    }

    static execute(event) {
        if (event.key == "Enter") {
            // commandを区切り、listとして要素を分解する。
            let parsedCLIArray = CLI.parse(this.CLITextInput.value);
            console.log(parsedCLIArray);
            // consoleに表示するテキスト　user + command 
            this.appendEchoParagraph(this.CLITextOutput);

            //historyとしてcommandを記録
            CLIHistory.record(CLITextInput.value);
            CLITextInput.value = '';
            //validateする
            let validator = CLIValidator.parsedArray(parsedCLIArray);
          
            if(!validator['isValid']) this.appendResultParagraph(this.CLITextOutput, false, validator['errorMessage']);
            else this.appendResultParagraph(this.CLITextOutput, true, validator['errorMessage']);

            // 出力divを常に下方向にスクロールします。
            CLIOutputDiv.scrollTop = CLIOutputDiv.scrollHeight;
        } else {
            CLIHistory.upAndDownKeyPressed(event.keyCode);
        }
    }
}

Render.CLI();