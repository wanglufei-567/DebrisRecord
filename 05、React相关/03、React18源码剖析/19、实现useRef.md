## React18源码解析（19）实现useRef

### 一、前言

`useRef` 是 React Hooks 中的一个钩子函数，它用于在函数组件中创建==一个可以存储任意数据的引用==，而这个引用的值==在组件重新渲染时可以保持不变==。`useRef` 的返回值是一个包含一个 `current` 属性的对象，这个属性指向一个可以存储任意数据的变量。

`useRef` 可以用于多种场景：

1. **访问 DOM 元素或组件实例**

   在函数组件中，无法像 class 组件中那样使用 `this` 来访问组件实例或 DOM 元素。但是，可以使用 `useRef` 来创建一个引用，然后将这个引用赋值给 JSX 元素的 `ref` 属性，即可在组件中获取到这个元素的引用。比如：

   ```js
   import { useRef, useEffect } from 'react';
   
   function MyComponent() {
     const inputRef = useRef(null);
   
     useEffect(() => {
       inputRef.current.focus();
     }, []);
   
     return (
       <div>
         <input type="text" ref={inputRef} />
       </div>
     );
   }
   ```

   在这个例子中，通过 `useRef` 创建一个引用，然后将这个引用赋值给 `input` 元素的 `ref` 属性，即可在组件中获取到这个元素的引用。在 `useEffect` 钩子中，调用 `inputRef.current.focus()` 来设置焦点到这个 `input` 元素上。

2. **存储一个不变的值，这个值在组件的多次渲染之间共享**

   由于函数组件在每次渲染时都会重新执行，因此无法使用变量来存储在组件渲染期间需要共享的数据。而 `useRef` 创建的引用可以在多次渲染之间共享数据。比如：

   ```js
   import { useRef } from 'react';
   
   function MyComponent() {
     const countRef = useRef(0);
   
     function handleClick() {
       countRef.current++;
       console.log(`Button clicked ${countRef.current} times`);
     }
   
     return (
       <div>
         <button onClick={handleClick}>Click me</button>
       </div>
     );
   }
   ```

   在这个例子中，通过 `useRef` 创建一个引用，它的初始值是 0。在每次渲染时，`handleClick` 函数都会执行，将 `countRef.current` 的值加 1，并输出到控制台上。

需要注意的是，由于 `useRef` 创建的==引用不会触发组件的重新渲染，因此不能用它来更新组件的状态==。如果需要更新组件的状态，可以使用 `useState` 或 `useReducer` 来存储数据。同时，由于 `useRef` 创建的引用是在组件渲染期间创建的，因此它不应该被用于保存需要在组件之间共享的全局状态。如果需要共享状态，可以考虑使用其他的状态.

### 二、实现useRef

首先改造下`main.jsx`

```jsx
import * as React from 'react';
import { createRoot } from 'react-dom/client';

function FunctionComponent() {
  const [numbers, setNumbers] = React.useState(
    new Array(10).fill('A')
  );
  const divRef = React.useRef();
  React.useEffect(() => {
    console.log('divRef', divRef);
    setTimeout(() => {
      divRef.current.click();
    }, 10);
  }, []);
  return (
    <div
      ref={divRef}
      onClick={() => {
        setNumbers(numbers => numbers.map(item => item + 'C'));
      }}
    >
      {numbers.map((number, index) => (
        <span key={index}>{number}</span>
      ))}
    </div>
  );
}
let element = <FunctionComponent />;
const root = createRoot(document.getElementById('root'));
root.render(element);

```

给派发器`ReactCurrentDispatcher`上添加`useRef`

```js
// src/react/index.js
export {
  //如果我们有一些希望在不同的内部模块之间共享的变量可以保存在此变量上
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  useState,
  useReducer,
  useEffect,
  useLayoutEffect,
  useRef,
} from './src/React';

```

```js
// src/react/src/React.js
import { useReducer, useState, useEffect,useLayoutEffect, useRef } from './ReactHooks';
import ReactSharedInternals from './ReactSharedInternals';
export {
  useState,
  useReducer,
  useEffect,
  useLayoutEffect,
  useRef,
  ReactSharedInternals as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
}
```

