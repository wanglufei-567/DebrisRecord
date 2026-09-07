## **LangChain** 认知模型与架构全景

### 一、问题与定位：**LangChain** 解决哪一段工程问题

#### 1.1、从一次模型调用到一个可运行的 **Agent**

当任务只是一次无工具、无状态的模型交互时，调用 **LLM SDK** 通常已经足够，此时控制路径很简单：

```
应用提交 -> 输入模型 -> 返回输出，本次调用结束
```

但有些任务无法在一次调用中完成：模型需要根据当前上下文选择动作，工具执行动作并返回结果，模型再根据结果决定继续还是停止

```text
模型判断 -> 提出动作 -> 工具执行 -> 结果回填 -> 模型再次判断
```

这种反复经历**判断**、**行动**和**反馈**的「**控制结构**」就是 **Agent Loop**

**LangChain** 在这里主要降低两类工程成本：

- **组件连接成本**：用统一的 **Model、Message、Tool** 契约减少模型、消息与工具之间的适配工作
- **循环组织成本**：把模型调用、工具调用、结果回填与继续或停止，组织成可配置的**反馈循环**

> ==**LangChain** 标准化**「模型」**、**「消息」**与**「工具」**的连接方式，并预制一种常见的 **Agent Loop**==

**LangChain** 不提供模型智能，也不直接执行现实动作，它替应用减少的是**组件适配**与常见**循环控制代码**，而不是完整 **Agent** 产品的全部工程责任

知道 **LangChain** 提供了一套 **Loop** 不足以确定它的完整边界，还需要继续区分 **Agent** 应用中 **Loop**、**Harness** 与 **Runtime** 分别承担什么责任

#### 1.2、三个概念必须分开：**Loop、Harness** 与 **Runtime**

要进一步确定 **LangChain** 的责任边界，必须把三个经常混用的概念拆开：

- **Agent Loop** 描述任务如何推进：模型判断、提出动作、接收环境反馈，再决定继续或停止
- **Agent Harness** 描述 **Loop** 周围由谁承接工程责任：**Prompt、Tools、Context、State、Permissions、Recovery** 以及相应策略
- **Agent Runtime** 描述控制结构在哪里、以什么语义运行：节点调度、状态持久化、恢复、流式与人工介入

三者不是从低到高的等级，而是三个不同的观察维度

> ==**Loop** 描述任务怎样推进，**Harness** 描述系统替应用承担什么，**Runtime** 描述控制结构怎样运行==

作为 **Agent Framework**，**LangChain** 主要提供两类能力

- 一类是模型、消息、工具和结构化结果的标准组件
- 另一类是包含预制 **Loop** 的可配置 **Harness**

> ==**LangChain** 提供标准组件与可配置 **Harness**，其中的预制 **Loop** 运行在 **LangGraph Runtime** 上==

**LangChain Agent** 可以直接运行，但其节点调度、状态持久化、恢复、流式和人工介入等底层运行语义由 **LangGraph Runtime** 提供

**LangChain** 本身不另设一套与 **LangGraph** 并列的独立 **Runtime**

#### 1.3、**LangChain** 在 **Agent** 系统中负责哪一段

完整 **Agent** 必须同时闭合**任务契约**、**上下文**、**决策**、**行动**、**控制**、**验证与治理**六类工程责任

**LangChain** 横跨其中多项，但只重点承接其中一部分：

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/LangChain-工程职责覆盖.svg" alt="LangChain 在 Agent 工程责任中的覆盖位置" style="zoom: 60%;" />

这张图只需记住三个词：**连接、组织、边界**

- **连接**：统一模型、消息、工具与结构化结果的交互契约
- **组织**：预制模型&工具反馈循环，并为上下文、状态与部分治理机制提供扩展接口
- **边界**：模型智能来自 **Provider / LLM**，现实动作由 **Tool / Runtime** 执行，知识可信、用户权限与任务验收仍由应用负责

> ==**LangChain** 连接组件、组织循环，但不接管语义识别、意图判断、执行与最终责任==

#### 1.4、**LangChain** 没有替应用解决什么

