## **Interrupt、Resume 与 Streaming**

> 适用版本：`@langchain/langgraph@1.4.13`

**Interrupt** 允许 **Graph** 在运行中暂停，把结构化信息交给应用，等待外部输入后再从原 **Thread** 恢复

**Streaming** 把运行过程持续暴露给调用方，使应用能够观察消息、状态变化、节点更新、中断和最终结果

```text
Graph 执行
  -> Node 调用 interrupt(payload)
  -> Checkpointer 保存状态和执行位置
  -> 应用取得 Interrupt Payload
  -> 用户或外部系统作出决定
  -> Command({ resume }) 恢复同一 Thread
  -> Node 从开头重新执行
  -> Graph 继续运行
```

> ==**Interrupt** 转移的是工作流控制权，**Streaming** 暴露的是运行过程，二者都不替应用完成身份认证、权限判断或业务审批==

### 一、**Interrupt** 的核心关系

动态中断依赖三个对象：

| 对象 | 职责 |
|---|---|
| **Checkpointer** | 保存暂停时的 **State** 与执行位置 |
| `thread_id` | 让后续调用找到同一条暂停状态序列 |
| `interrupt()` | 在 **Node** 内触发暂停并向调用方暴露 **Payload** |

没有 **Checkpointer**，**Graph Runtime** 无法保存可恢复的暂停点；恢复时换了 `thread_id`，也无法命中原来的暂停任务

### 二、`interrupt()`

#### 2.1、语法与返回值

```ts
import { interrupt } from "@langchain/langgraph";

const reviewNode = (state: typeof State.State) => {
  const decision = interrupt({
    kind: "tool_approval",
    toolName: state.toolName,
    args: state.toolArgs,
  });

  return {
    approved: decision === "approve",
  };
};
```

方法签名可以概括为：

```ts
interrupt(payload) -> resumeValue
```

| 位置 | 含义 |
|---|---|
| `payload` | 提供给调用方的可序列化中断信息 |
| 初次执行 | 没有普通返回值，**Graph** 暂停并把 **Payload** 暴露给调用方 |
| 恢复执行 | `Command({ resume: value })` 中的 `value` 成为 `interrupt()` 的返回值 |

**Payload** 应只包含恢复决策所需的最小信息，例如动作名称、参数摘要、风险和提示，不应包含密钥、不可序列化对象或完整内部运行对象

#### 2.2、`__interrupt__`

通过 `invoke()` 运行时，暂停结果位于 `__interrupt__`：

```ts
import {
  INTERRUPT,
  isInterrupted,
} from "@langchain/langgraph";

const result = await graph.invoke(input, config);

if (isInterrupted(result)) {
  for (const pending of result[INTERRUPT]) {
    console.log(pending.id);
    console.log(pending.value);
  }
}
```

`isInterrupted()` 是类型守卫，用于判断结果是否包含待处理 **Interrupt**

`pending.id` 标识具体中断，`pending.value` 是传给 `interrupt()` 的 **Payload**

### 三、`Command({ resume })`

```ts
import { Command } from "@langchain/langgraph";

const config = {
  configurable: {
    thread_id: "thread-123",
  },
};

await graph.invoke(input, config);

const result = await graph.invoke(
  new Command({
    resume: {
      decision: "approve",
    },
  }),
  config,
);
```

主要入参与行为：

| 内容 | 含义 |
|---|---|
| `resume` | 提供给暂停点的外部输入 |
| 相同 `thread_id` | 定位原 **Thread** 中等待恢复的任务 |
| 返回值 | 恢复后继续执行得到的最新 **State**，也可能再次中断 |

`Command({ resume })` 是作为 `invoke()` 或 `streamEvents()` 输入使用的恢复命令

普通新一轮对话应继续传入普通 **State Input**，不能用 `Command({ update })` 代替新的调用输入

错误 `thread_id` 不一定产生异常，在当前版本中也可能得到一份空的默认状态，但原 **Thread** 仍保持暂停，因此不能把“是否抛错”作为恢复成功的判断标准

### 四、**Node** 重启语义

恢复并不是重新进入原 JavaScript 调用栈中 `interrupt()` 的下一行

包含 `interrupt()` 的 **Node** 会从函数开头重新执行，直到再次到达同一个 `interrupt()`，此时框架取出 **Resume Value** 并把它作为返回值

