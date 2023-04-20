## React18源码解析（十一）实现useReducer

### 一、前言

#### 1.1、React Hooks

React Hooks 是 React 16.8 引入的一项新特性，它可以==让函数组件具有类组件的一些特性==，例如状态管理、生命周期函数等。通过使用 Hooks，可以将状态管理逻辑从组件中提取出来，使组件更加简洁、易于理解和维护。**==每个 Hook 都是一个函数，接收一些参数，返回一个数组或对象，用于在组件中进行状态管理和操作==**。

#### 1.2、useReducer

`useReducer` 是 React Hooks 中的一个**==函数==**，使用 `useReducer` 可以**==在组件内部管理一个复杂的状态，并将更新逻辑集中到一个地方。==**

使用 `useReducer` 需要传入一个 `reducer` 函数和一个初始状态对象。`reducer` 函数接收两个参数：当前的 `state` 和 `action`，它返回一个新的 `state` 对象，这个新的 `state` 对象会替代原来的 `state`。根据 `action` 的类型和数据，`reducer` 函数会计算出一个新的 `state` 对象。在组件中，可以通过 `dispatch` 函数来触发一个 `action`，从而改变 `state` 的值。

下面是一个示例：

```jsx
import React, { useReducer } from 'react';

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    default:
      throw new Error();
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <div>
      Count: {state.count}
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
    </div>
  );
}
```

在这个示例中，使用了 `useReducer` 来管理一个计数器的状态。`reducer` 函数根据不同的 `action` 来计算新的 `state` 值。在组件中，可以通过调用 `dispatch` 函数来触发一个 `action`，从而改变 `state` 的值。在这个例子中，点击加号或减号会触发对应的 `action`，从而更新 `state` 的值，并重新渲染组件。

使用 `useReducer` 可以实现复杂的逻辑，比如处理表单数据、管理多个状态等。它可以帮助我们更好地组织代码，让组件的逻辑更加清晰易懂。

那么接下来就实现`useReducer`这个`hook`

### 二、useReducer的实现

#### 2.1、dispatchReducerAction

首先改造下`main.jsx`，增加`useReducer`的使用

```jsx
import * as React from "react";
import { createRoot } from "react-dom/client";
const reducer = (state, action) => {
  if (action.type === "add") return state + 1;
  return state;
};
function FunctionComponent() {
  const [number, setNumber] = React.useReducer(reducer, 0);
    return (
    <button
      onClick={() => {
        setNumber({ type: 'add', payload: 1 }); 
        setNumber({ type: 'add', payload: 2 }); 
        setNumber({ type: 'add', payload: 3 }); 
      }}
    >
      {number}
    </button>
  );
}
let element = <FunctionComponent />;
const root = createRoot(document.getElementById("root"));
root.render(element);
```

再回顾下函数组件挂载时的`renderWithHooks`方法

```js
/**
 * 渲染函数组件
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} Component 组件定义
 * @param {*} props 组件属性
 * @returns 虚拟DOM或者说React元素
 */
export function renderWithHooks(
  current,
  workInProgress,
  Component,
  props
) {
  const children = Component(props);
  return children;
}
```

`Component(props)`是==执行函数组件获取其返回的VDom==，而Hooks是Component内部进行调用的，所以在`Component(props)`执行之前应当有一部分处理Hooks的逻辑

注意⚠️`useReducer`的调用方式

```js
const [number, setNumber] = React.useReducer(reducer, 0);
```

`useReducer`是从React中获取的 <!--所有的Hooks都是--> ，而且每个Component中的Hooks都是用户自己选择的，可能有许多不同的Hooks <!--每个函数组件都会记录下自己用的是什么Hooks-->，并且Hooks是区分挂载时和更新时，所以在函数组件执行前，需要为每个函数组件进行Hooks的派发

------

实现Hooks的派发器`ReactCurrentDispatcher`

首先在`src/react/index.js`完成React的导出

```js
// src/react/index.js
export {
  //如果我们有一些希望在不同的内部模块之间共享的变量可以保存在此变量上
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  useReducer
} from './src/React';
```

```js
// src/react/src/React.js
import { useReducer } from './ReactHooks';
import ReactSharedInternals from './ReactSharedInternals';
export {
  useReducer,
  ReactSharedInternals as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
}
```

其中 `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`是一个内部变量，用于React不同的内部模块之间共享 <!--ReactCurrentDispatcher就是在这个内部变量上，后面renderWithHooks就是从它这里获取ReactCurrentDispatcher-->

那么是如何共享的呢？

在`src/shared/ReactSharedInternals.js`中引入`__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`

```js
import * as React from 'react';
const ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
export default ReactSharedInternals

```

React中各个模块中最后使用的都是`shared`包中的`ReactSharedInternals`，没有直接从`react`包中引入

------

在`src/react/src/ReactHooks.js`中实现`useReducer`

```js
import ReactCurrentDispatcher from './ReactCurrentDispatcher';

function resolveDispatcher() {
  return ReactCurrentDispatcher.current;
}

/**
 * 
 * @param {*} reducer 处理函数，用于根据老状态和动作计算新状态
 * @param {*} initialArg 初始状态
 */
export function useReducer(reducer, initialArg) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg);
}
```

