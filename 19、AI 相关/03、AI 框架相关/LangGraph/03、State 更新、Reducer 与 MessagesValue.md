## **State Update**、**Reducer** 与 MessagesValue

> 适用版本：`@langchain/langgraph@1.4.13`、`@langchain/core@1.2.9`、`zod@4.5.4`

**LangGraph State** 不是每次整体替换的单一对象，而是由多个字段通道组成，每个字段都可以拥有独立的更新规则

```text
Node 返回 State Update
  -> Graph Runtime 按字段读取更新规则
  -> 普通字段使用新值覆盖旧值
  -> ReducedValue 调用 Reducer 合并新旧值
  -> MessagesValue 按消息 ID 和消息类型合并
  -> 形成下一个完整 State
```

> ==**Node** 只声明“本次更新什么”，**Graph Runtime** 负责“这些更新如何进入完整 State”==

### 一、**State Update** 与字段通道

#### 1.1、**State Update** 不是完整 **State**

**Node** 通常只返回本次需要修改的字段：

```ts
const normalize: typeof State.Node = (state) => ({
  normalizedRequest: state.request.trim(),
  status: "normalized",
});
```

假设当前 **State** 是：

```ts
{
  request: "  LangGraph  ",
  normalizedRequest: "",
  status: "received",
  trace: [],
}
```

**Node** 返回：

```ts
{
  normalizedRequest: "LangGraph",
  status: "normalized",
}
```

**Runtime** 应用更新后得到：

```ts
{
  request: "  LangGraph  ",
  normalizedRequest: "LangGraph",
  status: "normalized",
  trace: [],
}
```

没有出现在 **State Update** 中的字段会保留原值

#### 1.2、每个字段有自己的更新规则

`StateSchema` 中的每个字段都会映射为独立状态通道：

| 字段定义 | 更新方式 | 常见用途 |
|---|---|---|
| 普通 **Standard Schema** | 新值覆盖旧值 | 状态、当前结果、单值配置 |
| `ReducedValue` | 使用自定义 **Reducer** 合并 | 轨迹、计数器、累积结果 |
| `MessagesValue` | 使用消息感知 **Reducer** 合并 | 对话消息、**Tool Call** 与 **Tool Result** |

同一个 **Node** 返回的多个字段，可以分别使用不同规则处理

### 二、默认覆盖规则

普通 **Schema** 字段采用“最后一个值”语义：

```ts
const State = new StateSchema({
  status: z.string().default("received"),
  plan: z.array(z.string()).default(() => []),
});
```

假设旧值和更新分别是：

```ts
const currentState = {
  status: "received",
  plan: ["旧计划"],
};

const update = {
  status: "ready",
  plan: ["新计划"],
};
```

应用更新后：

```ts
{
  status: "ready",
  plan: ["新计划"],
}
```

数组也不会因为是数组就自动追加；是否覆盖或累积取决于字段定义，不取决于 **JavaScript** 值的外形

如果同一执行步中的多个并行 **Node** 同时写入一个没有 **Reducer** 的字段，**Runtime** 无法确定更新顺序，通常会抛出并发更新错误

### 三、ReducedValue

#### 3.1、作用

`ReducedValue` 为一个字段绑定自定义 **Reducer**，使新更新不再直接覆盖旧值

```text
current：字段当前已经保存的完整值
update：本次 Node 返回给该字段的新值

Reducer(current, update)
  -> 该字段下一时刻的完整值
```

#### 3.2、语法、入参与出参

**语法：**

```ts
const field = new ReducedValue(valueSchema, init);
```

**入参：**

| 参数 | 类型 | 说明 |
|---|---|---|
| `valueSchema` | **Standard Schema** | 描述经过合并后保存在完整 **State** 中的值 |
| `init.reducer` | `(current, update) => value` | 合并字段当前值与本次更新，返回新的完整值 |
| `init.inputSchema` | **Standard Schema** | 可选，单独约束每次 **State Update** 接受的值 |
| `init.jsonSchemaExtra` | `object` | 可选，为生成的 **JSON Schema** 补充描述信息 |

