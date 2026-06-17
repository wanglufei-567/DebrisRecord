## 从 Chat AI 到 Agent：围绕记忆、工具与控制循环的工程化演进

> 草稿版本：v0.4
> 精炼时间：2026-06-16
> 写作定位：面向工程师的 **Agent** 技术认知骨架，用演进线讲清 **Agent** 从何而来，用三条主干讲清 **Agent** 如何工作，用边界和护栏讲清 **Agent** 为什么难以工程化
> 阅读目标：读者能用 **Memory / Context**、**Tools**、**Control Loop** 复述 **Agent**，并能区分 **LLM**、**Agent**、**Tool**、**Runtime**、**Sandbox**、**Process**

### 一、问题起点：Chat AI 为什么还不是 Agent

**Chat AI** 的核心形态是用户输入一段话，模型返回一段话

这个模式解决了“如何让模型生成高质量文本”，但没有解决“如何让模型持续完成真实任务”

从工程视角看，**Chat AI** 的两个局限最关键：

- **==没有天然长期记忆==**：模型只能看到当前上下文窗口，**用户偏好**、**内部文档**、**外部新事实**都需要额外提供
- **==没有真实行动能力==**：模型可以建议读文件、改代码、查数据库、跑测试，但默认不能自己执行这些动作

所以早期 **Chat AI** 的真实工作流通常是：

```text
用户搬运上下文
  -> LLM 给出建议
  -> 用户执行操作
  -> 用户把结果贴回对话
  -> LLM 继续分析
```

这里最重要的认知点是：

> **Chat AI** 的问题不是不会回答，而是上下文和行动都依赖用户搬运

**Agent** 的出现，本质上是把这部分“人工运行时”工程化

### 二、演进路线：从回答系统到任务执行系统

==**Agent** 不是凭空出现的新物种，而是 **Chat AI** 在真实任务里不断补齐**上下文**、**工具**和**控制权**后形成的系统形态==

可以把演进线压成五层：

| 层级 | 形态 | 核心变化 | 关键边界 |
| --- | --- | --- | --- |
| 第一层 | **Chat** | 用户给上下文，模型生成文本 | 没有记忆，没有行动 |
| 第二层 | **RAG / Search-Augmented Chat** | 回答前检索外部知识 | 解决“模型不知道”，不解决“模型不能做” |
| 第三层 | **Tool-Using Assistant** | 模型可以调用工具 | 单次工具调用不等于持续任务执行 |
| 第四层 | **Agentic Workflow** | **LLM** 和工具进入预定义流程 | 适合路径稳定、节点需要智能判断的任务 |
| 第五层 | **Autonomous Agent Loop** | 模型根据工具反馈持续决定下一步 | 适合开放任务，但风险最高 |

这条演进线的核心不是“越自治越高级”，而是逐步补齐三件事：

- **Context**：模型在每一步应该知道什么
- **Action**：模型在每一步可以做什么
- **Control**：模型如何根据反馈继续、停止或请求确认

因此，成熟系统不会把所有任务都做成开放 **Agent Loop**

如果任务路径稳定，用 **workflow** 更可靠；只有任务路径无法提前写死、必须边做边观察时，才值得引入更开放的 **Agent**

### 三、最小定义：Agent = LLM + Memory + Tools + Control Loop

可以把 **Agent** 压缩成一个工程定义：

```text
Agent = LLM + Memory / Context + Tools + Control Loop
```

其中：

- **LLM** 是决策核心，负责理解目标、生成推理、选择动作、组织输出
- **Memory / Context** 解决“模型应该知道什么”
- **Tools** 解决“模型可以做什么”
- **Control Loop** 解决“模型如何围绕目标持续推进”

典型控制流是：

```text
User Goal
  -> Agent Runtime
  -> Retrieve Memory / Context
  -> LLM decides next action
  -> Tool execution in Runtime / Sandbox
  -> Observation
  -> State / Memory update
  -> Next LLM step or Final Answer
```

这里最容易误解的是：**Memory**、**Tools**、**Control Loop** 不是三个并列插件，而是一个闭环

- **Memory** 决定 **LLM** 的输入
- **Tools** 把模型决策变成外部动作
- **Observation** 把工具结果带回系统
- **Control Loop** 决定继续、停止、回滚、请求人工确认，还是更新计划

一句话概括：

> **Agent** 不是单次模型调用，而是带上下文、带工具、带反馈循环的任务执行系统

### 四、三条主干：Agent 工程化的核心骨架

#### 4.1、Memory / Context：不是记住更多，而是让正确的信息进入上下文

**Memory** 不是聊天记录的堆叠，而是上下文工程

