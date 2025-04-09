## React Concurrent 模式深度解析

### 一、React 渲染流程概述

**React Concurrent** 模式下的渲染流程分为三个主要阶段：**调度(Schedule)阶段**、**渲染(Render)阶段**、**提交(Commit)阶段**，每个阶段各司其职，共同完成从「**状态变更**」到「**UI 更新**」的全过程

```
+----------------+      +----------------+      +----------------+
|                |      |                |      |                |
|     调度       |----->|     渲染       |----->|     提交       |
|   Schedule     |      |    Render      |      |    Commit      |
|                |      |                |      |                |
+----------------+      +----------------+      +----------------+
```

#### 1.1、调度阶段 (Schedule)

「**调度阶段**」负责接收「状态更新」，为其分配「优先级」，并根据任务的优先级和过期时间管理「**任务队列**」，安排任务的执行顺序，以确保高优先级任务得到及时处理

**主要工作**：

- 接收状态更新（如`setState`、`useState` ）
- 使用 「**lane 模型**」 为更新分配优先级

  - 创建、管理任务队列，确保高优先级任务优先执行

- 通过 **Scheduler** 调度任务，确定执行时机 

  <!--具体的执行其实是在渲染阶段，包含了任务的中断与恢复、时间切片-->

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

#### 1.2、渲染阶段 (Render)

渲染阶段也就是 **reconcile** 过程，这一过程会构建 **workInProgress fiber** 树，计算需要应用的「**更新**」

==该阶段是**可中断的**==，分为"递"和"归"两个过程

**调和阶段 (Reconciliation)**

- **工作循环（workLoop） 深度遍历处理 fiber 树**

  - 每个 **fiber** 节点都会作为一个工作单元，都会经历以下两个阶段

  - **beginWork 阶段**

    - 处理更新队列中的更新内容

    - 根据 **Virtual DOM** 构建 **fiber** 树

    - 为新创建的 **fiber** 节点标记副作用（如 **Placement**）

  - **completeWork 阶段**
  - 进行 **diff** 操作
    
  - 为新增 **fiber** 节点创建对应的真实 **DOM**
    
  - 为 **fiber** 节点标记副作用添 （如 **ChildDeletion**）
  
  在「**渲染阶段**」结束时，**React** 将准备好所有需要更新的 **DOM 操作**，以便在「**提交阶段**」应用这些更新

#### 1.3、提交阶段 (Commit)

「**提交阶段**」负责将计算出的「**更新**」应用到 **DOM** 树上

==这个阶段是**同步且不可中断的**==

```
+-----------------+     +----------------+     +----------------+
|                 |     |                |     |                |
| Before Mutation |---->|    Mutation    |---->|     Layout     |
|                 |     |                |     |                |
+-----------------+     +----------------+     +----------------+
```

提交阶段分为三个子阶段：

- **前置阶段 (Before Mutation)**

```javascript
function commitBeforeMutationEffects(root, firstChild) {
  // 处理Snapshot effects（如getSnapshotBeforeUpdate）
  // 调度useEffect
  // ... 其他前置工作
}
```

- **变更阶段 (Mutation)**

```javascript
function commitMutationEffects(root, firstChild) {
  // 处理DOM更新
  // 处理ref解绑
  // 执行useLayoutEffect的清理函数
  // ... 其他DOM变更
}
```

- **布局阶段 (Layout)**

```javascript
function commitLayoutEffects(root, firstChild) {
  // 执行生命周期方法
  // 执行useLayoutEffect回调
  // 处理ref绑定
  // ... 其他布局工作
}
```

#### 1.4、渲染流程示意图

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202504091519949.jpg)

### 二、Lane模型与优先级控制

**Concurrent** 模式的核心是 **Lane模型**，它允许 **React** 精细地控制更新优先级

> 在 **React 18** 中，**Lane 模型 **是用于管理并发更新优先级的一种机制。它通过将更新分配到不同的“车道”（**Lanes**）中来实现更细粒度的优先级控制
>
> **React Lane 模型** 一共有 31 条 **Lane**，数字越小优先级越高，某些 **Lane** 的优先级相同
>
> <img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202504091522273.jpeg" alt="img" style="zoom:50%;" />
>
> **主要优先级分类：**
>
> - **同步优先级**：直接影响用户交互的操作（如输 入、点击）
> - **批量优先级**：多个状态更新被批量处理
> - **过渡优先级**：用于UI过渡动画和非紧急更新
> - **空闲优先级**：在浏览器空闲时才处理的后台计算
>
> ![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202504091522496.jpg)
>
> 以下是 **Lane 模型**的关键点：
>
> 1. 多车道并行：
>    - 每个更新被分配到一个或多个车道中，允许多个更新同时进行，而不会相互阻塞
>
> 2. 优先级管理：
>    - 不同的车道代表不同的优先级
>    - 高优先级的更新会被分配到更高优先级的车道中，以确保它们能更快地被处理
>
> 3. 灵活调度：
>    - **Lane 模型**允许 **React** 在不同的车道之间灵活调度任务，确保高优先级任务优先执行，同时也能在空闲时处理低优先级任务
>
> 4. 批量更新：
>    - 车道可以合并多个更新，允许 React 在一次渲染中处理多个更新请求，提高渲染效率
>
> 5. 过期时间：
>    - 每个车道可以有不同的过期时间，确保任务在合理的时间内完成
>
> 通过 **Lane** 模型，**React 18** 能够更好地管理并发更新，提升应用的性能和用户体验

