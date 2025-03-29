## **React18** 源码解析（十三）**React** 中的 diff

### 一、前言

#### 1.1、**DOM** diff

虚拟 **DOM** 使得组件更新时不需要直接操作真实 **DOM**，只需要找出新旧虚拟 **DOM** 中需要更新的部分，并仅更新这些部分，做到**最小化 DOM 操作次数**，从而**提高页面的渲染效率**，这个找到需要更新部分的计算过程就是 **React** 的 `DOM diff`

**React** 组件更新过程可以分为两个阶段：

- **==增量更新阶段==**
  - 在增量更新阶段，React 会通过`diff`找到新旧虚拟 DOM 中差异的部分，并完成新`fiber`树的构建，但并不会对真实 DOM 进行任何修改 <!-- 主要在beginWork的reconcileChildFibers阶段-->
- ==**提交阶段**==
  - 在增量更新阶段结束后，React 会进入提交阶段，将变更应用到真实 DOM 上。在提交阶段中，React 会根据增量更新阶段生成的更新指令（每个`fiber`节点上的副作用标识`flag`、待删除的子`fiber`列表`deletions`）来对真实 DOM 进行修改，完成组件的更新 <!--commit阶段-->

`React diff` 算法的核心思想是**基于同层比较**。对于两棵不同的 `fiber` 树，`React diff` 会首先比较它们的根节点，如果两棵树的根节点不同，则 **React** 会直接替换整个节点及其子树。如果根节点相同，则 **React** 会依次比较子节点 <!--也是同层比较-->

按照新的 **VDom** 节点是否只有一个，**React** 中的 `diff` 可以分为**单节点 `diff`** 和**多节点 `diff`**

#### 1.2、打印副作用

为了直观的观察到 `DOM diff` 过程中的副作用信息，实现一个打印副作用的方法

在提交阶段打印新 `fiber` 树上的副作用

```js
function commitRoot(root) {
  const { finishedWork } = root;
  printFinishedWork(finishedWork);
 // ...
}
```

```js
function printFinishedWork(fiber) {
  const { flags, deletions } = fiber;
  if ((flags & ChildDeletion) !== NoFlags) {
    fiber.flags &= ~ChildDeletion;
    console.log(
      '子节点有删除' +
        deletions
          .map(fiber => `${fiber.type}#${fiber.memoizedProps.id}`)
          .join(',')
    );
  }
  let child = fiber.child;
  while (child) {
    printFinishedWork(child);
    child = child.sibling;
  }

  if (fiber.flags !== NoFlags) {
    console.log(
      getFlags(fiber),
      getTag(fiber.tag),
      typeof fiber.type === 'function' ? fiber.type.name : fiber.type,
      fiber.memoizedProps
    );
  }
}
function getFlags(fiber) {
  const { flags } = fiber;
  if (flags === (Placement | Update)) {
    return '移动';
  }
  if (flags === Placement) {
    return '插入';
  }
  if (flags === Update) {
    return '更新';
  }

  return flags;
}

function getTag(tag) {
  switch (tag) {
    case FunctionComponent:
      return 'FunctionComponent';
    case HostRoot:
      return 'HostRoot';
    case HostComponent:
      return 'HostComponent';
    case HostText:
      return 'HostText';
    default:
      return tag;
  }
}
```

### 二、单节点 diff

若新的节点只有一个的情况，`diff` 的流程如下图所示

![image-20230220223009926](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230220223009926.png)

核心思想就是通过 `key` 和 `type` 来判断是否有老 `fiber` 可以复用，有就直接复用老 `fiber`，没有就创建新 `fiber`

接下来就实现单节点的 `diff`

------

改造 `main.jsx`

```jsx
import * as React from 'react';
import { createRoot } from 'react-dom/client';

function FunctionComponent() {
  const [number, setNumber] = React.useState(0);
  return number === 0 ? (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="A" id="A">
        A
      </li>
      <li key="B" id="B">
        B
      </li>
      <li key="C" id="C">
        C
      </li>
    </ul>
  ) : (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="B" id="B2">
        B2
      </li>
    </ul>
  );
}
let element = <FunctionComponent />;
const root = createRoot(document.getElementById('root'));
root.render(element);

