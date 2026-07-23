## **Agent** 开发的四种主流路线

### 一、前言

#### 1.1、Agent 开发的三个主干

**Agent** 开发早期常被理解成“给大模型接几个工具，让它自己决定下一步”，但这类做法存在以下问题：

- 任务不可复现
- 工具调用不可控
- 失败难定位
- 权限边界不清

目前 **Agent** 的理解是

- **LLM** 负责推理、生成、规划和局部决策
- 程序负责状态、权限、工具、流程和边界
- **Agent 框架或 Runtime** 负责把两者组织成可运行系统

定义一种 **Agent** 开发路线，要看它在 **Agent** 三个主干上的支持程度：

**Agent 开发**中的三个主干：

- ==**Memory / Context**：解决 **LLM** 没有长期记忆、私有上下文和实时信息的问题==
- ==**Tool / Action**：解决 **LLM** 没有外部行为能力的问题，让模型能查询、计算、写入、执行和影响外部系统==
- ==**Control Loop / Harness**：把目标、上下文、工具调用、观察反馈组织成可持续执行的闭环，并控制停止、恢复、审批和安全边界==

不同 **Agent 开发路线**的本质差异，不是有没有这些能力，而是==这些能力由谁设计、谁拥有控制权、谁承担工程复杂度==

#### 1.2、四种路线总览

现在常见的 **Agent** 开发方案可以分成四类：

| 方案 | 核心思路 | 代表 |
|---|---|---|
| **纯原生开发** | 直接调用模型 **API**，自己写 **Control Loop / Harness**、**Tool Executor**、**Context / Memory** 和权限 | **Responses API** / **Chat Completions** + 自研代码 |
| **模型厂商 Agent SDK** | 使用模型厂商提供的 **Agent SDK**，让 **SDK** 管理工具调用、**Handoff**、会话和 **Trace** | **OpenAI Agents SDK** 等 |
| **代码编排框架** | 用代码显式定义 **Workflow**、**State**、**Node**、**Edge**、人类审批和恢复策略 | **LangChain / LangGraph** |
| **Runtime 扩展开发** | 基于一个已经能运行的 **Agent Runtime** 做扩展和定制 | **Hermes** |

这四种路线不是线性升级关系，也不是谁替代谁，它们对应的是不同的控制权位置

### 二、纯原生开发：最大控制权，最大工程成本

纯原生开发就是不依赖 **Agent** 框架，直接用模型 **API** 构建 **Agent**

典型结构是：

```text
用户请求
  → 业务服务
  → 构造 Messages
  → 调用 LLM
  → 解析 Tool Calls
  → 执行工具
  → 把工具结果写回上下文
  → 再次调用 LLM
  → 输出最终结果
```

纯原生开发，所有控制权都在开发者手里，需要自己设计：

- **Memory / Context**：会话存储、长期记忆、实时信息、检索、压缩、遗忘、跨用户隔离
- **Tool / Action**：工具执行、权限、审批、错误恢复，以及外部系统写入和动作执行
- **Control Loop / Harness**：目标拆解、上下文装配、停止条件、失败重试、工具执行结果回传、观察反馈、人工介入
- **Observability**：日志、**Trace**、成本统计、失败复盘
- **Product Layer**：用户体系、前端入口、**Bot** 接入、部署、计费、审计

优点是完全可控，适合深度嵌入公司业务系统；代价也最明显：要自己实现 **Agent Runtime**

------

纯原生方案适合：

- 公司已有成熟后端体系
- **Agent** 只是业务系统的一部分
- 对权限、审计、数据隔离要求极高
- 不希望被任何框架抽象绑定

它不适合：

- 快速验证想法
- 小团队从零搭建
- 需要大量现成工具生态

一句话：纯原生开发适合强工程团队做深度产品化

### 三、模型厂商 **Agent SDK**：用厂商 **SDK** 托管一部分 **Control Loop / Harness**

