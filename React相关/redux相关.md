### 什么是Redux

**Redux 是一个使用叫做“action”的事件来管理和更新应用状态的模式和工具库** 它以集中式Store（centralized store）的方式对整个应用中使用的状态进行集中管理，其规则确保状态只能以可预测的方式更新

------

### redux 三大原则

- 单一数据源: 整个应用的 state 被储存在一棵 object tree 中，并且这个 object tree 只存在于唯一一个 store 中
- State 是只读的: 唯一改变 state 的方法就是触发 action，action 是一个用于描述已发生事件的普通对象
- 使用纯函数来执行修改

------

#### Redux中的核心概念

- **store**  （ 是个对象，统一管理和维护state，Reducer，action ）
  - **reducer** （纯函数，决定了actions的变化如何更新state， actions 只是描述了**<u>有事情发生了</u>**这一事实，并没有描述如何更新 state。）
    - **state** (是个对象，存储数据的地方)
    - **action**（是个对象，将数据传入store中，这里需要注意的是，我们不直接去调用 Reducer 函数，而是通过 Store 对象提供的 dispatch 方法来将action传入Reducer）

#### store上的方法

- getState() 
  - 获取当前 store 存储 state
- dispatch(action)
  - 修改 state
- subscribe(listener)
  - 监听 state 发生修改
- replaceReducer(nextReducer)
  - 替换掉原来的 reducer

#### Redux在Reac中的应用

##### 创建store

```jsx
// src/store/index.js

import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { user, order } from "./reducers";

function address(state = { address: "china" }, action) {
  switch (action.type) {
    case "EDIT":
      return {
        ...state,
        address: action.payload // dispatch({type: 'EDIT', payload: 123})
      };
    default:
      return state;
  }
}

// 合并reducer
const reducer = combineReducers({
  user,
  order,
  address
});
const store = createStore(reducer, applyMiddleware(thunk));

// console.log("store", store);
// console.log("初始state", store.getState());
store.dispatch({
  type: "EDIT",
  payload: "beijing"
}); // dispatch默认是同步修改

// console.log("dispatch修改后的state", store.getState());

// 每当 dispatch action 的时候就会执行，
// state 树中的一部分可能已经变化,可以使用getState() 来拿到当前 state。
store.subscribe(() => console.log(store.getState()));

export default store;
```

##### 将store挂到根组件上

```jsx
// src/index.js

import { StrictMode } from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import App from "./App";
import store from "./store";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
  rootElement
);

```

##### 在组件上使用

```jsx
import React, { Component } from "react";
import { connect } from "react-redux";

export class index extends Component {
  render() {
    return (
      <div>
        <p>{JSON.stringify(this.props)}</p>
        <br />
        <p>{this.props.user.userName}</p>
        <button onClick={this.props.chageUserName}>
          修改store中的user.userName
        </button>
        <p>{this.props.order.orderName}</p>
        <button onClick={this.props.changeOrderName}>
          修改store中的order.orderName
        </button>
      </div>
    );
  }
}

export default connect(
  (state, props) => ({
    // state是store中的state，在这里可以进行筛选及派生
    // props是该组件自己的props
    // 这里返回的对象就是该组件最终的props
    ...props,
    ...state
  }),
  (dispatch, props) => ({
    //  dispatch就是store上的dispatch
    // props是该组件自己原始的props
    chageUserName: () => {
      dispatch({
        type: "USER/EDIT",
        payload: props.userName
      });
    },
    changeOrderName: () =>
      dispatch(async (dispatch, getState) => {
        // 这里打印出来的值是更新之后的，待研究
        console.log("getState", JSON.stringify(getState()));
        const orderName = await Promise.resolve("眼镜");
        dispatch({
          type: "ORDER/ADJUST",
          payload: orderName
        });
      })
  })
)(index);

```

#### conncect

React-Redux 提供`connect`方法，用于从 UI 组件生成容器组件。`connect`的意思，就是将这两种组件连起来。

### Redux 结合 React 使用