==官方将 **LangChain** 定位为 **Agent Framework**，将 **LangGraph** 定位为 **Agent Runtime**，将 **Deep Agents** 定位为预置能力更完整的 **Agent Harness**==

同时把 **LangChain** 预构建 **Agent** 能力描述为高度可配置的 **Harness**：它基于 **LangGraph** 构建运行结构，并在 **Harness** 内包含一套预制的模型&工具反馈循环

**LangChain** 提供 **Agent** 应用基础 **Harness**：

- 框架提供**Agent Loop** 、 **Middleware、State、Checkpointer** 和流式入口


- 但**身份系统**、**资源隔离**、**权限事实**、**长期记忆治理**、**正式验收和发布**责任仍在框架之外


**LangChain** 的价值正在于这种克制：==它把高频连接和基础 **Loop** 做成框架能力，把更具体的工作环境、长期运行与产品责任留给应用或其他系统==

后文将回答四个问题：

- **位置**：**Framework、Runtime** 与 **Harness** 怎样分工，为什么不能按 **Loop** 排成高低层级
- **机制**：模型、工具和应用怎样交换信息并推进循环
- **运行**：上下文、状态和过程事件怎样共同支撑一次任务
- **边界**：哪些责任仍属于应用、运行时和预置能力更多的 **Harness**

### 二、架构位置：**LangChain** 处在协议层与控制层的交界处

#### 2.1、**Framework、Runtime** 与 **Harness** 是三类责任

**LangSmith** 官方将其开源 **Agent** 技术栈划分为三类产品角色：

| 产品类型 | 代表实现 | 主要提供 | 与 **Loop** 的关系 |
|---|---|---|---|
| **Agent Framework** | **LangChain** | 标准组件、集成、`createAgent()` 与 **Middleware** | 提供一种预制 **Loop**，也允许应用配置周围 **Harness** |
| **Agent Runtime** | **LangGraph** | 状态图执行、持久化、流式、人工介入与底层控制 | 负责实际推进 **Loop** 或 **Workflow**，不规定它必须是哪一种 |
| **Agent Harness** | **Deep Agents** | 文件系统、上下文管理、子 **Agent**、长期记忆等预置能力，可按需启用规划与 **Skills** | 包围并扩展 **Loop**，而不是替代 **Loop** |

三类产品扮演了不同的工程责任：

- 使用 **LangChain**，可以复用**标准组件**和预制**控制结构**，但需自行配置 **Harness** 的业务部分
- 使用 **LangGraph**，可以直接定义 **Runtime** 的状态、节点、路由与恢复语义
- 使用 **Deep Agents**，围绕相同核心工具调用 **Loop**，获得更多已经组装好的 **Harness** 能力

> 把三者按 **Loop** 排成高低层级会错过真正的设计问题，它们分别回答“怎样开发”、“怎样运行”和“外围能力由谁预装”

#### 2.2、**LangChain** 内部有两类核心职责

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/LangChain-架构位置与边界.svg" alt="LangChain 在应用、Provider、LangGraph Runtime 与 Tool 之间的架构位置" style="zoom:60%;" />

**LangChain** 内部可以压缩为两类职责：

- **标准化组件**：用 **Model、Message、Tool、Schema、Runnable** 和各类 **Provider Adapter** 稳定主要连接面
- **可配置 Harness**：用 `createAgent()` 提供预制模型—工具反馈循环，并用 **Middleware、State、Checkpointer** 接口和流式投射暴露配置面

使用 `model.invoke()` 时，应用只用了标准化组件，没有进入 **Agent** 编排

使用 `createAgent()` 时，框架才会把模型、工具、状态和钩子组织成图，并交给 **LangGraph Runtime** 推进这套预制控制结构

#### 2.3、框架能组织控制，却不能越过现实边界

四条边界必须始终分开：