**Agent SDK**是模型厂商围绕自家模型、工具协议和安全能力提供的一层 **Agent** 应用 **SDK**，典型代表是 **OpenAI Agents SDK**

典型结构是：

```text
用户请求
  → 业务服务
  → Runner.run(agent, input)
  → SDK 调模型
  → 模型选择工具或 Handoff
  → SDK 执行工具调用并回传结果
  → SDK 继续推进 Run
  → 返回 Final Output / Run State / Trace
```

它在三大主干能力上的边界：

| 主干 | **SDK** 提供什么 | 开发者仍要设计什么 |
|---|---|---|
| **Memory / Context** | **Session**、**Conversation State**、**Previous Response**、向量库 / **File Search** 等上下文能力 | 记忆策略、用户画像、私有业务上下文、实时信息接入、记忆压缩和遗忘 |
| **Tool / Action** | **Function Tools**、**Hosted Tools**、**MCP**、**Handoffs**、**Tool Execution Config**、**Guardrails** | 具体业务工具、外部动作、权限、鉴权、幂等、风险操作审批 |
| **Control Loop / Harness** | **Runner** 管理多轮调用、工具执行、**Handoff**、**Streaming**、**Run Result** | 产品外层流程、失败策略、用户体验、跨系统恢复、人工介入边界 |

**Agent SDK** 的关键价值是降低“自己写 **Control Loop / Harness**”的成本

它把最常见的 **Agent** 运行逻辑封装掉：

- **Agent** 定义
- **Runner** 执行
- **Tool Call** 解析和执行
- **Handoff**
- **Guardrails**
- **Streaming**
- **Session / Conversation** 管理
- **Tracing**

但它没有直接完成完整产品层 **Agent** 系统，尤其在 **Memory / Context** 上

**Agent SDK** 可以保存会话和接入检索上下文，但以下关键内容仍然是开发者需要自己的设计问题👇：

- 哪些内容应该成为长期记忆
- 哪些私有业务上下文应该注入
- 实时信息从哪里来
- 何时写入
- 如何跨用户隔离
- 如何在下一次任务中注入

------

**Agent SDK** 适合：

- 主要使用某家模型厂商生态
- 不想从零写 **Control Loop / Harness**，但仍想把 **Agent** 嵌入自己的后端服务

不太适合：

- 强多模型中立的平台
- 复杂审批流和可恢复业务流程
- 长期个人助手或跨会话自我改进型 **Agent**
- 对 **Memory**、**Runtime**、**Sandbox** 有完全自定义要求的场景

一句话：**Agent SDK** 适合“快速构建基于某家模型生态的 **Agent** 应用”，但不是完整 **Runtime**，也不是显式 **Workflow** 编排框架

### 四、**LangChain / LangGraph**：代码层构建可控 **Agentic Workflow**

**LangChain** 更像传统编程里的开发框架；它提供模型、消息、工具、**Retriever**、**Agent**、**Middleware** 等抽象层，但如果讨论生产级 **Agent**，重点通常不只是 **LangChain**，而是 **LangGraph**

**LangGraph** 的核心价值是把 **Agent** 和 **Workflow** 放进一个显式状态图里

**LangChain / LangGraph** 属于代码层 **Agent** 编排框架，而不是一个已经运行起来的 **Agent** 产品

它提供的是一组可编程抽象：

- 用 **Node** 表示模型调用、工具执行、人工审批、规则判断、数据写入
- 用 **Edge** 和 **Conditional Edge** 控制下一步去哪里
- 用 **State / Reducer** 管理流程状态
- 用 **Checkpoint** 保存每一步执行状态
- 用 **Interrupt / Resume** 支持 **Human-in-the-Loop**
- 用 **Store** 保存跨 **Thread** 的长期信息 

官方文档也明确区分 **Agentic Workflow** 和 **纯 Agent**：

- **Workflow**：路径预先由代码定义
- **Agent**：流程和工具使用由模型动态决定

这非常关键，因为==生产系统里很少会完全放任模型自由行动==，更常见的是：==外层 **Workflow** 控制边界，局部节点交给 **Agent** 自主决策==