```ts
const approvalNode = async (state: typeof State.State) => {
  // 恢复时这里会再次执行
  const request = buildApprovalRequest(state);

  const decision = interrupt(request);

  // 只有取得 Resume Value 后才执行高风险动作
  if (decision === "approve") {
    return executeSideEffect(state);
  }

  return { status: "rejected" };
};
```

因此：

- `interrupt()` 之前的计算必须确定、可重复或幂等
- 写数据库、扣费、发消息和调用外部系统等副作用应放在批准之后
- 不要用普通 `try...catch` 吞掉 `interrupt()` 触发的内部控制异常
- 同一 **Node** 有多个 `interrupt()` 时，不应在恢复期间改变调用顺序
- **Resume Value** 仍需由应用执行 **Schema** 校验，不能默认信任

### 五、批准与拒绝不是框架权限系统

典型工具审批路径：

```text
Model Node 生成 Tool Call
  -> Router 判断该 Tool 是否需要审批
      -> 不需要 -> ToolNode
      -> 需要   -> Approval Node
                     -> interrupt(payload)
                     -> approve -> ToolNode
                     -> reject  -> ToolMessage / END
```

**LangGraph** 提供暂停、保存和恢复机制，但以下内容仍由应用定义：

- 哪些 **Tool** 或参数需要审批
- 谁是合法审批人
- 审批人是否拥有目标资源权限
- 批准、拒绝、修改参数的业务语义
- 审批记录、过期时间和审计要求

**Interrupt** 可以承载权限流程，不能替代权限体系

### 六、`streamEvents()` v3

#### 6.1、创建运行流

```ts
const run = await graph.streamEvents(
  input,
  {
    version: "v3",
    configurable: {
      thread_id: "thread-123",
    },
  },
);
```

主要入参与出参：

| 位置 | 含义 |
|---|---|
| 第一个参数 | 普通 **State Input**、`Command({ resume })` 或 `null` |
| `version` | 事件协议版本，当前使用 `"v3"` |
| `configurable.thread_id` | 启用持久化或恢复时所属的 **Thread** |
| 返回值 | **GraphRunStream** 运行句柄 |

**GraphRunStream** 同时提供原始协议事件、常用投影、最终输出、中断状态和主动取消能力

#### 6.2、原始 **Protocol Event**

```ts
for await (const event of run) {
  console.log(event.seq);
  console.log(event.method);
  console.log(event.params.node);
  console.log(event.params.data);
}
```

常用字段：

| 字段 | 含义 |
|---|---|
| `seq` | 当前运行内严格递增的事件序号 |
| `method` | 事件通道，例如 `messages`、`updates`、`values`、`lifecycle` |
| `params.namespace` | 当前图或子图路径 |
| `params.node` | 能够归属到单一节点时的节点名 |
| `params.data` | 随通道变化的事件数据 |

原始事件适合调试、适配和自定义投影，不适合不经筛选直接暴露给前端

#### 6.3、消息与状态投影

```ts
for await (const message of run.messages) {
  for await (const text of message.text) {
    process.stdout.write(text);
  }
}

for await (const state of run.values) {
  console.log(state);
}
```

- `run.messages` 按模型消息生命周期产生 **Message Stream**，其中 `message.text` 既可逐段迭代，也可等待完整文本
- `run.values` 在每一步后暴露完整 **State**，同时也可以作为最终值等待
- 节点增量更新通过原始 `updates` **Protocol Event** 观察，当前 **GraphRunStream** 没有独立的 `run.updates` 属性
- `run.output` 是最终 **State Promise**

多个投影应并发消费，避免先等待一个完整投影结束后才开始读取另一个投影

```ts
await Promise.all([
  consumeMessages(run.messages),
  consumeRawEvents(run),
]);

const finalState = await run.output;
```

### 七、流式处理中断与取消

运行流结束后可以检查：

```ts
if (run.interrupted) {
  for (const pending of run.interrupts) {
    console.log(pending.interruptId);
    console.log(pending.payload);
  }
}
```

`streamEvents()` v3 的 `run.interrupts` 使用面向事件流的稳定投影：

| 字段 | 含义 |
|---|---|
| `interruptId` | 当前中断实例 ID |
| `payload` | `interrupt()` 提供的结构化信息 |

在当前版本中，流式运行因 **Interrupt** 暂停时，不能假设 `run.output` 已经是包含全部业务字段的完整 **State**

