## React18 源码解析（七）实现 fiber 调和更新

### 一、前言

#### 1.1、调和更新

**React** 的调和更新采用了**双缓冲**的思想，维护了两棵 **fiber** 树：
- 一棵 **fiber** 树用于渲染展示
- 另一棵 **fiber** 树用于计算更新

计算更新是以单个 **fiber** 节点为工作单元，完成:
- 更新队列中更新内容处理
- 生成新的 **VDom**
- 根据 **VDom** 调和子 **fiber** 等工作

#### 1.2、实现一个日志工具

为了方便调试代码，在 `src/shared/logger.js` 中实现一个日志工具

```js
import * as ReactWorkTags from "react-reconciler/src/ReactWorkTags";

const ReactWorkTagsMap = new Map();

for (let tag in ReactWorkTags) {
  ReactWorkTagsMap.set(ReactWorkTags[tag], tag);
}

/**
 * @description 日志打印方法
 * @param prefix 前缀
 * @param workInProgress 执行中的工作（是个fiber节点）
 */
export default function (prefix, workInProgress) {
  let tagValue = workInProgress.tag;
  let tagName = ReactWorkTagsMap.get(tagValue);
  let str = ` ${tagName} `;
  if (tagName === "HostComponent") {
    str += ` ${workInProgress.type}`;
  } else if (tagName === "HostText") {
    str += ` ${workInProgress.pendingProps}`;
  }
  console.log(`${prefix} ${str}`);
}

let indent = { number: 0 };
export { indent };
```

```js
// src/react-reconciler/src/ReactWorkTags.js

export const IndeterminateComponent = 2; // 未定的类型
export const HostRoot = 3; //根Fiber的tag
export const HostComponent = 5; //原生节点 span div h1
export const HostText = 6; //纯文件节点
```

### 二、fiber的调和更新

在 `src\react-reconciler\src\ReactFiberReconciler.js` 的**更新容器**的方法 `updateContainer` 中调用 `fiber` 的**调度更新**的方法 `scheduleUpdateOnFiber`

```js
// src/react-reconciler/src/ReactFiberReconciler.js

/**
 * @description 更新容器，把虚拟DOM变成真实DOM插入到container容器中
 * @param {*} element 虚拟DOM
 * @param {*} container DOM容器 也就是FiberRootNode
 * 其中container.containerInfo 指向 div#root
 * container.current 指向 HostRootFiber
 */
export function updateContainer(element, container) {

  // ...

  // 在fiber上调度更新
  scheduleUpdateOnFiber(root);
}
```

------

在 `src/react-reconciler/src/ReactFiberWorkLoop.js` 中实现 `scheduleUpdateOnFiber`

```js
// src/react-reconciler/src/ReactFiberWorkLoop.js

import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';

// 正在进行中的工作，也就是正在计算中的fiber
let workInProgress = null;

/**
 * @description 在fiber上调度更新 也就是计划更新root
 * 源码中此处有一个任务的功能，这里后续再实现
 * @param root 根节点
 */
export function scheduleUpdateOnFiber(root) {
  // 确保调度执行root上的更新
  ensureRootIsScheduled(root);
}

/**
 * @description 确保执行root上的更新
 */
function ensureRootIsScheduled(root) {
  performConcurrentWorkOnRoot.bind(null, root)();
}

/**
 * @description 执行root上的并发更新工作
 * @description 根据虚拟DOM构建fiber树,要创建真实的DOM节点
 * @description 还需要把真实的DOM节点插入容器
 * @param root 根节点
 */
function performConcurrentWorkOnRoot(root) {
  //第一次渲染以同步的方式渲染根节点，初次渲染的时候，都是同步
  renderRootSync(root);
}

/**
 * @description 渲染方法
 */
function renderRootSync(root) {
  //开始构建fiber树
  prepareFreshStack(root);
  // 开启工作循环
  workLoopSync();
}

/**
 * @description 根据老的fiber树创建一个全新的fiber树，后续用于替换掉老的fiber树
 */
function prepareFreshStack(root) {
  // 创建一个workInProgress（执行中的工作）
  workInProgress = createWorkInProgress(root.current, null);
}

/**
 * @description 同步模式的工作循环方法
 */
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
```

上面👆这段实现中没有什么具体逻辑，主要逻辑在下面👇这两个方法中

- `prepareFreshStack(root)`
  - 根据老的`fiber`树创建一个全新的`fiber`树，后续用于替换掉老的`fiber`树
  - 将新的`fiber`树赋值给`workInProgress`用作于后续工作循环中的计算
- `workLoopSync()`
  - 开启工作循环中执行工作单元`performUnitOfWork(workInProgress)`

<!--这个全局变量`workInProgress`很重要，它贯穿了整个工作循环-->

### 三、fiber的双缓冲

在实现`prepareFreshStack(root)` 中的 `createWorkInProgress`之前，再看下`fiber`树的结构示意图👇

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/renderFiber1_1664076149659.jpg" alt="img" style="zoom:50%;" />

可以发现有两个 `HostRootFiber`，并且两个 `HostRootfiber` 通过 `alternate` 属性互相指向；