```js
// src/react/src/ReactHooks.js
export function useRef(initialValue) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialValue);
}
```

------

在`src/react-reconciler/src/ReactFiberHooks.js`中实现挂载时的`useRef: mountRef` 和更新时的`useRef: updateRef`

```js
//src/react-reconciler/src/ReactFiberHooks.js

function mountRef(initialValue) {
  const hook = mountWorkInProgressHook();
  const ref = {
    current: initialValue
  }
  // useRef的hook对象上的memoizedState是ref对象
  hook.memoizedState = ref;
  return ref;
}

function updateRef() {
  const hook = updateWorkInProgressHook();
  return hook.memoizedState;
}
```

很简单，就是在`useRef`的`hook`对象上的`memoizedState`挂上一个 `current` 属性的对象，函数组件每次执行时，新老`useRef`的`hook`对象上的`memoizedState`时不变的直接复用的

**存储一个不变的值，这个值在组件的多次渲染之间共享**已经实现完成，那么**访问 DOM 元素或组件实例**是如何完成的呢？

------

首先在`beginwork`中的`createChildReconciler`时，从VDom上取到`ref`对象并挂到`fiber`节点上

```diff
// src/react-reconciler/src/ReactChildFiber.js
function createChildReconciler(shouldTrackSideEffects) {
  function reconcileSingleElement(
    returnFiber,
    currentFirstChild,
    element
  ) {
    const key = element.key;
    let child = currentFirstChild;

    /*
      若更新时新的子虚拟DOM只有一个节点，且老的父fiber存在子fiber
      则需要从第一个子fiber开始，遍历老的父fiber的所有的子fiber
      判断是否有老的子fiber可以直接复用
    */
    while (child !== null) {
      //判断此老fiber对应的key和新的虚拟DOM对象的key是否一样 null===null
      if (child.key === key) {
        //判断老fiber对应的类型和新虚拟DOM元素对应的类型是否相同
        if (child.type === element.type) {
          // 如果key一样，类型也一样，则认为此节点可以复用,把其余老fiber删除
          deleteRemainingChildren(returnFiber, child.sibling);
          //直接复用老fiber
          const existing = useFiber(child, element.props);
+          existing.ref = element.ref;
          existing.return = returnFiber;
          return existing;
        } else {
          //如果找到key一样老fiber但是类型不一样，不能复用此老fiber,把老fiber全部删除
          deleteRemainingChildren(returnFiber, child);
        }
      } else {
        // key不同则直接删除当前老fiber
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

    /*
      初次挂载时，老fiber节点currentFirstChild肯定是没有的
      所以可以直接根据虚拟DOM创建新的Fiber节点
    */
    const created = createFiberFromElement(element);
+    created.ref = element.ref;
    created.return = returnFiber;
    return created;
  }
  
    /**
   * @description 根据虚拟DOM创建fiber（新的子节点有多个，是个数组的情况）
   * @param {*} returnFiber 新的父Fiber
   * @param {*} newChild 新的子虚拟DOM
   */
  function createChild(returnFiber, newChild) {
    if (
      (typeof newChild === 'string' && newChild !== '') ||
      typeof newChild === 'number'
    ) {
      const created = createFiberFromText(`${newChild}`);
      created.return = returnFiber;
      return created;
    }
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(newChild);
+          created.ref = newChild.ref;
          created.return = returnFiber;
          return created;
        }
        default:
          break;
      }
    }
    return null;
  }
  
  /**
   * @description 复用老fiber或者创建新的fiber
   * @param returnFiber 新的父fiber
   * @param current 老的子fiber
   * @param element 新的子虚拟DOM
   */
  function updateElement(returnFiber, current, element) {
    const elementType = element.type;
    if (current !== null) {
      //判断是否类型一样，则表示key和type都一样，可以复用老的fiber和真实DOM
      if (current.type === elementType) {
        const existing = useFiber(current, element.props);
+        existing.ref = element.ref;
        existing.return = returnFiber;
        return existing;
      }
    }
    const created = createFiberFromElement(element);
+    created.ref = element.ref;
    created.return = returnFiber;
    return created;
  }
}
```

