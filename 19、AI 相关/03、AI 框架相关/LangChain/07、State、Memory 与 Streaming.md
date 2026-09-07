## **State、Memory 与 Streaming**

前面的 `createAgent()` 已经能在一次 **Agent Run** 中维护消息、执行 **Tool** 并形成最终结果，但一次调用结束后，下一次调用默认并不知道之前发生了什么

**State** 表示 Agent 当前掌握的运行数据，**Checkpointer** 负责按 **Thread** 保存和恢复 State，**Streaming** 负责把执行过程持续投射给调用方

```text
thread_id + 本轮输入
  -> Checkpointer 恢复旧 State
  -> Agent 执行 Model、Tool 与 Middleware
  -> Streaming 投射过程事件
  -> Checkpointer 保存新 State
  -> 返回最终 State
```

> ==**Memory 解决跨调用连续性，Streaming 解决单次运行可见性，二者都不改变 Agent 的决策逻辑**==

### 一、**Agent State**

**Agent State** 是一次 **Agent** 执行所依赖并持续更新的数据集合，默认最重要的字段是 `messages`

其中可以包含：

- 用户输入的 `HumanMessage`
- 模型返回的 `AIMessage`
- 模型提出的 **Tool Call**
- 应用回填的 `ToolMessage`
- 结构化最终结果及 Middleware 增加的自定义字段

同一次 `agent.invoke()` 中，State 会随着图节点执行不断更新

没有 **Checkpointer** 时，这些状态只属于当前调用；下一次调用能否延续历史，完全取决于应用是否再次传入

### 二、短期 **Memory** 与 **Checkpointer**

#### 2.1、核心关系

**LangChain Agent** 的短期 **Memory** 本质上是 **Thread** 级 **State** 的持久化与恢复机制

| 对象 | 职责 |
|---|---|
| **State** | 保存当前 **Thread** 的消息和运行数据 |
| **Checkpointer** | 在执行过程中保存 **State**，并在后续调用前恢复 |
| `thread_id` | 指定本次调用属于哪个 **Thread** |
| `MemorySaver` | 以内存作为存储介质的 **Checkpointer** 实现 |

`MemorySaver` 来自 `@langchain/langgraph`，因为 **LangChain Agent** 的状态运行基础由 **LangGraph** 提供

在 `createAgent()` 中仍然通过 `checkpointer` 参数直接使用

#### 2.2、创建带短期 Memory 的 Agent

```ts
import { MemorySaver } from "@langchain/langgraph";
import { createAgent } from "langchain";

const checkpointer = new MemorySaver();

const agent = createAgent({
  model,
  tools,
  checkpointer,
});
```

`checkpointer` 的输入是一个 **Checkpointer** 实例，Agent 返回值仍是能够执行 `invoke()`、`stream()` 等操作的运行对象

#### 2.3、通过 `thread_id` 调用

```ts
await agent.invoke(
  {
    messages: [{ role: "user", content: "我的项目使用 TypeScript" }],
  },
  {
    configurable: {
      thread_id: "thread-123",
    },
  },
);

const result = await agent.invoke(
  {
    messages: [{ role: "user", content: "我刚才说项目使用什么语言" }],
  },
  {
    configurable: {
      thread_id: "thread-123",
    },
  },
);
```

第二次调用只提交本轮新增消息，**Checkpointer** 会先恢复 `thread-123` 的旧 **State**，再把新消息合并进去

> ==**接入 Checkpointer 后，不应同时由应用重复提交完整历史，否则同一批消息可能被再次写入 State**==

主要入参与出参：

| 位置 | 字段 | 含义 |
|---|---|---|
| 第一个参数 | `messages` | 本轮新增的输入消息 |
| 第二个参数 | `configurable.thread_id` | State 的 Thread 标识 |
| 返回值 | `result.messages` | 恢复旧 State 并完成本轮运行后的完整消息状态 |
| 返回值 | 其他 State 字段 | 自定义状态或 `structuredResponse` 等最终结果 |

### 三、Thread 隔离

相同 `thread_id` 会延续同一份 State，不同 `thread_id` 应恢复不同 State

```ts
await agent.invoke(
  { messages: [{ role: "user", content: "Thread A 的信息" }] },
  { configurable: { thread_id: "thread-a" } },
);

await agent.invoke(
  { messages: [{ role: "user", content: "Thread B 的信息" }] },
  { configurable: { thread_id: "thread-b" } },
);
```