- **模型边界**：真实 **LLM** 通常运行在 **Provider** 一侧，**LangChain Model** 是应用中的协议对象
- **动作边界**：模型产生 **Tool Call**，工具执行函数才访问资料或改变外部世界
- **运行边界**：**LangGraph** 推进图，应用进程与 **Sandbox** 承载真正的代码执行和资源权限
- **产品边界**：==身份、租户、预算、数据保留、来源证明与最终业务验收的职责仍归应用==

**LangChain** 可以提供控制点，却不能凭框架内部对象替外部系统创造可信事实

边界明确后，下一步才是进入框架内部，理解模型、工具和应用怎样通过公共协议交接控制权

### 三、核心协议：把概率性判断接回确定性软件

#### 3.1、协议怎样完成一次控制权交接

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/LangChain-核心协议链.svg" alt="Model、Message、Structured Output 与 Tool 的核心协议链" style="zoom:67%;" />

无论具体任务是什么，一次模型—工具交互都会经过四步：

1. 应用通过 **Message** 提交问题和上下文
2. **Model Adapter** 转换供应商协议，模型返回文本或 **Tool Call**
3. 运行时执行工具，再用 `ToolMessage` 把真实结果交还模型
4. 如果配置了结果格式，任务结束后由 **Structured Output** 把最终结果收敛成应用可读取的对象

这四步组成一条往返协议，它让模型能够提出动作，也让确定性软件在动作真正发生前重新取得控制权

#### 3.2、**Message** 是共享信封，**Model** 是适配边界

- **Message** 承载角色、内容与元数据
  - `AIMessage` 还可以携带 `tool_calls`、**Usage** 与供应商响应元数据

- **Chat Model** 不是模型权重，而是应用中的协议边界
  - 它把标准消息转换为具体 **Provider** 请求，再把响应还原为统一对象

统一接口能稳定主路径，却不会抹平专有内容块、上下文限制、限流、错误与流式事件差异

#### 3.3、**Tool Schema** 是动作词汇，不是现实授权

一个应用侧 **Tool** 至少包含名称、描述、输入 **Schema** 和执行函数，前三项定义模型可以提出什么动作，执行函数才让动作真正发生

`tool_call_id` 用来关联动作请求与 `ToolMessage`，它只能证明响应属于哪次调用，不能证明工具已注册、调用者有权使用、资源存在或执行成功

**Tool Calling** 把模糊意图压缩成可校验、可拒绝、可追踪的动作提议，它建立了动作语言，但没有授予执行权

#### 3.4、**Structured Output** 是接口契约，不是事实证明

- 模型级 `withStructuredOutput()` 约束单次模型调用的返回对象


- **Agent** 级 `responseFormat` 约束整次运行的终态，并把结果写入 `structuredResponse`

底层可能使用 **Provider Strategy** 的原生结构化能力，也可能使用 **Tool Strategy** 的特殊结果工具；两者统一的是结果读取位置，不是事实质量

> ==**JSON** 证明“能解析”，**Schema** 证明“长得对”，证据与验收才回答“说得对不对”==

到这里，协议已经完整，下一步的问题不再是“有哪些对象”，而是谁负责让这条链反复运行

### 四、控制权：`createAgent()` 不是智能升级，而是循环实现方式变化

#### 4.1、三种调用形态对应三种循环责任分配

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/LangChain-循环控制权对比.svg" alt="model.invoke、手写 Tool Loop 与 createAgent 的循环责任分配" style="zoom:67%;" />

- `model.invoke()` 完成一次模型交互，没有循环
- 手写 **Tool Loop** 由应用维护消息、执行工具并判断停止
- `createAgent()` 提供预制循环，应用改为声明组件、策略与限制，底层由 **LangGraph Runtime** 推进

这不是三个必须依次升级的阶段，更不是不同种类的 **Agent**，而是同一类模型—工具反馈过程的三种实现方式

#### 4.2、`createAgent()` 实际接管了什么

在当前 `langchain@1.5.10` 源码中，`createAgent()` 主要完成三件事：

1. 创建 **StateGraph**，加入模型节点和可选的工具节点
2. 把节点式 **Hook** 编成图节点，把包装式 **Hook** 放到模型或工具调用边界
3. 编译整张图，根据 `AIMessage` 中是否存在 **Tool Call** 决定继续还是结束

