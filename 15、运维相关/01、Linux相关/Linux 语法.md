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

### 二、条件判断语法

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