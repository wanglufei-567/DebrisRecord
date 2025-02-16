## React18源码解析（四）理解fiber

### 一、链表数据结构

什么是链表？

> 链表 [Linked List]：链表是由一组不必相连【不必相连：可以连续也可以不连续】的内存结构【节点】，按特定的顺序链接在一起的抽象数据类型
>
> 抽象数据类型（Abstract Data Type [ADT]）：表示数学中抽象出来的一些操作的集合
> 内存结构：内存中的结构，如：struct、特殊内存块...等等之类

链表常用的有 3 类： 单向链表、双向链表、循环链表

- 单向链表

  ![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/dan_xiang_lian_biao_1644749400974.jpg)

- 双向链表

  ![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/shuang_xiang_lian_biao_1644749407158.jpg)

- 循环链表

  ![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/xun_huan_lian_biao_1644749414532.jpg)

<!--react的更新队列就是一个循环列表，链表动态插入、删除节点高效，随机访问效率低；数组随机访问效率高，插入、删除操作效率低-->

#### 1.1、循环链表示例

下面简单实现一个 **React** 的更新队列

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/queuepending_1644750048819.png" alt="img" style="zoom:50%;" />

```js
const UpdateState = 0;

/**
 * @description 初始化更新队列的方法
 * @param fiber 一个fiber对象
 */
function initializeUpdateQueue(fiber) {
  // 创建一个更新队列对象
  const queue = {
    shared: {
      pending: null
    }
  };
  // 给fiber对象上添加属性updateQueue指向更新队列
  fiber.updateQueue = queue;
}

/**
 * @description 创建更新的方法
 * @returns 返回值是一个对象
 */
function createUpdate() {
  const update = { tag: UpdateState };
  return update;
}

/**
 * @description 将更新对象添加到更新队列中的方法
 * @param fiber 初始的fiber对象
 * @param update 更新对象
 */
function enqueueUpdate(fiber, update) {
  // 获取初始fiber对象上pending属性
  const updateQueue = fiber.updateQueue;
  const sharedQueue = updateQueue.shared;
  const pending = sharedQueue.pending;

  if (pending === null) {
    // 若pending为null，则说明队列中还没有更新对象，则将更新对象的next指向自己
    update.next = update;
  } else {
    /**
     * 若pending不为null，则说明队列中已经有更新对象了
     * 则将该更新对象插入到队列中
     * 该更新对象的next指向原来pending的next
     * 原来pending的next指向该更新对象
     */
    update.next = pending.next;
    pending.next = update;
  }

  // pending 永远指向最后面的更新对象，最后面的更新对象的next永远指向第一个更新对象
  updateQueue.shared.pending = update;
}


function getStateFromUpdate(update, prevState) {
  switch (update.tag) {
    case UpdateState: {
      const { payload } = update;
      const partialState = payload;
      return Object.assign({}, prevState, partialState);
    }
    default:
      return prevState;
  }
}

/**
 * @description 合并更新队列中的所有更新对象
 * @param workInProgress 包含更新队列的fiber对象
 */
function processUpdateQueue(workInProgress) {
  // 先获取到队列中的最后一个更新对象，也就是pending的指向
  const queue = workInProgress.updateQueue;
  const pendingQueue = queue.shared.pending;

  if (pendingQueue !== null) {
    // 将循环链表的链断掉，变成单向链表
    queue.shared.pending = null;
    const lastPendingUpdate = pendingQueue;
    const firstPendingUpdate = lastPendingUpdate.next;
    lastPendingUpdate.next = null;

    let newState = workInProgress.memoizedState;
    let update = firstPendingUpdate;

    // 从第一个更新对象开始，不断地合并更新信息到初始fiber对象中去
    while (update) {
      newState = getStateFromUpdate(update, newState);
      update = update.next;
    }
    workInProgress.memoizedState = newState;
  }
}

let fiber = { memoizedState: { id: 1 } };

initializeUpdateQueue(fiber);

let update1 = createUpdate();
update1.payload = { name: 'zhufeng' };
enqueueUpdate(fiber, update1);

let update2 = createUpdate();
update2.payload = { age: 14 };
enqueueUpdate(fiber, update2);

processUpdateQueue(fiber);

console.log(fiber);
```

打印结果如下👇：

```shell
{
  memoizedState: { id: 1, name: 'zhufeng', age: 14 },
  updateQueue: { shared: { pending: null } }
}
```

上面的实现中比较绕的地方在与`pending`指向的变化👇

