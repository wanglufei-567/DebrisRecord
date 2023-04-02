## React18源码解析（十四）实现useEffect

### 一、前言

`useEffect` 和 `useLayoutEffect` 都是 React 提供的用于处理副作用（Side Effect）的 Hook

**==副作用指的是那些与组件渲染无关的操作==**，比如网络请求、DOM 操作、定时器设置等。在类式组件中，通常会将这些操作放在生命周期方法中进行处理，比如 `componentDidMount`、`componentDidUpdate` 和 `componentWillUnmount` 等

而在函数式组件中，可以使用 `useEffect` 和 `useLayoutEffect` 来处理副作用。它们的用法类似，都接受两个参数：一个副作用函数和一个依赖数组

其中，`useEffect` 会在组件**==渲染完成后异步执行==**副作用函数，而 `useLayoutEffect` 会在组件**==渲染完成后同步执行==**副作用函数。因此，在大多数情况下，应该优先使用 `useEffect`。

下面分别对 `useEffect` 和 `useLayoutEffect` 进行详细介绍：

#### 1.1、useEffect

`useEffect` 可以在函数组件中使用，用于处理副作用。它接受两个参数，第一个参数是一个函数，**==该函数会在组件渲染完成后异步执行==**，用于处理副作用。第二个参数是一个数组，表示该副作用函数所依赖的变量，当这些变量发生变化时，会重新执行副作用函数。

```jsx
jsxCopy code
import { useEffect } from 'react';

function MyComponent(props) {
  useEffect(() => {
    // 处理副作用的函数 create
    // ...
    return () => {
      // 在组件卸载时执行的清理函数 destroy
      // ...
    };
  }, [props.dependency]);

  // ...
}
```

在上面的例子中，`useEffect` 会在 `props.dependency` 发生变化时重新执行副作用函数。当组件卸载时，还会执行清理函数。

需要注意的是，由于 `useEffect` 的执行是异步的，因此如果副作用函数中有需要在渲染后立即执行的操作，可能会出现闪烁或视觉上的不一致。这种情况下，可以考虑使用 `useLayoutEffect`。

#### 1.2、useLayoutEffect

`useLayoutEffect` 的用法与 `useEffect` 类似，不同之处在于它会**==在组件渲染完成后同步执行副作用函数==**。因此，`useLayoutEffect` ==**更适合处理那些需要在渲染后立即执行的操作**==，比如 DOM 操作。

```jsx
jsxCopy code
import { useLayoutEffect } from 'react';

function MyComponent() {
  useLayoutEffect(() => {
    // 在渲染后立即执行的操作
    // ...
  }, []);

  // ...
}
```

需要注意的是，由于 `useLayoutEffect` 是同步执行的，因此在**==副作用函数中不应该进行耗时的操作，否则会阻塞页面==**

#### 1.3、eventLoop

下面👇这是一张事件循环的模型图，`useEffect`的副作用函数之所以会是在组件渲染完成后**==异步执行==**，这是因为`useEffect`的副作用函数被放进宏任务队列中了 <!--作为回调入的队-->，等一帧结束之后才能执行；而 `useLayoutEffect`的副作用函数之所以会是在组件渲染完成后同步执行，这是因为`useLayoutEffect`的副作用函数是在React commit阶段之后，立即执行的

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/useLayoutEffect.jpg" alt="img" style="zoom:50%;" />

### 二、实现useEffect

改造下`main.jsx`

```jsx
import * as React from 'react';
import { createRoot } from "react-dom/client";

function FunctionComponent() {
  const [number, setNumber] = React.useState(0);
  React.useEffect(() => {
    console.log('useEffect1');
    return () => {
      console.log('destroy useEffect1');
    }
  });
  React.useEffect(() => {
    console.log('useEffect2');
    return () => {
      console.log('destroy useEffect2');
    }
  },[]);
  React.useEffect(() => {
    console.log('useEffect3');
    return () => {
      console.log('destroy useEffect3');
    }
  });
  return (<button onClick={() => setNumber(number + 1)}>{number}</button>)
}
let element = <FunctionComponent />
const root = createRoot(document.getElementById("root"));
root.render(element);
```

