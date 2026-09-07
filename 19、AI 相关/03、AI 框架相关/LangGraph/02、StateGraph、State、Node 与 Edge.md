## **StateGraph**、**State**、**Node** 与 **Edge**

> 适用版本：`@langchain/langgraph@1.4.13`、`zod@4.5.4`

### 一、**LangGraph** 是什么

**LangGraph** 是面向长时运行、有状态工作流的 **Agent** 底层编排框架，它把执行过程表示为显式的 **State**、**Node** 和 **Edge**，再由 **Graph Runtime** 负责节点调度、状态更新和控制权转移

> ==**LangGraph** 是有状态工作流的编排与执行框架：应用定义状态和控制流，**Graph Runtime** 负责按图运行==
>
> ==**LangGraph** = **State** 契约 + **Node** 状态转换 + **Edge** 控制流 + **Graph Runtime**==

可以先把它理解为两层能力：

- **图定义层**：使用 **State** 定义共享数据，使用 **Node** 描述处理步骤，使用 **Edge** 描述控制权如何转移
- **图运行层**：负责调度 **Node**、合并 **State** 更新，并在配置后提供持久化、中断恢复和流式事件

> **LangGraph** 很像是一个状态机系统，它的能力与状态机系统中的能力可以一一对应
>
> ```
> State       = 状态数据
> Node        = 状态处理或转换
> Edge        = 转移规则
> Runtime     = 状态机执行器
> Checkpoint  = 持久化增强
> Interrupt   = 人工介入增强
> Streaming   = 可观测性增强
> ```
>
> ==**LangGraph** = 状态机／状态图 + 共享状态管理 + 工作流调度 + 持久化与恢复能力==
>
> **LangGraph** 没有发明新的工程机制，主要是把状态机、工作流编排、事件流和持久化机制组合成了适合 **LLM** 应用使用的 **API**

**LangGraph** 同时提供 **Graph API** 和 **Functional API**，本文使用 **Graph API**，因为状态、节点、边和控制权转移都直接可见，更适合建立底层认知

#### 1.1、**LangGraph** 与 **LangChain** 的关系

**LangChain** 主要提供高层的模型、消息、工具和 **Agent** 组件，**LangGraph** 主要提供底层的状态与控制流编排

```text
直接使用 LangGraph Graph API
  -> 应用定义 State、Node 与 Edge
  -> LangGraph Runtime 执行工作流

使用 LangChain createAgent()
  -> LangChain 提供高层 Agent Harness
  -> 内部仍由 LangGraph Runtime 执行控制循环
```

- 可以脱离 `createAgent()` 直接使用 **LangGraph** 构建普通工作流或自定义 **Agent**
- **Graph** 中可以调用 **LangChain Model** 和 **Tool**，也可以只执行普通函数
- **LangGraph** 不替代模型和工具，它编排的是这些能力在什么状态下、以什么顺序运行

> **LangGraph** 与 **LangChain** 做的是同一件事：
>
> - ==把具有不确定性的 **LLM** 放进传统控制系统，让 **LLM** 在部分节点中充当动态决策器==

#### 1.2、主要特点

- **显式状态**：**Node** 通过统一 **State** 读取上下文并返回更新
- **显式控制流**：普通 **Edge**、条件 **Edge**、循环和 `Command` 共同表达执行路径
- **持久化执行**：配置 **Checkpointer** 后，可以保存执行进度并恢复 **Thread**

  > **Checkpointer** 是 **State** 的**快照管理与存储机制**，`thread_id` 是快照所属的任务或会话标识
- **人工介入**：工作流可以暂停，等待外部输入后从原位置继续
- **流式观察**：应用可以观察节点执行、状态更新、模型消息和自定义事件
- **底层可控**：应用自行决定状态结构、节点职责、分支条件和恢复策略

#### 1.3、适用场景

