## React18源码解析（十七）Lane模型下的更新渲染与并发渲染

### 一、前言

首先回顾下 `scheduleUpdateOnFiber` 的流程👇

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/scheduleUpdateOnFiber1_1667713205987.jpg" alt="img" style="zoom:50%;" />

这张图中有两个 **API** 很重要，用于在不同的渲染模式下执行更新操作：

- **同步更新模式下的 API：`performSyncWorkOnRoot`**

  它会==立即执行所有更新操作，并阻塞 **UI** 渲染直到更新完成==，这个 **API** 在以前的版本中是默认使用的，但在 **React 18** 中，它被视为一种备用的更新模式，仅在需要精确控制更新过程时使用

- **Concurrent Mode 下的 API：`performConcurrentWorkOnRoot`**

  它可以==将更新任务分解为多个小任务，并将这些小任务分配到多个帧中执行==，以提高应用程序的性能和用户体验 <!--每个小任务执行完成后，会检查更新任务是否过期，过期了则不继续拆分，而是直接同步渲染一次性执行完成-->

前面已经实现了 **Concurrent Mode** 下的同步渲染：`performConcurrentWorkOnRoot` + `renderRootSync`👇

![image-20230302215730401](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230302215730401-20230305202613301.png)

接下来就要实现**同步更新**：`performSyncWorkOnRoot`👇

![image-20230305203330571](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230305203330571.png)

和 **Concurrent Mode** 下的并发渲染：`performConcurrentWorkOnRoot` + `renderRootConcurrent`👇

![image-20230305205537793](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230305205537793.png)

### 二、同步更新模式

![image-20230305203330571](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230305203330571.png)

首先改造下 `main.js`

```jsx
import * as React from 'react';
import { createRoot } from 'react-dom/client';

function FunctionComponent() {
  const [number, setNumber] = React.useState(0);
  return <button onClick={() => {
    setNumber(number + 1)
  }}>{number}</button>
}
let element = <FunctionComponent />;
const root = createRoot(document.getElementById('root'));
root.render(element);
```

再回顾下 `ensureRootIsScheduled(root)`

```js
/**
 * @description 确保执行 root 上的更新
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
    //...
  }
}
```

在前面的实现中👇这块逻辑并未补全，现在就是要实现这里

```js
if (newCallbackPriority === SyncLane) {
  //如果新的优先级是同步的话
  // TODO
}
```

注意这个判断条件 `if (newCallbackPriority === SyncLane)`，只有当 `root` 上的优先级最高的 `lane` 是 `SyncLane`(1)，才会走同步更新的逻辑，而用户的点击操作触发的更新则正是 `SyncLane`(1)

------

所以需要先实现**事件操作时的优先级设置**👇

在 `src/react-dom-bindings/src/events/ReactDOMEventListener.js` 中，改造合成事件中派发离散事件的的监听函数：`dispatchDiscreteEvent`

```js
import {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  getCurrentUpdatePriority,
  setCurrentUpdatePriority
} from 'react-reconciler/src/ReactEventPriorities';

//...

/**
 * 派发离散的事件的的监听函数
 * @param {*} domEventName 事件名 click
 * @param {*} eventSystemFlags 阶段 0 冒泡 4 捕获
 * @param {*} container 容器 div#root
 * @param {*} nativeEvent 原生的事件 浏览器给的 event 参数
 */
function dispatchDiscreteEvent(
  domEventName,
  eventSystemFlags,
  container,
  nativeEvent
) {
  //点击的时候，需要设置更新优先级
  //先获取当前老的更新优先级
  const previousPriority = getCurrentUpdatePriority();
  try {
    //把当前的更新优先级设置为离散事件优先级 1
    setCurrentUpdatePriority(DiscreteEventPriority);
    dispatchEvent(
      domEventName,
      eventSystemFlags,
      container,
      nativeEvent
    );
  } finally {
    setCurrentUpdatePriority(previousPriority);
  }
}
```

这里增加的逻辑是：`onClick` 事件被触发后，在执行监听函数之前将当前的更新优先级设置为离散事件优先级(`DiscreteEventPriority` 1) ，待监听函数执行完成后再将当前优先级重置为之前的优先级

看下 `main.jsx` 中的监听函数👇

```jsx
 <button onClick={() => {
    setNumber(number + 1)
  }}>{number}</button>
```

