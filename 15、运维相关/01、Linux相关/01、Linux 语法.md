## Linux 语法

### 一、变量定义与引用

- **变量定义：**

  - **语法:**

    ```bash
    variable_name=value
    ```

    - **变量名**：由字母、数字和下划线组成，通常以字母开头,变量名区分大小写

    - **等号**：`=` 用于赋值，中间**不能有空格**

    - **变量值**：可以是字符串、数字等

  - **示例**：

    ```bash
    branch="main"
    packageRootPath='/root/xxx'
    ```

- **变量引用：**

  - 在引用变量时使用 `$` 符号，语法如下：

    ```bash
    $variable_name
    ```

    或者在双引号内引用，避免变量被误认为普通文本：

    ```bash
    "$variable_name"
    ```

    **注意**：如果变量是空的或未定义，引用它时不会报错，而是会输出空字符串

  - **示例**：

    ```bash
    echo $branch       # 输出 "main"
    echo "$packageRootPath"  # 输出 '/root/xxx'
    ```

- **常见扩展：**

  - 变量拼接：可以将变量与字符串拼接

    ```bash
    filename="${packageRootPath}/file.txt"
    ```

  - 命令替换：将命令的输出赋值给变量

    ```bash
    today=$(date +%Y%m%d)
    ```

  - 默认值：使用 `${variable:-default}`，当 `variable` 未定义时，返回 `default` 值

    ```bash
    echo "${undefined_var:-'default_value'}" # 输出 "default_value"
    ```

### 二、管道与重定向语法

**Shell** 脚本里经常会把多个命令串起来执行，或者把命令输出写入文件，这类语法主要分为两类：

- **管道**：把前一个命令的标准输出，交给后一个命令继续处理
- **重定向**：改变命令输入、输出、错误输出的默认位置

#### 1、管道符 `|`

管道符 `|` 用于连接两个命令，左侧命令的输出会成为右侧命令的输入

```bash
ps aux | grep nginx
```

执行流程可以理解为：

```bash
# 1. ps aux 输出所有进程
# 2. grep nginx 从这些输出里筛选包含 nginx 的行
```

常见用法：

```bash
# 查看日志中包含 error 的行
cat app.log | grep error

# 统计当前目录下文件数量
ls | wc -l

# 查看端口占用
lsof -i :3000 | grep LISTEN
```

管道适合处理“上一个命令输出很多内容，下一个命令继续筛选、统计、排序”的场景

#### 2、输出重定向 `>` 与 `>>`

`>` 会把命令的标准输出写入文件，如果文件已存在，会覆盖原内容

```bash
echo "hello" > output.txt
```

`>>` 会把命令的标准输出追加到文件末尾，不会覆盖原内容

```bash
echo "new line" >> output.txt
```

常见用法：

```bash
# 覆盖写入构建结果
npm run build > build.log

# 追加写入脚本运行日志
echo "$(date) deploy start" >> deploy.log
```

需要注意：`>` 覆盖文件是高风险操作，写日志通常优先使用 `>>`

#### 3、输入重定向 `<`

`<` 用于让命令从文件读取输入，而不是从键盘输入

```bash
wc -l < app.log
```

这里的含义是：把 `app.log` 的内容交给 `wc -l` 统计行数

#### 4、错误输出重定向 `2>` 与 `2>&1`

**Shell** 中常见的输出通道有三个：

- `0`：标准输入，通常来自键盘或文件
- `1`：标准输出，通常是命令正常输出
- `2`：标准错误，通常是报错信息

`2>` 用于把错误输出写入文件

```bash
npm run build 2> error.log
```

`2>&1` 表示把错误输出合并到标准输出

```bash
npm run build > build.log 2>&1
```

这条命令的含义是：

```bash
# 1. 正常输出写入 build.log
# 2. 错误输出也写入 build.log
```

脚本里经常用它把完整执行日志收集到同一个文件中

#### 5、同时输出到屏幕和文件：`tee`

`tee` 会把输入同时输出到屏幕和文件

```bash
npm run build | tee build.log
```

如果要追加写入文件，使用 `tee -a`

```bash
npm run build | tee -a build.log
```

这种写法适合既要实时观察命令输出，又要保留日志文件的场景

#### 6、组合示例

```bash
# 从日志中筛选 error，追加写入 error.log
cat app.log | grep error >> error.log

# 执行构建，并把正常输出和错误输出都保存到 build.log
npm run build > build.log 2>&1

# 查看构建日志里的失败信息，同时保留筛选结果
cat build.log | grep -i fail | tee failed-lines.log
```

### 三、条件判断语法

条件判断用于检查文件属性、字符串比较、数值比较等

- **基本语法：**

  - 条件判断语法格式：

  ```bash
  if [ condition ]; then
      # 条件为真时执行的语句
  else
      # 条件为假时执行的语句
  fi

  # if [ condition ]：用于条件判断，方括号内的 condition 表示条件表达式，if 语句在该条件成立时执行 then 后的命令
  # then：表示条件成立时执行的部分。
  # else：条件不成立时执行的部分。
  # fi：表示 if 语句的结束（与 if 配对）
  ```

- **常见的条件判断运算符：**

  - **文件相关**：
    - `-e filename`：判断文件或目录是否存在
    - `-d filename`：判断是否为目录
    - `-f filename`：判断是否为文件
    - `-r filename`：判断文件是否可读
    - `-w filename`：判断文件是否可写
    - `-x filename`：判断文件是否可执行
  - **字符串相关**：
    - `-z string`：判断字符串是否为空
    - `-n string`：判断字符串是否非空
    - `string1 = string2`：判断字符串是否相等
    - `string1 != string2`：判断字符串是否不等

  - **数值相关**：
    - `num1 -eq num2`：判断 num1 是否等于 num2
    - `num1 -ne num2`：判断 num1 是否不等于 num2
    - `num1 -lt num2`：判断 num1 是否小于 num2
    - `num1 -gt num2`：判断 num1 是否大于 num2
    - `num1 -le num2`：判断 num1 是否小于等于 num2
    - `num1 -ge num2`：判断 num1 是否大于等于 num2

  - **示例**：

    ```bash
    if [ -f "/path/to/file" ]; then
        echo "File exists."
    else
        echo "File does not exist."
    fi
    ```

- **使用双括号包裹条件表达式：**

  - 双中括号 `[[ ... ]]` 是 **Bash** 中更强大的条件判断语法，相较单中括号 `[ ... ]`，支持更多复杂判断和字符串匹配
    - **模式匹配**：支持 `==` 或 `!=` 来进行模式匹配
      - 例如：`[[ "$name" == user* ]]` 可以匹配 `user123` 这样的字符串
        - `*` 匹配任意字符
        - `?` 匹配单个字符
    - **逻辑操作**：可以使用 `&&` 和 `||` 进行逻辑运算
      - 例如：`[[ -n "$var1" && -z "$var2" ]]`
