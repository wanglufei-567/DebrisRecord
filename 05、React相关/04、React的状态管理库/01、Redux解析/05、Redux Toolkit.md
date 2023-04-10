## Redux解析（五）Redux Toolkit

### 一、Redux Toolkit是什么

**Redux Toolkit** 是 **Redux** 官方推荐的一套**==工具集==**，==用于简化 **Redux** 的使用和开发流程==，提供了一些常用的工具函数和约定，帮助开发者更快、更轻松地构建 **Redux** 应用

**Redux Toolkit** 提供了以下主要功能：

1. `configureStore`：==一个简化了 **Redux Store** 创建过程的函数==
   - 它自动集成了常用的中间件（如 **Redux Thunk**）和开发工具（如 **Redux DevTools Extension**），并且可以通过一行代码进行配置。
2. `createSlice`：==一个用于生成 **Redux Reducer** 和 **Action** 的函数==
   - 它基于 **immer** 库，==允许通过直接修改状态对象来更新 **Redux** 状态，而无需手动编写繁琐的 **Reducer** 和 **Action**==
3. `createAsyncThunk`：一个用于处理异步操作的工具函数
   - 它允许在 **Redux** 中处理异步逻辑，并自动处理异步操作的状态（如加载中、成功、失败）
4. `createEntityAdapter`：一个用于处理以实体为单位的数据的工具函数
   - 它提供了一些用于管理实体数据的常用操作，如增删改查、排序、过滤等
5. `immer`：==一个用于在 **Redux Reducer** 中进行不可变更新的库==
   - ==它让开发者可以**直接修改状态对象**，而**不必手动编写深度复制**的逻辑，从而简化了 **Reducer** 的编写==

**Redux Toolkit** 的优点包括：

1. 简化了 **Redux** 的使用和开发流程，减少了样板代码的编写，提高了开发效率
2. 提供了一些常用的工具函数和约定，使 **Redux** 应用的结构更加清晰和一致，减少了出错的可能性
3. 集成了常用的中间件和开发工具，提供了更好的开发和调试体验
4. 支持异步操作和实体管理，简化了复杂应用中的数据处理逻辑
5. 官方推荐的工具集，具有广泛的社区支持和文档资源

但 **Redux Toolkit** 也有一些限制，例如可能对一些复杂的应用场景或特定需求不够灵活，因此在使用 **Redux** **Toolkit** 时需要根据具体的项目需求和团队经验进行权衡和选择。

### 二、Redux Toolkit的基本使用

1. 安装 **Redux Toolkit**：使用 **npm** 或者 **yarn** 安装 **Redux Toolkit** 到你的项目中

   ```bash
   npm install @reduxjs/toolkit
   ```

   或者

   ```bash
   yarn add @reduxjs/toolkit
   ```

2. 创建 **Redux Store**：==使用 `configureStore` 函数创建 **Redux Store**==

   `configureStore` 函数接受一个配置对象作为参数，用于配置 **Redux Store**

   ```js
   import { configureStore } from '@reduxjs/toolkit';
   import rootReducer from './reducers'; // 导入根 reducer
   
   const store = configureStore({
     reducer: rootReducer, // 指定根 reducer
   });
   ```

3. 创建 **Reducer** 和 **Action**：==使用 `createSlice` 函数生成 **Reducer** 和 **Action**==

   `createSlice`会自动生成相应的 **Reducer** 和 **Action**，并集成了 **immer** 库，==允许通过直接修改状态对象来更新 **Redux** 状态==

   ```js
   import { createSlice } from '@reduxjs/toolkit';
   
   const counterSlice = createSlice({
     name: 'counter',
     initialState: { value: 0 },
     reducers: {
       increment: (state) => {
         state.value += 1;
       },
       decrement: (state) => {
         state.value -= 1;
       },
     },
   });
   
   export const { increment, decrement } = counterSlice.actions; // 导出自动生成的 Actions
   
   export default counterSlice.reducer; // 导出自动生成的 Reducer
   ```

4. 使用 `createAsyncThunk` 处理异步操作：使用 `createAsyncThunk` 函数处理异步操作，例如异步请求、异步数据处理等

   ```js
   import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
   import api from './api'; // 导入 API 请求模块
   
   export const fetchPosts = createAsyncThunk('posts/fetchPosts', async () => {
     const response = await api.get('/posts');
     return response.data;
   });
   
   const postsSlice = createSlice({
     name: 'posts',
     initialState: { data: [], status: 'idle', error: null },
     reducers: {},
     extraReducers: (builder) => {
       builder
         .addCase(fetchPosts.pending, (state) => {
           state.status = 'loading';
         })
         .addCase(fetchPosts.fulfilled, (state, action) => {
           state.status = 'succeeded';
           state.data = action.payload;
         })
         .addCase(fetchPosts.rejected, (state, action) => {
           state.status = 'failed';
           state.error = action.error.message;
         });
     },
   });
   
   export default postsSlice.reducer;
   ```