一个可用的 **Agent** 需要区分多类上下文：

- **稳定规则**：**system prompt**、**developer prompt**、安全策略、角色边界
- **用户偏好**：表达风格、技术栈偏好、禁忌操作、长期目标
- **项目记忆**：仓库结构、架构约定、部署路径、历史排障结论
- **会话状态**：当前目标、计划、已完成步骤、阻塞点
- **外部检索**：网页、文档、数据库、搜索结果、向量库片段
- **工具观察**：命令输出、测试结果、浏览器页面、**API** 返回值

------

**Memory** 的关键工程问题可以压成四个：

- **写入**：什么值得长期保留，什么只是临时状态
- **检索**：什么时候读出来，读多少，按什么任务边界读
- **信任**：不同来源不能处在同一信任层级
- **时效**：旧记忆不是当前事实，涉及版本和外部世界时必须核验

所以 **Memory** 的目标不是“记住更多”，而是：

> ==让正确的信息，以正确的信任级别，在正确的时刻进入模型上下文==

#### 4.2、Tools：不是函数调用，而是受控的外部能力接口

**Tool** 让模型第一次能影响外部世界

它可以是读文件、跑测试、查数据库、打开浏览器、调用 **API**、访问 **MCP Server**，也可以是业务系统里的 **PR**、**Issue**、**CI**、审批和发布入口

但 **Tool** 一旦有副作用，**Agent** 就不再只是文本生成系统，而是进入真实软件系统

**Tools** 的关键工程问题可以压成四个：

- **契约**：工具名称、描述、参数 **schema**、返回结构、错误语义必须清晰
- **选择**：工具不是越多越好，过多工具会增加选择噪声和攻击面
- **校验**：模型生成的参数不能直接信任，必须做结构校验、路径限制、超时和输入净化
- **权限**：读、写、删、部署、发消息、改数据库不是同一类风险，高风险动作需要审批和审计

所以 **Tools** 的目标是：

> ==给模型行动能力，但不把系统控制权裸露给模型==

#### 4.3、Control Loop：不是简单循环，而是在反馈中受控推进

没有控制循环，系统最多只是增强型 **Chat**

典型 **Agent Loop** 是：

```text
接收目标
  -> 组织上下文
  -> 调用 LLM 判断下一步
  -> 执行工具
  -> 返回 observation
  -> 更新状态和计划
  -> 继续、停止或请求人工确认
```

**Control Loop** 的关键工程问题可以压成五个：

- **停止条件**：最大轮数、最大时间、最大成本、失败阈值和人工中断点
- **状态管理**：当前目标、子任务、依赖关系、已完成步骤、阻塞点
- **路径选择**：能写成稳定流程的任务，不要硬做成开放 **Agent Loop**
- **人工介入**：权限边界、业务决策、破坏性操作和不可逆动作前需要暂停
- **可观察性**：计划更新、工具请求、审批等待、工具完成、失败重试都要可追踪

所以 **Control Loop** 的目标是：

> ==用工程系统约束模型在环境反馈中前进==

### 五、关键边界：不要把模型、工具和运行环境混在一起

很多 **Agent** 讨论混乱，是因为把相邻概念混成一团

可以先记住这组边界：

| 概念 | 是什么 | 不是什么 |
| --- | --- | --- |
| **LLM** | 生成推理和决策建议的模型 | 不是执行环境，不直接读写文件 |
| **Agent** | 围绕目标组织上下文、调用工具、观察反馈并持续推进的软件系统 | 不是单个模型调用，也不是单个工具 |
| **Tool** | 暴露给模型使用的外部能力接口 | 不是任意代码入口，也不等于完整业务系统 |
| **Runtime** | 工具实际运行的环境 | 不是安全边界本身 |
| **Sandbox** | 对 **Runtime** 的权限和资源隔离边界 | 不是新的智能能力 |
| **Process** | 操作系统里的运行中程序实例 | 不是 **Agent** 本身 |

控制关系可以简化为：

```text
User
  -> Agent
  -> LLM decides
  -> Agent selects Tool
  -> Tool runs in Runtime
  -> Sandbox limits Runtime
  -> Process executes concrete work
  -> Observation returns to Agent
```

这组边界里最重要的是：

- **Agent** 使用 **LLM**，但 **Agent** 不等于 **LLM**
- **Agent** 可以使用 **RAG**，但 **Agent** 不等于 **RAG**
- **Agent** 可以调用 **Tool**，但单次 **Tool Calling** 不等于 **Agent**
- **Runtime** 提供执行环境，**Sandbox** 限制执行边界
- **Process** 是具体运行中的程序，**Agent** 是任务控制系统

