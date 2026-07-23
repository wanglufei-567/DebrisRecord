## Hermes `delegate_task` 子 Agent 委派机制

### 一、前言

`delegate_task` 的通俗定义：

> ==当前 **Agent** 临时叫一个或多个子 **Agent** 分头处理问题，完成后把结论带回当前对话的机制==

它解决的不是持久化任务调度，而是当前 **Agent** 面临下面这些压力时，如何把部分认知工作切出去：

- 某个子问题需要大量搜索、阅读或推理，会挤占父 **Agent** 的上下文
- 多个子问题彼此独立，可以并行处理
- 父 **Agent** 只需要子任务结论，不需要接收全部中间工具输出
- 最终结论仍然需要一个责任主体统一验证和综合

本文使用一个贯穿全篇的教学示例，不对应特定仓库：

```text
检查一套技术方案的架构合理性、实现可行性和测试覆盖，并给出最终判断
```

不用 `delegate_task` 时：

```text
父 Agent
  -> 阅读架构材料
  -> 检查实现代码
  -> 检查测试证据
  -> 在同一上下文中保存全部中间结果
  -> 汇总结论
```

使用 `delegate_task` 时：

```text
父 Agent
  -> 子 Agent A：检查架构边界
  -> 子 Agent B：检查实现链路
  -> 子 Agent C：检查测试证据
  -> 接收三个结果摘要
  -> 回读证据、处理冲突并形成最终判断
```

更严谨的定义：

> `delegate_task` 是 **Hermes Runtime** 提供的子 **Agent** 委派工具，它为每项子任务创建一个具有独立上下文、独立 Session 和独立终端状态的临时 **AIAgent** 实例，并把子 **Agent** 的最终摘要返回父 **Agent** 所在的对话

它在 **Hermes** 多 **Agent** 机制中的位置：

```text
Hermes Runtime
  -> 当前 Agent Session
       -> 直接调用 Tool
       -> delegate_task
            -> 临时 Child Agent
            -> 独立处理子问题
            -> Summary 返回原 Session
       -> Kanban
            -> 持久化 Task
            -> Dispatcher 启动命名 Profile Worker
            -> 结果保存在任务系统
```

最重要的边界：

> `delegate_task` 是当前 **Agent** 的临时认知分工，**Kanban** 是跨 **Agent**、跨进程、可恢复的持久化工作协调

这篇文档以 2026-07-15 的 **Hermes** 当前源代码行为为准，本机核验快照为 `bd740f203b44237dbc5c27a2de4d86ef32af4dde`

### 二、委派对象：父 Agent、子 Agent 与进程边界

`delegate_task` 首先是当前父 **Agent** 可以调用的一个 **Tool**，不是独立的后台任务平台

参与者只有三类：

| 对象 | 职责 |
|---|---|
| 父 **Agent** | 判断是否需要委派，编写子任务，接收结果，验证并综合结论 |
| `delegate_task` | 创建子 **Agent**、控制并发与深度、转发进度和结果 |
| 子 **Agent** | 在隔离上下文中完成一项明确任务，返回结构化摘要 |

典型关系：

```text
用户提出目标
  -> 父 Agent 判断任务结构
  -> 父 Agent 调用 delegate_task
  -> Runtime 创建 Child Agent
  -> Child Agent 独立工作
  -> Runtime 将结果送回原 Session
  -> 父 Agent 验证、整合并回答用户
```

父 **Agent** 不等于用户

通常是用户先给父 **Agent** 一个目标，再由父 **Agent** 自主决定是否调用 `delegate_task`

#### 2.1、子 Agent 不是命名 Profile

`delegate_task` 创建的是 **Runtime** 中的临时 **AIAgent** 实例：

- 没有独立的长期身份
- 不会成为可供其他任务认领的命名 Worker
- 默认不读取父 **Agent** 的完整对话历史
- 生命周期依附于当前 **Hermes** 进程和父 **Session**
- 完成后主要把结果摘要带回父 **Session**

因此：

```text
Profile = 可复用的 Agent 身份与配置边界
Child Agent = 为一次委派临时创建的执行实例
delegate_task = 父 Agent 创建和管理 Child Agent 的工具
```

#### 2.2、子 Agent 不是 Kanban Worker Process

这是理解两种多 **Agent** 机制的底层边界：