配置 `responseFormat` 后，最终结果会写入 `structuredResponse`

所以，一次 `agent.invoke()` 可能包含多轮模型调用和工具执行，返回的是最终 **Agent State**，而不是一条孤立的 `AIMessage`

`createAgent()` 不会让模型变得更聪明，它只是把散落在业务代码里的 `while`、消息回填和生命周期控制，封装为显式、可替换的运行结构

#### 4.3、框架接管循环实现，不等于接管任务责任

| 阶段 | `createAgent()` 接管 | 应用仍须保证 |
|---|---|---|
| 进入循环前 | 接收 **Model、Tools、Context** 与运行配置 | 身份可信、工具范围正确、凭据与资源最小化 |
| 循环运行中 | 图路由、**Hooks**、调用限制与错误策略 | 所有副作用经过必经控制点，执行环境没有旁路 |
| 循环结束后 | 最终 **State、structuredResponse** 与事件 | 来源、权限、成本、展示与审计通过业务验收 |

预制控制结构提高可测试性与治理能力，也会增加钩子顺序、状态耦合和版本依赖

框架减少了循环实现代码，并没有替应用承担循环内外的全部责任

循环解决“任务怎样继续”，但一次运行还要回答“本轮依据什么、状态怎样延续、过程怎样被观察”，这正是下一章三条横切链的职责

### 五、三条横切链：**Context、State** 与 **Streaming** 不能互相替代

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/LangChain-运行上下文与状态消费.svg" alt="Runtime Context、Agent State 与 Streaming 的消费链及边界" style="zoom:67%;" />

**Context、State、Streaming** 都与运行信息有关，却分别回答三个问题：本轮依据什么、过程已经积累了什么、外部能够看到什么

三者服务于不同对象，不能混成一个笼统的“上下文”概念

#### 5.1、**Runtime Context** 与 **Middleware** 提供本次执行依据

**Runtime Context** 是调用方注入本次运行的依赖与配置，例如请求标识、已认证用户信息、数据库连接或允许访问的资料集

它的消费路径可以压缩为：

调用方注入 **Runtime Context** → **Middleware** 选择性投影 → **Prompt、Model** 或 **Tool** 消费

这里必须记住三个边界：

- **不是 State**：它不会因 `thread_id` 自动恢复
- **不是 Message**：它不会默认写进 **Messages**
- **不是秘密保险箱**：**Middleware** 可以把它注入 **Prompt**，工具也可能把其中字段写入结果或日志

**Middleware** 决定这些运行依据怎样进入执行过程，主要有两种介入方式：

- 节点式 **Hook** 成为图中的独立节点
- 包装式 **Hook** 包裹模型或工具调用

但设置了 **Hook** 不等于建立了可信控制点，还必须满足三个外部条件：

- 受保护动作没有绕过 **Middleware** 的旁路
- 下游系统能够独立拒绝越权参数
- 运行环境遵守最小授权

**Middleware** 既能快速解决横切问题，也可能制造一个看不见的控制平面；权限和终止规则越关键，越不应分散在难以整体推演的钩子里

#### 5.2、**Agent State、Checkpointer** 与 **Thread** 提供运行连续性

这三个概念分别解决不同问题：

- **Agent State** 是图节点共同读写的运行数据
- **Checkpointer** 按图步骤保存和恢复状态快照
- `thread_id` 标识同一条状态序列

三者共同保证运行连续性，但都不等于身份系统或长期记忆治理

例如，`MemorySaver` 只把 **Checkpoint** 保存在进程内存中，不能提供重启恢复、多实例一致性、备份、隐私删除或租户隔离

持久化回答“昨天运行到哪里”，记忆治理回答“哪些事实值得保留、还能否相信、何时应该忘记”；把两者都叫 **Memory**，会掩盖完全不同的工程责任

#### 5.3、**Streaming** 投射过程，不接管过程

`stream()` 可以按 `updates`、`messages`、`custom` 等模式读取状态更新、模型输出与自定义进度；`streamEvents(..., { version: "v3" })` 提供更统一的类型化运行事件