**出参：**

返回 `ReducedValue` 实例，将它作为 `StateSchema` 的字段定义使用，不直接调用它执行合并

```ts
import { ReducedValue, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  trace: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.array(z.string()),
    reducer: (current, update) => [...current, ...update],
  }),
});
```

这里完整 **State** 中的 `trace` 是字符串数组，每次 **Node** 更新也提交字符串数组

```ts
const firstNode: typeof State.Node = () => ({
  trace: ["first_node"],
});

const secondNode: typeof State.Node = () => ({
  trace: ["second_node"],
});
```

两个 **Node** 依次执行后：

```ts
{
  trace: ["first_node", "second_node"],
}
```

#### 3.3、**Reducer** 的执行权

**Node** 不会主动调用 **Reducer**：

```text
Node 返回 { trace: ["second_node"] }
  -> Runtime 找到 trace 对应的 ReducedValue
  -> Runtime 调用 reducer(currentTrace, newTrace)
  -> Runtime 保存 reducer 返回的新 trace
```

因此职责边界是：

- **Node**：产生字段更新
- **ReducedValue**：声明字段合并规则
- **Reducer**：计算新字段值
- **Graph Runtime**：决定何时调用 **Reducer** 并保存结果

### 四、MessagesValue

#### 4.1、它是什么

`MessagesValue` 是预配置好的 `ReducedValue`，内部使用消息感知 **Reducer** 管理 `BaseMessage[]`

它是可以直接放入 `StateSchema` 的常量，不是需要 `new MessagesValue()` 创建的类

```ts
import { MessagesValue, StateSchema } from "@langchain/langgraph";

const State = new StateSchema({
  messages: MessagesValue,
});
```

#### 4.2、输入与输出

| 位置 | 接受的数据 | 结果 |
|---|---|---|
| 初始 **State** | 单条消息、消息数组或 `role/content` 消息对象 | 标准化后的 `BaseMessage[]` |
| **Node State Update** | 单条消息或消息数组 | 与现有消息按语义合并 |
| 完整 **State** | `BaseMessage[]` | 可以通过 `.content`、`.id` 等属性读取 |

```ts
const addAnswer: typeof State.Node = () => ({
  messages: [
    new AIMessage({
      id: "answer",
      content: "初版回答",
    }),
  ],
});
```

#### 4.3、消息合并规则

`MessagesValue` 不只是对数组执行 `concat()`：

- 新消息没有匹配到已有消息 ID：追加到列表末尾
- 新消息与已有消息 ID 相同：在原位置更新已有消息
- 消息没有 ID：**Reducer** 会补充稳定 ID
- `role/content` 等消息对象：转换为 **LangChain Message**
- `RemoveMessage` 指向已有 ID：删除对应消息

```ts
const first = new AIMessage({
  id: "answer",
  content: "初版回答",
});

const revised = new AIMessage({
  id: "answer",
  content: "修订后的回答",
});
```

依次提交 `first` 和 `revised` 后，消息列表中只保留一条 ID 为 `answer` 的消息，内容变为“修订后的回答”

#### 4.4、清空消息

清空全部消息可以使用带有 `REMOVE_ALL_MESSAGES` ID 的 `RemoveMessage`：

```ts
import { RemoveMessage } from "@langchain/core/messages";
import { REMOVE_ALL_MESSAGES } from "@langchain/langgraph";

const clearMessages: typeof State.Node = () => ({
  messages: [new RemoveMessage({ id: REMOVE_ALL_MESSAGES })],
});
```

`REMOVE_ALL_MESSAGES` 是消息 **Reducer** 理解的专用标记，不是普通业务消息 ID

### 五、Overwrite

#### 5.1、作用

对于配置了 **Reducer** 的字段，普通更新会进入合并逻辑；`Overwrite` 用于明确绕过 **Reducer**，直接把字段替换为指定值

#### 5.2、语法、入参与出参

**语法：**

```ts
const overwrite = new Overwrite(value);
```

**入参：**

| 参数 | 类型 | 说明 |
|---|---|---|
| `value` | 字段完整值类型 | 希望直接写入字段的新完整值 |

