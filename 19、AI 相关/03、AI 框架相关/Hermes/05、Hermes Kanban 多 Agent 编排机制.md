## **Hermes Kanban** 多 **Agent** 编排机制

### 一、前言

**Hermes Kanban** 通俗定义：

> ==**Hermes** 中编排多个 **Agent** 在后台分工干活的机制==

**Kanban** 的核心作用：

- 不是让当前 **Chat** 里的 **Agent** 一口气把所有事情做完，而是把一个复杂任务拆成多个后台任务
- 每个任务指定一个 **Profile** 身份模板，**Runtime** 据此启动一次 **Worker** 执行
- 执行过程、状态、评论、结果都持久化保存
- 后续任务可以基于前置任务结果继续执行

更严谨的定义：

> **Hermes Kanban** 是 **Hermes Runtime** 中持久化、调度和恢复后台任务的协作基础设施，**Agent**、用户或自动化通过工具、命令或界面显式创建 **Task**，再由 **Dispatcher** 把任务交给指定 **Profile** 对应的 **Worker** 执行

这里必须区分创建控制权和运行时职责：

```text
Agent / 用户 / 自动化
  -> 决定是否创建 Task，并提供任务内容
  -> Kanban 持久化 Task、依赖和执行记录
  -> Dispatcher 在条件满足时启动 Worker Process
```

因此，复杂意图不会仅因为出现在 **Chat** 中就自动变成 **Kanban Task**，必须有明确调用者执行创建动作

两层定义：

| 层次 | 定义 |
|---|---|
| 通俗定义 | **Kanban** 是多 **Agent** 后台编排机制 |
| 严谨定义 | **Kanban** 是由持久化任务与状态层、依赖关系和 **Dispatcher** 调度循环共同组成的运行时子系统 |

后文统一使用“技术方案调研与迁移计划”作为主例子，示例输入：

```text
调研三个候选技术库，结合当前代码评估迁移成本，输出推荐结论和迁移计划
```

这个目标同时需要外部资料、当前代码、独立风险判断和最终校验，如果全部塞进当前上下文，证据容易互相污染，失败后难以局部恢复，也很难审计每一步由谁完成

不用 **Kanban** 时，当前 **Agent** 需要在当前对话里马上完成这件事

使用 **Kanban** 时，流程变成：

```text
用户在 Chat 里提出任务
  -> Agent 决定调用 kanban_create
     或用户通过 CLI / Slash Command / Dashboard 创建
  -> Task 落到当前 Board
  -> Task 带上 tenant、workspace、assignee profile 等元数据
  -> Dispatcher 发现可执行 Task
  -> Runtime 基于 assignee profile 启动 Worker Process
  -> Worker 读取 Task body、comments、父任务结果和附件
  -> Worker 调用工具、读写 workspace、产出结果
  -> Worker 通过 kanban_complete 提交结果
     summary / metadata 写入 Run，简短 result 写入 Task，artifacts 按 Workspace 类型保存或登记
  -> Runtime 记录状态变化 Event，Comment 继续承载人工或 Agent 协作信息
  -> 如果存在 parent link，下游 Task 在依赖完成后读取父任务交接结果
  -> 如果使用 Swarm，这组 Task 形成 root / blackboard -> workers -> verifier -> synthesizer 的任务图
```

先不要逐个记忆所有对象，可以先压成六层：

| 层次 | 核心对象 | 回答的问题 |
|---|---|---|
| 意图入口 | **Chat**、工具、**CLI**、**Dashboard** | 谁决定创建任务 |
| 任务真值 | **Task**、**Link** | 做什么，依赖什么 |
| 执行身份 | **Profile**、**Worker Process** | 谁以什么身份执行 |
| 调度与范围 | **Board**、**Dispatcher**、**Tenant**、**Workspace** | 在哪个范围、什么条件下执行 |
| 交接与证据 | **Run**、**Comment**、**Event**、**Artifact** | 执行结果写到哪里，谁继续消费 |
| 可选拓扑 | **Swarm Root / Blackboard**、**Workers**、**Verifier**、**Synthesizer** | 如何快速创建固定的并行校验图 |

核心变化：

> 执行现场从“当前对话”转移到了“后台任务”