流式事件可能包含内部状态、供应商元数据和异常信息，应用应先脱敏、归一化与过滤，再转换为稳定的 **UI** 或外部 **API** 事件

停止读取事件不等于取消底层运行，观察通道也不等于控制通道

> ==**Context** 决定本轮依据，**State** 保存运行事实，**Streaming** 投射已经发生的过程==

三条链分别说清依据、连续性和可见性之后，才能把协议、循环与现实执行放回同一次任务中观察

### 六、端到端运行：一次受控资料整理如何交接控制权

用户目标是：“在我有权访问的技术资料中搜索 **Tool Calling**，读取相关正文，并返回带来源的结构化总结”

![受控资料整理 Agent 的端到端控制权时序](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/LangChain-资料整理执行时序.svg)

这次调用依次发生六次关键交接：

1. 应用完成认证与租户判断，装配允许工具，把资料范围放入 **Runtime Context**
2. **LangGraph Runtime** 根据可信 `thread_id` 恢复 **Checkpoint**，合并本轮消息并推进图
3. 模型节点调用 **Provider / LLM**，返回的 `AIMessage.tool_calls` 只是动作提议，控制权已经回到本地运行时
4. **Middleware** 与工具注册表重新校验名称、参数和范围，工具实现才执行搜索或读取
5. `ToolMessage` 进入 **State**，真实结果成为下一轮模型判断的观察，循环继续或结束
6. `structuredResponse` 回到应用后，应用继续验证来源、引用、授权、成本与展示条件

每一轮工具调用都要重新经过策略与执行边界，不能把第一轮授权当成整条动态路径的永久通行证

这个例子也揭示了四个常见伪等式：

```text
thread_id ≠ 身份凭证
Middleware ≠ Sandbox
Structured Output ≠ 事实证据
Agent Loop ≠ 完整 Agent 产品
Agent Loop ≠ LangChain 专属能力
```

一个 **Agent** 是否成熟，不看它能自主走多少步，而看每一步能否留下独立于模型自述的环境事实，并在关键边界重新获得授权与验收

运行链说明了 **LangChain** 能怎样组织任务，接下来还需要反向评估这套抽象带来的收益、摩擦与能力上限

### 七、研究判断：**LangChain** 的真实价值与代价

#### 7.1、抽象稳定主连接面，但不会消灭差异

| 连接面 | 框架稳定什么 | 仍会泄漏什么 |
|---|---|---|
| 模型输入输出 | **Messages、invoke()** 与统一响应对象 | 专有参数、内容块、上下文限制、错误与 **Usage** |
| 工具交互 | **Tool Definition、Tool Call、ToolMessage** | 并行调用、强制选择、服务端工具与错误语义 |
| 结构化结果 | **Schema** 驱动调用与统一读取位置 | 原生能力、支持模式与端点限制 |
| **Agent Loop** | 提供一套执行、回填、继续或结束的预制实现 | 模型行为、调用次数、策略顺序与业务终态 |
| 状态与过程 | **State、Checkpoint** 与流式入口 | 存储一致性、事件细节、保留策略与产品协议 |

抽象泄漏不是框架失败的充分条件；真正的失败，是框架既不能稳定主路径，又让开发者失去观察和穿透差异的能力

#### 7.2、六个从机制推导出的判断

1. **LangChain 的核心产物不是某个 Agent，而是一套可复用的 Agent 组装语法**

    - **LangChain** 标准化的不是智能本身，而是模型、消息、工具、状态和循环怎样进入同一个软件结构
    - 具体 **Agent** 仍然属于应用，框架提供的是生产不同 **Agent** 的公共语法

2. ==**框架不会减少 Agent 的总复杂度，只会重新分配复杂度**==
    - ==**LangChain** 消除了部分协议适配和循环实现代码，却引入状态语义、生命周期扩展、抽象调试和版本依赖==
    - ==框架的价值不在于复杂度消失，而在于复杂度是否被转移到更稳定、更容易治理的位置==