给`ReactCurrentDispatcher`中添加`useEffect`

```js
// src/react/index.js
export {
  //如果我们有一些希望在不同的内部模块之间共享的变量可以保存在此变量上
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  useState,
  useReducer,
  useEffect,
} from './src/React';

```

```js
// src/react/src/React.js
import { useReducer, useState, useEffect } from './ReactHooks';
import ReactSharedInternals from './ReactSharedInternals';
export {
  useState,
  useReducer,
  useEffect,
  ReactSharedInternals as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
}
```

```js
// src/react/src/ReactHooks.js
import ReactCurrentDispatcher from './ReactCurrentDispatcher';

export function useEffect(create, deps) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
}
```

#### 2.1、挂载时的useEffect

在`src/react-reconciler/src/ReactFiberHooks.js`中实现`mountEffect`

```js
import {
  HasEffect as HookHasEffect,
  Passive as HookPassive
} from './ReactHookEffectTags';

//...

const HooksDispatcherOnMount = {
  useReducer: mountReducer,
  useState: mountState,
  useEffect: mountEffect
};

/**
 * @param create 副作用函数
 * @param deps 依赖数组
 */
function mountEffect(create, deps) {
  return mountEffectImpl(PassiveEffect, HookPassive, create, deps);
}

//...
```

```js
/**
 * @param fiberFlags fiber的flag标识
 * @param hookFlags hook的flag标识
 * @param create 副作用函数
 * @param deps 依赖数组
 */
function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = mountWorkInProgressHook();
  // 提前缓存依赖数组
  const nextDeps = deps === undefined ? null : deps;
  //给当前的函数组件fiber添加flags
  currentlyRenderingFiber.flags |= fiberFlags;
  // Effect hook对象上的memoizedState保存的是effect链表
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    undefined,
    nextDeps
  );
}
```

`mountEffect`中做了以下几件事：

- **创建`hook`对象:**

  - 和之前的`useReducer`和`useState`一样，调用`mountWorkInProgressHook`创建一个`hook`对象

    <!--函数组件`fiber`的`memoizedState`上挂的是一个`hook`链表-->

- **给当前的函数组件`fiber`添加 `HookPassive` `flags`:**

  <!--如果函数组件的里面使用了`useEffect`，那么此函数组件对应的`fiber`上会有一个 `HookPassive` `flags` 用于后续`commit`阶段判断是否使用了`useEffect`-->

- **给当前`hook`对象上的`memoizedState`绑定一个`effect`链表:**

  <!--区别于`useReducer`和`useState`的`hook`对象上`memoizedState`指向一个`state`-->

关于`effect`链表，可以看下面👇这张示意图

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/updateEffectMount2_1666851226558.jpg)

<!--useEffect 就是PassiveEffect 消极的副作用，因为是在渲染之后异步完成-->

- 每个`useEffect hook`对象上的`memoizedState`都指向一个属于自己的`effect`对象
- 每个`effect`对象有组成了一个循环链表
- 函数组件`fiber`的`updateQueue`的`lastEffect`属性，指向`effect`链表的最后一项 <!--为何这么设计？可能是因为方便查找出useEffect-->

------

接下来实现创建`effect`链表的方法`pushEffect`

```js
/**
 * 添加effect链表
 * @param {*} tag effect的标签
 * @param {*} create 创建方法
 * @param {*} destroy 销毁方法
 * @param {*} deps 依赖数组
 */
function pushEffect(tag, create, destroy, deps) {
  // 创建effect对象
  const effect = {
    tag, // effect标识
    create, // 副作用函数
    destroy, // 销毁方法
    deps, // 依赖数组
    next: null
  };
  // 当前函数组件fiber的updateQueue指向effect链表
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}
```

```js
function createFunctionComponentUpdateQueue() {
  return {
    lastEffect: null
  };
}
```

上面这段实现不复杂，循环链表在前面已经实现过很多次了