`HostRootFiber` 是根 `fiber`，就是最顶端的那个 `fiber`，既然 `HostRootFiber` 有两个，那就意味着 `fiber` 树应当也有两个，另外也可以发现 `FiberRootNode` 是和其中的一个 `HostRootFiber` 是互相指向的；

这里是应用了双缓冲技术，也就是有两个 `fiber` 树，

- 一个用于展示（与 `FiberRootNode` 互相指向的）
  - 对应页面上的真实DOM元素，代表当前已经渲染渲染完成 `fiber`
- 一个用于渲染计算
  - ==对应的是正在构建中的新的 `fiber` 树，表示还没有生效，没有更新到DOM上 `fiber` 树==

两个 `fiber` 树互相进行交替，`FiberRootNode` 会在两个fiber树上来回进行切换

这么做的好处在于类似于屏幕渲染时，下一帧在渲染到屏幕上前就已经绘制好了

------

在 `src/react-reconciler/src/ReactFiber.js` 中实现 `createWorkInProgress`

```js
/**
 * @description 基于老的fiber和新的属性创建新的fiber
 * @param current 老fiber
 * @param pendingProps 新属性
 */
export function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key
    );
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
  }
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  return workInProgress;
}

```

`createWorkInProgress` 就是基于老的 `fiber` 和新的属性创建新的 `fiber`

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/prepareFreshStack_1664040902497.png" alt="img" style="zoom:50%;" />

### 四、实现工作循环

在 `src/react-reconciler/src/ReactFiberWorkLoop.js` 中实现 `performUnitOfWork`

```js
// src/react-reconciler/src/ReactFiberWorkLoop.js

/**
 * @description 执行一个工作单元
 * @param unitOfWork 新fiber树 unitOfWork.alternate为老fiber
 */
function performUnitOfWork(unitOfWork) {
  //获取老fiber
  const current = unitOfWork.alternate;

  const next = beginWork(current, unitOfWork);

  //完成当前fiber的子fiber链表构建后，将等待生效的props标记为已经生效的props
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next === null) {
    //如果没有子节点表示当前的fiber已经完成了
    completeUnitOfWork(unitOfWork);
  } else {
    //如果有子节点，就让子节点成为下一个工作单元
    workInProgress = next;
  }
}
```

上面👆这段实现中的核心逻辑在于 `beginWork` 和 `completeUnitOfWork`，==执行单个 `fiber` 节点对应的执行任务单元并返回下一个执行单元，若没有返回下一个执行单元，则说明当前 `fiber` 节点已经全部完成了==；

工作循环的目的就是深度遍历整个 `fiber` 树，将每个 `fiber` 节点都当作是一个工作单元；

看下下面👇整个工作循环的示意图，可以先简单了解下整个工作循环的步骤

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/di_gui_gou_jian_fiber_shu_1664076989593-20230210000837525.jpg)

<!--关于fiber的工作循环，在04、理解fiber这篇笔记中有一段简短的实现，也可以先看那里，方便理解-->

------

### 五、实现beginWork

在 `src/react-reconciler/src/ReactFiberBeginWork.js` 中实现 `beginWork`

```js
// src/react-reconciler/src/ReactFiberBeginWork.js

import logger, { indent } from 'shared/logger';
import { HostComponent, HostRoot, HostText } from './ReactWorkTags';

/**
 * @description 目标是根据新虚拟DOM构建新的fiber子链表 .child .sibling
 * @param current 老fiber
 * @param workInProgress 新的fiber h1
 * @returns
 */
export function beginWork(current, workInProgress) {
  // 打印workInProgress
  logger(' '.repeat(indent.number) + 'beginWork', workInProgress);
  indent.number += 2;

  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
      return null;
    default:
      return null;
  }
}
```

==`beginWork` 的目标是根据新虚拟DOM构建新的`fiber`子链表==，但上面👆没有具体的实现逻辑，主要就是根据`fiber`的`tag`类型，调用对应的`fiber`更新方法，核心逻辑就在这些更新方法中<!-- DOM diff、根据VDom生成fiber等就是在这些更新方法中做的-->

另外需要注意⚠️的是，`beginWork`中构建并返回的是子`fiber`；

工作循环的目的就是深度遍历整个 `fiber` 树，所以`beginWork`首先处理的便是`HostRootfiber`（`tag`为`3`），那么接下来首先实现**根`fiber`类型**的更新方法`updateHostRoot`👇

#### 5.1、实现**根`fiber`类型**的更新方法`updateHostRoot`

```js
// src/react-reconciler/src/ReactFiberBeginWork.js

import { processUpdateQueue } from './ReactFiberClassUpdateQueue';

/**
 * @description 构建根fiber的子fiber链表
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber h1
 */
function updateHostRoot(current, workInProgress) {
    //根据老状态和更新队列中的更新计算最新的状态
  processUpdateQueue(workInProgress);

  // 拿到最新的状态 workInProgress.memoizedState={ element }
  const nextState = workInProgress.memoizedState;

  // nextChildren就是新的子虚拟DOM
  const nextChildren = nextState.element; //h1

  // 根据新的虚拟DOM生成子fiber链表 DOM diff就在这里做的
  reconcileChildren(current, workInProgress, nextChildren);

  return workInProgress.child; //{tag:5,type:'h1'}
}
```

上面👆这段实现的核心在于：

