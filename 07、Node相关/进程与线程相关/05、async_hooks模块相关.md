

## Node 进程与线程笔记（五）async_hooks模块

### 一、async_hooks模块简介

`async_hooks`是 Node.js v8.x 版本新增加的一个核心模块，它提供了 API **==用来追踪 Node.js 中异步资源的生命周期==**，可帮助我们正确追踪异步调用的处理逻辑及关系；`async_hooks`属于内置模块，可以直接使用：

```js
let asycnHooks = require('async_hooks');
```

之所以会引入 `async_hooks` 模块，是因为==**在异步调用中我们很难正确的追踪异步调用的处理逻辑及关系**==。而 `async_hooks` 模块友好的解决了上述问题

<!--简单理解就是，顾名思义，异步钩子-->

`async_hooks` 主要提供以下功能和特性：

- 每一个函数(不论异步还是同步)都会提供一个**上下文**， 称之为 `async scope` ，这个认知对理解 `async_hooks` 非常重要；
- 每一个 `async scope` 中都有一个 `asyncId`, 是当前 `async scope` 的标志，同一个的 `async scope` 中 `asyncId` 必然相同，最外层的 `asyncId` 是 `1`，每个异步资源在创建时 `asyncId` 全量递增的；
- 每一个 `async scope` 中都有一个 `triggerAsyncId` 表示当前函数是由那个 `async scope` 触发生成的；
- 通过 `asyncId` 和 `triggerAsyncId` 可以很方便的追踪整个异步的调用关系及链路；
- 可以通过 `async_hooks.createHook` 函数来注册关于每个异步资源在生命周期中发生的 `init/before/after/destory/promiseResolve` 等相关事件的监听函数；
- 同一个 `async scope` 可能会被调用及执行多次，不管执行多少次，其 `asyncId` 必然相同，通过监听函数，可以很方便追踪其执行的次数及时间及上线文关系；

### 二、异步资源与`AsyncResource` 类

要理解异步钩子，须得理解**==异步资源==**这个概念，先看下官网的定义

> An asynchronous resource represents an object with an associated callback. This callback may be called multiple times, such as the `'connection'` event in `net.createServer()`, or just a single time like in `fs.open()`. A resource can also be closed before the callback is called. `AsyncHook` does not explicitly distinguish between these different cases but will represent them as the abstract concept that is a resource.

<!--官网的定义很简单，带有相关回调的对象就是异步资源，这概念玩的很让人费解-->

官网的定义看的人云里雾里的，看个熟悉的例子👇应该就能理解了：

```js
const res = setTimeout(() => {}, 1000);
console.log(res);
```

打印结果

```shell
Timeout {
  _idleTimeout: 1000,
  _idlePrev: [TimersList],
  _idleNext: [TimersList],
  _idleStart: 28,
  _onTimeout: [Function (anonymous)],
  _timerArgs: undefined,
  _repeat: null,
  _destroyed: false,
  [Symbol(refed)]: true,
  [Symbol(kHasPrimitive)]: false,
  [Symbol(asyncId)]: 2,
  [Symbol(triggerId)]: 1
}
```

👆这个就是异步资源

异步资源主要用于跟踪异步操作，以便异步操作完成后，EventLoop 能够正确地执行相关回调；等到相关异步操作完成并且其回调被成功触发后，异步资源也会像其它对象一样被系统回收，比如：

```js
const res = setTimeout(() => {
  console.log(res);
}, 1000);
console.log(res);
setTimeout(() => {
  console.log(res);
}, 1000);
```

执行上面的代码，可以发现只有在 `res` 关联的异步操作完成并且其回调被成功触发后，`res` 的 `_destroyed` 才会被设置为 `true`：

```shell
Timeout {
  _destroyed: false,
}
Timeout {
  _destroyed: false,
}
Timeout {
  _destroyed: true,
}
```

除了 `Timeout` 这些 Node.js 内置的异步资源外，也可以通过 `async_hooks` 模块下的 `AsyncResource` 类来创建自己的异步资源；

**语法：**

```js
new AsyncResource(type[, options])
```

- `type`：资源类型（即名称）；
- `options`：选项设置，相关属性如下：
  - `triggerAsyncId`：创建该异步资源的异步资源上下文编号，默认取 `async_hooks.executionAsyncId()` 的值；
  - `requireManualDestroy`：
    - 值为 `false` 时，Node.js 在对资源进行垃圾回收时，会自动触发该资源所关联的 `destroy` 钩子；
    - 值为 `true` 时，Node.js 在对资源进行垃圾回收时，不会自动触发该资源所关联的 `destroy` 钩子，需要显示调用 `AsyncResource` 的 `emitDestroy` 方法来触发；
    - 默认值为 `false`

**`AsyncResource` 上的主要方法：**

