## **Structured Output**

**LLM** 默认返回自由文本，适合人阅读，却不适合作为程序的稳定输入

**Structured Output** 的作用，是让一次模型调用返回符合约定结构的数据对象：

```text
自然语言输入
  -> Model with Structured Output
  -> Provider 生成结构化结果
  -> LangChain 解析与 Schema 校验
  -> 应用获得类型明确的对象
```

它仍然是一次 **Model Call**，没有 **Tool** 执行和持续决策循环，因此不是 **Agent**

### 一、使用 **Schema** 声明输出契约

#### 1.1、使用 **Zod Schema**

**Zod** 同时提供运行时校验与 **TypeScript** 类型推导：

```ts
import { z } from "zod";

const ResearchIntentSchema = z.object({
  topic: z.string(),
  questions: z.array(z.string()),
  expectedOutput: z.enum(["concise_answer", "detailed_notes"]),
});

type ResearchIntent = z.infer<typeof ResearchIntentSchema>;
```

这份 **Schema** 约束：

- 必须存在 `topic`、`questions` 和 `expectedOutput`
- `topic` 必须是字符串
- `questions` 必须是字符串数组
- `expectedOutput` 只能取两个枚举值之一

它不能证明：

- `topic` 不是空白字符串
- 问题数量符合当前业务限制
- 字段内容符合事实
- 当前用户有权执行后续操作

#### 1.2、描述字段语义

`describe()` 会把字段含义加入可传给模型的 **Schema** 描述：

```ts
const schema = z.object({
  topic: z.string().describe("需要整理的核心技术主题"),
  questions: z.array(z.string()).describe("需要回答的具体问题"),
});
```

字段描述影响模型如何填写数据，但仍然不是业务规则或事实证据

### 二、`withStructuredOutput()`

#### 2.1、基本语法

```ts
const structuredModel = model.withStructuredOutput(schema, options);
const result = await structuredModel.invoke(input);
```

`withStructuredOutput()` 不会修改原来的 `model`，而是基于它创建一个新的 **Runnable**：

```text
model.invoke(input)            -> AIMessage
structuredModel.invoke(input)  -> 结构化对象
```

> ==**withStructuredOutput() 改变的是调用结果契约，不是把 Model 变成 Agent**==

#### 2.2、主要参数

| 参数 | 作用 |
|---|---|
| `schema` | 声明目标字段、类型和描述 |
| `name` | 为结构化结果或内部工具定义提供稳定名称 |
| `method` | 选择 `jsonSchema`、`functionCalling` 或 `jsonMode` |
| `includeRaw` | 是否同时返回原始 **AIMessage** 与解析结果 |

`method` 表示 **LangChain Provider Adapter** 采用哪种底层协议，不代表任意 **Model** 都支持全部方式

| `method` | 底层机制 | 主要边界 |
|---|---|---|
| `jsonSchema` | 把 **JSON Schema** 交给 **Provider** 原生结构化输出能力 | 依赖模型接口支持原生 **Schema** 约束 |
| `functionCalling` | 把 **Schema** 包装成 **Tool** 参数并读取 **Tool Call** | 依赖模型支持对应 **Tool Calling** 参数 |
| `jsonMode` | 要求 **Provider** 返回合法 **JSON**，再由 **LangChain** 解析 | 通常不保证字段天然符合 **Schema** |

适配器设置的默认 `method` 只是默认请求策略，具体模型仍可能拒绝对应参数

还需要区分“模型支持 **Tool Calls**”与“模型支持强制指定 **Tool**”：`functionCalling` 为了稳定取得结构化结果，通常会要求模型必须调用某个内部 **Tool**；模型即使支持自主 **Tool Calls**，也可能在特定推理模式下拒绝这种强制选择

### 三、输入与输出

#### 3.1、输入

结构化模型仍然接收普通 **Model** 支持的输入，例如字符串或 **Messages**：

```ts
await structuredModel.invoke("整理 LangChain Structured Output");
```

```ts
await structuredModel.invoke([
  new SystemMessage("只返回符合目标结构的数据"),
  new HumanMessage("整理 LangChain Structured Output"),
]);
```

使用 `jsonMode` 时，应在提示中明确要求返回 **JSON**，并说明字段结构；**JSON Mode** 本身通常只限制 **JSON** 语法

#### 3.2、默认输出

`includeRaw` 默认为 `false`，调用结果直接是解析后的对象：

```ts
const intent = await structuredModel.invoke(input);

console.log(intent.topic);
// "LangChain Structured Output"

console.log(intent.questions);
// ["withStructuredOutput() 如何约束返回结构", "Schema 能保证什么"]（示例）
```

#### 3.3、保留原始响应

```ts
const structuredModel = model.withStructuredOutput(schema, {
  includeRaw: true,
});

const result = await structuredModel.invoke(input);
```

此时结果形状为：

```ts
{
  raw: AIMessage;
  parsed: StructuredResult | null;
}
```

- `raw`：**Provider** 响应经过 **LangChain** 标准化后的原始 `AIMessage`
- `parsed`：通过解析与 **Schema** 校验的业务对象
- `parsed === null`：原始模型调用成功，但后续解析或校验失败

`includeRaw: true` 适合调试和可观测场景，因为它能区分 **Provider** 是否返回结果以及解析阶段是否成功

### 四、一次调用中各层分别做什么

```text
应用定义 Zod Schema
  -> LangChain 转换为 Provider 所需的 JSON Schema、Tool 或 JSON Mode 参数
  -> Provider 生成 JSON 或 Tool Call
  -> LangChain 提取响应内容
  -> Zod 校验字段和类型
  -> 应用校验业务规则
```

