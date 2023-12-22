## 不可变数据（一）Immer.js

### 一、Immer.js是什么

**Immer.js** 是一个由 **MobX** 的作者创建的==不可变数据==（**Immutable**）库。它的核心实现是利用 **ES6** 的 **Proxy**，以最小的成本实现了 **JavaScript** 的==不可变数据结构==。

**Immer.js** 可以在需要使用不可变数据结构的任何上下文中使用，例如与 **React state**、**React** 或 **Redux reducers** 或者 **configuration management** 结合使用。

### 二、不可变数据是什么

在编程中，数据可以分为==可变==（**Mutable**）和==不可变==（**Immutable**）两种类型：

1. **可变数据（Mutable Data）：**当该数据类型的对应变量的值发生了改变，它对应的**==内存地址不发生改变==**

   - 数据被创建之后，可以改变数据的内容，而不需要再新建一个

     - 例如，**JavaScript**中的对象和数组都是可变数据，我们可以直接修改对象的属性或数组的元素，而不需要再创建一个新的对象或数组

       ```js
       const objA = { name: 123 }
       const objb = objA
       objA.name = 456
       console.log(objb.name) // 456
       ```

     <!-- JS中声明一个变量为对象或者数组时，这个变量保存的其实只是内存地址，通过这个内存地址去修改对象或者数组的数据内容，虽然不需要新建就可以直接修改数据内容很方便，但是也会有数据不一致的风险-->

2. **不可变数据（Immutable Data）：**当该数据类型的对应变量的值发生了改变，它对应的**==内存地址也会发生改变==**

   - 在 **JavaScript** 中，**string** 和 **number** 类型数据类似于不可变数据，一个字符串或数字一旦被创建，它们的值就不能改变，如果试图改变它们的值，**JavaScript** 实际上会创建一个新的字符串或数字，并将新的值赋给新的字符串或数字

     ```js
     let str = 'hello'
     str = 'world'
     ```

     <!--JS中声明一个变量为string或number时，这个变量保存的就是string或number的值，所以严格意义上讲string和number也不是不可变数据-->

   - 不可变数据类型通常更容易推断和理解，它们在程序执行期间不会发生变化，它们在函数调用、并发编程等方面具有一些优势
     - 例如在**函数式编程**中，对已初始化的“**变量**”是不可以更改的，每次更改都要创建一个**新的“变量”**，==新的数据进行有副作用的操作都不会影响之前的数据==

> 虽然 **JavaScript** 本身没有提供不可变数据结构，但我们可以使用第三方库，如 **Immer.js** 或 **Immutable.js**，来实现不可变数据
>
> 这些库提供了一种方式，使得我们可以像操作普通 **JavaScript** 对象一样操作不可变数据，同时==保证数据的不可变性== <!--什么不可变性，不好理解，其实就是新建一个对象-->

### 三、为什么不是深拷贝

从不可变数据的特征上看，就是修改了数据内容之后会返回一个新的对象，那看起来好像和**JS**中深拷贝是一样的，那又何必再用三方库创建不可变数据，增加心智负担，直接使用深拷贝就好了

其实不然，假设我们有一个嵌套多层的**JS**对象，我们只会对其中某一层的嵌套对象进行修改，若是使用深拷贝那么所有的嵌套对象都会新建，这就可能造成了不必要的更新；

而将这个嵌套多层的**JS**对象转换成不可变数据之后，只会对我们修改的那个对象进行新建复制，数据树的未更改部分保持原状，内存地址不会发生改变

### 四、Immer.js的使用方式

**基本概念**：

- **currentState**：被操作对象的最初状态
- **draftState**：根据 `currentState` 生成的草稿，是 `currentState` 的代理，对 `draftState` 所有的修改都被记录并用于生成 `nextState`，在此过程中`currentState` 不受影响
- **nextState**：根据 `draftState` 生成的最终状态
- **produce**：用于生成 `nextState` 或者 `producer` 的函数，这是 **Immer.js** 的核心函数
- **Producer**：通过 `produce` 生成，用于生产 `nextState`，每次执行相同的操作，这是一个可以重复使用的函数，它可以接受一个 `currentState` 并返回一个 `nextState`
- **recipe**：用于操作 `draftState` 的函数，这是在 `produce` 函数中提供的函数，它描述了如何更新你的数据

使用示例：

```javascript
import produce from "immer";

// currentState
const baseState = [
    {
        todo: "Learn typescript",
        done: true
    },
    {
        todo: "Try immer",
        done: false
    }
];

// recipe
const recipe = draftState => {
    draftState.push({todo: "Tweet about it"});
    draftState[1].done = true;
};

// Producer
const producer = produce(recipe);

// nextState
const nextState = producer(baseState);

// 或者
const nextState = produce(baseState, recipe);
```

在**React**中我们可以通过**hooks**的形式使用**Immer.js**，其提供了一个**React Hook** 库**use-Immer**

下面是使用案例：

```javascript
import React from 'react';
import useImmer from 'use-immer';

function MyComponent() {
    // 使用 useImmer 定义状态
    const [state, setState] = useImmer({
        todo: "Learn React",
        done: false
    });

    // 更新状态
    const toggleDone = () => {
        setState(draft => {
            draft.done = !draft.done;
        });
    };

    return (
        <div>
            <p>{state.todo} is {state.done ? "done" : "not done"}</p>
            <button onClick={toggleDone}>Toggle Done</button>
        </div>
    );
}
```

在这个例子中，我们使用 `useImmer` 定义了一个状态 `state`，并使用 `setState` 函数来更新状态。`setState` 函数接受一个函数作为参数，这个函数接受当前的 `draftState` 作为参数，并对 `draftState` 进行修改。这些修改会被用来生成新的状态.





