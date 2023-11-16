## Mobx解析（一）Mobx基本使用

### 一、Mobx是什么？

### 1.1、Mobx简介

**MobX** 是一款用于==**状态管理**==的 JavaScript 库，它是==一种用于构建**响应式应用程序**的**状态管理工具**==，通常用于与 **React**、**Vue** 或其他前端框架一起使用，**MobX** 的目标是让状态管理变得简单、直观和高效

**MobX** 提供了一种简单的方式来管理应用程序的状态，使得==状态的变化可以自动地影响到相关的视图==

它采用了**==观察者模式==**，通过自动追踪状态的使用和变化，来实现==状态和视图之间的自动关联==。当状态发生变化时，==所有依赖于该状态的视图都会自动更新==，从而保持了状态和视图之间的一致性

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/zhflow_1659261254516.png)

**MobX** 的核心概念包括：

1. **Observables（可观察对象）**：==将状态转换为可观察的对象，使其可以被观察和监听==
   - 可以通过使用 `observable` 函数将对象、数组、映射等转换为可观察的状态 <!--转变为响应式-->
2. **Actions（动作**）：==用于修改状态的函数==
   - 通过使用 `action` 函数，可以定义用于修改状态的动作，并确保这些动作是可追踪和可回放的
3. **Reactions（反应**）：通过使用 `autorun`、`reaction` 或 `whe`
4. `n` 函数，可以==创建对状态变化做出反应的响应式函数==，这可以用于==自动更新视图==或执行其他逻辑
5. **Computed Values（计算属性**）：通过使用 `computed` 函数，可以定义从现有状态中计算得到的属性
   - 计算属性会自动追踪其依赖的状态，并在其依赖状态发生变化时自动更新
6. **Transactions（事务）**：用于批量地修改状态，以避免频繁的状态更新导致的性能问题
   - 可以使用 `transaction` 函数来包装多个状态修改操作，确保它们在同一个事务中执行

**MobX** 提供了一种简单、灵活且高效的方式来管理复杂的应用程序状态，并将状态的变化自动地同步到相关的视图，它可以帮助开发人员编写更容易维护、可测试和高性能的前端应用程序

### 1.2、Mobx与Redux对比

**Redux**和**MobX**是两个流行的**JavaScript**状态管理库，==用于管理应用程序的状态==，它们都有不同的设计理念和工作方式

**Redux的设计理念：**

1. ==**单一数据源**==：**Redux**使用单一数据源来管理整个应用程序的状态
   - 这意味着应用程序的状态被存储在==一个单一的**JavaScript**对象（称为**Store**）中==，而不是分散在多个组件或模块中
2. ==**状态是只读的**==：**Redux**的状态是只读的，==状态不能直接在应用程序中被修改==
   - 要改变状态，必须通过触发一个称为"**action**"的纯对象来派发一个操作，然后由一个称为"**reducer**"的函数来==处理这个操作并生成**新的状态**==
3. ==**纯函数的reducer**==：**Redux**的**reducer**是纯函数，接收旧的状态和一个**action**作为输入，并==返回一个**新的状态**作为输出==
   - 这意味着在**Redux**中的状态更加可预测和易于调试，因为状态的改变完全由**reducer**函数控制
4. **==单向数据流==**：**Redux**使用单向数据流来管理状态的变化
   - 当一个**action**被派发时，它会通过**reducer**生成一个新的状态，然后新的状态会被应用到整个应用程序中的所有组件，从而实现状态的一致性

**MobX的设计理念：**

1. ==**可观察的状态**==：**MobX**通过==将状态对象转换为可观察的对象==来管理状态 <!--响应式对象-->

   - 这意味着当状态发生变化时，会自动通知观察者，从而更新相关的组件或函数。

2. ==**响应式编程**==：**MobX**使用响应式编程的方式来处理状态的变化

   - 这意味着当状态发生变化时，相关的==观察者会自动更新==，而==不需要显式地调用==方法或发送操作

3. ==**可变状态**==：与**Redux**不同，**MobX**的状态是可变的，可以直接修改

   - 这使得在处理复杂的状态逻辑时**==更加灵活==**，但也需要开发人员更加小心地管理状态的变化

4. ==**局部更新**==：**MobX**允许只更新状态对象的一部分，而不是整个状态

   - 这使得状态的更新更加高效，只有受影响的部分会重新计算和更新