| | `delegate_task` Child Agent | **Kanban Worker** |
|---|---|---|
| 执行载体 | 同一 **Hermes** 进程内的临时 **AIAgent**，通过工作线程运行 | **Dispatcher** 启动的独立 **OS Process** |
| 身份来源 | 继承父 **Agent** 的主要运行配置 | 由 **Task** 指定命名 **Profile** |
| 工作记录 | 依附父 **Session** 和当前进程 | 持久化到 **Kanban Task** 与事件记录 |
| 恢复能力 | 进程退出后不能恢复 | 可重新认领、重试和接力 |

子 **Agent** 虽然有独立 Session 和终端状态，但仍属于当前 Hermes 进程内的临时执行分支

记忆锚点：

> 父 **Agent** 负责拆与验，子 **Agent** 负责做与报

### 三、上下文隔离：子 Agent 知道什么，不知道什么

`delegate_task` 最有价值的能力不只是并行，而是上下文隔离

#### 3.1、`goal` 与 `context` 是任务交接面

子 **Agent** 会获得新的对话上下文，不会自动知道：

- 用户之前说过什么
- 父 **Agent** 调用过哪些工具
- 父 **Agent** 已形成哪些中间判断
- “刚才的方案”“之前的错误”具体指什么
- 用户要求的语言、风格和修改边界

回到技术方案评审例子，下面这种委派是不完整的：

```text
goal: 检查刚才那个方案有没有问题
```

更完整的委派应写成：

```text
goal:
  检查该技术方案的实现可行性，定位真实代码接入点和阻塞项

context:
  仓库路径为 /absolute/path/to/project
  方案文档位于 docs/proposal.md
  只做诊断，不修改代码
  返回证据文件路径、关键调用链和未验证风险
  使用简体中文输出
```

两个字段分别回答：

| 字段 | 回答的问题 |
|---|---|
| `goal` | 子 **Agent** 最终必须完成什么 |
| `context` | 完成目标需要哪些背景、路径、约束和输出要求 |

当前 **Runtime** 还会尽力把明确的绝对 **Workspace** 路径作为提示传给子 **Agent**

但路径提示不能替代业务背景，父 **Agent** 仍然必须显式传递任务条件

#### 3.2、上下文隔离不等于文件系统隔离

子 **Agent** 有独立对话和独立终端 **Session**，但通常仍可能访问父 **Agent** 所在的同一工作目录

这意味着：

- 子 **Agent** 看不到父对话，不代表看不到同一个仓库
- 一个子 **Agent** 修改文件后，父 **Agent** 和其他子 **Agent** 可能立即看到
- 多个子 **Agent** 同时修改同一文件，仍然可能发生覆盖和竞争
- `delegate_task` 不会像 **Kanban Worktree** 那样自动提供持久化工作区隔离

在技术方案评审中，三个子 **Agent** 都只读取材料、分别返回架构、实现和测试结论，因此适合并行

如果让三个子 **Agent** 同时重写同一份方案文档，就会引入文件竞争和观点覆盖

记忆锚点：

> 隔离的是认知现场，不一定是文件现场

### 四、运行时控制流：一次委派如何完成

当前模型侧调用主要有两种输入形态

单任务：

```text
delegate_task(
  goal="检查方案的架构边界",
  context="只读检查 docs/proposal.md，返回职责冲突和证据路径",
  role="leaf"
)
```

批量任务：

```text
delegate_task(
  tasks=[
    {
      goal: "检查方案的架构边界",
      context: "只读检查架构材料，返回职责冲突和遗漏",
      role: "leaf"
    },
    {
      goal: "检查方案的实现可行性",
      context: "只读检查生产代码，返回真实调用链和阻塞项",
      role: "leaf"
    },
    {
      goal: "检查方案的测试覆盖",
      context: "只读检查测试，列出已覆盖行为和证据缺口",
      role: "leaf"
    }
  ]
)
```

完整控制流：

```text
1. 父 Agent 识别出架构、实现、测试三个独立检查面
  -> 2. 父 Agent 为每个检查面生成 goal / context / role
  -> 3. Runtime 校验并发上限和委派深度
  -> 4. Runtime 构建专用子 Agent Prompt
  -> 5. Runtime 创建 Child AI Agent 与 Child Session
  -> 6. Child Agent 继承允许的模型和工具能力
  -> 7. Child Agent 在工作线程中调用 LLM 与 Tools
  -> 8. Child Agent 形成最终 Summary
  -> 9. Runtime 把 Completion Event 路由回原 Session
  -> 10. 父 Agent 回读证据、处理冲突并形成最终判断
```