```js
function enqueueUpdate(fiber, update) {
  // 获取初始fiber对象上pending属性
  const updateQueue = fiber.updateQueue;
  const sharedQueue = updateQueue.shared;
  const pending = sharedQueue.pending;

  if (pending === null) {
    // 若pending为null，则说明队列中还没有更新对象，则将更新对象的next指向自己
    update.next = update;
  } else {
    /**
     * 若pending不为null，则说明队列中已经有更新对象了
     * 则将该更新对象插入到队列中
     * 该更新对象的next指向原来pending的next
     * 原来pending的next指向该更新对象
     */
    update.next = pending.next;
    pending.next = update;
  }

  // pending 永远指向最后面的更新对象，最后面的更新对象的next永远指向第一个更新对象
  updateQueue.shared.pending = update;
}
```

结合着上面的图示一起看比较容易理解，主要就做了两件事：

- 更新对象插入到 `pending` 后面
- 插入完成之后，`pending` 改变指向到最新的更新对象上

只需记住 `pending`  永远指向「**最后**一个更新对象」，而最后一个更新对象的 `next` 永远指向第一个更新对象，即 `pending.next` 指向的是第一个更新对象，剩下的就是从第一个更新对象开始逐级合并更新对象

### 二、树的遍历

树的遍历分为深度遍历（左）和广度遍历（右）两种：

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/dfs_he_bfs1_1644891966511.jpg)

#### 2.1、深度遍历（DFS）

深度优先搜索英文缩写为 **DFS** （即 **Depth First Search**）

其过程简要来说是对每一个可能的分支路径深入到不能再深入为止，而且每个节点只能访问一次

应用场景

- **React** 虚拟 **DOM** 的构建
- **React** 的 **fiber** 树构建

```js
function dfs(node) {
  console.log(node.name);
  node.children &&
    node.children.forEach((child) => {
      dfs(child);
    });
}
let root = {
  name: "A",
  children: [
    {
      name: "B",
      children: [{ name: "B1" }, { name: "B2" }],
    },
    {
      name: "C",
      children: [{ name: "C1" }, { name: "C2" }],
    },
  ],
};
dfs(root);
```

#### 2.2、广度遍历（BFS）

宽度优先搜索算法（又称广度优先搜索），其英文全称是 **Breadth First Search**

算法首先搜索距离为`k`的所有顶点，然后再去搜索距离为`k+l`的其他顶点

```js
function bfs(node) {
  const stack = [];
  stack.push(node);
  let current;
  while ((current = stack.shift())) {
    console.log(current.name);
    current.children &&
      current.children.forEach((child) => {
        stack.push(child);
      });
  }
}
let root = {
  name: "A",
  children: [
    {
      name: "B",
      children: [{ name: "B1" }, { name: "B2" }],
    },
    {
      name: "C",
      children: [{ name: "C1" }, { name: "C2" }],
    },
  ],
};
bfs(root);
```

### 三、fiber是什么

#### 3.1、屏幕刷新率

- 目前大多数设备的屏幕刷新率为 **60 次/s** （**16ms / 次**）

- **浏览器渲染动画或页面的每一帧的速率也需要跟设备屏幕的刷新率保持一致**

- **页面是一帧一帧绘制出来的，当每秒绘制的帧数（FPS）达到 60 时，页面是流畅的，小于这个值时，用户会感觉到卡顿**

  <!--可以类比幻灯片去理解屏幕刷新和卡顿，将屏幕的刷新率理解为单位时间内画框中能更新的幻灯片数量，这个是基于硬件的标准，是保持不变的；每张幻灯片上的内容需要一定时间去绘制，若下一张幻灯片的切换时间到了，但该幻灯片还没绘制好，那便不进行替换，画框中仍然显示上一张幻灯片，直到下一张绘制完成并在画框更新幻灯片时替换上去-->

- 每个帧的预算时间是 16.66 毫秒 (1 秒/60)

- 1s 60 帧，所以每一帧分到的时间是 1000/60 ≈ 16 ms,所以我们书写代码时力求不让一帧的工作量超过 16ms

  <!--每一帧16.6ms，其中5ms左右的空闲时间，16.6ms是通过60Hz计算出来的，5ms是一个平均值-->

#### 3.2、帧

- 每个帧的开头包括样式计算、布局和绘制
- 浏览器的 **Javascript** 引擎和页面渲染引擎在同一个渲染线程，「**GUI 渲染**」和「 **Javascript 执行**」两者是互斥的
- 如果某个任务执行时间过长，浏览器会推迟渲染

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/lifeofframe.jpg" alt="lifeofframe" style="zoom:200%;" />

#### 3.3、浏览器性能瓶颈