普通 **Chat** 的执行现场是当前上下文

**Kanban** 的执行现场是 **Task**、评论、依赖、执行记录和 **Worker** 进程

这条链路里，最基础的是 **Task**

所有后台执行都先落成 **Task**，再由 **Profile**、**Worker Process**、**Dispatcher**、**Board**、**Tenant**、**Workspace** 和 **Swarm** 等机制参与调度、隔离和编排

记忆锚点：

> **Task** 定义工作，**Run** 记录执行，**Link** 与 **Comment** 负责交接

### 二、最小持久化编排单元：**Task**

**Kanban** 的最小持久化任务图节点是 **Task**

对于需要 **Worker** 执行的普通任务，可以把 **Task** 理解成：

> 一条写给某个 `assignee profile` 的后台任务指令

它不是一句普通提示词，而是一个会被 **Runtime** 保存、调度和追踪的任务

但并非每张 **Task** 都必须启动 **Worker**，例如 **Kanban Swarm** 的 **Root** 创建后会立即进入 `done`，它仍是普通 **Task**，但职责是保存共享 **Blackboard** 和拓扑，而不是承担可执行工作

一个 **Task** 自身通常包含：

| 字段 | 作用 |
|---|---|
| `title` | 任务标题，概括要做什么 |
| `body` | 任务说明，写清背景、材料、要求和验收标准 |
| `assignee` | 负责执行的 **Profile** 名 |
| `status` | 当前状态，例如 `ready`、`running`、`blocked`、`done` |
| `workspace` | 这张任务执行时使用的文件系统目录 |
| `tenant` | 可选的业务命名空间 |
| `priority` | 调度时使用的优先级 |

围绕 **Task** 还有一组独立的持久化对象，它们不能和 **Task** 字段混为一谈：

| 对象 | 与 **Task** 的关系 | 消费方 |
|---|---|---|
| **Link** | 记录 `parent → child` 依赖 | **Dispatcher** 据此判断下游任务是否可执行 |
| **Comment** | 记录人类或 **Agent** 追加的协作信息 | 当前 **Worker**、重试 **Worker** 和人工操作者读取 |
| **Run** | 记录一次执行尝试的 `outcome`、`summary` 和 `metadata` | 下游 **Worker**、审计者和 **Dashboard** 读取 |
| **Event** | 记录状态变化和调度事件 | **Dashboard**、通知器和诊断工具读取 |
| **Log** | 记录 **Worker** 进程的执行日志 | 人工排障和运行诊断使用 |
| **Artifact** | 保存 **Worker** 声明的文件交付物 | 下游任务或最终用户消费 |

回到技术方案调研例子，其中一张任务可以抽象成：

```yaml
title: "收集三个候选库的官方文档和版本状态"
assignee: "researcher-profile"
workspace: "scratch"
status: "ready"
body: |
  核验三个候选库的当前版本、维护状态和官方迁移文档
  输出结构化 summary 和 metadata
  必须保留官方资料链接和核验日期
```

这个 **Task** 创建后，就不再只是当前 **Chat** 的一句话

它变成了 **Kanban** 数据库里可以被查看、评论、阻塞、重试和完成的一条记录

### 三、执行者：**Profile** 与 **Worker Process**

很多人容易把 **Profile**、子 **Agent**、**Session**、**Process** 混在一起

这里要拆开

**Profile** 是 **Agent** 的身份模板

它定义：

- 使用什么模型
- 有哪些 **Skills**
- 有哪些 **Tools** / **MCP Tools**
- 有哪些记忆和行为边界
- 面向什么类型的任务

**Task** 不是由 **Profile** 本体执行的

更准确的链路是：

```text
Task 指定 assignee profile
  -> Runtime 读取这个 profile 的配置
  -> Runtime 启动一个独立 Worker Process
  -> Worker Process 内建立本次任务使用的 worker session
  -> worker session 读取 task context
  -> worker 调工具、读文件、写结果
  -> worker complete / block / comment
```

这里的 **Process** 与 **Session** 不是同义词：**Process** 是 **OS** 运行实例，**Session** 是进程内承载模型消息和工具调用的会话状态

所以：