这里需要注意⚠️的一点的是每个`effect`对象上有一个`tag`标识，`HookHasEffect ｜HookPassive`，这个标识后面用于识别是`useEffect`还是`useLayoutEffect`

看下实现效果👇

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230224011953908.png" alt="image-20230224011953908" style="zoom:50%;" />

以上只是创建了`effect`链表，那么副作用函数在哪里执行的呢？看下面👇

------

在`src/react-reconciler/src/ReactFiberWorkLoop.js`中的`commitRoot`添加执行副作用的逻辑

```js
import {
  NoFlags,
  MutationMask,
  Placement,
  Update,
  ChildDeletion,
  Passive
} from './ReactFiberFlags';
import {
  commitMutationEffectsOnFiber, //执行DOM操作
  commitPassiveUnmountEffects, //执行destroy
  commitPassiveMountEffects //执行create
} from './ReactFiberCommitWork';

//此根节点上有没有useEffect类似的副作用
let rootDoesHavePassiveEffect = false;
//具有useEffect副作用的根节点 FiberRootNode,根fiber.stateNode
let rootWithPendingPassiveEffects = null;

/**
 * @description 提交方法
 * @param root 根节点
 */
function commitRoot(root) {
  const { finishedWork } = root;
  // printFinishedWork(finishedWork);

  //若是新的fiber树上有Passive则说明有函数组件使用了useEffect
  if (
    (finishedWork.subtreeFlags & Passive) !== NoFlags ||
    (finishedWork.flags & Passive) !== NoFlags
  ) {
    //若此根节点上有useEffect类似的副作用
    if (!rootDoesHavePassiveEffect) {
      // scheduleCallback会开启一个新的宏任务，只需执行一次即可
      rootDoesHavePassiveEffect = true;
      scheduleCallback(flushPassiveEffect);
    }
  }
  console.log('~~~~~~~~~~~~DOM执行变更前~~~~~~~~~~~~~~~~~~');
  //判断子树有没有副作用
  const subtreeHasEffects =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffect =
    (finishedWork.flags & MutationMask) !== NoFlags;
  //如果自己的副作用或者子节点有副作用就进行提交DOM操作
  if (subtreeHasEffects || rootHasEffect) {
    commitMutationEffectsOnFiber(finishedWork, root);
    
    console.log('~~~~~~~~~~~~DOM执行变更后~~~~~~~~~~~~~~~~~~');
    //当DOM执行变更之后
    if (rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = false;
      // 具有useEffect副作用的根节点
      rootWithPendingPassiveEffects = root;
    }

    //等DOM变更后，就可以把让root的current指向新的fiber树
    root.current = finishedWork;
  }
}
```

增加的部分

```js
//若是新的fiber树上有Passive则说明有函数组件使用了useEffect
if (
  (finishedWork.subtreeFlags & Passive) !== NoFlags ||
  (finishedWork.flags & Passive) !== NoFlags
) {
  //若此根节点上有useEffect类似的副作用
  if (!rootDoesHavePassiveEffect) {
    // scheduleCallback会开启一个新的宏任务，只需执行一次即可
    rootDoesHavePassiveEffect = true;
    scheduleCallback(flushPassiveEffect);
  }
}
```

```js
//当DOM执行变更之后
if (rootDoesHavePassiveEffect) {
  rootDoesHavePassiveEffect = false;
  // 具有useEffect副作用的根节点
  rootWithPendingPassiveEffects = root;
}
```

这段逻辑中没有具体的执行副作用的实现，但是有一个非常关键的逻辑的实现，那就是`useEffect`的副作用函数为何是**==异步执行==**的

这是因为

```js
scheduleCallback(flushPassiveEffect);
```

会开启一个**==宏任务==**，而`useEffect`的副作用函数将则入队到这个宏任务中，接着就会继续执行`commitRoot`的逻辑，完成提交阶段；而开启的宏任务则会在页面渲染完成后，再进入主执行栈完成执行，从而实现了`useEffect`的副作用函数的异步执行

------

接下来实现执行副作用函数的方法`flushPassiveEffect`