Redux 和 React 之间没有关系。Redux 支持 React、Angular、Ember、jQuery 甚至纯 JavaScript。

Redux 的 React 绑定库是基于 [容器组件和展示组件相分离](https://link.juejin.cn?target=https%3A%2F%2Fmedium.com%2F%40dan_abramov%2Fsmart-and-dumb-components-7ca2f9a7c7d0) 的开发思想。

|                |          展示组件          |              容器组件              |
| :------------: | :------------------------: | :--------------------------------: |
|      作用      | 描述如何展现（骨架、样式） | 描述如何运行（数据获取、状态更新） |
| 直接使用 Redux |             否             |                 是                 |
|    数据来源    |           props            |          监听 Redux state          |
|    数据修改    |   从 props 调用回调函数    |       向 Redux 派发 actions        |
|    调用方式    |            手动            |      通常由 React Redux 生成       |

React-Redux 将所有组件分成两大类：UI 组件（presentational component）和容器组件（container component）。

**UI 组件**有以下几个特征。

> - 只负责 UI 的呈现，不带有任何业务逻辑
> - 没有状态（即不使用`this.state`这个变量）
> - 所有数据都由参数（`this.props`）提供
> - 不使用任何 Redux 的 API

下面就是一个 UI 组件的例子。

> ```javascript
> const Title =
>   value => <h1>{value}</h1>;
> ```

因为不含有状态，UI 组件又称为"纯组件"，即它纯函数一样，纯粹由参数决定它的值。

**容器组件**的特征恰恰相反。

- 负责管理数据和业务逻辑，不负责 UI 的呈现
- 带有内部状态
- 使用 Redux 的 API

总之，只要记住一句话就可以了：UI 组件负责 UI 的呈现，容器组件负责管理数据和逻辑。

你可能会问，如果一个组件既有 UI 又有业务逻辑，那怎么办？回答是，将它拆分成下面的结构：外面是一个容器组件，里面包了一个UI 组件。前者负责与外部的通信，将数据传给后者，由后者渲染出视图。

React-Redux 规定，所有的 UI 组件都由用户提供，容器组件则是由 React-Redux 自动生成。也就是说，用户负责视觉层，状态管理则是全部交给它。

#### conncect

React-Redux 提供`connect`方法，用于从 UI 组件生成容器组件。`connect`的意思，就是将这两种组件连起来。

> ```javascript
> import { connect } from 'react-redux'
> const VisibleTodoList = connect()(TodoList);
> ```

上面代码中，`TodoList`是 UI 组件，`VisibleTodoList`就是由 React-Redux 通过`connect`方法自动生成的容器组件。

但是，因为没有定义业务逻辑，上面这个容器组件毫无意义，只是 UI 组件的一个单纯的包装层。为了定义业务逻辑，需要给出下面两方面的信息。

> （1）输入逻辑：外部的数据（即`state`对象）如何转换为 UI 组件的参数
>
> （2）输出逻辑：用户发出的动作如何变为 Action 对象，从 UI 组件传出去。

因此，`connect`方法的完整 API 如下。

> ```javascript
> import { connect } from 'react-redux'
> 
> const VisibleTodoList = connect(
>   mapStateToProps,
>   mapDispatchToProps
> )(TodoList)
> 复制代码
> ```

上面代码中，`connect`方法接受两个参数：`mapStateToProps`和`mapDispatchToProps`。它们定义了 UI 组件的业务逻辑。前者负责输入逻辑，即将`state`映射到 UI 组件的参数（`props`），后者负责输出逻辑，即将用户对 UI 组件的操作映射成 Action。

#### mapStateToProps()

`mapStateToProps`是一个函数。它的作用就是像它的名字那样，建立一个从（外部的）`state`对象到（UI 组件的）`props`对象的映射关系。

作为函数，`mapStateToProps`执行后应该返回一个对象，里面的每一个键值对就是一个映射。请看下面的例子。

> ```javascript
> const mapStateToProps = (state) => {
>   return {
>     todos: getVisibleTodos(state.todos, state.visibilityFilter)
>   }
> }
> ```

上面代码中，`mapStateToProps`是一个函数，它接受`state`作为参数，返回一个对象。这个对象有一个`todos`属性，代表 UI 组件的同名参数，后面的`getVisibleTodos`也是一个函数，可以从`state`算出 `todos` 的值。

下面就是`getVisibleTodos`的一个例子，用来算出`todos`。

> ```javascript
> const getVisibleTodos = (todos, filter) => {
>   switch (filter) {
>     case 'SHOW_ALL':
>       return todos
>     case 'SHOW_COMPLETED':
>       return todos.filter(t => t.completed)
>     case 'SHOW_ACTIVE':
>       return todos.filter(t => !t.completed)
>     default:
>       throw new Error('Unknown filter: ' + filter)
>   }
> }
> ```

`mapStateToProps`会订阅 Store，每当`state`更新的时候，就会自动执行，重新计算 UI 组件的参数，从而触发 UI 组件的重新渲染。

`mapStateToProps`的第一个参数总是`state`对象，还可以使用第二个参数，代表容器组件的`props`对象。

> ```javascript
> // 容器组件的代码
> //    <FilterLink filter="SHOW_ALL">
> //      All
> //    </FilterLink>
> 
> const mapStateToProps = (state, ownProps) => {
>   return {
>     active: ownProps.filter === state.visibilityFilter
>   }
> }
> ```

使用`ownProps`作为参数后，如果容器组件的参数发生变化，也会引发 UI 组件重新渲染。

`connect`方法可以省略`mapStateToProps`参数，那样的话，UI 组件就不会订阅Store，就是说 Store 的更新不会引起 UI 组件的更新。

#### mapDispatchToProps()

`mapDispatchToProps`是`connect`函数的第二个参数，用来建立 UI 组件的参数到`store.dispatch`方法的映射。也就是说，它定义了哪些用户的操作应该当作 Action，传给 Store。它可以是一个函数，也可以是一个对象。

如果`mapDispatchToProps`是一个函数，会得到`dispatch`和`ownProps`（容器组件的`props`对象）两个参数。

> ```javascript
> const mapDispatchToProps = (
>   dispatch,
>   ownProps
> ) => {
>   return {
>     onClick: () => {
>       dispatch({
>         type: 'SET_VISIBILITY_FILTER',
>         filter: ownProps.filter
>       });
>     }
>   };
> }
> ```

从上面代码可以看到，`mapDispatchToProps`作为函数，应该返回一个对象，该对象的每个键值对都是一个映射，定义了 UI 组件的参数怎样发出 Action。

如果`mapDispatchToProps`是一个对象，它的每个键名也是对应 UI 组件的同名参数，键值应该是一个函数，会被当作 Action creator ，返回的 Action 会由 Redux 自动发出。举例来说，上面的`mapDispatchToProps`写成对象就是下面这样。

> ```javascript
> const mapDispatchToProps = {
>   onClick: (filter) => {
>     type: 'SET_VISIBILITY_FILTER',
>     filter: filter
>   };
> }
> ```

#### Provider 组件

`connect`方法生成容器组件以后，需要让容器组件拿到`state`对象，才能生成 UI 组件的参数。

一种解决方法是将`state`对象作为参数，传入容器组件。但是，这样做比较麻烦，尤其是容器组件可能在很深的层级，一级级将`state`传下去就很麻烦。

React-Redux 提供`Provider`组件，可以让容器组件拿到`state`。

> ```javascript
> import { Provider } from 'react-redux'
> import { createStore } from 'redux'
> import todoApp from './reducers'
> import App from './components/App'
> 
> let store = createStore(todoApp);
> 
> render(
>   <Provider store={store}>
>     <App />
>   </Provider>,
>   document.getElementById('root')
> )
> ```

上面代码中，`Provider`在根组件外面包了一层，这样一来，`App`的所有子组件就默认都可以拿到`state`了。