5. ==**隐式依赖追踪**==：**MobX**使用**隐式依赖追踪**来自动追踪状态之间的依赖关系

   - **Mobx** 在观察一个状态对象时会自动追踪状态属性的访问，并在状态属性发生变化时自动触发相应的更新，这种机制==不需要手动编写显式的依赖关系==，而是通过 **Mobx** 的观察者模式自动进行依赖追踪

     <!--类似Vue的依赖收集，用到状态数据的地方会被收集起来-->

     - 当一个组件或函数访问了 **Mobx** 中的可观察状态属性时，**Mobx** 会==自动将这个组件或函数标记为依赖于该状态属性==
     - 当该状态属性发生变化时，**Mobx** 会自动检测到这个变化，==并通知所有依赖于该状态属性的组件或函数进行更新==

------

**设计理念对比：**

- **Redux**：==**Redux** 的设计理念是**单一数据源**（Single Source of Truth）和**不可变性**（Immutability）==
  - **Redux** 将应用程序的状态存储在一个单一的全局状态树中，通过**纯函数**（称为 **reducer**）处理状态的更新，==保持状态的不可变性==，确保状态变更的可追溯性和可预测性
- **Mobx**：==**Mobx** 的设计理念是可观察的状态和反应性==
  - **Mobx** 允许将状态转换为可观察的对象，通过自动追踪状态的变化并触发相应的更新，实现了状态的反应性

**工作方式对比：**

- **Redux**：==**Redux** 使用 **action**、**reducer** 和 **store** 三个主要的概念来管理状态==

  - 当应用程序中的状态发生变化时，**Redux** 通过派发 **action** 来触发状态更新，然后通过 **reducer** 处理 **action** 并返回新的状态
  - **Redux** 使用单一的全局状态树来存储应用程序的状态，并通过**==订阅机制==**来通知视图层更新

- **Mobx**：==**Mobx** 使用可观察状态和**观察者机制**来管理状态==

  - 当可观察状态发生变化时，**Mobx** 会==自动通知所有的观察者==，包括 **React** 组件、普通的 **JavaScript** 函数等，从而触发视图的更新

  - **Mobx** 允许==直接修改或使用**action**来更新状态==，并自动追踪状态的变化，从而保持状态的反应性

    <!--使用action会批量更新，性能更好-->

**优缺点对比：**

- **Redux**

  **优点**：

  - **可预测的状态管理**
    - **Redux**通过强调单一数据源和不可变性，使得状态管理更加可预测和易于调试。状态的变化完全由**reducer**控制，使得状态的变更过程**可追溯和可控**
  - **统一的状态管理**
    - **Redux**使用单一的**Store**来管理整个应用程序的状态，使得状态在整个应用程序中的传递和共享更加一致，这种方式==对于大型应用程序和复杂的状态逻辑来说非常有用==
  - **社区和工具生态丰富**
    - **Redux**是一个非常流行和成熟的状态管理库，具有广泛的社区支持和丰富的工具生态，包括调试工具、中间件和插件等。这使得在开发过程中能够更加高效地使用和调试**Redux**

  **缺点**：

  - **繁琐的样板代码**
    - **Redux**在使用上可能需要编写较多的样板代码，包括定义**action**和**reducer**，以及处理异步逻辑的中间件，这可能会使得开发过程中的代码量相对较大，增加了一定的学习和维护成本
  - **操作不直观**
    - **Redux**的状态变更需要通过派发**action**和编写**reducer**函数来完成，这对于一些开发者来说可能不太直观。在处理复杂的状态逻辑时，可能需要更多的编码和调试

- **Mobx**

  **优点：**

  - **简化的状态管理**
    - **MobX**通过使用可观察的状态和隐式依赖追踪，使得状态管理更加简化和直观。状态的变化会==自动通知观察者==，从而实现了响应式的状态更新
  - **灵活性和可变性**
    - **MobX**的状态是可变的，可以直接修改，这使得处理复杂的状态逻辑时更加灵活
    - **MobX**还支持局部更新，使得状态的更新更加高效
  - **更少的样板代码**
    - 相比**Redux**，**MobX**在使用上通常需要更少的样板代码，不需要编写**action**和**reducer**，从而减少了一些开发和维护的工作

  **缺点：**

  - **缺乏统一性**
    - 由于**MobX**的设计较为灵活，可能导致不同团队或开发者在使用时==采用不同的模式和实践==，从而可能导致项目中==出现较大的差异和难以维护的状态管理方式==
  - **隐式依赖追踪的复杂性**
    - ==隐式依赖追踪是**MobX**的一大优点，但也可能导致复杂性==
    - 当状态逻辑变得复杂时，**MobX**的依赖追踪可能变得难以理解和调试，因为不同的状态更新可能会导致隐式的依赖链变得复杂和难以追溯
  - **社区和工具生态相对较小**
    - 相比**Redux**，**MobX**的社区和工具生态相对较小，可能相对缺乏一些成熟的工具和库，尤其在调试和开发辅助工具方面
  - **学习曲线**
    - 虽然**MobX**在状态管理上相对简化，但其概念和用法与传统的**JavaScript**开发方式有所不同，因此需要学习新的概念和用法
    - 对于一些已经熟悉**Redux**或其他状态管理库的开发者来说，需要重新学习和适应**MobX**的使用方式

