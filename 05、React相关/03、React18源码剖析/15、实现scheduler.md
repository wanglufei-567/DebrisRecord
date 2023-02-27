## React18源码解析（十五）实现scheduler

### 一、前言

#### 1.1、scheduler

**==React Scheduler==** 是 React 内部使用的一种**==调度器==**，**==用于在不同的优先级之间分配任务==**。在 React Scheduler 中，**==最小堆==**是一种用于**==存储任务的数据结构==**，它根据**==任务的优先级排序==**，优先级越高的任务排在堆的前面。

React Scheduler 的最小堆是**==基于数组实现==**的。每个元素包含了一个任务的信息，包括任务的优先级、过期时间、回调函数等等。堆中的每个元素都有一个唯一的序号，用于在堆中快速定位该元素的位置。

React Scheduler 的最小堆是调度器的核心数据结构之一，它通过**==对任务进行排序和管理==**，实现了**==高效==**的任务调度和执行。

#### 1.2、最小堆

最小堆（Min Heap）是一种常见的数据结构，它是一棵经过排序的**==完全二叉树==**，其中**==任一非终端节点的数据值均不大于其左子节点和右子节点的值==**==，====**根结点值是所有堆结点值中最小者**==。最小堆常常用来实现优先队列，也可以用来解决一些特定的算法问题。

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/zui_xiao_dui_1_1643275468911.jpg)

最小堆的基本操作包括插入元素、删除最小元素和查找最小元素：

- **插入元素：**将新元素插入到堆的最后一个位置，然后将它与它的父节点比较，如果它比父节点小，则交换它和父节点的位置，直到它不再比父节点小或已经到达根节点为止。
- **删除最小元素：**将堆顶元素删除并将最后一个元素移动到堆顶位置，然后将这个元素与它的子节点比较，将它与较小的子节点交换位置，直到它比它的子节点都小或已经到达叶子节点为止。
- **查找最小元素：**直接返回堆顶元素即可

#### 1.3、完全二叉树

**完全二叉树**（Complete Binary Tree）是一种特殊的二叉树，它除了最后一层节点可能不满外，其他层的节点数都达到了最大值，同时最后一层的节点都集中在树的左侧。

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/wan_quan_er_cha_shu_1643274486956.jpg" alt="img" style="zoom:50%;" />

- 叶子结点只能出现在最下层和次下层
- 且最下层的叶子结点集中在树的左部

#### 1.4、SchedulerMinHeap

接下来完成一个最小堆的js实现

- **`peek` 查看堆的顶点**

  ```js
  export function peek(heap) {
    const first = heap[0];
    return first === undefined ? null : first;
  }
  ```

- **`siftDown` 向下调整堆结构, 保证最小堆**

  ```js
  function siftDown(heap, node, i) {
    let index = i;
    const length = heap.length;
    while (index < length) {
      const leftIndex = (index + 1) * 2 - 1;
      const left = heap[leftIndex];
      const rightIndex = leftIndex + 1;
      const right = heap[rightIndex]; 
      if (left !== undefined && compare(left, node) < 0) {
        if (right !== undefined && compare(right, left) < 0) {
          heap[index] = right;
          heap[rightIndex] = node;
          index = rightIndex;
        } else {
          heap[index] = left;
          heap[leftIndex] = node;
          index = leftIndex;
        }
      } else if (right !== undefined && compare(right, node) < 0) {
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        return;
      }
    }
  }
  ```

  ```js
  function compare(a, b) {
    const diff = a.sortIndex - b.sortIndex;
    return diff !== 0 ? diff : a.id - b.id;
  }
  ```

- **`siftUp` 需要向上调整堆结构, 保证最小堆**

  ```js
  function siftUp(heap, node, i) {
    let index = i;
    while (true) {
      const parentIndex = index - 1 >>> 1;
      const parent = heap[parentIndex];
      if (parent !== undefined && compare(parent, node) > 0) {
        heap[parentIndex] = node;
        heap[index] = parent;
        index = parentIndex;
      } else {
  
        return;
      }
    }
  }
  ```

