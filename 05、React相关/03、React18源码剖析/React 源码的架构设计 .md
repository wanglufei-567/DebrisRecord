## React 源码的架构设计

### 一、React 源码中的几个关键 package

1. **react**：**React** 基础包
   - 只提供定义 **React** 组件（`ReactElement`）的必要函数
   - 一般来说需要和渲染器（`react-dom`,`react-native`）一同使用
   - 在编写 **React** 应用的代码时, 大部分都是调用此包的 **api**
     - `useState`、`useEffect` 这些 **hook**

2. **react-dom**：**React** 渲染器之一，**web** 平台的渲染器

   - 将 **react-reconciler** 中的运行结果输出到 **web** 界面上
   - 在编写 **React** 应用的代码时大多数场景下，能用到此包的就是一个入口函数，其余使用的 api 基本是 **react** 包提供的

3. **react-reconciler**：**React** 的核心包，协调 **react-dom**, **react**, **scheduler** 各包之间的调用与配合 🌟

   - 管理 **React** 应用状态的输入和结果的输出，将「输入」最终转换成「输出」传递给**「渲染器」**
   - 接受「输入」（`scheduleUpdateOnFiber`）将 **fiber** 树生成逻辑封装到一个回调函数中
     - 涉及 **fiber** 树形结构, **fiber.updateQueue** 队列, 调和算法等
   - 将具体执行调和逻辑的方法（`performSyncWorkOnRoot` 或 `performConcurrentWorkOnRoot`）作为回调函数放入 **scheduler** 进行调度
     - **scheduler** 会控制回调函数执行的时机，回调函数执行完成后得到全新的 **fiber** 树
   - 之后再调用渲染器（如`react-dom`, `react-native`等）将 **fiber** 树形结构最终反映到界面上

4. **scheduler**：**React** 的调度包，调度机制的核心实现

   - 核心任务就是执行回调，回调函数由 **react-reconciler** 提供

     - 通过控制回调函数的执行时机，来达到任务分片的目的，实现可中断渲染

       <!-- concurrent 模式下才有此特性-->

   - 在编写 **React** 应用的代码时，几乎不会直接用到此包提供的 **api**

### 二、React 源码中的架构图

三个核心包**react-dom**、**react-reconciler**、**scheduler**之间的关系如下图所示👇：

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/core-packages.c2850581.png)

1. **scheduler**：核心职责只有 1 个，就是执行回调
   - 把 **react-reconciler** 提供的回调函数, 包装到一个任务对象中
   - 在内部维护一个任务队列，优先级高的排在最前面
   - 循环消费任务队列，直到队列清空
2. **react-reconciler**：有 3 个核心职责
   - 装载渲染器生成真实节点
     - 渲染器必须实现 [`HostConfig`协议](https://github.com/facebook/react/blob/v17.0.2/packages/react-reconciler/README.md#practical-examples) （如: **react-dom**），保证在需要的时候，能够正确调用渲染器的 **api**，生成实际节点（如: **dom** 节点）
   - 接收 **react-dom** 包（初次 `render`）和 **react** 包（后续更新 `setState`）发起的更新请求
   - 将 **fiber** 树的构建过程包装在一个回调函数中（`performSyncWorkOnRoot` 或 `performConcurrentWorkOnRoot`），并将此回调函数传入到 **scheduler** 包等待调度
3. **react-dom**：有 2 个核心职责:
   - 引导 **React** 应用的启动 (通过`ReactDOM.render`)
   - 实现 [`HostConfig`协议](https://github.com/facebook/react/blob/v17.0.2/packages/react-reconciler/README.md#practical-examples)（[源码在 ReactDOMHostConfig.js 中](https://github.com/facebook/react/blob/v17.0.2/packages/react-dom/src/client/ReactDOMHostConfig.js)） 能够将 **react-reconciler** 构建出来 **fiber**树转换成对应的 **dom** 树并挂载到目标环境中

### 三、React 中的两大工作循环

**React** 中有两大的循环，它们分别位于 **scheduler** 和 **react-reconciler** 中👇:

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/workloop.ef1c7673.png)

1. **任务调度循环**
   - 源码位于 [Scheduler.js](https://github.com/facebook/react/blob/v17.0.2/packages/scheduler/src/Scheduler.js) 它是 **React** 应用得以运行的保证, 它需要循环调用, 控制所有 **task** 的调度
   - 以**二叉堆**为数据结构, 循环执行**堆** 的顶点, 直到**堆**被清空
   - 调度具体任务，其实就是执行回调 `performSyncWorkOnRoot` 或 `performConcurrentWorkOnRoot`
2. **fiber构造循环**
   - 源码位于 [ReactFiberWorkLoop.js](https://github.com/facebook/react/blob/v17.0.2/packages/react-reconciler/src/ReactFiberWorkLoop.old.js) 控制 **fiber** 树的构造, 整个过程是一个**深度优先遍历**
   - 以**树**为数据结构, 从上至下执行深度优先遍历
   - 偏向具体实现，它只是任务的一部分，只负责 **fiber** 树的构造

