### Node 进程与线程笔记（三）Cluster模块

### 一、cluster模块简介

Node.js 的单个实例在单线程中运行。为了充分利用多核系统，用户有时想要启动 Node.js 进程的集群来处理负载

集群有以下两种常见的实现方案：

**方案一：多个 Node 实例+多个端口**

集群内的 Node.js 实例，各自监听不同的端口，再由反向代理实施请求到多个端口的分发。

- 优点：实现简单，各实例相对独立，这对服务稳定性有好处
- 缺点：增加端口占用，进程之间通信比较麻烦

**方案二：主进程向子进程转发请求**

集群内，创建一个主进程（`master`），以及若干个子进程（`worker`）由 `master` 监听客户端连接请求，并根据特定的策略，转发至对应的 `worker`。**==而这种方案为 Node.js 的 `cluster` 模式所使用==**。

- 优点：通常**==只占用一个端口==**，通信相对简单，转发策略更灵活
- 缺点：实现相对复杂，对主进程的稳定性要求较高

`cluster`模块可以使你轻松创建共享所有服务器端口的子进程

举个🌰

```js
const cluster = require('cluster');            // | |
const http = require('http');                  // | |
const numCPUs = require('os').cpus().length;   // | |    都执行了
                                               // | |
if (cluster.isMaster) {                        // |-|-----------------
  // Fork workers.                             //   |
  for (var i = 0; i < numCPUs; i++) {          //   |
    cluster.fork();                            //   |
  }                                            //   | 仅父进程执行 (master.js)
  cluster.on('exit', (worker) => {             //   |
    console.log(`${worker.process.pid} died`); //   |
  });                                          //   |
} else {                                       // |-------------------
  // Workers can share any TCP connection      // |
  // In this case it is an HTTP server         // |
  http.createServer((req，res) => {            // |
    res.writeHead(200);                        // |   仅子进程执行 (worker.js)
    res.end('Hello world!');                   // |
  }).listen(8000);                             // |
}                                              // |-------------------
                                               // | |
console.log('Hello world!');                   // | |    都执行了
```

运行 Node.js，现在所有的工作进程会共享 8000 端口

在上述代码中 `numCPUs` 虽然是全局变量但是，在父进程中修改它，子进程中并不会改变，因为父进程与子进程是完全独立的两个空间。他们所谓的共有仅仅只是都执行了，并不是同一份。

可以把父进程执行的部分当做 `master.js`，子进程执行的部分当做 `worker.js`，可以把他们想象成是先执行了 `node master.js` 然后 `cluster.fork` 了几次，就执行了几次 `node worker.js`。

而 cluster 模块则是二者之间的一个桥梁，可以通过 `cluster` 提供的方法，让其二者之间进行沟通交流。

### 二、工作原理

了解 cluster 模块，主要需要搞清楚三个问题：

1. master 和 `worker` 如何通信？
2. 多个 server 实例，如何实现端口共享？
3. 多个 server 实例，来自客户端的请求如何分发到多个 worker？

**进程间通信**

> `master` 和 `worker` 如何通信？

`master` 进程通过 `cluster.fork()` 来创建 `worker` 进程。`cluster.fork()` 内部是通过`child_process.fork()` 方法创建的。

也就是说：

1. `master` 进程和 `worker` 进程是父子进程的关系
2. `master` 进程和 `worker` 进程可以通过 IPC 通道进行通信相互传递服务句柄 📌

**端口共享**

> 多个 `server` 实例，如何实现端口共享？

在前面的例子中，多个 `worker` 中创建的 `server` 监听了相同的端口 3000。通常来说，多个进程监听同个端口，系统会报错。

那么为什么我们的示例没问题呢？

这是因为在 net 模块中，会根据当前进程是 `master` 进程还是 `worker` 进程，对 `listen()` 方法进行了特殊处理：

1. `master` 进程：在该端口上正常监听请求（没做特殊处理）
2. `worker` 进程：创建 Server 实例。然后通过 IPC 通道，向 `master` 进程发送消息，让 `master` 进程页创建 server 实例，并在该端口上监听请求。当请求进来时，`master` 进程将请求转发给 worker 进程的 server 实例。

归纳起来，就是：`master` 进程监听特定端口，并将客户请求转发给 `worker` 进程。

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/cluster-run-flow.23451d03.png" alt="Cluster模块运行流程" style="zoom:50%;" />

**分发连接**

> 多个 `server` 实例，来自客户端的请求如何分发到多个 `worker`？

每当 `worker` 进程创建 `server` 实例来监听请求，都会通过 IPC 通道，在 `master` 上进行注册。当客户端请求到达，`master` 会负责将请求转发给对应的 `worker`。

具体转发给哪个 `worker`？这是由转发策略决定的。可以通过环境变量 `NODE_CLUSTER_SCHED_POLICY` 设置，也可以在 `cluster.setupMaster(options)` 时传入。

`cluster` 模块提供了两种分发连接的方式。

**第一种方式**（默认方式，不适用于 Windows），通过**时间片轮转法**（round-robin）分发连接。主进程监听端口，接收到新连接之后，通过时间片轮转法来决定将接收到的客户端的 Socket 句柄传递给指定的 `worker` 处理。至于每个连接由哪个 `worker` 来处理，完全由内置的循环算法决定。

**第二种方式**是由主进程创建 `socket` 监听端口后，将 socket 句柄直接分发给相应的 `worker`，然后当连接进来时，就直接由相应的 `worker` 来接收连接并处理。

使用第二种方式时理论上性能应该较高，然而时间上存在负载不均衡的问题，比如通常 70% 的连接仅被 8 个进程中的 2 个处理，而其他进程比较清闲。

**内部通信技巧**

在开发过程中，我们会通过 `process.on('message', fn)` 来实现进程间通信。

前面提到，master 进程、worker 进程在 server 实例的创建过程中，也是通过 IPC 通道进行通信的。那会不会对我们的开发造成干扰呢？比如，收到一堆其实并不需要关心的信息？

答案肯定是不会，那么是怎么实现的呢？

当发送的消息包含 `cmd` 字段，且改字段以 `NODE_` 作为前缀，则该消息会被视为内部包括保留的消息，不会通过 `message` 事件抛出，但可以通过监听 `internalMessage` 捕获。

```js
// worker 进程
const message = {
  cmd: 'NODE_CLUSTER',
  act: 'queryServer',
};


process.send(message);
```

### 三、参考文章

[Node Guidebook 集群](https://tsejx.github.io/node-guidebook/system/process/cluster)

[Nodejs API 中文文档 集群工作原理](https://www.bookstack.cn/read/nodejs-api-doc-cn/cluster-how_it_works.md)


