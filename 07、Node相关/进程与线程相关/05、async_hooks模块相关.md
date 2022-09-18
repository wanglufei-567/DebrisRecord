

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

- `AsyncResource.bind`：`AsyncResource` 的静态方法，把指定的 `fn` 函数绑定在当前所属的异步资源上下文中（即在调用 `AsyncResource.bind` 时所在的异步资源上下文）；该方法的参数如下：

  - `fn`：要绑定到当前所属的异步资源上下文中的执行函数；
  - `type`：异步资源类型，通过该属性与相关的 `AsyncResource` 进行关联，该参数为非必填参数；
  - `thisArg`：指定 `fn` 调用时 `this` 的值，该参数为非必填参数。

- `bind`：把指定的 `fn` 函数绑定在当前 `AsyncResource` 实例所属的异步资源上下文中；该方法的参数如下：

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