在实现之前先看下这张`flushPassiveEffect`调用栈的示意图

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/flushPassiveEffects_1666783551920.jpg)

```js
/**
 * @description 执行卸载副作用 和 挂载副作用
 */
function flushPassiveEffect() {
  if (rootWithPendingPassiveEffects !== null) {
    const root = rootWithPendingPassiveEffects;
    //执行卸载副作用，destroy
    commitPassiveUnmountEffects(root.current);
    //执行挂载副作用 create
    commitPassiveMountEffects(root, root.current);
  }
}
```

`flushPassiveEffect`中是先调用的是执行 **卸载副作用`destroy`** 的方法`commitPassiveUnmountEffects`，后调用的是执行 **挂载副作用`create`** 的方法，这就解释了为何更新之后先执行的`destroy`后执行的`create`

------

实现提交挂载副作用的方法`commitPassiveMountEffects`

```js
/**
 * @description 执行挂载副作用 create
 * @param finishedWork 根fiber
 */
export function commitPassiveMountEffects(root, finishedWork) {
  commitPassiveMountOnFiber(root, finishedWork);
}
```

```js
/**
 * @description 执行挂载副作用 create
 * @param finishedWork 根fiber
 */
export function commitPassiveMountEffects(root, finishedWork) {
  commitPassiveMountOnFiber(root, finishedWork);
}
```

```js
function commitPassiveMountOnFiber(finishedRoot, finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork
      );
      break;
    }
    case FunctionComponent: {
      // 先处理子节点
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork
      );
      // 再处理自己
      if (flags & Passive) {
        // 如果函数组件的里面使用了useEffect,那么此函数组件对应的fiber上会有一个Passive flag
        commitHookPassiveMountEffects(
          finishedWork,
          HookHasEffect | HookPassive
        );
      }
      break;
    }
  }
}
```

```js
function recursivelyTraversePassiveMountEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child;
    while (child !== null) {
      commitPassiveMountOnFiber(root, child);
      child = child.sibling;
    }
  }
}
```

```js
/**
 * @description 提交挂载副作用
 */
function commitHookEffectListMount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect =
    updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    //获取 第一个effect
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      //如果此effect tag和传入的fiber flags 相同
      //都是 HookHasEffect | PassiveEffect
      if ((effect.tag & flags) === flags) {
        const create = effect.create;
        // 执行挂载副作用函数，并将其返回值，也就是卸载副作用赋值给effect的destroy
        effect.destroy = create();
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```

上面这段实现中主要完成了以下几件事

- **递归遍历子节点，先处理子节点上的`effect`副作用**：`recursivelyTraversePassiveMountEffects`
- **处理完子节点再处理自己的`effect`副作用：**`commitHookEffectListMount`
  - **通过当前`fiber`节点找到`effect`链表：**`finishedWork.updateQueue.lastEffect`
  - **依次执行`effect`对象上的`create`** <!--注意这里是从effect链表上依次取的create，create是用户传入的-->
  - **将`create`的返回值赋值给`effect`对象的`destroy`** <!--初次挂载时，effect上没有destroy，create执行之后effect上才有destroy，这也解释了为何只有更新之后才执行destroy-->

------

实现提交卸载副作用的方法`commitPassiveUnmountEffects`

```js
/**
 * @description 执行卸载副作用，destroy
 * @param finishedWork 根fiber
 */
export function commitPassiveUnmountEffects(finishedWork) {
  commitPassiveUnmountOnFiber(finishedWork);
}
```

```js
function commitPassiveUnmountOnFiber(finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      break;
    }
    case FunctionComponent: {
      // 先处理子节点的
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      // 再处理自己
      if (flags & Passive) {
        // 如果函数组件的里面使用了useEffect,那么此函数组件对应的fiber上会有一个Passive flag
        commitHookPassiveUnmountEffects(
          finishedWork,
          HookHasEffect | HookPassive
        );
      }
      break;
    }
  }
}
```

