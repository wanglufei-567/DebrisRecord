## **Model** 与 **Messages**

> 适用版本：`langchain@1.5.10`、`@langchain/core@1.2.9`、`@langchain/deepseek@1.1.11`

### 一、**LangChain** 是什么

**LangChain** 是一个面向 **LLM 应用**的开发框架，它把不同模型供应商的能力包装成**统一的应用接口**，并提供从 **简单模型调用** 到 **Agent 构建** 所需的**模型**、**消息**、**工具**、**结构化输出**、**Middleware** 和状态等组件

> ==**LangChain** 是 **LLM** 应用层框架：用统一对象描模型、消息和工具，并提供现成的组合机制与 **Agent Loop**，帮助开发者构建应用中的 **AI** 核心==
>
> **LangChain** 是一种典型的 **控制反转（IoC）**实现，将组件注册给框架，由框架在运行过程中调用它们
>
> ==**LangChain** = 统一接口 + 供应商适配器 + 组件模型 + AI 流程编排==
>
> **React** 是 **UI 应用**的组件化框架，**LangChain** 是 LLM 应用的组件化与编排框架

可以先把它理解为两层能力：

- **标准化组件层**：用相对统一的 **Model**、**Message**、**Tool** 等对象连接不同模型供应商
- **Agent Harness 层**：通过 `createAgent` 编排**模型调用**、**工具使用**、**Middleware** 和**消息状态**，当前 **LangChain Agent** 底层编排建立在 **LangGraph** 之上

#### 1.1、**LangChain** 与 **LangGraph** 的关系

这里的“建立在 **LangGraph** 之上”只描述 **LangChain Agent** 的编排实现，不代表整个 **LangChain** 都依赖 **LangGraph** 才能使用

```text
直接调用 model.invoke()
  -> LangChain Model / Message
  -> Provider API
  -> 不进入 LangGraph Agent 编排

使用 createAgent()
  -> LangChain Agent Harness
  -> LangGraph Runtime 执行控制循环
```

- **Model**、**Message**、**Tool** 和 **Structured Output** 是 **LangChain** 的基础组件，可以独立使用
- `createAgent()` 提供高层 **Agent Harness**，它的控制循环由 **LangGraph Runtime** 执行
- **LangGraph** 是更底层的状态化编排框架，负责 **Graph**、**State**、**Node**、**Edge**、持久化和人工介入等能力，也可以脱离 **LangChain Agent** 单独使用

因此学习顺序不是按照底层依赖倒序展开，而是先掌握 **LangChain** 的 **Model**、**Message** 和 **Tool**，再理解 `createAgent()`，最后进入 **LangGraph** 学习底层编排机制

#### 1.2、主要特点

- **统一模型接口**：不同供应商的 **Chat Model** 都能使用 `invoke`、`stream`、`batch` 等通用调用方式
- **组件可组合**：模型、消息、工具、结构化输出和 **Middleware** 可以按需求逐步组合
- **Provider 集成丰富**：通过独立集成包连接 **DeepSeek**、**OpenAI**、**Anthropic**、**Google** 等供应商
- **既能独立调用模型，也能构建 Agent**：可以从一次 `model.invoke()` 开始，再逐步增加工具和控制循环

#### 1.3、适用场景

- 需要用统一方式接入和替换不同模型供应商
- ==需要把自由文本输出约束为可校验的结构化数据==
- 需要为模型绑定本地函数、外部接口或数据查询工具
- 需要构建带消息状态、**Middleware** 和工具调用循环的单 **Agent**
- 需要对模型调用、工具调用和状态变化进行调试与测试

#### 1.4、能力边界

**LangChain** 不是模型，真正的推理由模型供应商完成

它也不是完整的应用 **Runtime** 或安全沙箱，下面这些职责仍属于应用程序：

- 凭据、权限和配置管理
- 用户输入校验和业务规则
- 进程、网络、文件系统和沙箱隔离
- 超时、重试、错误恢复和持久化策略
- 成本、审计、监控和生产稳定性

==**LangChain 统一的是应用调用模型和组织 Agent 能力的接口，不会替应用承担所有运行时责任**==

#### 1.5、FAQ

**Q1：既然原生 SDK 也能调用模型，为什么还需要 LangChain？**

