## **Model Node**、`ToolNode` 与 **Agent Loop**

> 适用版本：`@langchain/langgraph@1.4.13`、`@langchain/core@1.2.9`、`@langchain/deepseek@1.1.11`、`zod@4.5.4`

**LangGraph** 中的单 **Agent Loop** 本质上是一张包含模型节点、工具节点和条件回边的状态图：

```text
Model Node
  -> 没有 Tool Call -> END
  -> 存在 Tool Call -> ToolNode
                           -> ToolMessage
                           -> Model Node
```

它没有改变 **Tool Calling** 的底层协议，只是把模型调用、工具执行、结果回填和循环调度拆成明确的 **Node** 与 **Edge**

> ==**LLM** 决定是否提出 **Tool Call**，`ToolNode` 执行已注册 **Tool**，**Graph Runtime** 负责在二者之间转移控制权==

### 一、**Agent Loop** 的组成

一个最小工具调用循环包含四个部分：

- **Model Node**：读取 `state.messages`，执行一次模型调用，返回 `AIMessage`
- `ToolNode`：读取最后一条 `AIMessage.tool_calls`，执行已注册工具，返回 `ToolMessage`
- `toolsCondition`：检查最后一条消息是否包含 **Tool Call**，选择进入工具节点还是结束
- `MessagesValue`：把新的 `AIMessage` 和 `ToolMessage` 合并进消息历史

```text
HumanMessage
  -> AIMessage(tool_calls)
  -> ToolMessage(tool_call_id)
  -> AIMessage(tool_calls 或 final answer)
```

只要模型继续返回 **Tool Call**，控制流就继续回到 `ToolNode`

### 二、定义 **Tool**

#### 2.1、`tool()`

`tool()` 把名称、描述、输入 **Schema** 与执行函数组成可调用工具：

```ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const lookupDocument = tool(
  ({ id }) => `document: ${id}`,
  {
    name: "lookup_document",
    description: "按文档 ID 读取本地资料",
    schema: z.object({
      id: z.string().trim().min(1),
    }),
  },
);
```

主要入参：

| 位置 | 内容 | 作用 |
|---|---|---|
| 第一个参数 | 执行函数 | 接收已校验参数并执行确定性能力 |
| `name` | 稳定工具名 | 供模型生成 **Tool Call**，供 `ToolNode` 匹配实现 |
| `description` | 工具说明 | 帮助模型判断何时调用 |
| `schema` | 输入 **Schema** | 描述并校验模型生成的参数 |

返回值是 **Structured Tool**，既可以直接 `.invoke()`，也可以交给 `bindTools()` 和 `ToolNode`

### 三、`bindTools()`

#### 3.1、作用与语法

```ts
const modelWithTools = model.bindTools(tools, options);
```

`bindTools()` 创建一个绑定工具定义的新 **Runnable**，让模型能够在响应中生成结构化 **Tool Call**

```ts
const modelWithTools = model.bindTools([lookupDocument], {
  tool_choice: "auto",
});
```

主要入参：

| 参数 | 类型 | 说明 |
|---|---|---|
| `tools` | **Tool** 数组 | 提供给模型的名称、描述和输入 **Schema** |
| `options.tool_choice` | `"auto"`、`"none"`、`"required"` 或指定工具 | 控制模型是否可以自行选择工具 |

出参是绑定工具后的模型 **Runnable**，调用 `.invoke(messages)` 后仍返回 `AIMessage`

> ==`bindTools()` 只让模型知道工具契约，不执行工具，也不建立循环==

### 四、**Model Node**

#### 4.1、它不是新的模型类型

**Model Node** 只是一个普通 **Node**，内部执行一次模型调用：

```ts
const callModel: GraphNode<typeof State> = async (state) => {
  const response = await modelWithTools.invoke(state.messages);

  return {
    messages: [response],
  };
};
```

入参与出参：

| 位置 | 类型 | 说明 |
|---|---|---|
| `state` | 完整 **State** | 包含当前 `messages` 等共享数据 |
| 模型输入 | `BaseMessage[]` | 本轮模型能够看到的消息上下文 |
| 模型输出 | `AIMessage` | 可能包含文本，也可能包含 `tool_calls` |
| **Node** 返回值 | **State Update** | 通常把模型响应放进 `messages` 数组 |

**Model Node** 一次只负责一次推理，不应在节点内部手写 `while` 循环执行所有工具；循环由图上的 **Edge** 表达