- `AsyncResource.bind`：`AsyncResource` 的静态方法，把指定的 `fn` 函数**==绑定在当前所属的异步资源上下文中==**(**即在调用 `AsyncResource.bind` 时所在的异步资源上下文**）；该方法的参数如下：

  - `fn`：要绑定到当前所属的异步资源上下文中的执行函数；
  - `type`：异步资源类型，通过该属性与相关的 `AsyncResource` 进行关联，该参数为非必填参数；
  - `thisArg`：指定 `fn` 调用时 `this` 的值，该参数为非必填参数。

- `bind`：把指定的 `fn` 函数绑定在当前 `AsyncResource` **==实例所属的异步资源上下文中==**；该方法的参数如下：

  - `fn`：要绑定到当前 `AsyncResource` 实例所属的异步资源上下文中的执行函数；
  - `thisArg`：指定 `fn` 调用时 `this` 的值，该参数为非必填参数。

- `runInAsyncScope`：在当前 `AsyncResource` 实例所属的异步上下文中执行指定的 `fn` 函数；<!--这个很重要-->

  参数如下：

  - `fn`：在全新的异步资源上下文中执行的函数；
  - `thisArg`：指定 `fn` 调用时 `this` 的值，该参数为非必填参数；
  - `...args`：指定 `fn` 调用时传递给 `fn` 的参数列表，该参数为非必填参数。

- `emitDestroy`：调用 `destroy` 钩子，该方法只能被调用一次，多次调用将抛出异常；

- `asyncId`：获取分配给当前 `AsyncResource` 实例的唯一编号；

- `triggerAsyncId`：获取创建当前 `AsyncResource` 实例的异步资源上下文编号

<!--可以这样理解，AsyncResource可以用来自定义异步资源，创造的异步资源同样可以使用异步钩子-->

### 三、`AsyncHook`类

`AsyncHook`类提供了一个用于跟踪异步操作的生命周期事件的接口

```js
const async_hooks = require('async_hooks');

// 创建一个新的 AsyncHook 实例
const asyncHook = async_hooks.createHook({ init, before, after, destroy, promiseResolve });
```

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/1*gqgTMWCBGY_yk68Zi-vEqA.png)

在一个异步资源的生命周期中，主要包含以下几个钩子：

- `init`：对异步资源初始化时触发

- `promiseResolve`：

  - 对 `Promise` 对象执行 `resolve` 或 `reject` 操作时触发
  - 调用 `Promise` 对象的 `then` 或 `catch` 方法时触发，此时在触发 `promiseResolve` 的前后，会分别触发 `before` 和 `after` 钩子

  ```js
  const fs = require('fs');
  const { createHook } = require('async_hooks');
  const hook = createHook({
    promiseResolve (asyncId) {
      fs.appendFileSync('log.out', `promiseResolve ${asyncId}\n`);
    },
    before(asyncId) {
      fs.appendFileSync('log.out', `before ${asyncId}\n`);
    },
    after(asyncId) {
      fs.appendFileSync('log.out', `after ${asyncId}\n`);
    },
  });
  hook.enable();
  
  new Promise((resolve) => resolve(true)).then((a) => {});
  ```

  执行结果

  ```log
  promiseResolve 2
  before 3
  promiseResolve 3
  after 3
  ```

  通过上面的输出可知，`promiseResolve` 在 `Promise` 对象构造函数中调用 `resolve` 时及调用了 `Promise` 对象的 `then` 时各触发了一次，并且第二次同时触发了 `before` 与 `after` 钩子

- `before`：执行异步操作的回调函数之前触发

- `after`：执行异步操作的回调函数之后触发

- `destroy`：异步资源被销毁之后触发

`async_hooks` 提供了 `init`、`promiseResolve`、`before`、`after` 及 `destroy` 几个钩子，并通过 `async_hooks.createHook` 来**==创建并启用==**相关钩子：

```js
const { createHook } = require('async_hooks');

const hook = createHook({
  init(asyncId, type, triggerAsyncId, resource) {
  },
  promiseResolve(asyncId) {
  },
  before(asyncId) {
  },
  after(asyncId) {
  },
  destroy(asyncId) {
  }
});
hook.enable();
```

上述钩子的**参数**解释如下：

- `asyncId`：异步资源的唯一编号
- `type`：异步资源的类型（即名称）
- `triggerAsyncId`：创建异步资源的异步资源上下文编号
- `resource`：异步资源的引用

在使用上述钩子时，需要注意以下几点：

- 对于每个异步资源，除了 `init` 和 `destroy` 会被调用**一次**外，其余钩子被调用的次数大于等于一

- 在钩子函数的实现体，尽量避免使用异步操作（包括 `console` 语句）

  为什么不使用 `console.log` 呢？

  - 因为 `console.log` 是一个异步操作，如果在 `async_hooks.createHook` 注册的回调函数中出现异步操作将会导致无限循环
  - 可以使用 `fs.writeSync(1, msg)` 打印到标准输出，`writeSync` 的第 1 个参数接收文件描述符，`1` 表示标准输出

- 在执行异步操作之前，要先调用 `hook.enable()` 方法来启用钩子，不然所执行的异步操作将不会触发相关钩子