`thread_id` 只是状态索引，不是身份认证和权限证明

生产应用必须根据已经认证的用户或租户确定 Thread 所有权，不能允许调用方仅凭任意 `thread_id` 读取会话

### 四、**Runtime Context** 与短期 **Memory**

| 对象 | 生命周期 | 典型内容 | 是否自动跨调用恢复 |
|---|---|---|---|
| **Runtime Context** | 单次调用 | 请求 ID、角色、依赖、策略配置 | 否 |
| **Agent State** | 单次运行中持续更新 | Messages、自定义状态字段 | 取决于 Checkpointer |
| 短期 **Memory** | 同一 Thread 的多次调用 | 被 Checkpointer 保存的 State | 是 |
| 长期 **Memory** | 跨 Thread 或跨会话 | 用户偏好、知识、长期事实 | 不属于 Checkpointer 的默认 Messages State |

**Runtime Context** 即使每轮使用相同内容，也仍然是应用重新传入，不会因为 `thread_id` 相同而自动恢复

短期 **Memory** 也不等于无限保存全部对话；消息持续增长会增加上下文长度、延迟和 token 成本，应用仍需设计裁剪、删除或摘要策略

### 五、`MemorySaver` 的边界

`MemorySaver` 把 Checkpoint 保存于当前进程内存，适合本地开发、学习与测试

它不能证明：

- 进程重启后仍能恢复
- 多个服务实例共享一致状态
- 数据具备备份、迁移和并发控制
- 已实现跨 Thread 的长期 Memory
- 已满足租户隔离、隐私删除与审计要求

需要生产持久化时，应替换为数据库支持的 Checkpointer，并单独验证并发、恢复、权限和生命周期

### 六、**Streaming**

#### 6.1、`stream()`

`stream()` 是获取 Agent 增量输出的主要接口，通过 `streamMode` 选择关注的数据

| `streamMode` | 主要输出 |
|---|---|
| `updates` | 每个 Agent 步骤完成后的 State 更新 |
| `messages` | 模型消息或 token 及其元数据 |
| `custom` | Tool 或节点主动写入的自定义进度 |

```ts
const stream = await agent.stream(
  {
    messages: [{ role: "user", content: "搜索并总结资料" }],
  },
  {
    configurable: { thread_id: "thread-123" },
    streamMode: ["updates", "messages", "custom"],
  },
);

for await (const chunk of stream) {
  console.log(chunk);
}
```

Streaming 改变的是结果交付方式，不是模型是否流式推理，也不会自动让 **Tool** 执行更快

#### 6.2、从 Tool 写入自定义进度

```ts
import type { ToolRuntime } from "@langchain/core/tools";
import { tool } from "langchain";
import { z } from "zod";

const searchDocs = tool(
  async ({ query }, runtime: ToolRuntime) => {
    runtime.writer?.({
      name: "tool_progress",
      phase: "searching",
    });

    return search(query);
  },
  {
    name: "search_docs",
    description: "搜索技术资料",
    schema: z.object({ query: z.string() }),
  },
);
```

`runtime.writer` 只负责向自定义流写数据，最终 **Tool Result** 仍需通过函数返回值交给 Agent

进度事件不应包含密钥、完整内部异常或无需暴露的运行对象

### 七、`streamEvents()` 与运行句柄

当前 `streamEvents(input, { version: "v3" })` 提供统一协议事件与运行投影，适合需要区分模型、Tool、State 和最终结果的调用方

```ts
const run = await agent.streamEvents(
  {
    messages: [{ role: "user", content: "搜索并总结资料" }],
  },
  {
    version: "v3",
    configurable: { thread_id: "thread-123" },
  },
);

for await (const event of run) {
  if (event.method === "tools") {
    console.log(event.params.data);
  }
}

const finalState = await run.output;
```

运行句柄同时提供：

- 原始协议事件的异步迭代器
- `output` 最终 State Promise
- `messages`、`toolCalls` 等更高层投影
- `abort()` 主动取消运行的控制入口

`version: "v3"` 当前属于实验性 API，协议形状和投影能力可能在后续主版本调整，应用应在自己的事件适配层中转换成稳定 UI 协议

### 八、事件消费与运行终止

停止 `for await` 只表示调用方不再读取这个事件迭代器，不必然表示 Agent 已经停止

如果希望主动取消运行，应显式调用 `run.abort()` 或使用 `AbortSignal`