5. 使用 `useSelector` 和 `useDispatch` 进行状态管理：在 **React** 组件中使用 `useSelector` 钩子来获取 **Redux Store** 中的状态，并使用 `useDispatch` 钩子来派发 **Action**

   ```jsx
   import React from 'react';
   import { useSelector, useDispatch } from 'react-redux';
   import { increment, decrement } from './counterSlice';
   
   const Counter = () => {
     const count = useSelector((state) => state.counter.value);
     const dispatch = useDispatch();
   
     return (
       <div>
         <span>{count}</span>
         <button onClick={() => dispatch(increment())}>增加</button>
         <button onClick={() => dispatch(decrement())}>减少</button>
       </div>
     );
   };
   
   export default Counter;
   ```

以上就是 **Redux Toolkit** 的基本使用方式，它通过提供一系列简化和集成的工具，帮助开发者更轻松地使用 **Redux** 进行状态管理，减少了样板代码的编写，提升了开发效率。

同时，**Redux Toolkit** 也采用了一些最佳实践，例如使用 **Immer** 进行状态更新、集成了异步操作处理等，以解决 **Redux** 使用中的一些常见问题

### 三、immer是什么

**Immer** 是一个用于简化 **JavaScript** 中==**不可变状态管理**==的库。它提供了一种简洁和直观的方式来==更新和修改对象和数组，而无需直接修改原始数据==

==**Immer** 的**设计理念**是通过创建一个**代理对象**来包装原始数据，并在对代理对象进行修改时生成新的不可变状态，而不会直接修改原始数据==。这样可以保持**原始数据的不变性**，避免了因为直接修改数据而引发的副作用和难以调试的问题

**Immer** 提供了一些核心的 **API**，包括：

- `produce`：用于创建一个代理对象，并在其上进行状态更新和修改
  - `produce` 函数接受两个参数：
    - 当前的状态对象 `state` 
    - 一个函数 `(draft) => {}`，这个函数中可以执行状态的修改操作，在回调函数中可以通过直接修改代理对象的方式来更新状态
  - `produce` 函数会==返回一个**新的不可变状态对象**，而不会修改原始数据==

```js
import produce from 'immer';

const state = { count: 0 };

const newState = produce(state, (draft) => {
  draftState.count += 1;
});

console.log(newState); // { count: 1 }
```

- `draft`：用于访问代理对象中的属性，并进行状态更新和修改

```js
import produce from 'immer';

const state = { count: 0 };

const newState = produce(state, (draftState) => {
  draftState.count += 1;
});

console.log(newState); // { count: 1 }
```

- `isDraft` 和 `isDraftable`：用于检查一个对象是否是代理对象或者是否可以被代理

  `isDraft` 函数用于检查一个对象是否是代理对象，`isDraftable` 函数用于检查一个对象是否可以被代理

```js
import { isDraft, isDraftable } from 'immer';

const state = { count: 0 };
const draftState = produce(state, () => {});

console.log(isDraft(state)); // false
console.log(isDraft(draftState)); // true

console.log(isDraftable(state)); // true
console.log(isDraftable(42)); // false
```

在 **Immer** 中，使用 `produce` 函数创建一个可变的 "**draft**" 对象，然后可以在这个 **draft** 对象上执行状态的修改操作，最后通过 `produce` 函数返回一个新的不可变状态对象

这样可以保持**原始状态对象的不变性**，避免了**直接修改原始状态对象可能导致的副作用**

#### 3.1、Redux Toolkit中的immer

**Redux Toolkit** 的`createSlice` 函数==默认集成了 **Immer** 来处理状态的更新和修改==

```js
import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      // 直接在 reducer 中使用普通对象和数组语法来更新状态
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    reset: (state) => {
      state.value = 0;
    },
  },
});

export const { increment, decrement, reset } = counterSlice.actions;
export default counterSlice.reducer;
```

在上面的示例中，`createSlice` 函数创建了一个名为 `counter` 的 **reducer**，初始状态为 `{ value: 0 }`，并定义了三个处理函数来处理 `increment`、`decrement` 和 `reset` 三个 **action**

在这三个处理函数中，==可以直接使用普通对象和数组语法来更新 `state` 对象==，而不需要手动编写不可变更新逻辑

**Redux Toolkit** 中的 **Immer** 会在执行 **reducer** 时，==根据我们的操作生成一个新的不可变状态对象，并将其作为新的状态返回==，这样可以保持原始状态的不变性，避免了==直接修改状态的副作用==和难以调试的问题

------

在 **Redux** 中，**==状态的不可变性==**是一个重要的概念。它指的是==一旦状态对象被创建，就不应该再被修改，而是应该**通过创建新的状态对象来实现状态的更新**==，这样做的好处是，可以避免直接修改原始状态对象导致的副作用

直接修改原始状态对象可能导致以下**==副作用==**：

- **难以追踪状态变更**：直接修改原始状态对象会使状态的变更变得**难以追踪**
  - 在复杂的应用中，状态可能会被多个地方引用和修改，如果直接在多个地方修改原始状态对象，会导致状态的变更过程变得复杂和难以调试，不利于代码的维护和调试
- **影响性能和内存效率**：直接修改原始状态对象可能导致频繁的对象复制和内存分配，从而影响性能和内存效率
  - ==在 **Redux** 中，由于使用了**浅比较**来判断状态是否变更，如果直接修改原始状态对象，可能导致 **Redux** 认为状态没有变更，从而不触发视图的重新渲染，导致 UI 显示不一致==