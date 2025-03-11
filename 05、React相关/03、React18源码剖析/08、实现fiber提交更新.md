## React18源码解析（八）实现fiber提交更新

### 一、前言

提交更新就是将 `fiber`上的真实 **DOM** 进行处理最后挂到页面上

### 二、提交更新

首先回顾下 `src/react-reconciler/src/ReactFiberWorkLoop.js` 中的 `performConcurrentWorkOnRoot` 方法

```jsx
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
```

这个方法主要完成了以下工作：

- 根据 **VirtualDOM** 构建 `fiber` 树，创建「**真实 Dom 节点**」（也就是「**调和更新**」，已完成）
- 还需要把「**真实 Dom 节点**」插入容器（也就是「**提交更新**」，未完成）

那么接下来就是先提交更新的部分👇

```jsx
/**
 * @description 执行root上的并发更新工作
 * @description 根据虚拟DOM构建fiber树,要创建真实的DOM节点
 * @description 还需要把真实的DOM节点插入容器
 * @param root 根节点
 */
function performConcurrentWorkOnRoot(root) {
  //第一次渲染以同步的方式渲染根节点，初次渲染的时候，都是同步
  renderRootSync(root);

  //开始进入提交 阶段，就是执行副作用，修改真实DOM
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
}
```

- 先从 `root` 上拿到负责计算的 `fiber` 树 `root.current.alternate` 并挂到 `root` 的 `finishedWork` 属性上
  
  <img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/renderFiber1_1664076149659.jpg" alt="img" style="zoom:30%;" />
  
  - 此时 `root.current.alternate` 指向的 `fiber` 树 已经计算完成，**HostRootFiber** 上已经保存了完整的 **DOM** 树
  
- 再进行提交 `commitRoot(root)`

------

实现 `commitRoot`

```jsx
// src/react-reconciler/src/ReactFiberWorkLoop.js

/**
 * @description 提交方法
 * @param root 根节点
 */
function commitRoot(root) {
  const { finishedWork } = root;
  //判断子树有没有副作用
  const subtreeHasEffects =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffect =
    (finishedWork.flags & MutationMask) !== NoFlags;
  //如果自己有副作用或者子节点有副作用就进行提交DOM操作
  if (subtreeHasEffects || rootHasEffect) {
    commitMutationEffectsOnFiber(finishedWork, root);
  }

  //等DOM变更后，就可以把让root的current指向新的fiber树
  root.current = finishedWork;
}
```

上面这段实现主要是判断 `HostRootFiber` 上是否有**副作用**，如有**副作用**则进行 **DOM** 的提交操作 <!--这里的副作用就是指 DOM 的增删改，也就是需要进行 DOM 操作-->

具体的提交逻辑在 `commitMutationEffectsOnFiber` 中实现，完成 **DOM** 操作并将 **DOM 树**挂载到**根节点**（`div#root`）上

------

在 `src/react-reconciler/src/ReactFiberCommitWork.js` 中实现并导出 `commitMutationEffectsOnFiber`

```js
/**
 * 遍历fiber树，执行fiber上的副作用
 * @param {*} finishedWork fiber节点
 * @param {*} root 根节点
 */
export function commitMutationEffectsOnFiber(finishedWork, root) {
  switch (finishedWork.tag) {
    case HostRoot:
    case HostComponent:
    case HostText: {
      //先遍历它们的子节点，处理它们的子节点上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      //再处理自己身上的副作用
      commitReconciliationEffects(finishedWork);
      break;
    }
    default:
      break;
  }
}
```

`commitMutationEffectsOnFiber` 是根据 `fiber` 的类型来选择何种执行副作用的方法

根 `fiber`、原生组件 `fiber`、原生文本 `fiber`：

- 先遍历当前 `fiber` 的子 `fiber`，完成它们的副作用 `recursivelyTraverseMutationEffects`，这里递归调用了 `commitReconciliationEffects`

