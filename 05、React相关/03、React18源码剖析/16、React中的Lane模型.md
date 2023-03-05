## React18源码解析（十六）React中的Lane模型

### 一、前言

#### 1.1、Lane模型

**==React Lane模型==**是 React 内部使用的一种**==调度器优化机制==**，用于在不同的优先级之间分配任务。

<!--屁话，难以理解，简述就是React用Lane模型来表示任务的优先级，每个lane(车道)都对应一种优先级，一共有31条优先级，数字越小优先级越高，这样React便可以根据不同任务的优先级进行调度更新，优先响应用户操作等任务-->

在 Lane 模型中，==每个 Lane 对应一种优先级，任务会被分配到不同的 Lane 中进行执行==。React 使用 Lane 模型来实现调度器的高效性和灵活性，从而**==提高应用程序的性能和响应能力==**。

Lane 模型的设计原理是基于两个重要的概念：**==优先级==**和**==双缓存机制==**

1. **==优先级==**：

    React 将任务**==分为不同的优先级==**，例如事件处理、动画、布局等等，不同任务之间存在优先级高低关系，例如布局优先级高于动画优先级，因为布局会影响元素的位置和尺寸，而动画只是影响元素的外观和显示效果。

   为了更好地管理这些优先级关系，React 使用了 Lane 来划分不同的优先级，并在 Lane 之间进行任务分配和调度

2. **==双缓存机制==**：

    React Lane 的实现基于一个双缓存机制，其中包括**==当前 Lane==** 和**==挂起 Lane==**。当前 Lane 是**==正在执行的任务的优先级==**，而挂起 Lane 则是**==即将执行的任务的优先级==**

   每当一个任务被加入调度器中时，调度器会将任务的优先级与当前 Lane 进行比较，==如果任务的优先级高于或等于当前 Lane，则直接将任务加入当前 Lane 中执行==；否则，调度器会==将任务加入挂起 Lane 中，等待下一次 Lane 切换时执行==。

   当当前 Lane 中的任务执行完毕后，调度器会检查挂起 Lane 中是否有任务需要执行，如果有，则将挂起 Lane 设为当前 Lane，继续执行任务，否则继续等待任务加入。

React Lane模型 的优点在于，它可以根据任务的优先级**==动态地调整 Lane 的划分和分配==**，从而实现**==更加高效和灵活的任务调度==**。此外，React Lane 还支持**==任务取消==**、**==任务优先级调整==**等操作，可以**==更好地管理和控制任务的执行顺序和优先级==**。

#### 1.2、Lane数量

**React Lane模型**一共有31条Lane，数字越小优先级越高，某些Lane的优先级相同

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/lanes_1645074174970.jfif" alt="img" style="zoom:50%;" />

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/che_dao_1645080741671.jpg)

**16种优先级**

```js
//一共有16种优先级
//同步优先级
const SyncLanePriority = 15;
const SyncBatchedLanePriority = 14;
//离散事件优先级
const InputDiscreteHydrationLanePriority = 13;
const InputDiscreteLanePriority = 12;
//连续事件优先级
const InputContinuousHydrationLanePriority = 11;
const InputContinuousLanePriority = 10;
//默认优先级
const DefaultHydrationLanePriority = 9;
const DefaultLanePriority = 8;
//渐变优先级
const TransitionHydrationPriority = 7;
const TransitionPriority = 6;
const RetryLanePriority = 5;
const SelectiveHydrationLanePriority = 4;
//空闲优先级
const IdleHydrationLanePriority = 3;
const IdleLanePriority = 2;
//离屏优先级
const OffscreenLanePriority = 1;
//未设置优先级
const NoLanePriority = 0;
```

**31条车道**

```js
/**
 * 一共有31条车道
 */
const TotalLanes = 31;
//没有车道，所有位都为0
const NoLanes = 0b0000000000000000000000000000000;
const NoLane = 0b0000000000000000000000000000000;
//同步车道，优先级最高
const SyncLane = 0b0000000000000000000000000000001;
const SyncBatchedLane = 0b0000000000000000000000000000010;
//离散用户交互车道 click
const InputDiscreteHydrationLane = 0b0000000000000000000000000000100;
const InputDiscreteLanes = 0b0000000000000000000000000011000;
//连续交互车道 mouseMove
const InputContinuousHydrationLane = 0b0000000000000000000000000100000;
const InputContinuousLanes = 0b0000000000000000000000011000000;
//默认车道
const DefaultHydrationLane = 0b0000000000000000000000100000000;
const DefaultLanes = 0b0000000000000000000111000000000;
//渐变车道
const TransitionHydrationLane = 0b0000000000000000001000000000000;
const TransitionLanes = 0b0000000001111111110000000000000;
//重试06、实现更新队列车道
const RetryLanes = 0b0000011110000000000000000000000;
const SomeRetryLane = 0b0000010000000000000000000000000;
//选择性水合车道
const SelectiveHydrationLane = 0b0000100000000000000000000000000;
//非空闲车道
const NonIdleLanes = 0b0000111111111111111111111111111;
const IdleHydrationLane = 0b0001000000000000000000000000000;
//空闲车道
const IdleLanes = 0b0110000000000000000000000000000;
//离屏车道
const OffscreenLane = 0b1000000000000000000000000000000;
```

#### 1.3、Lane模型与Scheduler调度器

**==React Lane模型==**和 **==Scheduler调度器==**都是 React 中用于**==管理和调度任务==**的核心机制，它们之间密切相关且相互依存。

**React Lane模型**中的Lane是一个优先级级别，每个 Lane 都对应着一组任务，这些任务的优先级都相同 <!--16种优先级，31个Lane-->，而在 **Scheduler调度器**中，任务的优先级也被划分成多个级别，不同级别的任务被分配到不同的任务队列中 <!--5种优先级-->