- `processUpdateQueue(workInProgress)` 根据老状态和更新队列中的更新计算最新的状态 `nextState`<!--其实就是对象合并-->

- `reconcileChildren(current, workInProgress, nextChildren)` ：

  根据新的虚拟DOM（`nextChildren` 也就是`workInProgress.memoizedState.element`）生成子`fiber`链表，并将子`fiber`链表挂到新的`fiber`上（`workInProgress.child`）

------

首先在 `src/react-reconciler/src/ReactFiberClassUpdateQueue.js` 中实现更新单个 `fiber` 上的更新队列的处理方法 `processUpdateQueue`

```js
/**
 * @description 根据老状态和更新队列中的更新计算最新的状态
 * @param workInProgress 新fiber 要计算的fiber
 */
export function processUpdateQueue(workInProgress) {
  // 拿到更新队列
  const queue = workInProgress.updateQueue;
  const pendingQueue = queue.shared.pending;

  //如果有更新，或者说更新队列里有内容
  if (pendingQueue !== null) {
    //清除等待生效的更新
    queue.shared.pending = null;

    //获取更新队列中最后一个更新 update ={payload:{element:'h1'}}
    const lastPendingUpdate = pendingQueue;
    //指向第一个更新
    const firstPendingUpdate = lastPendingUpdate.next;
    //把更新链表剪开，变成一个单链表
    lastPendingUpdate.next = null;

    //获取老状态 初次渲染时为null
    let newState = workInProgress.memoizedState;
    // 将更新队列中的第一个更新赋值给update
    let update = firstPendingUpdate;

    // 这里循环遍历更新队列，直到所有更新对象都处理完成
    while (update) {
      //根据老状态和更新计算新状态
      newState = getStateFromUpdate(update, newState);
      update = update.next;
    }

    //将最终计算完成的更新状态赋值给memoizedState
    workInProgress.memoizedState = newState;
  }
}


/**
 * state=0 update=>1 update=2
 * @description 根据老状态和更新计算新状态，其实就是合并更新对象
 * @param update 新的更新对象 更新的对象其实有很多种类型
 * @param prevState 旧的更新对象
 */
function getStateFromUpdate(update, prevState) {
  switch (update.tag) {
    case UpdateState:
      const { payload } = update;
      return assign({}, prevState, payload);
  }
}

```

上面👆这段实现的逻辑简单理解就是将当前`fiber`节点上的更新队列中==所有的更新对象（update）进行合并==得到一个最终的更新状态并挂到当前`fiber`节点的`memoizedState`属性上

再看下更新队列的示意图：

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/queuepending_1644750048819.png" alt="img" style="zoom:50%;" />

------

然后再在 `src/react-reconciler/src/ReactFiberBeginWork.js` 中实现根据VDom生成 `fiber` 的方法 `reconcileChildren`

```js
// src/react-reconciler/src/ReactFiberBeginWork.js

import {
  mountChildFibers,
  reconcileChildFibers
} from './ReactChildFiber';

/**
 * @description 协调子fiber 根据新的虚拟DOM生成新的Fiber链表
 * @param current 老的父Fiber
 * @param workInProgress 新的父Fiber
 * @param nextChildren 新的子虚拟DOM
 */
function reconcileChildren(current, workInProgress, nextChildren) {
  /*
    如果此fiber没能对应的老fiber,说明此fiber是新创建的，
    如果这个父fiber是新的创建的，它的儿子们也肯定都是新创建的
   */
  if (current === null) {
    // workInProgress.child = mountChildFibers(
    //   workInProgress,
    //   null,
    //   nextChildren
    // );
  } else {
    /*
      如果说有老Fiber的话，做DOM-DIFF
      拿老的子fiber链表和新的子虚拟DOM进行比较，进行最小化的更新
    */
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren
    );
  }
}
```

👆这段实现中，注意这里

```js
workInProgress.child = ...
```

`workInProgress`是父`fiber`，==这里是在为父`fiber`添加子`fiber`，父`fiber`的`child`属性指向新创建的子`fiber`==

<!--此时的`workInProgress`是新的fiber树的HostRootFiber，所以HostRootFiber的子fiber就是在这里挂到它的child属性上的-->

另外，初次挂载时，双缓存的两棵`fiber`树都是只有`HostRootfiber`这一个根`fiber`节点，也就是说老父`fiber`和新父`fiber`都是有的，也就是`HostRootfiber`

先看`reconcileChildFibers`的实现👇