举个具体应用的🌰：

在异步调用链中实现一个类似[线程局部存储](https://zh.m.wikipedia.org/zh-hans/%E7%BA%BF%E7%A8%8B%E5%B1%80%E9%83%A8%E5%AD%98%E5%82%A8)的机制<!--对象的存储是在线程开始时分配，线程结束时回收-->

```js
const http = require('http');
const { AsyncResource, createHook, executionAsyncId } = require('async_hooks');

const authProfiles = {};
const hook = createHook({
  init(asyncId, type, triggerAsyncId, resource) {
    if (type === 'HTTP_PARSER') {
      if (typeof authProfiles[asyncId] === 'undefined') {
        authProfiles[asyncId] = {};
      }
    }
  },
  destroy(asyncId) {
    authProfiles[asyncId] = null;
  }
})
hook.enable();

http.createServer((req, res) => {
  const asyncResource = new AsyncResource('HTTP_PARSER');
  asyncResource.runInAsyncScope((req, res) => {
    const asyncId = executionAsyncId();
    authProfiles[asyncId].key = Date.now();
    // 其它异步操作....
    res.end();
  }, null, req, res);
}).listen(3000);
```

- 通过 `init` 和 `destroy` 钩子实现了在异步资源初始化时对相关 `authProfiles` 信息进行初始化，并且在异步资源销毁时移除相关 `authProfiles` 信息
- 在处理用户请求的整个异步调用链中（即 `asyncResource.runInAsyncScope` 回调内的异步调用链），均可通过变量 `asyncId` 的值操作相关 `authProfiles` 信息

### 四、`AsyncLocalStorage`类

虽然我们可以通过异步钩子实现类似[线程局部存储](https://link.juejin.cn/?target=https%3A%2F%2Fzh.m.wikipedia.org%2Fzh-hans%2F%E7%BA%BF%E7%A8%8B%E5%B1%80%E9%83%A8%E5%AD%98%E5%82%A8)的机制，不过Node.js提供了一种更加高效和安全的方式`AsyncLocalStorage`

举个🌰

```js
import http from 'node:http';
import { AsyncLocalStorage } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

function logWithId(msg) {
  const id = asyncLocalStorage.getStore();
  console.log(`${id !== undefined ? id : '-'}:`, msg);
}

let idSeq = 0;
http.createServer((req, res) => {
  asyncLocalStorage.run(idSeq++, () => {
    logWithId('start');
    // Imagine any chain of async operations here
    setImmediate(() => {
      logWithId('finish');
      res.end();
    });
  });
}).listen(8080);

http.get('http://localhost:8080');
http.get('http://localhost:8080');
// Prints:
//   0: start
//   1: start
//   0: finish
//   1: finish
```

`AsyncLocalStorage` 的主要方法如下：

- `run`：创建一个独立的上下文并运行指定的函数，在指定函数中的所有操作均可通过 `getStore` 获得共享数据，但函数外的操作无法获得共享数据；该方法的参数如下：

  - `store`：共享数据，可以为任意类型；
  - `callback`：要执行的回调函数；
  - `...args`：传递给回调函数的参数列表。

- `enterWith`：调用该方法后，之后所有操作均可通过 `getStore` 获得共享数据；该方法的参数如下：

  - `store`：共享数据，可以为任意类型。
  - 这里需要注意的是，如果在异步操作中调用了 `enterWith`，其影响范围仅限于该异步操作内部，比如下面的例子：

  ```js
  const { AsyncLocalStorage } = require('async_hooks');
  
  const asyncLocalStorage = new AsyncLocalStorage();
  
  asyncLocalStorage.enterWith(1);
  console.log(asyncLocalStorage.getStore()); // 输出 1
  
  new Promise((resolve) => resolve(true)).then((value) => {
    asyncLocalStorage.enterWith(value);
    console.log(asyncLocalStorage.getStore()); // 输出 true
    setTimeout(() => {
      console.log(asyncLocalStorage.getStore()); // 输出 true
    }, 1000);
  });
  
  setTimeout(() => {
    console.log(asyncLocalStorage.getStore()); // 输出 1
  }, 1000);
  ```

- `exit`：在指定函数中的所有操作调用 `getStore` 无法获得外部上下文中设置的共享数据，比如下例：

  ```js
  const { AsyncLocalStorage } = require('async_hooks');
  
  const asyncLocalStorage = new AsyncLocalStorage();
  
  asyncLocalStorage.enterWith(1);
  console.log(asyncLocalStorage.getStore()); // 输出 1
  asyncLocalStorage.exit(() => {
    console.log(asyncLocalStorage.getStore()); // 输出 undefined
  });
  ```

  该方法的参数如下：

  - `callback`：要执行的回调函数；
  - `...args`：传递给回调函数的参数列表。

- `disable`：调用该方法后，后续调用 `getStore` 将返回 `undefined`；

- `getStore`：获取当前上下文中的共享数据；