在 React 应用中，任务的执行顺序和优先级是由 Scheduler调度器来控制的，而 Scheduler 调度器的任务优先级和任务的执行顺序都与 React Lane 模型中的 Lane 有关。

==Scheduler 调度器会将任务加入到合适的 Lane 中，并根据 Lane 之间的优先级关系和任务的执行情况，动态地调整任务的执行顺序和时间，以确保每个 Lane 中的任务能够按照正确的优先级被执行。== <!--最小堆的技术，优先执行高优任务-->

因此，React Lane 模型和 Scheduler 调度器都是为了提高 React 应用的==性能和响应速度==而设计的，它们的共同目标是==将任务按照正确的优先级和时间分配到合适的执行单元中==，并在执行过程中进行必要的==调整和切换==，以确保应用能够快速响应用户操作，提供良好的用户体验。

#### 1.4、 ReactUpdateQueue

之前在 ***06、实现更新队列*** 中实现了一个简单的更新队列，现在对其进行改造，实现一个带优先级的更新队列

<!--后面实现Lane模型时可以直接复用-->

<!--其实这一块就是1.1、Lane模型中设计原理的双缓存机制，Lane可以分为 当前Lane和挂起Lane。当前 Lane 是正在执行的任务的优先级，而挂起 Lane 则是即将执行的任务的优先级，一个Lane的优先级低于当前Lane时就会被挂起，等待下一次Lane切换时执行-->

`ReactFiberLane.js`

```js
const NoLanes = 0b00;
const NoLane = 0b00;
const SyncLane = 0b01;
const SyncBatchedLane = 0b10;

/**
 * 判断subset是不是set的子集
 * @param {*} set 
 * @param {*} subset 
 * @returns 
 */
function isSubsetOfLanes(set, subset) {
    return (set & subset) === subset;
}

/**
 * 合并两个车道
 * @param {*} a 
 * @param {*} b 
 * @returns 
 */
function mergeLanes(a, b) {
    return a | b;
}

export default {
    NoLane,
    NoLanes,
    SyncLane,
    SyncBatchedLane,
    isSubsetOfLanes,
    mergeLanes
}
```

这里创建了4个Lane和两个Lane的操作方法

------

`ReactUpdateQueue.js`

初始化更新队列的方法`initializeUpdateQueue`

```js
import { NoLane, NoLanes, isSubsetOfLanes, mergeLanes } from './ReactFiberLane';

function initializeUpdateQueue(fiber) {
  const queue = {
    baseState: fiber.memoizedState,//本次更新前该Fiber节点的state,Update基于该state计算更新后的state
    firstBaseUpdate: null,//本次更新前该Fiber节点已保存的Update链表头
    lastBaseUpdate: null,//本次更新前该Fiber节点已保存的Update链表尾
    shared: {
      //触发更新时，产生的Update会保存在shared.pending中形成单向环状链表
      //当由Update计算state时这个环会被剪开并连接在lastBaseUpdate后面
      pending: null
    }
  }
  fiber.updateQueue = queue;
}
```

更新对象入队的方法`enqueueUpdate`

```js
function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue;
  if (updateQueue === null) {
    return;
  }
  const sharedQueue = updateQueue.shared;
  const pending = sharedQueue.pending;
  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  sharedQueue.pending = update;
}
```

<!--到这里和之前的更新队列一致-->

------

处理更新队列的方法`processUpdateQueue`

```js
/**
 * 处理更新队列
 * @param {*} fiber 
 * @param {*} renderLanes 
 */
function processUpdateQueue(fiber, renderLanes) {
  //获取此fiber上的更新队列
  const queue = fiber.updateQueue;
  //获取第一个更新
  let firstBaseUpdate = queue.firstBaseUpdate;
  let lastBaseUpdate = queue.lastBaseUpdate;
  
  //判断一下是否在等待生效的的更新，如果有，变成base队列
  let pendingQueue = queue.shared.pending;
  //合并新老链表为单链表
  if (pendingQueue !== null) {
    //清空pending
    queue.shared.pending = null;
    //最后一个等待的更新 
    const lastPendingUpdate = pendingQueue;
    //第一个等待的更新 
    const firstPendingUpdate = lastPendingUpdate.next;
    //把环剪断，最后一个不再指向第一个
    lastPendingUpdate.next = null;
    //把等待生效的队列添加到base队列中
    //如果base队列为空
    if (lastBaseUpdate === null) {
      firstBaseUpdate = firstPendingUpdate;
    } else {//否则就把当前的更新队列添加到base队列的尾部
      lastBaseUpdate.next = firstPendingUpdate;
    }
    //尾部也接上
    lastBaseUpdate = lastPendingUpdate;
  }
  
  //开始计算新的状态
  if (firstBaseUpdate !== null) {
    //先获取老的值
    let newState = queue.baseState; //老的基础状态
    let newLanes = NoLanes;
    let newBaseState = null;//新的基础状态
    let newFirstBaseUpdate = null;//第一个跳过的更新
    let newLastBaseUpdate = null;//新的最后一个基本更新
    
    let update = firstBaseUpdate;//指向第一个更新
    do {
      //获取更新车道
      const updateLane = update.lane;
      //如果优先级不够，跳过这个更新，如果这是第一个跳过的更新，
      //上一个状态和更新成为newBaseState和newFirstBaseUpdate
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        const clone = {
          id: update.id,
          lane: updateLane,
          payload: update.payload
        };
        if (newLastBaseUpdate === null) {
          newFirstBaseUpdate = newLastBaseUpdate = clone;// first=last=update1
          newBaseState = newState;
        } else {
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        //更新队列中的剩下的优先级
        newLanes = mergeLanes(newLanes, updateLane);
      } else {
        //如果有足够的优先级 如果有曾经跳过的更新，仍然追加在后面
        if (newLastBaseUpdate !== null) {
          const clone = {
            id: update.id,
            //NoLane是所有的优先级的子集，永远不会被跳过
            lane: NoLane,
            payload: update.payload
          };
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        newState = getStateFromUpdate(update, newState);
      }
      update = update.next;
      if (!update) {
        break;
      }
    } while (true);
    
    // 如果没有跳过的更新的话，将计算得出的状态更新为基础状态
    if (!newLastBaseUpdate) {
      newBaseState = newState;
    }
    // 新的基础状态为老的基础状态或者 在被跳过更新之前的更新对象，计算出来的状态
    queue.baseState = newBaseState;
    queue.firstBaseUpdate = newFirstBaseUpdate;
    queue.lastBaseUpdate = newLastBaseUpdate;
    // 更新队列中的剩下的优先级
    fiber.lanes = newLanes;
    // fiber上的状态，是由优先级足够的更新对象计算出来的
    fiber.memoizedState = newState;
  }
}

function getStateFromUpdate(update, prevState) {
  const payload = update.payload;
  let partialState = payload(prevState);
  return Object.assign({}, prevState, partialState);
}
```

