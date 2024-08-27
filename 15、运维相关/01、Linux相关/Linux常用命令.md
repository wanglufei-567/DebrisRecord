## Linux常用命令

### 一、什么是shell

> Shell 是 Linux 系统中的命令解释器，它是连接用户和 Linux 内核的桥梁
>
> 用户在终端中输入的命令首先被 Shell 解析，然后传递给操作系统执行
>
> 常见的 Shell 包括 Bash（Bourne Again Shell）、Zsh、Fish 等

### 二、查看端口进程

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

### 二、查看文件或文件夹的读写权限信息

```bash
ls -l <directory-path>

# 返回信息示例
# drwxr-xr-x      1          root         root        23 Apr  9 06:44     assets
# 文件权限信息  文件链接数   文件的所有者    文件的所属组    文件的最后修改时间     文件的名称
```

- `<directory-path>`：要查看权限的文件夹的路径

这个命令会返回一个列表，显示文件夹中每个文件的详细信息，包括文件的权限、所有者、大小和修改时间

文件的权限被表示为一串字符，例如`drwxr-xr-x`

> 在Linux系统中，文件和目录的权限信息通常由10个字符组成，例如`drwxr-xr-x`
>
> 这10个字符可以分为四部分：
>
> - **文件类型**：第一个字符表示文件类型
>
>   - `d`表示这是一个目录（`directory`）
>   - `-`表示这是一个普通文件
>   - `l`表示这是一个链接（`link`）
>
> - **所有者权限**：接下来的三个字符表示文件所有者（`owner`）的权限
>
>   - `r`表示读取（`read`）权限
>
>   - `w`表示写入（`write`）权限
>
>   - `x`表示执行（`execute`）权限
>
>     例如，`rwx`表示所有者有读取、写入和执行的权限
>
> - **组权限**：接下来的三个字符表示同一组（`group`）内的其他用户的权限
>
> - **其他用户权限**：最后三个字符表示其他所有用户的权限

所以，对于`drwxr-xr-x`：

- `d`表示这是一个目录
- `rwx`表示所有者有读取、写入和执行的权限
- `r-x`表示同一组内的其他用户有读取和执行的权限，但没有写入的权限
- `r-x`表示其他所有用户有读取和执行的权限，但没有写入的权限

### 三、给某个用户添加文件权限

在**Linux**系统中，可以使用`chmod`命令或`chown`命令来修改文件或目录的权限:

- **使用`chmod`命令修改权限**：`chmod`命令可以修改文件或目录的读取、写入和执行权限

  ```bash
  chmod u+w <file-path>
  ```

  - `u+w`表示给文件的所有者添加写入权限

  - `<file-path>`是想要修改权限的文件或目录的路径

    > 也可以使用数字来表示权限，例如`chmod 644 <file-path>`
    >
    > - `6`表示所有者的权限（`6`等于`4+2`，即读取和写入权限）
    > - `4`表示组的权限和其他用户的权限（`4`表示只有读取权限)

- **使用`chown`命令修改所有者**：如果想改变文件或目录的所有者，可以使用`chown`命令

  ```bash
  chown <username> <file-path>
  ```
  - `<username>`表示新的所有者的用户名
  - `<file-path>`表示想要修改所有者的文件或目录的路径

### 四、查看当前用户角色

在**Linux**系统中，可以使用以下命令来查看当前用户的角色：

- `whoami`：此命令会显示当前用户的用户名
- `id -un`：此命令也可以用来查看当前用户的用户名
- `who -H`：此命令可以列出当前所有的用户名、窗口列表、开启时间和目录层次

### 五、查看与编辑文件

- `cat`命令：`cat`命令将文本文件的全部内容发送到终端窗口以供查看
  - 例如，如果输入`cat filename`，它将显示文件`filename`的全部内容
- `vi`或`vim`编辑器：
  - 打开文件：`vi filename`
  - 进入编辑模式：按下`i`键
  - 保存并退出：按下`Esc`键，然后输入`:wq`，最后按下`Enter`键
  - 不保存并退出：按下`Esc`键，然后输入`:q!`，最后按下`Enter`键

### 六、在终端输出文本字符串或命令结果

在**Linux**系统中，可以使用 `echo` 命令来进行信息的输出：

- 语法：`echo [option] [string]1`
  - `option` 是可选的命令选项
    - `-E`：默认选项，禁用转义字符的解释
    - `-n`：显示输出，但在其后省略换行
    - `-e`：启用转义字符的解释
    - `--help`：显示带有 `echo` 命令及其选项信息的帮助消息
    - `--version`：打印 `echo` 命令的版本信息
  - `string` 是用户提供的要显示的字符串

### 七、SSH 连接

#### 7.1、创建秘钥与公钥

如果用户目录下没有`.ssh`目录，则需要新建一个

```powershell
cd ~/.ssh
ssh-keygen -t rsa -f id_rsa_my
ssh-keygen -t rsa -f id_rsa_company
```

一路回车即可

上面`ssh-keygen` 命令参数：

- -t: 指定生成`rsa` 类型秘钥
- -f: 指定生成秘钥的名字，可以不指定该参数，默认就会生成2个文件：私钥`id_rsa`，公钥`id_rsa.pub`。由于需要生成两对私钥公钥，因此需要指定`-f`，否则生成两次后，私钥公钥会覆盖

上面的命令调用完后会生成四个文件：

- `id_rsa_my`
- `id_rsa_my.pub`
- `id_rsa_company`
- `id_rsa_company.pub`

#### 7.2、创建config

在`.ssh`目录下创建`config` 文件，`SSH` 通过这个文件才知道哪个私钥去对应哪个公钥

```bash
touch config
```

`config`文件内容：

```perl
# my
Host my
HostName github.com
IdentityFile ~/.ssh/id_rsa_my

# company
Host test7
User root
HostName 52.131.227.208
IdentityFile ~/.ssh/id_rsa_test_company
```

`config`文件部分参数含义，仅做记录

```bash
# Host: 主机别名
# HostName: 托管平台域名地址，如github.com
# IdentityFile: 该Host私钥文件
# User: 托管平台用户名
# Port: 端口号，可不填（如果不是默认22号端口则需要指定）
# PreferredAuthentications publickey
```

#### 7.3、创建 SSH 连接

在命令行中输入以下命令以测试连接：

```bash
ssh user@hostname_or_ip
```

- **user**：你要登录的用户名
- **hostname_or_ip**：服务器的主机名或 IP 地址

如果是第一次连接到这个主机，会被询问是否要接受服务器的指纹，输入 `yes` 然后按下回车即可

如果成功登录到远程主机，**SSH** 连接就没有问题，可以在远程主机上运行一些命令来确认连接的稳定性，例如：

```bash
uname -a  # 显示操作系统信息
whoami    # 显示当前登录用户
```