- ==一个任务需要经过多个步骤，并在步骤之间共享状态==
- ==后续步骤取决于当前状态，需要分支、循环或重试==
- 模型需要调用工具，并根据工具结果继续决策
- 长任务需要保存执行进度，在进程重启后继续
- 高风险步骤需要暂停，等待人工确认后恢复
- 应用需要观察节点执行、状态变化和模型输出

如果只是一次固定的模型调用，直接使用 **Model API** 通常更简单，不需要额外构建 **Graph**

#### 1.4、能力边界

**LangGraph** 负责有状态工作流的编排与执行，但它不是 **LLM**，也不是完整的应用 **Runtime** 或安全沙箱

下面这些职责仍然属于模型供应商、应用或基础设施：

- 模型推理和 **Token** 生成
- **Tool** 的具体业务实现及副作用控制
- 账号、身份、权限和凭据管理
- 进程、网络、文件系统与沙箱隔离
- 业务会话、租户、审计、成本和合规体系
- **Checkpointer** 存储选型、容量治理和生产稳定性

==**LangGraph 能控制工作流如何运行，但不会替应用自动补齐完整的产品和运行时治理**==

#### 1.5、**FAQ**

**Q1：使用 LangGraph 是否就等于构建了 Agent？**

- 不等于，只有普通函数和固定 **Edge** 的 **Graph** 仍是确定性工作流
- 当 **LLM** 能根据上下文选择行动，并通过工具结果继续决策时，才形成 **Agent** 控制循环

**Q2：传统业务流程也能写分支和循环，为什么还需要 LangGraph？**

- 简单、短时、固定流程直接编程通常更合适

- 当流程需要统一管理共享状态、动态分支、持久化、中断恢复和执行事件时，**LangGraph** 才开始体现价值

  - **LangGraph** 实际上接管了工作流的执行控制权，属于一种控制反转：把节点和规则注册给 **LangGraph**，由 **LangGraph Runtime** 在运行时调用它们

    <!--有点 React 声明式 UI 框架的那个意思-->

**Q3：定义 State 是否意味着状态已经持久化？**

- 不意味着，**State** 只是运行时数据契约
- 只有配置 **Checkpointer**，并为执行提供 **Thread** 标识等信息后，状态才会被保存和恢复

**Q4：LangGraph 为什么被称为底层框架？**

- 它提供 **State**、**Node**、**Edge**、**Checkpoint** 和 **Interrupt** 等编排原语
- 应用仍需自行定义具体工作流，而不是只提供一句目标就自动获得完整 **Agent**

### 二、核心概念与 **API** 载体

**State**、**Node** 与 **Edge** 首先是描述状态图的核心概念，不是三个都需要通过构造器创建的框架类

它们在代码中由不同形式承载：

| 核心概念 | 代码载体 | 产生方式 | 是否直接使用构造器 |
|---|---|---|---|
| **State Schema** | `StateSchema` 实例 | `new StateSchema({...})` | 是 |
| **State** | 普通 **JavaScript** 对象，也是 **Runtime** 执行时的状态快照 | 由 `invoke()` 的输入初始化，再由 **Runtime** 合并 **Node** 返回的更新 | 否，没有 `new State()` |
| **Node** | 普通函数或异步函数 | 定义函数后通过 `addNode()` 注册 | 否，没有 `new Node()` |
| **Edge** | 保存在 **Graph Builder** 中的控制流关系 | 通过 `addEdge()` 或 `addConditionalEdges()` 注册 | 否，没有 `new Edge()` |
| **StateGraph** | **Graph Builder** 实例 | `new StateGraph(StateSchema)` | 是 |
| 可执行 **Graph** | 编译后的运行对象 | 由 `compile()` 根据 **Builder** 产生 | 通常不直接构造 |

> ==**State** 是运行数据，**Node** 是处理函数，**Edge** 是注册关系；==
>
> ==**StateSchema** 与 **StateGraph** 才是显式构造的框架对象==

整体创建与执行过程是：

```text
new StateSchema({...})
  -> 得到 State Schema
  -> 定义普通函数作为 Node
  -> new StateGraph(StateSchema)
  -> addNode() 注册 Node
  -> addEdge() 注册 Edge
  -> compile() 产生可执行 Graph
  -> invoke(initialState) 初始化并运行 State
```

