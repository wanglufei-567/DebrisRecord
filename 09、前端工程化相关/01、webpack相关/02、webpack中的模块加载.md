## webpack笔记（二）— webpack中的模块加载

### 一、前言

回顾下**webpack**的官网定义：

> 本质上，**==webpack==** 是一个现代 JavaScript 应用程序的==静态模块打包器==(`module bundler`)。当 **webpack** 处理应用程序时，它会递归地构建一个依赖关系图`(dependency graph`)，其中包含应用程序需要的每个模块，然后将所有这些模块打包成一个或多个 `bundle`

**Webpack**认为一切都是**模块**，JS文件、CSS文件、jpg/png图片等等都是**==模块==**，这里先讨论如何将一个个**==JS模块==**打包成一个`bundle` <!-- bundle是一个单独的js文件-->；

目前JS文件有两种主流的模块规范：**CommonJS**和**ESModule**

<!--所谓的模块规范就是一种如何创建、导出和导入模块的标准范式-->

1. **CommonJS规范**

**CommonJS规范**是目前**Node**中采用的一种模块规范。**CommonJS**模块是**==同步加载的==**，它使用`require()`函数来导入模块，使用`module.exports`来导出模块。

例如，一**个CommonJS**模块可以使用以下语法导出模块：

```js
// math.js
const add = (a, b) => {
  return a + b;
}
module.exports = add;
```

在另一个文件中使用`require()`函数导入`math.js`模块：

```js
// app.js
const add = require('./math.js');
console.log(add(1, 2)); // 3
```

1. **ESModule规范**

**ESModule**是**ECMAScript6**中新增的一种模块规范。**ESModule**模块是**==异步加载的==**，它使用`import`语句来导入模块，使用`export`语句来导出模块。

例如，一个**ESModule**模块可以使用以下语法导出模块：

```js
// math.js
export const add = (a, b) => {
  return a + b;
}
```

在另一个文件中使用`import`语句导入`math.js`模块：

```js
// app.js
import { add } from './math.js';
console.log(add(1, 2)); // 3
```

webpack可以将采用不同模块规范的JS文件打包成一个bundle，而且支持采用commonJS规范的JS文件和ESModule规范的JS文件之间混合依赖，结下来看下webpack是如何处理这采用两种模块规范的JS文件

### 二、模块规范的兼容

先准备好环境

**安装模块**

```js
cnpm i webpack webpack-cli html-webpack-plugin -D
```

**创建脚本命令：**`package.json`

```json
  "scripts": {
    "build": "webpack"
  }
```

**创建html模版文件：**`src\index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>webpack</title>
  </head>
  <body></body>
</html>
```

**创建webpack配置文件：**`webpack.config.js`

```js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js",
  },
  module: {},
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "index.html",
    }),
  ],
};
```

#### 2.1、commonJS文件加载commonJS文件

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

运行打包命令

```shell
npm run build
```

看下打包后的文件`main.js`

```js
(() => {
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
  (() => {
    let title = __webpack_require__('./src/title.js');
    console.log(title);
  })();
})();

```

`main.js`中的这些`(() => {})()`自执行语句是为了防止命名冲突，可以直接去掉不管，看下精简之后的打包文件👇

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

- 检查模块缓存`cachedModule`中是否有当前模块`moduleId`，若有则直接返回缓存
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

#### 2.2、commonJS文件加载ES6 modules文件

主入口文件`src\index.js`采用`require()`函数导入一个使用`export`语句完成导出的模块`src\title.js`

`index.js`

```js
let title = require("./title");
console.log(title);
console.log(title.age);
```

`title.js`

```js
export default "title_name";
export const age = "title_age";
```

打包后的文件`main.js`

