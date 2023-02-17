## React18源码解析（五）实现ReactDOMRoot

### 一、前言

React 18 提供了两个 **root API**，被称之为 **Legacy Root API** 和 **New Root API**：

- **Legacy Root API**：是指之前版本的 root API `ReactDOM.render`，它将创建一个以 "legacy" 模式运行的 root，其工作方式与 React 17 完全相同，通过调用 `ReactDOM.render(<App />, rootNode)` 来启动应用。<!--使用这个API会有警告提示-->
- **New Root API**：新的 root API 是 `ReactDOM.createRoot`，它可以在 React 18 中创建一个 root，并支持 React 18 中支持的所有新特性，通过调用 `ReactDOM.createRoot(rootNode).render(<App />)` 来启动应用。<!--官方推荐使用这个API-->

#### 1.1、什么是root

> 在 React 中，"root" 是一个指向顶层数据结构的指针，React 用它来跟踪要渲染的树。

<!--屁话，看不懂，其实就字面意思 根，也可以理解成根节点-->

在 Legacy Root API 中，root 对用户来说是不透明的，因为它被附加到 DOM 元素上，通过 DOM 节点访问它，并没有将其暴露给用户：

```js
import * as ReactDOM from 'react-dom';
import App from 'App';

const container = document.getElementById('app');

// Initial render.
ReactDOM.render(<App tab="home" />, container);

// During an update, React would access
// the root of the DOM element.
ReactDOM.render(<App tab="profile" />, container);
```

在 New Root API 中，`createRoot` 创建一个 root，然后调用 `render` 方法完成渲染：

```js
import * as ReactDOM from 'react-dom';
import App from 'App';

const container = document.getElementById('app');

// Create a root.
const root = ReactDOM.createRoot(container);

// Initial render: Render an element to the root.
root.render(<App tab="home" />);

// During an update, there's no need to pass the container again.
root.render(<App tab="profile" />);
```

**为什么引入New Root API ？**

> 首先，这修复了 API 在运行更新时的一些人类工程学问题。如上所示，在 Legacy API 中，你需要多次将容器元素传递给 `render`，即使它从未更改过。这也意味着我们不需要将根元素存储在 DOM 节点上，尽管我们今天仍然这样做。
>
> 其次，这一变化允许让我们可以移除 `hydrate` 方法并替换为 root 上的一个选项；删除渲染回调，这些回调在部分 hydration 中是没有意义的

<!--也是屁话，其实就是逻辑解耦，扯那么多有的没的-->

### 二、ReactDOMRoot的具体实现

看下面这张示意图，`ReactDOMRoot`由`FiberRootNode`（fiber根节点）和`HostRootFiber`（根fiber对象）共同组成

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/FiberRootNode_1664074436254.jpg" alt="img" style="zoom:60%;" />

接下来先实现`ReactDOMRoot`的整体结构：

首先在`main.jsx`中 引入`createRoot`方法，创建`root`，待实现完成后看下`root`的打印结果

<!--root本身就是个js对象-->

```jsx
// src/main.jsx
import { createRoot } from "react-dom/client";

let element = (
  <h1>
    hello<span style={{ color: "red" }}>world</span>
  </h1>
)

// 创建root
const root = createRoot(document.getElementById("root"));

console.log('root', root)
```

------

在`src/react-dom`目录下创建`client.js`，导出`createRoot`方法

```js
// src/react-dom/client.js
export { createRoot } from './src/client/ReactDOMRoot';
```

------

在`src/react-dom/src/client`目录下，创建`ReactDOMRoot.js`，在这里具体实现`createRoot`方法

```js
import {
  createContainer,
  updateContainer
} from 'react-reconciler/src/ReactFiberReconciler';

/**
 * @description ReactDOMRoot的构造函数
 * @param internalRoot 内部使用的root，可以理解成是个中间量
 */
function ReactDOMRoot(internalRoot) {
  this._internalRoot = internalRoot;
}

/**
 * @description 给ReactDOMRoot构造函数添加render方法
 * @description 更新容器
 * @param children 要渲染的虚拟DOM
 */
ReactDOMRoot.prototype.render = function (children) {
  // 拿到ReactDOMRoot实例上的internalRoot
  const root = this._internalRoot;

  // 更新容器，将虚拟DOM变成真实DOM插入到container容器中
  updateContainer(children, root);
};

/**
 * @description 创建root的方法
 * @description 调用createContainer()创建容器
 * @description 调用new ReactDOMRoot() 创建ReactDOMRoot对象
 * @param container 容器，真实的DOM节点，div#root
 * @returns 返回一个ReactDOMRoot对象，也就是所谓的root
 */
export function createRoot(container) {
  const root = createContainer(container);
  return new ReactDOMRoot(root);
}
```

