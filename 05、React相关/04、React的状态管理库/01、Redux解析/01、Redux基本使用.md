## Redux解析（一）Redux基本使用

### 一、Redux是什么？

> Redux 是一个用于 JavaScript 应用程序的**==状态管理库==**
>
> 它提供了一种==可预测、可控、可维护==的方式来==管理应用程序的状态==，并与用户界面保持一致

#### 1.1、Redux应用场景

随着 JavaScript 单页应用开发日趋复杂，管理不断变化的 **state** 非常困难，**Redux**的出现就是为了解决**state**里的数据问题

在**React**中，数据在组件中是**单向流动**的，数据从一个方向父组件流向子组件(通过`props`)，由于这个特征，两个非父子关系的组件（或者称作兄弟组件）之间的通信就比较麻烦

![redux-wrong](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/redux-wrong.png)

#### 1.2、Redux设计思想

**Redux**是将整个应用状态存储到到一个地方，称为**store**，**store**里面保存一棵状态树**state tree**，组件可以派发**dispatch**行为**action**给**store**而不是直接通知其它组件，其它组件可以通过订阅**store**中的状态(**state**)来刷新自己的视图

![redux-flow](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/redux-flow.png)

**Redux** 的基本工作流程如下：

- 应用程序的状态以集中式**Store**的方式进行集中管理
- 当应用程序需要修改状态时，通过 **Dispatch** 发起一个 **Action**
- 然后 **Reducer** 根据 **Action** 的类型和负载处理状态的变化
- 最终返回一个新的状态对象，**Store** 会将这个新的状态对象存储起来，并**通知**应用程序的界面更新

#### 1.3、Redux 三大原则

1. **==单一数据源==**
   - 整个应用的 **state** 被储存在一棵 **object tree** 中，并且这个 **object tree** 只存在于唯一一个 **store** 中
2. **==State 是只读的==**
   - 唯一改变 **state** 的方法就是触发 **action**，**action** 是一个用于描述已发生事件的普通对象
3. **==使用纯函数来执行修改==**

#### 1.4、Redux中的核心概念

- **store：**是个对象，==统一管理和维护**state**，**reducer**，**action**== 
  
  <!--store就是保存数据的地方，可以把它看成一个容器，整个应用只能有一个store。Redux 提供 createStore这个函数，用来生成store-->
  
  - **reducer：** 纯函数，决定了**action**的变化如何更新**state**，
    
    - **state：**是个对象，存储数据的地方
    
    - **action：**是个对象，将数据传入**store**中，这里需要注意的是，我们不直接去调用 **Reducer** 函数，而是通过 **Store** 对象提供的 **dispatch** 方法来将**action**传入**Reducer**
    
      <!--action 只是描述了有事情发生了这一事实，并没有描述如何更新state-->

**store上的方法:**

- `getState()` 
  - 获取当前 `store` 存储 `state`
- `dispatch(action)`
  - 修改 `state`
- `subscribe(listener)`
  - 监听 `state` 发生修改

#### 1.5、Redux的优缺点

**优点：**

1. ==**单一数据源**==：**Redux** 使用单一的 **Store** 来存储整个应用程序的状态，==使得状态的管理变得简单和一致==
2. ==**可预测的状态管理**==：**Redux** 使用了严格的**单向数据流**，通过 **Reducer** 函数来处理 **Action**，从而==实现了可预测的状态管理==
3. **易于测试**：**Redux** 的状态管理逻辑是纯函数，可以方便地进行单元测试

**缺点：**

1. ==**学习曲线**==：**Redux** 的概念和使用方式可能对于新手来说有一定的学习曲线，需要掌握 **Redux** 的基本概念，如 **Store**、**Action**、**Reducer** 等，并理解 **Redux** 的工作原理和设计模式
2. ==**冗余的代码**==：在 **Redux** 中，每个状态变化都需要通过 **Action** 和 **Reducer** 进行处理，这可能导致一些冗余的代码，尤其在应对简单的状态变化时，使用 **Redux** 可能显得繁琐
3. ==**过度使用**==：**Redux** 并不是适用于所有应用程序的最佳解决方案，对于简单的应用程序或者小规模的项目，==使用 **Redux** 可能会显得过于复杂和繁琐，增加开发和维护的成本==
4. **==全局状态管理==**：**Redux** 使用全局的 **Store** 来管理应用程序的状态，这可能导致状态的共享和管理变得复杂，尤其在大型应用程序中，需要谨慎地处理状态的共享和隔离