```js
/**
 * @description 递归遍历子fiber节点,处理子节点的副作用
 */
function recursivelyTraversePassiveUnmountEffects(parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child;
    while (child !== null) {
      commitPassiveUnmountOnFiber(child);
      child = child.sibling;
    }
  }
}
```

```js
/**
 * @description 执行自己的卸载副作用
 */
function commitHookPassiveUnmountEffects(finishedWork, hookFlags) {
  commitHookEffectListUnmount(hookFlags, finishedWork);
}

/**
 * @description 提交卸载副作用
 */
function commitHookEffectListUnmount(flags, finishedWork) {
  // 获取函数组件上的更新队列
  const updateQueue = finishedWork.updateQueue;
  const lastEffect =
    updateQueue !== null ? updateQueue.lastEffect : null;

  if (lastEffect !== null) {
    //获取 第一个effect
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      //如果此effect的tag和传入的fiber flag相同
      //都是 HookHasEffect | PassiveEffect
      if ((effect.tag & flags) === flags) {
        const destroy = effect.destroy;
        if (destroy !== undefined) {
          // 执行卸载副作用函数
          destroy();
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```

和`commitPassiveMountEffects`的实现基本一致，只不过是从`effect上`取值`destroy`进行执行

看下实现效果

```jsx
function FunctionComponent() {
  const [number, setNumber] = React.useState(0);
  React.useEffect(() => {
    console.log('useEffect1');
    return () => {
      console.log('destroy useEffect1');
    }
  });
  React.useEffect(() => {
    console.log('useEffect2');
    return () => {
      console.log('destroy useEffect2');
    }
  },[]);
  React.useEffect(() => {
    console.log('useEffect3');
    return () => {
      console.log('destroy useEffect3');
    }
  });
  return (<button onClick={() => setNumber(number + 1)}>{number}</button>)
}
```

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230224130406211.png" alt="image-20230224130406211" style="zoom:50%;" />

#### 2.2、更新时的useEffect

在`src/react-reconciler/src/ReactFiberHooks.js`中实现`updateEffect`

```js
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
  useEffect: updateEffect
};

/**
 * @description 更新时的useEffect
 * @param create 副作用函数
 * @param deps 依赖数组
 */
function updateEffect(create, deps) {
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}
```

```js
function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy;
  //上一个老hook
  if (currentHook !== null) {
    //从老useEffect hook上获取老effect对象 {create deps destroy}
    const prevEffect = currentHook.memoizedState;
    //获取销毁方法
    destroy = prevEffect.destroy;

    // 若是有依赖数组则进行对比
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 用新数组和老数组进行对比，如果一样的话，则直接退出
        //不管要不要重新执行，都需要把新的effect组成完整的循环链表放到fiber.updateQueue
        hook.memoizedState = pushEffect(
          hookFlags,
          create,
          destroy,
          nextDeps
        );
        return;
      }
    }
  }
  //如果要执行副作用函数的话，需要修改fiber的flags
  currentlyRenderingFiber.flags |= fiberFlags;
  //如果要执行副作用函数的话，需要给hook对象添加HookHasEffect flag
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    destroy,
    nextDeps
  );
}
```

```js
function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) return null;
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}
```

上面这段实现中做了以下几件事

- **根据旧`hook`对象构建新的`hook`对象**：`updateWorkInProgressHook` <!--和useReducer、useState一致-->

- **比较旧`deps`（保存在旧`hook`对象的memoizedState上）和新`deps`（函数组件中`useEffect`传入）**

  - **若一致**，则构建新的`effect`对象，挂到新`hook`对象的`memoizedState`上

    ⚠️注意新旧`deps`一致时:

    - `effect`的`tag`不包含`HookHasEffect`
    - 没有给`fiber` 添加`PassiveEffect flags`

  - **若不一致**，则同样构建新的`effect`对象，挂到新`hook`对象的`memoizedState`上

    ⚠️不同的是:

    - `effect`的`tag`包含了`HookHasEffect` <!--effect上有HookHasEffect，说明此useEffect需要执行destroy和create-->

    - 给`fiber`上添加了`PassiveEffect flags` <!--fiber上有PassiveEffect，说明当前fiber有useEffect-->

      ```
       currentlyRenderingFiber.flags |= fiberFlags;
      ```

  <!--这里就是useEffect依赖数组的机制，更新时执行useEffect会一一比对依赖数组中的数据，若是不一致才会给fiber和hook对象上增加标识，这样后续commit阶段才会走到前面实现的执行副作用的方法commitPassiveUnmountEffects和commitPassiveMountEffects中-->