```

------

完善 `src/react-reconciler/src/ReactChildFiber.js` 中的 `reconcileChildFibers`

首先回顾下 `reconcileChildFibers` 方法

```js
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
  /*
    新的子节点有多个的情况
    newChild是个数组 [hello文本节点,span虚拟DOM元素]
  */
  // ...
}
```

当新的子VDom是个单节点时，会走到`reconcileSingleElement`中

```js
// src/react-reconciler/src/ReactChildFiber.js

/**
   * @description 根据虚拟DOM创建fiber（只有单个元素的情况下）
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstChild 老的父fiber第一个子fiber
   * @param {*} newChild 新的子虚拟DOM
   */
  function reconcileSingleElement(
    returnFiber,
    currentFirstChild,
    element
  ) {
    const key = element.key;
    let child = currentFirstChild;
    /*
      若更新时新的子虚拟DOM只有一个节点，且老的父fiber存在子fiber
      则需要从第一个子fiber开始，遍历老的父fiber的所有的子fiber
      判断是否有老的子fiber可以直接复用
    */
    while (child !== null) {
      //判断此老fiber对应的key和新的虚拟DOM对象的key是否一样 null===null
      if (child.key === key) {
        //判断老fiber对应的类型和新虚拟DOM元素对应的类型是否相同
        if (child.type === element.type) {
          //如果key一样，类型也一样，则认为此节点可以复用
          const existing = useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        }
      }
      child = child.sibling;
    }

    // 初次挂载时根据虚拟DOM创建新的Fiber节点
   //...
  }