优先级的处理逻辑就在`processUpdateQueue`中

主要做了以下几件事：

- 合并`pending`队列和`base`队列为新的`base`队列

  <!--base队列是用来缓存更新的，pending队列是待生效的更新队列，每次处理更新时都会清空，但是按照优先级处理更新时，有些更新会被挂起，所以就需要一个缓存队列来存放这些被挂起的更新-->

  ```js
  //判断一下是否在等待生效的的更新，如果有，变成base队列
  let pendingQueue = queue.shared.pending;
  //合并新老链表为单链表
  if (pendingQueue !== null) {
    //清空pending
    queue.shared.pending = null;
    //最后一个等待的更新 
    const lastPendingUpdate = pendingQueue;
    //第一个等待的更新 
    const firstPendingUpdate = lastPendingUpdate.next;
    //把环剪断，最后一个不再指向第一个
    lastPendingUpdate.next = null;
    //把等待生效的队列添加到base队列中
    //如果base队列为空
    if (lastBaseUpdate === null) {
      firstBaseUpdate = firstPendingUpdate;
    } else {//否则就把当前的更新队列添加到base队列的尾部
      lastBaseUpdate.next = firstPendingUpdate;
    }
    //尾部也接上
    lastBaseUpdate = lastPendingUpdate;
  }
  ```

  这一步就是将`fiber.updateQueue.shared.pending`上的队列，与`base`队列进行合并<!--初次执行时，base队列就是复制了pending队列，后续有了新的pending队列，则将新的队列接到base队列后面，base队列是一个单项链表-->

- 根据更新对象计算新的`fiber`状态（`fiber.memoizedState`）

  ```js
  do {
    //获取更新车道
    const updateLane = update.lane;
    //如果优先级不够，跳过这个更新，如果这是第一个跳过的更新，
    //上一个状态和更新成为newBaseState和newFirstBaseUpdate
    if (!isSubsetOfLanes(renderLanes, updateLane)) {
      const clone = {
        id: update.id,
        lane: updateLane,
        payload: update.payload
      };
      if (newLastBaseUpdate === null) {
        newFirstBaseUpdate = newLastBaseUpdate = clone;// first=last=update1
        newBaseState = newState;
      } else {
        newLastBaseUpdate = newLastBaseUpdate.next = clone;
      }
      //更新队列中的剩下的优先级
      newLanes = mergeLanes(newLanes, updateLane);
    } else {
      //如果有足够的优先级 如果有曾经跳过的更新，仍然追加在后面
      if (newLastBaseUpdate !== null) {
        const clone = {
          id: update.id,
          //NoLane是所有的优先级的子集，永远不会被跳过
          lane: NoLane,
          payload: update.payload
        };
        newLastBaseUpdate = newLastBaseUpdate.next = clone;
      }
      newState = getStateFromUpdate(update, newState);
    }
    update = update.next;
    if (!update) {
      break;
    }
  } while (true);
  ```

  这里就是**==处理优先级==**的逻辑<!--就是按照优先级来处理更新，优先级不够的会被挂起-->，调用`processUpdateQueue(fiber, renderLanes)`时，会传入一个优先级`renderLanes`，若更新对象的`lane`不是`renderLanes`的子集，则跳过该更新

  具体逻辑：

  - **若更新对象的`lane`不是`renderLanes`的子集**

    <!--`renderLanes`即是当前Lane，而被跳过的更新的lane就是挂起的Lane-->

    - 复制该更新对象到新的的`base`队列中

      ```js
      const clone = {
        id: update.id,
        lane: updateLane,
        payload: update.payload
      };
      if (newLastBaseUpdate === null) {
        newFirstBaseUpdate = newLastBaseUpdate = clone;// first=last=update1
        newBaseState = newState;
      } else {
        newLastBaseUpdate = newLastBaseUpdate.next = clone;
      }
      ```

    - 将被跳过的更新对象的`lane`进行合并，成为`fiber`新的`lane`

      ```js
      newLanes = mergeLanes(newLanes, updateLane);
      ```

  - **若更新对象的`lane`是`renderLanes`的子集**

    - 根据更新对象计算新的状态

      ```js
      newState = getStateFromUpdate(update, newState);
      ```

      <!--优先级够了才参与计算，计算出来的状态最终被更新为fiber的memoizedState-->

    - 若新的`base`队列已经创建，则仍然复制该更新对象到`base`队列中

      ```js
      if (newLastBaseUpdate !== null) {
        const clone = {
          id: update.id,
          //NoLane是所有的优先级的子集，永远不会被跳过
          lane: NoLane,
          payload: update.payload
        };
        newLastBaseUpdate = newLastBaseUpdate.next = clone;
      }
      ```

      ⚠️这里复制没有跳过的更新对象的前提是，**==已经有了新的base队列==**，这么做的原因是保证后面处理低优先级的更新对象时，保证**==状态的连续性==**，毕竟最终目的是获取所有更新对象都参与计算的更新状态，这里跳过低优先级先处理高优先级只是一种**==过渡状态==**，是为了**==优先响应高优更新==**

      <!--这里为了保证后续处理低优先级更新时，被复制的高优先级更新仍能参与计算，复制的时候将其lane修改成了NoLane，NoLane是所有的优先级的子集，永远不会被跳过-->

    ------