```text
Profile = Agent 身份模板
Task = 给这个 Profile 的后台任务指令
Worker Process = Runtime 为执行这张 Task 启动的一次具体运行
```

这和普通 **Chat** 不一样

普通 **Chat**：

```text
用户 -> 当前 Profile -> 当前 Session 返回
```

**Kanban Task**：

```text
Task -> assignee Profile -> 后台 Worker Process -> Task Result
```

可以把 **Worker** 理解成“子 **Agent**”，但要注意：

- 子 **Agent** 不是长期存在的实体
- 它是某个 **Profile** 在某个 **Task** 上的一次具体运行
- 同一个 **Profile** 可以被多个 **Task** 使用
- 不同 **Task** 可以交给不同 **Profile**

### 四、后台调度：**Dispatcher** 如何让 **Task** 执行

**Kanban** 的后台执行不是魔法

它的核心是 **Dispatcher**

可以把 **Dispatcher** 理解成：

> **Runtime** 里的后台调度器，负责扫描可执行任务，并启动对应 **Profile** 的 **Worker** 进程

典型路径是：

```text
create task
  -> write to board DB
  -> 根据创建入口进入 triage / todo / ready 等状态
  -> 没有未满足依赖且满足调度条件：task becomes ready
     存在未满足依赖：task 保持 todo，等待父任务 done
  -> dispatcher scans ready tasks
  -> atomic claim
  -> spawn worker process
  -> worker executes
  -> complete action / block / retry
```

需要注意，`create task` 前面还存在一个显式控制入口：可能是 **Agent** 调用 `kanban_create`，也可能是用户、脚本或定时任务通过 **CLI**、**Slash Command**、**Dashboard** 创建

**Dispatcher** 只负责发现、领取和启动已经存在的任务，不负责自行理解任意 **Chat** 并决定是否创建任务

关键机制：

| 机制 | 作用 |
|---|---|
| `ready` | 任务已经满足执行条件 |
| `claim` | 原子领取，避免同一张任务被两个 **Worker** 重复执行 |
| `spawn` | 启动对应 **Profile** 的 **Worker** 进程 |
| `max-runtime` | 限制单次任务最长执行时间 |
| `max-retries` | 限制失败后的重试次数 |
| `blocked` | 等待人工输入、外部条件或依赖修复 |
| `complete` / `kanban_complete` | 完成动作，成功后把任务状态更新为 `done`，让下游依赖任务具备晋级条件 |

**Worker** 完成任务后的数据流是：

```text
Worker 调用 kanban_complete
  -> Run 记录 outcome / summary / metadata
  -> Task 更新状态和简短 result
  -> Runtime 追加状态变化 Event
  -> 声明过的 Artifact 被记录
     scratch 产物复制到持久化附件存储，dir / worktree 产物保留在原目录
  -> 下游 Task 读取父任务最近一次成功 Run 的 summary / metadata
```

这里的消费边界是：

| 输出 | 主要用途 | 主要消费者 |
|---|---|---|
| `summary` | 人类可读的任务交接 | 下游 **Worker**、人工审阅者 |
| `metadata` | 机器可读的结构化事实 | 下游 **Worker**、编排和审计逻辑 |
| `result` | **Task** 行上的简短完成摘要 | 列表、通知和兼容路径 |
| **Comment** | 后续补充、纠偏和人工协作 | 当前或下一次 **Worker**、人工操作者 |
| **Event** | 调度与状态变化事实 | **Dashboard**、通知器、诊断工具 |
| **Artifact** | 文件交付物 | 下游任务和最终用户 |

这里要特别注意两个边界

- 后台执行不阻塞当前 **Chat**
  - 可以在 **Chat** 中创建 **Kanban Task**，然后继续对话
  - 后台 **Worker** 会由 **Dispatcher** 调度执行

- 并行是能力，不是无限并行承诺

  - 多个任务可以并行，但是否真的同时跑，取决于：

    - 任务之间有没有依赖
    - 任务是否处于 `ready`
    - **Dispatcher** 的调度上限
    - 系统资源和模型调用额度
    - 多个任务是否写同一个目录
    - 对应 **Profile** 是否可用
    - 失败熔断是否触发
  - 所以不要把 **Kanban** 理解成“创建后一定立刻同时执行”
  - 更准确是：

    > **Kanban** 把任务放进可调度的后台队列，**Dispatcher** 在满足条件时启动 **Worker**