- **Javascript** 任务执行时间过长
  - 浏览器刷新频率为 60Hz，大概 16.6 毫秒渲染一次，而 **Javascript** 线程和渲染线程是**==互斥==**的，所以如果 **Javascript** 线程执行任务时间超过 16.6ms 的话，就会导致==**掉帧**==，导致==**卡顿**==，解决方案就是 **React** 利用空闲的时间进行更新，不影响渲染引擎的渲染
  - 把一个耗时任务切分成一个个小任务，分布在每一帧里的方式就叫**==时间切片==**

#### 3.4、 requestIdleCallback

- 我们希望快速响应用户，让用户觉得够快，不能阻塞用户的交互
- `requestIdleCallback` **使开发者能够在主事件循环上执行后台和低优先级工作，而不会影响延迟关键事件，如动画和输入响应**
- 正常帧任务完成后没超过 16 ms,说明时间有富余，此时就会执行 `requestIdleCallback` 里注册的任务

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/cooperativescheduling2.jpg" alt="cooperativescheduling2" style="zoom:50%;" />

举个🌰：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <script>
      function sleep(d) {
        for (var t = Date.now(); Date.now() - t <= d; );
      }
      const works = [
        () => {
          console.log("第1个任务开始");
          sleep(20); //sleep(20);
          console.log("第1个任务结束");
        },
        () => {
          console.log("第2个任务开始");
          sleep(20); //sleep(20);
          console.log("第2个任务结束");
        },
        () => {
          console.log("第3个任务开始");
          sleep(20); //sleep(20);
          console.log("第3个任务结束");
        },
      ];

      requestIdleCallback(workLoop);
      function workLoop(deadline) {
        console.log("本帧剩余时间", parseInt(deadline.timeRemaining()));
        while (deadline.timeRemaining() > 1 && works.length > 0) {
          performUnitOfWork();
        }
        if (works.length > 0) {
          console.log(
            `只剩下${parseInt(
              deadline.timeRemaining()
            )}ms,时间片到了等待下次空闲时间的调度`
          );
          requestIdleCallback(workLoop);
        }
      }
      function performUnitOfWork() {
        works.shift()();
      }
    </script>
  </body>
</html>
```

上面这段代码中每个任务的执行时间都超过了20ms，执行结果👇：

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20221009084627525.png" alt="image-20221009084627525" style="zoom:50%;" />

可以看到，三个任务是分三次切片执行的

#### 3.5、fiber架构

==由于浏览器的「**性能瓶颈**」的客观存在，**React** 采用**时间切片**的思想，通过**调度策略**合理分配 **CPU** 资源，**提高用户的响应速度**，从而解决了这个问题，这个种「**调度策略**」正是 **Fiber 架构**==

==通过 **Fiber** 架构，**React** 可以让自己的「调和过程」变成「**可被中断**」，适时地让出 **CPU** 执行权，可以让浏览器及时地响应用户的交互==

<!--这个很重要，也是 fiber 架构的意义，让浏览器优先执行如渲染、布局、绘制、时间响应等任务，高优响应用户的交互，react 自己的计算任务进行切片处理-->

不过 **React** 并没有使用浏览器提供`requestIdleCallback` **API**，而是自己实现了一个类似的机制

**React**之所以没有使用`requestIdleCallback`，是因为下面👇这两个问题：

- ==**兼容性问题**== <!--不同浏览器对requestIdleCallback的实现不一致-->
- ==**执行时间不可控**==<!--从上面的requestIdleCallback示例也可以发现，每次空闲时间不固定-->

所以 **React** 自己实现了一个类似`requestIdleCallback`的机制，里面把每帧执行时间固定为**==5ms==**；

**如何理解 fiber？**

可以从下面👇两个维度来理解 **fiber**：

##### 3.5.1、fiber 是一个执行单元

每次执行完一个执行单元， **React** 就会检查现在还剩多少时间，如果没有时间就将控制权让出去

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/fiberflow.jpg" alt="fiberflow" style="zoom:50%;" />

==这里需要注意的是，**fiber** 作为一个**执行单元**，是具备「**原子性**」的==

> 原子性即一个操作或者多个操作，要么全部执行并且执行的过程不会被任何因素打断，要么就都不执行
>
> 原子性就像数据库里面的事务一样，他们是一个团队，同生共死，一个很经典的例子就是银行账户转账问题

也就是说，**==一个 fiber 执行单元是不可被打断的==**，那就是说，**==若单个执行单元执行时间过长，浏览器仍然会卡顿==**

<!--其实requestIdleCallback中也是这样的，若在空闲时间中执行任务时间过长，浏览器也还是会卡顿-->

这种调度方式被称为：==「**合作式调度**」==，是用户和浏览器双方的合作

- 用户相信浏览器会在空闲时间帮助执行任务，浏览器相信用户时间到了会把控制权还回去，**两者之间是相互信任的**
- 若时间到了用户没有将控制权还回去，那么浏览器便会出现卡顿的现象

##### 3.5.2、fiber 是一种数据结构

**React** 目前使用的是==**链表**==来表示 `fiber`, 每个==**虚拟节点**==内部表示为一个 `fiber`；

从顶点开始遍历，如果有第一个儿子，先遍历第一个儿子，如果没有第一个儿子，标志着此节点遍历完成，如果有弟弟遍历弟弟，如果有没有下一个弟弟，返回父节点标识完成父节点遍历，如果有叔叔遍历叔叔，没有父节点遍历结束。<!--也就是采用了深度遍历的方式来遍历fiber树-->

下面👇这张图是一个完整的`fiber`树的示意图

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/renderFiber1_1664076149659.jpg" alt="img" style="zoom:50%;" /> 

##### 3.5.3、fiber之前的React

要想知道为什么会有 `fiber`，那么就需要知道没有 `fiber` 以前 **React** 是怎么工作的，看下面👇这段代码：

```jsx
//假设有下面这样一段JSX
let element = (
  <div id="A1">
    <div id="B1">
      <div id="C1"></div>
      <div id="C2"></div>
    </div>
    <div id="B2"></div>
  </div>
);

