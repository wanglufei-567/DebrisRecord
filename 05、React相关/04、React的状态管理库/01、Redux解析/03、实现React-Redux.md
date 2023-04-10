## Redux解析（三）实现React-Redux

### 一、React Context的使用

**React Context** 是 **React** 库提供的==一种用于在**组件之间共享状态**的方式==，它可以避免通过一层层的属性传递来传递数据给子组件，从而简化组件之间的数据传递

**React Context** 主要包含以下几个重要的概念：

1. ==**Context Provider（上下文提供者）**==：通过 **Context Provider**，可以在组件树的某一层上设置共享的状态数据，==它负责将状态数据传递给嵌套在其下面的子组件==
2. ==**Context Consumer（上下文消费者）**==：通过 **Context Consumer**，可以在组件树中的任何地方访问共享的状态数据，==它负责从 **Context Provider** 中获取状态数据，并将其传递给需要使用的组件==

下面是使用 **React Context** 的一般步骤：

1. 创建一个 **Context** 对象：可以通过 `React.createContext()` 函数创建一个 **Context** 对象，例如：

   ```js
   const MyContext = React.createContext();
   ```

2. 在组件中使用 **Context Provider**：使用 **Context Provider** 组件将共享的状态数据传递给嵌套在其下面的子组件，例如：

   ```jsx
   <MyContext.Provider value={myData}>
     {/* 嵌套的子组件 */}
   </MyContext.Provider>
   ```

   其中，`value` 属性是传递给子组件的共享状态数据

3. 在组件中使用 **Context Consumer**：在需要使用共享状态数据的组件中使用 **Context Consumer** 组件，例如：

   ```jsx
   <MyContext.Consumer>
     {value => (
       // 使用共享的状态数据 value
     )}
   </MyContext.Consumer>
   ```

   在 **Context Consumer** 的子组件中，可以通过回调函数的方式接收到从 **Context Provider** 中传递下来的共享状态数据，并在组件中使用

注意事项：

- 当没有匹配到对应的 **Context Provider** 时，**Context Consumer** 可以设置默认值。
- 一个应用程序中可以有多个 **Context Provider** 和 **Context Consumer**，可以嵌套使用多层的 **Context Provider** 和 **Context Consumer** 来传递和接收不同的共享状态数据。

**React Context** 的使用场景包括但不限于：

- 在跨多层级的组件中共享状态数据，避免通过一层层的属性传递
- 在不使用全局状态管理库（如 Redux）的情况下，在组件之间进行状态共享
- 在某些情况下，将一些全局的配置信息、主题等共享给多个组件

==需要注意的是，**Context** 应该被谨慎使用，不应该被滥用，因为过度使用 **Context** 可能**导致组件之间的耦合性增加**，从而降低组件的可复用性和维护性==

在一些简单的组件间传递数据的场景下，使用属性传递或者组件组合可能更加简洁和合适

### 二、实现Provider组件

首先回顾下**Provider**组件的使用方式

在应用程序的根组件中使用 **Provider**：在应用程序的根组件中使用 **Provider** 组件，将 **Redux** 的 **Store** 作为属性传递给 **Provider**，例如：

```jsx
import { Provider } from 'react-redux';
import store from './store';

ReactDOM.render(
  <Provider store={store}>
    {/* 应用程序的根组件 */}
  </Provider>,
  document.getElementById('root')
);
```

#### 2.1、Provider的具体实现

首先创建一个**Context**对象

```js
// ./ReactReduxContext
import React from 'react';
export const ReactReduxContext = React.createContext(null)
export default ReactReduxContext;
```

再创建**Provider**组件

```jsx
import React from 'react'
import ReactReduxContext from './ReactReduxContext';

export default function(props){
  return (
    <ReactReduxContext.Provider value={{ store: props.store }}>
      {props.children}
    </ReactReduxContext.Provider>
  )
}
```

**Provider**组件中使用**Context Provider**将**Redux**的**store**当作共享状态数据传递给子组件