下面四个小节中的代码片段前后衔接，可以依次拼成一个最小 **Graph**

#### 2.1、**State**

**State** 是当前 **Graph** 执行过程中的共享数据快照

- **State Schema** 定义允许出现哪些字段、字段的数据类型以及更新方式，调用方提供初始 **State**
- **Node** 读取当前 **State** 并返回部分更新
- **Graph Runtime** 负责把更新合并回 **State**

**State** 不是任意全局变量，也不等同于数据库：

- 它是一次 **Graph** 执行时各 **Node** 之间的数据契约

- 是否持久化，要看后续是否配置 **Checkpointer**

调用 `new StateSchema()` 创建的是描述字段与更新规则的 **Schema**，不是某一次执行的 **State**

真正的初始 **State** 由普通对象传给 `invoke()`，后续快照由 **Runtime** 在执行过程中维护

```ts
import {
  END,
  START,
  StateGraph,
  StateSchema,
  type GraphNode,
} from "@langchain/langgraph";
import { z } from "zod";

// 创建 State Schema，只描述共享字段及其类型，不代表某次运行的 State
const WorkflowState = new StateSchema({
  request: z.string(),
  normalizedRequest: z.string().default(""),
});

// 初始 State 是普通对象，稍后作为 invoke() 的输入
const initialState = {
  request: "  LangGraph  ",
};
```

这里的 `WorkflowState` 是 **State Schema**，`initialState` 才是准备交给本次执行的初始 **State**

#### 2.2、**Node**

**Node** 是一个处理步骤，通常是接收当前 **State** 并返回部分 **State Update** 的函数

```ts
// Node 是普通函数：读取当前 State，返回本次需要写入的部分更新
const normalizeRequest: GraphNode<typeof WorkflowState> = (state) => {
  return {
    normalizedRequest: state.request.trim(),
  };
};
```

**Node** 可以执行普通计算，也可以调用 **LLM**、**Tool** 或外部服务，**Node** 本身并不天然等于模型节点或工具节点

推荐返回新对象描述本次更新，不直接修改传入的 **State**，这样状态变化更容易理解、测试和追踪

**Node** 没有专门的构造器

- `GraphNode<typeof State>` 只是用于约束函数入参和返回值的 **TypeScript** 类型
- `addNode()` 才把这个普通函数登记为图中的节点

#### 2.3、**Edge**

**Edge** 表示控制权从哪个 **Node** 转移到哪个 **Node**

普通 **Edge** 的下一步固定，条件 **Edge** 会根据当前 **State** 动态选择后续节点

`START` 与 `END` 是特殊标记：

- `START` 指向第一个要执行的 **Node**
- `END` 表示本次 **Graph** 执行结束

**Edge** 不负责传递一份独立参数，后续 **Node** 读取的是 **Runtime** 合并更新后的共享 **State**

**Edge** 也是不需要创建的对象

- `addEdge(from, to)` 是向 **Graph Builder** 注册一条控制流关系
- 编译后由 **Graph Runtime** 根据这些关系决定下一个执行节点

```ts
// 创建 Graph Builder，并把普通函数注册成名为 normalize_request 的 Node
const builder = new StateGraph(WorkflowState)
  .addNode("normalize_request", normalizeRequest)
  // Edge 是注册关系，不是通过构造器创建的对象
  .addEdge(START, "normalize_request")
  .addEdge("normalize_request", END);
```

这段代码没有创建 **Edge** 实例，而是把两条控制流关系登记到 **Graph Builder** 中

#### 2.4、`StateGraph`

`StateGraph` 是 **Graph Builder**，负责把 **State Schema**、**Node** 和 **Edge** 组装成图定义

**Builder** 本身还不是正在运行的工作流，需要调用 `compile()` 得到可执行 **Graph**，再通过 `invoke()` 提供初始输入并触发执行

