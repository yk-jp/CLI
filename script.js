// commandのhistory、fileSystemNodeで使用
class Node {
    constructor(data) {
        this.data = data;
        this.prev = null;
        this.next = null;
    }
}

//連結リスト
class DoublyLinkedList {
    static head = null;
    static tail = null;
    static curr = null;

    constructor() {
        this.head = null;
    }
    //インスタンス化しないため、疑似的なconstructor
    static initialize(newNode) {
        this.head = newNode;
        this.tail = this.head;
        this.curr = this.tail;
    }


    //データの追加 FolderDataで使用
    append(newNode) {
        if (this.head == null) {
            this.head = newNode;
            return;
        }
        let iterator = this.head;
        while (iterator.nextData !== null) {
            iterator = iterator.nextData;
        }
        iterator.nextData = newNode;
        newNode.prevData = iterator;
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

/* doublyLinkedListで管理　 (Arrayだと、rmの際、計算量が n*n(各階層での削除) = O(n^2)?になるため)
   使用する変数とmethod　: head , append() 
*/
class FolderData extends DoublyLinkedList { }

/*
  file system Node 
  fileとdirectoryのノード
    -name : 名前
    -type : fileかdir(directory)の区別 
    -prev : 親のノード(dir)　子ノードから親への参照で使用
    -next : 現在のdirのnextにdirにある場合使用
    -date : 作成日/変更日　変更があった際dateの更新
    -folderData : dirの場合、folderDataに、fileとdir(folder)を格納する。
    -fileContent : fileのcontent　dirの場合、contentを持たない
    -path : directoryをstringで保存。ファイル名は、パスが違えば同じファイル名にできる。→　uniqueなファイル名とは限らないためnodeでの追跡ができない。
    -nextData : folderDataを連結するために使用
    -prevData : folderDataを連結するために使用
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
        this.folderData = this.type == "dir" ? new FolderData() : null; //mkdirの時のみ、連結する
        this.fileContent = this.type == "file" ? "" : null;//dirの場合、contentを持たない
        this.path = null;
        this.nextData = null;
        this.prevData = null;
    }

    //commandのcopyでdeep copy用
    copy(fileSystemNode) {
        this.name = fileSystemNode.name;
        this.type = fileSystemNode.type;
        this.date = fileSystemNode.date;
        this.folderData = fileSystemNode.folderData;
        this.fileContent = fileSystemNode.fileContent;
        this.path = null;
        //横の連結は削除する
        this.nextData = null;
        this.prevData = null;
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

    /*  return boolean
        pathが有効か
        NOTE:commandが「cd」のみ .. が有効 →　各commandのvalidatorでメソッド追加
    */
    static isValidPath(path) {
        let isValid = true;
        //return   {'dir': <Array>, 'parent': <FileSystem>}
        let pathAndStartNode = this.absoleteOrRelativePath(path);

        //dirの探索
        isValid = this.isValidPathHelper(pathAndStartNode);

        return isValid;
    }

    /* return boolean
        route()と同じ。ただし、nodeの更新をせず、booleanを返す。
    */
    static isValidPathHelper(pathAndStartNode) {
        let parent = pathAndStartNode['parent'];
        let dir = pathAndStartNode['dir'];
        let iterator = parent;
        if (dir[0] == "") return iterator; // 引数がdirectoryを含まないとき
        for (let i = 0; i < dir.length; i++) {
            let foundDir = this.findDirOrFile(iterator.folderData, dir[i], 'dir');
            if (foundDir == null || iterator == null) return false;
            iterator.next = foundDir;
            foundDir.prev = iterator;
            //次のdirへ
            iterator = iterator.next;
        }
        return true;
    }

    /*
      dirが存在するか fileの探索にも使用
      folderDataリストを受け取って、線形探索
    */
    static findDirOrFile(folderData, Name, type) {
        let result = null;
        let iterator = folderData.head;
        while (iterator != null) {
            if (iterator.name == Name && iterator.type == type) {
                result = iterator;
                break;
            }
            iterator = iterator.nextData;
        }
        return result;
    }

    /* 
       pathをたどる。
       /でない場合、currentfolderとする
       /の場合絶対パス　
    */
    static route(pathAndStartNode) {
        let parent = pathAndStartNode['parent'];
        let dir = pathAndStartNode['dir'];
        let iterator = parent;
        if (dir[0] == "") return iterator; // 引数がdirectoryを含まないとき
        for (let i = 0; i < dir.length; i++) {
            let foundDir = this.findDirOrFile(iterator.folderData, dir[i], 'dir');
            iterator.next = foundDir;
            foundDir.prev = iterator;
            //次のdirへ
            iterator = iterator.next;
        }
        return iterator;
    }

    //current directoryを返す
    static getCurrPath() {
        return this.curr.path;
    }

    // 適用コマンド: mkdir touch 
    static mkdirOrTouch(path, type) {
        //{'dir': <String>, 'dirOrFileName': <String>}
        let dirAndDirName = this.getDirAndDirOrFileName(path);
        let dir = dirAndDirName['dir'];
        let dirName = dirAndDirName['dirOrFileName'];
        //探索用のdir(絶対パス or 相対パス)とdirectoryのスタート(head or curr)を取得  {'dir': <Array>, 'parent': <FileSystem>}
        let pathAndStartNode = this.absoleteOrRelativePath(dir);
        //該当のpathに移動 route()側で、head or currの参照が変更しないようにしている。
        let currDir = this.route(pathAndStartNode);
        let newData = new FileSystemNode(dirName, type);
        currDir.folderData.append(newData);
        newData.prev = this.curr;
        //pathをつなげる
        newData.path = newData.prev.path + '/' + newData.name;
        return;
    }

    /* return String
       directory直下のfile list
       option
        -r: 逆順に一覧表示
        -a: .ファイル名の隠しフォルダを含む全ファイルを表示
        無し: 一覧表示
    */
    static getFolderData(folderData, option = null) {
        let iterator = folderData.head;
        let folderDataList = "";
        while (iterator != null) {
            if (option == '-a') {
                folderDataList = (iterator.type == "dir") ? folderDataList + ` ${iterator.name}/` : folderDataList + ` ${iterator.name}`;
            } else if (option == '-r') {
                //隠しフォルダを除く
                if (iterator.name[0] != '.') folderDataList = (iterator.type == "dir") ? ` ${iterator.name}/` + folderDataList : ` ${iterator.name}` + folderDataList;
            } else {
                if (iterator.name[0] != '.') folderDataList = (iterator.type == "dir") ? folderDataList + ` ${iterator.name}/` : folderDataList + ` ${iterator.name}`;
            }
            iterator = iterator.nextData;
        }

        return folderDataList;
    }

    //nodeの削除 rm
    static remove(folderData, targetNode) {
        let prevNode = targetNode.prevData;
        let nextNode = targetNode.nextData;

        //fileが先頭の場合
        if (prevNode == null) folderData.head = folderData.head.nextData;
        else {
            prevNode.nextData = nextNode;
            //fileが最後尾の場合は、prevNodeが最後尾になる
            if (nextNode != null) nextNode.prevData = prevNode;
        }

        targetNode.prevData = null;
        targetNode.nextData = null;

        return targetNode;
    }

    /* return {'dir': <String>, 'dirOrFileName': <String>}
         
       適用コマンド: mkdir touch setContent print rm
       directoryとfileまたはdirの名前を取得する。
    */
    static getDirAndDirOrFileName(path) {
        let firstChar = path.substring(0, 1);
        let dir = path.trim().split("/");
        let dirOrFileName = dir.pop(); //file名を切り出す
        dir = dir.join("/");
        if (firstChar == "/") dir = "/" + dir; //先頭に"/"がある場合消えるため
        return { "dir": dir, 'dirOrFileName': dirOrFileName };
    }

    /* return {'dir': <String>, 'dirOrFileName': <String>, 'type' : <string>}
         
       適用コマンド: mv copy
       directoryとfileまたはdirの名前を取得する。
       getDirAndDirOrFileName(path)と同じだが、dirを name/　のように判断するため
    */
    static getDirAndDirOrFileNameAndType(path) {
        let dir = path.trim().split("/");
        let dirOrFileName = dir.pop(); //file名を切り出す
        let type = (path.slice(-1) == "/") ? "dir" : "file";

        if (type == "dir") dirOrFileName = dir.pop();
        dir = dir.join("/");
        return { "dir": dir, 'dirOrFileName': dirOrFileName, 'type': type };
    }

    /* return   {'dir': <Array>, 'iterator': <FileSystem>}

       絶対パス(/がスタート)、相対パスの判断
       root dir から探索か、current dir から探索か決定
       探索用のdir形式に変更
    */
    static absoleteOrRelativePath(path) {
        let firstChar = path.substring(0, 1);
        let dir = path.split("/");
        if (firstChar == "/") {
            dir = path.substring(1).split("/"); //絶対パスの場合先頭に「/」　→　削除
            return { 'dir': dir, 'parent': this.head };
        }
        else return { 'dir': dir, 'parent': this.curr };
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
        const zeroArgsCommand = ['pwd'];
        const singleArgsCommand = ['touch', 'mkdir', 'cd', 'pwd', 'print', 'rm'];
        const doubleArgsCommand = ['setContent', 'mv', 'copy'];
        const multipleArgsCommand = ['ls'];
        let response = null;

        if (zeroArgsCommand.indexOf(command) != -1) response = this.zeroArg(command, args);
        else if (singleArgsCommand.indexOf(command) != -1) response = this.singleArg(command, args);
        else if (doubleArgsCommand.indexOf(command) != -1) response = this.doubleArg(command, args);
        else if (multipleArgsCommand.indexOf(command) != -1) response = this.multipleArg(command, args);
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
    //argが2の場合
    static doubleArg(command, args) {
        if (command == "setContent") {
            //setContentの場合、contentに空白が入る可能性があるため、argが0の場合のみvalidate
            if (args.length == 0) return { 'isValid': false, 'errorMessage': `invalid number of arguments. ${command} needs two arguments` };
        } else {
            if (args.length != 2) return { 'isValid': false, 'errorMessage': `invalid number of arguments. ${command} needs two arguments` };
        }
        return { 'isValid': true, 'errorMessage': '' };
    }

    /*argが複数の場合
        「ls」の場合、arg = 0 , arg = 1(filepathのみ) , arg = 2(filepath + option)
    */
    static multipleArg(command, args) {
        if (args.length != 0 && args.length != 1 && args.length != 2) return { 'isValid': false, 'errorMessage': `invalid number of arguments. ${command} needs zero or one or double arguments` };
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
        else if (command == "cd") response = this.cd(args);
        else if (command == "ls") response = this.ls(args);
        else if (command == "pwd") response = this.pwd(); // validator無し
        else if (command == "setContent") response = this.setContent(args);
        else if (command == "print") response = this.print(args);
        else if (command == "rm") response = this.rm(args);
        else if (command == "mv") response = this.mv(args);
        else if (command == "copy") response = this.copy(args);
        return response;
    }

    /* 
        invalid symbolの場合エラー
        folderDataに既に同じ名前が存在する場合エラー。違うtype(dir)ならok
        隠しファイルの場合(.が先頭)、エラー出ない。
        extentionを持っていない
    */
    static touch(args) {
        const invalidSymbol = /[%:;\[\],・~「」｜￥#<>]/;
        const extentions = ["png", "xlsx", "jpg", "docx", "ppx", "txt", "js", "py", "java", "css", "html", "php", "ejs", "rb", "pdf"]; //拡張子

        if (args[0].match(invalidSymbol)) return { 'isValid': false, 'errorMessage': `invalid symbol are used.` };

        //  {'dir': <String>, 'dirOrFileName': <String>}
        let dirAndDirName = FileSystem.getDirAndDirOrFileName(args[0]);
        let dir = dirAndDirName['dir'];
        let fileName = dirAndDirName['dirOrFileName'];
        let extentionOfFile = fileName.split(".");

        //隠しファイルの場合 or extentionがある場合、エラーではない
        if (extentionOfFile.length == 2) {
            //隠しファイル　先頭に 「.」　　「.txt」など拡張子だけで名前がない場合エラー   
            if (extentionOfFile[0] == "" && extentions.indexOf(extentionOfFile[1]) != -1) return { 'isValid': false, 'errorMessage': `invalid symbol are used.` };
            // 「a.test」　など　拡張子にエラー
            if (extentionOfFile[0] != "" && extentions.indexOf(extentionOfFile[1]) == -1) return { 'isValid': false, 'errorMessage': `invalid symbol are used.` };
        }

        // 　invalidなpathの場合エラー
        if (!FileSystem.isValidPath(dir)) return { 'isValid': false, 'errorMessage': `No such file or directory` };
        // directory先に同じデータがある場合エラー
        let pathAndStartNode = FileSystem.absoleteOrRelativePath(dir);
        let iterator = FileSystem.route(pathAndStartNode);
        if (FileSystem.findDirOrFile(iterator.folderData, fileName, 'file') != null) return { 'isValid': false, 'errorMessage': `cannot create file "${fileName}" : file exists` };

        return { 'isValid': true, 'errorMessage': '' };
    }

    /* 
       invalid symbolの場合エラー
       folderDataに既に同じ名前が存在する場合エラー。違うtype(file)ならok
       有効なpathかどうか　/a/b/c　→ 「c」が作るdir
   */
    static mkdir(args) {
        const invalidSymbol = /[%:;\[\],.・~「」｜￥#<>]/;
        if (args[0].match(invalidSymbol)) return { 'isValid': false, 'errorMessage': `invalid symbol are used.` };

        //  {'dir': <String>, 'dirOrFileName': <String>}
        let dirAndDirName = FileSystem.getDirAndDirOrFileName(args[0]);
        let dir = dirAndDirName['dir'];
        let dirName = dirAndDirName['dirOrFileName'];

        // 　invalidなpathの場合エラー
        if (!FileSystem.isValidPath(dir)) return { 'isValid': false, 'errorMessage': `No such file or directory` };
        // directory先に同じデータがある場合エラー
        let pathAndStartNode = FileSystem.absoleteOrRelativePath(dir);
        let iterator = FileSystem.route(pathAndStartNode);
        if (FileSystem.findDirOrFile(iterator.folderData, dirName, 'dir') != null) return { 'isValid': false, 'errorMessage': `cannot create directory "${dirName}" : directory exists` };

        return { 'isValid': true, 'errorMessage': '' };
    }

    /* 
      -directoryがない場合
      -「..」の場合argumentsは、「..」のみ。 かつ上のdirectoryがある場合　
    */
    static cd(args) {
        if (args[0] == "..") {
            if (FileSystem.curr.prev == null) return { 'isValid': false, 'errorMessage': `No such file or directory` };
        }
        else if (!FileSystem.isValidPath(args[0])) return { 'isValid': false, 'errorMessage': `No such file or directory` };
        return { 'isValid': true, 'errorMessage': '' };
    }

    /*  ls [file path] [option]
            optionが、-a、-r、無しでないときエラー
            pathが存在しない
            optionがあるとき、optionの位置が最後ではない
    */
    static ls(args) {
        let options = ['-r', '-a'];
        if (args.length == 1) {
            if (!FileSystem.isValidPath(args[0]) && options.indexOf(args[0]) == -1) return { 'isValid': false, 'errorMessage': `No such file or directory` };
        } else if (args.length == 2) {
            if (!FileSystem.isValidPath(args[0]) || options.indexOf(args[1]) == -1) return { 'isValid': false, 'errorMessage': `No such file or directory` };
        }
        return { 'isValid': true, 'errorMessage': '' };
    }

    //validatorなし 
    static pwd() {
        return { 'isValid': true, 'errorMessage': '' };
    }

    static setContent(args) {
        return this.fileValidateHelper(args);
    }

    static print(args) {
        return this.fileValidateHelper(args);
    }

    static rm(args) {
        return this.fileValidateHelper(args);
    }

    static mv(args) {
        return this.dirOrFileValidateHelper(args);
    }

    static copy(args) {
        return this.dirOrFileValidateHelper(args);
    }

    /* 
        setContent print rmで使用
        setContent [filePath] content : filePathのみvalidateする
        print [filePath]
        rm [filePath]
        pathが存在しない
        fileが見つからない場合　
   */
    static fileValidateHelper(args) {
        //  {'dir': <String>, 'dirOrFileName': <String>}
        let dirAndDirName = FileSystem.getDirAndDirOrFileName(args[0]);
        let dir = dirAndDirName['dir'];
        let fileName = dirAndDirName['dirOrFileName'];

        // 　invalidなpathの場合エラー
        if (!FileSystem.isValidPath(dir)) return { 'isValid': false, 'errorMessage': `No such file or directory` };
        // directory先に同じデータがある場合エラー
        let pathAndStartNode = FileSystem.absoleteOrRelativePath(dir);
        let iterator = FileSystem.route(pathAndStartNode);
        if (FileSystem.findDirOrFile(iterator.folderData, fileName, "file") == null) return { 'isValid': false, 'errorMessage': `No such file` };

        return { 'isValid': true, 'errorMessage': '' };
    }

    /*   mv copyで使用
         mv,copyの際、対象がdir or fileであり、inputから判断できないため、dirの場合はinputで入力された「name」name + /　(e.g test/)の時dirとする。
         args[0] , args[1]どちらにもvalidatorを書ける
    */
    static dirOrFileValidateHelper(args) {
        //from(args[0])
        //  {'dir': <String>, 'dirOrFileName': <String>　,'type' : <String>}
        let dirAndDirNameAndType = FileSystem.getDirAndDirOrFileNameAndType(args[0]);
        let dir = dirAndDirNameAndType['dir'];
        let dirOrFileName = dirAndDirNameAndType['dirOrFileName'];
        //pathからtypeを取得する。
        let type = dirAndDirNameAndType['type'];

        // invalidなpathの場合エラー
        if (!FileSystem.isValidPath(dir)) return { 'isValid': false, 'errorMessage': `invalid directory` };

        let pathAndStartNodeFrom = FileSystem.absoleteOrRelativePath(dir);
        let iteratorFrom = FileSystem.route(pathAndStartNodeFrom);
        if (FileSystem.findDirOrFile(iteratorFrom.folderData, dirOrFileName, type) == null) return { 'isValid': false, 'errorMessage': `No such file or directory` };

        // to(args[1]) pathのvalidationのため、cdと同じ ..はあらかじめエラーとする
        let response = this.cd(args[1]);
        if (args[1] == ".." || !response['isValid']) return { 'isValid': false, 'errorMessage': `No such file or directory` };

        // directory先に同じデータがある場合エラー
        let pathAndStartNodeTo = FileSystem.absoleteOrRelativePath(args[1]);
        let iteratorTo = FileSystem.route(pathAndStartNodeTo);
        if (FileSystem.findDirOrFile(iteratorTo.folderData, dirOrFileName, type) != null) return { 'isValid': false, 'errorMessage': `${dirOrFileName} already exists` };

        return { 'isValid': true, 'errorMessage': '' };
    }

    /* return boolean
       userが入力したコマンドがsupportしているか
    */
    static isSupportedCommand(parsedArray) {
        return CLI.commands.indexOf(parsedArray[0]) != -1;
    }
}

//commandLineの操作を管理
class CLI {
    //supportしているコマンド
    static commands = ['touch', 'mkdir', 'ls', 'cd', 'pwd', 'print', 'setContent', 'rm', 'mv', 'copy'];

    /* return String
       supportしているコマンドをexecuteする 
    */
    static execute(command, args) {
        let result = null;
        if (command == "touch") result = this.touch(args[0]);
        else if (command == "mkdir") result = this.mkdir(args[0]);
        else if (command == "ls") result = this.ls(args); //argsは変動
        else if (command == "cd") result = this.cd(args[0]);
        else if (command == "pwd") result = this.pwd(); // void
        else if (command == "print") result = this.print(args[0]);
        else if (command == "setContent") result = this.setContent(args); //argsは2個 (fileのcontentに空白がある場合を考慮)
        else if (command == "rm") result = this.rm(args[0]);
        else if (command == "mv") result = this.mv(args);
        else if (command == "copy") result = this.copy(args);
        return result;
    }

    //使用できるコマンドをリストで返す。
    static commandList() {
        return this.commands.join(" / ");
    }

    //inputからコマンド解析
    static parse(inputValue) {
        return inputValue.trim().split(" ");
    }

    static touch(path) {
        FileSystem.mkdirOrTouch(path, 'file');
        return "";
    }

    static mkdir(path) {
        FileSystem.mkdirOrTouch(path, 'dir');
        return "";
    }

    static cd(path) {
        if (path == "..") {
            //上のdirectoryへ 
            FileSystem.curr = FileSystem.curr.prev;
        } else {
            let pathAndStartNode = FileSystem.absoleteOrRelativePath(path);
            //current directoryの更新
            FileSystem.curr = FileSystem.route(pathAndStartNode);
        }
        return "";
    }

    /*
      ターゲットノードがディレクトリの場合、ターゲットディレクトリノードの直下の全てのファイルリストを出力します。ターゲットノードがファイルの場合、与えられたノードのみ出力します。引数が存在しない場合、カレントディレクトリの全てのファイルリストを出力します。
    */
    static ls(args) {
        const options = ['-r', '-a'];
        let option = null;
        let fileList = "";
        if (args.length == 0) {
            fileList = FileSystem.getFolderData(FileSystem.curr.folderData);
        } else if (args.length == 1) {
            if (options.indexOf(args[0]) != -1) {
                //optionの時
                option = args[0];
                fileList = FileSystem.getFolderData(FileSystem.curr.folderData, option);
            } else {
                //pathの時
                let pathAndStartNode = FileSystem.absoleteOrRelativePath(args[0]);
                let iterator = FileSystem.route(pathAndStartNode);
                fileList = FileSystem.getFolderData(iterator.folderData);
            }
        } else {
            //dir + optionで入力されたとき
            let pathAndStartNode = FileSystem.absoleteOrRelativePath(args[0]);
            let iterator = FileSystem.route(pathAndStartNode);
            option = args[1];
            fileList = FileSystem.getFolderData(iterator.folderData, option);
        }
        return fileList;
    }

    //pwd []: 現在の作業ディレクトリのパスを出力します。
    static pwd() {
        return FileSystem.getCurrPath();
    }
    /*
        print [filePath]: // カレントディレクトリ内の指定されたfilePathの contentを表示
        NOTE : filePathの最後(/)が、file
    */
    static print(args) {
        //  {'dir': <String>, 'dirOrFileName': <String>}
        let dirAndDirName = FileSystem.getDirAndDirOrFileName(args);
        let dir = dirAndDirName['dir'];
        let fileName = dirAndDirName['dirOrFileName'];
        let pathAndStartNode = FileSystem.absoleteOrRelativePath(dir);
        let iterator = FileSystem.route(pathAndStartNode);
        let file = FileSystem.findDirOrFile(iterator.folderData, fileName, 'file');

        return file.fileContent;
    }

    /*
        setContent [filePath] [content]: // filepathに存在するfileにcontentを書きこむ 
        NOTE : filePathの最後(/)が、file
    */
    static setContent(args) {
        //  {'dir': <String>, 'dirOrFileName': <String>}
        let dirAndDirName = FileSystem.getDirAndDirOrFileName(args[0]);
        let dir = dirAndDirName['dir'];
        let fileName = dirAndDirName['dirOrFileName'];
        const content = args.slice(1).join(" ");
        let pathAndStartNode = FileSystem.absoleteOrRelativePath(dir);
        let iterator = FileSystem.route(pathAndStartNode);
        let file = FileSystem.findDirOrFile(iterator.folderData, fileName, 'file');

        //contentをupdate
        file.fileContent = content;
        return "";
    }

    /*
        rm [filePath]: // 指定したdirOrFileNameのファイルをカレントディレクトリから削除します。
        NOTE : filePathの最後(/)が、file
    */
    static rm(args) {
        //  {'dir': <String>, 'dirOrFileName': <String>}
        let dirAndDirName = FileSystem.getDirAndDirOrFileName(args);
        let dir = dirAndDirName['dir'];
        let fileName = dirAndDirName['dirOrFileName'];
        let pathAndStartNode = FileSystem.absoleteOrRelativePath(dir);
        let iterator = FileSystem.route(pathAndStartNode);
        let file = FileSystem.findDirOrFile(iterator.folderData, fileName, 'file');
        //削除
        FileSystem.remove(iterator.folderData, file);
        return "";
    }

    /*
        mv [filePath] [filePath] (arg1 : from  arg2 : to)
        移動後は、移動前から削除される
    */
    static mv(args) {
        //from(args[0])
        //  {'dir': <String>, 'dirOrFileName': <String> , 'type' , <String>}
        let dirAndDirNameAndType = FileSystem.getDirAndDirOrFileNameAndType(args[0]);
        let dirFrom = dirAndDirNameAndType['dir'];
        let dirOrFileName = dirAndDirNameAndType['dirOrFileName'];
        //pathからtypeを取得する。
        let type = dirAndDirNameAndType['type'];

        let pathAndStartNodeFrom = FileSystem.absoleteOrRelativePath(dirFrom);
        let iteratorFrom = FileSystem.route(pathAndStartNodeFrom);
        let dirOrFile = FileSystem.findDirOrFile(iteratorFrom.folderData, dirOrFileName, type);

        // to(args[1]) 
        let pathAndStartNodeTo = FileSystem.absoleteOrRelativePath(args[1]);
        let iteratorTo = FileSystem.route(pathAndStartNodeTo);

        // 元のfolderDataから削除し、新しいfolderDataに入れる 
        let removedDirorFile = FileSystem.remove(iteratorFrom.folderData, dirOrFile);

        iteratorTo.folderData.append(removedDirorFile);
        removedDirorFile.prev = iteratorTo;
        //pathをつなげる
        removedDirorFile.path = iteratorTo.path + '/' + removedDirorFile.name;
        return "";
    }

    /*
       copy [filePath] [filePath] (arg1 : from  arg2 : to)
       移動後は、移動前から削除されない
   */
    static copy(args) {
        //from(args[0])
        //  {'dir': <String>, 'dirOrFileName': <String> , 'type' , <String>}
        let dirAndDirNameAndType = FileSystem.getDirAndDirOrFileNameAndType(args[0]);
        let dirFrom = dirAndDirNameAndType['dir'];
        let dirOrFileName = dirAndDirNameAndType['dirOrFileName'];
        //pathからtypeを取得する。
        let type = dirAndDirNameAndType['type'];

        let pathAndStartNodeFrom = FileSystem.absoleteOrRelativePath(dirFrom);
        let iteratorFrom = FileSystem.route(pathAndStartNodeFrom);
        let dirOrFile = FileSystem.findDirOrFile(iteratorFrom.folderData, dirOrFileName, type);
        // to(args[1]) 
        let pathAndStartNodeTo = FileSystem.absoleteOrRelativePath(args[1]);
        let iteratorTo = FileSystem.route(pathAndStartNodeTo);

        //deep copy
        let copydirOrFile = new FileSystemNode(dirOrFileName, type);
        copydirOrFile.copy(dirOrFile);
        iteratorTo.folderData.append(copydirOrFile);

        copydirOrFile.prev = iteratorTo;
        //pathをつなげる
        copydirOrFile.path = iteratorTo.path + '/' + copydirOrFile.name;
        return "";
    }
}

/*  Views
    consoleにコマンドを表示するRender
*/
class Render {
    static title = document.getElementById("title");
    static CLITextInput = document.getElementById("CLITextInput");
    static CLITextOutput = document.getElementById("CLIOutputDiv");

    static CLI() {
        //rootノードを作成
        FileSystem.initialize();
        //supprtしているコマンドをtitleに表示
        this.supportedCommandList();
        this.CLITextInput.addEventListener("keyup", (event) => this.execute(event));
    }

    static supportedCommandList() {
        this.title.innerHTML += `<p>available commands : ${CLI.commandList()}</p>`;
        return;
    }

    //current directoryを表示する
    static currDir() {
        return CLI.pwd();
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