例如企业客服 **Agent**：

```text
用户问题
  → 分类节点
  → 退款流程 / 技术支持流程 / 人工升级
  → 局部 Agent 查询订单、知识库、日志
  → 输出前做校验
```

#### 4.1、**LangGraph** 的 **Memory / Context** 边界

**LangGraph** 不是没有 **Memory / Context** 能力，但它没有 **Hermes** 那种“**Agent** 自带、自动注入、跨会话持续维护”的产品化==长期记忆系统==

**LangGraph** 官方文档说它有 **Built-In Persistence**，会把 **Graph State** 保存为 **Checkpoints**；这支持 **Human-in-the-Loop**、**Conversation Memory**、**Time Travel** 和 **Fault-Tolerant Execution**

这类能力更准确地说是“状态持久化”和“记忆 / 上下文基础设施”，而不是“现成 **Agent** 记忆系统”

**LangGraph** 的 **Memory / Context** 可以拆成三层：

| 层级 | 作用 | 是否等于 **Hermes** 式长期记忆 |
|---|---|---|
| **Checkpoint** / **Thread State** | 保存某条会话或某次 **Graph** 执行的状态，支持恢复、回放、审批 | 不是 |
| **Store** | 跨 **Thread** 保存用户信息、长期事实、共享知识 | 只是存储接口，策略仍要自己设计 |
| **Context Assembly** | 由业务代码决定把哪些私有上下文、实时信息、检索结果放进 **Prompt** | 不是，装配策略仍由开发者负责 |

**LangGraph** 提供了 **Memory / Context** 系统的底座，可以构建记忆和上下文系统，但开发者要自己决定：

- 哪些内容值得写入 **Memory**
- **Memory** 按用户、项目、任务还是组织划分 **Namespace**
- 哪些私有上下文应该进入当前任务
- 哪些实时信息需要通过检索、**API** 或工具获取
- 何时检索 **Memory**
- 检索结果如何注入 **Prompt**
- 旧记忆如何压缩、合并、删除
- **Memory** 如何避免污染和越权

#### 4.2、**LangGraph** 的 **Tool / Action** 边界

**LangGraph** 可以把工具调用放在 **Agent Node** 里，也可以把工具执行显式建成 **Graph Node**

这给开发者很强的控制权：

- 让模型在某个局部节点自由选择工具
- 规定某些工具必须经过人工审批节点
- 把高风险工具和低风险工具放到不同分支
- 让工具执行结果进入 **State**，再由后续节点校验

但具体工具本身、外部动作的副作用边界、权限模型、业务鉴权、幂等、超时、审计，仍然是应用代码负责

#### 4.3、**LangGraph** 的 **Control Loop / Harness** 边界

**LangGraph** 的 **Control Loop / Harness** 不是一个封闭黑盒，而是由开发者自己设计，把目标、上下文、工具、模型输出、工具观察结果、状态更新和停止条件组织成闭环

开发者可以设计：

- 线性流程
- 分支流程
- 并行流程
- **Orchestrator-Worker**
- **Evaluator-Optimizer**
- 人工审批中断
- 失败后恢复

------

**LangGraph** 适合：

- 多步骤审批型 **Agent**
- 需要可观测性、测试、状态持久化的系统

它的限制是：

- 学习曲线比直接 **API** 高
- **Graph** / **State** 设计本身有成本
- 记忆、私有上下文和实时信息装配策略仍要自己做
- 仍然需要自己做用户体系、权限、前端、部署、审计和成本治理
- 如果业务很简单，可能显得重

一句话：**LangChain / LangGraph** 适合“开发一个属于公司的 **Agent** 产品后端”，尤其适合复杂流程、人工审批和可恢复执行

### 五、基于现成 **Agent Runtime** 做扩展

**LangGraph** 需要开发者自己写 **Agent Workflow** 的代码编排框架