3. **模型决策权与系统控制权是两条不同的轴**

    - 模型可以动态决定下一步，但动作空间、权限范围、执行环境、停止条件和最终验收仍由软件系统定义
    - 一个 **Agent** 越自主，越需要明确控制边界，而不是越应该把控制权整体交给模型

4. **Agent Framework 的生态位由默认承接的责任决定，而不是由有没有 Loop 决定**

    - 手写 **Agent、LangChain、Deep Agents、Hermes Agent** 都可以拥有模型—工具反馈循环
    - 真正区分它们的，是谁预先承担了上下文、工作空间、协作、持久化、恢复和治理责任，以及模型被允许在多大的任务空间内行动

5. **接口标准化可能降低 Provider 锁定，却加深框架语义锁定**

    - 统一模型和工具接口提高了局部可替换性，但如果 **Message、State、Event、Middleware** 逐渐成为业务契约，更换框架就会演变为重写业务流程
    - 真正的可移植性不只看能否切换模型，还要看业务语义是否保持在框架边界之外

6. **LangChain 的能力上限不由 Loop 能走多远决定，而由应用还要补齐多少外围责任决定**

    - 循环可以持续很多轮，但这不等于系统已经拥有可信上下文、长期工作空间、跨任务协作、资源隔离和产品验收
    - ==当外围责任的自行建设成本超过框架带来的组合收益时，问题不再是继续扩展 **LangChain**，而是应该下探 **Runtime**，还是采用预置责任更多的 **Harness**==

#### 7.3、责任边界：**Loop、Workflow、Harness** 与 **Runtime** 不能排成一条阶梯

最容易形成的误解，是把“传统 **Workflow → LangChain Agent Loop → Agent Harness**”理解成 **Agent** 能力逐级升高

这条尺度并不存在，因为四个概念回答的是不同问题：

- **Workflow：路径**——任务路径怎样组织，确定性边与模型动态决策可以同时存在
- **Agent Loop：推进**——任务怎样反复经历判断、行动、反馈与停止
- **Harness：装配**—— **Loop** 周围预先装配了哪些上下文、工具、策略与协作能力
- **Runtime：运行**——控制结构怎样被调度、持久化、恢复和观察

> **Workflow** 描述路径，**Loop** 描述推进，**Harness** 描述装配，**Runtime** 描述运行

一个 **Workflow** 可以包含 **Agent** 节点和循环，一个 **Harness** 必然包围某种 **Loop**，一个 **Runtime** 既可以运行 **Agent Loop**，也可以运行确定性 **Workflow**

因此，比较 **Agent** 系统，需要分开回答两组问题

第一组是“任务怎样运行，模型能决定什么”：

| 系统形态 | 控制结构与 **Loop** | 模型决策边界 |
|---|---|---|
| 传统 **Workflow** | 代码预先定义主要路径，可以没有 **Loop**，也可以包含局部循环 | 通常限于特定节点 |
| **LangChain** `createAgent()` | 应用配置能力空间，框架提供模型—工具—反馈循环 | 在已注册的 **Tools、Prompt、State** 与策略内选择行动和停止 |
| **Deep Agents** | 在核心工具调用 **Loop** 周围加入规划、子 **Agent** 与上下文管理等子过程 | 可以在更长任务跨度内拆解、委派和操作环境 |
| **Hermes Agent** | 在核心任务 **Loop** 周围叠加学习、委派、持久化和调度机制 | 可以跨工具、子 **Agent**、会话与计划持续推进任务 |

第二组是“六类责任由谁承担，工作环境已经预置了什么”：

