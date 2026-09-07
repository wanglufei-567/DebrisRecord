## `createAgent()` 与 **Agent State**

第三阶段手写的 **Tool Loop** 通常包含重复的通用控制逻辑：

```text
调用 Model
  -> 检查 Tool Calls
  -> 执行 Tool
  -> 回填 ToolMessage
  -> 再次调用 Model
  -> 直到生成最终结果或触发限制
```

`createAgent()` 将 **Model**、**Tools**、**System Prompt**、结果格式和通用循环组合成预置 **Agent Harness**

> ==**createAgent() 隐藏的是通用循环实现，不是应用对 Tool、资源和结果的责任**==

### 一、创建 **Agent**

#### 1.1、基本语法

```ts
import { createAgent } from "langchain";

const agent = createAgent({
  model,
  tools,
  systemPrompt: "你是一个技术资料整理助手",
});
```

`createAgent()` 返回可执行的 **ReactAgent**，它运行在 **LangChain** 内部使用的 **LangGraph Runtime** 上

主要参数：

| 参数 | 作用 |
|---|---|
| `model` | 负责推理、**Tool** 选择和最终回答的 **Chat Model** |
| `tools` | **Agent** 允许执行的 **Tool** 集合 |
| `systemPrompt` | 每次模型判断时使用的系统指令 |
| `responseFormat` | 最终结构化结果契约 |
| `middleware` | 在模型或 **Tool** 调用周围增加控制点 |
| `stateSchema` | 扩展 **Agent State** 的字段与更新规则 |
| `checkpointer` | 保存可跨调用恢复的 **Thread State** |

当前只需要前四项，**Middleware**、扩展 **State** 和 **Checkpointer** 属于后续能力

### 二、调用 **Agent**

#### 2.1、输入

`agent.invoke()` 接收的是初始 **State**：

```ts
const result = await agent.invoke({
  messages: [new HumanMessage("搜索并整理 Tool Calling")],
});
```

它与 `model.invoke(messages)` 的边界不同：

```text
model.invoke(messages)
  -> 返回一次模型调用产生的 AIMessage

agent.invoke({ messages })
  -> 运行完整 Agent Loop
  -> 返回循环结束后的 Agent State
```

#### 2.2、运行配置

```ts
const result = await agent.invoke(
  { messages },
  {
    recursionLimit: 12,
    signal: AbortSignal.timeout(60_000),
  },
);
```

- `recursionLimit` 限制图运行步数，避免模型与 **Tool** 无限循环
- `signal` 允许应用超时或主动取消整个 **Agent Run**

`recursionLimit` 不是精确的 **Tool** 执行次数，因为一个 **Agent** 循环包含模型节点、工具节点和其他状态转移

### 三、**Agent State** 输出

最基本的结果包含：

```ts
{
  messages: BaseMessage[];
  structuredResponse?: StructuredResult;
}
```

`messages` 保存本次运行形成的完整消息轨迹：

```text
HumanMessage
  -> AIMessage(tool_calls)
  -> ToolMessage
  -> AIMessage(tool_calls)
  -> ToolMessage
  -> AIMessage(final)
```

`structuredResponse` 保存经过最终 **Schema** 解析和校验的业务结果

没有配置 **Checkpointer** 时，`createAgent()` 不会自动记住下一次独立调用

应用仍需再次传入旧 **Messages**，或在后续接入 **Thread Checkpointer**

如果前置 **Structured Output** 的结果既不进入 **Agent State**，也不影响 **Tool**、**Prompt** 或路由

**Agent** 已通过 `responseFormat` 提供最终结构时，通常应收敛为单一模型链路

### 四、**Agent** 内部控制流

```text
输入 State
  -> Model Node
     -> 没有 Tool Call：结束或生成结构化结果
     -> 存在 Tool Call：进入 Tools Node
  -> Tool Schema 校验与执行
  -> ToolMessage 写回 State
  -> 返回 Model Node
  -> 达到最终结果或触发停止条件
```

与手写循环相比：

| 控制点 | 手写 **Tool Loop** | `createAgent()` |
|---|---|---|
| 调用 **Model** | 应用显式调用 | **Agent Model Node** 调用 |
| 检查 **Tool Calls** | 应用遍历 | **Agent** 自动路由 |
| 执行 **Tool** | 应用查找并执行 | **Agent Tools Node** 执行 |
| 回填 `ToolMessage` | 应用追加 | **Agent** 更新 **State** |
| 继续或结束 | 应用写循环条件 | **Agent Graph** 决定转移 |
| **Tool** 范围与权限 | 应用负责 | 仍由应用负责 |

### 五、`responseFormat`

#### 5.1、最终结果 **Schema**