但基于一个已经产品化的 **Agent Runtime** 进行拓展也可以开发出一个新的 **Agent**，典型代表是 **Hermes Agent**

 **Hermes Agent** 直接给了一个已经能运行、能接工具、能记忆、能调度任务、能接消息入口的 ==**Agent** 操作环境==

它已经内置：

- **CLI / TUI / Dashboard**
- 模型 **Provider** 配置
- **Session / Memory**
- **Tools / Toolsets**
- **Skills**
- **MCP** 接入
- **Messaging Gateway**
- **Cron**
- 日志、**Doctor**、配置管理
- 多平台消息入口

所以基于 **Hermes** 做 **Agent** 定制，更准确地说，是在一个已有 **Agent Runtime** 上做扩展和定制，而不是从代码层重新构建一套自己的 **Agent** 编排系统

通过服务调用 **Hermes**，让它接收任务、执行工具、返回结果，这更像是在集成一个 **Agent** 产品，或者给现成 **Agent** 包一层 **Gateway**

#### 5.1、**Hermes** 的 **Memory / Context** 边界

**Hermes** 官方文档中说明其具备 **Bounded, Curated Memory That Persists Across Sessions**，由 `MEMORY.md` 和 `USER.md` 组成，存放在 `~/.hermes/memories/`，并在 **Session Start** 注入 **System Prompt**

**Agent** 可以通过 `Memory` **Tool** 自己 **Add / Replace / Remove Entries**

这意味着 **Hermes** 的 **Memory / Context** 不是“开发者可以用框架自己实现”，而是：

- 已经定义了 **Memory** 文件、**Memory** 注入方式和**Memory Tool**
- **Agent** 默认知道自己可以维护记忆
- **Session Search** 可以搜索历史会话
- **External Memory Providers** 可以扩展更深层的长期记忆

 **Hermes** 的 **Memory** 更接近“==**Agent** 自我维护的长期工作记忆==”，同时 **Runtime** 会==把这些记忆作为私有上下文的一部分注入 **Agent** 工作过程==

而 **LangGraph** 的 **Memory / Context** 更接近“业务开发者可编程的状态持久化、存储接口和上下文装配策略”

#### 5.2、**Hermes** 的 **Tool / Action** 边界

**Hermes** 内置了大量 **Toolsets**，包括 **Web**、**Terminal**、**File**、**Browser**、**Memory**、**Session Search**、**Cronjob**、**Delegation**、**MCP** 等

开发者主要做的是：

- 开启或关闭 **Toolsets**
- 配置工具后端，例如本地、**Docker**、**SSH**、云沙箱
- 通过 **MCP** 接入外部服务
- 写 **Skill** 固化流程
- 写 **Plugin** / **Gateway** 做更深扩展

#### 5.3、**Hermes** 的 **Control Loop / Harness** 边界

**Hermes** 的 **Control Loop / Harness** 是内置的

**Hermes** 这个 **Agent Runtime** 自己接收目标、装配上下文、调用工具、观察反馈、更新记忆、执行 **Skill**、调度 **Cron**、通过消息入口交互

典型路径是：

```text
配置模型
  → 定义 SOUL / 行为边界
  → 写 Skill 固化工作流
  → 接 MCP 扩展工具
  → 写 Plugin 做深度扩展
  → 用 Gateway 接入微信、QQ、Telegram 等入口
```

**Hermes** “像框架”的地方在于它有框架化扩展面：

- **Skill** 可以把可复用工作流沉淀成过程记忆
- **MCP** 可以把外部工具和服务接入 **Runtime**
- **Plugin** / **Gateway** 可以扩展入口、平台和更深层能力
- **Memory / Context**、**Session**、**Cron** 可以支持长期运行和跨会话任务

但它更适合被称为：

- **Agent Runtime**
- **Productized Agent**
- 可扩展 **Agent** 操作环境
- 带框架化扩展能力的现成 **Agent**

不应把它和 **LangGraph** 这种通用 **Agent** 编排框架混成同一类

------

这种方案适合：

