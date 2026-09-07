## **Checkpointer、Thread 与 State History**

> 适用版本：`@langchain/langgraph@1.4.13`

普通 `graph.invoke()` 只执行一次状态图，调用结束后，下一次调用默认无法读取上一次的 **State**

**Checkpointer** 在图执行过程中保存 **State Snapshot**，`thread_id` 指定这些快照属于哪条状态序列，由此形成同一 **Thread** 的跨调用连续性

```text
thread_id + 本轮输入
  -> 读取该 Thread 的最新 Checkpoint
  -> 合并本轮输入并执行 Graph
  -> 每个 Super-step 后保存新 Checkpoint
  -> 返回最新 State
```

> ==**State** 是当前数据，**Checkpoint** 是某一时刻的状态快照，**Checkpointer** 是保存和读取快照的组件，**Thread** 是一组相关快照的逻辑序列==

### 一、核心对象

#### 1.1、**State**

**State** 是节点本次执行时读取和更新的共享数据，例如消息、计划、状态标记和计数器

它描述“现在有哪些数据”，本身不负责持久化，也不等于完整执行历史

#### 1.2、**Checkpoint** 与 **StateSnapshot**

**Checkpoint** 是 **Graph Runtime** 在某个执行边界保存的运行快照，不仅包含字段值，还包含下一步执行位置和快照元数据

应用通过 `getState()` 与 `getStateHistory()` 读取到的对象通常表现为 **StateSnapshot**，常用字段包括：

| 字段 | 含义 |
|---|---|
| `values` | 该时刻的完整 **State** 值 |
| `next` | 下一步待执行的 **Node** 名称数组，空数组表示已经结束 |
| `config` | 当前快照配置，包含 `thread_id` 与 `checkpoint_id` |
| `metadata` | 快照来源、执行步数等元数据 |
| `createdAt` | 快照创建时间 |
| `parentConfig` | 父快照配置，用于追溯状态分支 |
| `tasks` | 下一步任务及可能的错误或中断信息 |

**StateSnapshot** 不是简单的消息栈，它同时保存数据状态和执行位置

#### 1.3、**Checkpointer**

**Checkpointer** 是快照存储接口的实现，负责：

- 按 **Thread** 保存执行过程中的 **Checkpoint**
- 在后续调用开始前读取已有状态
- 提供当前快照和历史快照查询
- 支持状态修正、中断恢复与历史重放

图是否启用持久化，由编译时是否注入 `checkpointer` 决定

#### 1.4、**Thread** 与 `thread_id`

**Thread** 是由相同 `thread_id` 关联起来的一系列 **Checkpoint**

```text
thread-a -> checkpoint-a1 -> checkpoint-a2 -> checkpoint-a3
thread-b -> checkpoint-b1 -> checkpoint-b2
```

相同 `thread_id` 会延续已有 **State**，不同 `thread_id` 使用相互独立的状态序列

`thread_id` 只是状态索引，不是登录身份、用户 ID 或权限凭证，应用仍需验证调用者是否有权访问对应 **Thread**

### 二、`MemorySaver`

`MemorySaver` 是将 **Checkpoint** 保存在当前进程内存中的 **Checkpointer** 实现：

```ts
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();
```

它没有构造必填参数，返回一个可以交给 `compile()` 的 **Checkpointer** 实例

`MemorySaver` 适合学习、本地开发和离线测试，可以验证：

- 相同 **Thread** 是否延续状态
- 不同 **Thread** 是否隔离
- 当前快照、历史快照、状态更新和重放语义

它不能证明进程重启恢复、多实例共享、并发一致性、备份迁移和生产级数据治理，创建新的 `MemorySaver` 实例也无法读取旧实例的数据

### 三、`compile({ checkpointer })`

```ts
const graph = builder.compile({
  checkpointer,
});
```

主要入参与出参：