责任边界：

- **Provider**：执行真实模型推理，并按其支持的协议返回结果
- **LangChain Adapter**：转换 **Schema** 与请求协议，提取并解析响应
- **Zod**：校验运行时字段、类型和枚举
- **应用程序**：判断字段值是否满足业务要求
- **外部数据源**：为关键事实提供证据

### 五、结构校验与业务校验

不要把所有规则都塞进模型生成契约

```ts
function validateResearchIntent(intent: ResearchIntent): ResearchIntent {
  const topic = intent.topic.trim();

  if (topic.length === 0) {
    throw new Error("topic 不能为空白字符串");
  }

  if (intent.questions.length === 0 || intent.questions.length > 5) {
    throw new Error("questions 数量必须在 1 到 5 之间");
  }

  return { ...intent, topic };
}
```

这里形成两道不同的门：

```text
Zod Schema：数据是否长成约定结构
应用校验：这个结构是否允许进入后续业务流程
```

> ==**结构正确不等于业务可接受，业务可接受也不等于事实可信**==

### 六、最小示例

```ts
import { HumanMessage, initChatModel, SystemMessage } from "langchain";
import { z } from "zod";

const schema = z.object({
  topic: z.string(),
  questions: z.array(z.string()),
});

const model = await initChatModel("deepseek:deepseek-v4-flash", {
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const structuredModel = model.withStructuredOutput(schema, {
  method: "jsonMode",
  includeRaw: true,
});

const result = await structuredModel.invoke([
  new SystemMessage(
    "只返回 JSON，字段必须是 topic: string、questions: string[]",
  ),
  new HumanMessage("整理 LangChain Structured Output 的核心问题"),
]);

if (result.parsed === null) {
  throw new Error("结构化结果解析失败");
}

console.log(result.parsed);
// {
//   topic: "LangChain Structured Output",
//   questions: ["核心机制是什么", "能力边界是什么"],
// }（示例）

console.log(result.raw.usage_metadata);
// { input_tokens: 100, output_tokens: 40, total_tokens: 140 }（示例，实际值随调用变化）
```

### 七、核心结论

- **Structured Output** 把自由文本返回值提升为应用可解析和校验的数据契约
- `withStructuredOutput()` 返回新的 **Runnable**，不修改原始 **Model**
- **Zod Schema** 同时提供运行时校验和 **TypeScript** 类型推导
- `method` 选择底层结构化协议，能力上限仍由具体 **Provider** 和 **Model** 决定
- `includeRaw: true` 用于同时观察原始 `AIMessage` 和解析对象
- **Schema** 负责结构，应用负责业务规则，外部数据源负责事实可信性
- **Model** 级 **Structured Output** 仍是一次模型调用，不是 **Tool Call** 或 **Agent Loop**

### 八、复习问题

- `withStructuredOutput()` 返回什么，它与原始 **Model** 是什么关系
- `includeRaw` 为 `false` 和 `true` 时，返回值有什么区别
- `jsonSchema`、`functionCalling` 和 `jsonMode` 分别依赖什么底层能力
- 为什么通过 **Zod** 校验的对象仍可能被应用拒绝
- 为什么结构化输出仍然不是 **Agent**

### 九、参考资料

- **[LangChain JavaScript Models](https://docs.langchain.com/oss/javascript/langchain/models)**
- **[LangChain JavaScript Structured Output](https://docs.langchain.com/oss/javascript/langchain/structured-output)**
- **[DeepSeek JSON Output](https://api-docs.deepseek.com/guides/json_mode/)**

### 十、复习参考答案

#### 1. `withStructuredOutput()` 的返回值

- `withStructuredOutput()` 返回绑定了 **Schema** 与结构化策略的新 **Runnable**，调用它时得到的是解析并校验后的结构化结果

- 原始 **Model** 不会被修改，仍然可以继续用于普通文本调用或创建其他结构化 **Runnable**

#### 2. `includeRaw` 对返回值的影响

- `includeRaw: false`
  - 默认直接返回通过解析和 **Schema** 校验的业务对象
  - 解析或校验失败时抛出错误

- `includeRaw: true`
  - 返回 `{ raw, parsed }`
  - `raw` 是标准化后的原始 `AIMessage`，`parsed` 是校验后的业务对象
  - 解析失败时仍可通过 `raw` 检查模型实际返回了什么，此时 `parsed` 为 `null`

#### 3. 三种结构化方式依赖的底层能力

- `jsonSchema`
  - 依赖 **Provider** 和具体模型支持原生 **JSON Schema** 约束

- `functionCalling`
  - 依赖模型支持 **Tool Calling**，并接受该策略所需的工具选择方式

- `jsonMode`
  - 依赖 **Provider** 支持 **JSON Mode**，通常只保证输出是合法 **JSON**

无论选择哪种方式，**LangChain** 都只负责协议适配、结果提取和校验，不能突破具体模型的能力上限

#### 4. 通过 **Zod** 后为什么仍可能被拒绝

- **Zod** 只证明字段、类型、枚举等结构符合契约

- 空白主题、问题数量上限、权限范围和业务状态等规则仍需应用校验，所以结构合法的对象也可能不允许进入后续流程

#### 5. 结构化输出为什么不是 **Agent**

- **Structured Output** 仍然只完成一次模型输入输出，并把结果转换为符合 **Schema** 的对象

- 它没有工具执行、结果回填、状态转移以及继续或停止判断，因此不构成 **Agent Loop**