点击事件发生后，先将当前优先级设置为 `DiscreteEventPriority` (1)，再执行 `setNumber(number + 1)`

`setNumber(number + 1)` 是 `useState` 的 `dispatch` 方法👇

```diff
// src/react-reconciler/src/ReactFiberHooks.js
/**
 * @description useState 的更新方法
 * @param {*} fiber function 对应的 fiber
 * @param {*} queue hook 对应的更新队列
 * @param {*} action 派发的动作
 */
function dispatchSetState(fiber, queue, action) {
  // 获取当前的更新赛道 1
+ const lane = requestUpdateLane();

  //...

  //下面是真正的入队更新，并调度更新逻辑
+ const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
  scheduleUpdateOnFiber(root, fiber, lane);
}
```

所以在 `dispatchSetState` 中获取当前更新的赛道

```js
const lane = requestUpdateLane();
```

获取到的 `lane` 便是 `dispatchDiscreteEvent` 中设置的 `DiscreteEventPriority` (1) 也就是 `SyncLane`(1)

再将 `lane` 和更新内容一起入队

```js
const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
```

最后在调用 `scheduleUpdateOnFiber` 触发更新，这样就能走到

```js
/**
 * @description 确保执行 root 上的更新
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
    //...
  }
}
```

而且这时 `newCallbackPriority === SyncLane`

------

那么接下来便完善同步更新的逻辑

```js
if (newCallbackPriority === SyncLane) {
  //如果新的优先级是同步的话
  // TODO
}
```

完善后的

```js
/**
 * @description 确保执行 root 上的更新
 */
function ensureRootIsScheduled(root) {
  //获取当前优先级最高的车道
  const nextLanes = getNextLanes(root, NoLanes); //16
  //获取新的调度优先级
  let newCallbackPriority = getHighestPriorityLane(nextLanes); //16
  if (newCallbackPriority === SyncLane) {
    //如果新的优先级是同步的话

    //先把 performSyncWorkOnRoot 添回到同步队列中
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    //再把 flushSyncCallbacks 放入微任务
    queueMicrotask(flushSyncCallbacks);
  } else {
    //如果不是同步，就需要调度一个新的任务
    // 调度的优先级
    //...
  }
}
```

增加的逻辑：

- **将同步更新的方法：`performSyncWorkOnRoot` 添加到同步队列中**

  ```js
  scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
  ```

- **再将执行同步队列任务的方法：`flushSyncCallbacks` 放入微任务**

  ```js
  queueMicrotask(flushSyncCallbacks);
  ```

**==同步更新会创建一个微任务==**，在当前宏任务同步代码执行完成后 <!--点击事件的事件监听函数-->，立刻执行 `flushSyncCallbacks`，从将 `performSyncWorkOnRoot` 从队列中取出执行，完成更新

------

在 `src/react-reconciler/src/ReactFiberSyncTaskQueue.js` 中实现 `scheduleSyncCallback` 和 `flushSyncCallbacks`

```js
import {
  DiscreteEventPriority,
  getCurrentUpdatePriority,
  setCurrentUpdatePriority
} from './ReactEventPriorities';

//同步队列
let syncQueue = null;
//是否正在执行同步队列
let isFlushingSyncQueue = false;

export function scheduleSyncCallback(callback) {
  if (syncQueue === null) {
    syncQueue = [callback];
  } else {
    syncQueue.push(callback);
  }
}

export function flushSyncCallbacks() {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    isFlushingSyncQueue = true;
    let i = 0;
    //暂存当前的更新优先级
    const previousUpdatePriority = getCurrentUpdatePriority();
    try {
      const isSync = true;
      const queue = syncQueue;
      //把优先级设置为同步优先级
      setCurrentUpdatePriority(DiscreteEventPriority);
      for (; i < queue.length; i++) {
        let callback = queue[i];
        do {
          callback = callback(isSync);
        } while (callback !== null);
      }
      syncQueue = null;
    } finally {
      setCurrentUpdatePriority(previousUpdatePriority);
      isFlushingSyncQueue = false;
    }
  }
}
```

`scheduleSyncCallback` 和 `flushSyncCallbacks` 都不复杂

------

再回顾下 `performSyncWorkOnRoot`

```js
/**
 * 在根上执行同步工作
 */
function performSyncWorkOnRoot(root) {
  //获得最高优的 lane
  const lanes = getNextLanes(root);
  //渲染新的 fiber 树
  renderRootSync(root, lanes);
  //获取新渲染完成的 fiber 根节点
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
  return null;
}
```