- 个人长期助手
- 团队内部自动化 **Agent**
- 接入聊天应用的 **Bot Agent**
- 用 **Skills** / **MCP** 快速扩展能力
- 不想从零做 **CLI**、**Gateway**、**Memory / Context**、**Tool / Action** **Runtime** 的场景

它不太适合：

- 面向大量外部客户的 **SaaS Agent**
- 强多租户产品
- 需要完全自定义主循环的系统
- 需要深度嵌入公司业务后端的 **Agent** 平台
- 对 **UI**、计费、权限、审计有完整产品化要求的场景

一句话：**Hermes** 适合“定制一个现成 **Agent** 系统”，而不是替代代码框架开发商业产品后端

### 六、关键技术节点支持矩阵

这个矩阵是理解不同路线的重点

| 技术节点 | 纯原生开发 | 模型厂商 **Agent SDK** | **LangChain / LangGraph** | **Hermes** |
|---|---|---|---|---|
| 定位 | 自己写 **Agent Runtime** | 使用厂商 **SDK** 构建 **Agent** 应用 | 用代码编排 **Agentic Workflow** | 扩展现成 **Agent Runtime** / **Agent** 产品 |
| **Memory / Context** 基础能力 | 自己实现 | 提供 **Session / Conversation** / **Retrieval** 等能力 | 提供 **Checkpoint** / **Store** / **Persistence** | 内建 MEMORY.md / USER.md / **Session Search** / **Memory Providers** |
| 私有上下文与实时信息 | 自己设计接入和注入策略 | **SDK** 可接检索和工具，具体上下文策略仍要自己做 | 通过 **Graph State**、**Store**、**Retriever**、**Tool Node** 自己组织 | **Runtime** 有 **Memory**、**Session Search** 和工具入口，外部 **Context** 可继续扩展 |
| 记忆与上下文策略 | 自己设计 | 主要自己设计 | 自己设计 | **Runtime** 已有默认策略，可扩展 |
| **Tool / Action Schema** | 自己定义 | **SDK** 提供 **Function Tools** / **Hosted Tools** / **MCP** 等接口 | 代码定义工具或工具节点 | 内置 **Toolsets**，可通过 **MCP** / **Plugin** 扩展 |
| **Tool / Action Executor** | 自己实现 | **SDK** 执行 **Function Tools**，开发者提供业务函数 | **Graph Node** 或 **Agent Node** 执行，开发者控制 | **Runtime** 内置执行器和工具后端 |
| 权限与审批 | 自己实现 | **Guardrails** 可辅助，业务权限和人工审批仍要自己做 | 可显式建成人工审批节点 | **Runtime** 有工具开关和后端配置，产品级治理仍受 **Runtime** 约束 |
| **Control Loop / Harness** | 自己写 | **Runner** 管理 **Turns**、**Tools**、**Handoffs**、**Sessions** | **Graph** 控制流程，局部节点可 **Agentic** | **Hermes Runtime** 内置 |
| 人类参与 | 自己设计 | 可通过 **Guardrails** / **Approval** / **App Layer** 实现 | 强项，**Interrupt / Resume** / **Checkpoint** 很适合 | 更偏操作时交互和运行时确认 |
| 状态恢复 | 自己实现 | 有 **Run State** / **Session / Conversation** 能力，复杂恢复仍要设计 | 强项，**Checkpoint** / **Replay** / **Resume** | **Runtime** 管理 **Session** 和长期上下文 |
| 可观测性 | 自己做 | **Tracing** 是 **SDK** 重点能力 | 常与 **LangSmith** / 自建 **Tracing** 结合 | **Runtime** 日志、**Doctor**、**Session** 历史 |
| 产品化自由度 | 最高 | 高，但受厂商 **SDK** 语义影响 | 高 | 中等 |
| 上手速度 | 慢 | 快 | 中等 | 快 |
| 适合团队 | 强后端 / 平台团队 | 使用单一模型生态的产品团队 | 企业产品研发团队 | 个人 / 内部工具团队 |

