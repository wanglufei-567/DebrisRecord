## Redux解析（二）实现Redux

### 一、实现createStore

创建一个**createStore**方法

```js
function createStore(reducer) {
  // store中的state
  let state;

  // 用于存放监听函数
  const listeners = [];

  /**
   * 获取store的state
   */
  function getState() {
    return state;
  }

  /**
   * 向仓库派发一个动作，会调用reducer,根据老状态和新动作计算新状态
   * @param {*} action
   */
  function dispatch(action) {
    state = reducer(state, action);
    listeners.forEach(l => l());
  }

  /**
   * 订阅状态变化事件，当状态发生改变后执行所有的监听函数
   * @param {*} listener
   * @returns 返回一个清除当前监听函数的方法
   */
  function subscribe(listener) {
    listeners.push(listener);
    return () => {
      let index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  }

  dispatch({ type: '@@REDUX/INIT' });

  return {
    getState,
    subscribe,
    dispatch
  };
}
```

以上就是**Redux**的`createStore`的方法，实现很简单

- 创建了一个`state`，作为`store`的唯一`state`

  ```js
  // store中的state
  let state;
  ```

- 创建`getState`，用于获取`store`的`state`

  ```js
  function getState() {
    return state;
  }
  ```

- 创建`dispatch`，用于修改`store`中的`state` <!--这个是核心的点-->

  ```js
  function createStore(reducer) {
    //....
    
    /**
     * 向仓库派发一个动作，会调用reducer,根据老状态和新动作计算新状态
     * @param {*} action
     */
    function dispatch(action) {
      state = reducer(state, action);
      listeners.forEach(l => l());
    }
    
    return {
      getState,
      subscribe,
      dispatch
    };
  }
  ```

  可以发现`dispatch`的实现其实是利用了**==闭包==**的原理

  - `state`：从上层作用域拿到`state`，在`dispatch`内部对其进行重新赋值

  - `reducer`：从`createStore`的入参中拿到用户定义的`reducer`，在`dispatch`内部执行`reducer`

    `reducer`的入参：

    - `state`：从上层作用域拿到
    - `action`：用户调用dispatch时传入的

看完`createStore`的实现，再回顾下**Redux**的三大原则：

1. **==单一数据源==**
   - 整个应用的 **state** 被储存在一棵 **object tree** 中，并且这个 **object tree** 只存在于唯一一个 **store** 中
2. **==State 是只读的==**
   - 唯一改变 **state** 的方法就是触发 **action**，**action** 是一个用于描述已发生事件的普通对象
3. **==使用纯函数来执行修改==**

可以发现，**Redux**的**设计理念**是**==将状态和状态变化逻辑分离==**，通过明确的**action**和**reducer**来管理状态的变化

基于这样的设计理念，**Redux**具有以下的优势：

1. **==可预测性==： ** **Redux**的状态管理采用单一的、全局的状态树（**Store State**），状态的变化通过 **reducer** 函数严格控制，==使得状态变化变得可预测和可控==
2. **==可维护性==：** **Redux** 的状态管理采用明确的 **action** 和 **reducer** 的分离，==使得状态变化的处理逻辑清晰可见，便于维护和调试==

### 二、实现bindActionCreators

#### 2.1、bindActionCreators基本使用

`bindActionCreators` 是 **Redux** 提供的一个辅助函数，用于简化在 **Redux** 中创建 **Action Creators** 的过程

在 **Redux** 中，**Action Creators** 是负责创建 **Action** 对象的函数，==用于描述状态的变化==

而 `bindActionCreators` 函数可以自动将 **Action Creators** 和 **Redux** 的 `dispatch` 函数绑定在一起，从而简化了在组件中触发 **Action** 的过程

`bindActionCreators` 的使用方式如下👇：

```js
import { bindActionCreators } from 'redux';

function add(payload) {
    return { type: 'ADD', payload };
}

function minus(payload) {
    return { type: 'MINUS', payload };
}

// 创建 Action Creators
const actions = { add, minus };

// 将 Action Creators 和 dispatch 函数绑定在一起
const boundActions = bindActionCreators(actions, dispatch);

// 在组件中使用绑定后的 Action Creators
// 使用 boundActions.add() 触发 add，并将返回的Action对象传递给Redux的dispatch函数
```

`bindActionCreators` 接收两个参数：

- `actions`：一个包含多个 **Action Creators** 的对象，其中对象的 `key` 是 **Action Creator** 的名称，值是 **Action Creator** 函数
- `dispatch`：**Redux** 的 `dispatch` 函数，用于触发 **Action**

`bindActionCreators` 返回一个新的对象，包含了绑定后的 **Action Creators**

这样，我们可以直接在组件中使用返回的对象来触发 **Action**，==而不需要手动调用 `dispatch` 函数==

使用 `bindActionCreators` 可以简化在 **Redux** 中触发 **Action** 的过程，避免手动编写 `dispatch` 函数的调用，并且可以将 **Action Creators** 作为 `props` 传递给组件，使组件更加清晰和简洁

#### 2.2、实现bindActionCreators

