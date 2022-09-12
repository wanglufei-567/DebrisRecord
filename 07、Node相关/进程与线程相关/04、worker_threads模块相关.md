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