### 七、围绕三大主干重新理解选型

#### 7.1、**Memory / Context**：谁补足模型缺失的信息

| 路线 | **Memory / Context** 判断 |
|---|---|
| 纯原生 | 没有默认 **Memory / Context**，一切自己做 |
| 模型厂商 **Agent SDK** | 有会话和上下文能力，但长期记忆、私有上下文和实时信息策略主要自己做 |
| **LangGraph** | 有 **Persistence** / **Checkpoint** / **Store**，但不是产品化长期记忆系统，**Context** 装配也要自己设计 |
| **Hermes** | 有 **Runtime** 内建长期记忆，**Agent** 默认围绕 **Memory** 工作，并可通过工具和 **Session Search** 补上下文 |

最容易误解的是 **LangGraph**：它有 **Memory** 能力，但不是 **Hermes** 那样的内建记忆系统

**LangGraph** 更像是说：“我给你 **Checkpoint**、**Store** 和恢复机制，你自己设计记忆和上下文系统”

**Hermes** 更像是说：“我这个 **Agent Runtime** 本身就带长期记忆，并会把它作为 **Agent** 行为和上下文注入的一部分”

#### 7.2、**Tool / Action**：谁负责外部行为能力

| 路线 | **Tool / Action** 判断 |
|---|---|
| 纯原生 | 工具协议、执行器、权限、错误恢复和外部动作副作用全部自己做 |
| 模型厂商 **Agent SDK** | **SDK** 管理工具调用循环，开发者负责具体业务工具、外部动作和权限 |
| **LangGraph** | 工具和外部动作可以成为显式节点，适合审批、分支、审计 |
| **Hermes** | 工具和外部动作是 **Runtime** 能力，开箱有 **Toolsets** 和 **MCP** 扩展 |

- 只是查天气、查知识库、调内部 **API**，模型厂商 **SDK** 已经足够

- 会退款、删数据、改配置、跑命令，**LangGraph** 的显式审批和状态图更有优势

- 主要是个人或内部自动化，例如文件、终端、浏览器、消息平台，**Hermes** 的 **Runtime** 入口更省事


#### 7.3、**Control Loop / Harness**：谁组织可持续执行闭环

| 路线 | **Control Loop / Harness** 判断 |
|---|---|
| 纯原生 | 你自己写 **While Loop**、**Harness**、停止条件、最大步数、失败策略 |
| 模型厂商 **Agent SDK** | **Runner** 托管常见 **Control Loop**，适合快速应用化 |
| **LangGraph** | **Workflow Graph** 显式控制 **Harness**，适合复杂流程 |
| **Hermes** | **Runtime** 内建 **Harness**，适合长期运行的现成 **Agent** |

- 最大自由度，选纯原生


- 要少写 **Control Loop / Harness**，选模型厂商 **Agent SDK**


- 要流程可控、可审计、可恢复，选 **LangGraph**


- 要一个长期工作的现成 **Agent**，再通过 **Skill** / **MCP** / **Plugin** 扩展，选 **Hermes**


### 参考资料

- [OpenAI Agents SDK](https://developers.openai.com/api/docs/guides/agents)
- [OpenAI Agents SDK Python: Agents](https://openai.github.io/openai-agents-python/agents/)
- [OpenAI Agents SDK Python: Running agents](https://openai.github.io/openai-agents-python/running_agents/)
- [LangGraph Workflows and Agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents)
- [LangGraph Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
- [LangChain Agents](https://docs.langchain.com/oss/python/langchain/agents)
- [Hermes Agent Documentation](https://hermes-agent.nousresearch.com/docs/)
- [Hermes Persistent Memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory/)
- [Hermes Tools & Toolsets](https://hermes-agent.nousresearch.com/docs/user-guide/features/tools/)
- [Hermes Creating Skills](https://hermes-agent.nousresearch.com/docs/developer-guide/creating-skills)
- [A Practical Guide to Building Agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)