看下实现效果

先实现一个打印方法，用于打印基础状态`baseState`和`base`队列

```js
function printUpdateQueue(updateQueue) {
  const { baseState, firstBaseUpdate } = updateQueue;
  let desc = baseState + '#';
  let update = firstBaseUpdate;
  while (update) {
    desc += update.id + '=>';
    update = update.next;
  }
  desc += 'null';
  return desc;
}
```

创建一个`fiber`并初始化更新队列

```js
let fiber = { memoizedState: '' };
initializeUpdateQueue(fiber);
console.log('fiber', fiber) 
```

打印`fiber`，看下初始状态的`fiebr`

```js
// fiber {
//   memoizedState: '',
//   updateQueue: {
//     baseState: '',
//     firstBaseUpdate: null,
//     lastBaseUpdate: null,
//     shared: { pending: null }
//   }
// }
```

------

创建更新对象`update`并入队

```js
let updateA = {
  id: 'A',
  payload: state => state + 'A',
  lane: SyncLane
};
enqueueUpdate(fiber, updateA);

let updateB = {
  id: 'B',
  payload: state => state + 'B',
  lane: InputContinuousHydrationLane
};
enqueueUpdate(fiber, updateB);

let updateC = {
  id: 'C',
  payload: state => state + 'C',
  lane: SyncLane
};
enqueueUpdate(fiber, updateC);

let updateD = {
  id: 'D',
  payload: state => state + 'D',
  lane: InputContinuousHydrationLane
};
enqueueUpdate(fiber, updateD);
```

总共创建了四个更新对象，`updateA`和`updateC`的`lane`为`SyncLane`，`updateB`和`updateD`的`lane`为`InputContinuousHydrationLane`

------

处理更新队列并打印，指定`renderLane`为`SyncLane`

```js
processUpdateQueue(fiber, SyncLane);
console.log('fiber', fiber) 
console.log('updateQueue', printUpdateQueue(fiber.updateQueue));
```

打印结果

```js
// {
//   memoizedState: 'AC',
//   updateQueue: {
//     baseState: 'A',
//     firstBaseUpdate: { id: 'B', lane: 2, payload: [Function: payload], next: [Object] },
//     lastBaseUpdate: { id: 'D', lane: 2, payload: [Function: payload] },
//     shared: { pending: null }
//   },
//   lanes: 2
// }

// updateQueue A#B=>C=>D=>null
```

可以发现`fiber`的`memoizedState`是`updateA`和`updateC`的计算结果，而`updateB`和`updateD`被跳过了

`base`队列中还有`updateB`、`updateC`、`updateD`三个更新对象，此时`updateC`的`lane`被修改成`NoLane`

------

再追加更新对象

```js
let updateE = {
  id: 'E',
  payload: state => state + 'E',
  lane: InputContinuousHydrationLane
};
enqueueUpdate(fiber, updateE);
let updateF = {
  id: 'F',
  payload: state => state + 'F',
  lane: InputContinuousHydrationLane
};
enqueueUpdate(fiber, updateF);
console.log(fiber);
```

```js
// {
//   memoizedState: 'AC',
//   updateQueue: {
//     baseState: 'A',
//     firstBaseUpdate: { id: 'B', lane: 2, payload: [Function: payload], next: [Object] },
//     lastBaseUpdate: { id: 'D', lane: 2, payload: [Function: payload] },
//     shared: { pending: [Object] }
//   },
//   lanes: 2
// }
```

此时`pending`上的更新对象是`updateE`和`updateF`

------

处理更新队列并打印，指定`renderLane`为`InputContinuousHydrationLane`

```js
processUpdateQueue(fiber, InputContinuousHydrationLane);
console.log(fiber)
console.log('updateQueue', printUpdateQueue(fiber.updateQueue));
```

```js
// {
//   memoizedState: 'ABCDEF',
//   updateQueue: {
//     baseState: 'ABCDEF',
//     firstBaseUpdate: null,
//     lastBaseUpdate: null,
//     shared: { pending: null }
//   },
//   lanes: 0
// }

// updateQueue ABCDEF#null
```

可以发现`fiber.memoizedState`已经是最终的状态了，并且`base`队列中没有被跳过的更新了

### 二、Lane模型下的初次渲染

在实现Lane模型下的初次渲染之前，可以先看下完整的`scheduleUpdateOnFiber`流程，这个流程中包含了**同步渲染**和**并发渲染**，后面会多次出现这张流程图

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/scheduleUpdateOnFiber1_1667713205987.jpg)

初次渲染的流程👇

![image-20230302215730401](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230302215730401.png)

下面实现Lane模型下的初次渲染

修改`main.jsx`

```js
import * as React from 'react';
import { createRoot } from "react-dom/client";

let element = <h1 >hello</h1>
const root = createRoot(document.getElementById("root"));
debugger
root.render(element);
```

------

改造`src/react-reconciler/src/ReactFiberReconciler.js`中更新容器的方法`updateContainer`