```ts
const ResearchSummarySchema = z.object({
  topic: z.string(),
  answer: z.string(),
  keyPoints: z.array(z.string()),
  sources: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
    }),
  ),
});
```

```ts
const agent = createAgent({
  model,
  tools,
  responseFormat: ResearchSummarySchema,
});

const result = await agent.invoke({ messages });
console.log(result.structuredResponse);
// {
//   topic: "Tool Calling",
//   answer: "Tool Calling 允许模型生成结构化工具调用请求……",
//   keyPoints: ["模型负责决策", "运行时负责执行"],
//   sources: [{ id: "doc-1", title: "Tool Calling 概览" }],
// }（示例，实际内容由 Agent Run 生成）
```

`responseFormat` 约束的是完整 **Agent Run** 的最终业务结果，不是每个 **Tool** 的输入或输出

#### 5.2、两种策略

**LangChain** 可以使用两种方式生成 **Agent** 最终结构：

| 策略 | 机制 | 依赖 |
|---|---|---|
| **Provider Strategy** | 使用 **Provider** 原生 **Structured Output** | 当前模型端点接受对应 `response_format` |
| **Tool Strategy** | 把最终 **Schema** 转为特殊结果 **Tool** | 模型接受所需 **Tool Calling** 与 `tool_choice` |

可以显式选择：

```ts
import { providerStrategy, toolStrategy } from "langchain";

responseFormat: providerStrategy(ResearchSummarySchema);
responseFormat: toolStrategy(ResearchSummarySchema);
```

传入原始 **Schema** 时，**LangChain** 会根据 **Model Profile** 选择策略；**Profile** 是路由信息，不是对 **Provider** 实时能力的证明

### 六、**Tool Strategy** 的消息轨迹

使用 **Tool Strategy** 时，最终结构本身表现为一个特殊 **Tool Call**：

```text
AIMessage
  tool_calls: [{
    name: "research_summary",
    args: { topic, answer, keyPoints, sources }
  }]
  -> ToolMessage：结构化结果已接收
  -> Agent structuredResponse
```

因此“没有调用业务 **Tool**”不代表 **State** 中完全没有 **Tool Message**；最终结果 **Tool** 与搜索、数据库、文件等业务 **Tool** 的职责不同

### 七、最小示例

```ts
import {
  createAgent,
  HumanMessage,
  initChatModel,
  tool,
  toolStrategy,
} from "langchain";
import { z } from "zod";

const search = tool(async ({ query }) => `result for ${query}`, {
  name: "search_docs",
  description: "搜索技术资料",
  schema: z.object({ query: z.string() }),
});

const ResultSchema = z
  .object({
    answer: z.string(),
    sources: z.array(z.string()),
  })
  .meta({ title: "research_result" });

const model = await initChatModel("deepseek:deepseek-v4-flash", {
  apiKey: process.env.DEEPSEEK_API_KEY,
  modelKwargs: {
    thinking: { type: "disabled" },
  },
});

const agent = createAgent({
  model,
  tools: [search],
  systemPrompt: "需要资料时先搜索，只引用 Tool 返回的内容",
  responseFormat: toolStrategy(ResultSchema, {
    handleError: false,
  }),
});

const result = await agent.invoke(
  {
    messages: [new HumanMessage("查询 Tool Calling")],
  },
  {
    recursionLimit: 12,
  },
);

console.log(result.messages);
// [HumanMessage, AIMessage(tool_calls), ToolMessage, AIMessage, ...]（示例执行轨迹）

console.log(result.structuredResponse);
// { answer: "Tool Calling 允许模型请求外部能力……", sources: ["result for Tool Calling"] }（示例）
```

这里关闭 **Thinking** 是当前 **DeepSeek** 与强制结果 **Tool** 的兼容选择，不是所有 **Provider** 使用 `createAgent()` 的通用要求

### 八、停止与失败边界

**Agent** 可以因为以下原因结束或失败：

- 模型生成最终回答或最终结构
- 达到 `recursionLimit`
- **Tool Schema** 或 **Tool** 实现抛错
- 最终结果不满足 `responseFormat`
- **Provider** 调用失败或整体超时

**System Prompt** 可以要求模型在空结果时停止，但不能确定性保证模型遵守；可靠系统仍需由 **Runtime** 或 **Middleware** 实施限制

> ==**Agent Harness 提供循环，不保证循环必然收敛，也不替代确定性护栏**==

### 九、责任边界

