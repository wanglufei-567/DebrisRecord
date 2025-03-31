## React Concurrent 模式深度解析

### 1. React 渲染流程概述

React Concurrent 模式下的渲染流程分为三个主要阶段：调度(Schedule)阶段、渲染(Render)阶段和提交(Commit)阶段。每个阶段各司其职，共同完成从状态变更到UI更新的全过程。

```
+----------------+      +----------------+      +----------------+
|                |      |                |      |                |
|     调度       |----->|     渲染       |----->|     提交       |
|   Schedule     |      |    Render      |      |    Commit      |
|                |      |                |      |                |
+----------------+      +----------------+      +----------------+
```

#### 1.1 调度阶段 (Schedule)

调度阶段负责接收状态更新，并为其分配优先级。

**主要工作：**
- 接收状态更新（如`setState`、`useState`的dispatch函数调用）
- 使用lane模型为更新分配优先级
- 通过Scheduler调度任务，确定执行时机

```javascript
// 调度更新
function scheduleUpdateOnFiber(fiber, lane) {
  // 找到根节点
  const root = markUpdateLaneFromFiberToRoot(fiber, lane);
  
  // 将更新标记到根节点
  markRootUpdated(root, lane);
  
  // 确保根节点被调度
  ensureRootIsScheduled(root, eventTime);
}

// 确保根节点被调度
function ensureRootIsScheduled(root, currentTime) {
  // 检查是否有过期的任务
  markStarvedLanesAsExpired(root, currentTime);
  
  // 确定下一个lane优先级
  const nextLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  );
  
  // 调度新的回调
  if (existingCallbackPriority !== newCallbackPriority) {
    // 取消现有的回调
    if (existingCallbackNode !== null) {
      cancelCallback(existingCallbackNode);
    }
    
    // 安排新的回调
    newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }
}
```

#### 1.2 渲染阶段 (Render)

渲染阶段也就是 reconcile 过程，这一过程会构建workInProgress fiber树，计算需要应用的变更。

该阶段是**可中断的**，分为"递"和"归"两个过程

**调和阶段 (Reconciliation)**

- **工作循环（workLoop） 深度遍历处理 fiber 树**

  - 每个 fiber 节点都会作为一个工作单元，都会经历以下两个阶段

  - **beginWork 阶段**

    - 处理更新队列中的更新内容

    - 根据 Virtual DOM 构建 fiber 树

    - 为新创建的 Fiber 节点标记副作用（如 Placement）

  - **completeWork 阶段**

    - 进行 diff 操作

    - 为新增 Fiber 节点创建对应的真实 DOM

    - 为 fiber 节点标记副作用添 （如 ChildDeletion）

#### 1.3 提交阶段 (Commit)

提交阶段负责将计算出的变更应用到DOM树上。这个阶段是**同步且不可中断的**。

```
+-----------------+     +----------------+     +----------------+
|                 |     |                |     |                |
| Before Mutation |---->|    Mutation    |---->|     Layout     |
|                 |     |                |     |                |
+-----------------+     +----------------+     +----------------+
```

提交阶段分为三个子阶段：

##### 1.3.1 前置阶段 (Before Mutation)

```javascript
function commitBeforeMutationEffects(root, firstChild) {
  // 处理Snapshot effects（如getSnapshotBeforeUpdate）
  // 调度useEffect
  // ... 其他前置工作
}
```

##### 1.3.2 变更阶段 (Mutation)

```javascript
function commitMutationEffects(root, firstChild) {
  // 处理DOM更新
  // 处理ref解绑
  // 执行useLayoutEffect的清理函数
  // ... 其他DOM变更
}
```

##### 1.3.3 布局阶段 (Layout)

```javascript
function commitLayoutEffects(root, firstChild) {
  // 执行生命周期方法
  // 执行useLayoutEffect回调
  // 处理ref绑定
  // ... 其他布局工作
}
```

### 2. Lane模型与优先级控制

Concurrent模式的核心是lane模型，它允许React精细地控制更新优先级。