**出参：**

返回 `Overwrite` 包装对象，**Runtime** 识别后跳过该字段的 **Reducer**

```ts
const clearTrace: typeof State.Node = () => ({
  trace: new Overwrite<string[]>([]),
});
```

#### 5.3、空更新与清空不同

对于使用数组拼接 **Reducer** 的字段：

```ts
return { trace: [] };
```

表示让 **Reducer** 合并一个空数组，通常不会改变原值

```ts
return { trace: new Overwrite([]) };
```

才表示绕过 **Reducer**，把字段明确替换为空数组

如果同一执行步中有多个 `Overwrite` 同时写入同一字段，**Runtime** 无法选择其中一个，会抛出更新错误

### 六、MessagesValue 与 **Checkpointer** 的边界

二者解决不同问题：

```text
MessagesValue
  -> 决定一次 State 更新中消息如何合并

Checkpointer
  -> 决定一次执行后的 State 快照如何保存和读取
```

- 没有 **Checkpointer**，`MessagesValue` 仍能在当前执行中正确合并消息
- 没有 `MessagesValue`，即使配置 **Checkpointer**，普通消息数组更新仍可能直接覆盖旧数组
- `MessagesValue` 不会自动压缩上下文、检索长期记忆或管理会话权限
- **Checkpointer** 保存完整 **State** 快照，不只保存消息字段

> ==`MessagesValue` 管合并，**Checkpointer** 管快照==

### 七、最小示例

```ts
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {
  END,
  MessagesValue,
  ReducedValue,
  START,
  StateGraph,
  StateSchema,
  type GraphNode,
} from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  // 普通字段：新值覆盖旧值
  status: z.enum(["received", "drafted", "ready"]).default("received"),

  // 累积字段：Reducer 合并当前数组和新数组
  trace: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.array(z.string()),
    reducer: (current, update) => [...current, ...update],
  }),

  // 消息字段：按消息 ID 和消息类型合并
  messages: MessagesValue,
});

const draft: GraphNode<typeof State> = () => ({
  status: "drafted",
  trace: ["draft"],
  messages: [
    new AIMessage({ id: "answer", content: "初版回答" }),
  ],
});

const revise: GraphNode<typeof State> = () => ({
  status: "ready",
  trace: ["revise"],
  // 相同 ID 会更新原消息，不会再追加一条
  messages: [
    new AIMessage({ id: "answer", content: "修订后的回答" }),
  ],
});

const graph = new StateGraph(State)
  .addNode("draft", draft)
  .addNode("revise", revise)
  .addEdge(START, "draft")
  .addEdge("draft", "revise")
  .addEdge("revise", END)
  .compile();

const result = await graph.invoke({
  messages: [new HumanMessage("请生成回答")],
});

console.log(result.status);
// "ready"：普通字段被最后一次更新覆盖

console.log(result.trace);
// ["draft", "revise"]：ReducedValue 累积两次更新

console.log(result.messages.map((message) => message.content));
// ["请生成回答", "修订后的回答"]：新消息追加，同 ID 消息更新
```

### 八、关键边界与常见误区

- **State Update** 是部分更新，不是必须返回完整 **State**
- 普通数组字段默认覆盖，不会自动追加
- **Reducer** 属于字段定义，**Node** 只返回更新值
- **Reducer** 的 `current` 是字段当前完整值，`update` 是本次写入值
- 返回空数组仍会经过 **Reducer**，不一定代表清空
- `Overwrite` 绕过 **Reducer**，适合显式替换完整字段值
- `MessagesValue` 根据消息 ID 更新，不是无条件追加
- `MessagesValue` 负责消息合并，不等于消息持久化或长期 **Memory**
- **Schema** 校验更新结构，但不能替代业务规则校验

### 九、核心结论