#### 4.1、顶层委派在背景执行

当前源代码中，顶层父 **Agent** 发出的模型侧 `delegate_task` 会进入背景执行：

- 工具调用先返回 delegation handle
- 父 **Agent** 与用户不必一直阻塞在该工具调用上
- 子 **Agent** 完成后，结果作为新消息重新进入原 **Session**
- 批量委派会收齐该批子任务，再以一组结果重新进入对话

这里的 **Background** 只表示不阻塞当前对话回合，不代表任务已经持久化

#### 4.2、结果属于发起委派的原 Session

当前实现会记录父 **Session** 标识和路由信息

即使同一个 **Profile** 同时存在多个 **Session**，结果也会回到发起该次委派的 **Session**，而不是任意最新对话

#### 4.3、父 Agent 消费的是摘要，不是完整子轨迹

子 **Agent** 可能读取大量文件并进行多轮工具调用，但这些中间轨迹不会全部进入父上下文

父 **Agent** 主要接收最终摘要，以及状态、耗时、退出原因、Token 和工具轨迹等结构化元数据

如果摘要过长，**Runtime** 会根据父上下文剩余空间进行裁剪，避免批量结果挤爆上下文

### 五、能力边界：继承什么，屏蔽什么

子 **Agent** 不会凭空获得一套全新 **Profile**，主要运行能力来自父 **Agent** 和全局 **delegation** 配置

| 维度 | 当前行为 | 工程含义 |
|---|---|---|
| 模型与 **Provider** | 默认继承父 **Agent**，也可通过全局 delegation 配置统一覆盖 | 父模型不能按每个子任务任意切换模型 |
| **Toolsets** | 继承父 **Agent** 已启用能力，再由 **Runtime** 移除受限工具 | 子 **Agent** 不能获得父 **Agent** 没有的能力 |
| **Context Files** | 创建子 **Agent** 时跳过自动加载 | 必要项目背景必须写入 `context` |
| **Memory** | 创建子 **Agent** 时跳过共享 **Memory** | 子 **Agent** 不应依赖父 **Session** 的长期记忆 |
| 用户交互 | 普通子 **Agent** 不能调用 `clarify` | 需要追问的问题应留给父 **Agent** |

普通 Leaf 子 **Agent** 默认不能继续委派，也不能写共享 **Memory**、向外部渠道发送消息或安排新的持久任务

模型侧 `delegate_task` **schema** 当前也不暴露 `toolsets` 和逐任务模型选择参数，具体版本差异在第十一节说明

危险操作审批还需要区分运行表面：

- 在经典 **CLI / TUI** 的子 **Agent** 工作线程中，危险命令默认自动拒绝，避免工作线程与父 TUI 争夺交互输入
- **Gateway** **Session** 使用独立 approval queue，不适用“一律自动拒绝”的概括
- `delegation.subagent_auto_approve: true` 可以改变经典线程路径的默认行为，但会扩大无人值守副作用风险

能力隔离不是为了让子 **Agent** 什么都做不了，而是为了保证它只能在父 **Agent** 的授权边界内完成明确子任务

### 六、并行与嵌套：Batch、Leaf 和 Orchestrator

#### 6.1、Batch 扩展的是并行宽度

`tasks` 数组中的每一项都会形成独立子 **Agent**：

```text
Parent Agent
  -> Child A：架构检查
  -> Child B：实现检查
  -> Child C：测试检查
```

它们有各自的 **Context** 和 **Child Session**，可以并行调用模型和工具，但仍可能共享同一个文件现场

默认最大并发数由下面配置控制：

```yaml
delegation:
  max_concurrent_children: 3
```

提高并发数会近似线性增加 **API**、**Token** 和外部工具压力，只有真正独立的子问题才适合并行

#### 6.2、Leaf 与 Orchestrator 决定委派深度

| 角色 | 能否继续调用 `delegate_task` | 适用场景 |
|---|---|---|
| `leaf` | 不能 | 默认角色，完成一个边界明确的子任务 |
| `orchestrator` | 配置允许时可以 | 子任务本身还需要拆分、等待并综合多个子结果 |

默认 `max_spawn_depth` 是 `1`，也就是扁平委派：

```text
Parent
  -> Leaf A
  -> Leaf B
  -> Leaf C
```

即使传入 `role="orchestrator"`，在默认深度下也会降级成 `leaf`