### 三、实现connect方法

首先回顾下**connect**方法的使用方式

在组件中使用 **Connect** 函数连接 **Redux** 的状态和操作：在需要访问 **Redux** 状态的组件中使用 **Connect** 函数，==将需要访问的状态和操作绑定到组件的属性上==，例如：

```jsx
import { connect } from 'react-redux';
import { incrementCounter } from './actions';

class MyComponent extends React.Component {
  // 组件的实现
}

// 将 Redux 的状态和操作绑定到组件的属性上
const mapStateToProps = (state) => ({
  counter: state.counter
});

const mapDispatchToProps = {
  incrementCounter
};

export default connect(mapStateToProps, mapDispatchToProps)(MyComponent);
```

在组件中，可以通过 `this.props` 访问到从 **Redux** 传递下来的状态和操作，并触发状态的变更

#### 3.1、connect方法的具体实现

```jsx
import React from 'react';
import ReactReduxContext from './ReactReduxContext';
import { bindActionCreators } from '../redux';
/**
 * 连接 组件和仓库
 * @param {*} mapStateToProps 把仓库中的状态映射为组件的属性对象
 * @param {*} mapDispatchToProps  把store.dispatch方法映射为组件的属性对象 参数可以是一个对象，也可以是一个函数
 */
function connect(mapStateToProps, mapDispatchToProps) {
  return function (OldComponent) {
    return class extends React.Component {
      static contextType = ReactReduxContext;
      constructor(props, context) {
        //this.context
        super(props);
        const { store } = context;
        const { getState, subscribe, dispatch } = store;
        //先获取仓库中的总状态{counter1:{number:0},counter2:{number:0}}
        this.state = mapStateToProps(getState());
        //订阅仓库中的的状态变化事件，当仓库中的状态发生改变后重新用新的映射状态进行setState
        this.unsubscribe = subscribe(() => {
          this.setState(mapStateToProps(getState()));
        });

        let dispatchProps;
        //如果说mapDispatchToProps是一个函数的话，
        if (typeof mapDispatchToProps === 'function') {
          dispatchProps = mapDispatchToProps(dispatch);
        } else {
          //如果它是一个对象的话
          dispatchProps = bindActionCreators(
            mapDispatchToProps,
            dispatch
          );
        }
        this.dispatchProps = dispatchProps;
      }
      componentWillUnmount() {
        this.unsubscribe();
      }
      render() {
        return (
          <OldComponent
            {...this.props}
            {...this.state}
            {...this.dispatchProps}
          />
        );
      }
    };
  };
}
export default connect;
```

**connect**方法的返回值其实是一个**HOC**，接收一个组件作为参数

**connect**方法的两个参数：

- `mapStateToProps`：把仓库中的状态映射为组件的属性对象
- `mapDispatchToProps`：把`store.dispatch`方法映射为组件的属性对象 参数可以是一个对象，也可以是一个函数

**connect**方法返回的**HOC**会从**Context**对象上拿到**Redux** **store**上的方法：`getState`、`subscribe`、`dispatch` 之后的逻辑：

- ==执行`mapStateToProps`把仓库中的状态映射为组件的属性对象==

  ```jsx
  this.state = mapStateToProps(getState());
  ```

- ==订阅仓库中的的状态变化事件，当仓库中的状态发生改变后重新用新的映射状态进行`setState`==

  ```jsx
  this.unsubscribe = subscribe(() => {
    this.setState(mapStateToProps(getState()));
  });
  ```

  <!--subscribe注册的监听函数，是在store的dispatch中触发的，这也是为什么只能通过dispatch来更改state的理由，state的更改是要被监听的-->

-  ==执行`mapDispatchToProps`把`store.dispatch`方法映射为组件的属性对象==

  ```jsx
  let dispatchProps;
  //如果说mapDispatchToProps是一个函数的话，
  if (typeof mapDispatchToProps === 'function') {
    dispatchProps = mapDispatchToProps(dispatch);
  } else {
    //如果它是一个对象的话
    dispatchProps = bindActionCreators(
      mapDispatchToProps,
      dispatch
    );
  }
  this.dispatchProps = dispatchProps;
  ```

