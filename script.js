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
historyを管理
doubly linked listで前後のhistoryにaccess
 - up : next Nodeへ(upkeyCode = 38)
  - nextNode == nullの時最後のhistoryの表示
 - down : prev Nodeへ(downkeyCode = 40)
   - prevNode == nullの時最初のhistoryの表示
*/

class CLIHistory {
    static latestKeyCode = null;
    static history = {
        "head": null,
        "tail": null,
        "curr": null
    }

    /*
        インスタンス化しないため、疑似的なconstructor
    */

    static initialize(newNode) {
        this.history.head = newNode;
        this.history.tail = this.history.head;
        this.history.curr = this.history.tail;
    }

    /*
        userがenterを押したとき、historyに記録する
    */
    static record(command) {
        if (command.trim().length == 0) return;
        let newNode = new Node(command);
        if (this.history.head == null) this.initialize(new Node(command)); //疑似的なconstructor(1回のみ)
        if (this.history.tail.data == newNode.data) return;
        this.history.tail.next = newNode;
        newNode.next = null;
        newNode.prev = this.history.tail;
        this.history.tail = newNode;
        this.history.curr = this.history.tail;
    }

    /*
      upkeyCode = 38  downKeyCode = 40
      古いhistoryをたどる
  */
    static upAndDownKeyPressed(keyCode) {
        if (this.history.head == null) return; //historyがないときは、処理しない
        if (keyCode == '38') {
            if (this.history.curr != this.history.head && this.latestKeyCode != null) this.history.curr = this.history.curr.prev; //nodeの更新
            CLITextInput.value = this.history.curr.data;
            this.latestKeyCode = keyCode;
        } else if (keyCode == '40') {
            if (this.history.curr.next != null) this.history.curr = this.history.curr.next; //nodeの更新
            CLITextInput.value = this.history.curr.data;
            this.latestKeyCode = keyCode;
        }
    }
}

/*
  file system Node 
  fileとdirectoryのノード
    -name : 名前
    -type : fileかdir(directory)の区別 
    -parent : 親のノード(dir)　子ノードから親への参照で使用
    -date : 作成日/変更日　変更があった際dateの更新
*/
class FileSystemNode extends Node {
    type = {
        "file": "file",
        "dir": "dir"
    };
    
    constructor(name, type, parent) {
        super(null); // this.dataは使用しない。
        this.name = name;
        this.type = this.type[type];
        this.parent = parent;
        this.createDate = new Date.now();
    }
}

/*
  file system - doubly linked list
  fileとdirectoryの管理
    - root: root directory
    - currDir : current directory
   
*/
class FileSystem { 
    static root = null;
    static currDir = null;

    // 疑似的なconstructor
    static initialize(root) { 
        this.root = root;
        this.currDir = root;
    }
}


/*
    CLIのvalidator
*/
class CLIValidator {
    /*   return String
         フォルダ、ファイル作成時の名前
    */
    static fileOrFolderName() {

    }

    /*  return String
        userが入力したコマンド
    */
    static command() {

    }

    /* return boolean
       userが入力したコマンドがsupportしているか
    */
    static isSupportedCommand() {

    }
}

/*
commandLineの操作を管理
*/
class CLI {
    //supportしているコマンド
    static command = ['touch', 'mkdir', 'ls', 'cd', 'pwd', 'print', 'setContent', 'rm'];

    /*
        inputからコマンド解析
    */
    static parse() {


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
    static CLITextFileds = {
        "CLITextInput": document.getElementById("CLITextInput"),
        "CLITextOutput": document.getElementById("CLIOutputDiv")
    }

    static CLI() {
        this.CLITextInput.addEventListener("keyup", (event) => this.execute(event));
    }

    static execute(event) {
        if (event.key == "Enter") {
            // commandを区切り、listとして要素を分解する。
            let parsedCLIArray = ExTools.commandLineParser(CLITextInput.value);

            // consoleに表示するテキスト　admin + command 
            ExTools.appendEchoParagraph(CLIOutputDiv);

            //historyとしてcommandを記録
            CLIHistory.record(CLITextInput.value);

            CLITextInput.value = '';



            // 出力divを常に下方向にスクロールします。
            CLIOutputDiv.scrollTop = CLIOutputDiv.scrollHeight;
        } else {
            CLIHistory.upAndDownKeyPressed(event.keyCode);
        }
    }
}