| 组件 | 主要责任 |
|---|---|
| **LLM** | 解释目标、选择 **Tool**、生成参数、根据结果继续决策 |
| **Tool** | 执行受约束的确定性能力 |
| `createAgent()` | 组织 **Model Node**、**Tools Node**、消息回填与状态转移 |
| **Agent State** | 保存一次运行中的 **Messages** 与结构化结果 |
| 应用 **Runtime** | 凭据、工具范围、权限、超时、递归限制、最终验收 |

### 十、核心结论

- `createAgent()` 把 **Model**、**Tools**、**Prompt** 和 **State** 组织为预置 **Agent Loop**
- `agent.invoke()` 返回完整 **Agent State**，不是单个 `AIMessage`
- **Tool Call** 和 **ToolMessage** 仍使用第三阶段相同协议，只是循环不再由应用手写
- `responseFormat` 把最终结果放入 `state.structuredResponse`
- **Provider Strategy** 与 **Tool Strategy** 依赖不同的模型能力
- **Model Profile** 只用于能力路由，真实兼容性仍需集成验证
- `recursionLimit` 限制图运行步数，不等于 **Tool** 执行次数
- **Agent Harness** 不自动提供业务权限、事实保障和必然收敛

### 十一、复习问题

- `model.invoke()` 与 `agent.invoke()` 的输入和输出有何区别
- `createAgent()` 接管了手写 **Tool Loop** 中的哪些步骤
- **Agent State** 中的 `messages` 与 `structuredResponse` 分别是什么
- **Provider Strategy** 与 **Tool Strategy** 分别依赖什么
- 为什么没有业务 **Tool** 调用时仍可能出现 **ToolMessage**
- `recursionLimit` 为什么不能理解为 **Tool** 执行次数上限
- 为什么 **System Prompt** 不能替代 **Runtime** 护栏

### 十二、参考资料

- **[LangChain JavaScript Agents](https://docs.langchain.com/oss/javascript/langchain/agents)**
- **[LangChain JavaScript Structured Output](https://docs.langchain.com/oss/javascript/langchain/structured-output)**
- **[LangChain JavaScript Runtime](https://docs.langchain.com/oss/javascript/langchain/runtime)**

### 十三、复习参考答案

#### 1. `model.invoke()` 与 `agent.invoke()`

- `model.invoke()` 接收字符串或消息序列，只执行一次模型调用，返回一个 `AIMessage`

- `agent.invoke()` 接收包含 `messages` 的 **Agent State** 输入以及运行配置，可能在模型与工具之间循环多次，最终返回完整 **Agent State**

#### 2. `createAgent()` 接管的循环步骤

`createAgent()` 接管了手写循环中的通用控制流：

- 调用模型并检查 **Tool Calls**

- 路由和执行已注册的 **Tool**

- 把 `ToolMessage` 写回 **State**

- 再次调用模型，并根据结果决定继续或结束

它不接管业务权限、工具开放范围、凭据、超时和最终业务验收

#### 3. `messages` 与 `structuredResponse`

- `messages`
  - 保存本次 **Agent Run** 形成的消息轨迹，包括用户消息、模型消息、**Tool Call** 和 `ToolMessage`

- `structuredResponse`
  - 保存最终通过 `responseFormat` 解析和 **Schema** 校验的业务对象

前者用于还原运行过程，后者用于向应用交付最终结构化结果

#### 4. **Provider Strategy** 与 **Tool Strategy**

- **Provider Strategy**
  - 依赖当前模型端点支持原生结构化输出和相应 `response_format`

- **Tool Strategy**
  - 把最终 **Schema** 转成特殊结果 **Tool**
  - 依赖模型支持所需的 **Tool Calling** 与 `tool_choice`

**Model Profile** 只能帮助选择策略，不能代替真实接口兼容性验证

#### 5. 没有业务 **Tool** 时为什么仍可能有 `ToolMessage`

- 使用 **Tool Strategy** 时，最终结构化结果本身会被模型表示为一个特殊 **Tool Call**，框架随后用 `ToolMessage` 表示结果已经接收

- 这个结果 **Tool** 只负责交付最终结构，不是搜索、数据库或文件操作等业务 **Tool**


#### 6. `recursionLimit` 为什么不是 **Tool** 调用上限

- `recursionLimit` 限制的是 **Agent Graph** 可以执行的图步骤数，模型节点、工具节点和其他状态转移都可能消耗步骤
- 一次工具节点也可能处理多个 **Tool Calls**，因此图步骤数与工具执行次数不存在一一对应关系；工具数量需要单独的调用限制


#### 7. **System Prompt** 为什么不能替代 **Runtime** 护栏

- **System Prompt** 只是提供给模型的自然语言约束，模型可能误解、忽略或受到其他上下文干扰
- 权限、工具白名单、参数校验、调用次数和超时必须由 **Runtime** 或 **Middleware** 用确定性代码强制执行