```javascript
// 不同优先级的lane定义（使用位运算表示）
const SyncLane = 0b0000000000000000000000000000001;
const InputContinuousLane = 0b0000000000000000000000000000100;
const DefaultLane = 0b0000000000000000000000000010000;
const IdleLane = 0b0100000000000000000000000000000;
```

Lane模型使用二进制位表示不同的优先级通道，位数越小优先级越高。

**主要优先级分类：**
- **同步优先级**：直接影响用户交互的操作（如输入、点击）
- **批量优先级**：多个状态更新被批量处理
- **过渡优先级**：用于UI过渡动画和非紧急更新
- **空闲优先级**：在浏览器空闲时才处理的后台计算

#### 2.1、优先级更新机制

当高优先级任务到来时，React可以暂停正在进行的低优先级任务：

```
时间线 ────────────────────────────────────────────────────►

低优先级更新: [====执行中====|       被打断       |====继续执行====]
                        ↑                       ↑
高优先级更新:            [====插入并执行====]
```

**工作流程：**
1. React开始处理低优先级更新
2. 高优先级更新插入（如用户点击）
3. React暂停低优先级工作，优先处理高优先级更新
4. 高优先级更新完成后，重新开始低优先级更新

### 3. 任务中断与恢复机制

#### 3.1 中断策略

当低优先级更新被高优先级更新打断时，React会如何处理？

```javascript
function workLoopConcurrent() {
  // 当有工作单元且没有超时时继续执行
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

当`shouldYield()`返回true时（可能是因为有高优先级任务或时间片用尽），当前工作会被中断。

当中断发生后，对于低优先级任务A被高优先级任务B打断的情况：

```
1. 任务A开始: [Root → A → B → C → ... 中断]
2. 任务B执行: [Root → ... → 完成]
3. 任务A恢复: [Root → ... → 重新开始] (不是从C继续)
```

**关键过程：**
1. 低优先级更新A开始渲染，处理了部分fiber节点
2. 高优先级更新B插入，中断更新A
3. React完成更新B的所有工作
4. 对于更新A，React会**废弃**之前的工作进度
5. React从根节点**重新开始**更新A的渲染

```javascript
// 在React源码中，当一个更新被中断后重新开始时
// 通常会调用prepareFreshStack来重置工作状态
function prepareFreshStack(root, lanes) {
  root.finishedWork = null;
  root.finishedLanes = NoLanes;
  
  const timeoutHandle = root.timeoutHandle;
  if (timeoutHandle !== noTimeout) {
    root.timeoutHandle = noTimeout;
    cancelTimeout(timeoutHandle);
  }
  
  if (workInProgress !== null) {
    let interruptedWork = workInProgress.return;
    while (interruptedWork !== null) {
      unwindInterruptedWork(interruptedWork);
      interruptedWork = interruptedWork.return;
    }
  }
  
  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null);
  workInProgressRootRenderLanes = lanes;
}
```

#### 3.2 状态一致性保证

当高、低优先级更新涉及相同状态时，React如何保证状态一致性？

```
组件X状态变化:

时间 t1: updateA → 将X的值设为10 (低优先级)
时间 t2: updateB → 将X的值设为20 (高优先级)

结果: X的最终值应该是20，不会丢失updateB的更新
```

**处理流程：**
1. 低优先级更新A修改组件X的状态
2. 高优先级更新B也修改组件X的状态
3. 更新B完成后，组件X的状态已变化
4. 更新A重新开始时，基于包含更新B结果的最新状态计算

这确保了即使在并发环境下，React也能维持状态的一致性，避免"丢失更新"的问题。

### 4. 时间切片与可中断渲染

Concurrent模式实现了时间切片机制，使长任务可分割执行，不阻塞主线程。

```
同步模式:
[===========任务执行==========] → [=====浏览器绘制=====]

Concurrent模式:
[==任务==] → [浏览器] → [==任务==] → [浏览器] → [==任务==]
```

#### 4.1 时间切片机制

React通过以下方式实现时间切片：

```javascript
// 简化的时间切片实现
function workLoopConcurrent() {
  // 当有工作且没有超时时继续
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}