启用两层委派需要显式配置：

```yaml
delegation:
  max_spawn_depth: 2
  orchestrator_enabled: true
```

结构才会变成：

```text
Parent Agent
  -> Orchestrator Child
       -> Leaf Grandchild A
       -> Leaf Grandchild B
       -> 汇总后返回 Parent
```

嵌套深度与并发宽度会形成乘法成本，因此 **Orchestrator Child** 不应作为普通任务默认模式

对于当前技术方案评审，父 **Agent** 已经可以直接把三个检查面拆清楚，不需要再增加一层 Orchestrator

### 七、完整例子：并行评审一套技术方案

用户提出：

```text
检查这套技术方案的架构合理性、实现可行性和测试覆盖，并给出最终判断
```

父 **Agent** 先确认三个检查面彼此独立，且都能通过只读方式完成

然后调用：

```text
delegate_task(
  tasks=[
    {
      goal: "检查技术方案的架构合理性",
      context: "读取方案和架构文档，返回职责边界、依赖关系、风险与证据路径",
      role: "leaf"
    },
    {
      goal: "检查技术方案的实现可行性",
      context: "读取生产代码，返回真实调用链、改造点、阻塞项与证据路径",
      role: "leaf"
    },
    {
      goal: "检查技术方案的测试覆盖",
      context: "读取测试代码，返回已覆盖行为、缺口、验证建议与证据路径",
      role: "leaf"
    }
  ]
)
```

运行现场：

```text
Child A -> 架构结论
Child B -> 实现结论
Child C -> 测试结论
```

三个子 **Agent** 完成后，结果作为一组摘要回到原 Session

父 **Agent** 不能直接拼接三个答案，还要执行最终责任链：

```text
核对每个结论是否附带证据
  -> 回读关键文件或运行必要验证
  -> 比较架构结论与真实实现是否冲突
  -> 判断测试缺口是否影响最终推荐
  -> 形成统一结论和残余风险
  -> 回答用户
```

这个例子体现了 `delegate_task` 的正确责任分工：

```text
子 Agent 扩大证据覆盖面
父 Agent 保留判断权和交付责任
```

如果任务需要持续数小时、跨进程恢复、人工审批或命名 **Profile** 接力，就不再适合 `delegate_task`，而应进入 **Kanban**

### 八、生命周期与失败边界

#### 8.1、Background 不等于 Durable

当前顶层委派可以在背景工作线程运行，但相关执行状态仍主要依附当前 **Hermes** 进程

它不具备 **Kanban** 的持久化任务能力：

- 没有落成可跨进程认领的 **Task**
- 没有 **Dispatcher** 重启后重新派工
- 没有持久化 **Block / Unblock** 流程
- 没有命名 **Profile Worker** 接力
- 当前进程退出后，执行不能像 **Kanban Task** 一样恢复

所以：

```text
后台执行 = 当前对话不必阻塞
持久执行 = 即使进程或 Session 中断，任务仍能恢复
```

`delegate_task` 只满足前者

#### 8.2、失败仍由父 Agent 收口

子 **Agent** 可能因为 **Provider**、认证、**Tool**、迭代预算、中断、危险命令审批或 **Context** 不完整而失败

当前主要限制包括：

| 配置 | 默认值 | 含义 |
|---|---:|---|
| `max_concurrent_children` | `3` | 同时运行的子 Agent 上限 |
| `max_spawn_depth` | `1` | 默认只允许父 Agent 到 Leaf Child |
| `max_iterations` | `50` | 每个子 Agent 的独立迭代预算 |
| `child_timeout_seconds` | `0` | 默认不设置统一挂钟硬超时 |

父 **Session** 被停止、切换或进程关闭时，活跃子 **Agent** 可能被取消并产生 `interrupted` 状态

父 **Agent** 可以重新委派，但 `delegate_task` 不是具有持久化重试策略的工作队列

子 **Agent** 返回的 **Summary** 也是自述，不是自动成立的事实

对于文件写入、**HTTP** 请求、发布或远端修改，父 **Agent** 应要求返回 **URL**、**ID**、绝对路径、状态码等可验证句柄，再自行回读验证

### 九、使用判断：什么时候应该用 `delegate_task`