//转换为虚拟DOM后长这样
let vdom = {
  type: 'div',
  key: 'A1',
  props: {
    id: 'A1',
    children: [
      {
        type: 'div',
        key: 'B1',
        props: {
          id: 'B1',
          children: [
            {
              type: 'div',
              key: 'C1',
              props: { id: 'C1' }
            },
            {
              type: 'div',
              key: 'C2',
              props: { id: 'C2' }
            }
          ]
        }
      },
      {
        type: 'div',
        key: 'B2',
        props: { id: 'B2' }
      }
    ]
  }
};

//以前我们直接把vdom渲染成了真实DOM
function render(vdom, container) {
  //根据虚拟DOM生成真实DOM
  let dom = document.createElement(vdom.type);

  //把除children以外的属性拷贝到真实DOM上
  Object.keys(vdom.props)
    .filter(key => key !== 'children')
    .forEach(key => {
      dom[key] = vdom.props[key];
    });

  //把此虚拟DOM的子节点，也渲染到父节点真实DOM上
  if (Array.isArray(vdom.props.children)) {
    vdom.props.children.forEach(child => render(child, dom));
  }

  container.appendChild(dom);
}

```

==**React17** 之前没有`fiber`的时候==，**React** 就是像上面这样进行渲染的，**JSX** => **virtual DOM** => **real DOM**，这个过程是不可中断的，所以==当遇到大型应用时，**React** 在根据 **virtual DOM** 生成 **real DOM** 这一过程一旦耗时过长，就会造成线程占用，导致浏览器卡顿==；

##### 3.5.4、fiber之后的React

**React17** 引入`fiber`之后，**React**是这样进行渲染的，**JSX** => **virtual DOM** => **fiber** => **real DOM**，其中 **fiber**这一步是可以**中断**的

==为什么 **fiber** 就可以中断呢？==

- 这是因为 **fiber** 使用了==链表的数据结构==，一个 `fiber` 执行单元执行完成之后，会由当前 `fiber` 返回下一个 `fiber` 执行单元，也就是说中断之后，还是可以找到下一个要执行的那个 `fiber` 单元
- 有点断点续传的那个意思

光看描述可能不能理解，直接看代码👇<!--简略版本只是为了理解-->

假设有这样一段`fiber`树

```js
//根据虚拟DOM构建成的fiber树
let A1 = { type: 'div', props: { id: 'A1' } };
let B1 = { type: 'div', props: { id: 'B1' }, return: A1 };
let B2 = { type: 'div', props: { id: 'B2' }, return: A1 };
let C1 = { type: 'div', props: { id: 'C1' }, return: B1 };
let C2 = { type: 'div', props: { id: 'C2' }, return: B1 };

//A1的第一个子节点B1
A1.child = B1;
//B1的弟弟是B2
B1.sibling = B2;
//B1的第一个子节点C1
B1.child = C1;
//C1的弟弟是C2
C1.sibling = C2;
```

这个`fiber`树的示意图是下面👇这样的

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/fiberconstructor.jpg" alt="fiberconstructor" style="zoom:50%;" />

渲染循环的实现如下👇：

```js
//下一个工作单元
let nextUnitOfWork = null;