- 再完成当前 `fiber` 节点自己的副作用 `commitReconciliationEffects`

  <!--也就是先从上往下找到最下面的子fiber，再从下往上完成提交，和工作循环中完成阶段的顺序一致-->

------

首先实现 `recursivelyTraverseMutationEffects`

```jsx
/**
 * @description 递归遍历fiber树，处理副作用
 * @param root
 * @param parentFiber fiber节点
 */
function recursivelyTraverseMutationEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & MutationMask) {
    let { child } = parentFiber;
    while (child !== null) {
      commitMutationEffectsOnFiber(child, root);
      child = child.sibling;
    }
  }
}
```

```jsx
// src/react-reconciler/src/ReactFiberFlags.js
export const Placement = 0b00000000000000000000000010;
export const Update = 0b00000000000000000000000100;
export const MutationMask = Placement | Update;
```

处理子 `fiber` 的逻辑本身并不复杂，找到第一个子 `fiber` 节点再递归调用 `commitMutationEffectsOnFiber` ，然后再通过第一个子 `fiber` 节点找到后面的 `sibling fiber` 递归调用 `commitMutationEffectsOnFiber`，从而完成所有子 `fiber` 的副作用处理<!--从下往上处理的子 `fiber`-->

⚠️ 需要注意的是这个判断条件 `if (parentFiber.subtreeFlags & MutationMask)` 这个**很重要**，子 `fiber` 树上有「**更新**」或「**插入**」的副作用才会进行递归 

这里有两种情况：

- 当前 `fiber` 节点是初次挂载
  - 它的 `subtreeFlags` 为 0，也就是它的所有子 `fiber` 都没有副作用，所有子 `fiber` 对应的 **真实DOM** 都在「**工作循环**」的 **completeWork** 中追加到了该 `fiber` 自己的 **真实DOM** 上了,
  - 所以在执行 `recursivelyTraverseMutationEffects(root, finishedWork)` 处理子 `fiber` 的副作用时，并不会执行任何逻辑
  - 而当前 `fiber` 的 **真实DOM ** 会在 `commitReconciliationEffects(finishedWork)` 处理自己的副作用时被挂载到父 `fiber` 的**真实DOM **节点上
    - 初次渲染时，HostRoot （根 fiber）上的
- 当前 `fiber` 节点是更新渲染

<!--一个 fiber 节点初次挂载时，它的 subtreeFlags 为0，也就是它的所有子 fiber 都没有副作用，所有子 fiber 对应的真实DOM都在「工作循环」的「完成阶段」追加到了该 fiber 自己的真实DOM上了, 所以后续递归执行 commitMutationEffectsOnFibe 到该 fiber 的子fiber 时，在 recursivelyTraverseMutationEffects 这里便不会继续下去-->

------

再实现`commitReconciliationEffects`

```jsx
/**
 * @description 完成真实DOM的添加
 * @description 删除副作用
 */
 function commitReconciliationEffects(finishedWork) {
  const { flags } = finishedWork;
  //如果此fiber要执行插入操作的话
  if (flags & Placement) {
    //进行插入操作，也就是把此fiber对应的真实DOM节点添加到父真实DOM节点上
    commitPlacement(finishedWork);
    //把flags里的Placement删除
    finishedWork.flags & ~Placement;
  }
}
```

注意⚠️这个判断条件 `if (flags & Placement)`，这个很重要，`fiber` 有插入副作用才会执行 `commitPlacement` 完成「**真实 DOM**」的添加  <!--初次渲染时 HostRootFiber 上并没有 flags，也就是说不会走到这段逻辑-->

------

`commitPlacement`

