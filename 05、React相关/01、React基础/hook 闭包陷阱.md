## hook 闭包陷阱

### 一、为什么会出现闭包陷阱？

在 **React** 中，每次组件渲染，都会重新执行函数组件体，从而生成**一个全新的闭包环境**，此时组件中的 `state`、`props`、事件处理函数等，都是这一轮渲染的“快照”

如果在副作用（如 `useEffect`）、事件监听、`setTimeout` 等中引用了这些变量，就会捕获**当时渲染的值**， 如果依赖没有更新，闭包里持有的就是旧值

**这并不是 bug**，而是 **React** 的明确设计，所谓“陷阱”，只是因为开发者往往**直觉上以为 state 是实时更新的**，结果却拿到了过期值

### 二、经典示例

**示例 1：`setTimeout` 捕获旧值**

```jsx
import { useState, useEffect } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      console.log("Count in timeout:", count);
    }, 3000);
  }, []);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
    </div>
  );
}
```

输出结果：即使点了多次按钮，3 秒后打印的还是 `0`

原因：`useEffect(() => {...}, [])` 只在首次渲染时执行，闭包中捕获的 `count` 是初始值。之后即便组件重新渲染，定时器里的回调依然持有旧闭包

**示例 2：事件监听中的旧值**

```jsx
import { useState, useEffect } from "react";

function ClickTracker() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function handleClick() {
      console.log("Current count:", count);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

表现：点击按钮会更新 `count`，但点击页面其他地方时，打印的仍然是旧值

原因同样是闭包捕获了初始值

### 三、如何解决？

#### 3.1、正确管理依赖数组

当希望副作用能感知最新的值，就必须把依赖加进 `useEffect`：

```js
useEffect(() => {
  const id = setTimeout(() => {
    console.log("Count in timeout:", count);
  }, 3000);
  return () => clearTimeout(id);
}, [count]);
```

这样 **React** 会在 `count` 更新时重新绑定 effect，闭包中能获取最新的值

#### 3.2、使用函数式更新避免闭包

**React** 提供了**函数式更新**，确保更新函数拿到的是**最新的 state**，而不是闭包捕获的旧值：

```jsx
function CounterSafe() {
  const [count, setCount] = useState(0);

  function increment() {
    setTimeout(() => {
      setCount(prev => prev + 1); // ✅ 始终基于最新 state
    }, 1000);
  }

  return (
    <div>
      <p>{count}</p>
      <button onClick={increment}>延迟增加</button>
    </div>
  );
}
```

#### 3.3、使用 `useRef` 保存最新值

如果我们不想让 `useEffect` 的依赖数组不断变化，可以用 `useRef` 始终保存最新的值：

```js
const latestCount = useRef(count);

useEffect(() => {
  latestCount.current = count;
}, [count]);

useEffect(() => {
  function handleClick() {
    console.log("Current count:", latestCount.current);
  }
  window.addEventListener("click", handleClick);
  return () => window.removeEventListener("click", handleClick);
}, []);
```

这种方式在事件监听、WebSocket、订阅回调等场景特别常见

### 四、源码层面的原因

理解这一点，需要看看 **React** 是如何调度 **state** 更新的

在 **React** 内部，`useState` 的更新逻辑依赖于 **链表队列** 来存储更新。更新时会走类似以下逻辑（简化伪代码）：

```js
// react-reconciler/src/ReactFiberHooks.js
function dispatchSetState(queue, action) {
  const update = { action, next: null };
  enqueueUpdate(queue, update);
  scheduleRender();
}
```

```js
setCount(count + 1);
```

`count` 的值在当前闭包中已经固定住了，哪怕 state 在更新链表里最终变化了，闭包里的 `count` 依旧是旧值

而如果写：

```js
setCount(prev => prev + 1);
```

React 在执行更新队列时，会把 `prev` 替换为**上一次计算完成的最新 state**，因此总是基于最新值来更新，避免了闭包问题

这就是为什么官方文档一直推荐：**如果更新依赖于之前的 state，一定要用函数式更新**



