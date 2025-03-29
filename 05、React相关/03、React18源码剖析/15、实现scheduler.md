## React18源码解析（十五）实现scheduler

### 一、前言

#### 1.1、scheduler

**==React Scheduler==** 是 **React** 内部使用的一种**==调度器==**，用于在**==不同的优先级==**任务之间进行调度

在 **React Scheduler** 中，**==最小堆==**是一种用于**==存储任务的数据结构==**，它根据**==任务的优先级排序==**，优先级越高的任务排在堆的前面

**React Scheduler** 的最小堆是**==基于数组实现==**的。每个元素包含了一个任务的信息，包括任务的**==优先级==**、**==过期时间==**、**==回调函数==**等等。堆中的每个元素都有一个唯一的序号，用于在堆中快速定位该元素的位置

**React Scheduler** 的最小堆是调度器的核心数据结构之一，它通过**==对任务进行排序和管理==**，实现了**==高效==**的任务调度和执行

<!--Scheduler 负责对任务进行排序管理并调度执行，所谓调度执行，就是从最小堆中按照优先级从高到低的顺序取出任务，并根据时间切片的剩余时间和任务过期时间，来决定是否将任务在当前帧中完成执行-->

#### 1.2、最小堆

最小堆（**Min Heap**）是一种常见的数据结构，它是一棵经过排序的**==完全二叉树==**，其中**任一非终端节点的数据值均不大于其左子节点和右子节点的值**，**根结点值是所有堆结点值中最小者**

最小堆常常用来实现优先队列，也可以用来解决一些特定的算法问题

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/zui_xiao_dui_1_1643275468911.jpg)

最小堆的基本操作包括插入元素、删除最小元素和查找最小元素：

- **插入元素：**==将新元素插入到堆的最后一个位置==，然后将它与它的父节点比较，如果它比父节点小，则交换它和父节点的位置，直到它不再比父节点小或已经到达根节点为止。
- **删除最小元素：**==将堆顶元素删除并将最后一个元素移动到堆顶位置==，然后将这个元素与它的子节点比较，将它与较小的子节点交换位置，直到它比它的子节点都小或已经到达叶子节点为止。
- **查找最小元素：**直接返回堆顶元素即可

#### 1.3、完全二叉树

**完全二叉树**（**Complete Binary Tree**）是一种特殊的二叉树，它除了最后一层节点可能不满外，其他层的节点数都达到了最大值，同时最后一层的节点都集中在树的左侧。

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/wan_quan_er_cha_shu_1643274486956.jpg" alt="img" style="zoom:50%;" />

- 叶子结点只能出现在最下层和次下层
- 且最下层的叶子结点集中在树的左部

#### 1.4、SchedulerMinHeap

接下来完成一个最小堆的 js 实现

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

- **`pop` 弹出堆的顶点后需要调用 `siftDown` 函数向下调整堆**

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

- **`push` 添加新节点后需要调用 `siftUp` 函数向上调整堆**

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

可以看到 `heap` 中的数据经过**`push` 插入元素**、**`pop` 删除最小元素**之后仍然维持最小堆的数据结构

<!--React scheduler 中的最小堆就是这样实现的-->

#### 1.5、MessageChannel

在前面的笔记中，简易版的 **React** 的事件切片是通过浏览器提供的 `requestIdleCallback` 来实现的，但是目前 `requestIdleCallback` 目前只有 **Chrome** 支持，所以目前 **React** 利用 [MessageChannel](https://developer.mozilla.org/zh-CN/docs/Web/API/MessageChannel) 模拟了 `requestIdleCallback`，**==将回调延迟到绘制操作之后执行==**

> **React** 不使用 `requestIdleCallback` 实现时间切片的原因：
>
> 1. **==不同浏览器支持不同==**：虽然 `requestIdleCallback` **API** 在现代浏览器中得到广泛支持，但在一些旧版本的浏览器中并不支持，这就需要 **React** 在不同浏览器之间进行兼容性处理
> 2. **==无法控制任务执行时间==**：由于 `requestIdleCallback` **API** 依赖于浏览器的空闲时间，因此无法保证任务会在指定时间内完成。如果任务需要比较长时间才能完成，就可能会对页面的性能产生负面影响
> 3. **不稳定**：在某些情况下，`requestIdleCallback` 的回调函数可能会在浏览器准备绘制下一帧之前被调用，这就可能会导致页面的渲染出现问题

**MessageChannel API** 允许我们创建一个新的**==消息通道==**，并通过它的两个 `MessagePort` 属性发送数据

**MessageChannel** 创建了一个通信的管道，这个管道有==两个端口==，每个端口都可以通过 `postMessage` 发送数据，而一个端口只要绑定了 `onmessage` 回调方法，就可以接收从另一个端口传过来的数据

**MessageChannel 是一个==宏任务==**

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/liu_lan_qi_zhen_1643277067067.jpg)

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230228152841050.png" alt="image-20230228152841050" style="zoom:40%;" />

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