// shouldYield检查是否应该让出执行权
function shouldYield() {
  // 检查是否超过时间片
  const currentTime = getCurrentTime();
  if (currentTime >= deadline) {
    return true;
  }
  // 检查是否有高优先级任务
  return false;
}
```

#### 4.2 可中断性的实现

React通过以下机制实现渲染的可中断性：

```javascript
function performConcurrentWorkOnRoot(root, didTimeout) {
  // 恢复之前的上下文
  if (previousWorkInProgressRoot !== null && 
      previousWorkInProgressRoot !== root) {
    // 重置工作进度
    resetWorkInProgressStack();
  }
  
  // 继续之前被打断的渲染
  while (workInProgress !== null) {
    try {
      workLoopConcurrent();
    } catch (thrownValue) {
      handleError(root, thrownValue);
    }
    
    // 检查是否完成或需要让出执行权
    break;
  }
  
  // 完成或让出执行权的处理
}
```

### 5. Concurrent模式的实际应用

#### 5.1 复杂数据处理

在处理大量数据时，Concurrent模式可以：
- 保持UI响应，不阻塞用户输入
- 优先处理用户交互，再继续数据处理
- 根据设备性能自动调整工作量

```jsx
function LargeList({ items }) {
  const [isPending, startTransition] = useTransition();
  const [filterText, setFilterText] = useState('');
  
  // 处理输入变化
  const handleChange = (e) => {
    // 立即更新输入框（高优先级）
    setFilterText(e.target.value);
    
    // 标记为低优先级更新
    startTransition(() => {
      // 过滤大量数据（低优先级）
      setFilteredItems(filterItems(items, e.target.value));
    });
  };
  
  return (
    <>
      <input value={filterText} onChange={handleChange} />
      {isPending ? <div>Loading...</div> : <ListView items={filteredItems} />}
    </>
  );
}
```

#### 5.2 Suspense与数据获取

Suspense配合Concurrent模式处理数据加载：

```jsx
function ProfilePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ProfileDetails />
      <Suspense fallback={<PostsSkeleton />}>
        <Posts />
      </Suspense>
    </Suspense>
  );
}

// 使用Suspense兼容的数据获取
function ProfileDetails() {
  // 这个数据读取会在数据准备好之前"挂起"组件
  const user = resource.user.read();
  return <h1>{user.name}</h1>;
}
```

#### 5.3 useTransition和useDeferredValue

这两个hooks是Concurrent模式的重要API：

```jsx
// useTransition示例
function SearchResults({ query }) {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState(query);
  
  function handleChange(e) {
    const value = e.target.value;
    // 立即更新输入框
    setQuery(value);
    
    // 标记搜索结果更新为非紧急
    startTransition(() => {
      setSearchQuery(value);
    });
  }
  
  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <Results query={searchQuery} />}
    </>
  );
}

// useDeferredValue示例
function SlowList({ text }) {
  // 创建文本的延迟版本
  const deferredText = useDeferredValue(text);
  
  // 使用延迟版本渲染列表
  const items = useMemo(() => {
    // 昂贵的计算
    return generateItems(deferredText);
  }, [deferredText]);
  
  return <div>{items}</div>;
}
```

### 6. 总结与展望

#### 6.1 Concurrent模式的优势

- **提升用户体验**：保持UI响应性，避免卡顿
- **更智能的调度**：根据优先级安排任务执行
- **渐进式加载**：逐步展示内容，而非全有或全无
- **更好的错误处理**：错误不会阻塞整个应用

#### 6.2 核心内容

1. **渲染流程的三个主要阶段**：
   - 调度阶段：接收更新并分配优先级
   - 渲染阶段：构建fiber树，计算变更（可中断）
   - 提交阶段：应用变更到DOM（不可中断）
2. **Lane模型的优先级管理**：
   - 使用位运算表示不同优先级通道
   - 允许精确控制更新的优先级和执行顺序
3. **低优先级更新被打断后的恢复机制**：
   - React不会从中断点继续，而是废弃进度，重新开始渲染
   - 这确保了状态一致性，避免基于过时状态进行渲染

Concurrent模式将React从"一次性完成所有工作"的模式转变为"可中断、可恢复、有优先级的工作流"。这一根本性变化使React应用能够更好地适应现代复杂交互需求，提供流畅的用户体验。