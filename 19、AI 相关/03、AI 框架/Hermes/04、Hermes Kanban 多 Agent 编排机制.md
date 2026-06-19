## Hermes Kanban 多 Agent 编排机制

### 一、前言

**Hermes Kanban** 通俗定义 ：

> ==**Hermes** 中编排多个 **Agent** 在后台分工干活的机制==

**Kanban** 的核心作用：

- 不是让当前 **Chat** 里的 **Agent** 一口气把所有事情做完，而是把一个复杂任务拆成多个后台任务
- 每个任务交给某个 **Profile** 对应的 **Agent** 执行
- 执行过程、状态、评论、结果都持久化保存
- 后续任务可以基于前置任务结果继续执行

更严谨的定义：

> **Hermes Kanban** 是 **Hermes Runtime** 把一次 **Chat**、命令或工具调用里的复杂意图，转成可落库、可调度、可恢复、可跨 **Profile** 执行的后台任务流

两层定义：

| 层次 | 定义 |
|---|---|
| 通俗定义 | **Kanban** 是多 **Agent** 后台编排机制 |
| 严谨定义 | **Kanban** 是 **Runtime** 里的持久化任务队列、状态机和调度器 |

示例输入：

```text
把这份会议记录整理成一页知识库笔记，交给 researcher-profile 后台处理
```

不用 **Kanban** 时，当前 **Agent** 需要在当前对话里马上完成这件事

使用 **Kanban** 时，流程变成：

```text
用户在 Chat 里提出任务
  -> Hermes 把请求写成一张 Kanban Task
  -> Task 落到当前 Board
  -> Task 带上 tenant、workspace、assignee profile 等元数据
  -> Dispatcher 发现可执行 Task
  -> Runtime 基于 assignee profile 启动 Worker Process
  -> Worker 读取 Task body、comments、父任务结果和附件
  -> Worker 调用工具、读写 workspace、产出结果
  -> 结果写回 comment / run / event
  -> 如果存在 parent link，下游 Task 在依赖完成后继续执行
  -> 如果使用 Swarm，这组 Task 可以形成 workers -> verifier -> synthesizer 的任务图
```

链路中的核心对象：

| 对象 | 在链路中的作用 |
|---|---|
| **Chat** | 用户提出意图的地方 |
| **Task** | 把用户意图变成可调度的后台任务 |
| **Board** | 承载任务的项目级队列 |
| **Tenant** | 任务的业务命名空间 |
| **Workspace** | **Worker** 实际读写文件的目录 |
| **Profile** | 决定由哪个 **Agent** 身份执行任务 |
| **Dispatcher** | 发现可执行任务并触发后台执行 |
| **Worker Process** | 某张 **Task** 的一次具体执行进程 |
| `comment` / `run` / `event` | 任务结果、执行过程和交接记录 |
| `parent link` | 多张 **Task** 之间的依赖关系 |
| **Swarm** | 快速创建多任务图的模板 |

核心变化：

> 执行现场从“当前对话”转移到了“后台任务”

普通 **Chat** 的执行现场是当前上下文

**Kanban** 的执行现场是 **Task**、评论、依赖、执行记录和 **worker** 进程

这条链路里，最基础的是 **Task**

所有后台执行都先落成 **Task**，再由 **Profile**、**Worker Process**、**Dispatcher**、**Board**、**Tenant**、**Workspace** 和 **Swarm** 等机制参与调度、隔离和编排

### 二、最小执行单元：**Task**

**Kanban** 的最小执行单元是 **Task**

可以把 **Task** 理解成：

> 一条写给某个 `assignee profile` 的后台任务指令

它不是一句普通提示词，而是一个会被 **Runtime** 保存、调度和追踪的任务

一个 **Task** 通常包含：

| 字段 | 作用 |
|---|---|
| `title` | 任务标题，概括要做什么 |
| `body` | 任务说明，写清背景、材料、要求和验收标准 |
| `assignee` | 负责执行的 **Profile** 名 |
| `status` | 当前状态，例如 `ready`、`running`、`blocked`、`done` |
| `parent` / `link` | 与其他任务的依赖关系 |
| `comment` | 人类或 **Agent** 追加的持久化交接信息 |
| `run` / `event` / `log` | 执行记录、调度事件和 worker 日志 |
| `workspace` | 这张任务执行时使用的文件系统目录 |
| `tenant` | 可选的业务命名空间 |