可以看到，一个端口（`port1`）调用 `postMessage` 方法发送数据，另一个端口（`port2`）的回调（`onmessage`）便会执行并接受到数据

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

> `requestHostCallback`  将任务提交到浏览器的任务队列中，并在**==下一个浏览器帧==**中执行

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/shi_jian_qie_pian_diao_du_1643278352662.jpg" alt="img" />

整个流程并不复杂，就是每次执行任务 `callBack` 之前计算 **Deadline**，时间没到 **Deadline** 就不断的从任务队列中取任务执行，**Deadline** 到了之后检查任务队列中是否还有任务，有就开始新的一轮，没有就结束

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

<!--和前面的1.4、SchedulerMinHeap实现一致-->

------

再创建`Scheduler`中的优先级枚举

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

> **React Scheduler** 中一共有五个不同的优先级，按照**==从高到低==**的顺序分别是：
>
> 1. **==Immediate（立即）==**：该优先级用于紧急情况，如**==事件处理==**、**==动画==**等需要立即响应的任务，这些任务需要尽快得到执行，以保证用户体验。
> 2. ==**User-blocking（用户阻塞）**==：该优先级用于**==处理用户操作，如用户输入、界面交互==**等，这些任务需要快速得到响应，以让用户感觉到界面的流畅和即时性。
> 3. ==**Normal（普通）**==：该优先级用于处理一般的更新和计算任务，如**==渲染 UI、计算布局、数据处理==**等，这些任务的优先级较低，可以等待一段时间再执行，以免影响用户体验。
> 4. ==**Low（低）**==：该优先级用于处理一些较为次要的任务，如后台数据更新、网络请求等，这些任务的优先级最低，可以等待较长时间再执行，以避免影响其他任务的执行。
> 5. **==Idle（空闲）==**：该优先级用于处理一些非必要的任务，如统计、分析、预加载等，这些任务的优先级最低，可以在系统空闲时执行，以避免影响其他任务的执行。
>
> 这些优先级的划分，是为了让 React 在不同的场景下能够==根据任务的重要程度和紧急程度进行灵活的调度和执行==
>
> 在实际使用中，**==React 会根据任务的优先级和当前系统的负载情况等因素==**，**==自动地进行任务的调度和执行==**，以达到更好的用户体验和系统性能。

------

接下来改造`scheduleCallback`

先创建一些全局变量和工具方法

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
```

上面的这些全局变量中 `scheduleHostCallback` 需要重点注意，这个变量保存的是时间切片中具体执行的任务，有值表示任务还没执行完

------

实现`scheduleCallback`

```js
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

- **根据调用 `scheduleCallback` 时传入的任务优先级 `priorityLevel` 确定==任务过期时间==**

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

  - ==任务的优先级最终是通过任务「**过期时间**」来进行表示的，**任务优先级越高**，**任务过期时间越短**==

- **根据调用 `scheduleCallback` 时传入的任务回调 `callback`，创建新任务 `newTask`**

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

  ⚠️注意：任务的「**排序依赖**」 `sortIndex` 也就是任务的「**过期时间**」，这个排序依赖决定了后续任务再最小堆中处于何位置

-   **向任务最小堆里添加任务，排序的依据是过期时间**

  ```js
  push(taskQueue, newTask);
  ```

- **执行任务，刷新任务**

  ```js
  requestHostCallback(workLoop);
  ```

  - 从最小堆中获取任务，调度执行任务就是这里进行的

  - 调度执行就是==将任务提交到浏览器的「**宏任务队列**」中，并在下一个浏览器帧中执行== <!--这一点很重要-->
    - 「**宏任务**」是通过 **MessageChannel** 创建的