- ==最后再将处理好的数据以`props`的形式传递给原组件==

  ```jsx
  render() {
    return (
      <OldComponent
        {...this.props}
        {...this.state}
        {...this.dispatchProps}
      />
    );
  }
  ```

### 四、实现Redux相关的hooks

`useSelector` 和 `useDispatch` 是 **React-Redux** 提供的两个用于在**==函数组件==**中使用 **Redux** 的 **Hook**

- ==`useSelector` 用于从 **Redux** 的状态中**选择并订阅**特定的数据==

  - 它接收一个函数作为参数，这个函数会接收整个 **Redux** 的状态，并返回需要订阅的数据，当这些数据发生变化时，`useSelector` 会自动更新组件

  ```jsx
  import { useSelector } from 'react-redux';
  
  const MyComponent = () => {
    const counter = useSelector(state => state.counter); // 从 Redux 的状态中选择 counter 数据
  
    // 使用 counter 数据进行组件渲染
  
    return (
      // 组件的 JSX
    );
  };
  ```

- ==`useDispatch` 用于在函数组件中使用 Redux 的 `dispatch` 方法，用于触发 **Action** 来更新 **Redux** 的状态==

  ```jsx
  import { useDispatch } from 'react-redux';
  import { incrementCounter } from './actions';
  
  const MyComponent = () => {
    const dispatch = useDispatch(); // 获取 dispatch 方法
  
    const handleIncrement = () => {
      dispatch(incrementCounter()); // 触发 incrementCounter Action 来更新 Redux 的状态
    };
  
    // 使用 dispatch 方法进行组件中的事件处理
  
    return (
      // 组件的 JSX
    );
  };
  ```

  `useSelector` 和 `useDispatch` 是 **React-Redux** 提供的简化 **Redux** 在**函数组件**中的集成方式，用于替代传统的 `connect` 函数

#### 4.1、实现useSelector

```jsx
import React, {useLayoutEffect, useState, useRef } from 'react';
import ReactReduxContext from '../ReactReduxContext';
function useSelector(selector) {
    const { store } = React.useContext(ReactReduxContext);
    return useSyncExternalStore(
        store.subscribe,
        () => selector(store.getState())
    );
}

function useSyncExternalStore(subscribe, getSnapShot) {
    let [state, setState] = useState(getSnapShot());
    //因为订阅只要一次就可以了，写在外面每次重新组件都要订阅
    useLayoutEffect(() => {
        subscribe(() => {
            setState(getSnapShot())
        });
    }, []);
    return state;
}

export default useSelector;
```

主要有两部分内容：

- 从**Context**上获取**store**，从拿到**state**

  ```jsx
  const { store } = React.useContext(ReactReduxContext);
  
  () => selector(store.getState())
  
  let [state, setState] = useState(getSnapShot());
  ```

- 订阅**state**的变化

  ```jsx
  useLayoutEffect(() => {
      subscribe(() => {
          setState(getSnapShot())
      });
  }, []);
  ```

#### 4.2、实现useDispatch

```jsx
import {useContext} from 'react';
import ReactReduxContext from '../ReactReduxContext';

const  useDispatch = ()=>{
    const {store} = useContext(ReactReduxContext);
    return store.dispatch;
}
export default  useDispatch 
```

`useDispatch`的实现就更简单了，就是从**Context**对象上拿到**store**的**dispatch**方法，再将**dispatch**方法返回出去

### 总结

**React-Redux**中主要就是做了一下几件事：

- 创建一个**React Context**对象，用于传递**Redux**的**store**
- 从**Context**对象上拿到**store**的方法：`getState`、`subscribe`、`dispatch` 
  - 使用`getState`获取**store**的**state**
  - 使用`subscribe`监听**state**的变化
  - 将`dispatch` 传递给组件，用于修改**state**