```js
// src/react-reconciler/src/ReactChildFiber.js

import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import {
  createFiberFromElement,
} from './ReactFiber';

/**
 * @description 返回协调子fiber的方法
 * @param shouldTrackSideEffects 是否跟踪副作用
 */
function createChildReconciler(shouldTrackSideEffects) {
  /**
   * @description 根据虚拟DOM创建fiber
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstFiber 老的父fiber第一个子fiber
   * @param {*} newChild 新的子虚拟DOM
   */
  function reconcileSingleElement(
    returnFiber,
    currentFirstFiber,
    element
  ) {
    /*
      初次挂载时，老fiber节点currentFirstFiber肯定是没有的
      所以可以直接根据虚拟DOM创建新的Fiber节点
    */
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  /**
   * 设置副作用
   * @param newFiber 新的子fiber
   */
  function placeSingleChild(newFiber) {
    //说明要添加副作用
    if (shouldTrackSideEffects) {
      /*
        要在最后的提交阶段插入此节点
        React渲染分成渲染(创建Fiber树)和提交(更新真实DOM)二个阶段
      */
      newFiber.flags |= Placement;
    }
    return newFiber;
  }

  /**
   * 协调比较子Fibers 就是用老的子fiber链表和新的虚拟DOM进行比较的过程
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstFiber 老的父fiber第一个子fiber
   * @param {*} newChild 新的子虚拟DOM
   */
  function reconcileChildFibers(
    returnFiber,
    currentFirstFiber,
    newChild
  ) {
    //现在暂时只考虑新的节点只有一个的情况
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(
              returnFiber,
              currentFirstFiber,
              newChild
            )
          );
        default:
          break;
      }
    }
    return null;
  }

  return reconcileChildFibers;
}

//有老父fiber更新的时候用这个
export const reconcileChildFibers = createChildReconciler(true);
```

上面这段实现中主要做了两件事：

- `reconcileSingleElement`根据虚拟DOM生成子`fiber`

  ```js
   function reconcileSingleElement(
      returnFiber,
      currentFirstFiber,
      element
    ) {
      /*
        初次挂载时，老fiber节点currentFirstFiber肯定是没有的
        所以可以直接根据虚拟DOM创建新的Fiber节点
      */
      const created = createFiberFromElement(element);
      created.return = returnFiber;
      return created;
    }
  ```

  将该==子`fiber`的`return`属性指向其父`fiber`==，到这里就完成了父`fiber`和子`fiber`的相互指向了

- <!--设置副作用`placeSingleChild(newFiber)`暂时不用了解-->

------

那接下来看下创建子`fiber`的方法`createFiberFromElement`的实现👇

```js
// src/react-reconciler/src/ReactFiber.js

/**
 * 根据虚拟DOM创建Fiber节点
 * @param element 虚拟DOM
 */
export function createFiberFromElement(element) {
  const { type, key, props: pendingProps } = element;
  // 这里将VDom的props属性赋值给了对应fiber的pendingProps，表示等待处理或者生效的属性
  return createFiberFromTypeAndProps(type, key, pendingProps);
}

function createFiberFromTypeAndProps(type, key, pendingProps) {
  // 默认tag是未定类型
  let tag = IndeterminateComponent;

  //如果类型type是一字符串 span div ，说此此Fiber类型是一个原生组件
  if (typeof type === 'string') {
    tag = HostComponent;
  }

  // 创建fiber
  const fiber = createFiber(tag, pendingProps, key);
  fiber.type = type;
  return fiber;
}
```

👆这里的逻辑也不复杂就是根据VDom这个js对象创建`fiber`这个js对象

⚠️这里需要注意的是，==VDom的`props`属性是赋值给了对应`fiber`的`pendingProps`属性==，表示等待处理或者生效的属性<!--VDom的props属性中包含了children等属性，也就是当前VDom节点的子VDom节点，是个数组-->

------

现在以上面`HostRoot`类型的`HostRootFiber`为例子顺一遍整个工作循环中`beginWork`的逻辑

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230208212236008.png" alt="image-20230208212236008" style="zoom:50%;" />

所以`beginWork`中主要实现了以下逻辑

1. 合并单个`fiber`工作单元上的更新内容，生成`VDom`
2. 根据`VDom`生成子`fiber`并返回

------

`beginWork`处理完`HostRootFiber`之后，看下返回的子`fiber`长什么样👇，可以发现`return`属性指向的`fiber`的`tag`正是`HostRoot`类型

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230209212245374.png" alt="image-20230209212245374" style="zoom:50%;" />

再对比之前更新队列中存储的VDom <!--注意VDom的children是存在fiber的pendingProps上-->

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230208162735984.png" alt="image-20230208162735984" style="zoom:50%;" />

可以发现此子`fiber`正是`h1`这个`dom`节点对应的`fiber`，那就说明此时完成了下面👇`fiber`树中`h1`这个`fiber`节点的构建

![image-20230209212534873](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230209212534873.png)



~~到这里算是一个完成的执行单元的流程了，`beginWork`执行当前的`fiber`工作单元并返回子`fiber`，深度遍历直到整个`fiber`树都完成计算。<!--生成真实DOM和挂载还没实现，不过架子搭出来了-->~~

那么接下来继续完成`fiber`树剩下部分的构建👇

#### 5.2、实现原生节点类型的更新方法`updateHostComponent`

`updateHostComponent`的实现和上面`updateHostRoot`的实现类似

首先回顾下`performUnitOfWork`

```js
// src/react-reconciler/src/ReactFiberWorkLoop.js

/**
 * @description 执行一个工作单元
 * @param unitOfWork 新fiber树 unitOfWork.alternate为老fiber
 */
function performUnitOfWork(unitOfWork) {
  //获取老fiber
  const current = unitOfWork.alternate;

  const next = beginWork(current, unitOfWork);

  //完成当前fiber的子fiber链表构建后，将等待生效的props标记为已经生效的props
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next === null) {
    //如果没有子节点表示当前的fiber已经完成了
    completeUnitOfWork(unitOfWork);
  } else {
    //如果有子节点，就让子节点成为下一个工作单元
    workInProgress = next;
  }
}
```

