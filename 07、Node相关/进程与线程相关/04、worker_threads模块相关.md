## Node 进程与线程笔记（四）worker_threads模块

### 一、worker_threads模块简介

Node.js 是 javascript 在服务端的运行环境，构建在 chrome 的 V8 引擎之上，基于事件驱动、非阻塞I/O模型，充分利用操作系统提供的异步 I/O 进行多任务的执行，适合于 I/O 密集型的应用场景。但同时由于javascript是单线程执行的，所以导致了Node.js不适用于CPU密集型的场景，因为CPU的密集操作可能会导致主线程处于忙碌状态，进而影响服务性能。

作为该问题一个解决方法，Node.js 从 v10.5.0 开始引入了实验性的 [Worker Threads](https://nodejs.org/api/worker_threads.html) 概念，并将其体现在 `worker_threads` 模块，该模块从 Node.js v12 LTS 开始作为一个稳定功能模块提供出来。

#### 1.1、Node.js 的 CPU 密集型应用的历史

在 `worker threads` 出现前，就已经有很多种方案来完成基于 Node.js 的 CPU 密集型应用。常见的有如下几种：

- 使用 `child_process` 模块，在子进程中运行耗费 CPU 的代码操作。
- 使用 `cluster` 模块，在多个进程中运行耗费 CPU 资源的代码操作。
- 使用第三方模块，如 Microsoft 的 [Napa.js](https://github.com/microsoft/napajs) 。

但是，由于性能局限、额外的引入学习成本、接受度的不足、不稳定性以及文档缺失等原因，这其中没
一个方案是能被广泛接受的。

#### 1.2、worker_threads工作机制

`worker_threads`比 `child_process` 或 `cluster`更轻量级。 与`child_process` 或 `cluster` 不同，`worker_threads` 可以**共享内存**，通过传输 `ArrayBuffer` 实例或共享 `SharedArrayBuffer` 实例来实现。

**这里有一个误区：很多人可能认为在node.js核心模块中添加一个新的模块，来创建线程以及实现线程间同步问题，从而解决CPU密集型操作的问题？**

但事实并非如此，Node.js 并没有其它支持多线的程语言（如：java），诸如"synchronized"之类的关键字来实现线程同步的概念。**Node.js的 worker_threads 区别于它们的多线程**。如果添加线程，语言本身的性质将发生变化，所以不能将线程作为一组新的可用类或函数添加。

我们可以将其理解为：**JavaScript和Node.js永远不会有线程**，只有基于Node.js 架构的**多工作线程**。

**这张图很好的诠释了多工作线程机制。**（1.理解node.js的event loop机制 2.和其它多线程语言对比性理解）

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/worker-diagram_2x__1_.jpg" alt="Understanding Worker Threads in Node.js - NodeSource" style="zoom:50%;" />

### 二、worker_threads模块使用

先看个🌰

```js
const startTime01 = new Date().getTime();
for (let i = 0; i < 1000000000; i++) {}
const endTime01 = new Date().getTime();
console.log(
  `运算1000000000次，开始运算时间：${startTime01},结束运算时间${endTime01},总运算时间${
    endTime01 - startTime01
  }`
);

const startTime02 = new Date().getTime();
for (let i = 0; i < 1000000000; i++) {}
const endTime02 = new Date().getTime();
console.log(
  `运算1000000000次，开始运算时间：${startTime02},结束运算时间${endTime02},总运算时间${
    endTime01 - startTime01
  }`
);

// 运算1000000000次，开始运算时间：1663070749756,结束运算时间1663070750606,总运算时间850
// 运算1000000000次，开始运算时间：1663070750618,结束运算时间1663070751438,总运算时间850
```

从打印结果来看，可以发现两次循环是依次执行的；试想下，若一段代码计算量很大，那么势必会导致js执行线程被阻塞，后面的代码无法执行；如何解决这个问题，看下👇下面的解决方案

```js
// worker1.js
const { parentPort } = require('worker_threads')

const startTime = new Date().getTime()
for(let i = 0; i < 1000000000; i ++) {}
const endTime = new Date().getTime()

parentPort.postMessage(`运算1000000000次，开始运算时间：${startTime},结束运算时间${endTime}`)
```

```js
// mian_worker.js
const { join } = require('path');
const { Worker } = require('worker_threads');

console.log('main_worker start')

const wk1 = new Worker(join(__dirname, './worker1.js'));
const wk2 = new Worker(join(__dirname, './worker1.js'));

wk1.on('message', res => {
  console.log(res);
});

wk2.on('message', res => {
  console.log(res);
});

console.log('main_worker end')

// main_worker start
// main_worker end
// 运算1000000000次，开始运算时间：1663071724713,结束运算时间1663071725541,总运算时间828
// 运算1000000000次，开始运算时间：1663071724713,结束运算时间1663071725542,总运算时间829
```

从打印结果来看，两个工作线程`wk1`,`wk2`是独立于主线程运行的，且两个工作线程之间互不影响，可以*同时运行*(<!--看起来是同时运行的-->)，所以我们可以将那些运行时间长的逻辑丢到工作线程中去执行，应用到CPU密集的场景中去。

上面👆的🌰是`worker_threads`模块的简单使用，下面👇就`worker_threads`模块的一些重要功能进行展开说明；

##### `worker_threads`模块中比较重要的几个类：

- `Worker`： 用于创建单独的JS线程

- `MessageChannel`: 用于创建异步、双向通信的`channel`，`new MessageChannel()` 实例化一个`channel`的时候，会自动创建两个`MessagePort`实例挂到`channel`的`port1`,`port2`这两个属性上

  ```js
  const { MessageChannel } = require('worker_threads');
  const { port1, port2 } = new MessageChannel();
  
  port1.on('message', (message) => console.log('received', message));
  port2.postMessage({ foo: 'bar' })
  
  // received { foo: 'bar' }
  ```

- `MessagePort`： 用于表示`MessageChannel`通道的终端，用于`Worker`之间传输结构化数据、内存区域和其他的`MessagePort`；`MessagePort`继承了`EventEmitter`，因此可以使用`postMessage`和`on`方法实现消息的传递与接收

  - `port.on('message')`实际上为`message`事件添加了一个`listener`，`port.on('message')`会自动触发`port.start()`方法，表示启动一个`port`；当`port`有`listener`存在的时候，这表示`port`存在一个`ref`，当存在`ref`的时候，**通信的两个线程是不会结束的**,可以通过调用`port.unref()`方法来取消这个`ref`，**结束掉当前通信的两个线程**

  - `postMessage`的使用方式

    - 语法：`port.postMessage(value[, transferList])`
    -  参数说明：
      - `value`：要传递的数据，是一个JavaScript对象
      - `transformList`：`transferList`是一个`list`，`list`中的对象可以是`ArrayBuffer`, `MessagePort` 和 `FileHandle`，在`transferList`中的对象将会被`transfer`到`channel`的接受端，并且不再存在于发送端，就好像把对象传送出去一样

    ```js
    const { MessageChannel } = require('worker_threads');
    const { port1, port2 } = new MessageChannel();
    
    port1.on('message', (message) => console.log(message));
    
    const uint8Array = new Uint8Array([ 1, 2, 3, 4 ]);
    // post uint8Array的拷贝:
    port2.postMessage(uint8Array);
    
    port2.postMessage(uint8Array, [ uint8Array.buffer ]);
    
    //port2.postMessage(uint8Array);
    ```

    上面的例子将输出：

    ```js
    Uint8Array(4) [ 1, 2, 3, 4 ]
    Uint8Array(4) [ 1, 2, 3, 4 ]
    ```

    第一个`postMessage`是拷贝，第二个`postMessage`是`transfer` `Uint8Array`底层的`buffer`

    如果再次调用`port2.postMessage(uint8Array)`，会得到下面的错误：

    ```mipsasm
    DOMException [DataCloneError]: An ArrayBuffer is detached and could not be cloned.
    ```

    `buffer`是`TypedArray`的底层存储结构，如果`buffer`被`transfer`，那么之前的`TypedArray`将会变得不可用

    要想避免这个问题，可以调用`markAsUntransferable`将`buffer`标记为不可`transferable`. 看一下`markAsUntransferable`的例子：

    ```js
    const { MessageChannel, markAsUntransferable } = require('worker_threads');
    
    const pooledBuffer = new ArrayBuffer(8);
    const typedArray1 = new Uint8Array(pooledBuffer);
    const typedArray2 = new Float64Array(pooledBuffer);
    
    markAsUntransferable(pooledBuffer);
    
    const { port1 } = new MessageChannel();
    port1.postMessage(typedArray1, [ typedArray1.buffer ]);
    
    console.log(typedArray1);
    console.log(typedArray2);
    ```

##### `worker_threads`模块中比较重要的几个属性：

- `parentPort`： 子线程中的parentPort指向可以与主线程进行通信的MessagePort。

- 子线程向父线程发送消息

- ```scss
  parentPort.postMessage(...)
  复制代码
  ```

- 子线程接受来自父线程的消息

- ```javascript
  parentPort.on('message', (msg) => ...)
  复制代码
  ```

- `isMainThread`： 用于区分当前文件是否在主线程中执行

- `workerData`： 用于传递给Worker构造函数的data副本，在子线程中可以通过workerData获取到父进程传入的数据。