### 五、`ToolNode`

#### 5.1、作用与构造

`ToolNode` 是 **LangGraph** 提供的预构建工具执行节点：

```ts
import { ToolNode } from "@langchain/langgraph/prebuilt";

const toolNode = new ToolNode([lookupDocument], {
  handleToolErrors: false,
});
```

构造入参：

| 参数 | 类型 | 说明 |
|---|---|---|
| `tools` | 已注册 **Tool** 数组 | `ToolNode` 只允许执行这个集合中的工具 |
| `handleToolErrors` | `boolean`，可选 | 是否把工具异常转换为错误 `ToolMessage`；设为 `false` 时异常继续向外抛出 |

#### 5.2、输入与输出

`ToolNode` 作为图节点执行时：

```text
输入：State.messages 最后一条 AIMessage
  -> 读取 AIMessage.tool_calls
  -> 按 name 查找已注册 Tool
  -> 使用 args 调用 Tool
  -> 为每个调用生成对应 ToolMessage
输出：{ messages: ToolMessage[] }
```

每个 `ToolMessage.tool_call_id` 对应原 **Tool Call** 的 `id`

如果一条 `AIMessage` 包含多个 **Tool Calls**，`ToolNode` 可以并行执行它们，并一次返回多条 `ToolMessage`

#### 5.3、它封装了什么

`ToolNode` 主要封装：

- 根据 **Tool Call** 名称匹配已注册工具
- 使用工具 **Schema** 校验参数
- 调用工具实现
- 把普通工具结果转换为 `ToolMessage`
- 维持 `tool_call_id` 关联
- 处理同一轮的多个工具调用

它不负责：

- 判断当前用户是否有业务权限
- 决定哪些资源可以访问
- 替工具实现真实业务能力
- 决定整个 **Agent** 何时结束

### 六、`toolsCondition`

#### 6.1、作用与语法

```ts
import { toolsCondition } from "@langchain/langgraph/prebuilt";

graph.addConditionalEdges("model", toolsCondition, ["tools", END]);
```

`toolsCondition` 是预构建 **Router**，它检查最后一条消息：

```text
最后一条 AIMessage 存在 tool_calls
  -> 返回 "tools"

不存在 tool_calls
  -> 返回 END
```

它不调用模型、不执行工具，也不判断工具结果是否正确，只根据消息协议选择下一条 **Edge**

#### 6.2、名称约定

`toolsCondition` 默认返回字符串 `"tools"` 或 `END`

因此通常把 `ToolNode` 注册为 `"tools"`：

```ts
graph.addNode("tools", toolNode);
```

如果使用其他节点名，应编写自己的 **Router**，或者提供相应路径映射

### 七、完整数据流与控制流

#### 7.1、第一次模型调用

```text
MessagesValue 中已有 HumanMessage
  -> Model Node 调用绑定工具后的模型
  -> 模型返回 AIMessage(tool_calls)
  -> Model Node 返回 { messages: [AIMessage] }
  -> MessagesValue 合并消息
```

#### 7.2、执行工具

```text
toolsCondition 发现 tool_calls
  -> Graph Runtime 调度 ToolNode
  -> ToolNode 校验 name 与 args
  -> Tool 函数执行
  -> ToolNode 返回 { messages: [ToolMessage] }
  -> MessagesValue 合并消息
```

#### 7.3、继续决策或结束

```text
固定 Edge：tools -> model
  -> Model Node 重新读取完整消息历史
  -> 若再次返回 Tool Call，继续循环
  -> 若返回普通文本，toolsCondition 路由到 END
```

模型能够看到工具结果，不是因为模型拥有工具或记忆，而是因为 `ToolMessage` 被写入 **State**，下一次 **Model Node** 又把完整消息数组提交给模型

### 八、最小示例