`beginWork`处理完`HostRootFiber`之后返回的子`fiber`被赋值了全局变量`workInProgress`，那么工作循环继续，接下来`beginWork`要处理的就是`HostRootFiber`之后返回的子`fiber`（`h1`的`fiber`节点）

注意⚠️这里的`const current = unitOfWork.alternate;`由于当前`fiber`（`unitwork`）是`h1`的`fiber`节点，所以`unitOfWork.alternate`为`null` <!--只有HostRootFiber才有alternate属性-->

------

再看下`beginWork`

```js
// src/react-reconciler/src/ReactFiberBeginWork.js

import logger, { indent } from 'shared/logger';
import { HostComponent, HostRoot, HostText } from './ReactWorkTags';

/**
 * @description 目标是根据新虚拟DOM构建新的fiber子链表 .child .sibling
 * @param current 老fiber
 * @param workInProgress 新的fiber h1
 * @returns
 */
export function beginWork(current, workInProgress) {
  // 打印workInProgress
  logger(' '.repeat(indent.number) + 'beginWork', workInProgress);
  indent.number += 2;

  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
      return null;
    default:
      return null;
  }
}
```

此时的`workInProgress.tag`便是`HostComponent`类型（5），所以执行`updateHostComponent`

------

在 `src/react-reconciler/src/ReactFiberBeginWork.js` 中创建`updateHostComponent`

```jsx
/**
 * @description 构建原生组件的子fiber链表
 * @param current 老fiber
 * @param workInProgress 新fiber
 */
function updateHostComponent(current, workInProgress) {
  const { type } = workInProgress;
  // 当前fiber的pendingProps是对应VDom的props属性，其中包含了children属性
  const nextProps = workInProgress.pendingProps;
  let nextChildren = nextProps.children;

  //判断当前虚拟DOM它的儿子是不是一个文本独生子
  const isDirectTextChild = shouldSetTextContent(type, nextProps);
  if (isDirectTextChild) {
    nextChildren = null;
  }

  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}
```

```jsx
// src/react-dom-bindings/src/client/ReactDOMHostConfig.js

export function shouldSetTextContent(type, props) {
  return typeof props.children === "string" || typeof props.children === "number";
}
```

`updateHostComponent`中做了以下几件事：

- 从父`fiber`上获取到子VDom（`workInProgress.pendingProps.children`）
- 优化处理子VDom只是一个文本的情况，直接将`nextChildren`置空，后续调和过程不会创建子`fiber`
- 调和子VDom，创建子`fiber`

------

再看`reconcileChildren`

```jsx
// src/react-reconciler/src/ReactFiberBeginWork.js

import {
  mountChildFibers,
  reconcileChildFibers
} from './ReactChildFiber';

/**
 * @description 协调子fiber 根据新的虚拟DOM生成新的Fiber链表
 * @param current 老的父Fiber
 * @param workInProgress 新的父Fiber
 * @param nextChildren 新的子虚拟DOM
 */
function reconcileChildren(current, workInProgress, nextChildren) {
  /*
    如果此fiber没能对应的老fiber,说明此fiber是新创建的，
    如果这个父fiber是新的创建的，它的儿子们也肯定都是新创建的
   */
  if (current === null) {
      workInProgress.child = mountChildFibers(
        workInProgress,
        null,
        nextChildren
      );
  } else {
    /*
      如果说有老Fiber的话，做DOM-DIFF
      拿老的子fiber链表和新的子虚拟DOM进行比较，进行最小化的更新
    */
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren
    );
  }
}
```

由于在`performUnitOfWork`那里取值的`current`为`null`，所以这里会走到`mountChildFibers`中

------

在 `src/react-reconciler/src/ReactChildFiber.js` 中实现 `mountChildFibers`