`useEffect`的实现到这里就完成了，看下实现效果👇

JSX

```jsx
function FunctionComponent() {
  const [number, setNumber] = React.useState(0);
  React.useEffect(() => {
    console.log('useEffect1');
    return () => {
      console.log('destroy useEffect1');
    }
  });
  React.useEffect(() => {
    console.log('useEffect2');
    return () => {
      console.log('destroy useEffect2');
    }
  },[]);
  React.useEffect(() => {
    console.log('useEffect3');
    return () => {
      console.log('destroy useEffect3');
    }
  });
  return (<button onClick={() => setNumber(number + 1)}>{number}</button>)
}
```

打印结果

![image-20230224133647188](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230224133647188.png)

由于`useEffect2`的依赖数组是个空数组，前后没有变化，所以其`effect`对象上没有对应`tag`，从而没有执行`destroy`和`create`

### 三、实现useLayoutEffect

`useLayoutEffect`的实现和`useEffect`基本一致

改造下`main.jsx`

```jsx
import * as React from 'react';
import { createRoot } from "react-dom/client";

function FunctionComponent() {
  const [number, setNumber] = React.useState(0);
  React.useEffect(() => {
    console.log('useEffect1');
    return () => {
      console.log('destroy useEffect1');
    }
  });
  React.useLayoutEffect(() => {
    console.log('useLayoutEffect2');
    return () => {
      console.log('destroy useLayoutEffect2');
    }
  });
  React.useEffect(() => {
    console.log('useEffect3');
    return () => {
      console.log('destroy useEffect3');
    }
  });
  React.useLayoutEffect(() => {
    console.log('useLayoutEffect4');
    return () => {
      console.log('destroy useLayoutEffect4');
    }
  });
  return (<button onClick={() => setNumber(number + 1)}>{number}</button>)
}
let element = <FunctionComponent />
const root = createRoot(document.getElementById("root"));
root.render(element);
```

给`ReactCurrentDispatcher`中添加`useLayooutEffect`

```js
// src/react/index.js
export {
  //如果我们有一些希望在不同的内部模块之间共享的变量可以保存在此变量上
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  useState,
  useReducer,
  useEffect,
  useLayooutEffect
} from './src/React';

```

```js
// src/react/src/React.js
import { useReducer, useState, useEffect, useLayoutEffect } from './ReactHooks';
import ReactSharedInternals from './ReactSharedInternals';
export {
  useState,
  useReducer,
  useEffect,
  useLayooutEffect,
  ReactSharedInternals as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
}
```

```js
// src/react/src/ReactHooks.js
import ReactCurrentDispatcher from './ReactCurrentDispatcher';

export function useEffect(create, deps) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useLayooutEffect(create, deps);
}
```

在`src/react-reconciler/src/ReactFiberHooks.js`中实现`mountLayoutEffect`和`updateLayoutEffect`

```js
const HooksDispatcherOnMount = {
  useReducer: mountReducer,
  useState: mountState,
  useEffect: mountEffect,
  useLayoutEffect: mountLayoutEffect
};

function mountLayoutEffect(create, deps) {
  return mountEffectImpl(UpdateEffect, HookLayout, create, deps);
}
```

```js
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
  useEffect: updateEffect,
  useLayoutEffect: updateLayoutEffect
};

function updateLayoutEffect(create, deps) {
  return updateEffectImpl(UpdateEffect, HookLayout, create, deps);
}
```

这里的实现复用了useEffect的，只是fiber的flag标识和effect的tag标识不一样

------

