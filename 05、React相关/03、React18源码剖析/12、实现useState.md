## React18源码解析（十二）实现useState

### 一、前言

`useState` 是 React 提供的一个用于在函数式组件中管理状态的 hooks。它返回一个由状态值和更新状态值的函数组成的数组。

使用 `useState`，可以在函数组件中声明一个状态变量，然后在组件的渲染过程中读取和更新该变量的值。每次状态变量的值更新，React 会重新渲染组件。

`useState` 接收一个初始状态作为参数，返回一个包含当前状态和更新状态的函数的数组。更新状态的函数可以接收一个新的状态值作为参数，然后触发重新渲染。

以下是一个使用 `useState` 的简单示例：

```jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

在上面的代码中，通过 `useState` 定义了一个名为 `count` 的状态变量，并将其初始值设为 0。然后在组件中，我们可以使用 `count` 和 `setCount` 分别读取和更新状态变量的值。每次点击按钮时，`setCount` 会更新 `count` 的值，并触发组件重新渲染，从而更新视图。

需要注意的是，由于 `useState` 只是在组件的内部实现状态管理，并不能跨越组件传递数据，如果需要在组件之间共享状态，可以使用 `useContext` 或 Redux 等其他状态管理工具。

### 二、实现useState

`useState`其实就是`useReducer`的简化版，只不过省略了状态的计算过程，所以`useState`的实现和`useReducer`很类似

首先改造下`main.jsx`

```jsx
import * as React from 'react';
import { createRoot } from "react-dom/client";

function FunctionComponent() {
  console.log('FunctionComponent');
  const [number, setNumber] = React.useState(0);
  //如果使用的是useState，调用setNumber的时候传入的是老状态，则不需要更新，
  return <button onClick={() => {
    setNumber(number => undefined)//0
  }}>{number}</button>
}
let element = <FunctionComponent />
const root = createRoot(document.getElementById("root"));
//把element虚拟DOM渲染到容器中
root.render(element);
```

------

给派发器`ReactCurrentDispatcher`上添加`useState`

```js
// src/react/index.js
export {
  //如果我们有一些希望在不同的内部模块之间共享的变量可以保存在此变量上
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  useState,
  useReducer
} from './src/React';
```

```js
// src/react/src/ReactHooks.js
/**
 * @param {*} initialArg 初始状态
 */
 export function useState(initialArg) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialArg);
}
```

------

在`src/react-reconciler/src/ReactFiberHooks.js`中实现挂载时的`useState：mountState` 和更新时的`useState: updateState`

首先是`mountState`

```js
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

//...
const HooksDispatcherOnMount = {
  useReducer: mountReducer,
  useState: mountState
};


/**
 * @description 挂载useState
 * @param initialState 初始值
 */
function mountState(initialState) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialState;
  const queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: baseStateReducer, //上一个reducer
    lastRenderedState: initialState //上一个state
  };
  hook.queue = queue;
  const dispatch = (queue.dispatch = dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));
  return [hook.memoizedState, dispatch];
}

//useState其实就是一个内置了reducer的useReducer
function baseStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action;
}
```

可以发现`mountState`和`useReducer`的`mountReducer`很类似，都是相同的逻辑

- 创建`hook`对象

  ```js
  const hook = mountWorkInProgressHook();
    hook.memoizedState = initialState;
    const queue = {
      pending: null,
      dispatch: null,
      lastRenderedReducer: baseStateReducer, //上一个reducer
      lastRenderedState: initialState //上一个state
    };
    hook.queue = queue;
  ```

  相比较于`useReducer`，`useState`的`hook`对象上多了两个属性

  -  `lastRenderedReducer: baseStateReducer` ： 上一个reducer
  - `lastRenderedState: initialState` ： 上一个reducer

  这两个属性是为了后面`dispatch`时用于判断更新的状态是否和老状态一样，若是一样就不进行重新渲染

  <!--lastRenderedReducer的默认值时内置的一个reducer-->

  ```js
  function baseStateReducer(state, action) {
    return typeof action === 'function' ? action(state) : action;
  }
  ```

  <!--useState其实就是一个内置了reducer的useReducer-->

- 创建更新方法dispatch

  ```js
  const dispatch = (queue.dispatch = dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));
  ```

- **返回`[state, dispatch]`** : `[hook.memoizedState, dispatch]` <!--最后用户拿到的就是这个-->

------

实现`useState`的创建更新的方法：`dispatchSetState`

```js
/**
 * @description useState的更新方法
 * @param {*} fiber function对应的fiber
 * @param {*} queue hook对应的更新队列
 * @param {*} action 派发的动作
 */
function dispatchSetState(fiber, queue, action) {
  // 创建更新对象
  const update = {
    action,
    hasEagerState: false, //是否有急切的更新
    eagerState: null, //急切的更新状态
    next: null
  };

  //当用户派发动作后，立刻用上一次的状态和上一次的reducer计算新状态
  const { lastRenderedReducer, lastRenderedState } = queue;
  const eagerState = lastRenderedReducer(lastRenderedState, action);
  update.hasEagerState = true;
  update.eagerState = eagerState;
  //若本次更新的状态eagerState和上次的状态lastRenderedState一样的，则直接退出不进行更新操作
  if (Object.is(eagerState, lastRenderedState)) {
    return;
  }
  //下面是真正的入队更新，并调度更新逻辑
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root);
}
```

和`useReducer`的`dispatchReducerAction`相比，只是多了这一部分

```js
//当用户派发动作后，立刻用上一次的状态和上一次的reducer计算新状态
const { lastRenderedReducer, lastRenderedState } = queue;
const eagerState = lastRenderedReducer(lastRenderedState, action);
update.hasEagerState = true;
update.eagerState = eagerState;
//若本次更新的状态eagerState和上次的状态lastRenderedState一样的，则直接退出不进行更新操作
if (Object.is(eagerState, lastRenderedState)) {
  return;
}
```

这是一段优化逻辑，当`dispatch`的更新状态`eagerState`和上次的状态`lastRenderedState`一样的，则直接退出不进行更新操作

------

实现更新时的`useState：updateState`

```js
// src/react-reconciler/src/ReactFiberHooks.js

//useState其实就是一个内置了reducer的useReducer
function baseStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action;
}
//...
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState
};

function updateState() {
  return updateReducer(baseStateReducer);
}
```

这里直接复用了`useReducer`的`updateReducer`，使用的`reducer`时内置的`baseStateReducer`

`useState`的实现很简单，很多逻辑在实现`useReducer`时就实现了

接下来看下实现效果

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230220215749616.png" alt="image-20230220215749616" style="zoom:50%;" />

