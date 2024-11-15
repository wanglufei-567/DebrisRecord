## Linux常用命令

### 一、什么是shell

> Shell 是 Linux 系统中的命令解释器，它是连接用户和 Linux 内核的桥梁
>
> 用户在终端中输入的命令首先被 Shell 解析，然后传递给操作系统执行
>
> 常见的 Shell 包括 Bash（Bourne Again Shell）、Zsh、Fish 等

### 二、基础命令

- **在终端输出文本字符串或命令结果：**

  - 在**Linux**系统中，可以使用 `echo` 命令来进行信息的输出：

    ```bash
    # 语法
    echo [option] [string]
    ```

    - `option` 是可选的命令选项
      - `-E`：默认选项，禁用转义字符的解释
      - `-n`：显示输出，但在其后省略换行
      - `-e`：启用转义字符的解释
      - `--help`：显示带有 `echo` 命令及其选项信息的帮助消息
      - `--version`：打印 `echo` 命令的版本信息
    - `string` 是用户提供的要显示的字符串

- **对命令输出的信息进行查找：**

  - 使用 `grep` 命令将输出结果与查找条件相结合：

    ```bash
    # 语法 通过管道 | 将命令的输出传递给 grep
    其他命令 | grep "error"
    ```

- **查找命令的可执行文件路径：**

  - `which` 命令：显示命令的可执行文件所在的路径

    ```bash
    which command_name
    ```

  - `whereis` 命令：查找命令的可执行文件、源代码和手册页的位置

    ```bash
    whereis command_name
    ```

### 三、文件夹相关

- **创建文件夹：**

  ```bash
  mkdir <directory-name>
  ```

- **查看当前目录 :**

  ```bash
  # 显示当前所在的工作目录路径
  pwd
  ```

- **删除文件夹:**

  ```bash
  # rmdir 用于删除空目录
  rmdir <directory-name>  
  
  # rm -r 或 --recursive 用于递归删除包含文件和子目录的目录
  rm -r <directory-name>
  
  # rm -f 或 --force 强制删除目录及其内容
  rm -rf <directory-name>
  ```

- **移动或重命名文件或目录：**

  ```bash
  # mv：是 "move" 的缩写，用来移动或重命名文件或目录
  mv old-folder new-folder
  
  # <old-directory-name>：原目录名（或文件名）
  # <new-directory-name>：新目录名（或文件名）
  ```

- **复制目录及其内容:**

  ```bash
  # cp：是 "copy" 的缩写，用来复制文件或目录
  cp -r <source-directory> <destination-directory>
  
  # -r：表示递归复制整个目录
  # <source-directory>：源目录（要复制的目录）
  # <destination-directory>：目标目录（复制到的位置）
  
  # 示例
  cp -r packages/locale/en /locale/input
  # 若是 /locale/input 中已经存在一个 en 文件了，这个命令会覆盖目标位置的 en 文件夹及其内容
  ```

### 四、文件相关

- **查找文件：**

  - `find` 命令：用于在文件系统中查找文件或目录

    ```bash
    # 语法
    find [路径] [查找条件] [操作]
    
    # 路径：指定查找的起始路径，可以是绝对路径或相对路径。如果省略，默认为当前目录 (.)
    # 查找条件：指定查找的条件，如按名称（-name）、按文件类型（-type f 查找文件，-type d 查找目录）
    # 操作：对符合条件的文件执行的操作，如打印文件、删除文件等
    ```

- **查看文件：**

  - `cat`命令：将文本文件的全部内容发送到终端窗口以供查看

    ```bash
    cat filename # 显示文件`filename`的全部内容
    ```

- **编辑文件：**

  - `vi`或`vim`编辑器：**Linux** 中一个常用的文本编辑器，使用它可以编辑文件

    ```bash
    # 打开文件
    vi filename
    
    # 进入编辑模式：按下`i`键
    
    # 保存并退出：按下`Esc`键，然后输入`:wq`，最后按下`Enter`键
    
    # 不保存并退出：按下`Esc`键，然后输入`:q!`，最后按下`Enter`键
    ```

### 五、查看端口进程

查看端口占用的进程信息

```shell
lsof -i:端口号

# lsof -i:8000
COMMAND   PID USER   FD   TYPE   DEVICE SIZE/OFF NODE NAME
nodejs  26993 root   10u  IPv4 37999514      0t0  TCP *:8000 (LISTEN)
```

`kill` 杀掉端口

```shell
kill -9 PID
```

`netstat -tunlp` 用于显示 `tcp`，`udp` 的端口和进程等相关情况

```shell
netstat -tunlp | grep 端口号
```

查看 `tcp` 端口占用情况

```shell
netstat -anvp tcp
```

查看进程状态

```shell
top -pid pid
```

查看子进程

```shell
pstree -p pid
```

查看线程

```shell
ps -M pid
```

查看 `IP`

```shell
ifconfig
```