------

综上所述，**Redux**和**MobX**各自都有其优点和缺点，选择哪种状态管理库取决于项目的需求、团队的技术栈和开发者的偏好。

- ==**Redux**强调可预测性和统一性，**适用于大型应用和复杂状态逻辑**==
- ==**MobX**强调简化性和灵活性，**适用于需要响应式状态管理和灵活状态更新的应用**==

### 二、Mobx结合React使用

**Mob**在**React**中使用需要引入另外一个库：`mobx-react` 

`mobx-react` 是 **MobX** 提供的用于在 **React** 应用中集成 **MobX** 的官方库，它提供了一些便捷的 **API**，用于在 **React** 组件中使用 **MobX** 进行状态管理

以下是 `mobx-react` 的一些主要使用方式：

1. `observer` 函数

   - `mobx-react` 提供了 `observer` 函数，==可以将 **React** 组件包裹成观察者==，==使其能够响应 **MobX** 可观察状态的变化并自动重新渲染==

     <!--observable将状态转换为可观察的对象，observer将React组件转换成观察者，一个被观察者，一个观察者-->

   - 使用 `observer` 函数，可以将你的组件声明为一个可观察组件，使其能够享受到 **MobX** 的自动更新 **UI** 的能力

2. `useObserver` 钩子

   - `mobx-react` 还提供了 `useObserver` 钩子，==可以在函数式组件中使用==
   - 通过在函数式组件中使用 `useObserver` 钩子，可以让组件在 **MobX** 可观察状态变化时自动重新渲染，从而实现响应式 **UI**

3. `inject` 函数：

   - `mobx-react` 的 `inject` 函数可以用于将 **MobX** 的==可观察状态注入到组件中==，使组件能够通过 `props` 访问到这些状态

     <!--类似于React-Redux中的mapStateToProps-->

   - 通过 `inject` 函数，你可以在组件中获取到你需要的 **MobX** 可观察状态，并在组件中使用它们

4. `mobxProvider` 组件：

   - `mobx-react` 提供了 `mobxProvider` 组件，可以==用于在应用的根组件中提供 **MobX** 的 `store`==，从而使整个应用都能访问到相同的 **MobX** 状态

     <!--类似于React-Redux中的Provider-->

   - 通过在应用的根组件中使用 `mobxProvider`，你可以在整个应用中共享 **MobX** 的状态，方便进行状态管理

5. `useLocalObservable` 钩子：

   - `mobx-react` 还提供了 `useLocalObservable` 钩子，==用于在函数式组件中创建局部的 **MobX** 可观察状态==

#### 2.1、Mobx在React中的具体使用

1. ==使用 `observer` 函数将组件包裹成观察者==，使其能够响应 **MobX** 可观察状态的变化并自动重新渲染

   ```jsx
   import React from "react";
   import { observer } from "mobx-react";
   import { observable } from "mobx";
   
   // 定义一个可观察状态
   const counterState = observable({
     count: 0
   });
   
   
   class Counter extends React.Component {
     render() {
       return (
         <div>
           <p>Count: {counterState.count}</p>
           <button onClick={() => counterState.count++}>Increment</button>
         </div>
       );
     }
   }
   
   // 使用 observer 函数将组件包裹成观察者
   export default observer(Counter);
   ```

   或者使用 `useObserver` 钩子

   ```jsx
   import React from "react";
   import { useObserver } from "mobx-react";
   import { observable } from "mobx";
   
   // 定义一个可观察状态
   const counterState = observable({
     count: 0
   });
   
   // 在函数式组件中使用 useObserver 钩子
   const Counter = () => {
     return useObserver(() => (
       <div>
         <p>Count: {counterState.count}</p>
         <button onClick={() => counterState.count++}>Increment</button>
       </div>
     ));
   };
   
   export default Counter;
   ```

   - `observer` 是一个**==高阶组件==** **(HOC)**
     - 它接收一个 **React** 组件作为参数，并返回一个包裹后的新组件，这个包裹后的组件会在 **MobX** 可观察状态变化时自动重新渲染
     - `observer` 可以用于类组件和函数式组件
   - `useObserver` 是一个 ==**React** 钩子== (**Hook**)
     - 它可以在函数式组件中使用，使组件能够观察 **MobX** 可观察状态的变化并自动重新渲染