因此，`new StateGraph()` 创建的是图定义对象，`compile()` 创建的是图执行器，二者都不会自动创建或运行某个业务 **Node**

只有 `invoke()` 才开始一次真实执行

```ts
// compile() 根据 Builder 产生可执行 Graph，但还没有运行任何 Node
const graph = builder.compile();

// invoke() 使用普通对象初始化 State，并开始一次真实执行
const finalState = await graph.invoke(initialState);

console.log(finalState);
```

`builder` 保存图定义，`graph` 是可执行对象，`finalState` 是本次执行结束后的完整 **State** 快照

```text
State Schema + Nodes + Edges
  -> StateGraph Builder
  -> compile()
  -> Executable Graph
  -> invoke(input)
  -> Final State
```

### 三、核心 **API**

这些核心 **API** 分为定义、注册、编译和执行四类：

| 类别 | API | 作用 |
|---|---|---|
| 状态定义 | `new StateSchema()` | 定义共享 **State** 的字段、类型和更新方式 |
| 图定义 | `new StateGraph()` | 创建 **Graph Builder** |
| 节点注册 | `addNode()` | 把普通函数注册为 **Node** |
| 控制流注册 | `addEdge()` | 注册固定 **Edge** |
| 编译 | `compile()` | 把图定义构造成可执行 **Graph** |
| 执行 | `invoke()` | 使用输入启动一次运行并返回最终结果 |

#### 3.1、`StateSchema`

`StateSchema` 使用字段 **Schema** 定义 **Graph** 的共享 **State**

**语法：**

```ts
const stateSchema = new StateSchema(fields);
```

**入参：**

| 参数 | 类型 | 说明 |
|---|---|---|
| `fields` | `StateSchemaFields` | 字段名到 `StateSchemaField` 的映射，每个字段描述值类型、默认值和更新方式 |

下面使用 **Zod Schema** 作为字段定义：

```ts
import { StateSchema } from "@langchain/langgraph";
import { z } from "zod";

const WorkflowState = new StateSchema({
  request: z.string(),
  normalizedRequest: z.string().default(""),
  status: z.enum(["received", "normalized"]).default("received"),
});
```

**出参：**

返回 `StateSchema` 实例，不是 `Promise`，它可以直接传给 `StateGraph`

该实例还提供只用于 **TypeScript** 类型推导的成员：

```ts
type State = typeof WorkflowState.State;   // 完整 State
type Update = typeof WorkflowState.Update; // Node 可以返回的部分更新

// Node 函数类型：接收 State，返回 Update 或 Promise<Update>
const node: typeof WorkflowState.Node = async (state) => ({
  normalizedRequest: state.request.trim(),
});
```

`.State`、`.Update` 和 `.Node` 用在类型位置，不是需要在运行时调用的方法

当前字段没有配置 **Reducer**，同一字段收到新值时采用覆盖式更新；列表追加、消息累积等规则在 **Reducer** 与消息状态主题中展开

#### 3.2、`new StateGraph()`

`StateGraph` 构造器根据 **State Schema** 创建图定义对象

**语法：**

```ts
const builder = new StateGraph(stateSchema, options);
```

**入参：**

| 参数 | 类型 | 说明 |
|---|---|---|
| `stateSchema` | 状态定义对象 | 支持 `StateSchema`、**Zod** 对象 **Schema** 或 `Annotation.Root`，本文示例使用 `StateSchema` |
| `options` | `object \| undefined` | 可选的输入、输出和运行上下文等配置，本文示例省略 |

```ts
// 创建 Builder，不会执行任何 Node
const builder = new StateGraph(WorkflowState);
```

**出参：**

返回尚未编译的 `StateGraph`，也就是 **Graph Builder**，不是 `Promise`

它只保存 **State Schema**、**Node** 和 **Edge** 定义，此时还不能调用 `invoke()`

#### 3.3、`addNode()`

`addNode()` 把一个函数或 **Runnable** 注册为图中的 **Node**

**语法：**