```js
var __webpack_modules__ = {
  /**
   * @description
   * 和commonJS模块一样，ESModule模块被封装成了函数
   * 和commonJS模块不同的是，ESModule模块中通过__webpack_require__.d方法
   * 给module.exports对象上定义了属性的getter访问器
   * 所以使用ESModule模块中的属性是通过getter访问器进行取值的
   *
   * 基于这方面的不同，所以有这种说法：
   * commonJS导出的是值
   * ESModule导出的是引用
   */
  './src/title.js': (
    __unused_webpack_module,
    __webpack_exports__,
    __webpack_require__
  ) => {
    'use strict';
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      // 这里就是getter访问器
      age: () => age,
      default: () => __WEBPACK_DEFAULT_EXPORT__
    });
    const __WEBPACK_DEFAULT_EXPORT__ = 'title_name';
    const age = 'title_age';
  }
};

/**
 * @description commonJS中引入的模块缓存
 */
var __webpack_module_cache__ = {};

/**
 * @description require方法的实现
 * commonJS中的require方法
 */
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

/**
 * @description 给模块的导出对象定义属性,
 * 并给属性定义一个getter
 */
__webpack_require__.d = (exports, definition) => {
  for (var key in definition) {
    if (
      __webpack_require__.o(definition, key) &&
      !__webpack_require__.o(exports, key)
    ) {
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: definition[key]
      });
    }
  }
};

__webpack_require__.o = (obj, prop) =>

/**
 * @description r方法是用来给exports对象上添加两个自定义属性
 * 一般用来标识这个模块在编译前时ESModule
 */
__webpack_require__.r = exports => {
  /**
   * 为什么要定义Symbol.toStringTag和_ESModule属性?
   * 不同来源的模块取值方法是不一样的
   * 给exports设置Symbol.toStringTag属性为Module后
   * Object.prototype.toString.call(exports))的结果为[object Module]
   */
  if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    Object.defineProperty(exports, Symbol.toStringTag, {
      value: 'Module'
    });
  }
  Object.defineProperty(exports, '__esModule', {
    value: true
  });
};

var __webpack_exports__ = {};

/**
 * commonJS文件中的内容
 */
let title = __webpack_require__('./src/title.js');
console.log(title);
console.log(title.age);
```

`commonJS`文件加载`ES6 modules`文件整体和`commonJS`文件加载`commonJS`文件一致，都是通过实现`require`方法完成模块的引入

不同的是`ES6 modules`模块中`module.exports`对象上的属性定义了==`getter`访问器==，后续使用相关属性时，是通过`getter`访问器获取到我们导出的值，而`commoJS`模块中`module.exports`对象上的属性直接就是我们导出的值

所以说==`commonJS`导出的是值，`ESModule`导出的是引用==

#### 2.3、ES6 modules文件 加载 ES6 modules 文件

主入口文件`src\index.js`采用`import`语句导入一个使用`export`语句完成导出的模块`src\title.js`

`index.js`

```js
import name, { age } from "./title";
console.log(name);
console.log(age);
```

`title.js`

```js
export default name = "title_name";
export const age = "title_age";
```

打包后的文件`main.js`

```js
var __webpack_modules__ = {
  /**
   * @description
   * 和commonJS模块一样，ESModule模块被封装成了函数
   * 和commonJS模块不同的是，ESModule模块中通过__webpack_require__.d方法
   * 给module.exports对象上定义了属性的getter访问器
   * 所以使用ESModule模块中的属性是通过getter访问器进行取值的
   */
  './src/title.js': (
    __unused_webpack_module,
    __webpack_exports__,
    __webpack_require__
  ) => {
    __webpack_require__.r(__webpack_exports__);
    __webpack_require__.d(__webpack_exports__, {
      age: () => age,
      default: () => __WEBPACK_DEFAULT_EXPORT__
    });
    const __WEBPACK_DEFAULT_EXPORT__ = (name = 'title_name');
    const age = 'title_age';
  }
};

var __webpack_module_cache__ = {};

/**
 * @description require方法
 */
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

/**
 * @description 给模块的导出对象定义属性,
 * 并给属性定义一个getter
 */
__webpack_require__.d = (exports, definition) => {
  for (var key in definition) {
    if (
      __webpack_require__.o(definition, key) &&
      !__webpack_require__.o(exports, key)
    ) {
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: definition[key]
      });
    }
  }
};

/**
 * @description 校验对象上是否有指定属性
 */
__webpack_require__.o = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

/**
 * @description r方法是用来给exports对象上添加两个自定义属性
 * 一般用来标识这个模块在编译前时ESModule
 */
__webpack_require__.r = exports => {
  if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    Object.defineProperty(exports, Symbol.toStringTag, {
      value: 'Module'
    });
  }
  Object.defineProperty(exports, '__esModule', {
    value: true
  });
};

var __webpack_exports__ = {};

__webpack_require__.r(__webpack_exports__);

/**
 * 创建一个变量用于存储模块导出的值
 * 后面再使用模块导出的值时，都是从该变量上取值
 */
var _title__WEBPACK_IMPORTED_MODULE_0__ =
  __webpack_require__('./src/title.js');
console.log(_title__WEBPACK_IMPORTED_MODULE_0__['default']);
console.log(_title__WEBPACK_IMPORTED_MODULE_0__.age);

```