```diff
 export function updateContainer(element, container) {
   //获取当前的根fiber HostRootFiber
   const current = container.current;
+  //请求一个更新车道 初次渲染时是默认事件车道 DefaultLane 16
+  const lane = requestUpdateLane(current);
+
   //创建更新对象
-  const update = createUpdate();
+  const update = createUpdate(lane);
 
   //给更新对象上添加要更新的虚拟DOM
   update.payload = { element };
 
   //把此更新对象添加到HostRootFiber的更新队列上，返回根节点
-  const root = enqueueUpdate(current, update);
+  const root = enqueueUpdate(current, update, lane);
 
   // 在fiber上调度更新
-  scheduleUpdateOnFiber(root);
+  scheduleUpdateOnFiber(root, current, lane);
 }

```

==从`updateContainer`这里开始添加Lane模型的逻辑==

------

**实现请求一个更新车道的方法`requestUpdateLane`**，==初次渲染时`requestUpdateLane`的返回值是`DefaultLane`(16)==

```diff
+  //请求一个更新车道 初次渲染时是默认事件车道 DefaultLane 16
+  const lane = requestUpdateLane(current);
```

```js
// src/react-reconciler/src/ReactFiberWorkLoop.js

/**
 * @description 请求一个更新车道
 * 先获取当前更新优先级，默认值是NoLane 没有车道
 * 若更新优先级为NoLane，则获取当前事件优先级
 * 若没有事件则，返回默认事件车道 DefaultLane 16
 */
export function requestUpdateLane() {
  // 获取当前更新优先级，默认值是NoLane 没有车道
  const updateLane = getCurrentUpdatePriority();
  if (updateLane !== NoLanes) {
    return updateLane;
  }
  // 获取当前事件优先级，若没有事件则，返回默认事件车道 DefaultLane 16
  const eventLane = getCurrentEventPriority();
  return eventLane;
}
```

`requestUpdateLane`请求一个更新车道

- 先获取当前更新优先级：`getCurrentUpdatePriority` <!--（默认值是NoLane 没有车道）-->
- 若更新优先级为NoLane，则获取当前事件优先级：`getCurrentEventPriority` <!--（默认值是DefaultLane 16）-->
- 若没有事件则返回默认事件车道 `DefaultLane` 16

<!--所以初次渲染时，renderlane是`DefaultLane` 16-->

------

<!--下面是getCurrentUpdatePriority和getCurrentEventPriority的实现，没什么逻辑就是优先级匹配，没啥看的，直接跳过，只需知道初次渲染时，const lane = requestUpdateLane(current)这里拿到的lane是DefaultLane 16-->

<!-------------------------------略过start---------------------------------->

实现`getCurrentUpdatePriority`

```js
// src/react-reconciler/src/ReactEventPriorities.js

import {
  NoLane,
  SyncLane,
  InputContinuousLane,
  DefaultLane,
  IdleLane,
  getHighestPriorityLane,
  includesNonIdleWork
} from './ReactFiberLane';

//离散事件优先级 click onchange
export const DiscreteEventPriority = SyncLane; //1
//连续事件的优先级 mousemove
export const ContinuousEventPriority = InputContinuousLane; //4
//默认事件车道
export const DefaultEventPriority = DefaultLane; //16
//空闲事件优先级
export const IdleEventPriority = IdleLane;

// 全局变量 当前更新的优先级 默认值是NoLane 没有车道
let currentUpdatePriority = NoLane;

/**
 * @description 获取当前更新优先级 默认值是NoLane 没有车道
 */
export function getCurrentUpdatePriority() {
  return currentUpdatePriority;
}
```

```js
// src/react-reconciler/src/ReactFiberLane.js
export const TotalLanes = 31;
//没有车道，所有位都为0
export const NoLanes = 0b0000000000000000000000000000000;
export const NoLane = 0b0000000000000000000000000000000;
export const SyncLane = 0b0000000000000000000000000000001;
export const InputContinuousHydrationLane = 0b0000000000000000000000000000010;
export const InputContinuousLane = 0b0000000000000000000000000000100;
export const DefaultHydrationLane = 0b0000000000000000000000000001000;
//默认事件车道
export const DefaultLane = 0b0000000000000000000000000010000;
export const SelectiveHydrationLane = 0b0001000000000000000000000000000;
export const IdleHydrationLane = 0b0010000000000000000000000000000;
export const IdleLane = 0b0100000000000000000000000000000;
export const OffscreenLane = 0b1000000000000000000000000000000;
const NonIdleLanes = 0b0001111111111111111111111111111;
```

实现`getCurrentEventPriority`

```js
// src/react-dom-bindings/src/client/ReactDOMHostConfig.js
import { DefaultEventPriority } from 'react-reconciler/src/ReactEventPriorities';
import { getEventPriority } from '../events/ReactDOMEventListener';

/**
 * @description 获取当前事件优先级
 * 若是没有事件，则返回默认事件车道 16
 */
export function getCurrentEventPriority() {
  const currentEvent = window.event;
  if (currentEvent === undefined) {
    //默认事件车道 DefaultLane 16
    return DefaultEventPriority;
  }
  // 根据当前事件类型获取事件优先级
  return getEventPriority(currentEvent.type);
}
```

```js
// src/react-dom-bindings/src/events/ReactDOMEventListener.js
import { 
  ContinuousEventPriority, 
  DefaultEventPriority, 
  DiscreteEventPriority 
} from 'react-reconciler/src/ReactEventPriorities';
/**
 * 获取事件优先级
 * @param {*} domEventName 事件的名称 click
 */
 export function getEventPriority(domEventName) {
  switch (domEventName) {
    case 'click':
      return DiscreteEventPriority;
    case 'drag':
      return ContinuousEventPriority;
    default:
      return DefaultEventPriority;
  }
}
```