在src/react-reconciler/src/ReactFiberWorkLoop.js中实现useLayoutEffect的副作用提交方法

```js
function commitRoot(root) {
  const { finishedWork } = root;
  // printFinishedWork(finishedWork);

  //若是新的fiber树上有Passive则说明有函数组件使用了useEffect
  if (
    (finishedWork.subtreeFlags & Passive) !== NoFlags ||
    (finishedWork.flags & Passive) !== NoFlags
  ) {
    //若此根节点上有useEffect类似的副作用
    if (!rootDoesHavePassiveEffect) {
      // scheduleCallback会开启一个新的宏任务，只需执行一次即可
      rootDoesHavePassiveEffect = true;
      scheduleCallback(flushPassiveEffect);
    }
  }
  console.log('~~~~~~~~~~~~DOM执行变更前~~~~~~~~~~~~~~~~~~');
  //判断子树有没有副作用
  const subtreeHasEffects =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffect =
    (finishedWork.flags & MutationMask) !== NoFlags;
  //如果自己的副作用或者子节点有副作用就进行提交DOM操作
  if (subtreeHasEffects || rootHasEffect) {
    commitMutationEffectsOnFiber(finishedWork, root);
    console.log('~~~~~~~~~~~~DOM执行变更后~~~~~~~~~~~~~~~~~~');
    commitLayoutEffects(finishedWork, root);
    //当DOM执行变更之后
    if (rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = false;
      // 具有useEffect副作用的根节点
      rootWithPendingPassiveEffects = root;
    }

    //等DOM变更后，就可以把让root的current指向新的fiber树
    root.current = finishedWork;
  }
}

```

增加的部分

```js
commitLayoutEffects(finishedWork, root);
```

注意⚠️这里`commitLayoutEffects`调用的位置，是在`commitMutationEffectsOnFiber`之后被调用的，这里并不像`useEffect`开启了一个宏任务，而是DOM操作之后立刻同步执行的，所以这也解释了为何`useLayoutEffect`是同步执行的了

------

实现`commitLayoutEffects`

```js
// src/react-reconciler/src/ReactFiberCommitWork.js
export function commitLayoutEffects(finishedWork, root) {
  //老的根fiber
  const current = finishedWork.alternate;
  commitLayoutEffectOnFiber(root, current, finishedWork);
}

function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      break;
    }
    case FunctionComponent: {
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      if (flags & LayoutMask) {// LayoutMask=Update=4
        commitHookLayoutEffects(finishedWork, HookHasEffect | HookLayout);
      }
      break;
    }
  }
}
function recursivelyTraverseLayoutEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & LayoutMask) {
    let child = parentFiber.child;
    while (child !== null) {
      const current = child.alternate;
      commitLayoutEffectOnFiber(root, current, child);
      child = child.sibling;
    }
  }
}
function commitHookLayoutEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork);
}

```

`commitLayoutEffects`的实现和`commitPassiveMountEffects`基本一致，甚至后面直接复用了`commitHookEffectListMount`

到这里`useLayoutEffect`的实现就完成了，看下实现效果👇

JSX

```jsx
function FunctionComponent() {
  const [number, setNumber] = React.useState(0);
  React.useEffect(() => {
    console.log('useEffect1');
    return () => {
      console.log('destroy useEffect1');
    }
  });
  React.useLayoutEffect(() => {
    console.log('useLayoutEffect2');
    return () => {
      console.log('destroy useLayoutEffect2');
    }
  });
  React.useEffect(() => {
    console.log('useEffect3');
    return () => {
      console.log('destroy useEffect3');
    }
  });
  React.useLayoutEffect(() => {
    console.log('useLayoutEffect4');
    return () => {
      console.log('destroy useLayoutEffect4');
    }
  });
  return (<button onClick={() => setNumber(number + 1)}>{number}</button>)
}
```

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230224142115679.png" alt="image-20230224142115679" style="zoom:50%;" />

可以发现`useLayoutEffect`的副作用函数是在DOM操作之后立即执行的，而`useEffect`的副作用函数则是在一个新的宏任务中执行的