- **`pop` 弹出堆的顶点后需要调用`siftDown`函数向下调整堆**

  ```js
  export function pop(heap) {
    const first = heap[0];
    if (first !== undefined) {
      const last = heap.pop();
      if (last !== first) {
        heap[0] = last;
        siftDown(heap, last, 0);
      }
      return first;
    } else {
      return null;
    }
  }
  ```

  将堆顶元素删除并将最后一个元素移动到堆顶位置，然后将这个元素与它的子节点比较，将它与较小的子节点交换位置，直到它比它的子节点都小或已经到达叶子节点为止。

- **`push` 添加新节点后需要调用`siftUp`函数向上调整堆**

  ```js
  export function push(heap, node) {
    const index = heap.length;
    heap.push(node);
    siftUp(heap, node, index);
  }
  ```

  将新元素插入到堆的最后一个位置，然后将它与它的父节点比较，如果它比父节点小，则交换它和父节点的位置，直到它不再比父节点小或已经到达根节点为止。

------

看下实现效果👇

```js
const { push, pop, peek } = require('./SchedulerMinHeap');
let heap = [];
let id = 1;
push(heap, { sortIndex: 1, id: id++ });
push(heap, { sortIndex: 2, id: id++ });
push(heap, { sortIndex: 3, id: id++ });
console.log(peek(heap));

push(heap, { sortIndex: 4, id: id++ });
push(heap, { sortIndex: 5, id: id++ });
push(heap, { sortIndex: 6, id: id++ });
push(heap, { sortIndex: 7, id: id++ });
console.log(heap);

pop(heap);
console.log(peek(heap));
```

```js
// { sortIndex: 1, id: 1 }

//[
   //{ sortIndex: 1, id: 1 },
   //{ sortIndex: 2, id: 2 },
  //{ sortIndex: 3, id: 3 },
  //{ sortIndex: 4, id: 4 },
  //{ sortIndex: 5, id: 5 },
  //{ sortIndex: 6, id: 6 },
  //{ sortIndex: 7, id: 7 }
//]

//{ sortIndex: 2, id: 2 }
```

可以看到`heap`中的数据经过**`push`插入元素**、**`pop`删除最小元素**之后仍然维持最小堆的数据结构

<!--React scheduler中的最小堆就是这样实现的-->

#### 1.5、MessageChannel

在前面的笔记中，简易版的React的事件切片是通过浏览器提供的`requestIdleCallback`来实现的，但是目前 `requestIdleCallback` 目前只有Chrome支持，所以目前 React利用 [MessageChannel](https://developer.mozilla.org/zh-CN/docs/Web/API/MessageChannel)模拟了`requestIdleCallback`，==**将回调延迟到绘制操作之后执行**==;

**MessageChannel API**允许我们创建一个新的**==消息通道==**，并通过它的两个`MessagePort`属性发送数据

**MessageChannel**创建了一个通信的管道，这个管道有两个端口，每个端口都可以通过`postMessage`发送数据，而一个端口只要绑定了`onmessage`回调方法，就可以接收从另一个端口传过来的数据

**MessageChannel是一个==宏任务==**

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/liu_lan_qi_zhen_1643277067067.jpg)

使用方式👇

```js
var channel = new MessageChannel();
var port1 = channel.port1;
var port2 = channel.port2
port1.onmessage = function(event) {
    console.log("port1收到来自port2的数据：" + event.data);
}
port2.onmessage = function(event) {
    console.log("port2收到来自port1的数据：" + event.data);
}
port1.postMessage("发送给port2");
port2.postMessage("发送给port1");
```

### 二、实现scheduler

首先回顾下`src/react-reconciler/src/ReactFiberWorkLoop.js`中是如何使用`scheduler`模块的

```js
import { scheduleCallback } from "scheduler";

/**
 * @description 确保执行root上的更新
 */
function ensureRootIsScheduled(root) {
  //告诉浏览器要执行performConcurrentWorkOnRoot
  scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
}
```

```js
// src/scheduler/src/forks/Scheduler.js
export function scheduleCallback(callback) {
  requestIdleCallback(callback);
}
```

在之前的实现中，我们直接使用了`requestIdleCallback`这个API，没有具体实现切片和优先级的逻辑，所以接下来要改造`scheduleCallback`

在具体实现前，先看下`scheduleCallback`的整体流程👇

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/shi_jian_qie_pian_diao_du_1643278352662.jpg" alt="img" />