==这里的`useReducer`就是最终我们在函数组件中使用的`React.useReducer`==，但这里并没有具体逻辑，只是封装了下

可以注意到最后的返回值是`dispatcher.useReducer(reducer, initialArg)`，也就是说具体逻辑应当在`dispatcher.useReducer`上

看下`dispatcher`

```js
function resolveDispatcher() {
  return ReactCurrentDispatcher.current;
}

const dispatcher = resolveDispatcher();
```

可以发现这里的`dispatcher`就是`ReactCurrentDispatcher.current`，也就是Hooks的派发器

------

在`src/react/src/ReactCurrentDispatcher.js`中实现并导出`ReactCurrentDispatcher`

```js
const ReactCurrentDispatcher = {
  current: null
}
export default ReactCurrentDispatcher;
```

`ReactCurrentDispatcher`只是个对象，它的`current`属性初始是`null`，后续在`renderWithHooks`中会为其进行赋值，也就是说函数组件中的`React.useReducer`是什么样的，完全取决于派发器上的`current.useReducer`属性挂载了什么方法 <!--所有的Hooks都是这样-->

<!--只是这样看，可能会觉得有点绕，一个变量导出来引进去的，但是React中模块众多，需要将相同的逻辑抽离出来，所以这样的文件结构也是难免的-->

------

接下来在`renderWithHooks`中实现具体的`useReducer`逻辑，并将其挂到派发器`ReactCurrentDispatcher`上

在具体实现之前可以先看下这张**==挂载时==**Hooks派发的流程图，可以先了解下整个流程和组件上的`hooks`链<!--链表结构，类似于fiber链-->

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230219120847198.png" alt="image-20230219120847198" style="zoom:50%;" />

 完善`renderWithHooks`

```js
// src/react-reconciler/src/ReactFiberHooks.js
import ReactSharedInternals from "shared/ReactSharedInternals";

const { ReactCurrentDispatcher } = ReactSharedInternals;

// 当前正在渲染的fiber
let currentlyRenderingFiber = null;
// 当前正在工作的hook
let workInProgressHook = null;

const HooksDispatcherOnMount = {
  useReducer: mountReducer
}

/**
 * 渲染函数组件
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} Component 组件定义
 * @param {*} props 组件属性
 * @returns 虚拟DOM或者说React元素
 */
export function renderWithHooks(current, workInProgress, Component, props) {
  currentlyRenderingFiber = workInProgress;//Function组件对应的fiber
  ReactCurrentDispatcher.current = HooksDispatcherOnMount;

  //需要要函数组件执行前给ReactCurrentDispatcher.current赋值
  const children = Component(props);
  return children;
}
```

增加的部分

- 用全局变量`currentlyRenderingFiber`记录当前函数组件对应的`fiber`（新的，正在计算的）
- 给派发器`ReactCurrentDispatcher`的`current`属性上挂上`Hooks`  <!--就是在这里给派发器上添加的Hooks，后面Component(props)执行时，函数组件中的useReducer就是现在挂上去的-->

```js
ReactCurrentDispatcher.current = HooksDispatcherOnMount;

const HooksDispatcherOnMount = {
  useReducer: mountReducer
}
```

<!--通过变量名`HooksDispatcherOnMount`（挂载时的`Hooks`），不难推断出后面还有更新时的`Hooks`，-->

那么现在先实现挂载时的`useReducer` ： `mountReducer`

------

**实现挂载时的`useReducer` ：`mountReducer`**

```js
// src/react-reconciler/src/ReactFiberHooks.js
/**
 * @description 挂载Reducer这个hook
 * @param reducer 用户创建的reducer方法，useReducer(reducer, initialArg)
 * @param initialArg 初始值
 */
function mountReducer(reducer, initialArg) {
  const hook = mountWorkInProgressHook();
  // hook对象上的memoizedState存的就是组件中用的状态
  hook.memoizedState = initialArg;
  const queue = {
    pending: null,
    dispatch: null
  }
  hook.queue = queue;
  const dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue);
  return [hook.memoizedState, dispatch];
}
```

<!--首先需要注意⚠️的一点时，这里的两个入参`reducer`和`initialArg`，是在组件中用户自定义的-->

`mountReducer`中主要完成了以下几部分内容

- **创建`hook`对象**：调用`mountWorkInProgressHook`

  ```js
  const hook = mountWorkInProgressHook();
   hook.memoizedState = initialArg;
    const queue = {
      pending: null
    }
    hook.queue = queue;
  ```

  `fiber`节点上的**==memoizedState==**是用来存储==自己的状态==，每一种`fiber`的状态存的类型是不一样的

  - **HostRootFiber**上存的就是要渲染的元素
  - 而函数组件`fiber`上的`memoizedState`属性上存储的就是它自己的**Hooks**
    - 函数组件`fiber`上的`memoizedState`属性上存储的Hooks，采用了单向链表结构，形成了一个 `hooks`链<!--可以参考下面的结构示意图帮助理解-->

  <!--为何有hooks链，这是因为一个函数组件上可能不止用了一个useReducer方法，后面其他Hooks方法也会调用这个方法，同样会挂到fiber的memoizedState上-->

  <img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230219142629269.png" alt="image-20230219142629269" style="zoom:50%;" />