```js
// src/react-reconciler/src/ReactEventPriorities.js
import {
  NoLane,
  SyncLane,
  InputContinuousLane,
  DefaultLane,
  IdleLane,
  getHighestPriorityLane,
  includesNonIdleWork
} from './ReactFiberLane';

//离散事件优先级 click onchange
export const DiscreteEventPriority = SyncLane; //1
//连续事件的优先级 mousemove
export const ContinuousEventPriority = InputContinuousLane; //4
//默认事件车道
export const DefaultEventPriority = DefaultLane; //16
//空闲事件优先级
export const IdleEventPriority = IdleLane;
```

<!--没啥意思，绕来绕去的，看的头皮发麻，直接略过-->

<!-------------------------------略过end---------------------------------->

------

改造`src/react-reconciler/src/ReactFiberClassUpdateQueue.js`中的创建更新对象的方法`createUpdate`

```diff
   //创建更新对象
-  const update = createUpdate();
+  const update = createUpdate(lane);
```

```diff
/**
  * @description 创建更新的方法
  * @returns 返回值是一个对象
  */
-export function createUpdate() {
-  const update = { tag: UpdateState };
+export function createUpdate(lane) {
+  const update = { tag: UpdateState, lane, next: null };
   return update;
 }

```

这里就是给更新对象添加`lane`

<!--更新对象的lane就表示了该更新的优先级，优先级高的更新要先处理-->

------

改造`src/react-reconciler/src/ReactFiberClassUpdateQueue.js`中的**更新入队**方法`enqueueUpdate`

```diff
   //把此更新对象添加到HostRootFiber的更新队列上，返回根节点
-  const root = enqueueUpdate(current, update);
+  const root = enqueueUpdate(current, update, lane);
```

```js
/**
 * @description 将更新对象添加到更新队列中的方法
 * @param fiber 初始的fiber对象
 * @param update 更新对象
 */
export function enqueueUpdate(fiber, update, lane) {
  // 获取初始fiber对象上pending属性
  const updateQueue = fiber.updateQueue;
  // 获取共享队列
  const sharedQueue = updateQueue.shared;
  // 返回根 root
  return enqueueConcurrentClassUpdate(
    fiber,
    sharedQueue,
    update,
    lane
  );
}
```

```js
// src/react-reconciler/src/ReactFiberConcurrentUpdates.js
export function enqueueConcurrentClassUpdate(
  fiber,
  queue,
  update,
  lane
) {
  enqueueUpdate(fiber, queue, update, lane);
  return getRootForUpdatedFiber(fiber);
}
```

这里的`fiber`更新对象入队方法`enqueueConcurrentClassUpdate`和之前`hook`上更新对象方法`enqueueConcurrentHookUpdate`是一样的逻辑，通过调用`enqueueUpdate`将更新内容放到全局变量`concurrentQueues` 上<!--是个数组-->，后续在`ReactFiberWorkLoop.js`中调用`finishQueueingConcurrentUpdates`完成更新队列的创建

------

顺便改造下**处理更新队列**的方法`processUpdateQueue`

```js
/**
 * @description 根据老状态和更新队列中的更新计算最新的状态
 * @param workInProgress 新fiber 要计算的fiber
 */
export function processUpdateQueue(
  workInProgress,
  props,
  workInProgressRootRenderLanes
) {
  // 获取新的更新队列
  const queue = workInProgress.updateQueue;
  // 第一个跳过的更新
  let firstBaseUpdate = queue.firstBaseUpdate;
  // 最后一个跳过的更新
  let lastBaseUpdate = queue.lastBaseUpdate;
  // 获取待生效的队列
  const pendingQueue = queue.shared.pending;

  /**  如果有新链表合并新旧链表开始  */
  // 如果有新的待生效的队列
  if (pendingQueue !== null) {
    // 先清空待生效的队列
    queue.shared.pending = null;
    // 最后一个待生效的更新
    const lastPendingUpdate = pendingQueue;
    // 第一个待生效的更新
    const firstPendingUpdate = lastPendingUpdate.next;
    // 把环状链表剪开
    lastPendingUpdate.next = null;
    // 如果没有老的更新队列
    if (lastBaseUpdate === null) {
      // 第一个基本更新就是待生效队列的第一个更新
      firstBaseUpdate = firstPendingUpdate;
    } else {
      // 否则把待生效更新队列添加到基本更新的尾部
      lastBaseUpdate.next = firstPendingUpdate;
    }
    // 最后一个基本更新肯定就是最后一个待生效的更新
    lastBaseUpdate = lastPendingUpdate;
  }
  /**  合并新旧链表结束  */

  //如果链表不为空firstBaseUpdate=>lastBaseUpdate
  if (firstBaseUpdate !== null) {
    //上次跳过的更新前的状态
    let newState = queue.baseState;
    //尚未执行的更新的lane
    let newLanes = NoLanes;
    // 新的基本状态
    let newBaseState = null;
    // 新的第一个基本更新
    let newFirstBaseUpdate = null;
    // 新的最后一个基本更新
    let newLastBaseUpdate = null;
    // 第一个更新
    let update = firstBaseUpdate;
    do {
      //获取此更新车道
      const updateLane = update.lane;
      //如果说updateLane不是renderLanes的子集的话，说明本次渲染不需要处理过个更新，就是需要跳过此更新
      if (
        !isSubsetOfLanes(workInProgressRootRenderLanes, updateLane)
      ) {
        // 复制此更新并添加新的基本链表中
        const clone = {
          id: update.id,
          lane: updateLane,
          payload: update.payload
        };
        //说明新的跳过的base链表为空,说明当前这个更新是第一个跳过的更新
        if (newLastBaseUpdate === null) {
          //让新的跳过的链表头和链表尾都指向这个第一次跳过的更新
          newFirstBaseUpdate = newLastBaseUpdate = clone;
          //计算保存新的baseState为此跳过更新时的state
          newBaseState = newState;
        } else {
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        //如果有跳过的更新，就把跳过的更新所在的赛道合并到newLanes,
        //最后会把newLanes赋给fiber.lanes
        newLanes = mergeLanes(newLanes, updateLane);
      } else {
        //说明已经有跳过的更新了
        if (newLastBaseUpdate !== null) {
          const clone = {
            id: update.id,
            lane: 0,
            payload: update.payload
          };
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        newState = getStateFromUpdate(update, newState);
      }
      update = update.next;
    } while (update);
    //如果没能跳过的更新的话
    if (!newLastBaseUpdate) {
      newBaseState = newState;
    }
    queue.baseState = newBaseState;
    queue.firstBaseUpdate = newFirstBaseUpdate;
    queue.lastBaseUpdate = newLastBaseUpdate;
    //本次渲染完会判断，此fiber上还有没有不为0的lane,如果有，会再次渲染
    workInProgress.lanes = newLanes;
    workInProgress.memoizedState = newState;
  }
}
```