如果回到前面的会议记录例子，一张任务可以抽象成：

```yaml
title: "整理会议记录成知识库笔记"
assignee: "researcher-profile"
workspace: "dir:/path/to/notes"
status: "ready"
body: |
  读取指定会议记录，提炼背景、决策、行动项和后续问题
  输出为一页 Markdown 知识库笔记
  必须保留原始资料路径
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
  -> Runtime 启动一次 worker process / worker session
  -> worker 读取 task context
  -> worker 调工具、读文件、写结果
  -> worker complete / block / comment
```

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

可以把 **worker** 理解成“子 **Agent**”，但要注意：

- 子 **Agent** 不是长期存在的实体
- 它是某个 **Profile** 在某个 **Task** 上的一次具体运行
- 同一个 **Profile** 可以被多个 **Task** 使用
- 不同 **Task** 可以交给不同 **Profile**

### 四、后台调度：**Dispatcher** 如何让 **Task** 执行

**Kanban** 的后台执行不是魔法

它的核心是 **Dispatcher**

可以把 **Dispatcher** 理解成：

> **Runtime** 里的后台调度器，负责扫描可执行任务，并启动对应 **Profile** 的 worker 进程

典型路径是：

```text
create task
  -> write to board DB
  -> task status becomes ready
  -> dispatcher scans ready tasks
  -> atomic claim
  -> spawn worker process
  -> worker executes
  -> complete / block / retry
```

关键机制：

| 机制 | 作用 |
|---|---|
| `ready` | 任务已经满足执行条件 |
| `claim` | 原子领取，避免同一张任务被两个 worker 重复执行 |
| `spawn` | 启动对应 **Profile** 的 worker 进程 |
| `max-runtime` | 限制单次任务最长执行时间 |
| `max-retries` | 限制失败后的重试次数 |
| `blocked` | 等待人工输入、外部条件或依赖修复 |
| `complete` | 标记任务完成，让下游依赖任务可以继续 |

这里要特别注意两个边界

- 后台执行不阻塞当前 **Chat**
  - 可以在 **Chat** 中创建 **Kanban Task**，然后继续对话
  - 后台 worker 会由 **Dispatcher** 调度执行

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

    > **Kanban** 把任务放进可调度的后台队列，**Dispatcher** 在满足条件时启动 worker

### 五、隔离维度：**Board**、**Tenant**、**Workspace**

`board`、`tenant`、`workspace` 是最容易混的一组三个词

它们都和隔离有关，但不是同一种隔离

先看结论：

| 概念 | 本质 | 隔离强度 | 回答的问题 |
|---|---|---|---|
| **Board** | **Kanban** 内的项目级任务队列 | 强隔离 | 这个 **Task** 属于哪个项目或 **workstream** |
| **Tenant** | **Task** 的业务命名空间字段 | 逻辑隔离 | 这个 **Task** 属于哪个团队、客户或业务线 |
| **Workspace** | **Task** 的文件系统执行目录 | 执行隔离 | **worker process** 在哪里干活 |

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

#### 5.1、**Board** 是硬隔离任务队列

**Board** 是 **Kanban** 里的项目级隔离单元

一个 **Runtime** 里可以有多个 **Board**

每个 **Board** 可以理解成一个独立的任务队列

官方文档里，**Board** 有自己的：

- **SQLite DB**
- `workspaces/` 目录
- `logs/` 目录
- **Dispatcher** 作用范围

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

但它不提供 **Board** 级别的硬隔离

同一个 **Board** 下不同 **Tenant** 的任务，仍然共享这个 **Board** 的队列和调度范围

**Tenant** 回答的是：

> 这张任务属于哪个业务命名空间

#### 5.3、**Workspace** 是任务执行目录

**Workspace** 不是产品层的团队空间

在 **Kanban** 里，**Workspace** 指的是：

> worker process 执行这张 **Task** 时所在的文件系统目录

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

> 这个 worker 到哪里读文件、写文件、运行命令

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

> **Task** 是最小工作单元，**Swarm** 不是

**Swarm** 是 **Kanban** 上的一种快捷任务图模板