- **创建`useReducer`的`dispatch`**：调用`dispatchReducerAction.bind(null, currentRenderingFiber, queue)`

  注意⚠️这里给`dispatchReducerAction`传递的入参

  - `currentRenderingFiber`：当前组件对应的`fiber`

  - `queue`：`hook`对象上的更新队列，这个`queue`是每个`ReducerHook`对象**==独有的==**，不能混淆 <!--存在一个组件中，多个useReducer的情况-->，也是为了后面`dispatch`时可以正确取到更新内

    ==同一个`ReducerHook`不管`dispatch`多少次，用的都是同一个`queue`== <!--这里的更新队列queue，和之前fiber上的更新队列是一样的-->

- **返回`[state, dispatch]`** : `[hook.memoizedState, dispatch]` <!--最后用户拿到的就是这个-->

------

**实现创建`hook`对象的方法：`mountWorkInProgressHook`**

```js
// src/react-reconciler/src/ReactFiberHooks.js
/**
 * @description 挂载构建中的hook
 * hook是个对象
 */
 function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,//hook的状态 0
    queue: null,//存放本hook的更新队列 queue.pending=update的循环链表
    next: null //指向下一个hook,一个函数里可以会有多个hook,它们会组成一个单向链表
  };
  if (workInProgressHook === null) {
    //当前函数对应的fiber的状态等于第一个hook对象
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}
```

这里的逻辑可以分为两部分

- 若是第一个`hook`对象，则直接挂到函数组件`fiber`的`memoizedState`属性上，并记录到全局变量`workInProgressHook`上
- 若不是第一个`hook`对象，则挂到上一个`hook`的`next`属性上 

------

**实现创建dispatch的方法：`dispatchReducerAction`**

```js
// src/react-reconciler/src/ReactFiberHooks.js
/**
 * 执行派发动作的方法，它要更新状态，并且让界面重新更新
 * @param {*} fiber function对应的fiber
 * @param {*} queue hook对应的更新队列
 * @param {*} action 派发的动作
 */
function dispatchReducerAction(fiber, queue, action) {
  console.log(fiber, queue, action);
}
```

暂时不添加具体逻辑，先打印看下实现效果👇

JSX

```jsx
function FunctionComponent() {
  const [number, setNumber] = React.useReducer(counter, 0);
  const [number2, setNumber2] = React.useReducer(counter, 0);
  return (
    <button
      onClick={() => {
        setNumber({ type: 'add', payload: 1 }); //update1=>update2=>update3=>update1
        setNumber({ type: 'add', payload: 2 }); //update2
        setNumber({ type: 'add', payload: 3 }); //update3
      }}
    >
      {number}
    </button>
  );
}
```

`onClick`之后打印结果

![image-20230219150112226](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230219150112226.png)

可以看到**FunctionComponent**上的`memoizedState`属性成功挂上`hooks`链

下面👇这个是`useReducer`挂载时创建的示意图

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230219120847198.png" alt="image-20230219120847198" style="zoom:50%;" />

整个**==挂载时==**Hooks派发过程，就是根据用户在组件内使用到的Hooks创建`hooks`链

接下来继续实现`useReducer`的更新：`dispatch`

#### 3.2、diapatch

**完善创建dispatch的方法:`dispatchReducerAction`**

```js
// src/react-reconciler/src/ReactFiberHooks.js
/**
 * 执行派发动作的方法，它要更新状态，并且让界面重新更新
 * @param {*} fiber function对应的fiber
 * @param {*} queue hook对应的更新队列
 * @param {*} action 派发的动作
 */
function dispatchReducerAction(fiber, queue, action) {
  //在每个hook里会存放一个更新队列
  //更新队列是一个更新对象的循环链表update1.next=update2.next=update1
  const update = {
    action, //{ type: 'add', payload: 1 } 派发的动作
    next: null //指向下一个更新对象
  };
  //把当前的最新的更新添加更新队列中，并且返回当前的根fiber
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  // 调度更新，重新渲染 需要注意这个是宏任务，所以多次dispatch会批量更新
  scheduleUpdateOnFiber(root);
}
```

增加了以下内容：

- **创建更新对象 `update`** <!--每次dispatch都会创建一个update-->

- **把当前的最新的更新添加到更新队列中，并且返回当前的根`fiber`**： `enqueueConcurrentHookUpdate` 

  每次用户调用`dispatch`，就会传入`action`，这里需要将更新内容包装成更新对象`update`

  <!--注意这个方法的名字enqueueConcurrentHookUpdate（入队并发更新Hook更新），为何是并发更新（批量更新）？这个在后面的调度模块（schedule）中会有详细说明-->

- **拿到根`fiber`进行调度更新，重新渲染**：`scheduleUpdateOnFiber(root)` <!--ReactFiberWorkLoop中的方法，初次渲染时就是调用的这个方法完成的挂载-->