### 五、运行范围：**Board**、**Tenant**、**Workspace**

`board`、`tenant`、`workspace` 是最容易混的一组三个词

它们都在限制任务的运行范围，但并不都构成安全隔离

先看结论：

| 概念 | 本质 | 边界性质 | 回答的问题 |
|---|---|---|---|
| **Board** | **Kanban** 内的项目级任务队列 | 应用层数据和可见性边界 | 这个 **Task** 属于哪个项目或 **Workstream** |
| **Tenant** | **Task** 的业务命名空间字段 | 软分类和过滤边界，不是访问控制 | 这个 **Task** 属于哪个团队、客户或业务线 |
| **Workspace** | **Task** 的文件系统执行目录 | 执行路径，隔离程度取决于类型 | **Worker Process** 在哪里干活 |

它们的关系不是：

```text
board -> tenant -> workspace
```

更准确是：

```text
Runtime
  -> Kanban
    -> Board
      -> Task
        -> tenant: metadata
        -> workspace: execution path
```

#### 5.1、**Board** 是任务数据与可见性边界

**Board** 是 **Kanban** 里的项目级数据和路由边界

一个 **Runtime** 里可以有多个 **Board**

每个 **Board** 可以理解成一个独立的任务队列

官方文档里，**Board** 有自己的：

- **SQLite DB**
- `workspaces/` 目录
- `logs/` 目录
- 任务、工具和 **Worker** 的可见边界

这不等于每个 **Board** 都必须拥有一个独立 **Dispatcher** 进程

当前实现中，一个长期运行的 **Dispatcher** 可以在同一次调度循环里扫描多个 **Board**，**Worker** 启动时通过 `HERMES_KANBAN_BOARD` 固定到所属 **Board**，从而只能读取和操作该 **Board** 的任务

这里的“边界”是 **Kanban** 应用层的数据、目录和工具可见性边界，不应直接等同于 **OS** 权限或对抗性安全沙箱

适合按项目、仓库或长期工作流拆分：

```text
board: default
board: personal-research
board: product-docs
board: backend-refactor
```

如果两个任务完全不相关，最好不要塞进同一个 **Board**

**Board** 回答的是：

> 这组任务属于哪条工作流队列

#### 5.2、**Tenant** 是任务上的业务命名空间

**Tenant** 不是独立数据库，也不是独立调度器

它更像 **Task** 上的一个业务命名空间字段

例如：

```text
tenant: team-a
tenant: client-b
tenant: internal
```

它适合表达：

- 任务属于哪个团队
- 任务属于哪个客户
- 任务属于哪个业务线
- 任务在展示、过滤、审计时应该归到哪里

但它不提供访问控制或 **Board** 级别的数据边界

同一个 **Board** 下不同 **Tenant** 的任务，仍然共享这个 **Board** 的队列和调度范围

**Tenant** 回答的是：

> 这张任务属于哪个业务命名空间

#### 5.3、**Workspace** 是任务执行目录

**Workspace** 不是产品层的团队空间

在 **Kanban** 里，**Workspace** 指的是：

> **Worker Process** 执行这张 **Task** 时所在的文件系统目录

常见类型有：

| 类型 | 适合场景 |
|---|---|
| `scratch` | 临时任务，不需要操作真实项目目录 |
| `dir:<path>` | 在已有目录中处理资料、文档或业务文件 |
| `worktree` | 工程开发任务，需要隔离 **Git** 改动 |
| `worktree:<path>` | 指定某个 **Git worktree** 路径 |

如果是研究任务，可能用：

```text
workspace: scratch
```

如果是修改某个项目文档，可能用：

```text
workspace: dir:/Users/me/project/example
```

如果是代码开发任务，可能用：

```text
workspace: worktree
```

**Workspace** 回答的是：

> 这个 **Worker** 到哪里读文件、写文件、运行命令

**Workspace** 也不天然等于安全隔离：`scratch` 提供临时目录，`worktree` 隔离 **Git** 改动，`dir:<path>` 则直接进入受信任的既有目录，多个任务仍可能读写同一位置

