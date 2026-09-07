## **Tool 与结果回填**

**Tool Calling** 让 **LLM** 不只生成自然语言，还能提出结构化动作请求

完整链路是：

```text
Messages + Tool Definitions
  -> Model 生成 Tool Call
  -> 应用选择并执行 Tool
  -> Tool Message 回填
  -> Model 继续决策或生成最终回答
```

这里必须先明确：

> ==**模型只提出 Tool Call，真正执行函数的是应用程序或 Agent Runtime**==

### 一、**Tool** 是什么

一个 **Tool** 由四部分组成：

- 稳定名称：供模型和应用识别
- 描述：告诉模型何时应该使用
- 输入 **Schema**：约束模型生成的参数
- 执行函数：由应用运行并返回结果

```ts
import { tool } from "langchain";
import { z } from "zod";

const getDocument = tool(
  async ({ id }) => {
    return `document: ${id}`;
  },
  {
    name: "get_document",
    description: "按文档 ID 读取一份资料",
    schema: z.object({
      id: z.string().describe("待读取的文档 ID"),
    }),
  },
);
```

`tool()` 返回可直接调用的 **Structured Tool**：

```ts
const result = await getDocument.invoke({ id: "doc-1" });
```

直接传业务参数时，返回工具函数的结果；传入带 **ID** 的 **Tool Call** 时，**LangChain** 会把结果包装成 `ToolMessage`

#### 1.1、**Schema** 只约束参数结构

```ts
schema: z.object({
  id: z.string().trim().min(1),
})
```

这能拒绝缺失、类型错误或空白 **ID**，但不能证明该 **ID** 对应的资料真实存在

```text
Tool Schema：参数形状是否合法
Tool 实现：目标是否存在、操作是否允许
应用策略：当前用户是否有权执行
```

### 二、`bindTools()`

#### 2.1、基本语法

```ts
const modelWithTools = model.bindTools([getDocument]);
const response = await modelWithTools.invoke(messages);
```

`bindTools()` 会创建一个绑定了工具定义的新 **Runnable**，原始 `model` 不会被修改

绑定时交给模型的是工具名称、描述和参数结构，不是让模型获得函数执行权限

> ==**bindTools() 负责让模型知道有哪些动作，不负责替模型执行动作**==

#### 2.2、模型可以不调用 **Tool**

默认情况下，模型根据对话自行决定：

- 直接生成文本
- 调用一个 **Tool**
- 调用多个 **Tool**

因此不能假设每次响应都存在 `tool_calls`

### 三、**Tool Call**

当模型决定使用工具时，返回的 `AIMessage` 会包含 `tool_calls`：

```ts
const [toolCall] = response.tool_calls;

console.log(toolCall);
// {
//   name: "get_document",
//   args: { id: "doc-1" },
//   id: "call_123",
//   type: "tool_call",
// }（示例，id 由模型服务生成）
```

典型结构：

```ts
{
  name: "get_document",
  args: { id: "doc-1" },
  id: "call_123",
  type: "tool_call"
}
```

字段职责：

| 字段 | 作用 |
|---|---|
| `name` | 请求调用的 **Tool** 名称 |
| `args` | 模型根据 **Schema** 生成的参数 |
| `id` | 本次调用的唯一关联标识 |
| `type` | **LangChain** 标准化后的内容类型 |

这只是动作提案，不是执行结果

### 四、应用执行 **Tool**

应用应通过白名单 **Registry** 查找 **Tool**：

```ts
const registry = new Map([[getDocument.name, getDocument]]);
const selectedTool = registry.get(toolCall.name);

if (!selectedTool) {
  throw new Error(`未注册的 Tool：${toolCall.name}`);
}

const toolMessage = await selectedTool.invoke(toolCall);
```

执行边界依次发生：

```text
模型生成 name 与 args
  -> 应用检查 Tool 是否已注册
  -> Zod 校验 args
  -> Tool 实现执行确定性逻辑
  -> LangChain 生成 ToolMessage
```

模型输出的 **Tool** 名称和参数都属于不可信输入，不能绕过 **Registry**、权限检查或业务校验直接执行

### 五、`ToolMessage` 与结果回填

`ToolMessage` 用于把一次执行结果返回给模型：

```ts
{
  type: "tool",
  name: "get_document",
  tool_call_id: "call_123",
  content: "document: doc-1"
}
```

其中 `tool_call_id` 必须对应原 **Tool Call** 的 `id`：

```text
AIMessage.tool_calls[n].id
  == ToolMessage.tool_call_id
```

模型可能一次提出多个 **Tool Calls**，每一个调用都必须拥有自己的结果消息，不能遗漏、串用或复用其他调用的 **ID**

> ==**Tool Call ID 是请求与结果的关联键，不是可有可无的日志字段**==

### 六、手动 **Tool Loop**

下面是一轮最小执行循环：

```ts
const modelWithTools = model.bindTools([getDocument]);
const messages = [new HumanMessage("读取 doc-1 并概括")];

while (true) {
  const aiMessage = await modelWithTools.invoke(messages);
  messages.push(aiMessage);

  if (!aiMessage.tool_calls?.length) {
    console.log(aiMessage.text);
    // "doc-1 说明了 Tool Calling 的基本机制……"（示例，实际文本由模型生成）
    break;
  }

  for (const toolCall of aiMessage.tool_calls) {
    const selectedTool = registry.get(toolCall.name);
    if (!selectedTool) {
      throw new Error(`未注册的 Tool：${toolCall.name}`);
    }

    const toolMessage = await selectedTool.invoke(toolCall);
    messages.push(toolMessage);
  }
}
```

