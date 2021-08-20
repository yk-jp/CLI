  # Command Line Interface

  This is a CLI created with only HTML,CSS and Javascript.  

  You can try it at https://yk-jp.github.io/CLI/
  
  ## Feature
  * Absolute path　
  * Relative path (※ I didn't include './' feature)
  * touch [filepath]
  * mkdir [filepath]
  * ls or ls [filepath] or ls [filepath] [option]  (option = -a or -r)
  * cd [filepath]
  * pwd
  * print [filepath]: Display info written in the file that was created with touch command.
  * setContent [filepath] [content]: write content in the file that was created with touch command
  * rm [filepath]:Not folder but only file can be deleted
  * mv [filepath(from)] [filepath(to)]:Move file or folder from file path to to file path. If a folder is moved, '/' at the end of the folder is necessary. The data in the from file path should be deleted.
  * copy [filepath(from)] [filepath(to)] Move file or folder from file path to to file path. If a folder is moved, '/' at the end of the folder is necessary. The data in the from file path should be remained.

  ## Installation
  ```
  git clone https://github.com/yk-jp/blackjack.git
  cd CLI
  ```