### 六、工程护栏：Agent 的风险来自错误被循环放大

**Agent** 的风险不是只有“模型答错”

当模型拥有 **Tools** 和 **Control Loop**，一次错误判断可能被工具执行，并在多轮循环中持续放大

可以按三条主干理解护栏：

| 主干 | 主要风险 | 必要护栏 |
| --- | --- | --- |
| **Memory / Context** | 旧信息、恶意信息、敏感信息进入上下文 | 信任分层、来源标注、过期检测、敏感信息过滤 |
| **Tools** | 模型误判变成真实副作用 | **schema** 校验、权限矩阵、审批流、路径和网络限制 |
| **Control Loop** | 错误路径被多轮放大 | 最大轮数、成本预算、人工检查点、**trace**、回放和评估 |

这里的核心认知是：

> **Agent** 的工程难点不是让模型更自由，而是让模型在受控边界内行动

权限、沙盒、审批、审计、评估、回滚不是附属功能，而是 **Agent** 进入真实系统后的必要边界

### 七、适用判断：什么时候该用 Agent

**Agent** 适合开放、多步骤、需要工具反馈的任务

典型场景包括：

- 代码修改与验证
- 多源资料调研
- 数据分析和报表生成
- 工程排障
- 文档迁移和结构化整理
- **PR review** 和 **CI** 修复

这些任务的共同点是：步骤不完全确定，需要边做边观察结果

不适合直接做成开放 **Agent** 的场景包括：

- 目标不清的无限自治
- 高风险不可逆动作的完全自动化
- 事实时效性强但没有检索和核验能力
- 工具契约很差、权限边界不明的环境
- 做完动作看不到结果、无法形成反馈闭环的任务

判断标准可以压成一句：

> 任务路径不确定、需要边行动边观察，才值得引入 **Agent Loop**

### 八、最终复述框架

读完这篇文章，最值得记住的不是一堆术语，而是下面这组骨架

```text
Chat AI 是回答系统
Agent 是任务执行系统

Memory 决定输入
Tools 连接外部能力
Control Loop 负责推进目标

LLM 负责生成决策
Agent 负责接管任务控制权
Runtime / Process 负责实际执行
Sandbox 负责限制执行边界
```

可以给 **Agent** 一个更工程化的定义：

> ==**Agent** 是一个以 **LLM** 为决策核心，以 **Memory / Context** 提供任务相关信息，以 **Tools** 连接外部能力，并通过 **Control Loop** 在环境反馈中持续推进目标的软件系统==

这个定义强调四点：

- **LLM** 是核心，但不是全部
- **Memory** 不是聊天记录，而是上下文工程
- **Tool** 不是函数调用，而是带权限和副作用治理的能力接口
- **Control Loop** 不是简单 `while` 循环，而是带状态、观察、停止条件和人工协作的执行框架

最后再压成一句话：

> ==**Agent** 的本质，是把语言模型接入真实软件系统，并用工程边界约束它在反馈中行动==

### 参考资料

- [**OpenAI Agents SDK** 文档](https://developers.openai.com/api/docs/guides/agents)：2026-06-15 核验，文档将 **agents** 描述为会规划、调用工具、跨专家协作，并保持足够状态来完成多步骤工作的应用
- [**OpenAI Agents SDK Guardrails**](https://openai.github.io/openai-agents-python/guardrails/)：2026-06-15 核验，说明输入、输出、工具级 **guardrails** 的执行边界
- [**Anthropic: Building Effective AI Agents**](https://www.anthropic.com/engineering/building-effective-agents)：2026-06-15 核验，区分 **workflows** 与 **agents**，并强调复杂度、成本和延迟取舍
- [**Anthropic: Writing effective tools for AI agents**](https://www.anthropic.com/engineering/writing-tools-for-agents)：2026-06-15 核验，强调面向 **Agent** 设计工具契约和评估工具效果
- [**Model Context Protocol Specification**](https://modelcontextprotocol.io/specification/latest)：2026-06-15 核验，`latest` 当时跳转到 `2025-11-25`，规范区分 **Resources**、**Prompts**、**Tools**，并强调用户同意、隐私和工具安全
- [**OWASP Top 10 for Large Language Model Applications**](https://owasp.org/www-project-top-10-for-large-language-model-applications/)：2026-06-15 核验，覆盖 **Prompt Injection**、敏感信息泄露、过度代理等 **LLM** 应用风险
- [**OWASP MCP Top 10**](https://owasp.org/www-project-mcp-top-10/)：2026-06-15 核验，覆盖 **MCP** 场景中的权限膨胀、工具污染、命令注入、审计缺失和上下文过度共享等风险