消息序列至少经历：

```text
HumanMessage
  -> AIMessage(tool_calls)
  -> ToolMessage(tool_call_id)
  -> AIMessage(final answer)
```

如果模型根据结果继续请求其他 **Tool**，循环会再次执行，因此应用还应设置最大轮数、超时和错误策略

### 七、与 **Structured Output**、**Agent** 的区别

#### 7.1、与 **Structured Output** 的区别

两者都可能利用底层 **Tool Calling** 协议，但目的不同：

```text
Structured Output
  -> 目标是得到符合 Schema 的数据对象
  -> 内部 Tool 通常不对应真实外部动作

Tool Calling
  -> 目标是请求应用执行一项真实能力
  -> Tool 结果需要作为 ToolMessage 回填
```

#### 7.2、手动循环还不是框架 **Agent Harness**

当前循环已经具备模型决策、工具执行和结果反馈，但循环、**Registry**、轮数限制和错误处理仍由应用手写

`createAgent()` 会把这套通用循环收进 **LangChain Agent Harness**，**Tool** 的底层调用协议没有因此改变

### 八、责任边界

| 组件 | 负责 | 不负责 |
|---|---|---|
| **LLM** | 选择 **Tool**，生成名称与参数，读取结果后继续回答 | 直接执行本地函数、数据库或系统命令 |
| **LangChain Model Adapter** | 转换工具定义与 **Provider** 响应，生成标准 **Tool Call** | 决定业务权限与允许范围 |
| **Tool Schema** | 校验参数字段与类型 | 判断目标是否存在、操作是否安全 |
| **Tool 实现** | 执行确定性能力并返回结果 | 决定整个对话何时结束 |
| 应用或 **Agent Runtime** | 注册 **Tool**、执行、回填、状态、限制与错误策略 | 替代模型完成语义决策 |

### 九、核心结论

- `tool()` 把名称、描述、输入 **Schema** 与执行函数组成可调用 **Tool**
- `bindTools()` 只向模型提供 **Tool** 定义，不执行 **Tool**，也不自动形成循环
- `AIMessage.tool_calls` 是模型提出的结构化动作请求
- 应用必须把 **Tool Call** 当作不可信输入，通过 **Registry** 与校验后再执行
- `ToolMessage.tool_call_id` 必须与原 **Tool Call ID** 对应
- 一次 **Tool Calling** 可能包含多个 **Tool**，也可能经过多轮调用
- 手动 **Tool Loop** 展示了 **Agent** 的核心控制流，但通用 **Harness** 能力仍由应用承担

### 十、复习问题

- `tool()` 的四个组成部分分别是什么
- `bindTools()` 为什么不等于执行 **Tool**
- 模型返回 **Tool Call** 后，控制权转移到了哪里
- 为什么 **Tool Schema** 通过后仍需要应用业务校验
- `tool_call_id` 丢失或错配会破坏什么关系
- 手动 **Tool Loop** 与 `createAgent()` 的职责差异是什么

### 十一、参考资料

- **[LangChain JavaScript Models](https://docs.langchain.com/oss/javascript/langchain/models)**
- **[LangChain JavaScript Tools](https://docs.langchain.com/oss/javascript/langchain/tools)**
- **[LangChain JavaScript Messages](https://docs.langchain.com/oss/javascript/langchain/messages)**

### 十二、复习参考答案

#### 1. `tool()` 的四个组成部分

- 名称：供模型和应用识别 **Tool**

- 描述：告诉模型这个 **Tool** 解决什么问题、何时适合调用

- 输入 **Schema**：定义并校验参数字段与类型

- 执行函数：由应用 **Runtime** 运行确定性逻辑并返回结果

#### 2. `bindTools()` 为什么不等于执行 **Tool**

- `bindTools()` 只是把 **Tool** 定义随模型请求发送给 **Provider**，让模型能够返回结构化 **Tool Call**

- 它不负责查找本地实现、校验业务权限、执行函数、回填结果或维持循环

#### 3. **Tool Call** 返回后的控制权

- 模型生成 **Tool Call** 后，本次模型推理已经结束，控制权回到应用或 **Agent Runtime**

- 应用需要检查工具是否注册、参数是否合法、权限是否允许，再决定是否执行并把结果作为 `ToolMessage` 回填给模型


#### 4. **Tool Schema** 通过后为什么还要业务校验

- **Tool Schema** 只能校验参数的结构和类型，不能判断目标资源是否存在、当前用户是否有权操作、动作是否安全以及调用是否满足业务状态
- 模型生成的工具名和参数仍然是不可信输入，必须继续经过 **Registry**、权限和业务规则检查


#### 5. `tool_call_id` 的作用

- `tool_call_id` 把每个 `ToolMessage` 与原始 **Tool Call** 一一关联
- 如果丢失或错配，模型就无法确认哪个结果属于哪个请求；在多工具调用中还可能造成结果串用，破坏消息协议与后续推理


#### 6. 手动 **Tool Loop** 与 `createAgent()`

- 手动 **Tool Loop** 由应用显式完成模型调用、检查 **Tool Call**、执行工具、追加 `ToolMessage` 以及判断继续或结束

- `createAgent()` 把这些通用步骤组织成内置的模型节点、工具节点和状态转移

两者使用的 **Tool Call** 与 `ToolMessage` 协议没有本质变化；工具范围、权限、超时和业务验收仍由应用负责