```jsx
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import {
  createFiberFromElement,
  createFiberFromText
} from './ReactFiber';
import { Placement } from './ReactFiberFlags';
import isArray from 'shared/isArray';

/**
 * @description 返回协调子fiber的方法
 * @param shouldTrackSideEffects 是否跟踪副作用
 */
function createChildReconciler(shouldTrackSideEffects) {

  /**
   * @description 根据虚拟DOM创建fiber（新的子节点有多个，是个数组的情况）
   * @param {*} returnFiber 新的父Fiber
   * @param {*} newChild 新的子虚拟DOM
   */
  function createChild(returnFiber, newChild) {
    if (
      (typeof newChild === 'string' && newChild !== '') ||
      typeof newChild === 'number'
    ) {
      const created = createFiberFromText(`${newChild}`);
      created.return = returnFiber;
      return created;
    }
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(newChild);
          created.return = returnFiber;
          return created;
        }
        default:
          break;
      }
    }
    return null;
  }

  /**
   * 设置副作用
   * @param newFiber 新的子fiber
   * @param newIdx 新的子fiber对应的VDom节点在children中的索引
   */
  function placeChild(newFiber, newIdx) {
    newFiber.index = newIdx;
    if (shouldTrackSideEffects) {
      //如果一个fiber它的flags上有Placement,说明此节点需要创建真实DOM并且插入到父容器中
      //如果父fiber节点是初次挂载，shouldTrackSideEffects=false,不需要添加flags
      //这种情况下会在完成阶段把所有的子节点全部添加到自己身上
      newFiber.flags |= Placement;
    }
  }

  /**
   * @description 根据虚拟DOM创建fiber（新的子节点有多个，是个数组的情况）
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstFiber 老的父fiber第一个子fiber
   * @param {*} newChild 新的子虚拟DOM
   */
  function reconcileChildrenArray(
    returnFiber,
    currentFirstFiber,
    newChildren
  ) {
    let resultingFirstChild = null; //返回的第一个新儿子
    let previousNewFiber = null; //上一个的一个新的fiber
    let newIdx = 0;

    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx]);
      if (newFiber === null) continue;
      placeChild(newFiber, newIdx);

      //如果previousNewFiber为null，说明这是第一个fiber
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber; //这个newFiber就是大儿子
      } else {
        //否则说明不是大儿子，就把这个newFiber添加上一个子节点后面
        previousNewFiber.sibling = newFiber;
      }

      //让newFiber成为最后一个或者说上一个子fiber
      previousNewFiber = newFiber;
    }

    return resultingFirstChild;
  }

  /**
   * 协调比较子Fibers 就是用老的子fiber链表和新的虚拟DOM进行比较的过程
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstFiber 老的父fiber第一个子fiber
   * @param {*} newChild 新的子虚拟DOM
   */
  function reconcileChildFibers(
    returnFiber,
    currentFirstFiber,
    newChild
  ) {
    //新的子虚拟DOM只有一个节点的情况
    // ...

    /*
      新的子节点有多个的情况
      newChild是个数组 [hello文本节点,span虚拟DOM元素]
    */
    if (isArray(newChild)) {
      return reconcileChildrenArray(
        returnFiber,
        currentFirstFiber,
        newChild
      );
    }
    return null;
  }
  return reconcileChildFibers;
}

//如果没有老父fiber,初次挂载的时候用这个
export const mountChildFibers = createChildReconciler(false);

```

上面这段实现中做的事情是`reconcileChildrenArray` 调和`Children`

------

看下`reconcileChildrenArray` 的实现👇

```jsx
  /**
   * @description 根据虚拟DOM创建fiber（新的子节点有多个，是个数组的情况）
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstFiber 老的父fiber第一个子fiber
   * @param {*} newChild 新的子虚拟DOM
   */
  function reconcileChildrenArray(
    returnFiber,
    currentFirstFiber,
    newChildren
  ) {
    let resultingFirstChild = null; //返回的第一个新儿子
    let previousNewFiber = null; //上一个的一个新的fiber
    let newIdx = 0;

    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx]);
      if (newFiber === null) continue;
      placeChild(newFiber, newIdx);

      //如果previousNewFiber为null，说明这是第一个fiber
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber; //这个newFiber就是大儿子
      } else {
        //否则说明不是大儿子，就把这个newFiber添加上一个子节点后面
        previousNewFiber.sibling = newFiber;
      }

      //让newFiber成为最后一个或者说上一个子fiber
      previousNewFiber = newFiber;
    }

    return resultingFirstChild;
  }
```

上面这段实现主要做了以下事情：

- 遍历`children`，让每个`child`都生成一个对应的`fiber`（执行`createChild`方法）
- <!--设置副作用`placeChild(newFiber, newIdx)`暂时不用了解-->
- 让第一个`child`对应的`fiber`作为返回值，其余`child`的`fiber`按照顺序挂到前一个`fiber`的`sibling`属性上，<!--这么做是为了后续通过第一个子fiber找到剩余的其他子fiber，也就是兄弟fiber-->

注意⚠️这里的返回值是在前面的`reconcileChildren`中使用的，也就是==将第一个`child`对应的`fiber`挂到父`fiber`的`child`属性上==

```jsx
function reconcileChildren(current, workInProgress, nextChildren) {
  if (current === null) {
      workInProgress.child = mountChildFibers(
        workInProgress,
        null,
        nextChildren
      );
  } else {
    //
  }
}
```

------

看下`createChild`的实现

```jsx
/**
 * @description 根据虚拟DOM创建fiber（新的子节点有多个，是个数组的情况）
 * @param {*} returnFiber 新的父Fiber
 * @param {*} newChild 新的子虚拟DOM
 */
function createChild(returnFiber, newChild) {
  if (
    (typeof newChild === 'string' && newChild !== '') ||
    typeof newChild === 'number'
  ) {
    const created = createFiberFromText(`${newChild}`);
    created.return = returnFiber;
    return created;
  }
  if (typeof newChild === 'object' && newChild !== null) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE: {
        const created = createFiberFromElement(newChild);
        created.return = returnFiber;
        return created;
      }
      default:
        break;
    }
  }
  return null;
}
```

上面这段实现中做的就是根据`child`的类型调用不同的创建`fiber`的方法

需要注意⚠️的是==每一个`child`的`fiber`都添加了`return`属性指向同一个父`fiber`==

------

在`src/react-reconciler/src/ReactFiber.js`中实现并导出`createFiberFromText`

```jsx
export function createFiberFromText(content) {
  return createFiber(HostText, content, null);
}
```

------

到这里`h1`这个`fiber`的子fiber链便构建完成了，打印看下结果