- 如果只是固定模型的一次简单调用，原生 **SDK** 往往更直接
- 当应用开始需要统一消息、结构化输出、工具和 **Agent Loop** 时，**LangChain** 的组合能力才真正产生价值

**Q2：统一接口是否意味着供应商差异消失？**

- 不会，**LangChain** 统一的是主要对象和调用方式，不同 **Provider** 的模型能力、配置、错误、限流和响应元数据仍然存在


- ==**抽象的目标是隔离变化，不是消灭差异**==

**Q3：LangChain Agent 建立在 LangGraph 上，是否应该先学 LangGraph？**

- 不需要，底层实现依赖不等于学习顺序
- 先掌握 **Model**、**Message**、**Tool** 和 `createAgent()`，再下探 **LangGraph**，更容易理解底层究竟在编排什么

**Q4：使用 LangChain 是否就等于构建了 Agent？**

- 不等于，单独调用 `model.invoke()` 仍然只是 **Model Call**
- 只有加入工具选择、结果回填和持续决策循环后，才进入 **Agent** 范畴

### 二、**Model**

#### 2.1、**Model** 是什么

**Model** 准确地说是 **Chat Model 对象**

它不是模型权重本身，而是应用中的模型适配器：接收 **LangChain Message**，转换成 **Provider** 请求，调用远程模型，再把响应转换为 `AIMessage`

```text
应用输入
  -> LangChain Chat Model
  -> Provider API
  -> 真实模型生成
  -> LangChain AIMessage
  -> 应用处理结果
```

#### 2.2、创建 **Model**：`initChatModel`

**语法：**

```ts
const model = await initChatModel(modelName, options);
```

**入参：**

| 参数 | 类型 | 说明 |
|---|---|---|
| `modelName` | `string` | 模型标识，通常使用 `provider:model` 格式，例如 `deepseek:deepseek-v4-flash` |
| `options` | `object` | 模型配置，具体字段由 **Provider** 集成决定 |

常见的 `options`：

| 字段 | 作用 |
|---|---|
| `apiKey` | 供应商凭据，通常优先从环境变量读取 |
| `temperature` | 控制输出随机性，是否支持及有效范围由模型决定 |
| `maxTokens` | 限制最大输出 **Token** 数 |
| `timeout` | 单次供应商请求超时，具体单位和支持情况以对应 **Provider** 集成为准 |
| `maxRetries` | 网络错误、限流或服务端错误发生时的最大重试次数 |

**出参：**

`Promise<ConfigurableModel>`，等待完成后得到一个实现统一 **Chat Model / Runnable** 接口的模型对象

这里返回的是“可调用的模型对象”，不是模型生成结果

```ts
import { initChatModel } from "langchain";

const model = await initChatModel("deepseek:deepseek-v4-flash", {
  apiKey: process.env.DEEPSEEK_API_KEY,
  timeout: 60_000,
  maxRetries: 2,
});
```

使用 `provider:model` 时，项目必须安装对应的 **Provider** 集成包，例如：

```bash
npm install langchain @langchain/deepseek
```

#### 2.3、调用 **Model**：`invoke`

**语法：**

```ts
const response = await model.invoke(input, options);
```

**入参 `input`：**

`invoke` 常用的输入形式有三种：

```ts
// 1. 字符串，适合独立的单轮问题
await model.invoke("什么是 LangChain？");

// 2. Message 对象数组，适合系统指令和多轮上下文
await model.invoke([
  new SystemMessage("你是一个简洁的技术助手"),
  new HumanMessage("什么是 LangChain？"),
]);

// 3. role/content 对象数组
await model.invoke([
  { role: "system", content: "你是一个简洁的技术助手" },
  { role: "user", content: "什么是 LangChain？" },
]);
```

字符串输入是一种简写，进入 **Chat Model** 边界后会被标准化为 **Human Message**

**可选入参 `options`：**

```ts
await model.invoke(messages, {
  signal: controller.signal,
  timeout: 60_000,
});
```

这里重点关注：

- `signal`：允许应用主动中止本次调用
- `timeout`：限制本次调用等待时间

**出参：**

`Promise<AIMessage>`，即模型完成本轮生成后返回的标准消息对象

#### 2.4、**Model** 的其他调用方式

**Chat Model** 还提供：

- `stream()`：增量返回 `AIMessageChunk`
- `batch()`：批量处理多组输入

此处只展开 `invoke()`，流式输出和批处理分别在相关主题中说明