<!--整个流程并不复杂，就是每次执行任务`callBack`之前计算Deadline，时间没到Deadline就不断的从任务队列中取任务执行，Deadline到了之后检查任务队列中是否还有任务，有就开始新的一轮，没有就结束-->

------

首先是在`src/scheduler/src/forks/SchedulerMinHeap.js`中实现最小堆的相关方法

```js
export function push(heap, node) {
  const index = heap.length;
  heap.push(node);
  siftUp(heap, node, index);
}
export function peek(heap) {
  return heap.length === 0 ? null : heap[0];
}
export function pop(heap) {
  if (heap.length === 0) {
    return null;
  }
  const first = heap[0];
  const last = heap.pop();
  if (last !== first) {
    heap[0] = last;
    siftDown(heap, last, 0);
  }
  return first;
}
function siftUp(heap, node, i) {
  let index = i;
  while (index > 0) {
    const parentIndex = index - 1 >>> 1;
    const parent = heap[parentIndex];
    if (compare(parent, node) > 0) {
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      return;
    }
  }
}
function siftDown(heap, node, i) {
  let index = i;
  const length = heap.length;
  const halfLength = length >>> 1;
  while (index < halfLength) {
    const leftIndex = (index + 1) * 2 - 1;
    const left = heap[leftIndex];
    const rightIndex = leftIndex + 1;
    const right = heap[rightIndex];
    if (compare(left, node) < 0) {
      if (rightIndex < length && compare(right, left) < 0) {
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex;
      }
    } else if (rightIndex < length && compare(right, node) < 0) {
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex;
    } else {
      return;
    }
  }
}
function compare(a, b) {
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}
```

<!--和前面的实现一致-->

------

接下来改造`scheduleCallback`

```js
// src/scheduler/src/forks/SchedulerPriorities.js
// 无优先级
export const NoPriority = 0;
// 立刻执行优先级
export const ImmediatePriority = 1;
//用户阻塞操作优先级 用户点击 ，用户输入
export const UserBlockingPriority = 2;
// 正常优先级
export const NormalPriority = 3;
// 低优先级
export const LowPriority = 4;
// 空闲优先级
export const IdlePriority = 5;

```

```js
import { push, peek, pop } from './SchedulerMinHeap';
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority
} from './SchedulerPriorities';


var maxSigned31BitInt = 1073741823;
// Times out immediately 立刻过期 -1
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out 250毫秒
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
// 正常优先级的过期时间 5秒
var NORMAL_PRIORITY_TIMEOUT = 5000;
// 低优先级过期时间 10秒
var LOW_PRIORITY_TIMEOUT = 10000;
// Never times out 永远不过期
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

//任务ID计数器
let taskIdCounter = 1;
//任务的最小堆
const taskQueue = [];

// 正在被调度的任务回调
let scheduleHostCallback = null;
let startTime = -1;
// 当前正在处理的任务
let currentTask = null;

//React每一帧向浏览申请5毫秒用于自己任务执行
//如果5MS内没有完成，React也会放弃控制权，把控制交还给浏览器
const frameInterval = 5;

function getCurrentTime() {
  // performance.now返回一个DOMHighResTimeStamp（代表 "高分辨率时间戳"）
  // 简单地说，这是一个以毫秒为单位的时间值，在两个时间点之间的小数部分
  return performance.now();
}

/**
 * 按优先级执行任务
 * @param {*} priorityLevel 优先级
 * @param {*} callback 任务回调
 */
export function scheduleCallback(priorityLevel, callback) {
  // 获取当前的时候
  const currentTime = getCurrentTime();
  // 此任务的开时间
  const startTime = currentTime;
  //超时时间
  let timeout;

  // 根据优先级匹配任务时间
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT; // -1
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT; // 250ms
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT; //1073741823
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT; //10000
      break;
    case NormalPriority:
    default: //5000
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
  }

  //计算此任务的过期时间
  const expirationTime = startTime + timeout;
  // 新建任务
  const newTask = {
    id: taskIdCounter++,
    callback, //回调函数或者说任务函数
    priorityLevel, //优先级别
    startTime, //任务的开始时间
    expirationTime, //任务的过期时间
    sortIndex: expirationTime //排序依赖，过期时间越短优先级越高
  };

  //向任务最小堆里添加任务，排序的依据是过期时间
  push(taskQueue, newTask);

  //flushWork执行工作，刷新工作，执行任务
  requestHostCallback(workLoop);
  return newTask;
}
```