------

然后在`completeWork`中给`fiber`节点上添加对应的`Ref` `flag`

```diff
// src/react-reconciler/src/ReactFiberCompleteWork.js

+function markRef(workInProgress) {
+  workInProgress.flags |= Ref;
+}

export function completeWork(current, workInProgress) {
  // indent.number -= 2;
  // logger(' '.repeat(indent.number) + 'completeWork', workInProgress);

  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    // 根fiber
    case HostRoot:
      //向上冒泡属性
      bubbleProperties(workInProgress);
      break;
    // 原生节点的fiber
    case HostComponent:
      const { type } = workInProgress;

      if (current !== null && workInProgress.stateNode !== null) {
        //如果老fiber存在，并且老fiber上有真实DOM节点，要走节点更新的逻辑
        updateHostComponent(current, workInProgress, type, newProps);
+        // 如果新fiber上的ref和老fiber上的ref不相等，则标记ref
+        if (current.ref !== workInProgress.ref !== null) {
+          markRef(workInProgress);
+       }
      } else {
        //创建或者说挂载新节点的情况

        //创建真实的DOM节点
        const instance = createInstance(
          type,
          newProps,
          workInProgress
        );
        //把自己所有的儿子都添加到自己的身上
        appendAllChildren(instance, workInProgress);
        // 将真实DOM挂到当前fiber的stateNode上
        workInProgress.stateNode = instance;
        // 完成真实DOM的构建
        finalizeInitialChildren(instance, type, newProps);
+        // 挂载新新节点时，若fiber上有ref，则标记ref
+        if (workInProgress.ref !== null) {
+          markRef(workInProgress);
+        }
      }
      //向上冒泡属性
      bubbleProperties(workInProgress);
      break;
    // 函数组件的fiber
    case FunctionComponent:
      bubbleProperties(workInProgress);
      break;
    // 文本节点的fiber
    case HostText:
      //如果完成的fiber是文本节点，那就创建真实的文本节点
      const newText = newProps;
      //创建真实的DOM节点并传入stateNode
      workInProgress.stateNode = createTextInstance(newText);
      //向上冒泡属性
      bubbleProperties(workInProgress);
      break;
  }
}
```

------

然后在`commitWork`中给`ref`对象添加真实DOM节点

```diff
//src/react-reconciler/src/ReactFiberCommitWork.js
export function commitMutationEffectsOnFiber(finishedWork, root) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case FunctionComponent:
    case HostRoot:
    case HostText: {
      //先遍历它们的子节点，处理它们的子节点上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      //再处理自己身上的副作用
      commitReconciliationEffects(finishedWork);
      break;
    }
    case HostComponent: {
      //先遍历它们的子节点，处理它们的子节点上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      //再处理自己身上的副作用
      commitReconciliationEffects(finishedWork);
+      // 提交附加的ref，给ref绑定真实DOM节点
+      if (flags & Ref) {
+        commitAttachRef(finishedWork);
+      }
      //处理DOM更新
      if (flags & Update) {
        //获取真实DOM
        const instance = finishedWork.stateNode;
        //更新真实DOM
        if (instance !== null) {
          const newProps = finishedWork.memoizedProps;
          const oldProps =
            current !== null ? current.memoizedProps : newProps;

          const type = finishedWork.type;
          const updatePayload = finishedWork.updateQueue;
          finishedWork.updateQueue = null;

          if (updatePayload) {
            commitUpdate(
              instance, // 真实DOM
              updatePayload, // 更新内容
              type, // 真实DOM type
              oldProps, // 老props
              newProps, // 新Props
              finishedWork // 当前的fiber节点
            );
          }
        }
      }
      break;
    }
    default:
      break;
  }
}

+function commitAttachRef(finishedWork) {
+  const ref = finishedWork.ref;
+  if (ref !== null) {
+    const instance = finishedWork.stateNode;
+    if (typeof ref === 'function') {
+      ref(instance);
+    } else {
+      ref.current = instance;
+    }
+  }
+}

```

------

看下实现效果

![image-20230306232736124](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230306232736124.png)