### 二、Redux的基本使用

##### 创建store

```jsx
// src/store/index.js

import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { user, order } from "./reducers";

// 纯函数 reducer 第一个参数是state 第二个参数是接收到的action
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

// 创建store
const store = createStore(reducer, applyMiddleware(thunk));
// console.log("初始state", store.getState());

// 订阅state的变化，每当 dispatch action 的时候就会执行，
// state 树中的一部分可能已经变化,可以使用getState()来拿到当前 state。
store.subscribe(() => console.log(store.getState()));


// 修改state，dispatch默认是同步修改
store.dispatch({
  type: "EDIT",
  payload: "beijing"
}); 
// console.log("dispatch修改后的state", store.getState());

export default store;
```

### 三、Redux 结合 React 使用

**Redux** 和 **React** 之间没有关系，**Redux** 支持 **React**、**Angular**、**Ember**、**jQuery** 甚至纯 **JavaScript**

为了方便在**React**中使用**Redux**，**Redux** 的作者封装了一个 **React** 专用的库 **React-Redux**

#### 3.1、React-Redux的组件拆分规范

**React-Redux** 将所有组件分成两大类：**UI 组件**和**容器组件**

**UI 组件**有以下几个特征：

- 只负责 UI 的呈现，不带有任何业务逻辑
- 没有状态（即不使用`this.state`这个变量）
- 所有数据都由参数（`this.props`）提供
- 不使用任何 Redux 的 API

下面就是一个 UI 组件的例子。

```javascript
const Title =
value => <h1>{value}</h1>;
```

==因为不含有状态，UI 组件又称为"纯组件"，即它纯函数一样，纯粹由参数决定它的值==

**容器组件**的特征恰恰相反：

- 负责管理数据和业务逻辑，不负责 UI 的呈现
- 带有内部状态
- 使用 Redux 的 API

==总之，只要记住一句话就可以了：UI 组件负责 UI 的呈现，容器组件负责管理数据和逻辑==

如果一个组件既有 UI 又有业务逻辑，那怎么办？

回答是，将它拆分成下面的结构：==外面是一个**容器组件**，里面包了一个**UI 组件**==。前者负责与外部的通信，将数据传给后者，由后者渲染出视图

**React-Redux** 规定，所有的 ==UI 组件都由用户提供==，==容器组件则是由 React-Redux 自动生成==；也就是说，用户负责视觉层，状态管理则是全部交给它

#### 3.2、React-Redux中的核心概念

##### 3.2.1、conncect

**React-Redux** 提供`connect`方法，用于==从 UI 组件生成容器组件==

`connect`的意思，就是将这两种组件连起来

> ```javascript
> import { connect } from 'react-redux'
> const VisibleTodoList = connect()(TodoList);
> ```

上面代码中

- `TodoList`是 ==UI 组件==
- `VisibleTodoList`就是由 **React-Redux** 通过`connect`方法自动生成的==容器组件==

但是，因为没有定义业务逻辑，上面这个容器组件毫无意义，只是 UI 组件的一个单纯的包装层

为了定义业务逻辑，需要给出下面两方面的信息。

> （1）输入逻辑：外部的数据（即`state`对象）如何转换为 UI 组件的参数
>
> （2）输出逻辑：用户发出的动作如何变为 Action 对象，从 UI 组件传出去。

因此，`connect`方法的完整 API 如下👇

> ```javascript
> import { connect } from 'react-redux'
> 
> const VisibleTodoList = connect(
> mapStateToProps,
> mapDispatchToProps
> )(TodoList)
> ```

上面代码中，`connect`方法接受两个参数：`mapStateToProps`和`mapDispatchToProps`，它们定义了 UI 组件的业务逻辑

- `mapStateToProps`
  - 负责==输入逻辑==，即将`state`映射到 UI 组件的参数（`props`）
- `mapDispatchToProps`
  - 负责==输出逻辑==，即将用户对 UI 组件的操作映射成 **action**

##### 3.2.2、mapStateToProps

`mapStateToProps`是一个函数，它的作用就是像它的名字那样，建立一个从（外部的）`state`对象到（UI 组件的）`props`对象的映射关系。