这里主要做了两件事：

- 调用 `react-reconciler` 包的 `createContainer` 创建 `FiberRootNode` 对象（fiber根节点）

  <!--在createContainer中，除了创建FiberRootNode对象（fiber根节点）还创建了 HostRootFiber对象（根fiber对象），并完成了FiberRootNode和 HostRootFiber的互相指向-->

- 调用 `new ReactDOMRoot(root)`，实例化 `ReactDOMRoot` 对象，并将创建的 `FiberRootNode` 对象挂载到实例属性`_internalRoot`上

- ~~初始化`HostRootFiber`的 `memoizedState` 和 `updateQueue` <!--这点现在还没实现-->~~

------

在`src/react-reconciler/src`目录下，创建`ReactFiberReconciler.js`，实现并导出`createContainer`方法

```js
// src/react-reconciler/src/ReactFiberReconciler.js
import { createFiberRoot } from './ReactFiberRoot';

/**
 * @description 创建容器
 * @param containerInfo 容器信息，根root上的就是真实DOM，div#root
 * @return 返回一个FiberRoot
 */
export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo);
}
```

`createContainer` 方法并没有具体的逻辑实现，而是调用了`createFiberRoot` 函数来创建 `fiberRoot`对象

------

在`src/react-reconciler/src`目录下，创建`ReactFiberRoot.js`，实现并导出`createFiberRoot`方法

```js
// src/react-reconciler/src/ReactFiberRoot.js
import { createHostRootFiber } from './ReactFiber';

/**
 * @description FiberRootNode的构造函数，用于创建fiber根节点
 * @param containerInfo 容器信息，根root上的就是真实DOM，div#root
 */
function FiberRootNode(containerInfo) {
  /*
  就是在这里给FiberRootNode上挂上了containerInfo，
  fiber根节点上的containerInfo直接就是真实DOM，div#root
  */
  this.containerInfo = containerInfo;
}

/**
 * @description 创建FiberRoot对象的方法
 * @description 调用createHostRootFiber()创建了根fiber对象 HostRootFiber
 * @description 调用new FiberRootNode()创建了fiber根节点 FiberRootNode
 * @description 将FiberRootNode和根HostRootFiber关联起来
 * @description 初始化HostRootFiber的 memoizedState 和 updateQueue
 * @param containerInfo 容器信息，根root上的就是真实DOM，div#root
 */
export function createFiberRoot(containerInfo) {
  // 创建fiber根节点
  const root = new FiberRootNode(containerInfo);

  /*
    创建根fiber对象
    uninitializedFiber这个变量名很有意思，未初始化的fiber
   */
  const uninitializedFiber = createHostRootFiber();

  // fiber根节点的 current 指向根fiber对象
  root.current = uninitializedFiber;

  /*
    根fiber对象的 stateNode 指向fiber根节点，
    fiber根节点上的containerInfo直接就是真实DOM，div#root
   */
  uninitializedFiber.stateNode = root;

  return root;
}

```

`createFiberRoot` 主要做了以下4件事：

1. 调用 `new FiberRootNode()` 创建根DOM容器`div#root`的`fiber`根节点，承其为`FiberRootNode`（fiber根节点）
2. 调用 `createHostRootFiber` 函数创建react应用的首个 `fiber` 对象，承其为 `HostRootFiber`（根fiber对象
3. 将根DOM容器的`fiber`节点`FiberRootNode`与 `fiber`根对象`HostRootFiber` 关联起来
4. 初始化`HostRootFiber`的 `memoizedState` 和 `updateQueue` <!--这点现在还没实现-->

------

在`src/react-reconciler/src`目录下，创建`ReactFiber.js`，实现并导出`createHostRootFiber`方法和`createFiber`方法