### 三、**Messages**

#### 3.1、**Message** 是什么

**Message** 是 **LangChain** 表示模型上下文的基本数据单元，它同时承载：

- **Role**：谁产生了这条消息
- **Content**：文本、图片、音频、文件或其他内容块
- **Metadata**：消息 **ID**、**Token** 用量、模型响应信息等附加数据

多条 **Message** 按顺序组成消息历史，模型根据这组消息理解当前上下文

==**Message 是上下文数据，不等于 Memory，也不会自动持久化**==

在多轮对话中，`messages` 数组通常由应用程序维护，**LangChain** 负责接收并转换这些消息

#### 3.2、主要 **Message** 类型

| **LangChain** 类型 | `.type` | 对象格式中的 `role` | 职责 |
|---|---|---|---|
| `SystemMessage` | `system` | `system` | 设置模型角色、行为和全局约束 |
| `HumanMessage` | `human` | `user` | 表示用户输入 |
| `AIMessage` | `ai` | `assistant` | 表示模型输出，也可包含 **Tool Call** 和响应元数据 |
| `ToolMessage` | `tool` | `tool` | 把工具执行结果回填给模型，在工具调用主题中展开 |

`AIMessageChunk` 是流式输出分片，不是一轮完整响应，后续学习 **Streaming** 时再展开

#### 3.3、创建 **Message**

**字符串语法：**

```ts
const systemMessage = new SystemMessage("你是一个简洁的技术助手");
const humanMessage = new HumanMessage("解释一下 Message 的作用");
const aiMessage = new AIMessage("Message 用于承载模型上下文");
```

**对象语法：**

```ts
const humanMessage = new HumanMessage({
  content: "解释一下 Message 的作用",
  name: "learner",
  id: "message-001",
});
```

常用构造字段：

| 字段 | 说明 |
|---|---|
| `content` | 消息内容，可以是字符串或内容块数组 |
| `name` | 可选的消息发送者名称 |
| `id` | 可选的消息唯一标识 |
| `additional_kwargs` | **Provider** 特有的附加数据，通常不作为首选读取入口 |
| `response_metadata` | 模型或 **Provider** 返回的响应元数据 |

#### 3.4、读取 `AIMessage`

```ts
const response = await model.invoke(messages);

console.log(response.type);
// "ai"

console.log(response.text);
// "LangChain Message 用于统一表达不同角色的输入与模型输出"（示例）

console.log(response.content);
// "LangChain Message 用于统一表达不同角色的输入与模型输出"（纯文本响应示例）

console.log(response.id);
// "run-..."（示例，实际值由 LangChain 或 Provider 生成）

console.log(response.usage_metadata);
// { input_tokens: 20, output_tokens: 15, total_tokens: 35 }（示例）

console.log(response.response_metadata);
// { finish_reason: "stop", model_name: "deepseek-v4-flash", ... }（示例）
```

主要输出字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | `"ai"` | 当前消息的 **LangChain** 类型 |
| `text` | `string` | 从消息内容中提取出的文本，读取纯文本回复时最方便 |
| `content` | `string \| ContentBlock[]` | 原始消息内容，可能包含多模态或结构化内容块 |
| `id` | `string \| undefined` | 消息标识，可能由 **LangChain** 或 **Provider** 生成 |
| `usage_metadata` | `object \| undefined` | 标准化 **Token** 用量，例如输入、输出和总 **Token** 数 |
| `response_metadata` | `object` | 模型名、结束原因和 **Provider** 原始响应信息 |
| `tool_calls` | `array` | 模型请求调用的工具，未绑定工具时通常为空 |

`text` 适合直接展示，`content` 适合需要处理内容块的场景，二者不能简单视为永远相同

### 四、**Model** 与 **Messages** 的关系

```text
应用创建 Message[]
  -> model.invoke(messages)
  -> LangChain 转换为 Provider 请求
  -> Provider 返回模型结果
  -> LangChain 转换为 AIMessage
  -> 应用读取文本、Usage 和元数据
  -> 应用决定是否把 AIMessage 加入下一轮历史
```

职责边界：

- **Model**：统一模型调用入口并完成 **Provider** 适配
- **Message**：统一表示模型的输入、输出和对话上下文
- **Provider**：运行真实模型并生成结果
- **应用程序**：维护消息顺序、历史、超时、重试、错误和展示逻辑

