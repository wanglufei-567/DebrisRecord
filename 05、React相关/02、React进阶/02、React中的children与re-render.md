## React中的children与re-render

### 一、使用children传递子组件避免re-render

假设有一个组件其内部的`state`会频繁更新，比如下面👇这个组件中每次鼠标移动都会进行状态更新

```jsx
const MovingComponent = () => {
  const [state, setState] = useState({ x: 100, y: 100 });

  return (
    <div
      // when the mouse moves inside this component, update the state
      onMouseMove={(e) => setState({ x: e.clientX - 20, y: e.clientY - 20 })}
      // use this state right away - the component will follow mouse movements
      style={{ left: state.x, top: state.y }}
    >
      <ChildComponent />
    </div>
  );
};
```

由于**React**的组件更新机制，父组件状态更新时会引起其子组件的**re-render**，在这个例子中，每次鼠标移动引起的父组件**MovingComponent**的状态更新，都会导致子组件**ChildComponent** **re-render**，若**ChildComponent** 中存在重逻辑，那么频繁的**re-render**将会引起性能问题

一般我们可以通过**React.memo**包裹子组件来解决其频繁**re-render**的问题，除此之外，我们还可以通==过将子组件作为`children`传递给父组件==来解决这个问题，看下面👇

在上层组件中（**MovingComponent**的父组件）将**ChildComponent**作为`children`，通过`props`传递给**MovingComponent**

```jsx
const SomeOutsideComponent = () => {
  return (
    <MovingComponent>
      <ChildComponent />
    </MovingComponent>
  );
};
```

在**MovingComponent**中，从`props`中取出`children`直接使用

```jsx
const MovingComponent = ({ children }) => {
  const [state, setState] = useState({ x: 100, y: 100 });

  return (
    <div 
      onMouseMove={(e) => setState({ x: e.clientX - 20, y: e.clientY - 20 })} 
      style={{ left: state.x, top: state.y }}
    >
      // children now will not be re-rendered
      {children}
    </div>
  );
};
```

这样子组件**ChildComponent**便不会受父组件**MovingComponent**的状态更新影响，从而避免了**re-render**

### 二、使用children传递子组件的相关疑问

- **问题一：**子组件（**ChildComponent**）通过`children`传递，但其仍然是父组件（**MovingComponent**）的子组件，为何不受父组件状态更新的影响

  **直接在父组件中使用：**

  ```jsx
  const MovingComponent = () => {
    const [state, setState] = useState({ x: 100, y: 100 });
  
    return (
      <div
        onMouseMove={(e) => setState({ x: e.clientX - 20, y: e.clientY - 20 })}
        style={{ left: state.x, top: state.y }}
      >
        <ChildComponent />
      </div>
    );
  };
  ```

  **通过`children`传递：**

  ```jsx
  const MovingComponent = ({ children }) => {
    const [state, setState] = useState({ x: 100, y: 100 });
  
    return (
      <div onMouseMove={(e) => setState({ x: e.clientX - 20, y: e.clientY - 20 })} 
        style={{ left: state.x, top: state.y }}>
        {children}
      </div>
    );
  };
  ```

- **问题二：**`children`若是一个方法，为何子组件又会重新**re-render**

  同样是传递`children`，为何直接传递**React.Element**不会**re-render**，而传递方法时又会**re-render**

  ```jsx
  const MovingComponent = ({ children }) => {
    ...
    return (
      <div ...// callbacks same as before
      >
        // children as render function with some data
        // data doesn't depend on the changed state!
        {children({ data: 'something' })}
      </div>
    );
  };
  
  const SomeOutsideComponent = () => {
    return (
      <MovingComponent>
        // ChildComponent re-renders when state in MovingComponent changes!
        // even if it doesn't use the data that is passed from it
        {() => <ChildComponent />}
      </MovingComponent>
    )
  }
  ```

在搞清楚这两个问题之前，有一个关键概念需要明白：**React.Element是什么？**

我们一般书写**React.Element**都是用JSX语法，比如👇

```jsx
const child = <Child />;
```

但这种写法其实只是一种语法糖，其被**Babel**编译之后会变成一个 [React.createElement](https://reactjs.org/docs/react-api.html#createelement)方法的调用，而这个方法返回值是一个对象，也就是常说的**虚拟DOM**；

 **React.createElement**方法的调用执行会发生在父组件的render中，若父组件发生更新，那么子组件对应的**React.createElement**方法便会重新执行生成新的**虚拟DOM**（虽然新旧虚拟DOM可能内容一致）

------

清楚了**React.Element是什么**之后，再回顾下上面的两个问题：

- **问题一：**`children`仍然是在父组件的子组件，为何不受父组件状态更新的影响

  - 这是因为`children`的声明（JSX写法）是写在父组件的上层组件中，其本身是作为**React.Element**传递给父组件的，是挂在父组件的`props`上的，不受父组件**re-render**的影响而重新执行 **React.createElement**方法，生成新的**虚拟DOM**

    <!--当父组件的上层组件re-render时，`children`会变成新的虚拟DOM-->

- **问题二：**`children`若是一个方法，为何子组件又会重新**re-render**

  - 这是因为`children`这个方法在每次父组件**re-render**时都会执行，每次执行返回的子组件**ChildComponent**都是一个全新的子组件

    <!--每次都会重新执行子组件对应的React.createElement方法，生成新的虚拟DOM-->

### 总结

除了使用**React.memo**包裹子组件，还可以使用将子组件作为`children`通过`props`传递给父组件的形式，来避子组件的**re-render**；

另外，当我们搞清楚**React.Element是什么？**之后，便能明白传递子组件时，为何直接传递子组件本身不会**re-render**，为何传递返回子组件的方法却会**re-render**

### 参考文章

[The mystery of React Element, children, parents and re-renders](https://www.developerway.com/posts/react-elements-children-parents)