```ts
const nextBuilder = builder.addNode(name, action, options);
```

**入参：**

| 参数 | 类型 | 说明 |
|---|---|---|
| `name` | `string` | **Node** 在当前图中的唯一名称，也是 **Edge** 引用该节点时使用的标识 |
| `action` | `GraphNode \| Runnable` | 节点执行逻辑，本文示例使用普通函数 |
| `options` | `object \| undefined` | 节点级输入约束、重试、缓存、超时和错误处理等可选配置，本文示例省略 |

**Node** 函数本身的契约是：

```ts
// 入参 state：Runtime 合并后的当前完整 State
// 出参：本 Node 需要写入的部分 State Update
const normalizeRequest: typeof WorkflowState.Node = (state) => ({
  normalizedRequest: state.request.trim(),
});

builder.addNode("normalize_request", normalizeRequest);
```

本文只关注 **Node** 直接返回 **State Update**，或者异步返回包含 **State Update** 的 `Promise`；`Command` 等其他返回形式不在本文展开

**出参：**

返回更新过节点类型信息的 **Graph Builder**，因此可以继续链式调用；它不会返回 **Node** 的运行结果，也不会立即执行该函数

#### 3.4、`addEdge()`

`addEdge()` 注册一条固定控制流，表示起点执行完成后激活终点

**语法：**

```ts
const nextBuilder = builder.addEdge(startKey, endKey);
```

**入参：**

| 参数 | 类型 | 说明 |
|---|---|---|
| `startKey` | `START \| NodeName \| NodeName[]` | 控制流起点，本文示例使用 `START` 或单个节点名 |
| `endKey` | `NodeName \| END` | 控制流终点，可以是已注册节点或 `END` |

```ts
builder
  // Graph 从 normalize_request 开始
  .addEdge(START, "normalize_request")
  // normalize_request 完成后结束
  .addEdge("normalize_request", END);
```

`START` 与 `END` 是框架导出的特殊控制流标记，不是普通业务 **Node**

**出参：**

返回当前 **Graph Builder**，便于继续链式注册

`addEdge()` 只登记关系，不会沿着这条 **Edge** 立即执行任何 **Node**；条件 **Edge** 在条件路由与循环主题中展开

#### 3.5、`compile()`

`compile()` 根据 **Builder** 中保存的状态、节点和边生成可执行 **Graph**

**语法：**

```ts
const graph = builder.compile(options);
```

**入参：**

| 参数 | 类型 | 说明 |
|---|---|---|
| `options` | `object \| undefined` | 编译配置，本文示例不传入 |

常见配置包括 `checkpointer`、`interruptBefore`、`interruptAfter`、`name` 和 `description`；持久化、中断、缓存、存储和流转换配置不在本文展开

**出参：**

返回 `CompiledStateGraph`，即可以调用 `invoke()`、`stream()` 等执行方法的 **Graph** 对象，不是 `Promise`

`compile()` 会检查部分图结构并构造执行器，但不会执行 **Node**，也不会发起模型或工具调用；编译成功不代表节点业务逻辑一定正确

#### 3.6、`invoke()`

`invoke()` 使用本次输入启动可执行 **Graph**

**语法：**

```ts
const result = await graph.invoke(input, options);
```

**入参：**

| 参数 | 类型 | 说明 |
|---|---|---|
| `input` | 由输入 **Schema** 推导的类型 | 满足图输入 **Schema** 的初始数据，本文示例使用普通对象 |
| `options` | `Partial<PregelOptions> \| undefined` | 本次运行配置，可以承载 `signal`、`recursionLimit` 和 `configurable` 等信息，也可以省略 |

```ts
// input 用于初始化本次运行的 State
const result = await graph.invoke({
  request: "理解 LangGraph State",
});
```

配置 **Checkpointer** 后，`options.configurable.thread_id` 用于指定状态所属 **Thread**；具体机制在持久化与状态历史主题中展开

**出参：**

