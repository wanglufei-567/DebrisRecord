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

`worker_threads`比 `child_process` 或 `cluster`更轻量级。 与`child_process` 或 `cluster` 不同，==`worker_threads` 可以**共享内存**，通过传输 `ArrayBuffer` 实例或共享 `SharedArrayBuffer` 实例来实现==。

**这里有一个误区：很多人可能认为在node.js核心模块中添加一个新的模块，来创建线程以及实现线程间同步问题，从而解决CPU密集型操作的问题**

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

- `MessagePort`： `MessagePort` 的实例表示`MessageChannel`的一端，它可用于在不同的 `Worker` 之间传输结构化数据、内存区域和其他 `MessagePort`；`MessagePort`继承了`EventEmitter`，因此可以使用`port.on()`和`port.postMessage()`和方法实现消息的接收与传递;

  - `MessagePort`中有两个事件，`close`和`message`

    - `close`事件将会在`channel`的中任何一端断开连接的时候触发
    - `message`事件将会在`port.postMessage`时候触发

  - `port.on('message')`实际上为`message`事件添加了一个`listener`，`port.on('message')`会自动触发`port.start()`方法，表示启动一个`port`；

    > 当`port`有`listener`存在的时候，这表示`port`存在一个`ref`，当存在`ref`的时候，**通信的两个线程是不会结束的**,可以通过调用`port.unref()`方法来取消这个`ref`，**结束掉当前通信的两个线程**

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

    要想避免这个问题，可以调用`markAsUntransferable`将`buffer`标记为不可`transferable`

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

- `isMainThread`： isMainThread用来判断代码是否在主线程中运行

  ```js
  const { Worker, isMainThread } = require('worker_threads');
  
  if (isMainThread) {
      console.log('在主线程中');
    new Worker(__filename);
  } else {
    console.log('在工作线程中');
    console.log(isMainThread);  // 打印 'false'。
  }
  ```

- `parentPort`：`parentPort`是一个`MessagePort`的实例，`parentPort`主要用于`worker`线程和主线程进行消息交互

  - `worker`线程中通过`parentPort.postMessage()`发送的消息在主线程中将可以通过`worker.on('message')`接收
  - 主线程中通过`worker.postMessage()`发送的消息将可以在工作线程中通过`parentPort.on('message')`接收

- `workerData`： 除了`postMessage()`，还可以通过在主线程中传递`workerData`给`worker`的构造函数，从而将主线程中的数据传递给`worker`

  ```js
  const { Worker, isMainThread, workerData } = require('worker_threads');
  
  if (isMainThread) {
    const worker = new Worker(__filename, { workerData: 'Hello, world!' });
  } else {
    console.log(workerData);  // Prints 'Hello, world!'.
  }
  ```

- `SHARE_ENV`：`SHARE_ENV`是传递给`worker`构造函数的一个`env`变量，通过设置这个变量，我们可以在主线程与工作线程进行共享环境变量的读写

  ```js
  // worker1.js
  const { parentPort} = require('worker_threads');
  
  console.log('worker1', process.env.SET_IN_WORKER);
  process.env.SET_IN_WORKER = 'work1 set';
  console.log('worker1', process.env.SET_IN_WORKER);
  
  ```

  未配置`SHARE_ENV`

  ```js
  const { join } = require('path');
  const {
    Worker,
    SHARE_ENV
  } = require('worker_threads');
  
  console.log('main_worker', process.env.SET_IN_WORKER);
  
  process.env.SET_IN_WORKER = 'main set'
  
  const wk1 = new Worker(join(__dirname, './worker1.js'));
  
  wk1.on('message', res => {
    console.log(res);
  });
  
  wk1.on('exit', () => {
    console.log('wk1 exit', process.env.SET_IN_WORKER);
  });
  
  // main_worker main set
  // worker1 main set
  // worker1 work1 set
  // wk1 exit main set
  
  // 工作线程中修改`process.env`未同步到主线程中
  ```

  未配置`SHARE_ENV`

  ```js
  const { join } = require('path');
  const {
    Worker,
    SHARE_ENV
  } = require('worker_threads');
  
  console.log('main_worker', process.env.SET_IN_WORKER);
  
  process.env.SET_IN_WORKER = 'main set'
  
  const wk1 = new Worker(join(__dirname, './worker1.js'), {
    env: SHARE_ENV
  });
  
  wk1.on('message', res => {
    console.log(res);
  });
  
  wk1.on('exit', () => {
    console.log('wk1 exit', process.env.SET_IN_WORKER);
  });
  
  // main_worker main set
  // worker1 main set
  // worker1 work1 set
  // wk1 exit work1 set
  
  // 工作线程中修改`process.env`同步到主线程中
  ```