| 位置 | 类型 | 含义 |
|---|---|---|
| `checkpointer` | **Checkpointer** 实例 | 指定快照的保存与读取实现 |
| 返回值 | 编译后的 **Graph** | 获得按 **Thread** 保存、查询和恢复状态的能力 |

注入 **Checkpointer** 后，调用 `invoke()`、`getState()`、`getStateHistory()` 等接口时需要提供 `configurable.thread_id`

> ==`compile()` 只是把快照机制接入 **Graph Runtime**，不会替应用生成用户会话、验证所有权或制定数据保留策略==

### 四、通过 `thread_id` 连续调用

```ts
const config = {
  configurable: {
    thread_id: "thread-123",
  },
};

await graph.invoke(
  { messages: [{ role: "user", content: "我的项目使用 TypeScript" }] },
  config,
);

const result = await graph.invoke(
  { messages: [{ role: "user", content: "我刚才说项目使用什么语言" }] },
  config,
);
```

第二次调用的实际过程是：

```text
读取 thread-123 的最新 Checkpoint
  -> 把本轮新增 HumanMessage 合并进旧 messages
  -> 从 START 开始执行本轮 Graph
  -> 保存本轮产生的新 Checkpoints
```

主要入参与出参：

| 位置 | 字段 | 含义 |
|---|---|---|
| 第一个参数 | **State Input** | 本轮新增或覆盖的数据 |
| 第二个参数 | `configurable.thread_id` | 本次调用所属的 **Thread** |
| 返回值 | 完整 **State** | 恢复旧状态并完成本轮执行后的最新状态 |

接入 **Checkpointer** 后，消息型应用通常只传本轮新增消息，如果应用再次提交完整历史，可能造成消息重复

### 五、`getState()`

```ts
const snapshot = await graph.getState({
  configurable: {
    thread_id: "thread-123",
  },
});
```

`getState(config)` 默认读取指定 **Thread** 的最新 **StateSnapshot**

如果 `config` 同时包含 `checkpoint_id`，则读取该历史快照：

```ts
const snapshot = await graph.getState({
  configurable: {
    thread_id: "thread-123",
    checkpoint_id: "checkpoint-id",
  },
});
```

它是读取操作，不会执行 **Node**，也不会调用模型或工具

### 六、`getStateHistory()`

```ts
for await (const snapshot of graph.getStateHistory({
  configurable: {
    thread_id: "thread-123",
  },
})) {
  console.log(snapshot.config.configurable?.checkpoint_id);
  console.log(snapshot.values);
  console.log(snapshot.next);
}
```

`getStateHistory(config)` 返回 **AsyncIterable**，用于逐个读取指定 **Thread** 的历史 **StateSnapshot**

默认顺序是从新到旧，调用方可以通过 `for await...of` 消费

历史快照适合调试、审计运行路径、选择恢复点和解释某次状态如何形成，但是否允许用户读取这些数据仍由应用权限层决定

### 七、`updateState()`

```ts
const updatedConfig = await graph.updateState(
  {
    configurable: {
      thread_id: "thread-123",
    },
  },
  {
    status: "approved",
    trace: ["human_review"],
  },
  "review_node",
);
```

方法签名可以概括为：

```ts
graph.updateState(config, values, asNode?)
```

| 参数 | 类型 | 含义 |
|---|---|---|
| `config` | **Runnable Config** | 指定目标 `thread_id`，也可通过 `checkpoint_id` 指定历史起点 |
| `values` | **State Update** | 要写入的部分状态，而不是必须提交完整 **State** |
| `asNode` | `string`，可选 | 把本次更新视为由哪个 **Node** 产生，影响后续执行位置判断 |
| 返回值 | **Runnable Config** | 新创建快照的配置，可取得新的 `checkpoint_id` |

`updateState()` 不会原地修改旧快照，而是基于目标快照创建新的 **Checkpoint**

写入仍遵守字段更新规则，普通字段覆盖旧值，带 **Reducer** 的字段会执行合并逻辑，因此对累积字段写入数组不等于直接替换整个旧数组