如果只是停止展示部分事件，但仍希望保存最终 Checkpoint，应继续等待：

```ts
const finalState = await run.output;
```

`run.toolCalls` 中每个调用的 `output` 也是 Promise；工具失败时该 Promise 会拒绝，消费该投影的应用必须处理失败：

```ts
for await (const call of run.toolCalls) {
  call.output.catch(() => undefined);
}
```

**Tool Error 事件**、**Tool Call Output 失败** 与整个 **Agent Run** 失败不是同一件事，Middleware 可能把工具异常转换为 `ToolMessage`，让模型继续恢复

### 九、应用事件适配层

框架事件通常包含节点名、完整 State、消息对象和 Provider 元数据，直接暴露给界面会造成强耦合和信息泄露风险

应用可以把它们转换为少量稳定事件：

```text
model_message
tool_call
tool_result
tool_error
state_update
custom_progress
run_completed
```

> ==**框架事件是运行事实，应用事件是对外契约，二者之间应该有明确适配边界**==

### 十、最小完整示例

```ts
import { MemorySaver } from "@langchain/langgraph";
import { createAgent } from "langchain";

const agent = createAgent({
  model,
  tools: [searchDocs],
  checkpointer: new MemorySaver(),
});

const config = {
  configurable: {
    thread_id: "thread-123",
  },
};

await agent.invoke(
  { messages: [{ role: "user", content: "搜索 Tool Calling" }] },
  config,
);

const stream = await agent.stream(
  { messages: [{ role: "user", content: "继续总结刚才的结果" }] },
  {
    ...config,
    streamMode: "updates",
  },
);

for await (const update of stream) {
  console.log(update);
}
```

这个示例同时体现：

- 同一 `thread_id` 延续 State
- 第二次调用只提交新增消息
- Checkpointer 负责恢复和保存
- Streaming 逐步返回本轮 State 更新

### 十一、核心结论

- **Agent State** 保存 Agent 当前运行数据，默认核心字段是 `messages`
- **Checkpointer** 按 `thread_id` 保存和恢复 State，形成 Thread 级短期 **Memory**
- `MemorySaver` 只适合进程内学习和测试，不是生产持久化方案
- **Runtime Context** 每次调用重新传入，不会随 Thread State 自动恢复
- `stream()` 按模式输出增量数据，`runtime.writer` 提供自定义进度通道
- `streamEvents()` v3 提供更丰富的协议事件和运行投影，但当前仍是实验性 API
- 停止消费事件不等于取消运行，是否等待最终 State、保存 Checkpoint 或主动 `abort()` 必须由应用明确决定

### 十二、复习问题

- **Agent State**、短期 **Memory** 与 **Checkpointer** 分别是什么关系
- 为什么接入 Checkpointer 后，每次调用通常只传入本轮新增消息
- `thread_id` 为什么是状态索引，却不能直接充当权限凭证
- **Runtime Context** 与 Thread State 在生命周期和可见性上有什么区别
- `MemorySaver` 能证明哪些框架语义，不能证明哪些生产能力
- `updates`、`messages` 与 `custom` 三种 Stream Mode 各自适合展示什么
- `runtime.writer` 写出的进度与 Tool 函数返回值有什么区别
- `stream()` 与 `streamEvents()` 的关注层级有什么区别
- 为什么停止遍历事件不一定会终止 Agent Run
- Tool 失败事件、Tool Output Promise 拒绝和整个 Agent Run 失败为什么不能混为一谈
- 为什么应用不应把框架原始事件对象直接暴露给前端
- 长对话持续保存全部 Messages 会产生哪些成本和治理问题

### 十三、参考资料