只有一次或多次 `model.invoke()` 仍然只是 **Model Call / Chat Loop**，没有工具选择、结果回填和持续决策循环时，还不是 **Agent**

### 五、**LangChain** 如何处理结构化输出

#### 5.1、**API** 返回 **JSON**，不等于模型输出符合业务结构

模型服务的 **HTTP API** 通常会返回一份合法 **JSON** 响应，例如：

```json
{
  "choices": [
    {
      "message": {
        "content": "张三今年 20 岁"
      }
    }
  ]
}
```

这里被结构化的是模型服务的通信协议，`choices`、`message` 和 `content` 是响应外壳，`content` 内部仍然可能只是一段自然语言

应用真正需要的结构化输出则是业务对象：

```json
{
  "name": "张三",
  "age": 20
}
```

> ==**LangChain Structured Output 约束的是模型生成的业务数据，不是把已经为 JSON 的 HTTP 响应外壳再转换一次**==

#### 5.2、结构约束能力来自哪里

==**LangChain** 本身不能凭空保证任意模型生成的 **Token** 一定符合 **Schema**，**真正的生成约束是由模型服务提供**，**LangChain** 负责把应用声明的结构接到模型服务支持的协议上==

```text
应用声明 Schema
  -> LangChain 选择并组装 Provider 支持的请求协议
  -> Provider 按协议生成 JSON 或 Tool Call
  -> LangChain 提取、解析并校验结果
  -> 应用拿到结构化对象
```

因此，**LangChain Structured Output** 不是单一的“格式转换”，而是一层结构化输出适配与控制能力，可能包含：

- 把 **Zod Schema** 转换为模型接口需要的 **JSON Schema** 或 **Tool** 定义
- 组装模型请求并选择对应的结构化输出协议
- 从原始响应中提取目标数据
- 解析并校验返回值
- 将不同 **Provider** 的响应统一为应用可使用的对象
- 在 **Agent** 场景中把校验错误反馈给模型并进行有限重试

#### 5.3、`withStructuredOutput()` 的三种处理方式

`model.withStructuredOutput(schema, options)` 会返回一个新的 **Runnable**，调用它时得到的是符合目标结构的对象，而不是普通 `AIMessage`

```ts
import { z } from "zod";

const personSchema = z.object({
  name: z.string(),
  age: z.number().int(),
});

const structuredModel = model.withStructuredOutput(personSchema, {
  method: "functionCalling",
});

const person = await structuredModel.invoke("张三今年 20 岁");
```

示例，传入的是 **Zod Schema**，因此 **LangChain** 会在解析后执行 **Zod** 校验

如果传入普通 **JSON Schema**，当前解析器只负责解析，不会自动完成同等级别的运行时校验，应用仍需自行校验

调试底层响应时，可以设置 `includeRaw: true`，返回值会变为 `{ raw, parsed }`，其中 `raw` 是原始 `AIMessage`，`parsed` 是解析后的业务对象

三种 `method` 的差异不在最终都能得到对象，而在结构约束落在哪里：

| `method` | 核心机制 | 结构主要由谁保证 | **LangChain** 的主要工作 | 能力边界 |
|---|---|---|---|---|
| `jsonSchema` | 将 **Schema** 交给模型服务的原生结构化输出能力 | **Provider** 的受约束生成 | 转换 **Schema**、组装请求、解析和校验 | 依赖模型服务真正支持 **JSON Schema** |
| `functionCalling` | 将 **Schema** 包装成一个用于返回结果的 **Tool** | **Provider** 的 **Tool Calling** 协议 | 创建工具定义、提取 `tool_calls[].args`、解析和校验 | 返回的是工具参数，不代表真实业务工具已经执行 |
| `jsonMode` | 要求模型服务只生成合法 **JSON** | **Provider** 的 **JSON Mode** | 提示目标结构、解析和校验 | 通常只保证 **JSON** 语法，不必然保证字段符合 **Schema** |

三条调用链可以简化为：

```text
jsonSchema
Zod Schema -> JSON Schema -> Provider 受约束生成 -> LangChain 校验 -> 业务对象

functionCalling
Zod Schema -> Tool 定义 -> Provider 返回 Tool Call -> LangChain 提取参数并校验 -> 业务对象

jsonMode
Zod Schema -> 结构提示 + JSON Mode -> Provider 返回 JSON -> LangChain 解析并校验 -> 业务对象
```