返回一个 `Promise`，其结果类型由图的输出 **Schema** 推导；本文示例没有单独定义输出 **Schema**，所以成功到达 `END` 后得到合并完成的最终 **State**

如果 **Node** 抛出未处理异常，`invoke()` 返回的 `Promise` 会拒绝，后续 **Node** 不会继续执行

因此，`compile()` 与 `invoke()` 的边界是：前者构建执行器，后者才开始一次真实运行

### 四、数据流与控制流

假设图包含两个 **Node**：

```text
START
  -> normalize_request
  -> create_plan
  -> END
```

运行过程是：

1. 应用通过 `invoke()` 提供初始 **State**
2. **Runtime** 根据 `START` **Edge** 调度 `normalize_request`
3. **Node** 读取 `request`，返回 `normalizedRequest` 和新的 `status`
4. **Runtime** 将部分更新合并进共享 **State**
5. **Runtime** 根据下一条 **Edge** 调度 `create_plan`
6. 第二个 **Node** 读取已经更新的 **State**，返回 `plan`
7. **Runtime** 合并更新并沿 **Edge** 到达 `END`
8. `invoke()` 返回最终 **State**

其中，**State** 承载数据，**Edge** 承载控制权，**Node** 执行状态转换，**Runtime** 负责调度和合并，四者不能混为一个概念

### 五、最小示例

```ts
import {
  END,
  START,
  StateGraph,
  StateSchema,
  type GraphNode,
} from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  request: z.string(),
  normalizedRequest: z.string().default(""),
  result: z.string().default(""),
});

const normalize: GraphNode<typeof State> = (state) => ({
  normalizedRequest: state.request.trim(),
});

const summarize: GraphNode<typeof State> = (state) => ({
  result: `需要整理：${state.normalizedRequest}`,
});

const graph = new StateGraph(State)
  .addNode("normalize", normalize)
  .addNode("summarize", summarize)
  .addEdge(START, "normalize")
  .addEdge("normalize", "summarize")
  .addEdge("summarize", END)
  .compile();

const finalState = await graph.invoke({
  request: "  LangGraph 的状态如何流动  ",
});

console.log(finalState);
```

这个示例只有固定路径和普通函数，没有模型决策、工具调用或循环，因此它是一个由 **LangGraph** 执行的确定性状态图，还不是完整 **Agent**

### 六、关键边界与常见误区

- 创建 `StateGraph` 只是定义图，调用 `compile()` 也只是得到执行器，只有 `invoke()` 才开始一次执行
- **Node** 不需要返回完整 **State**，只返回本次要更新的字段
- **Edge** 管理执行顺序，不承担业务数据传递；数据通过 **State** 共享
- **State Schema** 定义运行时数据契约，不自动意味着状态已经持久化
- **Node** 可以是普通函数，使用 **LangGraph** 不等于必须调用 **LLM**
- 固定 **Node** 与 **Edge** 只能证明状态编排，不能证明已经具备 **Agent** 的动态决策能力
- **LangGraph** 提供 **Agent** 工作流 **Runtime** 的关键原语，但不会替应用自动补齐身份、权限、产品会话和业务治理

### 七、本节结论

本节可以压缩为一条关系：

> 使用 **State Schema** 定义共享数据，用 **Node** 描述状态转换，用 **Edge** 描述控制权转移，再将 `StateGraph` 编译并通过 `invoke()` 执行

**LangGraph** 的主要价值会在动态分支、循环、持久化、中断和恢复组合起来后出现

### 八、复习问题

1. **LangGraph** 主要解决什么问题，它与模型供应商分别负责什么
2. **State**、**Node**、**Edge** 和 **Graph Runtime** 分别承担什么职责
3. **Node** 为什么通常只返回部分 **State Update**，而不是返回或修改完整 **State**
4. `StateSchema`、`StateGraph`、`addNode()`、`addEdge()`、`compile()` 和 `invoke()` 的主要入参与出参分别是什么
5. `START` 与 `END` 是普通业务 **Node** 吗
6. 后一个 **Node** 如何获得前一个 **Node** 产生的数据
7. 定义 **State Schema** 是否意味着状态已经持久化
8. 为什么这个最小图还不能算完整 **Agent**
9. **State**、**Node**、**Edge** 和 `StateGraph` 在代码中分别由什么承载，哪些需要构造器