------

**实现将更新内容入队的方法：`enqueueConcurrentHookUpdate`**

```js
// src/react-reconciler/src/ReactFiberConcurrentUpdates.js
import { HostRoot } from './ReactWorkTags';
const concurrentQueue = [];
let concurrentQueuesIndex = 0;

/**
 * 把更新先缓存到concurrentQueue数组中
 * @param {*} fiber
 * @param {*} queue
 * @param {*} update
 */
function enqueueUpdate(fiber, queue, update) {
  //012 setNumber1 345 setNumber2 678 setNumber3
  concurrentQueue[concurrentQueuesIndex++] = fiber; //函数组件对应的fiber
  concurrentQueue[concurrentQueuesIndex++] = queue; //要更新的hook对应的更新队列
  concurrentQueue[concurrentQueuesIndex++] = update; //更新对象
}

/**
 * @description 获取根 root
 */
function getRootForUpdatedFiber(sourceFiber) {
  let node = sourceFiber;
  let parent = node.return;
  while (parent !== null) {
    node = parent;
    parent = node.return;
  }
  return node.tag === HostRoot ? node.stateNode : null; //FiberRootNode div#root
}

/**
 * @description 把更新队列添加到更新队列中
 * @param {*} fiber 函数组件对应的fiber
 * @param {*} queue 要更新的hook对应的更新队列
 * @param {*} update 更新对象
 */
 export function enqueueConcurrentHookUpdate(fiber, queue, update) {
  enqueueUpdate(fiber, queue, update);
  return getRootForUpdatedFiber(fiber);
}
```

`enqueueConcurrentHookUpdate`中主要做了两件事

- **把更新先缓存到全局变量`concurrentQueue`数组中**：`enqueueUpdate` 

  - `concurrentQueue`是一个一维数组，一次`dispatch`存入三个元素 <!--不理解为何这样设计-->

    <!--⚠️需要注意的一点，由于`concurrentQueue`是全局变量，所以其中存的更新内容可能是不同的`useReducerHook`的更新内容-->

- **返回根（`root`）**: `return getRootForUpdatedFiber(fiber)`

------

`concurrentQueue`的数据结构肯定不适合计算更新内容，所以还是要将更新内容放到`hook`对象上的`queue`上，如何将更新内容入队呢？看下面👇

```js
// src/react-reconciler/src/ReactFiberConcurrentUpdates.js
export function finishQueueingConcurrentUpdates() {
  const endIndex = concurrentQueuesIndex;
  concurrentQueuesIndex = 0;
  let i = 0;
  while (i < endIndex) {
    const fiber = concurrentQueue[i++];
    const queue = concurrentQueue[i++];
    const update = concurrentQueue[i++];
    if (queue !== null && update !== null) {
      const pending = queue.pending;
      if (pending === null) {
        update.next = update;
      } else {
        update.next = pending.next;
        pending.next = update;
      }
      queue.pending = update;
    }
  }
}
```

这里的逻辑不复杂还是之前更新队列的那套逻辑，可以回顾下更新队列的示意图

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/queuepending_1644750048819.png" alt="img" style="zoom:50%;" />

<!--和之前的更新队列不同的是，由于`concurrentQueue`中可能缓存了不同`useReducerHook`的更新内容，所以这里的入队操作的可能不止一个`queue`。但是由于同一个`useReducerHook`不管`dispatch`几次都是用的同一个`queue`，再加上`concurrentQueue`特殊的缓存方式👇-->

> ```js
> function enqueueUpdate(fiber, queue, update) {
>   //012 setNumber1 345 setNumber2 678 setNumber3
>   concurrentQueue[concurrentQueuesIndex++] = fiber; //函数组件对应的fiber
>   concurrentQueue[concurrentQueuesIndex++] = queue; //要更新的hook对应的更新队列
>   concurrentQueue[concurrentQueuesIndex++] = update; //更新对象
> }
> ```

<!--所以可以保证同一个`useReducerHook`的更新内容只会保存到自己的`queue`上-->

更新内容的入队方法`finishQueueingConcurrentUpdates`已经实现，但是在哪里调用呢？

是在`ReactFiberWorkLoop`中的`prepareFreshStack`中调用的

```js
/**
 * @description 根据老的fiber树创建一个全新的fiber树，后续用于替换掉老的fiber树
 */
function prepareFreshStack(root) {
  // 创建一个workInProgress（执行中的工作）
  workInProgress = createWorkInProgress(root.current, null);
  finishQueueingConcurrentUpdates();
}
```

`prepareFreshStack`是在`scheduleUpdateOnFiber`中被调用的，而`dispatchReducerAction`最后会调用`scheduleUpdateOnFiber`进行调度更新重新渲染。

所以`useReducerHook` `dispatch`时更新内容的处理顺序是 `dispatch` ——》`enqueueConcurrentHookUpdate`将更新内容缓存在`concurrentQueue`中 ——》`scheduleUpdateOnFiber`调度更新——》`finishQueueingConcurrentUpdates`将更新内容进行入列操作放到`useReducerHook`的`queue`上