### 三、worker_threads中的线程通信

#### 3.1、父子线程通信-parentPort

```javascript
const { Worker, isMainThread, parentPort } = require("worker_threads");

if (isMainThread) {
    const worker = new Worker(__filename);
    // 1. 针对工作线程（worker）开启消息监听
    worker.on("message", (message) => console.log(message));
    // 2. 像工作线程（worker）发送消息："ping"
    worker.postMessage("ping");
} else {
    // 3. 针对主线程（parentPort）开启消息监听
    parentPort.on("message", (message) =>
        // 4. 接收到主线程的消息后，将其放入 pong 字段，并且发送给主线程（parentPort）
        parentPort.postMessage({ pong: message })
    );
}
```

打印结果

```plain
{
  pong: "ping";
}
```

#### 3.2、任意线程通信-MessageChannel

通信管道（MessageChannel）可以跨任何线程（比如多个工作线程之间）进行数据通信。对比上面通过`require('worker_threads').parentPort` 的方式，**缺点是只能在主线程和工作线程之间进行通信**。

管道通信的思路：

- 通过 `MessageChannel` 创建通信管道

- 通过 `postMessage` 传递数据

- - 第一个参数是传递的数据，包括通信管道的 `Messageport`
  - 第二个参数是 `transformList`，放入其中的对象，将在**==管道发送端中无法使用==**（只能接受端使用）

来看一段利用通信管道，**==兄弟线程通信==**的实现：

```javascript
const {
    isMainThread, parentPort, threadId, MessageChannel, Worker
} = require('worker_threads');

if (isMainThread) {
    const worker1 = new Worker(__filename);
    const worker2 = new Worker(__filename);
  
    const subChannel = new MessageChannel();
  
    worker1.postMessage({ yourPort: subChannel.port1 }, [subChannel.port1]);
    worker2.postMessage({ yourPort: subChannel.port2 }, [subChannel.port2]);
} else {
    parentPort.once('message', (value) => {
        value.yourPort.postMessage('hello');
        value.yourPort.on('message', msg => {
            console.log(`thread ${threadId}: receive ${msg}`);
        });
    });
}
```

打印结果

```plain
thread 2: receive hello
thread 1: receive hello
```

#### 3.3、共享内存通信-SharedArrayBuffer

nodejs 多线程也可以通过“**==共享内存==**”进行通信。**主线程和工作线程都操作同一段物理存储上的数据**，实现数据共享，并且避免了拷贝带来的开销

共享内存通信的思路：

- 通过 `SharedArrayBuffer` 创建二进制数据

- `SharedArrayBuffer` 数据不能放在 `postMessage` 的第二个参数中

来看一段通过共享内存进行通信的代码：

```javascript
const assert = require("assert");
const {
    Worker,
    MessageChannel,
    MessagePort,
    isMainThread,
    parentPort,
} = require("worker_threads");

if (isMainThread) {
    const worker = new Worker(__filename);
    const subChannel = new MessageChannel();
  
    // uint8Arr 是放在共享内存上的
    const sharedArray = new SharedArrayBuffer(4);
    const uint8Arr = new Uint8Array(sharedArray);
    console.log("[master] 原来的uint8Arr", uint8Arr);

    worker.postMessage({ hereIsYourPort: subChannel.port1, uint8Arr }, [
        subChannel.port1,
    ]);

    subChannel.port2.on("message", (msg) => {
        console.log("[master] 经过工作线程修改的uint8Arr", uint8Arr);
    });
} else {
    parentPort.on("message", (value) => {
        value.uint8Arr[1] = 10;
        console.log("[worker] 修改出来的uint8Arr", value.uint8Arr);
        value.hereIsYourPort.postMessage("");
        value.hereIsYourPort.close();
    });
}
```

打印结果

```plain
[master] 原来的uint8Arr Uint8Array [ 0, 0, 0, 0 ]
[worker] 修改出来的uint8Arr Uint8Array [ 0, 10, 0, 0 ]
[master] 经过工作线程修改的uint8Arr Uint8Array [ 0, 10, 0, 0 ]
```

可以看到，工作线程修改了 `uint8Arr`，由于采用共享内存，因此在 `master thread` 中，从自己的上下文中，也读取到修改后的 `uint8Arr`

### 参考文章

[nodejs中使用worker_threads来创建新的线程](https://www.cnblogs.com/flydean/p/14310278.html)

[NodeJS 多线程编程](https://0x98k.com/2022-05-06-worker-threads#99c93aaebd924cd09270c265b12fcc76)

[Node.js 10.5.0新特性-多线程](https://juejin.cn/post/6844903624984756231#heading-3)

[理解Node.js中的"多线程"](https://www.cnblogs.com/ShuiNian/p/15423317.html)