作为函数，`mapStateToProps`执行后应该返回一个对象，里面的每一个键值对就是一个映射

请看下面的例子👇

```javascript
const mapStateToProps = (state) => {
return {
 todos: getVisibleTodos(state.todos, state.visibilityFilter)
}
}
```

上面代码中，`mapStateToProps`是一个函数，它接受`state`作为参数，返回一个对象

这个对象有一个`todos`属性，代表 UI 组件的同名参数，后面的`getVisibleTodos`也是一个函数，可以从`state`算出 `todos` 的值

下面就是`getVisibleTodos`的一个例子，用来算出`todos`

```javascript
const getVisibleTodos = (todos, filter) => {
switch (filter) {
 case 'SHOW_ALL':
   return todos
 case 'SHOW_COMPLETED':
   return todos.filter(t => t.completed)
 case 'SHOW_ACTIVE':
   return todos.filter(t => !t.completed)
 default:
   throw new Error('Unknown filter: ' + filter)
}
}
```

==`mapStateToProps`会订阅 **Store**，每当`state`更新的时候，就会自动执行，重新计算 UI 组件的参数，从而触发 UI 组件的重新渲染==

`mapStateToProps`的第一个参数总是`state`对象，还可以使用第二个参数，代表容器组件的`props`对象。

```javascript
// 容器组件的代码
//    <FilterLink filter="SHOW_ALL">
//      All
//    </FilterLink>

const mapStateToProps = (state, ownProps) => {
return {
 active: ownProps.filter === state.visibilityFilter
}
}
```

使用`ownProps`作为参数后，如果容器组件的参数发生变化，也会引发 UI 组件重新渲染。

<!--`connect`方法可以省略`mapStateToProps`这个参数，那样的话，UI 组件就不会订阅Store，就是说 Store 的更新不会引起 UI 组件的更新-->

##### 3.2.3、mapDispatchToProps

`mapDispatchToProps`是`connect`函数的第二个参数，==用来建立 UI 组件的参数到`store.dispatch`方法的映射==

也就是说，它定义了哪些用户的操作应该当作 **action**，传给 **store**，==它可以是一个函数，也可以是一个对象==

- 如果`mapDispatchToProps`是一个函数

  `mapDispatchToProps`会得到`dispatch`和`ownProps`（容器组件的`props`对象）两个参数

  ```js
  const mapDispatchToProps = (
  dispatch,
  ownProps
    ) => {
    return {
     onClick: () => {
       dispatch({
         type: 'SET_VISIBILITY_FILTER',
         filter: ownProps.filter
       });
     }
    };
  }
  ```

  从上面代码可以看到，`mapDispatchToProps`作为函数，应该返回一个对象，该对象的每个键值对都是一个映射，==定义了 UI 组件的参数怎样发出 Action==

- 如果`mapDispatchToProps`是一个对象

  它的每个键名也是对应 UI 组件的同名参数，键值应该是一个函数，会被当作 **action creator** ，返回的 **action** 会由 **Redux** 自动发出

  举例来说，上面的`mapDispatchToProps`写成对象就是下面这样

  ```js
  const mapDispatchToProps = {
    onClick: (filter) => {
     type: 'SET_VISIBILITY_FILTER',
     filter: filter
    };
  }
  ```

##### 3.2.4、Provider 组件

`connect`方法生成容器组件以后，需要让容器组件拿到`state`对象，才能生成 UI 组件的参数。

一种解决方法是将`state`对象作为参数，传入容器组件。但是，这样做比较麻烦，尤其是容器组件可能在很深的层级，一级级将`state`传下去就很麻烦。

**React-Redux** 提供`Provider`组件，可以让容器组件拿到`state`

```javascript
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import todoApp from './reducers'
import App from './components/App'

let store = createStore(todoApp);

render(
  <Provider store={store}>
   <App />
  </Provider>,
  document.getElementById('root')
)
```

上面代码中，`Provider`在根组件外面包了一层，这样一来，`App`的所有子组件就默认都可以拿到`state`了

#### 3.3、Redux在React中的具体使用

**将store挂到根组件上**

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

**在组件上使用**

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
    // dispatch就是store上的dispatch
    // props是该组件自己原始的props
    chageUserName: () => {
      dispatch({
        type: "USER/EDIT",
        payload: props.userName
      });
    },
    changeOrderName: () =>
      dispatch(async (dispatch, getState) => {
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