2. 使用 `inject` 函数将 **MobX** 的可观察状态注入到组件中，使组件能够通过 `props` 访问到这些状态

   ```jsx
   import React from "react";
   import { inject, observer } from "mobx-react";
   
   // 定义一个 MobX store
   const counterStore = observable({
     count: 0
   });
   
   // 使用 inject 函数将 MobX store 注入到组件中
   const Counter = inject("counterStore")(
     observer(({ counterStore }) => {
       return (
         <div>
           <p>Count: {counterStore.count}</p>
           <button onClick={() => counterStore.count++}>Increment</button>
         </div>
       );
     })
   );
   
   export default Counter;
   ```

3. 使用 `mobxProvider` 组件在应用的根组件中提供 MobX 的 `store`，从而使整个应用都能访问到相同的 MobX 状态

   ```jsx
   import React from "react";
   import { Provider } from "mobx-react";
   import Counter from "./Counter";
   
   // 定义一个 MobX store
   const counterStore = observable({
     count: 0
   });
   
   // 在应用的根组件中使用 mobxProvider 提供 MobX store
   const App = () => {
     return (
       <Provider counterStore={counterStore}>
         <Counter />
       </Provider>
     );
   };
   
   export default App;
   ```

通过以上例子，我们可以看到 `mobx-react` 提供的一些主要使用方式，如 `observer` 函数、`useObserver` 钩子、`inject` 函数和 `mobxProvider` 组件，用于在 **React** 组件中集成 **MobX** 进行状态管理

这些方式可以让我们的 **React** 组件能够无缝地响应 **MobX** 的可观察状态的变化并进行自动重新渲染，从而简化了在 **React** 应用中使用 **MobX** 进行状态管理的过程

`mobx-react` 也提供了其他一些高级功能，如

-  `useLocalStore` 钩子用于==创建组件内部的局部状态==
- `useAsObservableSource` 钩子用于将组件内部的状态暴露为可观察状态

#### 2.2、Mobx修改状态

**MobX** 提供了多种方式来**==修改状态==**

1. **==直接赋值==**

   可以通过直接对 **MobX** 可观察状态的属性进行赋值来修改状态，这会自动触发 **MobX** 的观察机制，使得依赖该属性的组件能够自动更新

   ```jsx
   import { observable } from "mobx";
   
   const counterStore = observable({
     count: 0,
   });
   
   counterStore.count = 1; // 直接赋值修改状态
   ```

2. ==**使用 MobX 提供的辅助函数**==

   **MobX** 提供了一些辅助函数，例如 `runInAction`、`action`、`transaction` 等，用于在特定的上下文中执行修改状态的操作，==并确保在**同一事务**中**批量处理**状态的变更==

   ```jsx
   import { observable, action } from "mobx";
   
   class CounterStore {
     @observable count = 0;
   
     @action
     increment() {
       this.count += 1; // 使用 @action 注解定义的方法进行状态修改
     }
   
     @action
     decrement() {
       this.count -= 1;
     }
   }
   
   const counterStore = new CounterStore();
   
   counterStore.increment(); // 使用 @action 注解定义的方法修改状态
   ```

3. ==使用 **MobX** 中的异步 **action**==

   在涉及异步操作的情况下，可以使用 **MobX** 中的异步 **action**，例如 `flow`、`asyncAction` 等，来修改状态，并确保在异步操作完成后正确处理状态的变更

   ```jsx
   import { observable, flow } from "mobx";
   
   class UserStore {
     @observable user = null;
   
     @action
     fetchUser = flow(function*() {
       try {
         const response = yield fetch("/api/user");
         const data = yield response.json();
         this.user = data; // 使用异步 action 修改状态
       } catch (error) {
         console.error("Failed to fetch user", error);
       }
     });
   }
   
   const userStore = new UserStore();
   
   userStore.fetchUser(); // 使用异步 action 修改状态
   ```

需要注意的是，

- 直接修改 **MobX** 可观察状态的属性时，**MobX** 会直接自动触发观察机制并进行 **UI** 更新
- 使用 **MobX** 提供的辅助函数或异步 **action** 时，**MobX** 会==以批量更新的方式处理状态变更==，以提高性能

因此，在修改状态时，建议使用 **MobX** 提供的辅助函数或异步 **action**，以确保状态变更的正确处理和性能优化