需要展示暂停时状态，可以使用相同 **Thread Config** 查询最新快照：

```ts
if (run.interrupted) {
  const snapshot = await graph.getState(config);
  console.log(snapshot.values);
}
```

停止某个 `for await` 消费者只表示该消费者不再读取事件，不等于底层 **Graph Run** 已取消

需要主动终止时应调用：

```ts
run.abort("用户取消");
```

如果只是停止展示部分事件，但仍希望取得最终结果和保存后的状态，应继续等待 `run.output`

### 八、应用事件适配层

框架事件可能包含完整 **State**、内部节点名、模型元数据和其他不应直接暴露的信息

应用可以把它们转换成稳定的业务事件：

```text
model_text_delta
tool_call_requested
tool_call_completed
state_updated
approval_required
run_completed
run_failed
```

适配层负责筛选、脱敏和稳定协议，不改变 **Graph State**，也不参与模型决策

### 九、最小完整示例

```ts
import {
  Command,
  MemorySaver,
  START,
  StateGraph,
  StateSchema,
  interrupt,
} from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  action: z.string(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

const graph = new StateGraph(State)
  .addNode("review", (state) => {
    // 初次执行在这里暂停，恢复时整个 Node 从头执行
    const decision = interrupt({
      question: "是否执行该动作",
      action: state.action,
    });

    return {
      status: decision === "approve" ? "approved" : "rejected",
    };
  })
  .addEdge(START, "review")
  .compile({ checkpointer: new MemorySaver() });

const config = {
  configurable: {
    thread_id: "thread-123",
  },
};

const firstRun = await graph.invoke(
  { action: "发布报告" },
  config,
);

console.log(firstRun.__interrupt__);

const stream = await graph.streamEvents(
  new Command({ resume: "approve" }),
  {
    ...config,
    version: "v3",
  },
);

for await (const event of stream) {
  console.log(event.method, event.params.node);
}

console.log(await stream.output);
```

### 十、核心结论

- `interrupt(payload)` 暂停 **Graph**，并把可序列化 **Payload** 交给调用方
- `Command({ resume })` 使用相同 `thread_id` 把外部输入送回暂停点
- 恢复时整个 **Node** 从开头重跑，不是恢复原 JavaScript 调用栈
- 审批前代码必须可重复，真实副作用应放在批准之后
- **Interrupt** 提供控制流机制，不提供身份、权限、审批规则和审计体系
- `streamEvents(..., { version: "v3" })` 返回 **GraphRunStream**，可以观察协议事件、消息、状态、中断和最终输出
- 流式运行暂停时，应通过同一 **Thread** 的 `getState()` 读取最新业务状态，不能直接假设 `run.output` 完整
- 停止读取事件不等于取消运行，主动取消需要 `run.abort()`
- 框架原始事件应经过应用适配、筛选和脱敏后再形成对外协议

### 十一、复习问题

- **Interrupt** 为什么依赖 **Checkpointer** 与 `thread_id`
- `interrupt()` 的入参、初次执行结果和恢复后返回值分别是什么
- `invoke()` 结果中的 `__interrupt__` 怎样读取
- `Command({ resume })` 为什么必须使用原来的 `thread_id`
- 使用错误 `thread_id` 恢复时，为什么不能只依赖是否抛异常判断成功
- 恢复时 **Node** 为什么会从头重新执行
- `interrupt()` 之前的代码需要满足什么条件
- 为什么不应使用普通 `try...catch` 包住 `interrupt()`
- **Interrupt** 与权限体系、审批规则是什么关系
- `streamEvents()` v3 返回的 **GraphRunStream** 提供哪些主要能力
- 原始 **Protocol Event** 的 `seq`、`method`、`params.node` 与 `params.data` 分别表示什么
- `run.messages`、`run.values`、`updates` 事件和 `run.output` 有什么区别
- 为什么多个 **Stream** 投影通常需要并发消费
- `run.interrupts` 与 `invoke()` 返回的 `__interrupt__` 在字段形态上有什么区别
- 流式运行发生 **Interrupt** 后，为什么还需要通过 `getState()` 读取暂停状态
- 为什么停止事件遍历不等于取消 **Graph Run**
- 为什么应用需要事件适配层

### 十二、参考资料