```jsx
/**
 * @description 把此fiber的真实DOM插入到父DOM里
 * @param {*} finishedWork
 */
function commitPlacement(finishedWork) {
  const parentFiber = getHostParentFiber(finishedWork);
  switch (parentFiber.tag) {
    case HostRoot: {
      const parent = parentFiber.stateNode.containerInfo;
      //获取最近的弟弟真实DOM节点
      const before = getHostSibling(finishedWork);
      insertOrAppendPlacementNode(finishedWork, before, parent);
      break;
    }
    case HostComponent: {
      const parent = parentFiber.stateNode;
      //获取最近的弟弟真实DOM节点
      const before = getHostSibling(finishedWork);
      insertOrAppendPlacementNode(finishedWork, before, parent);
      break;
    }
    default:
      break;
  }
}
```

「**真实 DOM**」的添加主要包含以下几部分：

- 根据当前 `fiber` 向上寻找，直到找到原生节点 `fiber` 或者根`fiber`  （`getHostParentFiber`）

- 找到要插入「**真实 DOM**」的锚点（不一定有）（`getHostSibling`）
- 完成「**真实 DOM**」的添加 `insertOrAppendPlacementNode`，有锚点就插入到锚点前，没有就直接添加到父节点上

------

`getHostParentFiber`

```jsx
/**
 * @description 根据当前fiber向上寻找，直到找到原生节点fiber或者根fiber
 */
function getHostParentFiber(fiber) {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
}
```

------

`getHostSibling`

```jsx
/**
 * @description 找到要插入的锚点
 * @description 找到可以插在它的前面的那个fiber对应的真实DOM
 * @param {*} fiber
 */
function getHostSibling(fiber) {
  let node = fiber;
  siblings: while (true) {
    // 向上寻找sibling直到没有父fiber或者父fiber是原生节点fiber或者根fiber
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null;
      }
      node = node.return;
    }
    node = node.sibling;

    //如果弟弟不是原生节点也不是文本节点
    while (node.tag !== HostComponent && node.tag !== HostText) {
      //如果此节点是一个将要插入的新的节点，找它的弟弟
      if (node.flags & Placement) {
        continue siblings;
      } else {
        node = node.child;
      }
    }

    if (!(node.flags & Placement)) {
      return node.stateNode;
    }
  }
}
```

找锚点的目的是==找到一个没有**插入副作用**的原生节点的 `fiber`==，先从自己的兄弟中找，自己的兄弟中没有则往上在父节点的兄弟中找，若是找到原生节点 `fiber` 或者根 `fiber` 都没找到便直接返回 `null`

------

`insertOrAppendPlacementNode`

```jsx
/**
 * @description 把子节点对应的真实DOM插入到父节点DOM中
 * @param {*} node 将要插入的fiber节点
 * @param {*} parent 父真实DOM节点
 */
function insertOrAppendPlacementNode(node, before, parent) {
  const { tag } = node;
  //判断此fiber对应的节点是不是真实DOM节点
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    //如果是的话直接添加
    const { stateNode } = node;
    // 有锚点则执行插入，没有锚点则执行追加
    if (before) {
      insertBefore(parent, stateNode, before);
    } else {
      appendChild(parent, stateNode);
    }
  } else {
    //如果node不是真实的DOM节点，获取它的第一个子fiber
    const { child } = node;
    if (child !== null) {
      //递归执行，把第一个子fiber也添加到父亲DOM节点里面去
      insertOrAppendPlacementNode(child, before, parent);

      //把其余子fiber添加到父亲DOM节点里面去
      let { sibling } = child;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}
```

「**真实 DOM**」的添加包含了以下的内容

- 当前 `fiber` 是原生节点或者原生文本
  - 有锚点则执行插入 `insertBefore`
  - 没有锚点则执行追加 `appendChild`
- 当前 `fiber` 不是是原生节点或者原生文本
  - 递归执行当前 `fiber` 的子 `fiber` 们 `insertOrAppendPlacementNode`

------

### 三、实现效果

到这里整个提交更新便已实现完成，下面看下实现效果

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

页面挂载

![image-20230213152726258](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230213152726258.png)