#### 2.1、优先级更新机制

当高优先级任务到来时，**React** 可以暂停正在进行的低优先级任务：

```
时间线 ────────────────────────────────────────────────────►

低优先级更新: [====执行中====|       被打断       |====继续执行====]
                        ↑                       ↑
高优先级更新:            [====插入并执行====]
```

**工作流程：**
1. **React** 开始处理低优先级更新
2. 高优先级更新插入（如用户点击）
3. **React** 暂停低优先级工作，优先处理高优先级更新
4. 高优先级更新完成后，重新开始低优先级更新

### 三、任务中断与恢复机制

#### 3.1、中断策略

当低优先级更新被高优先级更新打断时，**React** 会如何处理？

```javascript
function workLoopConcurrent() {
  // 当有工作单元且没有超时时继续执行
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

当`shouldYield()` 返回 `true` 时（<!--可能是因为有高优先级任务或时间片用尽-->），当前工作会被中断

当中断发生后，对于低优先级任务A被高优先级任务B打断的情况：

```
1. 任务A开始: [Root → A → B → C → ... 中断]
2. 任务B执行: [Root → ... → 完成]
3. 任务A恢复: [Root → ... → 重新开始] (不是从C继续)
```

**关键过程：**
1. 低优先级「更新 A」开始渲染，处理了部分 **fiber节点**
2. 高优先级「更新 B」插入，中断「更新 A」
3. **React** 完成「更新 B」的所有工作
4. 对于「更新 A」，==**React** 会**废弃**之前的工作进度==
5. **React** 从根节点**重新开始**「更新 A」的渲染

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

#### 3.2、状态一致性保证

当高、低优先级更新涉及相同状态时，**React** 如何保证状态一致性？

```
组件X状态变化:

时间 t1: updateA → 将X的值设为10 (低优先级)
时间 t2: updateB → 将X的值设为20 (高优先级)

结果: X的最终值应该是20，不会丢失updateB的更新
```

**处理流程：**
1. 低优先级「更新 A」修改「组件 X」的状态
2. 高优先级「更新 B」也修改「组件 X」的状态
3. 「更新 B」完成后，「组件 X」的状态已变化
4. ==「更新 A」重新开始时，基于包含「更新 B」结果的「最新状态」计算==

这确保了即使在 **concurrent 模式**下，**React** 也能维持状态的一致性，避免**"丢失更新"**的问题

### 四. Concurrent模式的实际应用

#### 4.1 复杂数据处理

在处理大量数据时，**Concurrent 模式**可以：
- 保持 **UI** 响应，不阻塞用户输入
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

#### 4.2、Suspense 与数据获取

**Suspense** 配合 **Concurrent 模式** 处理数据加载：

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

#### 4.3、useTransition 和 useDeferredValue

这两个 **hooks** 是 **Concurrent 模式** 的重要 **API**：

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

### 五. 总结与展望

#### 5.1、Concurrent模式的优势

- **提升用户体验**：保持 UI 响应性，避免卡顿
- **更智能的调度**：根据优先级安排任务执行
- **渐进式加载**：逐步展示内容，而非全有或全无
- **更好的错误处理**：错误不会阻塞整个应用

#### 5.2、核心内容

1. **渲染流程的三个主要阶段**：
   - **调度阶段**：接收更新并分配优先级
   - **渲染阶段**：构建 **fiber** 树，计算变更（可中断）
   - **提交阶段**：应用变更到 **DOM**（不可中断）
2. **Lane 模型的优先级管理**：
   - 使用位运算表示不同优先级通道
   - 允许精确控制更新的优先级和执行顺序
3. **低优先级更新被打断后的恢复机制**：
   - **React** 不会从中断点继续，而是废弃进度，重新开始渲染
   - 这确保了「**状态一致性**」，避免基于过时状态进行渲染

**Concurrent 模式** 将 **React** 从 "一次性完成所有工作" 的模式转变为 "可中断、可恢复、有优先级的工作流"

这一根本性变化使 **React** 应用能够更好地适应现代复杂交互需求，提供流畅的用户体验