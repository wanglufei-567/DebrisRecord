## path模块相关

### 一、常见API使用

#### 1.1、`__dirname`与 `__filename`

- `__dirname`  用来动态获取==**当前文件**所属目录的绝对路径== 
- `__filename` 用来动态获取==**当前文件**的绝对路径==，包含当前文件
  - `__dirname` 和 `__filename` 与**命令行**在什么文件路径下执行脚本无关

#### 1.2、path.join()

`path.join()` 方法是将多个参数字符串**==合并==**成一个路径字符串

```js
// 当前的文件路径为: E:\前端相关\demo_js
const path = require('path')

console.log(path.join(__dirname, 'a', 'b', 'demo.js')) // E:\前端相关\demo_js\test\a\b\demo.js

// 路径开头的 / 不会影响拼接，.. 即（cd ..）代表上一级文件
console.log(path.join(__dirname, '/a', '/b', '..')) // E:\前端相关\demo_js\test\a

// path.join() 会做路径字符串的校验，不合法时会抛错: The "path" argument must be of type string. Received an instance of Object
console.log(path.join(__dirname, '/a', {}, '/b'))
```

#### 1.3、path.resolve()

`path.resolve` 方法用于将路径片段解析为**绝对路径**

它会从右到左依次处理传入的路径片段，直到构造出一个绝对路径为止，如果没有传入绝对路径片段，则会将当前工作目录作为起点

<!--将当前工作目录作为起点的意思是，命令行在哪个路径下执行的脚本，这个路径就是起点，后面的路径片段会跟在这个起点后面，也就是说目录的起点和脚本文件自己本身的路径无关，而是和在哪个路径下执行的脚本有关-->

具体来说，`path.resolve` 做了以下几件事：

1. **处理相对路径**：如果路径片段是相对路径（例如 `./folder` 或 `../folder`），`path.resolve` 会将其解析为相对于当前工作目录的绝对路径
2. **处理绝对路径**：如果路径片段中存在绝对路径（例如 `/folder`），`path.resolve` 会直接从这个绝对路径开始，忽略之前的所有片段
3. **返回绝对路径**：最终结果是一个标准化的绝对路径，其中包含了所有的路径解析和整合

```js
const path = require('path');

// 示例 1: 从当前工作目录解析相对路径
const absolutePath1 = path.resolve('folder', 'file.txt');
console.log(absolutePath1);
// 输出类似: /Users/username/project/folder/file.txt

// 示例 2: 从绝对路径开始解析
const absolutePath2 = path.resolve('/folder', 'subfolder', 'file.txt');
console.log(absolutePath2);
// 输出: /folder/subfolder/file.txt

// 示例 3: 使用 ".." 和 "." 来进行路径导航
const absolutePath3 = path.resolve('/folder', './subfolder', '../file.txt');
console.log(absolutePath3);
// 输出: /folder/file.txt

// 示例 4: 如果没有传入路径片段，则返回当前工作目录的绝对路径
const absolutePath4 = path.resolve();
console.log(absolutePath4);
// 输出: 当前工作目录的绝对路径
```