最后看下实现效果

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230219202120145.png" alt="image-20230219202120145" style="zoom:50%;" />

更新内容已经添加到更新队列上了，那么接下来便是计算更新内容从而更新状态最终重新渲染

#### 2.3、HooksDispatcherOnUpdateInDEV

在实现更新内容的计算前先看下👇这个示意图，其实整个过程不复杂就是通过`action`和`queue`计算出`newState`，再将其挂到新的`useReducerHook`上

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230219160059944.png" alt="image-20230219160059944" style="zoom:50%;" />



接下来具体实现

首先在2.2实现的`dispatch`中，最后会调用`scheduleUpdateOnFiber`，而`scheduleUpdateOnFiber`中会执行**工作循环**计算一颗新的`fiber`树，所以接下来从`beginWork`这里开始完善

##### 2.3.1、beginWork

先回顾下`beginWork`

```js
// src/react-reconciler/src/ReactFiberBeginWork.js

/**
 * @description 目标是根据新虚拟DOM构建新的fiber子链表 .child .sibling
 * @param current 老fiber
 * @param workInProgress 新的fiber h1
 */
export function beginWork(current, workInProgress) {
  switch (workInProgress.tag) {
    case IndeterminateComponent:
      /*
      React里组件有两种，一种是函数组件，一种是类组件，但是它们都是都是函数
      组件fiber的tag最开始便是IndeterminateComponent
      */
      return mountIndeterminateComponent(
        current,
        workInProgress,
        workInProgress.type
      );
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

工作循环从`HostRootFiber`开始，也就是`updateHostRoot`

再回顾下`updateHostRoot`中的`reconcileChildren`逻辑

```js
/**
 * @description 返回协调子fiber的方法
 * @param shouldTrackSideEffects 是否跟踪副作用
 */
function createChildReconciler(shouldTrackSideEffects) {

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
    /*
      初次挂载时，老fiber节点currentFirstChild肯定是没有的
      所以可以直接根据虚拟DOM创建新的Fiber节点
    */
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }
  
  // ...

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
      // ...
  }

  return reconcileChildFibers;
}
```

当`HostRootFiber`只有一个子节点时，走`reconcileSingleElement`，而之前`reconcileSingleElement`中只实现了老`fiber`没有子`fiber`的情况，但是现在是更新的情况，老`HostRootFiber`上是有`FunctionComponent`的，所以这里需要完善`reconcileSingleElement`

```js
  /**
   * @description 复用fiber
   * @param fiber 老的fiber节点
   * @param pendingProps 新虚拟DOM的props
   */
  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

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

    /*
      初次挂载时，老fiber节点currentFirstChild肯定是没有的
      所以可以直接根据虚拟DOM创建新的Fiber节点
    */
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }
```

这里增加的逻辑是从第一个子`fiber`开始，遍历老的父`fiber`的所有的子`fiber`，根据新VDom的`key`和`type`判断是否有老的子`fiber`的可以直接复用；

若可以复用则直接复制老`fiber`

```js
  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }
```

<!--`createWorkInProgress`是根据老`fiber`创建新`fiber`的方法-->

------

`beginWork`处理完了`HostRootFiber`之后，便要处理`FunctionComponent`

给`beginWork`添加`FunctionComponent`的处理方式

```js
// src/react-reconciler/src/ReactFiberBeginWork.js