`scheduleCallback`中主要完成了以下几件事

- **根据调用`scheduleCallback`时传入的任务优先级`priorityLevel`进行任务时间的匹配**

  ```js
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT; // -1
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT; // 250ms
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT; //1073741823
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT; //10000
      break;
    case NormalPriority:
    default: //5000
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
  }
  ```

  <!--任务的优先级最终是通过任务时间来进行表示的，任务优先级越高，任务过期时间越短-->

- **根据调用`scheduleCallback`时传入的任务回调`callback`，创建新任务`newTask`**

  ```js
  //计算此任务的过期时间
  const expirationTime = startTime + timeout;
  // 新建任务
  const newTask = {
    id: taskIdCounter++,
    callback, //回调函数或者说任务函数
    priorityLevel, //优先级别
    startTime, //任务的开始时间
    expirationTime, //任务的过期时间
    sortIndex: expirationTime //排序依赖，过期时间越短优先级越高
  };
  ```

  <!--⚠️注意任务的排序依赖sortIndex也就是任务的过期时间，这个排序依赖决定了后续任务再最小堆中处于何位置-->

-   **向任务最小堆里添加任务，排序的依据是过期时间**

  ```js
  push(taskQueue, newTask);
  ```

- **执行任务，刷新任务**

  ```js
  requestHostCallback(workLoop);
  ```

  <!--从最小堆中获取任务，调度执行任务就是这里进行的-->

------

实现调度执行任务的方法`requestHostCallback`

```js
/**
 * @description 执行任务，刷新任务
 * @param workLoop 工作循环
 */
function requestHostCallback(workLoop) {
  //先缓存回调函数
  scheduleHostCallback = workLoop;
  //执行工作直到截止时间
  schedulePerformWorkUntilDeadline();
}
```

```js
const channel = new MessageChannel();
var port2 = channel.port2;
var port1 = channel.port1;
port1.onmessage = performWorkUntilDeadline;

/**
 * @description 调度执行工作直到截止时间
 */
function schedulePerformWorkUntilDeadline() {
  port2.postMessage(null);
}
```

`requestHostCallback`中做了两件事

- **将调度执行任务的回调函数存在一个全局变量上`scheduleHostCallback(wookLoop)`**

  <!--任务的执行逻辑在wookLoop中-->

- **创建一个==宏任务==，待浏览器完成渲染之后，执行调度执行任务的回调函数`scheduleHostCallback`**

<!--这里就是利用了MessageChannel来进行宏任务的创建，还没有具体的任务执行逻辑，React中是通过MessageChannel或者setTimeOut（没有MessageChannel的情况）来实现自己的requestIdleCallback，来保证每次时间切片为5ms-->

------

实现宏任务的回调函数`performWorkUntilDeadline`

```js
/**
 * @description MessageChannel的onMessage回调
 */
function performWorkUntilDeadline() {
  if (scheduleHostCallback) {
    // 先获取开始执行任务的时间，表示时间片的开始
    startTime = getCurrentTime();
    // 是否有更多的工作要做
    let hasMoreWork = true;
    try {
      //执行 flushWork ，并判断有没有返回值
      hasMoreWork = scheduleHostCallback(startTime);
    } finally {
      //执行完以后如果为true,说明还有更多工作要做
      if (hasMoreWork) {
        //继续执行
        schedulePerformWorkUntilDeadline();
      } else {
        scheduleHostCallback = null;
      }
    }
  }
}
```

<!--一个`performWorkUntilDeadline`就是一个时间切片执行单元，这个单元中执行多少任务取决于`scheduleHostCallback`（也就是`requestHostCallback(workLoop)中的workLoop`）中能完成多少任务；-->

当一个时间切片结束后，`scheduleHostCallback`中没有将最小堆中的所有任务执行完，也就是`hasMoreWork`为`true`，那么会再次`schedulePerformWorkUntilDeadline`，再创建一个宏任务，也就是一个新的时间切片

------

实现`workLoop`（`scheduleHostCallback`）