| 场景 | 推荐机制 |
|---|---|
| 只需要调用一次 **Tool** | 父 **Agent** 直接调用 **Tool** |
| 机械执行固定步骤，不需要独立推理 | `execute_code` 或普通 **Tool** 链 |
| 同一问题需要多个模型视角，但仍由一个 **Agent** 行动 | **Mixture of Agents** |
| 需要隔离上下文完成一项推理子任务 | `delegate_task` 单任务 |
| 有多个彼此独立的研究或检查面 | `delegate_task` **Batch** |
| 子任务还需要自己拆分并综合 | 谨慎使用 **Orchestrator Child** |
| 工作必须跨重启、可恢复、可人工介入 | **Kanban** |
| 需要命名 **Profile**、**Task Graph** 和长期审计 | **Kanban** |

简化判断：

```text
我自己一两个 Tool Call 就能做完
  -> 不委派

我需要一个临时同事独立研究，回来给我结论
  -> delegate_task

我需要把工作交给任务系统，之后还能恢复和接力
  -> Kanban
```

`delegate_task` 的合适任务通常满足：

- 子问题边界明确
- **Context** 可以自包含
- 子结果能用摘要交接
- 父 **Agent** 可以验证结果

需要频繁向用户追问、多个执行者必须编辑同一文件，或必须跨重启继续的任务，不适合使用 `delegate_task`

### 十、最终心智模型

```text
User
  -> Parent Agent Session
       -> 判断哪些子问题值得隔离
       -> 调用 delegate_task
            -> Runtime 校验并发与深度
            -> 创建进程内临时 Child AIAgent
                 -> fresh context
                 -> goal + context + workspace hint
                 -> inherited model / allowed toolsets
                 -> isolated child session / terminal state
                 -> tool calls and reasoning
                 -> final summary
            -> Completion Event 回到原 Parent Session
       -> Parent 回读和验证证据
       -> Parent 综合并回答 User
```

概念压缩：

```text
Parent Agent 是任务拆分者和最终责任人
delegate_task 是临时创建子 Agent 的 Runtime Tool
Child Agent 是同一 Hermes 进程内的一次隔离执行实例
goal 是子 Agent 的目标
context 是子 Agent 最可靠的业务背景输入
Batch 是多个独立子 Agent 的并行集合
Leaf 是不能继续委派的默认子 Agent
Orchestrator 是可以继续委派的高级子 Agent 角色
Summary 是子 Agent 返回父 Session 的主要交接物
Background 表示不阻塞当前回合，不表示任务可恢复
```

一句话收束：

> `delegate_task` 是父 **Agent** 在当前 **Hermes** 运行现场中临时扩展认知并行度的机制，子 **Agent** 隔离处理问题并返回摘要，但任务仍依附当前进程，最终判断仍属于父 **Agent**

与姊妹篇 **Kanban** 的最终对照：

```text
delegate_task：进程内临时同事，做完回来汇报
Kanban：持久任务系统，交给命名角色持续接力
```

### 十一、当前版本差异：官方说明页与源代码

截至 2026-07-15，部分官方说明页与当前官方 `main` 源代码存在时序差异：

| 主题 | 部分说明页描述 | 当前模型侧源代码行为 |
|---|---|---|
| 顶层执行方式 | 同步阻塞父 **Agent** | 默认背景执行，完成后重新进入原 **Session** |
| `background` | 可选择同步或背景 | 模型侧字段已废弃并忽略，顶层委派自动背景化 |
| `toolsets` | 父模型可按调用指定 | 模型侧 schema 不暴露，子 **Agent** 继承父 **Toolsets** 后再做限制 |
| `max_iterations` | 示例中可按调用指定 | 主要由全局 delegation 配置控制，模型侧 schema 未暴露 |

本文采用下面的事实优先级：

```text
当前运行中的源代码与 schema
  -> 当前配置默认值与测试
  -> 官方功能文档
  -> 历史示例和旧教程
```

**Hermes** 演进较快，生命周期和 **Tool Schema** 等高时效性行为应回到当前实现核验

### 十二、参考资料

- [Hermes Subagent Delegation 官方文档](https://hermes-agent.nousresearch.com/docs/user-guide/features/delegation)
- [Hermes `delegate_tool.py` 当前官方源代码](https://github.com/NousResearch/hermes-agent/blob/main/tools/delegate_tool.py)
- [Hermes `async_delegation.py` 当前官方源代码](https://github.com/NousResearch/hermes-agent/blob/main/tools/async_delegation.py)
- [姊妹篇：Hermes Kanban 多 Agent 编排机制](./05、Hermes%20Kanban%20多%20Agent%20编排机制.md)