// 模拟浏览器的剩余空闲时间
const hasTimeRemaining = () =>
  Math.floor(Math.random() * 10) % 2 == 0;

/**
 * @description 完成当前工作单元的方法
 */
function completeUnitOfWork(fiber) {
  console.log('completeUnitOfWork', fiber.props.id);
}

/**
 * @description 处理当前fiber，并返回当前fiber的子fiber
 */
function beginWork(fiber) {
  // 这里做些当前fiber的逻辑处理
  console.log('beginWork', fiber.props.id);
  return fiber.child; 
}

/**
 * @description 执行当前工作单元
 */
function performUnitOfWork(fiber) {
  let child = beginWork(fiber);
  //如果执行完A1之后，会返回A1的第一个子节点
  if (child) {
    return child;
  }

  //如果没有子节点说明当前节点已经完成了渲染工作
  while (fiber) {
    //结束此fiber的渲染了
    completeUnitOfWork(fiber);

    if (fiber.sibling) {
      //如果它有兄弟fiber就返回兄弟fiber
      return fiber.sibling;
    }

    //如果没有兄弟fiber就让父fiber也完成，之后就找叔叔fiber
    fiber = fiber.return;
  }
}

/**
 * @description render工作循环
 */
function workLoop() {
  /**
   * 工作循环每一次处理一个fiber,处理完以后可以暂停
   * 如果有下一个任务并且有剩余的时间的话，执行下一个工作单元，也就是一个fiber
   */
  while (nextUnitOfWork && hasTimeRemaining()) {
    //执行一个任务并返回下一个任务
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  console.log('render阶段结束');
}

nextUnitOfWork = A1;

workLoop();
```

上面👆这段实现中

```js
/**
 * @description render工作循环
 */
function workLoop() {
  /**
   * 工作循环每一次处理一个fiber,处理完以后可以暂停
   * 如果有下一个任务并且有剩余的时间的话，执行下一个工作单元，也就是一个fiber
   */
  while (nextUnitOfWork && hasTimeRemaining()) {
    //执行一个任务并返回下一个任务
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  console.log('render阶段结束');
}
```

这里使用 `hasTimeRemaining()` 模仿浏览器的剩余时间，「中断」的逻辑就是在这里做的，若没有剩余时间就中断，直到下一次循环时有空闲时间才继续执行下一个执行单元

另外，在 `performUnitOfWork(fiber)` 👇中使用了深度遍历的方式对 **fiber** 树进行遍历

```js
/**
 * @description 执行当前工作单元
 */
function performUnitOfWork(fiber) {
  let child = beginWork(fiber);
  //如果执行完A1之后，会返回A1的第一个子节点
  if (child) {
    return child;
  }

  //如果没有子节点说明当前节点已经完成了渲染工作
  while (fiber) {
    //结束此fiber的渲染了
    completeUnitOfWork(fiber);

    if (fiber.sibling) {
      //如果它有兄弟fiber就返回兄弟fiber
      return fiber.sibling;
    }

    //如果没有兄弟fiber就让父fiber也完成，之后就找叔叔fiber
    fiber = fiber.return;
  }
}
```

如何判断一个节点什么时候遍历完成? 没有子节点或者所有子节点都遍历完成了；若没有父节点则表示整个 `fiber`树全部遍历完成了;

`fiber` 树的遍历示意图如下👇：

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/fiberconstructortranverse3.jpg" alt="fiberconstructortranverse3" style="zoom:50%;" />

整个流程顺序是这样的：

1.  A1=>B1=>C1=>C1没有子节点，C1 完成
2. 通过 C1 找到兄弟节点 C2 =>C2 没有子节点了，C2 完成
3. 通过 C2 找到父节点 B1 =>B1 所有子节点都完成了，B1完成
4. 通过 B1 找到兄弟节点 B2 =>B2 没有子节点，B2 完成
5. 通过 B2 找到父节点 A1 =>A1 所有子节点都完成了，A1 完成 =>遍历完成

### 四、总结

==由于 **runtime** 的存在，**React** 的 **Virtual DOM** 计算可能会占用大量的运算时间，挤占浏览器的渲染流程时间，导致页面卡顿、用户事件不能及时响应==；

所以 **React** 采用切片的思想，引入 `fiber` 架构，**==将 Virtual DOM 计算任务拆分一个个原子化的任务单元，使得Virtual DOM 计算任务变得可中断==**，然后在浏览器的每一帧的空闲时间进行任务单元的执行，从而避免了上述的问题

`fiber `的核心思想就是==**「时间切片」**==，类比理解就是相当于**「断点续传」**

