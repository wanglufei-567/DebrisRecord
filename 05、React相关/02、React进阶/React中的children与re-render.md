## React中的children与re-render

### 一、使用children传递子组件避免re-render

假设有一个组件其内部的state会频繁更新，比如下面👇这个组件中每次鼠标移动都会进行状态更新

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

由于React的组件更新机制，父组件状态更新时会引起其子组件的re-render，在这个例子中，每次鼠标移动引起的父组件MovingComponent的状态更新，都会导致子组件ChildComponent re-render，若ChildComponent 中存在重逻辑，那么频繁的re-render将会引起性能问题

一般我们可以通过React.memo包裹子组件来解决其频繁re-render的问题，但通过将子组件作为children传递给父组件也可以解决这个问题，看下面👇

在上层组件中将ChildComponent作为children，通过props传递给MovingComponent

```jsx
const SomeOutsideComponent = () => {
  return (
    <MovingComponent>
      <ChildComponent />
    </MovingComponent>
  );
};
```

在MovingComponent中，从props中取出children直接使用

```jsx
const MovingComponent = ({ children }) => {
  const [state, setState] = useState({ x: 100, y: 100 });

  return (
    <div onMouseMove={(e) => setState({ x: e.clientX - 20, y: e.clientY - 20 })} style={{ left: state.x, top: state.y }}>
      // children now will not be re-rendered
      {children}
    </div>
  );
};
```

这样子组件ChildComponent便不会受父组件MovingComponent的状态更新影响，从而避免了re-render