最终在微任务中执行 `performSyncWorkOnRoot`，完成新 `fiber` 树的创建，并提交更新，完成更新渲染

到这里同步更新模式的更新逻辑就实现完成了，看下实现效果

点击事件触发 `ensureRootIsScheduled` 的调用栈

![image-20230305215752012](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230305215752012.png)

微任务中 `performSyncWorkOnRoot` 的调用栈

![image-20230305215841173](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230305215841173.png)

最后的更新结果

![image-20230305220002107](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230305220002107.png)

### **三、Concurrent Mode** 下的并发渲染

接下来实现并发渲染，利用 `scheduler` 的时间切片**==将更新任务分解为多个小任务，并将这些小任务分配到多个帧中执行==**

![image-20230305205537793](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230305205537793.png)

首先创建三个变量用于==记录当前任务的执行状态==

```js
//src/react-reconciler/src/ReactFiberWorkLoop.js

//构建 fiber 树正在进行中
const RootInProgress = 0;
//构建 fiber 树已经完成
const RootCompleted = 5;
//当渲染工作结束的时候当前的 fiber 树处于什么状态,默认进行中
let workInProgressRootExitStatus = RootInProgress;
```

------

然后在 `ensureRootIsScheduled` 中给 `root` 添加 `callbackNode` 用来==记录当前正在执行的任务==

```js
/**
 * @description 确保执行 root 上的更新
 */
function ensureRootIsScheduled(root) {
//...

  //新的回调任务
  let newCallbackNode;

  if (newCallbackPriority === SyncLane) {
    //如果新的优先级是同步的话
    //...
  } else {
    //如果不是同步，就需要调度一个新的任务

    //...

    // 调度执行更新任务
    // newCallbackNode 是 scheduleCallback 创建的任务 newTask
    // newTask.callback 是 performConcurrentWorkOnRoot
    newCallbackNode = Scheduler_scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }
  //在根节点记录当前执行的任务是 newCallbackNode
  root.callbackNode = newCallbackNode;
}
```

`root.callbackNode` 上记录的是 `Scheduler_scheduleCallback` 的返回值，也就是最小堆中存放的 `task`，`task.callback` 是 `performConcurrentWorkOnRoot`

```js
// src/scheduler/src/forks/Scheduler.js

/**
 * 按优先级执行任务
 * @param {*} priorityLevel 优先级
 * @param {*} callback 任务回调
 */
function scheduleCallback(priorityLevel, callback) {
  //...

  // 新建任务
  const newTask = {
    id: taskIdCounter++,
    callback, //回调函数或者说任务函数
    priorityLevel, //优先级别
    startTime, //任务的开始时间
    expirationTime, //任务的过期时间
    sortIndex: expirationTime //排序依赖，过期时间越短优先级越高
  };

  //..
  return newTask;
}
```

------

接着改造 `performConcurrentWorkOnRoot`

```js
/**
 * @description 执行root上的并发更新工作
 * @description 根据虚拟DOM构建fiber树,要创建真实的DOM节点
 * @description 还需要把真实的DOM节点插入容器
 * @param root  根 FiberRootNode
 */
function performConcurrentWorkOnRoot(root, didTimeout) {
  console.log('performConcurrentWorkOnRoot', didTimeout);

  //...

  //如果不包含阻塞的车道，并且没有超时，就可以并行渲染,就是启用时间分片
  //所以说默认更新车道是同步的,不能启用时间分片
  const shouldTimeSlice = !includesBlockingLane(root, lanes) && !didTimeout;

  /**
   * 执行渲染，得到退出的状态，也就是fiber树的构建状态，null or 进行中 or 完成
   * 同步渲染renderRootSync返回null,等价于完成状态，因为同步渲染不会中断
   * 并发渲染renderRootConcurrent会走时间切片逻辑，5ms没将fiber树构建完成就会退出
   */
  const exitStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes)
    : renderRootSync(root, lanes);

  //如果不是渲染中的话，那说明肯定渲染完了
  // RootInProgress表示构建fiber树正在进行中
  if (exitStatus !== RootInProgress) {
    //开始进入提交阶段，就是执行副作用，修改真实DOM
    const finishedWork = root.current.alternate;
    // FiberRootNode上记录新HostRootFiber
    root.finishedWork = finishedWork;
    commitRoot(root);
  }

  //说明任务没有完成
  if (root.callbackNode === originalCallbackNode) {
    /**
     * 将此函数返回，下个时间切片继续执行
     * scheduler中的workLoop中判断若是callback返回值是函数，
     * 则任务继续，最小堆中任务没有被清出
     * 下个时间切片继续执行这个任务
     * 另外由于全局变量workInProgress记录下了fiber树构建到哪个节点
     * 所以保证了下个时间切片中可以从正确的fiber节点继续构建
     */
    return performConcurrentWorkOnRoot.bind(null, root);
  }
  return null;
}
```