其中 `jsonSchema` 最接近“模型服务直接按 **Schema** 生成”，`functionCalling` 借用了工具调用协议传递结构化参数，`jsonMode` 的约束通常最弱

#### 5.4、在 **DeepSeek** 适配器中的实际含义

以 `@langchain/deepseek@1.1.11` 为例，调用 `withStructuredOutput()` 时若没有显式指定 `method`，适配器默认选择 `functionCalling`

```text
Zod Schema
  -> LangChain 包装为 Tool 定义
  -> DeepSeek 返回 Tool Call
  -> LangChain 提取 arguments
  -> Zod 校验
  -> 应用获得结构化对象
```

这条路径中，**DeepSeek** 负责按工具调用协议生成参数，**LangChain** 负责协议适配、数据提取和校验，所以它不只是对普通文本执行一次 `JSON.parse()`

适配器默认选择 `functionCalling`，不等于当前具体模型和运行模式一定接受它需要的强制 `tool_choice`；“支持 Tool Calls”与“支持强制指定某个 Tool”是两项不同的兼容性判断

如果显式选择 `jsonMode`，模型服务主要保证结果是合法 **JSON**，字段是否完整、类型是否正确仍需要 **Schema** 校验

如果选择 `jsonSchema`，则需要当前模型与接口真正支持原生 **JSON Schema** 约束

#### 5.5、结构正确仍不等于内容正确

下面的数据能够通过 `personSchema`，但年龄仍可能是模型猜测出来的：

```json
{
  "name": "张三",
  "age": 20
}
```

**Schema** 只能证明字段和类型符合契约，不能证明事实真实，也不能替代业务规则、权限判断和外部数据源校验

> ==**结构正确不等于内容正确，结构化输出解决接口契约，不解决事实可信性**==

### 六、最小示例

```ts
import {
  HumanMessage,
  SystemMessage,
  initChatModel,
} from "langchain";

const model = await initChatModel("deepseek:deepseek-v4-flash", {
  apiKey: process.env.DEEPSEEK_API_KEY,
  timeout: 60_000,
  maxRetries: 2,
});

const messages = [
  new SystemMessage("你是一个简洁、准确的中文技术助手"),
  new HumanMessage("用一句话说明 LangChain Message 的作用"),
];

const response = await model.invoke(messages);

console.log({
  type: response.type,
  text: response.text,
  usage: response.usage_metadata,
  metadata: response.response_metadata,
});
// {
//   type: "ai",
//   text: "LangChain Message 用于统一表达不同角色的输入与模型输出",
//   usage: { input_tokens: 20, output_tokens: 15, total_tokens: 35 },
//   metadata: { finish_reason: "stop", model_name: "deepseek-v4-flash", ... },
// }（示例，实际文本、Token 用量和元数据随调用变化）
```

运行前通过环境变量提供 `DEEPSEEK_API_KEY`，不要把真实密钥写入源码或命令历史

### 七、核心结论

- `initChatModel()` 创建统一 **Chat Model** 对象
- `model.invoke()` 接收字符串或消息序列，返回 `AIMessage`
- 字符串输入适合独立单轮任务，显式 **Messages** 适合系统约束和多轮上下文
- **Message** 是上下文数据结构，不会自动形成长期 **Memory**
- 应用负责维护消息历史，**LangChain** 不会替应用自动保存这段对话
- 单独调用 **Model** 不是 **Agent**，结构化输出、工具调用和 **Agent Loop** 是建立在这条基础调用链之上的其他能力
- **LangChain Structured Output** 是结构化输出适配与控制层，生成约束最终来自 **Provider** 支持的协议
- `jsonSchema`、`functionCalling` 和 `jsonMode` 的核心差异，是结构约束分别落在原生 **Schema**、工具调用协议还是 **JSON** 语法层

### 八、复习问题

- **LangChain Model** 对象与模型供应商运行的真实模型有什么区别
- `initChatModel()` 返回什么，`model.invoke()` 又返回什么
- 字符串、消息对象数组和 `role/content` 对象数组分别适合什么场景
- `AIMessage.text`、`content`、`usage_metadata` 和 `response_metadata` 有什么区别
- 为什么消息数组不等于 **Memory**，单次模型调用也不等于 **Agent**
- 为什么模型接口返回合法 **JSON**，不等于业务输出已经符合 **Schema**
- `jsonSchema`、`functionCalling` 和 `jsonMode` 分别由谁保证什么
- 为什么结构化输出通过 **Schema** 校验后，仍然不能直接证明内容可信