| 系统形态 | 六类责任的分配方式 | 预置的外围能力 |
|---|---|---|
| 传统 **Workflow** | 应用显式安排任务契约、上下文、决策、行动、控制、验证与治理的责任主体 | 由应用按业务需要建设 |
| **LangChain** | 框架重点连接上下文、决策、行动与控制；任务契约、现实执行和最终治理由应用、**Provider** 与 **Runtime** 共同闭合 | **Middleware、State、Checkpoint、Streaming** 等通用接口，具体工作环境仍由应用组装 |
| **Deep Agents** | 在相似核心 **Loop** 上进一步承接上下文、行动、控制与部分治理机制；业务目标和最终验收仍属于应用 | 文件系统、上下文压缩、长期记忆、子 **Agent**、沙箱执行与人工确认等 |
| **Hermes Agent** | 进一步承接上下文、行动、控制、跨会话连续性与部分治理机制；业务事实和最终验收仍属于应用 | 工具运行、持久记忆、**Skills**、子 **Agent、Gateway** 与定时任务等 |

这两组比较不是新的成熟度排名，需要先排除三个误读：

1. **LLM 主导，不等于 LLM 接管系统责任**
    - 所谓“**LLM** 占据主导位”，只发生在**任务策略层**：==模型获得更大的拆解、选择路径、委派和持续行动空间==
    - ==**Runtime**、**权限事实**与**业务验收**仍由**确定性系统承接**==，模型决策范围扩大，不代表最终控制权发生转移

2. **Harness 预置更多能力，不等于拥有更高级的 Loop**
    - **Deep Agents** 仍使用与其他 **Agent Framework** 相同的核心工具调用 **Loop**，差异在于 **Harness** 已经组装了更多能力
    - **Hermes Agent** 同样拥有自己的 **Agent Loop**，并在其周围叠加学习、委派、持久化和调度机制
    - 它们的差异不在于“有 **Loop**”还是“超越 **Loop**”，而在于使用什么 **Loop**、允许模型在哪些边界内决策，以及==外围系统已经替应用承担多少责任==

3. **控制边界由软件定义，不等于固定 Workflow 加一个模型节点**
    - **LangChain** 与传统编程的连续性，在于应用仍负责注册工具、配置状态与 **Middleware**、提供运行环境并完成业务验收
    - 但在这些边界之内，`createAgent()` 的下一步路径确实由模型输出动态触发

沿六类责任观察，可以得到三个更稳定的比较结论：

- **运行骨架可以预置**：上下文、行动与控制可以沉淀为工作空间、工具系统、状态管理、调度和恢复机制
- **决策空间可以扩展**：==系统可以扩大模型的规划、选路与委派范围，**但仍要受任务契约和执行环境约束**==
- **业务责任不能外包**：业务目标、授权事实、成功标准和正式放行依赖具体应用，外围能力再丰富也不能自动接管

因此，预置能力更多通常意味着系统替应用组装了更完整的工作环境，并不意味着所有工程责任都已经转移，也不意味着 **Loop** 本身更高级

> 比较 **Agent** 系统，应依次观察控制结构、模型决策边界、六类责任分配，以及外围能力预置范围

#### 7.4、选型标准：比较组合收益与抽象摩擦

可以用一个非量化但实用的判断式：

```text
LangChain 的净收益
= 被消除的协议集成与循环实现重复
- 新增的抽象、调试与版本摩擦
```

- 单一 **Provider**、一次窄调用、强依赖最新专有参数时，原生 **SDK** 往往更直接
- 模型—工具反馈、结构化终态、状态、钩子和多模型适配共同出现时，**LangChain** 更容易回收成本
- 需要精细状态图、确定流程与动态路由混编、持久化恢复或人工介入时，下探 **LangGraph**
- 需要文件系统、自动上下文管理、子 **Agent** 和长期记忆等预置能力，或需要按需启用规划与 **Skills** 时，再评估 **Deep Agents**

选择标准不是哪个框架“更高级”，而是谁应该拥有控制权，以及团队愿意为多少默认行为承担理解成本

### 八、最终记忆模型

面对 **LangChain** 或任何新的 **Agent** 技术，先分开看两条轴

第一条是任务推进机制：

```text
LLM 提出动作 → Runtime 分派 → Tool 作用于环境 → 结果回填 → 继续或停止
```

这条 **Agent Loop** 可以由应用手写，也存在于 **LangChain、Deep Agents、Hermes Agent** 等不同系统中，它本身不能决定框架的生态位

第二条是工程责任分配：

