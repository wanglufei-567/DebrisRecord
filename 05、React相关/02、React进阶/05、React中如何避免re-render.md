## React中如何避免re-render

### 一、什么是re-render?

当我们在讨论**React**的性能时，有两个主要的阶段需要关注

1. **initial render** ：组件第一次渲染到屏幕上时
2. **re-render**：已经挂载的组件的重新渲染

当组件需要更新数据时便会**re-render**，一般发生在用户交互操作或者异步请求数据之后

按照组件本次 **re-render** 是否是必须的，我们可以将 **re-render** 分为**必须 re-render** 和**非必须 re-render:**

- **必须 re-render**：由于组件==依赖的状态发生了变化==，必须重新渲染以保证 UI 正确
- **非必须 re-render**：==其他组件重新渲染引起==的连带渲染，即使不重新渲染也不会影响 UI 的一致

非必须的 **re-render** 本身不是一个问题，**React render** 的过程是非常快的，依赖的状态没有发生变化的话，在 **React commit** 阶段也不会有额外的 **DOM** 操作

但是，如果 **re-render** 发生的太频繁，或者 **re-render** 过程中有耗时的计算逻辑，或者在非常复杂的应用中，**re-render** 涉及了大量的组件，这时就会有严重的性能问题

### 二、什么时候React组件会重新渲染？

导致**React**组件重新渲染的原因有下面这几种：

- 组件状态更新
- 父组件**re-render**
- **Context** 变化
- **hooks** 变化

#### 2.1、组件状态更新

当组件的状态发生更新时，会触发该组件的 **re-render**，包括类组件的状态、函数组件中的 **hooks** 状态和自定义 **hooks** 依赖的状态 

状态更新通常发生在 **useEffect** 或者某个回调函数中

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405031418258.png)

#### 2.2、父组件 re-render

父组件的 **re-render** 会导致其所有子组件 **re-render** ，但是子组件的 **re-render** 却不会导致父组件的 **re-render**

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405031420181.png)

#### 2.3、Context变化

当**Context**的**value**发生变化时，所有使用到这个**context**的组件都会**re-render**，即使组件中并没有使用到变化的那一部分数据，而且这种**re-render**不能被**React.memo**机制阻断掉

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405031423234.png)

#### 2.4、Hooks变化

自定义的**Hooks**中的状态发生变化，或者使用到的**Context**的**value**发生变化，都会导致使用这个**Hooks**的组件**re-render**

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405031425860.png)

#### 2.5、一个误解：props 变更触发了组件 re-render

**props** 变更并不是导致 **re-render** 的原因，而是父组件的 **re-render** 触发了子组件的 **re-render**，不管父组件传给子组件的 **props** 有没有变化

仅当子组件是 **PureComponent** 或者用 **React.memo** 包裹时，才会根据 **props** 是否变化来决定子组件是否 **re-render**

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405031427564.png)

### 三、如何避免re-render

首先，**re-render** 在大部分情况下是不会有性能问题的，作为开发者，我们可能会高估 **re-render** 的成本，如果你不知道是否需要优化，那就是不需要

这里仅仅讨论有哪些可以优化的方法，方便在需要的时候能够参考

#### 3.1、不要在render方法中创建子组件

在**render**方法中创建子组件会导致每次**re-render**时都重新创建子组件，从而导致下面这些bug

- **re-render**期间可能出现内容“闪烁”
- 每次 **re-render** 时子组件的状态都会重置
- 如果组件处于 **focused** 状态，**re-render** 之后 **focused** 状态也会丢失

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405031437731.png)

#### 3.2、将state向子组件中迁移，缩小 re-render 范围

如下案例所示，点击按钮显示 **Modal** 时，**Component** 的 **re-render** 会导致 **VerySlowComponent** 的 **re-render**

可以将 **Modal** 显示的逻辑抽到一个单独的组件中，这样点击按钮显示 **Modal** 时就只有 **ButtonWithModal** 会 **re-render**

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405031439158.png)

#### 3.3、将 components 作为 props 传递

如下优案例所示，滚动时 **Component** 的 **re-render** 会触发 **SlowComponent** 的 **re-render**

可以将 **components** 作为 **props** 往下传，这样滚动时只会触发 **ComponentWithScroll** 的 **re-render**

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405031442509.png)

#### 3.4、使用 memo、useMemo 、useCallback 

将子组件用**memo**进行包裹

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405031446871.png)

使用**useMemo**缓存子组件的**props**

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405031447149.png)

### 四、如何优化 Context 导致的 re-render

把 **Context** 单独拿出来讨论，是因为 **Context** 经常被用来做全局的状态管理

在一个复杂的应用中，如果使用不合理的话，对 **Context** 中一个只使用在某个小组件内的字段的更改，都可能导致整个应用的重新渲染

#### 4.1、结合 useMemo 使用

如下案例，如果有父组件会触发 **Component** 重新渲染的话，可以用 **useMemo** 来保证传给 **Context.Provider** 的值在 **state** 没变时也不会变

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405031452770.png)

#### 4.2、将数据拆得更细

将数据拆得更细，这样在更新某一个细小的数据时，只有使用了这个数据的组件会 **re-render**

更新数据的 **setState** 也可以单独拆成一个，这样在只使用了 **setState** 的组件里，不会因为 **Context** 状态更新而 **re-render**

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405031453367.png)

#### 4.3、使用 Context selector

**selector** 的使用方式常见的有两种

- **高阶组件**：其内部配合 **memo**、**PureCompoent** 或 **shouldComponentUpdate** 来控制组件是否 **re-render**
  - 比如 **react-redux** 的 [connect(mapStateToProps?, mapDispatchToProps?)](https://link.juejin.cn?target=https%3A%2F%2Freact-redux.js.org%2Fapi%2Fconnect)
- **useSelector hook**：**hook** 的实现方式一般传给 **Context.Provider** 的 **value** 是固定的 **store**，**hook** 内部实现了对 **store** 的监听，然后根据 **selector** 的结果决定是否需要重新渲染组件
  - 比如 [react-redux 的 useSelector](https://link.juejin.cn?target=https%3A%2F%2Freact-redux.js.org%2Fapi%2Fhooks%23useselector) 和 [use-context-selector](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fdai-shi%2Fuse-context-selector)，