### 九、参考资料

- [LangChain JavaScript Overview](https://docs.langchain.com/oss/javascript/langchain/overview)
- [LangGraph JavaScript Overview](https://docs.langchain.com/oss/javascript/langgraph/overview)
- [LangChain JavaScript Models](https://docs.langchain.com/oss/javascript/langchain/models)
- [LangChain JavaScript Messages](https://docs.langchain.com/oss/javascript/langchain/messages)
- [LangChain JavaScript Structured Output](https://docs.langchain.com/oss/javascript/langchain/structured-output)
- [DeepSeek JSON Output](https://api-docs.deepseek.com/guides/json_mode/)
- [DeepSeek Tool Calls](https://api-docs.deepseek.com/guides/function_calling/)

### 十、复习参考答案

#### 1. **LangChain Model** 对象与真实模型

- **LangChain Model** 是应用进程中的统一调用对象，负责保存模型配置、接收标准化输入、调用供应商接口并转换响应

- 真实模型运行在供应商服务端，负责推理和生成 **Token**

- 创建 **Model** 对象不等于把模型加载到本地，也不等于已经发起模型调用


#### 2. `initChatModel()` 与 `model.invoke()` 的返回值

- `initChatModel()` 返回实现统一 **Chat Model** 接口的模型对象

- `model.invoke()` 接收本轮输入并异步返回 `AIMessage`

- 前者完成调用对象初始化，后者才执行一次真实模型调用

#### 3. 三种输入形式的适用场景

- 字符串
  - 单条用户消息的简写，适合独立的单轮请求

- **Message** 对象数组
  - 适合显式表达消息角色、工具调用、元数据和多轮上下文

- `role/content` 对象数组
  - 更简洁、便于序列化，适合已有普通对象数据的场景
  - 进入模型边界后仍会被标准化为 **Message**

三种形式最终都要转换成模型能够接收的消息序列，区别主要在表达能力和使用便利性

#### 4. `AIMessage` 的四类信息

- `text`
  - 从响应内容中提取出的文本视图，适合直接读取普通文本回答

- `content`
  - 原始消息内容，可能是字符串，也可能包含多个内容块

- `usage_metadata`
  - 输入、输出和总 Token 等用量信息

- `response_metadata`
  - 结束原因、模型名以及供应商返回的其他响应元数据

`text` 是便捷视图，不能替代包含工具调用或多模态内容的完整消息结构

#### 5. **Messages**、**Memory** 与 **Agent** 的区别

- **Messages** 是应用当前持有并传给模型的上下文数据

- **Memory** 需要应用或 **Checkpointer** 保存、索引并在后续调用中恢复相关状态

- **Agent** 还需要状态、工具执行、结果回填以及继续或停止判断等控制循环

- 消息数组不会自动持久化，单次 `model.invoke()` 也只完成一次模型输入输出

#### 6. 合法 **JSON** 与符合 **Schema** 的区别

- 合法 **JSON** 只说明语法可以解析；通过 **Schema** 校验才能进一步证明必填字段、字段类型、枚举值等满足结构契约

- 符合 **Schema** 仍不代表数据满足业务规则或事实真实

#### 7. 三种结构化输出方式的责任边界

- `jsonSchema`
  - 供应商根据原生 **JSON Schema** 约束生成，结构约束最直接

- `functionCalling`
  - 供应商通过工具调用协议生成参数
  - **LangChain** 负责包装工具定义、提取参数并执行 **Schema** 校验

- `jsonMode`
  - 供应商主要保证输出是合法 **JSON**
  - 字段结构通常仍依赖提示词和应用侧校验

实际支持情况取决于具体供应商和模型；**LangChain** 统一了调用与校验方式，但不能让不支持某种协议的模型凭空获得对应能力

#### 8. 结构正确为什么不等于内容可信

- **Schema** 只能验证字段、类型和结构，不能证明模型填写的事实真实，也不能代替业务规则、权限判断和外部证据校验

- 结构化输出解决的是接口契约，事实可信性仍由应用和权威数据源负责