```js
/**
 * @description 从任务队列taskQueue中获取任务执行
 */
function workLoop(startTime) {
  let currentTime = startTime;
  //取出优先级最高的任务
  currentTask = peek(taskQueue);
  while (currentTask !== null) {
    //如果此任务的过期时间小于当前时间，也就是说没有过期,并且需要放弃执行 时间片到期
    if (
      currentTask.expirationTime > currentTime &&
      shouldYieldToHost()
    ) {
      //跳出工作循环
      break;
    }
    //取出当前的任务中的回调函数 performConcurrentWorkOnRoot
    const callback = currentTask.callback;
    if (typeof callback === 'function') {
      currentTask.callback = null;
      //执行工作，如果返回新的函数，则表示当前的工作没有完成
      const didUserCallbackTimeout =
        currentTask.expirationTime <= currentTime;

      const continuationCallback = callback(didUserCallbackTimeout);

      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback;
        return true; //还有任务要执行
      }
      //如果此任务已经完成，则不需要再继续执行了，可以把此任务弹出
      if (currentTask === peek(taskQueue)) {
        pop(taskQueue);
      }
    } else {
      pop(taskQueue);
    }
    //如果当前的任务执行完了，或者当前任务不合法，取出下一个任务执行
    currentTask = peek(taskQueue);
  }
  //如果循环结束还有未完成的任务，那就表示hasMoreWork=true
  if (currentTask !== null) {
    return true;
  }
  //没有任何要完成的任务了
  return false;
}
```

```js
/**
 * @description 判断是否终止执行任务
 */
function shouldYieldToHost() {
  //用当前时间减去开始的时间就是过去的时间
  const timeElapsed = getCurrentTime() - startTime;
  //如果流逝或者说经过的时间小于5毫秒，那就不需要放弃执行
  if (timeElapsed < frameInterval) {
    return false;
  } //否则就是表示5毫秒用完了，需要放弃执行
  return true;
}
```

`workLoop`中做的事

- **从最小堆`taskQueue`中获取优先级最高的任务**

  ```js
   currentTask = peek(taskQueue);
  ```
- **在时间切片没有结束之前执行任务**

  ```js
  if (
      currentTask.expirationTime > currentTime &&
      shouldYieldToHost()
    ) {
      //跳出工作循环
      break;
    }
  ```

  ⚠️注意这里判断要不要继续执行任务的逻辑

  - 如果此任务的过期时间小于当前时间，也就是说没有过期
  - 并且时间片到期，需要放弃执行 

  <!--所以当一个任务过期之后，不管时间切片时候到期都要将该任务执行完，这也就是不是每个切片都能稳定在5ms的原因，因为任务过期之后，优先级会提升-->

- 任务执行完，将该任务从最小堆中删除

  ```js
  if (currentTask === peek(taskQueue)) {
      pop(taskQueue);
    }
  ```

------

到这里`scheduleCallback`就改造完成了，再回顾下整体流程👇

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/duo_ge_ren_wu_1643279818108.jpg)

<!--`scheduleCallback`的核心任务就是在`Deadline`之前从`taskQueue`按照优先级取出任务进行执行-->

------

接下来在`ReactFiberWorkLoop.js`中使用`scheduleCallback`

```js
import {
  scheduleCallback,
  NormalPriority as NormalSchedulerPriority,
  shouldYield,
} from "scheduler";

// ...

/**
 * @description 确保执行root上的更新
 */
function ensureRootIsScheduled(root) {
  //告诉浏览器要执行performConcurrentWorkOnRoot
  scheduleCallback(NormalSchedulerPriority, performConcurrentWorkOnRoot.bind(null, root));
  // performConcurrentWorkOnRoot.bind(null, root)();
}

//...

/**
 * @description 提交方法
 * @param root 根节点
 */
function commitRoot(root) {
  const { finishedWork } = root;

  //若是新的fiber树上有Passive则说明有函数组件使用了useEffect
  if (
    (finishedWork.subtreeFlags & Passive) !== NoFlags ||
    (finishedWork.flags & Passive) !== NoFlags
  ) {
    //若此根节点上有useEffect类似的副作用
    if (!rootDoesHavePassiveEffect) {
      // scheduleCallback会开启一个新的宏任务，只需执行一次即可
      rootDoesHavePassiveEffect = true;
      scheduleCallback(NormalSchedulerPriority, performConcurrentWorkOnRoot.bind(null, root));
    }
  }
  // ...
}
```