```

再之前实现`useReducer`中，已经添加了直接复用老`fiber`的逻辑，接下来继续完善👇

```js
function reconcileSingleElement(
    returnFiber,
    currentFirstChild,
    element
  ) {
    const key = element.key;
    let child = currentFirstChild;
    while (child !== null) {
      //判断此老fiber对应的key和新的虚拟DOM对象的key是否一样 null===null
      if (child.key === key) {
        //判断老fiber对应的类型和新虚拟DOM元素对应的类型是否相同
        if (child.type === element.type) {
          // 如果key一样，类型也一样，则认为此节点可以复用,把其余老fiber删除
          deleteRemainingChildren(returnFiber, child.sibling);
          //直接复用老fiber
          const existing = useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        } else {
          //如果找到key一样老fiber但是类型不一样，不能复用此老fiber,把老fiber全部删除
          deleteRemainingChildren(returnFiber, child);
        }
      } else {
        // key不同则直接删除当前老fiber
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

  }

```

完善的逻辑入下面这张流程图所示👇

![image-20230220223009926](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230220223009926-20230221223345189.png)

------

实现删除老`fiber`节点的方法`deleteChild`

```js
/**
 * @description 在新的父fiber的deletions属性上记录下被删除的老的子fiber
 * @param returnFiber 新的父fiber
 * @param childToDelete 待删除的子fiber（老的）
 */
function deleteChild(returnFiber, childToDelete) {
  if (!shouldTrackSideEffects)
    return;
  const deletions = returnFiber.deletions;
  if (deletions === null) {
    returnFiber.deletions = [childToDelete]
    returnFiber.flags |= ChildDeletion;
  } else {
    returnFiber.deletions.push(childToDelete);
  }
}
```

有两部分内容：

- 记录待删除的老`fiber`

  - 由于是老的子`fiber`，新的父`fiber`只能通过`deletions`属性将其记录下来，待到了`commit`阶段根据`deletions`中的`fiber`将页面上对应的真实DOM节点直接删除 

    <!--不是真正意义上的删除，只是记录下来，不对老fiber树做任何操作，老fiber树上的这些fiber节点后面会自动被垃圾回收删除-->

- 给新的父`fiber`添加`ChildDeletion` `flag`标识

------

实现删除剩余老`fiber`的方法`deleteRemainingChildren`

```js
/**
 * @description 删除从currentFirstChild之后所有的fiber节点
 * @param returnFiber 新的父Fiber
 * @param currentFirstChild 老的父fiber第一个子fiber
 */
function deleteRemainingChildren(returnFiber, currentFirstChild) {
  if (!shouldTrackSideEffects)
    return;
  let childToDelete = currentFirstChild;
  while (childToDelete !== null) {
    deleteChild(returnFiber, childToDelete);
    childToDelete = childToDelete.sibling;
  }
  return null;
}
```

这段逻辑就是删除从`currentFirstChild`之后所有的`fiber`节点 

增量更新的部分到这里就完成了，接下来完成提交阶段的逻辑

------

首先回顾下`src/react-reconciler/src/ReactFiberCommitWork.js`中的`commitMutationEffectsOnFiber`

```js
/**
 * 遍历fiber树，执行fiber上的副作用
 * @param {*} finishedWork fiber节点
 * @param {*} root 根节点
 */
export function commitMutationEffectsOnFiber(finishedWork, root) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case FunctionComponent:
    case HostRoot:
    case HostText: {
      //先遍历它们的子节点，处理它们的子节点上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      //再处理自己身上的副作用
      commitReconciliationEffects(finishedWork);
      break;
    }
    case HostComponent: {
      //先遍历它们的子节点，处理它们的子节点上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      //再处理自己身上的副作用
      commitReconciliationEffects(finishedWork);
      //处理DOM更新
      if (flags & Update) {
        //获取真实DOM
        const instance = finishedWork.stateNode;
        //更新真实DOM
        if (instance !== null) {
          const newProps = finishedWork.memoizedProps;
          const oldProps =
            current !== null ? current.memoizedProps : newProps;

          const type = finishedWork.type;
          const updatePayload = finishedWork.updateQueue;
          finishedWork.updateQueue = null;

          if (updatePayload) {
            commitUpdate(
              instance, // 真实DOM
              updatePayload, // 更新内容
              type, // 真实DOM type
              oldProps, // 老props
              newProps, // 新Props
              finishedWork // 当前的fiber节点
            );
          }
        }
      }
      break;
    }
    default:
      break;
  }
}
```

在实现`useReducer`时，已经添加了更新真实DOM属性的逻辑

```js
//处理DOM更新
if (flags & Update) {
  //获取真实DOM
  const instance = finishedWork.stateNode;
  //更新真实DOM
  if (instance !== null) {
    const newProps = finishedWork.memoizedProps;
    const oldProps =
      current !== null ? current.memoizedProps : newProps;

    const type = finishedWork.type;
    const updatePayload = finishedWork.updateQueue;
    finishedWork.updateQueue = null;

    if (updatePayload) {
      commitUpdate(
        instance, // 真实DOM
        updatePayload, // 更新内容
        type, // 真实DOM type
        oldProps, // 老props
        newProps, // 新Props
        finishedWork // 当前的fiber节点
      );
    }
  }
```

那么接下来继续要添加删除真实DOM节点的处理逻辑

------

完善递归遍历`fiber`树处理副作用的方法`recursivelyTraverseMutationEffects`

```js
/**
 * @description 递归遍历fiber树，处理副作用
 * @param root 根 FiberRootNode
 * @param parentFiber fiber节点
 */
function recursivelyTraverseMutationEffects(root, parentFiber) {
  //先把父fiber上该删除的节点对应的真实DOM都删除
  // 先处理删除副作用再处理插入副作用
  const deletions = parentFiber.deletions;
  if (deletions !== null) {
    for (let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[i];
      commitDeletionEffects(root, parentFiber, childToDelete);
    }
  }
  //再去处理剩下的子节点
  //...
}
```

增加的部分：就是在处理子节点的逻辑之前先把父`fiber`上该删除的节点对应的真实DOM都删除

通过在增量更新阶段记录下的`deletions`，去找到页面上对应的真实DOM节点并删除

------

实现提交删除副作用的方法`commitDeletionEffects`

```js
/**
 * @description 提交删除副作用
 * @param {*} root 根节点
 * @param {*} returnFiber 父fiber
 * @param {*} deletedFiber 删除的fiber
 */
function commitDeletionEffects(root, returnFiber, deletedFiber) {
  let parent = returnFiber;
  //一直向上找，找到真实的父DOM节点为此
  findParent: while (parent !== null) {
    switch (parent.tag) {
      case HostComponent: {
        hostParent = parent.stateNode;
        break findParent;
      }
      case HostRoot: {
        hostParent = parent.stateNode.containerInfo;
        break findParent;
      }
    }
    parent = parent.return;
  }
  // 删除deletedFiber对应的真实DOM
  commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
  hostParent = null;
}
```

要想删除真实DOM节点，必须要找到它的父真实DOM节点，找到父节点之后通过全局变量`hostParent`记录下来

------

实现`commitDeletionEffectsOnFiber`方法

```js
/**
 * @description 删除真实DOM
 * @param {*} finishedRoot 根节点
 * @param {*} nearestMountedAncestor 父fiber
 * @param {*} deletedFiber 删除的fiber
 */
function commitDeletionEffectsOnFiber(
  finishedRoot,
  nearestMountedAncestor,
  deletedFiber
) {
  switch (deletedFiber.tag) {
    case HostComponent:
    case HostText: {
      //当要删除一个节点的时候，要先删除它的子节点
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      //再把自己删除，从父真实DOM节点上删除child（deletedFiber.stateNode）
      if (hostParent !== null) {
        removeChild(hostParent, deletedFiber.stateNode);
      }
      break;
    }
    default:
      break;
  }
}
```

实现`removeChild`

```js
// src/react-dom-bindings/src/client/ReactDOMHostConfig.js
export function removeChild(parentInstance, child) {
  parentInstance.removeChild(child);
}
```

实现`recursivelyTraverseDeletionEffects`

```js
/**
 * @description 递归遍历所有子节点执行删除副作用
 * @param {*} finishedRoot 根节点
 * @param {*} nearestMountedAncestor 父fiber
 * @param {*} deletedFiber 删除的fiber
 */
function recursivelyTraverseDeletionEffects(
  finishedRoot,
  nearestMountedAncestor,
  parent
) {
  let child = parent.child;
  while (child !== null) {
    commitDeletionEffectsOnFiber(
      finishedRoot,
      nearestMountedAncestor,
      child
    );
    child = child.sibling;
  }
}
```

这里为什么在删除一个节点时先删除其子节点，这是因为React中每个节点的删除会进行一些其他处理（比如生命周期的逻辑），所以才没有直接一下将该节点直接删除

------

到这里单节点的`diff`已经实现完成，看下实现效果

初次渲染时

![image-20230221231046088](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230221231046088.png)

更新之后

![image-20230221231126337](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230221231126337.png)

### 三、多节点diff

React `DOM diff` 有三个规则

- 只对同级元素进行比较，不同层级不对比 <!--同层比较-->
- 不同的 `type` 对应不同的元素
- 可以通过 `key` 来标识同一个节点

当新的VDom节点为多个时，新VDom需要遍历三轮与老VDom进行比较

- **第 1 轮遍历**

  新VDom和老VDom按照索引，==一一进行比较== <!--不像Vue做了优化，头尾、尾头遍历-->

  - 如果 `key` 不同则==直接结束本轮循环==  <!--即使只有第一个节点的key不同剩余节点的key都相同-->
  - 如果`key` 相同而 `type` 不同，则直接==创建新`fibe`r节点==，标记老`fiber`为删除，==继续循环==
  - 如果`key` 相同且 `type` 也相同，则直接==复用老节 `fiber` 节点==，==继续循环==
  - 如果`newChildren` 或 `oldFiber` 遍历完，==结束本轮循环==

- **第 2 轮遍历**

  - `newChildren` 遍历完而 `oldFiber` 还有，遍历剩下所有的 `oldFiber` 标记为删除，==diff 结束==
  - `oldFiber` 遍历完了，而 `newChildren` 还有，将剩下的 `newChildren` 标记为插入，==diff 结束==
  - `newChildren` 和 `oldFiber` 都没有完成，则==进行`节点移动`的逻辑==

- **第 3 轮遍历**

  - 处理节点移动的情况 <!--这种情况最复杂-->

------

改造`main.jsx`

```jsx
import * as React from 'react';
import { createRoot } from "react-dom/client";

function FunctionComponent() {
  const [number, setNumber] = React.useState(0);
  return number === 0 ? (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="A">A</li>
      <li key="B" id="b">
        B
      </li>
      <li key="C">C</li>
      <li key="D">D</li>
      <li key="E">E</li>
      <li key="F" id="F">F</li>
    </ul>
  ) : (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="A">A2</li>
      <li key="C">C2</li>
      <li key="E">E2</li>
      <li key="B" id="b2">
        B2
      </li>
      <li key="G">G</li>
      <li key="D">D2</li>
    </ul>
  );
}
let element = <FunctionComponent />
const root = createRoot(document.getElementById("root"));
root.render(element);
```

------

完善`src/react-reconciler/src/ReactChildFiber.js`中的`reconcileChildFibers`

首先回顾下`reconcileChildFibers`方法

```js
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
  //...
    
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
```

当新的 VDom 是多个节点时，会走到 `reconcileChildrenArray` 中，所以接下来完善 `reconcileChildrenArray`

------

回顾下 `reconcileChildrenArray`

```js
/**
   * @description 根据虚拟DOM创建fiber（新的子节点有多个，是个数组的情况）
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstFiber 老的父fiber第一个子fiber
   * @param {*} newChildren 新的子虚拟DOM
   */
  function reconcileChildrenArray(
    returnFiber,
    currentFirstFiber,
    newChildren
  ) {
    let resultingFirstChild = null; //返回的第一个新儿子
    let previousNewFiber = null; //上一个新子fiber
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

这是初次挂载时的逻辑👆，只是根据新的 VDom 创建 `fiber` <!--老 `fiber` `currentFirstFiber` 没有使用到-->

那么接下来便增加 diff 的逻辑，首先是第一轮循环

#### 3.1、第一轮遍历

```js
  /**
   * @description 根据虚拟DOM创建fiber（新的子节点有多个，是个数组的情况）
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstFiber 老的父fiber第一个子fiber
   * @param {*} newChildren 新的子虚拟DOM
   */
  function reconcileChildrenArray(
    returnFiber,
    currentFirstFiber,
    newChildren
  ) {
    let resultingFirstChild = null; //返回的第一个新儿子
    let previousNewFiber = null; //上一个新子fiber
    let newIdx = 0; //用来遍历新的虚拟DOM的索引
    let oldFiber = currentFirstFiber; //第一个老fiber
    let nextOldFiber = null; //下一个老fiber
    let lastPlacedIndex = 0; //上一个不需要移动的老节点的索引

    // 开始第一轮循环 如果老fiber有值，新的虚拟DOM也有值
    for (
      ;
      oldFiber !== null && newIdx < newChildren.length;
      newIdx++
    ) {
      //先暂存下一个老fiber
      nextOldFiber = oldFiber.sibling;
      //试图复用老的fiber
      const newFiber = updateSlot(
        returnFiber, // 新的父Fiber
        oldFiber, // 老fiber
        newChildren[newIdx] // 新子虚拟DOM节点
      );
      if (newFiber === null) {
        // 没有复用的或者创建的新子fiber，就进行下个新子虚拟DOM节点的处理
        break;
      }
      if (shouldTrackSideEffects) {
        //如果有老fiber,但是新的fiber并没有成功复用老fiber和老的真实DOM，那就删除老fiber,在提交阶段会删除真实DOM
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }
      //指定新fiber的位置
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

      //...

    return resultingFirstChild;
  }
```

以上就是第一轮循环的逻辑，这里面的几个变量很重要

- `resultingFirstChild` ： 新 `fiber` 第一个子 `fiber`（父 `fiber` 的 `child`） `reconcileChildrenArray` 返回值就是这个
- `previousNewFiber` ：上一个新子 `fiber`，用于追加 `sibling fiber`
- `newIdx` ：用来遍历新的虚拟DOM的索引
- `oldFiber = currentFirstFiber` ：老子 `fiber` ，默认值是第一个老子 `fiber`
- `nextOldFiber` ：下一个老子 `fiber`，用于提前缓存
- `lastPlacedIndex`：上一个不需要移动的老节点的索引，用于记录可以直接复用不用移动位置的老 `fiber` 的索引 <!--后面第三轮循环：移动节点 使用-->

------

再回顾下**第 1 轮遍历**做的事：

**第 1 轮遍历**

新 VDom 和老 VDom 按照索引，==一一进行比较==

- 如果 `key` 不同则==直接结束本轮循环==
- 如果 `key` 相同而 `type` 不同，则直接==创建新 `fiber` 节点==，标记老 `fiber` 为删除，==继续循环==
- 如果 `key` 相同且 `type` 也相同，则直接==复用老节 `fiber` 节点==，==继续循环==
- 如果 `newChildren` 或 `oldFiber` 遍历完，==结束本轮循环==

下面具体说明

------

具体比较新老子 `fiber` 并复用老 `fiber` 的逻辑在 `updateSlot` 中

```js
/**
 * @description 试图复用老的fiber
 * 能复用就复用，不能就创建新的
 * @param returnFiber 新的父fiber
 * @param oldFiber 老的子fiber
 * @param newChild 新的子虚拟DOM节点
 */
function updateSlot(returnFiber, oldFiber, newChild) {
  const key = oldFiber !== null ? oldFiber.key : null;
  if (newChild !== null && typeof newChild === 'object') {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE: {
        //如果key一样，进入更新元素的逻辑
        if (newChild.key === key) {
          return updateElement(returnFiber, oldFiber, newChild);
        }
      }
      default:
        return null;
    }
  }
  return null;
}
```

```js
/**
 * @description 复用老fiber或者创建新的fiber
 * @param returnFiber 新的父fiber
 * @param current 老的子fiber
 * @param element 新的子虚拟DOM
 */
function updateElement(returnFiber, current, element) {
  const elementType = element.type;
  if (current !== null) {
    //判断是否类型一样，则表示key和type都一样，可以复用老的fiber和真实DOM
    if (current.type === elementType) {
      const existing = useFiber(current, element.props);
      existing.return = returnFiber;
      return existing;
    }
  }
  const created = createFiberFromElement(element);
  created.return = returnFiber;
  return created;
}
```

上面👆增加的逻辑主要做了以下几件事：

- `updateSlot`中比较新老子 `fiber` 的 `key` <!--第一轮遍历是否继续，取决于 `updateSlot` 的返回值-->

  - `key`一致则调用 `updateElement` 复用老 `fiber` 或者创建新的 `fiber`

  - `key`不一致则直接 `return null`，则直接退出第一轮遍历

    ```js
    if (newFiber === null) {
      // 没有复用的或者创建的新子fiber，就进行下个新子虚拟DOM节点的处理
      break;
    }
    ```

- `updateElement`中比较新老子 `fiber` 的 `type`

  - `type`一致则直接复用老 `fiber`，`useFiber(current, element.props)`，新 `fiber` 的 `alternate` 指向老 `fiber`
  - `type`不一致则直接创建新 `fiber`，`createFiberFromElement(element)`，需要将老 `fiber` 标记删除

------

老 `fiber` 的删除逻辑是下面这段

```js
if (shouldTrackSideEffects) {
  //如果有老fiber,但是新的fiber并没有成功复用老fiber和老的真实DOM，那就删除老fiber,在提交阶段会删除真实DOM
  if (oldFiber && newFiber.alternate === null) {
    deleteChild(returnFiber, oldFiber);
  }
}
```

若是新 `fiber` 复用了老 `fiber`，则其 `alternate` 属性会指向老 `fiber`；没有指向的话，就直接将老 `fiber` 标记删除 `deleteChild(returnFiber, oldFiber)`

------

第一轮循环的实现中有一点需要注意👇就是指定新fiber位置的逻辑中关于 `lastPlacedIndex` 的部分

```js
//指定新fiber的位置
lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
```

```js
/**
 * 设置副作用
 * @param newFiber 新的子fiber
 * @param newIdx 新的子fiber对应的VDom节点在children中的索引
 */
function placeChild(newFiber, lastPlacedIndex, newIdx) {
  //指定新的fiber在新的挂载索引
  newFiber.index = newIdx;
  //如果不需要跟踪副作用
  if (!shouldTrackSideEffects) {
    return lastPlacedIndex;
  }
  //获取它的老fiber
  const current = newFiber.alternate;
  if (current !== null) {
    //如果有，说明这是一个更新的节点，有老的真实DOM
    const oldIndex = current.index;
    //如果找到的老fiber的索引比lastPlacedIndex要小，则老fiber对应的DOM节点需要移动
    if (oldIndex < lastPlacedIndex) {
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    } else {
      return oldIndex;
    }
  } else {
    newFiber.flags |= Placement;
    return lastPlacedIndex;
  }
}
```

关于记录直接复用且不用移动位置老 `fiber` 的索引 `lastPlacedIndex` 的逻辑

```js
if (oldIndex < lastPlacedIndex) {
  newFiber.flags |= Placement;
  return lastPlacedIndex;
} else {
  return oldIndex;
}
```

这里的逻辑是

- 若老 `fiber` 的索引小于上一个不需要移动的老节点的索引，则说明这个老 `fiber` 需要移动，仍然返回 `lastPlacedIndex`，保持 `lastPlacedIndex` 不变
- 若是老 `fiber` 的索引大于上一个不需要移动的老节点的索引，则说明这个老 `fiber` 不需要移动，返回这个老 `fiber` 的索引，作为新的 `lastPlacedIndex`

<!--lastPlacedIndex在后面移动节点中有用-->

#### 3.2、第二轮遍历

```js
  /**
   * @description 根据虚拟DOM创建fiber（新的子节点有多个，是个数组的情况）
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstFiber 老的父fiber第一个子fiber
   * @param {*} newChildren 新的子虚拟DOM
   */
  function reconcileChildrenArray(
    returnFiber,
    currentFirstFiber,
    newChildren
  ) {
      //...

    //新的虚拟DOM已经循环完毕，3=>2
    if (newIdx === newChildren.length) {
      //删除剩下的老fiber
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    //如果老的 fiber已经没有了， 新的虚拟DOM还有，进入插入新节点的逻辑
    if (oldFiber === null) {
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(
          returnFiber,
          newChildren[newIdx]
        );
        if (newFiber === null) continue;
        lastPlacedIndex = placeChild(
          newFiber,
          lastPlacedIndex,
          newIdx
        );
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
    }
      //....

  }
```

再回顾下**第 2 轮遍历**做的事：

**第 2 轮遍历**

- `newChildren` 遍历完而 `oldFiber` 还有，遍历剩下所有的 `oldFiber` 标记为删除，==diff 结束==
- `oldFiber` 遍历完了，而 `newChildren` 还有，将剩下的 `newChildren` 标记为插入，==diff 结束==
- `newChildren` 和 `oldFiber` 都没有完成，则==进行`节点移动`的逻辑==

#### 3.3、第三轮遍历

第三轮遍历就是**移动节点**

接下来看下一段完整的多节点diff的流程示意图

`main.jsx`中的`jsx`

```jsx
function FunctionComponent() {
  const [number, setNumber] = React.useState(0);
  return number === 0 ? (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="A">A</li>
      <li key="B" id="b">
        B
      </li>
      <li key="C">C</li>
      <li key="D">D</li>
      <li key="E">E</li>
      <li key="F" id="F">F</li>
    </ul>
  ) : (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="A">A2</li>
      <li key="C">C2</li>
      <li key="E">E2</li>
      <li key="B" id="b2">
        B2
      </li>
      <li key="G">G</li>
      <li key="D">D2</li>
    </ul>
  );
}
```

流程示意图👇，第一轮遍历比较到B和C时，由于`key`不同直接退出循环，此时新老`fiber`都还没有遍历完成，则进入到移动节点的逻辑

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/duo_ge_jie_dian_shu_liang_bu_tong_key_bu_tong_1_1637057627706.jpg)

实现👇

```js
  /**
   * @description 根据虚拟DOM创建fiber（新的子节点有多个，是个数组的情况）
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstFiber 老的父fiber第一个子fiber
   * @param {*} newChildren 新的子虚拟DOM
   */
  function reconcileChildrenArray(
    returnFiber,
    currentFirstFiber,
    newChildren
  ) {
    //...

    // 开始处理移动的情况
    const existingChildren = mapRemainingChildren(
      returnFiber,
      oldFiber
    );
    //开始遍历剩下的虚拟DOM子节点
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx]
      );
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          //如果要跟踪副作用，并且有老fiber
          if (newFiber.alternate !== null) {
            existingChildren.delete(
              newFiber.key === null ? newIdx : newFiber.key
            );
          }
        }
        //指定新的fiber存放位置 ，并且给lastPlacedIndex赋值
        lastPlacedIndex = placeChild(
          newFiber,
          lastPlacedIndex,
          newIdx
        );
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber; //这个newFiber就是大儿子
        } else {
          //否则说明不是大儿子，就把这个newFiber添加上一个子节点后面
          previousNewFiber.sibling = newFiber;
        }
        //让newFiber成为最后一个或者说上一个子fiber
        previousNewFiber = newFiber;
      }
    }
    if (shouldTrackSideEffects) {
      //等全部处理完后，删除map中所有剩下的老fiber
      existingChildren.forEach(child =>
        deleteChild(returnFiber, child)
      );
    }

    return resultingFirstChild;
  }
```

上面这段实现中主要做了以下几件事

- 将第一轮遍历剩下的老 `fiber` 放入到一个Map对象中缓存下来

  ```js
  const existingChildren = mapRemainingChildren(
    returnFiber,
    oldFiber
  );
  ```

- 遍历剩下的虚拟DOM子节点，从存储老 `fiber` 的Map对象中寻找能复用的老fiber

  - 找到则直接复用老 `fiber`

  - 找不到则新建 `fiber`

    ```js
    const newFiber = updateFromMap(
      existingChildren,
      returnFiber,
      newIdx,
      newChildren[newIdx]
    );
    ```

------

实现 `mapRemainingChildren`

```js
function mapRemainingChildren(returnFiber, currentFirstChild) {
const existingChildren = new Map();
let existingChild = currentFirstChild;
while (existingChild != null) {
  //如果有key用key,如果没有key使用索引
  if (existingChild.key !== null) {
    existingChildren.set(existingChild.key, existingChild);
  } else {
    existingChildren.set(existingChild.index, existingChild);
  }
  existingChild = existingChild.sibling;
}
return existingChildren;
}
```

------

实现 `updateFromMap`

```js
function updateFromMap(
  existingChildren,
  returnFiber,
  newIdx,
  newChild
) {
  if (
    (typeof newChild === 'string' && newChild !== '') ||
    typeof newChild === 'number'
  ) {
    const matchedFiber = existingChildren.get(newIdx) || null;
    return updateTextNode(returnFiber, matchedFiber, '' + newChild);
  }
  if (typeof newChild === 'object' && newChild !== null) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE: {
        const matchedFiber =
          existingChildren.get(
            newChild.key === null ? newIdx : newChild.key
          ) || null;
        return updateElement(returnFiber, matchedFiber, newChild);
      }
    }
  }
}
```

到这里移动节点的部分已经实现完成，但是应当会有这样一个疑问：`lastlastPlacedIndex`怎么用的？

答案还是在 `placeChild` 中

```js
/**
 * 设置副作用
 * @param newFiber 新的子fiber
 * @param newIdx 新的子fiber对应的VDom节点在children中的索引
 */
function placeChild(newFiber, lastPlacedIndex, newIdx) {
  //指定新的fiber在新的挂载索引
  newFiber.index = newIdx;
  //如果不需要跟踪副作用
  if (!shouldTrackSideEffects) {
    return lastPlacedIndex;
  }
  //获取它的老fiber
  const current = newFiber.alternate;
  if (current !== null) {
    //如果有，说明这是一个更新的节点，有老的真实DOM
    const oldIndex = current.index;
    //如果找到的老fiber的索引比lastPlacedIndex要小，则老fiber对应的DOM节点需要移动
    if (oldIndex < lastPlacedIndex) {
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    } else {
      return oldIndex;
    }
  } else {
    /*
    如果没有，说明这是一个新的节点，需要插入
    */
    newFiber.flags |= Placement;
    return lastPlacedIndex;
  }
}
```

注意这里

```js
if (oldIndex < lastPlacedIndex) {
  newFiber.flags |= Placement;
  return lastPlacedIndex;
} else {
  return oldIndex;
}
```

- 若老`fiber`的索引小于上一个不需要移动的老节点的索引，则说明这个老`fiber`需要移动，仍然返回`lastPlacedIndex`，保持`lastPlacedIndex`不变
- 若是老`fiber`的索引大于上一个不需要移动的老节点的索引，则说明这个老`fiber`不需要移动，返回这个老`fiber`的索引，作为新的`lastPlacedIndex`

这里明明是处理`lastPlacedIndex`的逻辑，如何告诉浏览器页面上哪个DOM节点需要动，哪个不需要动？

答案是👇

```js
newFiber.flags |= Placement;
```

若老`fiber`的索引小于上一个不需要移动的老节点的索引是，则给新`fiber`上添加了插入的副作用，这样在`commit`阶段，就会处理这个副作用；由于新`fiber`是复用的老`fiber`，那么真实DOM也复用了（`stateNode`属性），也就是说不会新创建真实DOM节点去插入，而是直接用页面上已有的DOM节点进行插入（展示的效果就是移动）

------

好了多节点的diff实现完成，看下实现效果

更新前

![image-20230223162855128](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230223162855128.png)

更新后

![image-20230223162947583](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230223162947583.png)

<!--**React** 的 **DOM** diff 没有 **Vue** 那么复杂，**Vue** 中做了很多优化，所以 **React** 的性能不如 **Vue** 是不是和这个有关-->

