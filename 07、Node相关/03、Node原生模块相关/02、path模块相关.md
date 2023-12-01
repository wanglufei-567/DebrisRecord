## path模块相关

### 一、常见API使用

#### 1.1、`__dirname`与 `__filename`

- `__dirname`  用来动态获取==**当前文件**所属目录的绝对路径== 
- `__filename` 用来动态获取==**当前文件**的绝对路径==，包含当前文件
  - `__dirname` 和 `__filename` 是==不受命令行中执行Node脚本时所属路径影响==

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

`path.resolve()` 方法是以程序为根目录，作为起点，根据参数解析出一个==绝对路径==

 以应用程序为根目录，普通字符串代表子目录，/ 代表绝对路径根目录

```js
// 当前执行的 js 文件路径为: E:\前端相关\demo_js\test\31.path.js
const path = require('path')

// 得到应用程序启动文件的目录（得到当前执行文件绝对路径）
console.log(path.resolve()) // E:\前端相关\demo_js\test

// 解释: / 斜杠代表根目录，一般拼接的时候需要小心点使用 / 斜杠
console.log(path.resolve('a', '/b')) // E:\b

// 这个就是将文件路径拼接，并不管这个路径是否真实存在
console.log(path.resolve(__dirname, 'a/b')) // E:\前端相关\demo_js\test\a\b

// 这个是用当前应用程序启动文件绝对路径与后面的所有字符串拼接，因为最开始的字符串不是以 / 开头的，.. 也是代表上一级目录
console.log(path.resolve('wwwroot', 'static_files/png/', '../gif/image.gif')) 
// E:\前端相关\demo_js\test\wwwroot\static_files\gif\image.gif
```