### 八、历史重放与 **Time Travel**

历史 **StateSnapshot.config** 可以再次作为执行配置：

```ts
const history = [];

for await (const snapshot of graph.getStateHistory(config)) {
  history.push(snapshot);
}

const checkpoint = history.find((snapshot) =>
  snapshot.next.includes("model"),
);

if (checkpoint) {
  const replayed = await graph.invoke(null, checkpoint.config);
  console.log(replayed);
}
```

这里不是把旧结果直接复制为新结果，而是从该 **Checkpoint** 所记录的执行位置继续运行

在目标快照之前已经保存的步骤可以复用，目标快照之后的 **Node** 会重新执行，因此模型调用、网络请求、写数据库、发消息等外部副作用都可能再次发生

需要重放的工作流应让副作用具备幂等键、去重记录或人工确认，不能把 **Checkpoint** 恢复误认为数据库事务回滚

### 九、**Checkpointer** 与长期 **Store**

| 机制 | 主要范围 | 典型数据 |
|---|---|---|
| **Checkpointer** | 同一 **Thread** 的执行状态 | Messages、节点状态、执行位置、中断信息 |
| 长期 **Store** | 跨 **Thread** 或跨会话共享 | 用户偏好、长期事实、可检索记忆 |

**Checkpointer** 解决“这条工作流上次运行到了哪里、当时有哪些状态”，长期 **Store** 解决“不同工作流之间需要长期共享什么信息”

把所有业务数据都塞进 **Checkpoint** 会造成状态膨胀、上下文成本增加和生命周期难以治理

### 十、最小完整示例

```ts
import {
  MemorySaver,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
} from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  messages: MessagesValue,
  count: z.number().default(0),
});

const builder = new StateGraph(State)
  .addNode("count_message", (state) => ({
    // 普通字段使用新值覆盖旧值
    count: state.count + 1,
  }))
  .addEdge(START, "count_message");

const graph = builder.compile({
  // MemorySaver 只把快照保存在当前进程内
  checkpointer: new MemorySaver(),
});

const config = {
  configurable: {
    thread_id: "thread-123",
  },
};

await graph.invoke(
  { messages: [{ role: "user", content: "第一条消息" }] },
  config,
);

await graph.invoke(
  { messages: [{ role: "user", content: "第二条消息" }] },
  config,
);

const latest = await graph.getState(config);

console.log(latest.values.count); // 2
console.log(latest.values.messages.length); // 2
```

### 十一、核心结论

- **State** 是当前共享数据，**Checkpoint** 是带执行位置的状态快照
- **Checkpointer** 在图执行过程中保存和读取快照，`thread_id` 把快照组织成 **Thread**
- 相同 `thread_id` 延续状态，不同 `thread_id` 隔离状态
- `getState()` 读取当前或指定快照，`getStateHistory()` 按新到旧遍历历史
- `updateState()` 创建新快照，并继续遵守普通覆盖与 **Reducer** 合并规则
- 从历史快照继续会重新执行后续 **Node**，外部副作用可能重复发生
- `MemorySaver` 只适合进程内学习和测试，不代表生产持久化能力
- **Checkpointer** 管理 Thread 级执行状态，长期 **Store** 管理跨 Thread 共享信息

### 十二、复习问题

- **State**、**Checkpoint**、**Checkpointer** 与 **Thread** 分别是什么关系
- 为什么 **StateSnapshot** 不只是一个消息栈
- `MemorySaver` 能证明什么，不能证明什么
- `compile({ checkpointer })` 给编译后的图增加了什么能力
- `thread_id` 为什么既能隔离状态，又不能充当权限凭证
- 接入 **Checkpointer** 后，为什么通常只提交本轮新增消息
- `getState()` 与 `getStateHistory()` 的返回方式有什么区别
- `updateState()` 为什么不是直接修改数据库中的旧状态
- `updateState()` 更新带 **Reducer** 的字段时会发生什么
- `asNode` 会影响什么
- 从历史 **Checkpoint** 继续执行时，哪些代码会重新运行
- 为什么 **Time Travel** 可能重复产生外部副作用
- **Checkpointer** 与长期 **Store** 解决的问题有什么区别