export function beginWork(current, workInProgress) {
  switch (workInProgress.tag) {
    case IndeterminateComponent:
      /*
      React里组件有两种，一种是函数组件，一种是类组件，但是它们都是都是函数
      组件fiber的tag最开始便是IndeterminateComponent
      */
      return mountIndeterminateComponent(
        current,
        workInProgress,
        workInProgress.type
      );
    case FunctionComponent: {
      const Component = workInProgress.type;
      const nextProps = workInProgress.pendingProps;
      return updateFunctionComponent(
        current,
        workInProgress,
        Component,
        nextProps
      );
    }
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

添加的部分

```js
  case FunctionComponent: {
    const Component = workInProgress.type;
    const nextProps = workInProgress.pendingProps;
    return updateFunctionComponent(
      current,
      workInProgress,
      Component,
      nextProps
    );
  }
```

<!--注意⚠️由于是更新，此时的函数组件对应的`fiber`的`tag`不再是IndeterminateComponent而是FunctionComponent，挂载时将IndeterminateComponent改成了FunctionComponent-->

------

**接着实现`updateFunctionComponent`**

```js
// src/react-reconciler/src/ReactFiberBeginWork.js

/**
 * @description 更新函数组件
 * @param {*} current 老fiber
 * @param {*} workInProgress 新的fiber
 * @param {*} Component workInProgress.type 组件类型，也就是函数组件的定义
 * @param nextProps workInProgress.pendingProps 新VDom的props
 */
export function updateFunctionComponent(
  current,
  workInProgress,
  Component,
  nextProps
) {
  const nextChildren = renderWithHooks(
    current,
    workInProgress,
    Component,
    nextProps
  );
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}
```

这段逻辑也不复杂，调用`renderWithHooks`创建`FunctionComponent`新的VDom，所以接下来也要完善`renderWithHooks`方法，添加更新时的逻辑

------

**完善`renderWithHooks`**

```js
// src/react-reconciler/src/ReactFiberHooks.js
import ReactSharedInternals from 'shared/ReactSharedInternals';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates';

const { ReactCurrentDispatcher } = ReactSharedInternals;

// 当前正在渲染的fiber
let currentlyRenderingFiber = null;
// 当前正在工作的hook
let workInProgressHook = null;
// 老hook
let currentHook = null;

const HooksDispatcherOnUpdate = {
  useReducer: updateReducer
};

/**
 * 渲染函数组件
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} Component 组件定义
 * @param {*} props 组件属性
 * @returns 虚拟DOM或者说React元素
 */
export function renderWithHooks(
  current,
  workInProgress,
  Component,
  props
) {
  currentlyRenderingFiber = workInProgress; //Function组件对应的fiber
  //如果有老的fiber,并且有老的hook链表
  if (current !== null && current.memoizedState !== null) {
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
  } else {
    ReactCurrentDispatcher.current = HooksDispatcherOnMount;
  }
  //需要要函数组件执行前给ReactCurrentDispatcher.current赋值
  const children = Component(props);
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  return children;
}

```

由于是更新，那么老`fiber` （`current`）必然有值，所以此时应该将派发器`ReactCurrentDispatcher`重新赋值为更新时的`useReducer`

```js
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer
};

ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
```

------

**实现`updateReducer`**

```js
// src/react-reconciler/src/ReactFiberHooks.js

/**
 * @description 构建新的hooks
 */
function updateWorkInProgressHook() {
  //获取将要构建的新的hook的老hook
  if (currentHook === null) {
    // 获取老fiber
    const current = currentlyRenderingFiber.alternate;
    //获取老hook
    currentHook = current.memoizedState;
  } else {
    currentHook = currentHook.next;
  }
  //根据老hook创建新hook
  const newHook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null
  };

  if (workInProgressHook === null) {
    // 新fiber的memoizedState挂上新hook
    currentlyRenderingFiber.memoizedState = workInProgressHook =
      newHook;
  } else {
    workInProgressHook = workInProgressHook.next = newHook;
  }
  return workInProgressHook;
}

function updateReducer(reducer) {
  //获取新的hook
  const hook = updateWorkInProgressHook();
  //获取新的hook的更新队列
  const queue = hook.queue;
  //获取老的hook
  const current = currentHook;
  //获取将要生效的更新队列
  const pendingQueue = queue.pending;
  //初始化一个新的状态，取值为当前的状态
  let newState = current.memoizedState;

  // 处理hook上的更新队列
  if (pendingQueue !== null) {
    // 断开pending
    queue.pending = null;
    // 获取更新队列上第一个更新对象
    const firstUpdate = pendingQueue.next;
    let update = firstUpdate;
    // 使用用户自定义的reducer计算新状态
    do {
      const action = update.action;
      newState = reducer(newState, action);
      update = update.next;
    } while (update !== null && update !== firstUpdate);
  }
  // 将新状态添加到hook上，并返回给组件使用
  hook.memoizedState = newState;
  return [hook.memoizedState, queue.dispatch];
}
```

`updateReducer`中主要完成了以下内容

- **根据老`hook`对象创建新`hook`对象**：`updateWorkInProgressHook`

- **计算老`hook`更新队列上的更新内容的到==新的状态==并返回给组件使用**

  ```js
    // 处理hook上的更新队列
    if (pendingQueue !== null) {
      // 断开pending
      queue.pending = null;
      // 获取更新队列上第一个更新对象
      const firstUpdate = pendingQueue.next;
      let update = firstUpdate;
      // 使用用户自定义的reducer计算新状态
      do {
        const action = update.action;
        newState = reducer(newState, action);
        update = update.next;
      } while (update !== null && update !== firstUpdate);
    }
    // 将新状态添加到hook上，并返回给组件使用
    hook.memoizedState = newState;
    return [hook.memoizedState, queue.dispatch];
  ```

看下实现效果，打印下`renderWithHooks`执行的结果，看下新的VDom长什么样

![image-20230219231436050](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230219231436050.png)

对比下JSX

```jsx
function FunctionComponent() {
  const [number, setNumber] = React.useReducer(counter, 0);
  const [number2, setNumber2] = React.useReducer(counter, 0);
  return (
    <button
      onClick={() => {
        setNumber({ type: 'add', payload: 1 }); //update1=>update2=>update3=>update1
        setNumber({ type: 'add', payload: 2 }); //update2
        setNumber({ type: 'add', payload: 3 }); //update3
      }}
    >
      {number}
    </button>
  );
}
```

VDom中的`children`便是`{number}`这个文本节点，可以发现**更新的状态**已经添加到了新的VDom上了

总结下更新时，`beginWork`中的流程示意图👇

![image-20230219224226538](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230219224226538.png)

可以分为这几步：

- 从`HostRootFiber`开始构建新的`fiber`树
- 复用老的`FunctionComponent` `fiber`
- 计算更新内容，并将其添加到新的`hook`对象的`memoizedState`上

`beginWork`的完善就到这，接下来完善`completeWork`

------

##### 2.3.2、completeWork

由于更新内容是在原生节点上生效的 <!--button组件上的children为新状态-->

所以只要完善原生节点的处理方法`HostComponent`

```js
// src/react-reconciler/src/ReactFiberCompleteWork.js
/**
 * 完成一个fiber节点
 * @param {*} current 老fiber
 * @param {*} workInProgress 新的构建的fiber
 */
export function completeWork(current, workInProgress) {
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    // 根fiber
    case HostRoot:
      //向上冒泡属性
      bubbleProperties(workInProgress);
      break;
    // 原生节点的fiber
    case HostComponent:
      const { type } = workInProgress;
      if (current !== null && workInProgress.stateNode !== null) {
        //如果老fiber存在，并且老fiber上有真实DOM节点，要走节点更新的逻辑
        updateHostComponent(current, workInProgress, type, newProps);
      } else {
        //创建或者说挂载新节点的情况

        //创建真实的DOM节点
        const instance = createInstance(
          type,
          newProps,
          workInProgress
        );
        //把自己所有的儿子都添加到自己的身上
        appendAllChildren(instance, workInProgress);
        // 将真实DOM挂到当前fiber的stateNode上
        workInProgress.stateNode = instance;
        // 完成真实DOM的构建
        finalizeInitialChildren(instance, type, newProps);
      }
      //向上冒泡属性
      bubbleProperties(workInProgress);
      break;
    // 文本节点的fiber
    case HostText:
      //如果完成的fiber是文本节点，那就创建真实的文本节点
      const newText = newProps;
      //创建真实的DOM节点并传入stateNode
      workInProgress.stateNode = createTextInstance(newText);
      //向上冒泡属性
      bubbleProperties(workInProgress);
      break;
  }
}
```

增加的逻辑

```js
 if (current !== null && workInProgress.stateNode !== null) {
      //如果老fiber存在，并且老fiber上有真实DOM节点，要走节点更新的逻辑
      updateHostComponent(current, workInProgress, type, newProps);
} 
```

------

**实现`updateHostComponent`**

```js
/**
 * @description 标记更新
 */
function markUpdate(workInProgress) {
  workInProgress.flags |= Update; //给当前的fiber添加更新的副作用
}

/**
 * 在fiber(button)的完成阶段准备更新DOM
 * @param {*} current button老fiber
 * @param {*} workInProgress button的新fiber
 * @param {*} type 类型
 * @param {*} newProps 新属性
 */
function updateHostComponent(
  current,
  workInProgress,
  type,
  newProps
) {
  const oldProps = current.memoizedProps; //老的属性
  const instance = workInProgress.stateNode; //老的DOM节点
  //比较新老属性，收集属性的差异
  const updatePayload = prepareUpdate(instance, type, oldProps, newProps);
  //让原生组件的新fiber更新队列等于[]
  workInProgress.updateQueue = updatePayload;
  if (updatePayload) {
    markUpdate(workInProgress);
  }
}
```

`updateHostComponent`中主要完成了两部分内容

- **比较新老属性，收集属性的差异**：`prepareUpdate(instance, type, oldProps, newProps)`

  <!--这里其实就是diff的逻辑，比较新老节点的props，还有一部分的diff逻辑在beginWork实现了，就是复用老子fiber那里，当然这只是简单的diff，后面再统一实现其他diff-->

- **==将得到差异内容放到新`fiber`的更新队列上==**：`workInProgress.updateQueue = updatePayload;`

  <!--这里将更新的内容放到新fiber的updateQueue上了-->

- **给新`fiber`标记更新`tag`**: `markUpdate(workInProgress);`

------

**实现比较差异的方法`updatePayload`**

```js
// src/react-dom-bindings/src/client/ReactDOMHostConfig.js

export function prepareUpdate(domElement, type, oldProps, newProps) {
  return diffProperties(domElement, type, oldProps, newProps);
}
```

```js
// src/react-dom-bindings/src/client/ReactDOMComponent.js
/**
 * @description 比较新老属性，收集属性的差异
 * @param domElement 老的DOM节点
 * @param type 虚拟DOM类型
 * @param lastProps 老的属性
 * @param nextProps 新的属性
 */
export function diffProperties(domElement, tag, lastProps, nextProps) {
  let updatePayload = null;
  let propKey;
  let styleName;
  let styleUpdates = null;
  //处理属性的删除 如果说一个属性在老对象里有，新对象没有的话，那就意味着删除
  for (propKey in lastProps) {
    //如果新属性对象里有此属性，或者老的没有此属性，或者老的是个null
    if (nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey) || lastProps[propKey] === null) {
      continue;
    }
    if (propKey === STYLE) {
      const lastStyle = lastProps[propKey];
      for (styleName in lastStyle) {
        if (lastStyle.hasOwnProperty(styleName)) {
          if (!styleUpdates) {
            styleUpdates = {};
          }
          styleUpdates[styleName] = '';
        }
      }
    } else {
      (updatePayload = updatePayload || []).push(propKey, null);
    }
  }
  //遍历新的属性对象
  for (propKey in nextProps) {
    const nextProp = nextProps[propKey];//新属性中的值
    const lastProp = lastProps !== null ? lastProps[propKey] : undefined;//老属性中的值
    if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp || (nextProp === null && lastProp === null)) {
      continue;
    }
    if (propKey === STYLE) {
      if (lastProp) {
        //计算要删除的行内样式
        for (styleName in lastProp) {
          //如果此样式对象里在的某个属性老的style里有，新的style里没有
          if (lastProp.hasOwnProperty(styleName) && (!nextProp || !nextProp.hasOwnProperty(styleName))) {
            if (!styleUpdates)
              styleUpdates = {};
            styleUpdates[styleName] = '';
          }
        }
        //遍历新的样式对象
        for (styleName in nextProp) {
          //如果说新的属性有，并且新属性的值和老属性不一样
          if (nextProp.hasOwnProperty(styleName) && lastProp[styleName] !== nextProp[styleName]) {
            if (!styleUpdates)
              styleUpdates = {};
            styleUpdates[styleName] = nextProp[styleName];
          }
        }
      } else {
        styleUpdates = nextProp;
      }
    } else if (propKey === CHILDREN) {
      if (typeof nextProp === 'string' || typeof nextProp === 'number') {
        (updatePayload = updatePayload || []).push(propKey, nextProp);
      }
    } else {
      (updatePayload = updatePayload || []).push(propKey, nextProp);
    }
  }
  if (styleUpdates) {
    (updatePayload = updatePayload || []).push(STYLE, styleUpdates);
  }
  return updatePayload;//[key1,value1,key2,value2]
}
```

`diffProperties`主要就是对比`lastProps`和`nextProps`得到差异

看下实现效果

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230219234719845.png" alt="image-20230219234719845" style="zoom:50%;" />

<!--`updatePayload`的数据结构是`[propsName1，propsValue1, propsName2，propsValue2, ...]`这种形式-->

好了`completeWork`的完善就到这，接下来就是完善  `commitMutationEffectsOnFiber`

#### 3.3、commitUpdate

**完善`commitMutationEffectsOnFiber`**

```js
// src/react-reconciler/src/ReactFiberCommitWork.js

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
              instance,
              updatePayload,
              type,
              oldProps,
              newProps,
              finishedWork
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

增加的内容，同样的更新内容是在原生节点上的，所以只需要完善`HostComponent`情况就好

```js
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
              instance,
              updatePayload,
              type,
              oldProps,
              newProps,
              finishedWork
            );
          }
        }
      }