`ES6 modules`文件加载`ES6 modules`文件和`commonJS`文件加载`ES6 modules`文件简直一摸一样，不同的点就是将导出的值存在了一个内部变量上，使用导出的值的地方都给转译成了内部变量的属性取值

可以发现，`ESModule`规范同样也是==将每个模块都封装成一个函数==

- 函数入参是一个带有`exports`属性的`module`对象
- 函数体就是模块内容，在函数内部也就是模块内部完成对`module.exports`上属性的定义，这里和`commonJS`规范不同的是，`ESModule`没有直接进行赋值，而是==通过`d`方法给`module.exports`上属性创建了getter访问器==
- 最终返回值便是`module.exports`

#### 2.4、ES6 modules文件 加载commonJS 文件

主入口文件`src\index.js`采用`import`语句导入一个使用`module.exports`完成导出的模块`src\title.js`

`index.js`

```js
import name, { age } from "./title";
console.log(name);
console.log(age);
```

`title.js`

```js
module.exports = {
  name: "title_name",
  age: "title_age",
};
```

打包后的文件`main.js`

```js
var __webpack_modules__ = {
  './src/title.js': module => {
    module.exports = {
      name: 'title_name',
      age: 'title_age'
    };
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

/**
 * @description 返回一个获取默认导出的函数
 * 这里判断了module对象上是否有__esModule属性
 * 若有则说明引入的是ESModule模块，那么便返回module['default']作为default值
 * 若没有则说明引入的是CommonJS模块，那么便返回module本身作为default值
 */
__webpack_require__.n = module => {
  var getter =
    module && module.__esModule
      ? () => module['default']
      : () => module;
  __webpack_require__.d(getter, {
    a: getter
  });
  return getter;
};

__webpack_require__.d = (exports, definition) => {
  for (var key in definition) {
    if (
      __webpack_require__.o(definition, key) &&
      !__webpack_require__.o(exports, key)
    ) {
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: definition[key]
      });
    }
  }
};

__webpack_require__.o = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

__webpack_require__.r = exports => {
  if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    Object.defineProperty(exports, Symbol.toStringTag, {
      value: 'Module'
    });
  }
  Object.defineProperty(exports, '__esModule', {
    value: true
  });
};

var __webpack_exports__ = {};

__webpack_require__.r(__webpack_exports__);

var _title__WEBPACK_IMPORTED_MODULE_0__ =
  __webpack_require__('./src/title.js');

/**
 * 默认导出default是个函数
 * 为什么是个函数？是为了兼容引入的模块同时有commonJS模块和ESModule模块的情况
 * 若是commonJS模块则直接返回module
 * 若是ESModule模块则返回module['default']
 */
var _title__WEBPACK_IMPORTED_MODULE_0___default =
  __webpack_require__.n(_title__WEBPACK_IMPORTED_MODULE_0__);

console.log(_title__WEBPACK_IMPORTED_MODULE_0___default());
console.log(_title__WEBPACK_IMPORTED_MODULE_0__.age);
```

`ES6 modules`文件加载`commonJS`文件和`ES6 modules`文件加载`ES6 modules`文件基本一致，只不过为了兼容引入的模块同时有`commonJS`模块和`ESModule`模块的情况，对默认值default的取值做了处理

#### 2.5、异步加载

异步加载是指使用`import`语句创建一个`promise`对象，在模块请求回来之后在进行相关逻辑处理，

和同步加载不同的是，同步加载是直接将所有的模块打包成一个JS文件，这样浏览器只需请求一个JS文件即可

而异步加载则是将被引入的文件单独打包成另一个JS文件，浏览器需要多请求一次获取这个文件，是通过JSONP来实现的再次请求

`src\index.js`

```js
import(/* webpackChunkName: "hello" */ "./hello").then((result) => {
    console.log(result.default);
});
```

`src\hello.js`

```js
export default 'hello';
```

`dist\main.js`