### 六、多 **Agent** 编排：**Task Graph** 与 **Swarm**

前面讲的是单个 **Task**

但 **Kanban** 真正有价值的地方，是可以把多个 **Task** 组织成一个任务图

例如：

```text
资料收集 task
  -> 方案分析 task
  -> 风险校验 task
  -> 最终汇总 task
```

这里每张 **Task** 都可以分配给不同 **Profile**

```text
research-profile
  -> architecture-profile
  -> reviewer-profile
  -> writer-profile
```

这就是多 **Agent** 编排的核心

不是一个 **Agent** 自己从头做到尾，而是：

```text
一个复杂目标
  -> 多张 Task
  -> 多个 Profile
  -> 多个 Worker Process
  -> 结果写回 Kanban
  -> 下游 Task 继续执行
```

#### 6.1、**Swarm** 不是最小工作单元

关键认知：

> **Task** 是最小持久化任务图节点，**Swarm** 不是新的执行单元或 **Runtime**

**Swarm** 是 **Kanban** 上的一种快捷任务图模板

它一次性创建多张 **Task**，并自动建立依赖关系

更准确地说，`hermes kanban swarm` 是现有 **Kanban** 上的一层轻量 **Topology Helper**：它只负责写入固定任务图和共享上下文，不会创建第二套 **Swarm** 调度器，任务仍由普通 **Dispatcher** 执行

完整结构是：

```text
completed root / shared blackboard
  -> parallel workers
  -> verifier
  -> synthesizer
```

也就是：

```text
Root / Blackboard（创建后立即 done）
  ├─> worker A ┐
  ├─> worker B ├─> verifier -> synthesizer
  └─> worker C ┘
```

其中：

- **Root** 是整个 **Swarm** 的规划卡、共享 **Blackboard** 和审计锚点
- **Root** 会立即完成，使并行 **Worker** 可以进入可调度状态
- **Blackboard** 通过 **Root** 上的结构化 **JSON Comment** 保存共享上下文和跨 **Worker** 信息
- **Verifier** 依赖全部 **Worker**，只在所有 **Worker** 完成后执行
- **Synthesizer** 依赖 **Verifier**，只有 **Verifier** 进入 `done` 后才具备执行资格

普通 **Parent Link** 只能判断“**Verifier** 是否 `done`”，不能自动理解“语义校验是否通过”

**Kanban Swarm v1** 通过 **Verifier** 任务协议补上这层约束：证据充分时才以 `metadata: {"gate": "pass"}` 完成，证据不足时应进入 `blocked` 并写明缺失项，从而阻止 **Synthesizer** 获得执行资格

#### 6.2、**Root**、**Worker**、**Verifier**、**Synthesizer** 不是内置 **Agent**

`root`、`worker`、`verifier`、`synthesizer` 不是 **Hermes** 内置的四种特殊 **Agent**

它们只是 **Swarm** 模板里的任务图位置，其中 **Worker**、**Verifier**、**Synthesizer** 是执行角色槽位，**Root** 通常创建后立即完成，作为共享锚点而不承担后续 **Worker** 执行

最终都会落成普通 **Kanban Task**

| 概念 | 本质 |
|---|---|
| `root / blackboard` | 已完成的规划任务、共享上下文和审计锚点 |
| `worker` | **Swarm** 模板里的并行任务槽位 |
| `verifier` | 下游校验任务槽位 |
| `synthesizer` | 最终汇总任务槽位 |
| **Profile** | 承担这些槽位的真实 **Agent** 身份 |
| **Task Graph** | 多张 **Task** 加依赖关系形成的执行图 |

真正决定谁来做的是 **Profile**

例如：

```bash
hermes kanban swarm "比较三个技术方案并输出迁移建议" \
  --worker research-profile:"收集官方文档和版本信息" \
  --worker codebase-profile:"阅读当前项目代码并确认接入点" \
  --worker architecture-profile:"比较方案 API 与迁移成本" \
  --verifier reviewer-profile \
  --synthesizer writer-profile
```

这条命令表达的是：