### 十三、参考资料

- **[LangGraph Persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence)**
- **[LangGraph Time Travel](https://docs.langchain.com/oss/javascript/langgraph/use-time-travel)**
- **[LangGraph Memory](https://docs.langchain.com/oss/javascript/langgraph/add-memory)**

### 十四、复习参考答案

#### 1. 四个对象的关系

- **State** 保存节点当前读取和更新的数据
- **Checkpoint** 保存某一执行边界的 State、下一执行位置和元数据
- **Checkpointer** 负责保存、读取和列举 Checkpoint
- **Thread** 是相同 `thread_id` 下的一系列 Checkpoint

#### 2. 为什么 **StateSnapshot** 不只是消息栈

它除了 `values` 中的消息和业务状态，还包含 `next`、`config`、`metadata`、`parentConfig` 与 `tasks` 等执行信息，因此既描述数据，也描述工作流运行位置

#### 3. `MemorySaver` 的能力边界

- 能验证同 Thread 连续性、跨 Thread 隔离、历史查询、状态更新和重放语义
- 不能证明进程重启恢复、多实例共享、并发一致性、备份迁移、权限和数据治理

#### 4. `compile({ checkpointer })` 的作用

它把快照保存与恢复机制接入编译后的 **Graph Runtime**，使图能够按 `thread_id` 延续状态，并提供状态查询、更新、中断恢复和历史重放能力

#### 5. `thread_id` 与权限

`thread_id` 可以把不同状态序列分开，但它只是查找快照的键，不包含已认证身份和资源所有权

应用必须先确认调用者对该 Thread 的访问权限，再把可信的 `thread_id` 交给图

#### 6. 为什么只提交本轮新增消息

**Checkpointer** 会先恢复已有 **State**，`MessagesValue` 再把本轮新消息合并进去

如果应用同时提交完整历史，旧消息可能被再次写入并造成重复

#### 7. `getState()` 与 `getStateHistory()`

- `getState()` 异步返回一个最新或指定的 **StateSnapshot**
- `getStateHistory()` 返回 **AsyncIterable**，默认按新到旧提供一组历史快照

二者都只读取状态，不执行模型、工具或业务节点

#### 8. 为什么 `updateState()` 不会直接改写旧状态

它以指定快照为基础写入部分 **State Update**，生成一个拥有新 `checkpoint_id` 的 **Checkpoint**，旧快照仍保留在历史中

#### 9. 更新带 **Reducer** 的字段

新值会进入该字段定义的 **Reducer** 与旧值合并，而不是无条件覆盖

如果需要替换整个累积字段，应使用该字段支持的显式覆盖语义

#### 10. `asNode` 的作用

`asNode` 告诉 **Graph Runtime** 把人工更新视为由哪个 **Node** 产生，这会影响框架推断后续应该从哪里继续执行

#### 11. 历史继续执行的范围

目标 Checkpoint 之前已保存的结果可以复用，从目标快照记录的 `next` 开始，后续 **Node** 会重新执行

因此模型调用、工具和其他外部操作是否再次发生，取决于它们位于该恢复点之前还是之后

#### 12. 外部副作用风险

重放恢复的是图状态和执行位置，不是外部系统事务

重新执行的节点可能再次扣费、写数据库、发送通知或调用工具，因此需要幂等、去重或人工审批机制

#### 13. **Checkpointer** 与长期 **Store**

- **Checkpointer** 维护同一 Thread 的工作流状态和执行历史
- 长期 **Store** 保存跨 Thread、跨会话需要共享和检索的信息

二者可以组合，但不能互相替代