- **[LangGraph Interrupts](https://docs.langchain.com/oss/javascript/langgraph/interrupts)**
- **[LangGraph Event Streaming](https://docs.langchain.com/oss/javascript/langgraph/event-streaming)**
- **[LangGraph Streaming](https://docs.langchain.com/oss/javascript/langgraph/streaming)**
- **[LangGraph Graph API](https://docs.langchain.com/oss/javascript/langgraph/graph-api)**

### 十三、复习参考答案

#### 1. **Interrupt** 的依赖关系

**Checkpointer** 保存暂停状态和执行位置，`thread_id` 定位保存这些信息的 **Thread**，缺少任何一个都无法可靠恢复原暂停任务

#### 2. `interrupt()` 的输入与输出

- 入参是提供给调用方的可序列化 **Payload**
- 初次执行时 **Graph** 暂停，**Payload** 出现在中断结果中
- 恢复后，`Command({ resume: value })` 的 `value` 成为 `interrupt()` 返回值

#### 3. 读取 `__interrupt__`

先使用 `isInterrupted(result)` 判断，再从 `result[INTERRUPT]` 读取每个待处理中断的 `id` 和 `value`

#### 4. 为什么必须使用原 `thread_id`

**Resume Command** 本身不包含完整暂停状态，**Graph Runtime** 需要通过 `thread_id` 从 **Checkpointer** 找到原任务

#### 5. 错误 **Thread** 的判断

错误 `thread_id` 可能只是启动或读取另一条空状态序列，并不保证抛出异常

应用应验证原 **Thread** 的暂停任务是否被消费、恢复后的状态和预期中断 ID 是否匹配

#### 6. **Node** 为什么从头执行

框架保存的是可序列化状态和图执行位置，不会长期保存原 JavaScript 函数调用栈

恢复时 **Runtime** 重新调度该 **Node**，并按顺序把已保存的 **Resume Value** 匹配给 `interrupt()`

#### 7. 中断前代码的要求

中断前代码会重复执行，因此应保持确定、可重复或幂等，不应提前执行扣费、写入、发送消息等不可逆副作用

#### 8. 为什么不能普通捕获 `interrupt()`

`interrupt()` 通过框架内部的特殊控制异常把暂停信号交给 **Graph Runtime**

普通 `try...catch` 如果吞掉该异常，**Runtime** 就无法按中断流程保存和返回暂停状态

#### 9. 与权限和审批的关系

**Interrupt** 只提供暂停、传递 **Payload** 和恢复控制流的机制

应用仍需定义审批条件、审批人身份、资源权限、决定校验、审计和过期策略

#### 10. **GraphRunStream** 的主要能力

它可以异步遍历原始协议事件，并提供消息、状态、最终输出、中断信息、生命周期、子图以及主动取消等投影或控制接口

#### 11. **Protocol Event** 字段

- `seq` 表示本次运行内的严格事件顺序
- `method` 表示事件所属通道
- `params.node` 表示事件能够归属的节点
- `params.data` 保存由具体通道定义的事件内容

#### 12. 不同流式信息

- `run.messages` 适合消费模型文本和消息生命周期
- `run.values` 提供每一步后的完整 **State**
- `updates` 原始事件提供节点产生的局部 **State Update**
- `run.output` 在运行结束后返回最终 **State**

#### 13. 为什么并发消费

每个投影都依赖同一个正在进行的事件源，串行等待某个投影完全结束后再订阅另一个投影，可能失去实时性或错过合理的消费时机

#### 14. 两种中断结果形态

- `invoke()` 结果通过 `__interrupt__` 暴露 `id` 与 `value`
- `streamEvents()` v3 通过 `run.interrupts` 暴露 `interruptId` 与 `payload`

它们表达同一个暂停事实，但服务于不同调用接口

#### 15. 流式 **Interrupt** 后读取 **State**

流式运行因 **Interrupt** 暂停时，`run.interrupts` 用于读取审批 **Payload**，最新完整业务状态应通过相同 `thread_id` 调用 `getState()` 读取，不能直接把 `run.output` 假定为完整 **State**

#### 16. 停止遍历与取消

停止一个 `for await` 只结束该消费者，底层 **Graph** 仍可能继续执行并保存结果

真正取消运行需要调用 `run.abort()` 或触发对应的 **AbortSignal**

#### 17. 事件适配层的作用

它把包含内部节点、完整 **State** 和 **Provider** 元数据的框架事件转换为稳定、最小、脱敏的业务事件，避免界面与框架实现强耦合
