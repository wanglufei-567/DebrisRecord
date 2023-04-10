## Redux解析（四）实现Redux中间件

### 一、Redux中间件是什么

**Redux** 中间件（**Middleware**）是 **Redux** 提供的==**一种扩展机制**，用于在 **Redux** 的数据流中处理额外的逻辑==

==中间件可以在 **Redux** 的 **Action** 被派发到达 **Reducer** 之前或之后进行处理==，可以拦截、修改、延迟或取消 **Action**，以便实现各种功能，例如异步操作、日志记录、错误处理等

如果没有中间件的运用，**Redux** 的工作流程是这样 `action -> reducer`，这是相当于==同步操作==，由`dispatch` 触发**Action**后，直接去**Reducer**执行相应的动作，但是在某些比较==复杂的业务逻辑中==，这种==同步==的实现方式并不能很好的解决我们的问题

> 比如我们有一个这样的需求，点击按钮 -> 获取服务器数据 -> 渲染视图，
>
> 因为获取服务器数据是需要==异步==实现，所以这时候我就需要引入中间件改变Redux同步执行的流程，形成异步流程来实现我们所要的逻辑
>
> 有了中间件，redux 的工作流程就变成这样 action -> middlewares -> reducer，点击按钮就相当于dispatch 触发action，接下去获取服务器数据 middlewares 的执行，当 middlewares 成功获取到服务器就去触发reducer对应的动作，更新需要渲染视图的数据

**Redux** 中间件可以用于在 **Redux** 数据流中执行以下操作：

1. 异步操作：中间件可以处理异步的操作，例如通过网络请求获取数据，并在数据返回后派发相应的 **Action** 更新 **Redux** 的状态
2. **Action** 转换：中间件可以在 **Action** 到达 **Reducer** 之前对其进行转换或修改，例如在 **Action** 中添加一些附加信息或改变 **Action** 的类型
3. 数据过滤：中间件可以根据一些条件对 **Action** 进行过滤，例如根据用户权限过滤某些 **Action**，或者忽略某些特定的 **Action**
4. 错误处理：中间件可以处理 **Redux** 中的错误，例如在 **Action** 操作中发生错误时记录日志或通知开发人员
5. 日志记录：中间件可以记录 **Redux** 数据流中的操作，例如在派发 **Action** 和更新状态时记录日志，用于调试和开发过程中的追踪

使用 **Redux** 中间件需要使用 **Redux** 提供的 `applyMiddleware` 函数，将中间件作为参数传递给该函数，并在创建 **Redux** **Store** 时应用

```jsx
import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk'; // 示例中使用了 redux-thunk 中间件

import rootReducer from './reducers';

const store = createStore(
  rootReducer,
  applyMiddleware(thunkMiddleware) // 将中间件传递给 applyMiddleware 函数
);

// ...其他代码
```

常用的 **Redux** 中间件包括 `redux-thunk`、`redux-saga`、`redux-logger` 等，它们提供了不同的功能和用法，可以根据项目需求选择合适的中间件进行使用

使用 **Redux** 中间件可以增强 **Redux** 的功能，使其更加灵活和可扩展

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230409233646720.png" alt="image-20230409233646720" style="zoom:40%;" />