- **是否开启时间切片的判断 `shouldTimeSlice`**

  ```js
  const shouldTimeSlice = !includesBlockingLane(root, lanes) && !didTimeout;
  ```

  其中`includesBlockingLane`有改动

  ```diff
  // src/react-reconciler/src/ReactFiberLane.js

  export function includesBlockingLane(root, lanes) {
    //如果允许默认并行渲染
  +  if (allowConcurrentByDefault) {
  +    return false;
  +  }

    const SyncDefaultLanes = InputContinuousLane | DefaultLane;
    return (lanes & SyncDefaultLanes) !== NoLanes;
  }
  ```

  ```js
  // src/shared/ReactFeatureFlags.js
  export const allowConcurrentByDefault = true;
  ```

  `allowConcurrentByDefault`，**React 18** 版本中这个值为 true，表示==默认开启并发渲染==

  所以==**Concurrent Mode** 下**初次渲染**走的是并发渲染==

- **渲染之后返回的任务状态：`exitStatus`**

  ```js
  const exitStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes)
    : renderRootSync(root, lanes);
  ```

  `exitStatus`：执行渲染，得到退出的状态，也就是`fiber`树的构建状态，有三种值：`null` 、 `RootInProgress`（进行中）、`RootCompleted`（完成）

     * 同步渲染`renderRootSync`返回`null`，等价于完成状态，因为==同步渲染不会中断==
     * 并发渲染`renderRootConcurrent`会走**==时间切片==**逻辑，
          * 5ms内将`fiber`树构建完成，返回`RootCompleted`
          * 5ms没将`fiber`树构建完成就会退出，返回`RootInProgress`

   - **判断渲染之后返回的任务状态`exitStatus`**

        - 若`exitStatus`为`RootCompleted`，则**==直提交更新==**

          ```js
          //如果不是渲染中的话，那说明肯定渲染完了
          // RootInProgress表示构建fiber树正在进行中
          if (exitStatus !== RootInProgress) {
            //开始进入提交阶段，就是执行副作用，修改真实DOM
            const finishedWork = root.current.alternate;
            // FiberRootNode上记录新HostRootFiber
            root.finishedWork = finishedWork;
            commitRoot(root);
          }
          ```

     - 若`exitStatus`为`RootInProgress`，则**==进入下个时间切片==**

       ```js
       //说明任务没有完成
       if (root.callbackNode === originalCallbackNode) {
         /**
          * 将此函数返回，下个时间切片继续执行
          * scheduler中的workLoop中判断若是callback返回值是函数，
          * 则任务继续，最小堆中任务没有被清出
          * 下个时间切片继续执行这个任务
          * 另外由于全局变量workInProgress记录下了fiber树构建到哪个节点
          * 所以保证了下个时间切片中可以从正确的fiber节点继续构建
          */
         return performConcurrentWorkOnRoot.bind(null, root);
       }
       ```

       `root.callbackNode`会在`commit`中被置空，若是`root.callbackNode`仍有值则说明没有走到`commit`阶段，任务仍未完成，那么将会将自己（`performConcurrentWorkOnRoot`）返回出去给`scheduler`，==在下个时间切片中继续执行==

       ```js
       // src/scheduler/src/forks/Scheduler.js
       
       function workLoop(startTime) {
         //...
         while (currentTask !== null) {


           if (typeof callback === 'function') {
             // 先清空任务上的回调
             currentTask.callback = null;
             //执行工作，如果返回新的函数，则表示当前的工作没有完成
             const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
    
             const continuationCallback = callback(didUserCallbackTimeout);
    
             if (typeof continuationCallback === 'function') {
               currentTask.callback = continuationCallback;
               return true; //还有任务要执行
             }
    
             //...
           }
    
           //...
       }
       ```
    
       其中
    
       ```js
        const continuationCallback = callback(didUserCallbackTimeout);
       ```
    
       `callback`便是`performConcurrentWorkOnRoot`，这里将`callback`的返回值（还是`performConcurrentWorkOnRoot`）继续赋值给`currentTask.callback` ，那么这个任务`currentTask`在下次时间切片中便可以继续执行
    
       至于==**下个切片中是如何接着执行的**==，这取决于**==全局变量`workInProgress`记录下了fiber树构建到哪个节点==**，**==`workInProgress`保证了下个时间切片中可以从正确的fiber节点继续构建==**