- **LangGraph State** 由多个具有独立更新规则的字段通道组成
- 普通 **Schema** 字段使用覆盖语义
- `ReducedValue` 使用自定义 **Reducer** 合并字段当前值与新更新
- `MessagesValue` 是内置的消息感知 `ReducedValue`
- `Overwrite` 用于绕过 **Reducer**，直接替换字段完整值
- **Node** 产生 **State Update**，**Graph Runtime** 负责应用更新规则
- 消息合并与状态快照持久化是两个不同机制

### 十、复习问题

1. **State**、**State Update** 和字段通道分别是什么
2. 普通字符串或数组字段收到新值时如何更新
3. `ReducedValue` 的构造参数和返回值是什么
4. **Reducer** 的 `current` 与 `update` 分别来自哪里，由谁调用
5. `MessagesValue` 为什么不能简单理解为数组拼接
6. 相同消息 ID 的更新与新消息分别如何处理
7. 为什么 `{ trace: [] }` 不一定能清空累积字段
8. `Overwrite` 的入参、出参和运行时作用是什么
9. `MessagesValue` 与 **Checkpointer** 分别解决什么问题
10. 普通字段被多个并行 **Node** 同时写入时为什么可能失败

### 十一、参考资料

- [LangGraph Graph API](https://docs.langchain.com/oss/javascript/langgraph/graph-api)
- [Use the Graph API](https://docs.langchain.com/oss/javascript/langgraph/use-graph-api)
- [Invalid Concurrent Graph Update](https://docs.langchain.com/oss/javascript/langgraph/errors/INVALID_CONCURRENT_GRAPH_UPDATE)

### 十二、复习参考答案

#### 1. **State**、**State Update** 与字段通道

- **State** 是当前执行时刻的完整共享数据快照
- **State Update** 是 **Node** 本次希望写入的部分字段
- 每个字段对应独立通道，通道决定该字段使用覆盖还是 **Reducer** 合并

#### 2. 普通字段的更新方式

普通 **Standard Schema** 字段使用最后值语义，新值覆盖旧值

数组也不会自动追加，如果需要累积数组，必须显式配置 `ReducedValue`

#### 3. `ReducedValue` 的入参与出参

- `valueSchema` 描述合并后保存在完整 **State** 中的字段值
- `init.reducer` 定义当前值和新更新如何合并
- `init.inputSchema` 可以单独约束每次更新值
- 构造结果是可以放入 `StateSchema` 的 `ReducedValue` 字段定义

#### 4. **Reducer** 的两个参数与调用方

- `current` 来自该字段当前已经保存的完整值
- `update` 来自 **Node** 本次返回的 **State Update**
- **Graph Runtime** 在应用更新时调用 **Reducer**，**Node** 不直接调用它

#### 5. `MessagesValue` 不只是数组拼接

它会把输入转换为 **LangChain Message**，为缺少 ID 的消息生成 ID，追加新消息，按相同 ID 更新已有消息，并识别 `RemoveMessage`

#### 6. 新消息与同 ID 消息

- 没有匹配 ID 的新消息追加到列表末尾
- 与已有消息 ID 相同的消息在原位置更新，不会无条件增加消息数量

#### 7. 空数组为什么不一定清空

`{ trace: [] }` 仍然是一次普通更新，会进入该字段的 **Reducer**

如果 **Reducer** 使用数组拼接，旧数组与空数组合并后仍然是旧数组；清空需要使用 `Overwrite([])` 或字段专用删除语义

#### 8. `Overwrite` 的作用

`new Overwrite(value)` 接收希望写入的完整字段值，返回 **Runtime** 可识别的包装对象

**Runtime** 发现它后绕过该字段的 **Reducer**，直接用其中的值替换原字段

#### 9. `MessagesValue` 与 **Checkpointer**

- `MessagesValue` 决定一次 **State Update** 中消息怎样合并
- **Checkpointer** 保存和读取不同执行时刻的完整 **State** 快照
- 前者是字段更新规则，后者是运行状态持久化机制

#### 10. 普通字段的并发写入

普通字段没有 **Reducer**，同一执行步中如果多个并行 **Node** 同时写入，**Runtime** 无法确定应该保留哪个值，因此会抛出并发更新错误

需要并行合并时，应为该字段定义具有明确语义的 **Reducer**