### 九、参考资料

- [LangGraph Overview](https://docs.langchain.com/oss/javascript/langgraph/overview)
- [Graph API](https://docs.langchain.com/oss/javascript/langgraph/graph-api)
- [Use the Graph API](https://docs.langchain.com/oss/javascript/langgraph/use-graph-api)

### 十、复习参考答案

#### 1. **LangGraph** 与模型供应商的责任边界

- **LangGraph** 负责有状态工作流的控制流、状态更新和节点调度

- 模型供应商负责真正的推理与 **Token** 生成

- **Graph** 中可以完全没有 **LLM**，因此运行 **Graph** 不等于调用模型

#### 2. **State**、**Node**、**Edge** 与 **Graph Runtime**

- **State** 保存当前共享数据

- **Node** 执行一次处理并产生 **State Update**

- **Edge** 决定下一步控制权流向

- **Graph Runtime** 调度 **Node**，并把 **Node** 返回的更新合并进 **State**

#### 3. **Node** 为什么返回部分 **State Update**

- 部分更新能够明确表达当前 **Node** 修改了哪些字段

- **State** 的合并规则统一交给 **Runtime**，**Node** 不需要复制与自己无关的字段

- 直接修改完整 **State** 会让数据来源、更新边界和测试结果更难追踪

#### 4. 核心 **API** 的入参与出参

- `new StateSchema(fields)` 接收字段定义映射，返回 **State Schema** 实例

- `new StateGraph(stateSchema, options?)` 接收状态契约和可选图配置，返回尚未编译的 **Graph Builder**

- `addNode(name, action, options?)` 接收节点名、节点函数和可选配置，返回可继续链式注册的 **Builder**；节点函数运行时接收当前 **State**，返回部分 **State Update**

- `addEdge(startKey, endKey)` 接收控制流起点和终点，返回 **Builder**，不会立即执行节点

- `compile(options?)` 接收可选编译配置，返回 `CompiledStateGraph`，不会开始运行

- `invoke(input, options?)` 接收图输入和本次运行配置，返回一个结果类型由输出 **Schema** 推导的 `Promise`；本文示例成功到达 `END` 后得到最终 **State**

#### 5. `START` 与 `END`

- `START` 与 `END` 是图的特殊入口和出口标记，不是普通业务 **Node**

- 它们参与控制流定义，但不执行普通业务逻辑

#### 6. **Node** 之间如何共享数据

- 前一个 **Node** 返回部分更新，**Runtime** 先把更新合并进共享 **State**

- **Runtime** 再把更新后的 **State** 交给后一个 **Node**，数据不是由 **Edge** 单独携带

#### 7. **State Schema** 与持久化

- **State Schema** 只定义运行时数据契约和更新方式，不代表状态已经写入持久化存储

- 持久化还需要配置 **Checkpointer**，并在执行时提供 **Thread** 标识等配置

#### 8. 最小 `StateGraph` 为什么还不是完整 **Agent**

- 当前 **Graph** 只有预先确定的普通 **Node** 和固定 **Edge**，本质上是确定性状态工作流

- 它没有让 **LLM** 根据上下文选择行动，也没有工具调用与结果反馈形成的动态循环

#### 9. 核心概念与代码载体

- **State** 是由 `invoke()` 输入初始化、再由 **Runtime** 持续合并更新的普通对象，不通过 `new State()` 创建

- **Node** 是注册给 `addNode()` 的普通函数，**Edge** 是通过 `addEdge()` 或 `addConditionalEdges()` 注册的控制流关系，二者都没有对应的业务构造器

- `StateSchema` 与 `StateGraph` 是需要显式构造的框架对象，`compile()` 再根据 **Graph Builder** 产生可执行 **Graph**