- 创建一个已完成的 **Root / Blackboard** 任务
- `research-profile` 承担一个 **Worker** 任务
- `codebase-profile` 承担另一个 **Worker** 任务
- `architecture-profile` 承担另一个 **Worker** 任务
- `reviewer-profile` 承担 **Verifier** 任务
- `writer-profile` 承担 **Synthesizer** 任务

但在 **Kanban** 数据层，**Root**、**Worker**、**Verifier** 和 **Synthesizer** 都是普通 **Task**

区别只是依赖关系和任务说明不同

记忆锚点：

> **Swarm** 只写任务图，**Kanban** 保存任务图，**Dispatcher** 执行任务图

### 七、完整例子：技术方案调研与迁移计划

现在用一个通用例子把前面所有概念串起来

用户在 **Chat** 里提出：

```text
帮我调研某个技术方案，比较 3 个候选库，输出推荐结论和迁移计划
```

如果当前 **Agent** 直接做，容易出现几个问题：

- 它要同时查资料、读代码、比较方案、做风险校验、写总结
- 当前上下文可能很快变长
- 中间结论不容易被单独审查
- 如果任务失败，恢复成本很高
- 后续很难知道每一步到底是谁做的、依据是什么

用 **Kanban** 可以拆成一个带共享 **Blackboard** 的固定任务图，其拓扑与 **Kanban Swarm v1** 一致：

> 下面是用于解释机制的教学性任务图，显式展示了不同 **Worker** 的 **Workspace**，当前 `v0.18.2` 的 `hermes kanban swarm` **CLI** 不提供逐 **Worker** 的 **Workspace** 参数，如果不同任务必须进入不同目录，应通过 `kanban create` 与 `kanban link` 显式创建同构任务图

```text
Root: 比较三个技术方案并输出迁移建议
  status: done
  role: shared blackboard / audit anchor
  tenant: internal

Task 1: 收集官方文档和版本信息
  assignee: research-profile
  workspace: scratch
  tenant: internal
  parent: Root

Task 2: 阅读当前项目代码，确认接入点
  assignee: codebase-profile
  workspace: dir:/path/to/project
  tenant: internal
  parent: Root

Task 3: 独立比较候选方案的 API、风险和迁移成本
  assignee: architecture-profile
  workspace: scratch
  tenant: internal
  parent: Root

Task 4: 校验风险和遗漏
  assignee: reviewer-profile
  parent: Task 1, Task 2, Task 3
  tenant: internal
  pass: complete with metadata {"gate": "pass"}
  fail: blocked with exact missing work

Task 5: 汇总成技术建议文档
  assignee: writer-profile
  parent: Task 4
  tenant: internal
```

这组任务里，每个概念都有具体位置

| 概念 | 在例子中的位置 |
|---|---|
| **Board** | 这组任务所在的项目队列，例如 `product-docs` |
| **Root / Blackboard** | 保存共同目标、拓扑和跨 **Worker** 共享信息 |
| **Tenant** | 业务命名空间，例如 `internal` |
| **Workspace** | **Worker** 读写文件的目录，例如 `scratch` 或 `dir:/path/to/project` |
| **Task** | 每一步具体任务 |
| **Profile** | 每张 **Task** 的执行者身份 |
| **Worker Process** | **Runtime** 为每张 **Task** 启动的执行进程 |
| **Parent Link** | 任务之间的依赖关系 |
| **Dispatcher** | 后台按依赖关系派发 `ready` **Task** |
| **Comment** | 人工补充和跨 **Worker** 的 **Blackboard** 更新 |
| **Run Summary / Metadata** | 每个 **Worker** 写回、供下游读取的交接结果 |
| **Artifact** | 最终文档或其他文件交付物 |

控制流大致是：

```text
用户在 Chat 中下达目标
  -> Agent 调用工具，或用户通过 CLI / Dashboard 创建任务图
     Workspace 相同可以使用 swarm helper，需要逐任务 Workspace 则显式 create / link
  -> Root 写入共同目标和拓扑后立即 done
  -> Task 1、Task 2、Task 3 的 Root 依赖已满足，可以并行执行
  -> 三个 worker 分别写回 Run summary / metadata，必要时更新 Blackboard
  -> Task 4 等三个 worker 全部 done 后读取交接结果并执行校验
  -> 校验通过：Task 4 以 metadata gate=pass 完成，Task 5 获得执行资格
     校验不通过：Task 4 blocked，Task 5 继续等待
  -> Task 5 把最终建议写成 Artifact，并把交付摘要写回 Run
  -> 用户、主 Agent 或后续 Task 读取最终交付物
```