- **将创建的任务`newTask`返回出去**

  ```js
  return newTask;
  ```

  <!--这一点很重要，后面并发渲染时，需要将newTask记录到root上的callbackNode-->

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

`schedulePerformWorkUntilDeadline`

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

- **将==调度执行任务==的回调函数 `workLoop` 缓存在一个==全局变量 `scheduleHostCallback`==上**

  <!--这个全局变量保存的就是宏任务里要执行的具体逻辑，也就是调度任务，调度执行任务的逻辑在wookLoop中, workLoop稍后实现-->

- **创建一个==宏任务==，待浏览器完成渲染之后，执行==调度执行任务==的回调函数`workLoop`**

  ```js
  schedulePerformWorkUntilDeadline()
  ```

   `port2.postMessage` 发送消息，`port1` 的监听函数 `performWorkUntilDeadline `便会被放到「**宏任务队列**」中，`workLoop` 的执行在 `performWorkUntilDeadline `中

  <!--这里就是利用了MessageChannel来进行宏任务的创建，React中是通过MessageChannel或者setTimeOut（没有MessageChannel的情况）来实现自己的requestIdleCallback，来保证每次时间切片为5ms-->

------

实现**==宏任务==**的回调函数`performWorkUntilDeadline`

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

- 一个`performWorkUntilDeadline` 就是一个时间切片执行单元，这个单元中执行多少任务取决于全局变量 `scheduleHostCallback`（也就是`requestHostCallback(workLoop)中的workLoop`）中能完成多少任务；

- 当一个时间切片结束后，若 `scheduleHostCallback` 没有将最小堆中的所有任务执行完，也就是`hasMoreWork` 为 `true`，那么会再次 `schedulePerformWorkUntilDeadline`，**==再创建一个宏任务==**，也就是**==一个新的时间切片==**


------

实现`workLoop`（`scheduleHostCallback`）

‼️**==真正调度执行任务的逻辑在这里==**

```js
/**
 * @description 从任务队列taskQueue中获取任务执行
 */
function workLoop(startTime) {
  let currentTime = startTime;
  //取出优先级最高的任务
  currentTask = peek(taskQueue);
  while (currentTask !== null) {
    //如果此任务的过期时间小于当前时间，也就是说没有过期,并且时间片到期
    if (
      currentTask.expirationTime > currentTime &&
      shouldYieldToHost()
    ) {
      //跳出工作循环
      break;
    }
    //取出当前的任务中的回调函数
    const callback = currentTask.callback;
    if (typeof callback === 'function') {
      // 先清空任务上的回调
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

- ❗❗**执行当前任务`currentTask`**

  ```js
  // 先清空任务上的回调
  currentTask.callback = null;

  //执行工作，如果返回新的函数，则表示当前的工作没有完成
  const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
  const continuationCallback = callback(didUserCallbackTimeout);

  if (typeof continuationCallback === 'function') {
    currentTask.callback = continuationCallback;
    return true; //还有任务要执行
  }
  ```

  ⚠️**==这里有两点需要注意：==**

  - 执行当前任务的回调时传入的参数 `didUserCallbackTimeout`

    ```js
    const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
    const continuationCallback = callback(didUserCallbackTimeout);
    ```

    - `didUserCallbackTimeout` ：表示**==当前任务已经超时==**，后面的**==并发渲染==**中需要用到这个参数

  - 执行当前任务的回调，若返回值 `continuationCallback` 是个函数，则表明**==当前任务还没有执行完==**

    ```js
    if (typeof continuationCallback === 'function') {
      currentTask.callback = continuationCallback;
      return true; //还有任务要执行
    }
    ```

    - 这里将当前任务 `currentTask` 的 `callback` 重置为返回值 `continuationCallback`，并且直接`return true` 退出了 `workLoop`
    - 但是==当前任务 `currentTask` 并没有从最小堆中清出，只**是更新了`callback`**，也就是说**在下一个时间切片将仍然执行这个任务**== <!--很重要-->

    > `schedulePerformWorkUntilDeadline`中会走到这里
    >
    > ```js
    > if (hasMoreWork) {
    >   //继续执行
    >   schedulePerformWorkUntilDeadline();
    > }
    > ```
    >
    > 再次调用`schedulePerformWorkUntilDeadline`
    >
    > ```js
    > function schedulePerformWorkUntilDeadline() {
    >   port2.postMessage(null);
    > }
    > ```
    >
    > 重新创建一个宏任务，也就是一个新的时间切片
    >
    > 这也就是一个任务可以中断后再继续执行的原理，后面并发渲染中 `scheduleCallback` 传过来的`callback` 的返回值便是一个函数，一个任务分若干个时间切片来完成，有点断点续传的意思

- **判断是否要继续工作循环，执行任务**

  ```js
  if (
      currentTask.expirationTime > currentTime &&
      shouldYieldToHost()
    ) {
      //跳出工作循环
      break;
    }
  ```

  ⚠️**==注意这里判断要不要继续执行任务的逻辑==**

  - 跳出 `workLoop` 需要同时满足这两个条件：**==1、任务没过期；2、时间切片到期==**

    - 此任务的==过期时间小于当前时间==，也就是说**==没有过期==**

      ```js
      currentTask.expirationTime > currentTime
      ```


    - **==时间切片到期==**  <!--经过的时间大于5毫秒5ms-->
    
      ```js
      shouldYieldToHost() // true
      ```
    
      ```js
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
    
      - 所以当一个任务过期之后，不管时间切片时候到期都要将该任务执行完，因为任务过期之后，优先级会提升

  - **==跳出工作循环workLoop之后，当前任务如何切换到下个时间切片执行？==**

    ```js
    while (currentTask !== null) {
      //....
    }
    //如果循环结束还有未完成的任务，那就表示hasMoreWork=true
    if (currentTask !== null) {
      return true;
    }
    ```

    - 退出`workLoop`之后，若是还有任务，则直接`return true`，切换下一个时间切片

  - **任务执行完，将该任务从最小堆中删除**


  ```js
  if (currentTask === peek(taskQueue)) {
      pop(taskQueue);
    }
  ```

  - **从最小堆中取出新的任务，继续`workLoop`**


  ```js
  while (currentTask !== null) {
    //....

    //如果当前的任务执行完了，或者当前任务不合法，取出下一个任务执行
    currentTask = peek(taskQueue);
  }
  ```