```js
/**
 * 返回一个方法，内部执行store的dispatch方法，
 * dispatch方法接收的action是actionCreator执行的结果
 */
function bindActionCreator(actionCreator, dispatch) {
  return (...args) => {
    return dispatch(actionCreator.apply(null, args));
  }
}

/**
 * 将actionCreator与dispatch进行绑定
 * @param actionCreators 长这样 {add(){return {type:"ADD"}}}
 * @param dispatch store的dispatch方法
 */
function bindActionCreators(actionCreators, dispatch) {
  const boundActionCreators = {};
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key];
    // 从actionCreators取出actionCreator与dispatch进行绑定
    boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
  }
  return boundActionCreators;
}

export default bindActionCreators;
```

**bindActionCreators**的实现也很简单

其实就是将

```js
 actionCreators={
   add(){
     return {type:"ADD"}
   }
 }
```

变成

```js
boundActionCreators={
  add(){
  dispatch({type:"ADD"});
  }
}
```

省的手动编写 `dispatch` 函数的调用

------

接下来看下实现效果👇

```js
function address(state = { address: 'china' }, action) {
  switch (action.type) {
    case 'EDIT':
      return {
        ...state,
        address: action.payload // dispatch({type: 'EDIT', payload: 123})
      };
    default:
      return state;
  }
}

// 创建store
let store = createStore(address);
console.log('初始state', store.getState());


// Action Creator
function edit(payload) {
  return { type: 'EDIT', payload };
}

// 创建 Action Creators
const actions = { edit };

// 将 Action Creators 和 dispatch 函数绑定在一起
const boundActions = bindActionCreators(actions, store.dispatch);

// 触发action
boundActions.edit('beijing');
console.log('dispatch修改后的state', store.getState());
```

打印值

```js
// 初始state { address: 'china' }
// dispatch修改后的state { address: 'beijing' }
```

和直接手动`dispatch`一样的效果

### 三、实现combineReducers

#### 3.1、combineReducers基本使用

`combineReducers` 是 **Redux** 提供的一个辅助函数，用于将多个 **Reducer** 组合成一个单一的 **Reducer**

在 **Redux** 中，**Reducer** 是一个纯函数，用于处理不同的 **Action**，并返回一个新的 **State** 对象

**Redux Store** 中可以包含多个 **Reducer**，每个 **Reducer** 负责管理 **Store** 中的一部分状态；而 `combineReducers` 函数可以帮助我们将多个 **Reducer** 合并成一个 **Root Reducer**，从而简化了 **Redux Store** 的配置和管理过程

`combineReducers` 的使用方式如下：

```js
import { combineReducers } from 'redux';
import { reducer1, reducer2, reducer3 } from './reducers';

// 将多个 Reducer 组合成一个 Root Reducer
const rootReducer = combineReducers({
  key1: reducer1,
  key2: reducer2,
  key3: reducer3,
  // 可以添加其他的 Reducer
});

// 创建 Redux Store，并传入 Root Reducer
const store = createStore(rootReducer);
```

`combineReducers` 接收一个对象作为参数，其中对象的 `key` 是 **State** 中的属性名称，值是对应的 **Reducer** 函数。合并后的 **Root Reducer** 函数会将不同的 **Action** 分发给对应的子 **Reducer** 进行处理，并将它们的返回值合并成一个新的 **State** 对象。

在使用 `combineReducers` 时，需要注意以下几点：

- **Reducer** 函数应该是纯函数，不应该有副作用。
- 各个子 **Reducer** 的状态属性名称应该与其在 **Root Reducer** 中的 `key` 一致，因为它们将成为 **State** 树的属性名称。
- **Root Reducer** 的返回值会成为 **Redux Store** 的整体状态对象。

==`combineReducers` 可以帮助我们组织和管理复杂的 **Redux Store**，将状态的处理逻辑分解成多个小的 **Reducer**，使代码更加模块化和可维护==

#### 3.2、实现combineReducers

```js
/**
 * 将多个reducer合并成一个root reducer
 * 返回值仍然是一个reducer
 */
function combineReducers(reducers) {
  return function combination(state = {}, action) {
    let nextState = {}
    for (let key in reducers) {
      let prevStateForKey = state[key];//获取此key对应的老的分状态
      let reducerForKey = reducers[key];//获取此key对应的reducer 或者说处理器
      let nextStateForKey = reducerForKey(prevStateForKey, action);
      nextState[key] = nextStateForKey;
    }
    return nextState;
  }
}
export default combineReducers;
```

`combineReducers`的实现很简单，只需明确这一点：==`combineReducers`的返回值仍然是一个**reducer**==，而**reducer**的返回值是新的**state**

`root reducer`中的逻辑是这样的，首先遍历所有的`reducer`，再依次执行`reducer`

执行`reducer`的逻辑：

- 从`store`中的`root state`上取到对应`key`的`state`

- 再从`root reducer`上取到对应`key`的`reducer`

- 将`action`传递给`reducer`重新计算对应`key`的`state` 

  <!--reducer中有兜底逻辑，action的type需要与reducer中的type一致才能重新计算-->