这里就是前面**1.4、 ReactUpdateQueue**中实现的逻辑，有了这套机制之后，React便可以做到优先处理高优任务

------

改造调度更新的方法`scheduleUpdateOnFiber`

‼️**==重点在这👇==**

```diff
   // 在fiber上调度更新
-  scheduleUpdateOnFiber(root);
+  scheduleUpdateOnFiber(root, current, lane);
```

<!--到这里才真正的开始这张流程图中的逻辑，前面都是准备工作，大无语😓人都傻了-->

![image-20230302215730401](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230302215730401-20230302225427911.png)

改造`scheduleUpdateOnFiber`

```diff
/**
 * @description 在fiber上调度更新 也就是计划更新root
 * 源码中此处有一个任务的功能，这里后续再实现
 * @param root 根 FiberRootNode
 * @param lane 车道 初次渲染时是默认事件车道 DefaultLane 16
 */
+export function scheduleUpdateOnFiber(root, fiber, lane) {
+  // 给当根 root 标记更新的车道
+  markRootUpdated(root, lane);
   // 确保调度执行root上的更新
   ensureRootIsScheduled(root);
 }

```

首先需要给`root`上标记更新的车道：`markRootUpdated(root, lane)`

```js
/**
 * @description 给当前根 root标记更新的车道
 */
export function markRootUpdated(root, updateLane) {
  //pendingLanes指的此根上等待生效的lane
  root.pendingLanes |= updateLane;
}
```

`root`上的`pendingLanes`默认值为`NoLanes`(0)，这里需要给`root`的`pendingLanes`合并`DefaultLane`(16)

> ```js
> /**
>  * @description FiberRootNode的构造函数，用于创建fiber根节点
>  * @param containerInfo 容器信息，根root上的就是真实DOM，div#root
>  */
> function FiberRootNode(containerInfo) {
>   this.containerInfo = containerInfo;
>   this.pendingLanes = NoLanes;
> }
> 
> ```

------

接着改造`ensureRootIsScheduled(root)`

```js
/**
 * @description 确保执行root上的更新
 */
function ensureRootIsScheduled(root) {
  //获取当前优先级最高的车道
  const nextLanes = getNextLanes(root, NoLanes); //16
  //获取新的调度优先级
  let newCallbackPriority = getHighestPriorityLane(nextLanes); //16
  if (newCallbackPriority === SyncLane) {
    //如果新的优先级是同步的话
    // TODO
  } else {
    //如果不是同步，就需要调度一个新的任务
    // 调度的优先级
    let schedulerPriorityLevel;
    switch (
      lanesToEventPriority(nextLanes) //将lane转成事件优先级
    ) {
      //离散事件优先级 click onchange
      case DiscreteEventPriority:
        // 立刻执行优先级 1
        schedulerPriorityLevel = ImmediateSchedulerPriority;
        break;
      //连续事件的优先级 mousemove
      case ContinuousEventPriority:
        //用户阻塞操作优先级 2 用户点击 ，用户输入
        schedulerPriorityLevel = UserBlockingSchedulerPriority;
        break;
      //默认事件车道
      case DefaultEventPriority:
        // 正常优先级 3
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
      //空闲事件优先级
      case IdleEventPriority:
        // 空闲优先级 5
        schedulerPriorityLevel = IdleSchedulerPriority;
        break;
      default:
        // 正常优先级 3
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
    }
    // 调度执行更新任务
    Scheduler_scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }
}
```

改造的内容有两点：

1. **根据`root`上的`lane`判断是走同步更新还是调度更新**

   ```js
   //获取当前优先级最高的车道
   const nextLanes = getNextLanes(root, NoLanes); //16
   //获取新的调度优先级
   let newCallbackPriority = getHighestPriorityLane(nextLanes); //16
   if (newCallbackPriority === SyncLane) {
     //如果新的优先级是同步的话
   // TODO
   } else {
     //...
   }
   ```

   也就是流程图中的这一部分

   <img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230302231930366.png" alt="image-20230302231930366" style="zoom:50%;" />

   初次渲染时`newCallbackPriority`为`DefaultLane`(16)不是`SyncLane`，所以走调度更新

   <!--同步更新后面再实现-->

   ------

   `getNextLanes`和`getHighestPriorityLane`的实现 <!--可以不用看-->

   ```js
   /**
    * @description 获取当前优先级最高的车道
    */
   export function getNextLanes(root) {
     //先获取所有的有更新的车道
     const pendingLanes = root.pendingLanes;
     if (pendingLanes == NoLanes) {
       return NoLanes;
     }
     const nextLanes = getHighestPriorityLanes(pendingLanes);
     return nextLanes;
   }
   /**
    * @description 获取当前优先级最高的车道
    */
   export function getHighestPriorityLanes(lanes) {
     return getHighestPriorityLane(lanes);
   }
   
   //找到最右边的1 只能返回一个车道
   export function getHighestPriorityLane(lanes) {
     return lanes & -lanes;
   }
   ```