------

到这里`scheduleCallback`就改造完成了，再回顾下整体流程👇

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/duo_ge_ren_wu_1643279818108.jpg)

`scheduleCallback` 的核心任务就是在 `Deadline` 之前从 `taskQueue` 按照优先级取出任务进行执行，复杂的逻辑在 `workLoop` 中：

1、**一个完整任务的分段执行**

2、**检查任务过期时间和时间切片剩余时间**

------

接下来在 `ReactFiberWorkLoop.js` 中使用 `scheduleCallback`

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

由于**Lane模型**还没实现，同步渲染和并发渲染也都没有完整实现，所以这里的新 `scheduleCallback` 暂时和之前的 `scheduleCallback` 就表现上没有什么差别，页面可以正常渲染即可

### 三、总结

**Scheduler** 是 **React 18** 中实现任务调度的核心模块，主要包含以下几个关键部分：

1. **数据结构**：
   - 使用**最小堆**实现任务队列
   - 基于**完全二叉树**，保证任务按优先级排序
   - 支持任务的动态插入和删除

2. **优先级机制**：
   - 定义了 5 个优先级级别（**Immediate**、**UserBlocking**、**Normal**、**Low**、**Idle**）
   - 通过**过期时间**控制任务优先级
   - 优先级越高，过期时间越短

3. ❗❗**时间切片**：
   - ==使用 **MessageChannel** 创建宏任务==
   - ==每个时间切片为 5ms==
   - 支持任务的断点续传
   - **任务拆分机制**：
     - 通过 `workLoop` 函数在时间切片内执行任务
     - 任务执行过程中通过 `shouldYieldToHost` 检查时间切片是否到期
     - 当时间切片到期时，通过 `continuationCallback` 机制保存任务状态
     - 任务状态保存后，通过 `schedulePerformWorkUntilDeadline` 创建新的宏任务
     - 新的宏任务触发时，从保存的状态继续执行任务
     - 这种机制确保了长任务不会阻塞主线程，同时保证了任务的连续性

4. **调度流程**：
   - 任务创建：根据优先级设置过期时间
   - 任务入队：按优先级加入最小堆
   - 任务执行：在时间切片内执行任务
   - 任务中断：时间切片到期或任务过期

通过这种设计，**Scheduler** 实现了高效的任务调度，既保证了用户交互的及时响应，又避免了长时间任务阻塞主线程