```js
//定义一个模块定义的对象
var modules = ({});
//存放已经加载的模块的缓存
var cache = {};

//在浏览器里实现require方法
function require(moduleId) {
  var cachedModule = cache[moduleId];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }
  var module = cache[moduleId] = {
    exports: {}
  };
  modules[moduleId](module, module.exports, require);
  return module.exports;
}

require.d = (exports, definition) => {
  for (var key in definition) {
    Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
  }
};

require.r = (exports) => {
  Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
  Object.defineProperty(exports, '__esModule', { value: true });
};

//存放加载的代码块的状态
//key是代码块的名字
//0表示已经加载完成了
var installedChunks = {
  "main": 0,
  //'hello': [resolve, reject,promise]
};

/**
 * 
 * @param {*} chunkIds 代码块ID数组
 * @param {*} moreModules 额外的模块定义
 */
function webpackJsonpCallback([chunkIds, moreModules]) {
  const resolves = [];
  for (let i = 0; i < chunkIds.length; i++) {
    const chunkId = chunkIds[i];
    resolves.push(installedChunks[chunkId][0]);
    installedChunks[chunkId] = 0;//表示此代码块已经下载完毕
  }
  //合并模块定义到modules去
  for (const moduleId in moreModules) {
    modules[moduleId] = moreModules[moduleId];
  }
  //依次取出resolve方法并执行
  while (resolves.length) {
    resolves.shift()();
  }
}

//给require方法定义一个m属性，指向模块定义对象
require.m = modules;
require.f = {};
//返回此文件对应的访问路径 
require.p = '';
//返回此代码块对应的文件名
require.u = function (chunkId) {
  return chunkId+'.main.js'
}

// 创建一个script标签，请求异步加载de
require.l = function (url) {
  let script = document.createElement('script');
  script.src = url;
  document.head.appendChild(script);
}

/**
 * 通过JSONP异步加载一个chunkId对应的代码块文件，其实就是hello.main.js
 * 会返回一个Promise
 * @param {*} chunkId 代码块ID
 * @param {*} promises promise数组
 */
require.f.j = function (chunkId, promises) {
  //当前的代码块的数据
  let installedChunkData;
  //创建一个promise
  const promise = new Promise((resolve, reject) => {
    installedChunkData = installedChunks[chunkId] = [resolve, reject];
  });
  installedChunkData[2] = promise;
  promises.push(promise);
  //promises.push(installedChunkData[2] = promise);
  const url = require.p + require.u(chunkId);
  require.l(url);
}

require.e = function (chunkId) {
  let promises = [];
  require.f.j(chunkId,promises);
  return Promise.all(promises);
}

// 定义一个全局变量，并修改其push方法，这样异步文件加载完成后可以直接使用全局变量上的push方法
var chunkLoadingGlobal = window['webpack5'] = [];
chunkLoadingGlobal.push = webpackJsonpCallback;
/**
 * require.e异步加载hello代码块文件 hello.main.js
 * promise成功后会把 hello.main.js里面的代码定义合并到require.m对象上，也就是modules上
 * 调用require方法加载./src/hello.js模块，获取 模块的导出对象，进行打印
 */
require.e('hello')
  .then(require.bind(require, './src/hello.js'))
  .then(result => { console.log(result) });
```

`hello.main.js`

```js
// 自执行函数，浏览器请求回来此文件后，直接就执行了，
// 调用了全局变量window["webpack5"]上的push方法，完成了模块的合并
(window["webpack5"] = window["webpack5"] || []).push([["hello"], {
  "./src/hello.js":
    ((module, exports, __webpack_require__) => {
      "use strict";
      __webpack_require__.renderEsModule(exports);
      __webpack_require__.defineProperties(exports, {
        "default": () => DEFAULT_EXPORT
      });
      const DEFAULT_EXPORT = ('hello');
    })
}]);
```

异步加载的原理

- 首先，主文件中会定义一个全局变量`window["webpack5"]`，并修改其`push`方法为`webpackJsonpCallback`
  - `webpackJsonpCallback`方法会将异步模块合并到主文件的`module`对象上
- 然后，在在主文件中异步加载逻辑的位置，利用JSONP原理(创建`script`标签)去请求异步模块
- 最后，异步模块请求回来之后，异步模块自执行一段逻辑，调用全局变量`window["webpack5"]`上的`webpackJsonpCallback`方法，完成模块的合并并标识此异步模块已经加载完成