```js
// src/react-reconciler/src/ReactFiber.js
import { HostRoot } from './ReactWorkTags';
import { NoFlags } from './ReactFiberFlags';

/**
 * @description 创建fiber节点的方法， 每个虚拟DOM=>Fiber节点=>真实DOM
 * @param tag fiber的类型 函数组件0 类组件1 原生组件5 根元素3
 * @param pendingProps 新属性，等待处理或者说生效的属性
 * @param key 唯一标识
 */
export function FiberNode(tag, pendingProps, key) {
  this.tag = tag;
  this.key = key;
  this.type = null; //fiber对应的虚拟DOM节点的type，span div p
  this.stateNode = null; //此fiber对应的真实DOM节点

  this.return = null; //指向父节点
  this.child = null; //指向第一个子节点
  this.sibling = null; //指向弟弟

  /*
  fiber是通过虚拟DOM节点创建的
  虚拟DOM会提供pendingProps用来创建fiber节点的属性
   */
  this.pendingProps = pendingProps; //等待生效的属性，
  this.memoizedProps = null; //已经生效的属性

  /*
  每个fiber还会有自己的状态，每一种fiber的状态存的类型是不一样的
  类组件对应的fiber存的就是类的实例的状态,HostRoot存的就是要渲染的元素
   */
  this.memoizedState = null;

  //每个fiber身上可能还有更新队列
  this.updateQueue = null;

  /*
  副作用的标识，表示要针对此fiber节点进行何种操作
  */
  this.flags = NoFlags; //自己的副作用
  this.subtreeFlags = NoFlags; //子节点对应的副使用标识

  //替身，轮替 在后面讲DOM-DIFF的时候会用到
  this.alternate = null;
}

/**
 * @description 创建fiber对象
 */
export function createFiber(tag, pendingProps, key) {
  return new FiberNode(tag, pendingProps, key);
}

/**
 * @description 创建根fiber对象
 */
export function createHostRootFiber() {
  return createFiber(HostRoot, null, null);
}
```

```js
// src/react-reconciler/src/ReactWorkTags.js

//每种虚拟DOM都会对应自己的fiber tag类型

export const HostRoot = 3; //根Fiber的tag
export const HostComponent = 5;
export const HostText = 6;
```

```js
// src/react-reconciler/src/ReactFiberFlags.js

/**
 * 副作用标识
 */
export const NoFlags = 0b00000000000000000000000000;
export const Placement = 0b00000000000000000000000010;
export const Update = 0b00000000000000000000000100;
```

到这里`ReactDOMRoot`的整体结构已经搭建好了，其实没什么具体的逻辑，主要是创建了3个全局对象，只是文件比较多，链路有些长，创建了很多中间的构造函数，看起来让人头大；

- **ReactDOMRoot** 对象
  - 该对象属于 `react-dom` 包，这个对象就是`root`
- **FiberRoot** 对象（也可称其为**FiberRootNode**对象）
  - 该对象属于 `react-reconciler` 包，在 `createFiberRoot` 函数中创建，作为 `react-reconciler` 在运行过程中的全局上下文，保存着`fiber`构建过程中所依赖的全局状态。
- **HostRootFiber** 对象
  - 该对象属于 `react-reconciler` 包，在 `createHostRootFiber` 函数中创建，这是 React 应用中的第一个`fiber` 对象, 是 `fiber` 树的根节点。

下面👇是整个`ReactDOMRoot`创建的流程图

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/2ecc028b2af04fe1ba9ef71f426ae064%7Etplv-k3u1fbpfcp-zoom-in-crop-mark%3A4536%3A0%3A0%3A0.image)

下面👇这个是`ReactDOMRoot`、`FiberRoot`、`HostFiberRoot` 三个对象内存中的引用关系

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/8a4c50e65357451d8d1410e2ceef95ff%7Etplv-k3u1fbpfcp-zoom-in-crop-mark%3A4536%3A0%3A0%3A0.image)

<!--这里还未完全实现上面图中的对象引用关系，这里暂时先看下ReactDOMRoot、FiberRoot、HostFiberRoot这部分的，先帮助理解-->



最后，看下👇`root`的打印结果，`root`本身就是个js对象

![image-20221011154902382](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20221011154902382.png)



### 参考文章

[React 源码解读之React应用的2种启动方式](https://juejin.cn/post/7020899265471840287#heading-8)