![image-20230209234728217](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230209234728217.png)

可以看到这个子`fiber`正是`text(hello)`这个`dom`节点对应的`fiber`，其`return`属性指向`h1`的`fiber`，其`sibling`属性指向的是其兄弟`dom`节点`span(world)` 对应的`fiber`

也就是完成了下面👇`text(hello)`和`span(world)` 这两个`fiber`的构建

![image-20230209235353946](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230209235353946.png)

------

`beginWork`的实现就先到这里，再看下下面👇递归构建`fiber`树的示意图，所以接下来就是要完成`completeWork`的实现

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/di_gui_gou_jian_fiber_shu_1664076989593.jpg)

### 六、实现completeUnitOfWork

首先回顾下`performUnitOfWork`

```js
// src/react-reconciler/src/ReactFiberWorkLoop.js

/**
 * @description 执行一个工作单元
 * @param unitOfWork 新fiber树 unitOfWork.alternate为老fiber
 */
function performUnitOfWork(unitOfWork) {
  //获取老fiber
  const current = unitOfWork.alternate;

  const next = beginWork(current, unitOfWork);

  //完成当前fiber的子fiber链表构建后，将等待生效的props标记为已经生效的props
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next === null) {
    //如果没有子节点表示当前的fiber已经完成了
    completeUnitOfWork(unitOfWork);
  } else {
    //如果有子节点，就让子节点成为下一个工作单元
    workInProgress = next;
  }
}
```

`beginWork`处理完`h1`这个`fiber`之后，`text(hello)`这个`fiber`被赋值了全局变量`workInProgress`，那么工作循环继续，接下来`beginWork`要处理的就是`text(hello)`，但是由于`text(hello)`没有子`fiber`，所以便要`completeUnitOfWork`完成`text(hello)`这个工作单元

在`src/react-reconciler/src/ReactFiberWorkLoop.js`中实现`completeUnitOfWork`

```jsx
/**
 * @description 完成一个工作单元的执行
 * @param unitOfWork 正在计算中的fiber
 */
function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    //执行此fiber 的完成工作,如果是原生组件的话就是创建真实的DOM节点
    completeWork(current, completedWork);

    //如果有弟弟，就构建弟弟对应的fiber子链表
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }

    //如果没有弟弟，说明这当前完成的就是父fiber的最后一个节点
    //也就是说一个父fiber,所有的子fiber全部完成了
    completedWork = returnFiber;
    workInProgress = completedWork;

  } while (completedWork !== null);
}
```

`completeUnitOfWork`主要做了以下几件事

- 完成当前工作单元`completeWork`
- 若当前工作单元有`siblingFiber`，则将`siblingFiber`赋值给全局变量`workInProgress`，`performUnitOfWork`执行此`siblingFiber`
- 若当前工作单元没有有`siblingFiber`，则将当前工作单元的父`fiber`赋值给全局变量`workInProgress`，`performUnitOfWork`执行父`fiber`

`beginWork`和`completeUnitOfWork`完成了`fiber`树的深度遍历

------

在 `src/react-reconciler/src/ReactFiberCompleteWork.js` 中实现并导出`completeWork`

```jsx
import logger, { indent } from "shared/logger";
import {
  createTextInstance,
  createInstance,
  appendInitialChild,
  finalizeInitialChildren
} from 'react-dom-bindings/src/client/ReactDOMHostConfig';
import { NoFlags } from './ReactFiberFlags';
import { HostComponent, HostRoot, HostText } from './ReactWorkTags';

/**
 * 完成一个fiber节点
 * @param {*} current 老fiber
 * @param {*} workInProgress 新的构建的fiber
 */
export function completeWork(current, workInProgress) {
  indent.number -= 2;
  logger(' '.repeat(indent.number) + 'completeWork', workInProgress);

  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    // 根fiber
    case HostRoot:
      // 向上冒泡属性
      bubbleProperties(workInProgress);
      break;
    // 原生节点的fiber
    case HostComponent:
      // 现在只是在处理创建或者说挂载新节点的逻辑，后面此处分进行区分是初次挂载还是更新

      // 创建真实的DOM节点
      const { type } = workInProgress;
      const instance = createInstance(type, newProps, workInProgress);

      // 把自己所有的儿子都添加到自己的身上
      appendAllChildren(instance, workInProgress);

      // 将真实DOM挂到当前 fiber 的 stateNode 上
      workInProgress.stateNode = instance;

      // 完成真实DOM的构建
      finalizeInitialChildren(instance, type, newProps);

      // 向上冒泡属性
      bubbleProperties(workInProgress);
      break;
    // 文本节点的fiber
    case HostText:
      // 如果完成的 fiber 是文本节点，那就创建真实的文本节点
      const newText = newProps;
      // 创建真实的DOM节点并传入 stateNode
      workInProgress.stateNode = createTextInstance(newText);
      // 向上冒泡属性
      bubbleProperties(workInProgress);
      break;
  }
}
```

上面👆这段实现的主要内容便是完成==从`fiber`对应**真实Dom**的构建，最终将**真实Dom**添加到`fiber`的`stateNode`属性上==

其中比较复杂的是原生节点的`fiber`处理，有以下几个步骤