```text
Provider / LLM          提供生成、判断与动作提议
LangChain               提供标准组件与可配置 Harness，内含预制 Loop
LangGraph Runtime       执行状态图，推进 Loop 或 Workflow
Tool / App Runtime      执行真实动作，承载资源与权限边界
Application / Product  定义任务、能力空间、验收与正式放行
```

在这些责任之间，**Message** 传递信息，**Tool Call** 传递动作提议，`ToolMessage` 传回环境反馈，**State** 保留运行事实，应用最终决定结果能否进入现实

这两条轴共同说明全文的中心判断：==**LangChain** 的价值是标准化接口，并为常见 **Agent** 控制过程提供可配置实现；它的边界是没有预先承担完整工作环境、长程上下文、任务协作、持续运行与产品验收==

由此也能理解它与 **Deep Agents、Hermes Agent** 的差异：不是谁拥有更高级的 **Loop**，而是谁预置了更多 **Harness** 与 **Runtime** 能力，以及模型被允许在多大的任务空间内行动

> ==**Loop** 描述任务怎样推进，**Harness** 描述系统替应用承担什么；**LangChain** 的位置由标准契约与责任边界决定，不由是否拥有 **Loop** 决定==

### 九、参考资料

本文产品定位于 2026-09-07 重新核验；源码行为基于本地实际安装的 `langchain@1.5.10`、`@langchain/core@1.2.9`、`@langchain/langgraph@1.4.13`、`@langchain/deepseek@1.1.11`

- [LangChain JavaScript 产品与组件定位](https://docs.langchain.com/oss/javascript/concepts/products)
- [LangChain JavaScript Overview](https://docs.langchain.com/oss/javascript/langchain/overview)
- [LangChain JavaScript Agents](https://docs.langchain.com/oss/javascript/langchain/agents)
- [LangChain JavaScript Component Architecture](https://docs.langchain.com/oss/javascript/langchain/component-architecture)
- [LangChain JavaScript Models](https://docs.langchain.com/oss/javascript/langchain/models)
- [LangChain JavaScript Messages](https://docs.langchain.com/oss/javascript/langchain/messages)
- [LangChain JavaScript Tools](https://docs.langchain.com/oss/javascript/langchain/tools)
- [LangChain JavaScript Structured Output](https://docs.langchain.com/oss/javascript/langchain/structured-output)
- [LangChain JavaScript Middleware](https://docs.langchain.com/oss/javascript/langchain/middleware/overview)
- [LangChain JavaScript Runtime](https://docs.langchain.com/oss/javascript/langchain/runtime)
- [LangChain JavaScript Short-term Memory](https://docs.langchain.com/oss/javascript/langchain/short-term-memory)
- [LangChain JavaScript Streaming](https://docs.langchain.com/oss/javascript/langchain/streaming)
- [LangChain JavaScript Event Streaming](https://docs.langchain.com/oss/javascript/langchain/event-streaming)
- [LangGraph JavaScript Overview](https://docs.langchain.com/oss/javascript/langgraph/overview)
- [Deep Agents JavaScript Overview](https://docs.langchain.com/oss/javascript/deepagents/overview)
- [Hermes Agent 官方文档](https://hermes-agent.nousresearch.com/docs/)
- [Hermes Agent Loop Internals](https://hermes-agent.nousresearch.com/docs/developer-guide/agent-loop/)
- [LangChain.js 1.5.10 ReactAgent Source](https://github.com/langchain-ai/langchainjs/blob/langchain%401.5.10/libs/langchain/src/agents/ReactAgent.ts)
- [LangChain.js 1.5.10 Structured Response Source](https://github.com/langchain-ai/langchainjs/blob/langchain%401.5.10/libs/langchain/src/agents/responses.ts)
- [LangChain.js 1.5.10 Agent State Source](https://github.com/langchain-ai/langchainjs/blob/langchain%401.5.10/libs/langchain/src/agents/annotation.ts)
- [LangGraph.js In-memory Checkpointer Source](https://github.com/langchain-ai/langgraphjs/blob/main/libs/checkpoint/src/memory.ts)