这里的关键不是 **Dashboard** 上显示了几个任务

关键是：

> 一个复杂目标被拆成多张可追踪、可恢复、可交接的后台任务

这个例子同时展示了两条链：

```text
依赖资格：Link 决定下游任务何时具备执行资格
实际调度：assignee 决定谁执行，Dispatcher 结合状态和资源决定何时启动
数据流：Run / Comment / Artifact 决定下游读取什么
```

### 八、使用判断：什么时候应该用 **Kanban**

不是所有任务都需要 **Kanban**

如果一个问题可以在当前 **Chat** 里快速回答，就没必要引入后台任务系统

判断表：

| 场景 | 是否使用 **Kanban** |
|---|---|
| 问一个概念，马上回答 | 不用 |
| 修改一个很小的文档，当前 **Chat** 可完成 | 通常不用 |
| 任务很长，需要后台跑 | 用 |
| 需要多个 **Profile** 分工 | 用 |
| 有明显依赖、检查、汇总 | 用 |
| 需要多个独立视角并行，并经过统一校验和汇总 | 用 **Kanban Swarm** |
| 需要中途补资料或人工确认 | 用 |
| 失败后需要恢复、重试、继续 | 用 |
| 后续需要审计每一步是谁做的 | 用 |
| 不同项目任务不想混在一起 | 用不同 **Board** |
| 同项目下区分客户、团队、业务线 | 用 **Tenant** |
| 任务需要读写文件或代码 | 选择合适 **Workspace** |

使用判断：

```text
我问，你答，马上结束
  -> Chat

任务要分步骤、分角色、后台跑、能恢复、能追踪
  -> Kanban
```

### 九、最终心智模型

概念图：

```text
Hermes Runtime
  -> Profiles
  -> Chat / Sessions
  -> Tools / MCP
  -> Kanban
       -> Boards
            -> Tasks：工作定义和当前状态
            -> Links：Task 依赖关系
            -> Comments：人类和 Agent 协作信息
            -> Runs：每次执行的 outcome / summary / metadata
            -> Events：状态变化和调度事实
            -> Artifacts：文件交付物
       -> Dispatcher
            -> claims ready tasks
            -> spawns worker processes
            -> records complete / block / retry
       -> Swarm topology helper
            -> writes root / blackboard
            -> writes parallel workers -> verifier -> synthesizer
            -> reuses the same Dispatcher
```

概念压缩：

```text
Chat 是提出意图的地方
Task 是意图落成持久化任务图的最小节点
Profile 是执行任务的 Agent 身份模板
Worker Process 是某张 Task 的一次具体运行
Dispatcher 是把 ready Task 派给 Profile 的后台调度器
Board 是项目级任务队列
Tenant 是 Task 的业务命名空间
Workspace 是 Worker 的文件系统执行目录
Run 是一次执行尝试及其交接结果
Link 决定下游 Task 何时具备执行资格
Swarm 是在 Kanban 上批量创建固定 Task Graph 的 topology helper
```

一句话收束：

> **Hermes Kanban** 不是看板 **UI**，而是 **Hermes Runtime** 用来编排多个 **Agent** 后台分工干活的任务调度系统

这句话里最重要的不是“看板”，而是：

```text
后台
多 Agent
任务流
可追踪
可恢复
```

`board`、`tenant`、`workspace`、`swarm` 不是一组平级概念

它们分别回答的是：

```text
board: 任务在哪个项目队列里
tenant: 任务属于哪个业务命名空间
workspace: worker 在哪里干活
swarm: 如何快速创建 root / blackboard -> workers -> verifier -> synthesizer
```

### 十、参考资料

- **Hermes Kanban** 官方文档：<https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban>
- **Hermes Kanban Tutorial**：<https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban-tutorial>
- **Hermes Kanban Worker Lanes**：<https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban-worker-lanes>