它一次性创建多张 **Task**，并自动建立依赖关系

典型结构是：

```text
workers -> verifier -> synthesizer
```

也就是：

```text
worker A ┐
worker B ├─> verifier -> synthesizer
worker C ┘
```

#### 6.2、**Worker**、**Verifier**、**Synthesizer** 不是内置 **Agent**

`worker`、`verifier`、`synthesizer` 不是 **Hermes** 内置的三种特殊 **Agent**

它们只是 **Swarm** 模板里的角色槽位

最终都会落成普通 **Kanban Task**

| 概念 | 本质 |
|---|---|
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

- `research-profile` 承担一个 worker 任务
- `codebase-profile` 承担另一个 worker 任务
- `architecture-profile` 承担另一个 worker 任务
- `reviewer-profile` 承担 verifier 任务
- `writer-profile` 承担 synthesizer 任务

但在 **Kanban** 数据层，它们都是 **Task**

区别只是依赖关系和任务说明不同

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

用 **Kanban** 可以拆成一个任务图：

```text
Task 1: 收集官方文档和版本信息
  assignee: research-profile
  workspace: scratch
  tenant: internal

Task 2: 阅读当前项目代码，确认接入点
  assignee: codebase-profile
  workspace: dir:/path/to/project
  tenant: internal

Task 3: 比较候选方案的维护状态、API、迁移成本
  assignee: architecture-profile
  parent: Task 1, Task 2
  tenant: internal

Task 4: 校验风险和遗漏
  assignee: reviewer-profile
  parent: Task 3
  tenant: internal

Task 5: 汇总成技术建议文档
  assignee: writer-profile
  parent: Task 4
  tenant: internal
```

这组任务里，每个概念都有具体位置

| 概念 | 在例子中的位置 |
|---|---|
| **Board** | 这组任务所在的项目队列，例如 `product-docs` |
| **Tenant** | 业务命名空间，例如 `internal` |
| **Workspace** | worker 读写文件的目录，例如 `scratch` 或 `dir:/path/to/project` |
| **Task** | 每一步具体任务 |
| **Profile** | 每张 **Task** 的执行者身份 |
| **Worker Process** | **Runtime** 为每张 **Task** 启动的执行进程 |
| **Parent Link** | 任务之间的依赖关系 |
| **Dispatcher** | 后台按依赖关系派发 ready 任务 |
| **Comment / Run** | 每个 worker 写回的中间结果和执行记录 |

控制流大致是：

```text
用户在 Chat 中下达目标
  -> orchestrator 或 CLI 创建 task graph
  -> Task 1 和 Task 2 没有父依赖，可以先执行
  -> Task 3 等 Task 1、Task 2 done 后变成 ready
  -> Task 4 等 Task 3 done 后执行校验
  -> Task 5 等 Task 4 done 后汇总
  -> 最终建议文档写回 Kanban，并可被用户或主 Agent 读取
```

这里的关键不是 **Dashboard** 上显示了几个任务

关键是：

> 一个复杂目标被拆成多张可追踪、可恢复、可交接的后台任务

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
            -> Tasks
                 -> assignee Profile
                 -> tenant namespace
                 -> workspace path
                 -> parent links
                 -> comments / events / runs
       -> Dispatcher
            -> claims ready tasks
            -> spawns worker processes
            -> records complete / block / retry
```

概念压缩：

```text
Chat 是提出意图的地方
Task 是意图落成后台工作的最小单位
Profile 是执行任务的 Agent 身份模板
Worker Process 是某张 Task 的一次具体运行
Dispatcher 是把 ready Task 派给 Profile 的后台调度器
Board 是项目级任务队列
Tenant 是 Task 的业务命名空间
Workspace 是 Worker 的文件系统执行目录
Swarm 是批量创建 Task Graph 的模板
```

一句话收束：

> **Hermes Kanban** 不是看板 UI，而是 **Hermes Runtime** 用来编排多个 **Agent** 后台分工干活的任务调度系统

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
swarm: 如何快速创建一组带依赖的 task
```

### 十、参考资料

- **Hermes Kanban** 官方文档：<https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban>
- **Hermes Kanban Tutorial**：<https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban-tutorial>
- **Hermes Kanban Worker Lanes**：<https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban-worker-lanes>