```

其中

```js
//先遍历它们的子节点，处理它们的子节点上的副作用
recursivelyTraverseMutationEffects(root, finishedWork);
//再处理自己身上的副作用
commitReconciliationEffects(finishedWork);
```

这两部分和之前初渲染一样，是完成子节点的副作用和自己的副作用 <!--也就是真实DOM的插入、删除等，这个后续实现diff时还要完善-->

剩下的部分

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

就是完成真实DOM的更新操作，之前在`completeWork`中给`fiber`节点上增加的更新队列，就是要这里更新到真实DOM上

------

**实现`commitUpdate`**

```js
// src/react-dom-bindings/src/client/ReactDOMHostConfig.js
export function commitUpdate(domElement, updatePayload, type, oldProps, newProps) {
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
  updateFiberProps(domElement, newProps);
}
```

```js
// src/react-dom-bindings/src/client/ReactDOMComponent.js
function updateDOMProperties(domElement, updatePayload) {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    if (propKey === STYLE) {
      setValueForStyles(domElement, propValue);
    } else if (propKey === CHILDREN) {
      setTextContent(domElement, propValue);
    } else {
      setValueForProperty(domElement, propKey, propValue);
    }
  }
}

export function updateProperties(domElement, updatePayload) {
  updateDOMProperties(domElement, updatePayload);
}
```

```js
/**
 * @description 在DOM节点保存props
 * @param node DOM节点
 * @param props 虚拟DOM上的props
 */
export function updateFiberProps(node, props) {
  node[internalPropsKey] = props;
}
```

这里就是将更新内容添加到真实DOM上

------

到这里`commitMutationEffectsOnFiber`也完善完成

看下实现效果

![image-20230220001834908](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230220001834908.png)

对比下JSX

```js
function FunctionComponent() {
  const [number, setNumber] = React.useReducer(counter, 0);
  const [number2, setNumber2] = React.useReducer(counter, 0);
  return (
    <button
      onClick={() => {
        setNumber({ type: 'add', payload: 1 }); //update1=>update2=>update3=>update1
        setNumber({ type: 'add', payload: 2 }); //update2
        setNumber({ type: 'add', payload: 3 }); //update3
      }}
    >
      {number}
    </button>
  );
}
```

可以看到当`onClick`时，页面重新渲染，新的状态也成功渲染到页面上了

### 总结

`useReducer`这个Hooks的实现就完成了，同时也实现了部分`diff`，后面其他的Hooks的实现也差不多类似