2. **增加调度更新的逻辑**

   - 将`lane`转成事件优先级：`schedulerPriorityLevel`，供`Scheduler_scheduleCallback`使用

     ```js
     let schedulerPriorityLevel;
     switch (lanesToEventPriority(nextLanes) //将lane转成事件优先级
     ) {
       //...
     }
     ```

   - 使用正确的优先级`schedulerPriorityLevel`，执行`Scheduler_scheduleCallback`

     ```js
     // 调度执行更新任务
     Scheduler_scheduleCallback(
       schedulerPriorityLevel,
       performConcurrentWorkOnRoot.bind(null, root)
     );
     ```

     > 之前的`ensureRootIsScheduled`
     >
     > ```js
     > function ensureRootIsScheduled(root) {
     >   //告诉浏览器要执行performConcurrentWorkOnRoot
     >   scheduleCallback(NormalSchedulerPriority, performConcurrentWorkOnRoot.bind(null, root));
     > }
     > ```

     `scheduleCallback`的逻辑再**15、实现scheduler**中已经改造完成，接下来继续改造`scheduleCallback(priorityLevel, callback)`中的`callback`逻辑，也就是`performConcurrentWorkOnRoot`

     <!--这里需要明确的一点‼️ scheduleCallback会创建一个宏任务来执行调度更新，后面将要实现的同步更新创建的则是一个微任务-->

------

改造`performConcurrentWorkOnRoot`

```diff
+function performConcurrentWorkOnRoot(root,didTimeout) {
+//获取root上当前优先级最高的车道， 初次渲染时是默认事件车道 DefaultLane 16
+ const lanes = getNextLanes(root, NoLanes);
+ if (lanes === NoLanes) {
+   return null;
+ }
+ //如果不包含阻塞的车道，并且没有超时，就可以并行渲染,就是启用时间分片
+ //所以说默认更新车道是同步的,不能启用时间分片
+ const shouldTimeSlice = !includesBlockingLane(root, lanes) && (!didTimeout);
+ if (shouldTimeSlice) {
+   renderRootConcurrent(root, lanes)
+ } else {
+   renderRootSync(root, lanes);
+ }
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
   //开始进入提交阶段，就是执行副作用，修改真实DOM
  commitRoot(root);
}
```

增加的内容：

- **判断是否启用时间切片（启用则采用并发渲染，不启用则采用同步渲染）**

  ```js
  const shouldTimeSlice = !includesBlockingLane(root, lanes) && (!didTimeout);
  ```

  ==如果`root`上**不包含阻塞的车道**，并且**任务没有超时**，就可以并行渲染,就是启用时间分片==
  - **是否包含阻塞车道：`includesBlockingLane`**

  ```js
  export function includesBlockingLane(root, lanes) {
    const SyncDefaultLanes = InputContinuousLane | DefaultLane;
    return (lanes & SyncDefaultLanes) !== NoLanes;
  }
  ```

  由于初次渲染时，`root`上的`lane`是`DefaultLane`，所以`includesBlockingLane`便为`true`

  <!--所以初次渲染时，shouldTimeSlice为false，走同步渲染的逻辑-->

  - **任务是否过期：`didTimeout`**

    `didTimeout`是`scheduleCallback`内部执行`performConcurrentWorkOnRoot`时传入的

    > ```js
    > const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
    > const continuationCallback = callback(didUserCallbackTimeout);
    > ```
    >
    > `didUserCallbackTimeout`就是`didTimeout`，表示当前任务是否过期
    >
    > 若任务的过期时间小于当前时间，则说明当前任务已过期

- 若`shouldTimeSlice`为`true`，则采用并发渲染：`renderRootConcurrent`

  ```js
  if (shouldTimeSlice) {
   renderRootConcurrent(root, lanes)
  }
  ```

  <!--并发渲染后面再实现-->

- 若`shouldTimeSlice`为`false`，则采用同步渲染：`renderRootSync`

  ```js
  } else {
  renderRootSync(root, lanes);
  }
  ```

  同步渲染也就是流程图中这一部分内容👇

  <img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230302234622023.png" alt="image-20230302234622023" style="zoom:50%;" />

<!--performConcurrentWorkOnRoot是Concurrent Mode下的更新API，但不是每次更新都走并发渲染（切片）renderRootConcurrent，而是根据`shouldTimeSlice`判断走并发渲染renderRootConcurrent，还是同步渲染renderRootSync，这是因为一次任务虽然可以分割成若干小任务执行，但是当这个任务过期后，便应当尽快将任务执行完成，这个时候就不能继续切片执行了，而是将剩余部分一次性执行完成（走同步渲染renderRootSync）-->

------

流程图中这部分逻辑，在之前已经实现过了，就不再赘述了

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230302235230878.png" alt="image-20230302235230878" style="zoom:50%;" />

再看下完整的流程图

![image-20230302235350790](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230302235350790.png)

整个`Lane`模型下的初渲染，基本上和之前实现的初渲染一致，多了`SyncLane`和`shouldTimeSlice`的判断

看下实现效果

`jsx`

```jsx
import * as React from 'react';
import { createRoot } from "react-dom/client";

let element = <h1 >hello</h1>
const root = createRoot(document.getElementById("root"));
root.render(element);
```

![image-20230303000053173](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230303000053173.png)