- 创建**真实Dom节点** `createInstance`
- 将当前**fiber**的所有子节点对应的**真实Dom**都追加到当前**fiber**的**真实Dom**上 `appendAllChildren` <!--这个比较重要-->
- 完成真实DOM的构建`finalizeInitialChildren`
- 向上冒泡属性 `bubbleProperties` ，每个**fiber**节点上都有**flags**属性（用于记录自己的副作用）和`subtreeFlags`属性（用于记录所有子**fiber**的副作用）

------

在 `src/react-dom-bindings/src/client/ReactDOMHostConfig.js` 中实现并导出创建**真实Dom**的方法

```jsx
export function createTextInstance(content) {
  return document.createTextNode(content);
}

export function createInstance(type) {
  const domElement = document.createElement(type);
  //updateFiberProps(domElement, props);
  return domElement;
}
```

------

实现`appendAllChildren`

```jsx
// src/react-reconciler/src/ReactFiberCompleteWork.js

/**
 * 把当前的完成的fiber所有的子节点对应的真实DOM都挂载到自己父parent真实DOM节点上
 * @param {*} parent 当前完成的fiber真实的DOM节点
 * @param {*} workInProgress 完成的fiber
 */
function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child;
  while (node) {
    if (node.tag === HostComponent || node.tag === HostText) {
      //如果子节点类型是一个原生节点或者是一个文件节点
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      //如果第一个儿子不是一个原生节点，说明它可能是一个函数组件
      node = node.child;
      continue;
    }

    if (node === workInProgress) {
      return;
    }

    //如果当前的节点没有弟弟
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      //回到父节点
      node = node.return;
    }

    node = node.sibling;
  }
}
```

```jsx
// src/react-dom-bindings/src/client/ReactDOMHostConfig.js
export function appendInitialChild(parent, child) {
  parent.appendChild(child);
}
```

上面👆这段实现的核心在于当前`fiber`只处理自己的子`fiber`（原生节点对应的`fiber`），将所有子`fiber`的**真实Dom节点**都追加到自己的**真实Dom**上，不会处理子`fiber`的子`fiber`；

这是因为遍历`fiber`树时，是从下往上`competeUnitWork`的，也就是说，子`fiber`的子`fiber`对应的**真实Dom节点**，在子`fiber`完成时就已经挂到了子`fiber`的**真实Dom**上了

------

实现 `finalizeInitialChildren`

```jsx
// src/react-dom-bindings/src/client/ReactDOMHostConfig.js
export function finalizeInitialChildren(domElement, type, props) {
  setInitialProperties(domElement, type, props);
}

```

```jsx
// src/react-dom-bindings/src/client/ReactDOMComponent.js
import { setValueForStyles } from './CSSPropertyOperations';
import setTextContent from './setTextContent';
import { setValueForProperty } from './DOMPropertyOperations';
const STYLE = 'style';
const CHILDREN = 'children';

function setInitialDOMProperties(tag, domElement, nextProps) {
  for (const propKey in nextProps) {
    if (nextProps.hasOwnProperty(propKey)) {
      const nextProp = nextProps[propKey];
      if (propKey === STYLE) {
        setValueForStyles(domElement, nextProp);
      } else if (propKey == CHILDREN) {
        if (typeof nextProp === 'string') {
          setTextContent(domElement, nextProp);
        } else if (typeof nextProp === 'number') {
          setTextContent(domElement, `${nextProp}`);
        }
      } else if (nextProp !== null) {
        setValueForProperty(domElement, propKey, nextProp);
      }
    }
  }
}

export function setInitialProperties(domElement, tag, props) {
  setInitialDOMProperties(tag, domElement, props);
}

```

上面👆这段实现没有什么复杂的，就是将`fiber`节点上`props`中的属性添加给真实Dom节点

------

实现 `bubbleProperties`

```jsx
// src/react-reconciler/src/ReactFiberCompleteWork.js

/**
 * @description 向上冒泡属性
 * @param completedWork 已完成的fiber
 */
function bubbleProperties(completedWork) {
  let subtreeFlags = NoFlags;
  //遍历当前fiber的所有子节点，把所有的子节的副作用，以及子节点的子节点的副作用全部合并
  let child = completedWork.child;
  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;
    child = child.sibling;
  }
  completedWork.subtreeFlags = subtreeFlags;
}

```

上面这段实现是为了将当前`fiber`的所有的子节的副作用，以及子节点的子节点的副作用全部合并，最终挂到自己的`subtreeFlags`属性上

### 七、实现效果

到这里整个调和更新就基本完成了，那么接下来看下实现效果👇

`jsx`

```jsx
let element = (
  <h1>
    hello<span style={{ color: "red" }}>world</span>
  </h1>
)
```

递归构建`fiber`树的示意图

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/di_gui_gou_jian_fiber_shu_1664076989593-20230210230131488.jpg)

工作循环中的日志打印

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230210230612794.png" alt="image-20230210230612794" style="zoom:50%;" />

可以发现打印结果和上面递归构建fiber树的示意图中的顺序是一致的

最后再看下`HostRootFiber`的打印结果

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230210231008418.png" alt="image-20230210231008418" style="zoom:50%;" />

可以发现真实`Dom`已经挂到`fiber`树上了

`fiber`树的创建已经完成了，那么接下来就是提交更新部分，完成真实Dom的挂载