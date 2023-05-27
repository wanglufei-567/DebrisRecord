## CommonJS相关

### 一、基本使用

导出文件

```js
// 通过module.exports 导出
module.exports = {
    a:"我是a的值",
    b(){
        console.log("我是导出的b函数");
    }
}

// 或者通过exports来导出
// exports是module.exports的引用
exports.fn = function(){
    console.log("我是fn函数");  
}
```

引入文件

```js
// 通过require来引入
require("./aModule"); //注意一定要有"./"，文件后缀可加可不加

// 通过变量接收引入的内容
let mymodule = require("bModule");
console.log(mymodule.a);
mymodule.b();


// require("bModule")方法执行的结果就是module.exports的值
let myfn = require("bModule").fn;
myfn();
// 或者 通过解构赋值 
let { fn } = require("bModule");
fn();
```

### 二、CommonJS的原理

主入口文件`src\index.js`采用`require()`函数导入一个使用`module.exports`完成导出的模块`src\title.js`

`src\index.js`

```js
let title = require("./title.js");
console.log(title);
```

`src\title.js`

```js
const name = 'title'
const inform = 'just a title'
module.exports = name + inform;
```

打包之后的文件👇

```js
var __webpack_modules__ = {
  './src/title.js': module => {
    const name = 'title';
    const inform = 'just a title';
    module.exports = name + inform;
  }
};

var __webpack_module_cache__ = {};

function __webpack_require__(moduleId) {
  var cachedModule = __webpack_module_cache__[moduleId];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }
  var module = (__webpack_module_cache__[moduleId] = {
    exports: {}
  });
  __webpack_modules__[moduleId](
    module,
    module.exports,
    __webpack_require__
  );
  return module.exports;
}

var __webpack_exports__ = {};

let title = __webpack_require__('./src/title.js');
console.log(title);
```

结下来分析下打包后的文件

首先看这段内容

```js
let title = __webpack_require__('./src/title.js');
console.log(title);
```

这段内容对应的是主入口文件`src\index.js`中书写的逻辑

```js
let title = require("./title.js");
console.log(title);
```

只是替换了下`require`的名字，调用 `__webpack_require__()`函数完成模块的导入，其中`"./title.js"`是导入文件的路径，这里作为 `__webpack_require__()`函数的入参，也就是`moduleId`

所以具体的导入逻辑是在 `__webpack_require__`

------

接下来看下`__webpack_require__`的实现

```js
var __webpack_module_cache__ = {};

function __webpack_require__(moduleId) {
  var cachedModule = __webpack_module_cache__[moduleId];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }
  var module = (__webpack_module_cache__[moduleId] = {
    exports: {}
  });
  __webpack_modules__[moduleId](
    module,
    module.exports,
    __webpack_require__
  );
  return module.exports;
}
```

其中

```js
var cachedModule = __webpack_module_cache__[moduleId];
if (cachedModule !== undefined) {
  return cachedModule.exports;
}
var module = (__webpack_module_cache__[moduleId] = {
  exports: {}
});
```

这段逻辑的中做了两件事

- 检查==模块缓存==`cachedModule`中是否有当前模块`moduleId`，若有则直接返回缓存

  > 通过`delete require.cache[__filename]`可以清除缓存中的相应的模块数据
  >
  > 其中`__filename`是全局变量，表示当前模块的文件名

- 若无，则新建一个`module`对象并放入缓存中

再看这段逻辑

```js
__webpack_modules__[moduleId](
  module,
  module.exports,
  __webpack_require__
);
return module.exports;
```

通过`moduleId`找到`__webpack_modules__`对象中对应的模块方法并执行，得到对应模块方法的返回值并返回出去

其中三个入参分别为：

- `module`：模块对象，缓存`cachedModule`中存放的便是此对象
- `module.exports`：模块对象的`exports`的属性，也就是最终返回值，同时也是模块的导出值
- `__webpack_require__`： `require`方法，因为可能存在模块嵌套引入，所以这里将`require`方法传入

> 其实require方法共接收5个参数：
>
> - exports
> - require
> - module
> - ___filename：当前文件所属目录的绝对路径
> - ___dirname：当前文件的绝对路径，包含当前文件

------

最后看下`__webpack_modules__`对象

```js
var __webpack_modules__ = {
  './src/title.js': module => {
    const name = 'title';
    const inform = 'just a title';
    module.exports = name + inform;
  }
};
```

可以发现此对象是以模块的文件路径作为属性名，也就是`moduleId`，属性值是一个函数，函数内容正是对应模块的的内容

`src\title.js`

```js
const name = 'title'
const inform = 'just a title'
module.exports = name + inform;
```

可以发现，`commonJS`规范==中将每个模块都封装成一个函数==

- 函数入参是一个带有`exports`属性的`module`对象
- 函数体就是模块内容，在函数内部也就是模块内部完成对`module.exports`的赋值，
- 最终返回值便是`module.exports`



### 参考文章

[nodejs你不知道的___dirname和__filename](https://juejin.cn/post/7036744678749765640)

[path 中方法使用及 __dirname 和 __filename](https://juejin.cn/post/7029572975238053919)