- **[LangChain JavaScript Short-term Memory](https://docs.langchain.com/oss/javascript/langchain/short-term-memory)**
- **[LangChain JavaScript Streaming](https://docs.langchain.com/oss/javascript/langchain/streaming)**
- **[LangChain JavaScript Event Streaming](https://docs.langchain.com/oss/javascript/langchain/event-streaming)**
- **[LangChain JavaScript Runtime](https://docs.langchain.com/oss/javascript/langchain/runtime)**

### 十四、复习参考答案

#### 1. **Agent State**、短期 **Memory** 与 **Checkpointer**

- **Agent State** 保存当前运行所需并持续更新的数据，默认核心字段是 `messages`

- **Checkpointer** 按 `thread_id` 保存和恢复 **State**

- 短期 **Memory** 是同一 **Thread** 在多次调用之间延续 **State** 后表现出的能力

三者分别是被保存的数据、保存与恢复机制，以及最终形成的跨调用连续性

#### 2. 为什么每次通常只传本轮新增消息

- 接入 **Checkpointer** 后，框架会根据 `thread_id` 恢复之前保存的 **State**，再把本轮新增消息合并进去

- 如果应用同时重复提交完整历史，同一批消息可能再次写入 **State**，造成上下文重复


#### 3. `thread_id` 为什么不是权限凭证

- `thread_id` 只是查找 **Checkpoint** 的状态索引，不包含已认证身份、所有权或访问授权
- 如果应用仅凭调用方提供的 `thread_id` 读取状态，攻击者可能通过猜测或替换标识访问其他会话
- 生产系统必须先验证用户或租户对该 **Thread** 的所有权

#### 4. **Runtime Context** 与 Thread State

- **Runtime Context**
  - 生命周期通常只有单次调用
  - 由应用重新传入，默认不进入模型，也不会因 `thread_id` 相同而自动恢复

- **Thread State**
  - 在一次运行中持续更新
  - 可以由 **Checkpointer** 按 `thread_id` 保存，并在后续调用中恢复

#### 5. MemorySaver 能证明和不能证明什么

- 能证明
  - **State** 可以被保存和恢复
  - 相同 `thread_id` 能延续消息，不同 **Thread** 能保持状态隔离

- 不能证明
  - 进程重启后的持久恢复
  - 多实例共享、并发一致性、备份与迁移
  - 租户隔离、隐私删除、审计和长期 **Memory** 治理

`MemorySaver` 适合学习与测试，不能作为生产持久化能力的证据

#### 6. 三种 **Stream Mode**

- `updates`
  - 展示每个 **Agent** 步骤完成后的 **State** 更新，适合观察节点推进和状态变化

- `messages`
  - 展示模型消息或 Token 及其元数据，适合对话输出和打字机效果

- `custom`
  - 展示节点或 **Tool** 主动写入的自定义进度，适合业务阶段提示

#### 7. `runtime.writer` 与 **Tool** 返回值

`runtime.writer` 把自定义进度写入流，供界面或调用方观察，不会自动成为 **Tool** 的业务结果

**Tool** 函数返回值会形成工具执行结果并进入 **Agent** 控制流，通常还会作为 `ToolMessage` 提供给模型

#### 8. `stream()` 与 `streamEvents()`

- `stream()` 面向常用的增量结果，通过 `updates`、`messages`、`custom` 等模式选择需要观察的数据

- `streamEvents()` 面向更底层的运行协议，能够区分模型、**Tool**、**State** 等事件，并提供最终 `output`、运行投影和 `abort()` 等控制能力

`streamEvents()` 的协议更丰富，但应用也更需要通过适配层隔离实验性接口变化

#### 9. 为什么停止遍历不等于终止运行

停止 `for await` 只表示消费方不再读取事件，底层 **Agent Run** 仍可能继续执行模型、工具并保存最终 **Checkpoint**

真正取消运行需要调用 `abort()` 或触发对应的 `AbortSignal`；如果仍希望得到最终状态，则应继续等待 `run.output`

#### 10. 三种工具失败表现为什么不能混为一谈

- **Tool Error 事件**：对运行事实的一次观察，表示某次工具执行发生异常

- **Tool Output Promise** 拒绝：某个工具调用投影无法产出正常结果，消费方需要处理该 Promise

- 整个 **Agent Run** 失败：异常没有被恢复，导致运行无法继续并以失败结束

**Middleware** 可能把工具异常转换为 `ToolMessage` 让模型继续，因此出现前两种现象不一定意味着整个运行失败

#### 11. 为什么要增加应用事件适配层

框架原始事件可能包含完整 **State**、内部节点名、供应商元数据和敏感信息，而且协议还可能随版本变化

应用应把它们转换成稳定、最小且经过脱敏的业务事件，避免前端与框架实现强耦合

#### 12. 长对话持续保存全部 **Messages** 的问题

- 上下文持续增长，增加 Token 成本、延迟并可能降低相关信息的信噪比

- 旧消息可能已经失效，却仍然影响模型判断

- 长期保留会扩大隐私、删除、审计和数据泄露风险

- **Checkpoint** 存储量和恢复成本也会持续增加

因此应用仍需设计消息裁剪、摘要、删除和生命周期策略