```ts
import { ChatDeepSeek } from "@langchain/deepseek";
import { tool } from "@langchain/core/tools";
import {
  END,
  type GraphNode,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
} from "@langchain/langgraph";
import {
  ToolNode,
  toolsCondition,
} from "@langchain/langgraph/prebuilt";
import { z } from "zod";

const lookupDocument = tool(
  ({ id }) => `文档 ${id}：Command 可以同时更新 State 和选择下一节点`,
  {
    name: "lookup_document",
    description: "按文档 ID 读取本地资料",
    schema: z.object({
      id: z.string().trim().min(1),
    }),
  },
);

const model = new ChatDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: "deepseek-v4-flash",
  temperature: 0,
});

const modelWithTools = model.bindTools([lookupDocument], {
  tool_choice: "auto",
});

const State = new StateSchema({
  messages: MessagesValue,
});

const callModel: GraphNode<typeof State> = async (state) => {
  // 每次进入 Model Node 只进行一次模型推理
  const response = await modelWithTools.invoke(state.messages);

  return {
    // MessagesValue 会把新的 AIMessage 合并进消息历史
    messages: [response],
  };
};

const graph = new StateGraph(State)
  .addNode("model", callModel)
  .addNode(
    "tools",
    new ToolNode([lookupDocument], {
      handleToolErrors: false,
    }),
  )
  .addEdge(START, "model")
  // 有 Tool Call 进入 tools，否则进入 END
  .addConditionalEdges("model", toolsCondition, ["tools", END])
  // ToolMessage 回填后，再让模型决定下一步
  .addEdge("tools", "model")
  .compile();

const result = await graph.invoke(
  {
    messages: [
      {
        role: "user",
        content: "读取 doc-1 后解释 Command",
      },
    ],
  },
  {
    recursionLimit: 10,
  },
);

console.log(result.messages.at(-1)?.text);
```

这段代码中的循环不是 `while`，而是下面这组 **Edge**：

```text
model --toolsCondition--> tools
tools ------Edge-------> model
model --toolsCondition--> END
```

### 九、错误与终止边界

- 模型返回不存在的工具名：`ToolNode` 不应执行任意函数
- 模型参数不符合 **Schema**：工具执行应失败或生成明确错误消息
- 工具实现抛出异常：由 `handleToolErrors` 决定转换为 `ToolMessage` 还是向应用抛出
- 模型持续请求工具：循环会继续，最终应由业务轮数限制或 `recursionLimit` 阻止失控
- 模型没有返回 **Tool Call**：`toolsCondition` 直接路由到 `END`
- 缺少 **API Key**：应在创建真实模型时失败，不能降级成伪造成功回答
- 工具成功返回不等于结果可信：工具实现与应用仍需负责权限、事实和业务规则

### 十、责任边界

| 组件 | 负责 | 不负责 |
|---|---|---|
| **LLM** | 根据上下文决定是否生成 **Tool Call**，读取结果后继续推理 | 直接执行本地函数或系统操作 |
| **Model Adapter** | 转换消息、工具定义和 **Provider** 响应 | 决定业务权限与资源范围 |
| **Model Node** | 组织消息并执行一次模型调用 | 手写完整工具循环 |
| `toolsCondition` | 根据最后一条消息选择 `tools` 或 `END` | 判断工具结果质量 |
| `ToolNode` | 匹配、校验、执行已注册工具并生成 `ToolMessage` | 实现具体业务能力与授权体系 |
| **Tool** | 执行确定性业务逻辑 | 决定整个图的控制流 |
| **Graph Runtime** | 调度节点、合并消息、执行回边并限制步骤 | 替应用定义业务终止条件 |
| 应用 **Runtime** | 凭据、允许工具、权限、超时、错误展示与资源边界 | 替代模型完成语义决策 |

### 十一、与 `createAgent()` 的关系

当前写法显式声明：

```text
Model Node
  + ToolNode
  + toolsCondition
  + MessagesValue
  + 循环 Edge
```

`createAgent()` 会把这些通用组成封装成预置 **Agent Harness**

底层机制仍是模型返回 **Tool Call**、程序执行工具、`ToolMessage` 回填、模型继续推理；区别主要在于控制流是由开发者显式搭图，还是由上层 **Harness** 预先组合

### 十二、核心结论

- **Model Node** 是执行一次模型调用的普通 **Node**
- `bindTools()` 只绑定工具定义，不执行工具，也不形成循环
- `ToolNode` 执行 `AIMessage.tool_calls` 中已经注册的工具，并返回关联的 `ToolMessage`
- `toolsCondition` 根据最后一条消息选择进入工具节点或 `END`
- `MessagesValue` 让模型请求、工具结果和最终回答进入同一消息状态
- `tools -> model` 回边与 `toolsCondition` 共同形成 **Agent Loop**
- **LangGraph** 接管循环调度，但业务权限、工具范围、错误策略和资源限制仍由应用负责

### 十三、复习问题

