## Linux常用命令

### 一、什么是shell

**Shell** 是 **Linux** 系统中的命令解释器，它是连接用户和 **Linux** 内核的桥梁

用户在终端中输入的命令首先被 **Shell** 解析，然后传递给操作系统执行

常见的 **Shell** 包括 **Bash**（**Bourne Again Shell**）、**Zsh**、**Fish** 等

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

- **命令替换：**

  - `$(...)` 命令：先执行括号里的命令，把它的标准输出替换到当前位置

    ```shell
    TODAY=$(date +%F)
    echo "$TODAY"

    # 先运行 date +%F，拿到输出结果，再赋值给 TODAY
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

### 三、Shell 条件判断

`[ ... ]` 是 **shell** 里的条件测试语法，本质上是在调用 `test` 命令

它常见于 `if`、`while` 和脚本启动检查，例如判断环境变量是否存在、文件是否可执行、目录是否可写

示例👇：

```bash
if [ -n "${HERMES_HOME:-}" ] && [ -x "$HERMES_HOME/.venv-tools/bin/python" ]; then
  PYTHON="$HERMES_HOME/.venv-tools/bin/python"
fi
```

如果 `HERMES_HOME` 非空，并且 `$HERMES_HOME/.venv-tools/bin/python` 存在且可执行，就使用这个 **Python** 解释器

`${HERMES_HOME:-}` 表示如果 `HERMES_HOME` 没有设置，就当作空字符串处理，常用于配合 `set -u`：引用未定义变量时，脚本立即退出

#### 1. 字符串条件

| 参数 | 语义 | 常见场景 |
| --- | --- | --- |
| `-n "$var"` | 字符串非空 | 判断环境变量是否设置 |
| `-z "$var"` | 字符串为空 | 判断配置是否缺失 |
| `"$name" = "prod"` | 字符串相等 | 判断当前环境、模式、分支名 |
| `"$name" != "prod"` | 字符串不相等 | 排除某个环境或模式 |

#### 2. 路径条件

| 参数 | 语义 | 常见场景 |
| --- | --- | --- |
| `-e "$path"` | 路径存在 | 文件或目录都可以 |
| `-f "$path"` | 是普通文件 | 配置文件、脚本文件、日志文件 |
| `-d "$path"` | 是目录 | 工作目录、缓存目录、输出目录 |
| `-x "$path"` | 可执行 | **Python**、**Node**、脚本入口 |
| `-r "$path"` | 可读 | 配置、证书、输入文件 |
| `-w "$path"` | 可写 | 输出目录、缓存目录、临时目录 |
| `-s "$path"` | 文件存在且非空 | 生成结果、日志、配置文件 |

路径判断优先看“脚本接下来要对这个路径做什么”，如果要执行就用 `-x`，如果要读取就用 `-r`，如果要写入就用 `-w`

#### 3. 数字条件

| 参数 | 语义 | 常见场景 |
| --- | --- | --- |
| `"$count" -eq 0` | 等于 | 判断数量是否为 `0` |
| `"$count" -ne 0` | 不等于 | 判断命令结果数量是否非 `0` |
| `"$count" -gt 10` | 大于 | 判断是否超过阈值 |
| `"$count" -ge 10` | 大于等于 | 判断是否达到阈值 |
| `"$count" -lt 10` | 小于 | 判断是否低于阈值 |
| `"$count" -le 10` | 小于等于 | 判断是否不超过阈值 |

数字条件只用于整数比较，字符串是否一样应该使用 `=` 或 `!=`

### 四、脚本执行相关

- **`exec`：用新命令替换当前进程**

  - `exec` 会让当前 **Shell** 进程直接变成后面的命令，后面的命令结束后，不会再回到原来的脚本继续执行

  ```bash
  exec node server.js
  ```

  ```bash
  # 在容器入口脚本中启动主进程
  #!/usr/bin/env bash
  set -e

  echo "start server"
  exec node server.js

  # 让 node server.js 成为主进程，其执行完成后不会回到这个脚本继续执行了
  ```

- **`source` / `.`：在当前 Shell 中执行脚本**

  - `source` 把另一个脚本的内容拿到当前 **Shell** 里执行

  ```bash
  source .env
  # 或者简写
  . .env
  ```

  - 它和直接执行脚本的区别在于：`source` 里的变量、函数、目录切换会影响当前 **Shell**


  ```bash
  # env.sh
  export NODE_ENV=production
  cd /tmp

  # 当前脚本

  # 直接执行脚本
  bash env.sh
  echo "$NODE_ENV"
  pwd
  # 当前终端拿不到 NODE_ENV，目录也不会变成 /tmp

  # 使用 source 执行脚本
  source env.sh
  echo "$NODE_ENV"
  pwd
  # 当前终端就能拿到 NODE_ENV=production，当前目录也会变成 /tmp
  ```

- **`export`：把变量传给子进程**

  - 普通变量只在当前 **Shell** 中可见，`export` 会把变量放进环境变量，让后续启动的命令也能读取


  ```bash
  export NODE_ENV=production
  npm run build

  # 如果不使用 export，npm run build 这个子进程不一定能读取到 NODE_ENV
  ```

- **`set`：控制脚本执行策略**

  - `set` 常用于打开更严格的脚本执行模式

  ```bash
  set -euo pipefail
  ```

  - 常见参数：


  | 参数 | 语义 | 常见场景 |
  | --- | --- | --- |
  | `set -e` | 命令失败时立即退出脚本 | 部署、构建、初始化脚本 |
  | `set -u` | 引用未定义变量时立即退出 | 避免变量拼错后继续执行 |
  | `set -x` | 执行命令前打印命令本身 | 排查脚本执行过程 |
  | `set -o pipefail` | 管道中任意命令失败，整体视为失败 | 避免只看最后一个命令的退出码 |

- **`exit`：主动结束脚本**

  - `exit` 用于主动结束脚本，并返回退出码

  ```bash
  if [ -z "$NODE_ENV" ]; then
    echo "NODE_ENV is required"
    exit 1
  fi
  ```

  - 常见约定：

    - `exit 0`：成功退出

    - `exit 1` 或其他非 `0` 值：失败退出

### 五、文件夹相关

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

### 六、文件相关

- **查找文件：**

  - `find` 命令：用于在文件系统中查找文件或目录

    ```bash
    # 语法
    find 起始目录] [查找条件] [操作]

    # 起始目录：指定查找的起始路径，可以是绝对路径或相对路径，通常是 `.`（当前目录）或 `/`（根目录）
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

### 七、查看端口进程

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