------

实现`renderRootConcurrent`

```js
/**
 * @description 并发渲染方法
 */
function renderRootConcurrent(root, lanes) {
  //因为在构建fiber树的过程中，此方法会反复进入，会进入多次
  //只有在第一次进来的时候会创建新的fiber树，或者说新fiber
  if (
    workInProgressRoot !== root ||
    workInProgressRootRenderLanes !== lanes
  ) {
    prepareFreshStack(root, lanes);
  }

  /**
   * 在当前分配的时间片(5ms)内执行fiber树的构建或者说渲染
   * 一个fiber单元performUnitOfWork计算完成后，
   * 会调用scheduler的shouldYield判断当前时间切片是过期
   * 若是过期则退出循环，这里继续往下走
   * 返回fiber树的构建状态
   */
  workLoopConcurrent();

  /**
   * 如果 workInProgress不为null，说明fiber树的构建还没有完成
   * fiber树构建完成时，workInProgress为HostRootFiber的return，也就是null
   */
  if (workInProgress !== null) {
    // 返回RootInProgress表示构建fiber树还正在进行中
    return RootInProgress;
  }

  /**
   * 如果workInProgress是null了说明渲染工作完全结束了
   * 返回workInProgressRootExitStatus(当前的fiber树处于什么状态 进行中 or 完成)
   * completeUnitOfWork最后会将workInProgressRootExitStatus改成完成
   */
  return workInProgressRootExitStatus;
}
```

`renderRootConcurrent`的实现和之前同步的渲染方法`renderRootSync`基本一致

- 根据老的`fiber`树创建一个全新的`fiber`树：`prepareFreshStack(root, lanes)`
- 执行工作循环完成新`fiber`树的构建：`workLoopConcurrent()` <!--同步渲染的是workLoopSync方法-->

------

实现`workLoopConcurrent`

```js
/**
 * @description 并发模式的工作循环方法
 */
function workLoopConcurrent() {
  /*
    ‼️重要重要重要
    如果有下一个要构建的fiber并且时间片没有过期就继续循环
    若是shouldYield返回true表示当前时间切片过期了，需要退出循环
    退出循环后renderRootConcurrent中会返回一个值，表示当前fiber树是否构建完成
    shouldYield是scheduler中用来判断时间切片是否过期的方法
   */
  while (workInProgress !== null && !shouldYield()) {
    sleep(1000);
    performUnitOfWork(workInProgress);
  }
  console.log('shouldYield()', shouldYield());
}
```

其中单个`fiber`工作单元的处理方法：`performUnitOfWork`是直接复用的，和同步渲染是一致的

`sleep(1000)`是一段测试代码

```js
function sleep(duration) {
  const timeStamp = new Date().getTime();
  const endTime = timeStamp + duration;
  while (true) {
    if (new Date().getTime() > endTime) {
      return;
    }
  }
}
```

通过`sleep(1000)`可以使一个 **fiber** 工作单元的执行时间大于5ms，一个时间切片的时间，可以让我们明显的观察到并发渲染

------

接下来看下实现效果

jsx

```jsx
function FunctionComponent() {
  const [number, setNumber] = React.useState(0);
  return <button onClick={() => {
    setNumber(number + 1)
  }}>{number}</button>
}
let element = <FunctionComponent />;
```

![image-20230306002206899](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230306002206899.png)

可以看到三个`fiber`节点，每个`fiber`节点构建时都走了一遍`performConcurrentWorkOnRoot`方法，也就是说总共有三次「时间切片」，这就是**React**的**==并发渲染==**，==将一个任务拆分为若干个小任务，在每一帧中执行（每个时间切片），保证了不会阻塞UI==

需要明确的一点，只有 **fiber** 树的构建能进行拆分，==最后的 **commit** 阶段是不能拆分的，是一气呵成的完成真实 **DOM** 的挂载==