- **LangGraph Agent Loop** 由哪些对象和 **Edge** 组成
- **Model Node** 与普通模型调用是什么关系
- `bindTools()` 的入参、出参和能力边界是什么
- `ToolNode` 的构造入参和运行时输入分别是什么
- `ToolNode` 怎样把工具结果与原 **Tool Call** 关联起来
- `toolsCondition` 读取什么，返回什么
- 为什么 `toolsCondition` 返回 `END` 可以结束循环
- 为什么工具执行后必须再次进入 **Model Node**
- 同一轮多个 **Tool Calls** 如何处理
- `handleToolErrors: false` 会带来什么行为
- **LLM**、`ToolNode`、**Tool**、**Graph Runtime** 和应用 **Runtime** 分别负责什么
- 手写 **LangGraph Agent Loop** 与 `createAgent()` 的本质区别是什么

### 十四、参考资料

- **[LangGraph Tools](https://docs.langchain.com/oss/javascript/langchain/tools)**
- **[LangGraph Workflows and Agents](https://docs.langchain.com/oss/javascript/langgraph/workflows-agents)**
- **[LangChain Models and Tool Calling](https://docs.langchain.com/oss/javascript/langchain/models)**
- **[DeepSeek Tool Calls](https://api-docs.deepseek.com/guides/tool_calls/)**

### 十五、复习参考答案

#### 1. **Agent Loop** 的组成

- **Model Node** 执行一次模型推理并返回 `AIMessage`
- `toolsCondition` 检查是否存在 **Tool Call**
- `ToolNode` 执行已注册工具并返回 `ToolMessage`
- `MessagesValue` 合并消息
- `tools -> model` 回边让模型读取工具结果后继续决策

#### 2. **Model Node** 与模型调用

**Model Node** 不是新的模型类型，只是把一次 `model.invoke(messages)` 放进普通 **Node**，再把 `AIMessage` 作为 **State Update** 返回

#### 3. `bindTools()` 的契约

它接收模型可使用的 **Tool** 数组和 `tool_choice` 等调用选项，返回绑定工具定义的新模型 **Runnable**

它不查找本地实现、不执行工具、不回填结果，也不负责循环

#### 4. `ToolNode` 的构造与运行时输入

构造时传入允许执行的 **Tool** 集合和错误处理选项；运行时读取 **State** 中最后一条 `AIMessage` 的 `tool_calls`

#### 5. 工具结果的关联

`ToolNode` 为每次调用生成 `ToolMessage`，其 `tool_call_id` 对应原 **Tool Call** 的 `id`，模型因此能区分每个请求对应的结果

#### 6. `toolsCondition` 的协议

它读取消息状态中的最后一条消息；发现 `tool_calls` 时返回 `"tools"`，否则返回 `END`

它只是 **Router**，不调用模型，也不执行工具

#### 7. `END` 为什么结束循环

`END` 是图的特殊出口，**Graph Runtime** 路由到这里后不再调度业务 **Node**，本次运行结束并返回最终 **State**

#### 8. 为什么工具后要回到模型

工具只返回确定性执行结果，不负责生成最终语义回答

回到 **Model Node** 后，模型才能读取新增的 `ToolMessage`，决定继续调用其他工具还是形成最终回答

#### 9. 多个 **Tool Calls**

同一条 `AIMessage` 可以携带多个 **Tool Calls**，`ToolNode` 会执行这些已注册工具，并为每个调用生成拥有对应 `tool_call_id` 的 `ToolMessage`

这些工具可以并行执行，因此共享字段需要提前定义明确的 **Reducer**

#### 10. `handleToolErrors: false`

工具参数校验或执行异常会继续向图外抛出，本次运行失败，不会自动生成一条错误 `ToolMessage` 让模型继续

这种方式适合需要由应用统一处理失败、不允许模型在工具异常后自行掩盖问题的场景

#### 11. 各组件的职责

- **LLM** 负责语义判断和生成 **Tool Call**
- `ToolNode` 负责匹配、校验、执行和结果消息转换
- **Tool** 负责真实确定性能力
- **Graph Runtime** 负责节点调度、状态合并和循环
- 应用 **Runtime** 负责凭据、授权、资源边界、超时和错误策略

#### 12. 与 `createAgent()` 的区别

手写 **LangGraph Agent Loop** 显式声明模型节点、工具节点、条件路由和回边，开发者拥有完整控制流

`createAgent()` 把相同通用机制预先组合成更高层 **Harness**，使用更方便，但部分图结构和控制细节被封装起来
