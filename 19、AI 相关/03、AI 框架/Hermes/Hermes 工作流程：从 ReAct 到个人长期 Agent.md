## Hermes 工作流程：从 ReAct 到个人长期 Agent

> 文档定位：这不是 **Hermes** 源码逐行解读，也不是 **Python** 语法笔记
>
> 阅读目标：先把标准 **ReAct** 循环映射到 **Hermes** 的具象工作流，建立阅读源码前的中间模型
>
> 适用读者：已经理解 **LLM + Tool + Observation** 基本循环，但还没有形成 **Hermes** 运行时全局图的读者

### 一、先把标准 Agent 工作流压缩成最小模型

标准 **ReAct** 模型可以先压缩成一条最小循环：

```text
User Goal
  -> LLM 思考下一步
  -> Tool 执行动作
  -> Observation 返回结果
  -> LLM 基于 Observation 继续决策
  -> Final Answer
```

这个模型是对的，但它还太粗

它只说明了 **Agent** 有推理、行动和反馈，却没有回答真实工程里的几个关键问题：

| 问题 | 标准 ReAct 模型通常不会细讲 |
|---|---|
| 用户请求从哪里进入 | CLI、TUI、Gateway、API、消息平台入口 |
| 每轮模型能看到什么 | system prompt、用户输入、历史消息、工具说明、记忆、技能 |
| Tool 为什么可用 | 内置工具、MCP 工具、插件工具、权限过滤 |
| Observation 放在哪里 | 当前上下文、session、日志、可能的 memory / skill 候选 |
| 多轮什么时候停止 | final answer、iteration budget、错误中断、人工确认 |
| 任务结束后留下些什么 | session 轨迹、memory 更新、skill 沉淀、日志和审计记录 |

也就是说，**ReAct** 是行为骨架，**Hermes** 是把这套骨架产品化、长期化、个人化之后形成的 **Agent Runtime**

如果只用最小 **ReAct** 去读 **Hermes** 源码，会看到很多“看似额外”的模块：

- **Session**
- **Memory**
- **Skill**
- **Profile**
- **Context Compression**
- **Gateway**
- **Runtime Defense**

这些不是装饰功能，而是把一次性任务执行变成个人长期代理所需的工程结构

### 二、Hermes 对标准 ReAct 的第一层扩展：运行时编排

先看一次请求在 **Hermes** 里的具象化路径

```text
用户输入
  -> 入口层
  -> AIAgent Runtime
  -> Prompt / Context 构建
  -> Model Provider 调用
  -> Tool 调度
  -> Observation 回写
  -> Session 持久化
  -> 下一轮决策或最终响应
```

这条链路可以理解为标准 **ReAct** 的工程展开版

| 标准 ReAct | Hermes 中更具体的角色 | 主要职责 |
|---|---|---|
| User Goal | 入口层 | 接收 CLI、TUI、Gateway 或平台消息 |
| LLM 思考 | **AIAgent Runtime** | 控制每轮执行、停止条件、状态推进 |
| Prompt | **Prompt / Context** 构建 | 组装规则、历史、工具说明、记忆和技能 |
| Model Call | **Model Provider** | 屏蔽不同模型 API 的差异 |
| Tool | **Tool System** | 发现、过滤、暴露和执行工具 |
| Observation | 工具结果与执行反馈 | 返回给下一轮模型决策 |
| Trace | **Session** | 保存任务过程、消息、工具观察和血缘状态 |

这里最重要的是边界，不是源码细节

#### 2.1、入口层只负责把请求带进来

入口层可以是命令行、终端 UI、Gateway、Telegram、Discord 或其他平台

它不应该负责真正的 **Agent** 推理，也不应该理解所有工具细节

它的核心职责是：

- 接收用户输入
- 做必要的身份、会话、格式转换
- 把请求交给 **AIAgent Runtime**
- 把最终响应送回用户所在的入口

所以阅读 **Gateway** 或 CLI 相关代码时，要先问：

```text
这里是在处理平台协议，还是已经进入 Agent Runtime
```

如果还在处理消息平台、终端参数、HTTP 请求、session id 映射，它通常仍属于入口适配层

#### 2.2、AIAgent Runtime 负责控制循环

**AIAgent Runtime** 是把 **LLM**、上下文、工具、观察结果和停止条件串起来的编排器

它不是模型本身，也不是工具本身

它更像一个任务执行内核：

```text
准备上下文
  -> 调用模型
  -> 判断模型是否要调用工具
  -> 执行工具
  -> 收集 Observation
  -> 写回当前任务状态
  -> 判断继续或结束
```

用 **JS / TS** 类比，可以先把它想成一个 `AgentRuntime.run()`：

```text
while not done:
  context = buildContext(session, memory, tools, skills)
  modelResult = provider.complete(context)
  actions = parseActions(modelResult)
  observations = toolRunner.execute(actions)
  session.append(modelResult, observations)
  done = shouldStop(modelResult, observations, budget)
```

真实 **Hermes** 会比这个复杂，但源码阅读时先抓这条主线

#### 2.3、Prompt / Context 不是简单字符串拼接

在普通 Chat 里，prompt 可能只是几段文本

在 **Hermes** 这类长期 **Agent** 里，context 是一个分层输入系统：

| 输入层 | 内容 |
|---|---|
| 稳定规则 | system prompt、行为边界、安全策略 |
| 当前任务 | 用户目标、当前消息、任务状态 |
| 工具说明 | 本轮允许模型调用哪些工具 |
| Session 历史 | 当前任务已经发生了什么 |
| Memory | 可能影响当前任务的长期信息 |
| Skill | 可复用的工作流程经验 |
| Observation | 上一轮工具调用的结果 |

所以 **Prompt / Context** 构建要解决的问题不是“写一段好 prompt”，而是：

```text
在这一轮决策中，模型应该看到哪些信息，不应该看到哪些信息
```

这也是为什么后面会出现上下文压缩、记忆检索、技能索引和工具按需暴露

#### 2.4、Provider 屏蔽模型差异

标准 **ReAct** 模型里通常只写 `call LLM`

真实系统里，模型服务可能来自不同平台、不同协议、不同返回格式

**Model Provider** 的职责是把这些差异收敛成运行时能理解的统一接口

它主要处理：

- 请求格式
- tool calling 格式
- streaming 或非 streaming
- 错误和重试
- finish reason
- provider-specific 参数

所以读 provider 相关代码时，不要把它理解成 **Agent** 的决策核心

它更像模型访问适配层，核心目标是让 **AIAgent Runtime** 不直接绑定某一家模型 API

#### 2.5、Tool System 把模型决策变成外部动作

**Tool** 是模型可以调用的外部能力

在 **Hermes** 中，工具系统不只是“有几个函数可以调用”，它还需要处理：

- 工具发现
- 工具注册
- 工具权限
- 工具描述
- 参数校验
- 执行后结果格式化
- 危险操作控制

标准 **ReAct** 只说 `Action -> Observation`

**Hermes** 要回答的是：

```text
这个 action 为什么存在
这一轮为什么允许调用它
调用参数是否合法
执行环境是否安全
结果如何回到模型上下文
```

#### 2.6、Observation 是下一轮决策输入，不等于长期记忆

工具执行结果首先应该进入当前任务上下文

也就是说，**Observation** 的第一身份是：

```text
下一轮 LLM 决策所需的反馈
```

它可能被保存到 **Session**，因为 **Session** 要记录任务过程

但它不应该默认变成长期 **Memory**

原因很简单：工具输出可能是临时状态、错误结果、过期信息、噪声，甚至可能包含不可信网页内容

是否沉淀为 **Memory** 或 **Skill**，需要后续的筛选、总结和质量控制

### 三、Hermes 对标准 ReAct 的第二层扩展：个人长期 Agent

普通 **ReAct** 更像一次性任务执行模型

它关心的是：

```text
这次任务如何完成
```

**Hermes** 的目标更接近个人长期代理，它还要关心：

```text
这次任务完成后，系统是否更了解我
下次类似任务是否能做得更好
这个 Agent 是否能长期运行在我的环境里
```

因此，**Hermes** 在标准 **ReAct** 外面增加了几类长期结构

| 概念 | 边界 | 解决的问题 |
|---|---|---|
| **Session** | 当前任务或一次会话的状态容器 | 记录发生过什么，支持恢复、压缩、追踪 |
| **Memory** | 跨会话长期信息 | 保存用户偏好、项目事实、长期经验 |
| **Skill** | 可复用工作流程经验 | 保存“以后遇到类似任务怎么做” |
| **Profile** | 实例级配置和数据边界 | 支持不同用户、项目、环境隔离 |

这四者不要混在一起

#### 3.1、Session：任务过程的持久化容器

**Session** 更接近任务轨迹，不是简单聊天记录

它可以保存：

- 用户输入
- 模型响应
- 工具调用
- Observation
- 当前任务进度
- 压缩前后的上下文血缘

它解决的问题是：

```text
当前任务发生过什么
如果上下文变长、进程重启或需要审计，系统如何恢复和追踪
```

所以 **Session** 是“过程状态”

它可以为长期记忆提供素材，但不是长期记忆本身

#### 3.2、Memory：跨任务保留的长期信息

**Memory** 是跨 session 复用的信息

它适合保存：

- 用户偏好
- 项目约定
- 长期目标
- 稳定事实
- 可复用结论

它不适合无差别保存：

- 每一次工具输出
- 临时错误
- 未验证推断
- 一次性路径
- 不可信网页原文

**Memory** 的核心问题不是“怎么记更多”，而是：

```text
什么值得记，什么时候读取，以什么信任级别进入上下文
```

#### 3.3、Skill：可复用的工作流程经验

**Tool** 是能力，**Skill** 是经验

可以这样区分：

```text
Tool = 系统可以做什么
Skill = 遇到某类任务时应该怎么组织这些能力
```

例如：

```text
Tool:
  - 读文件
  - 搜索代码
  - 执行命令
  - 操作浏览器

Skill:
  - 修复 CI 失败时，先查 PR 状态，再看失败 job，再抓日志，再定位代码，再验证
```

**Skill** 可以包含工具组合、流程顺序、判断标准、注意事项和历史经验

这就是 **Hermes** 的 self-improving 重点：不是简单增加工具数量，而是让 **Agent** 从任务轨迹中沉淀更好的工作方法

#### 3.4、Profile：个人代理的实例边界

如果 **Hermes** 是长期个人代理，就必须区分不同实例、不同用户、不同项目和不同运行环境

**Profile** 解决的是运行时边界问题：

- 配置隔离
- 数据隔离
- 工具启用范围
- 模型 provider 配置
- memory / skill / session 的归属

没有 **Profile**，长期 **Agent** 很容易把不同项目、不同身份、不同环境里的上下文混在一起

这也是个人长期代理和一次性 **Agent Demo** 的重要差异

### 四、Hermes 的学习闭环

标准 **ReAct** 到任务完成就结束了

**Hermes** 更关心任务结束后是否能沉淀经验

可以把学习闭环理解为：

```text
任务执行
  -> Observation 进入当前上下文
  -> Session 持久化任务轨迹
  -> 从轨迹中识别可复用经验
  -> 写入 Skill / Memory
  -> 后续任务按需加载
  -> 新任务执行得更稳定
```

这里有两条不同的回流路径

#### 4.1、从任务轨迹到 Memory

当任务中出现稳定事实、用户偏好或长期项目约定时，才适合进入 **Memory**

例如：

- 用户偏好正式、工程化表达
- 某个项目固定使用 `pnpm`
- 某个仓库的测试命令是 `pnpm test`
- 某个部署环境有固定路径

这些信息会影响后续任务决策

但写入前需要判断：

- 是否稳定
- 是否已经验证
- 是否可能过期
- 是否包含敏感信息
- 是否来自可信来源

#### 4.2、从任务轨迹到 Skill

当任务中出现可复用流程时，更适合沉淀为 **Skill**

例如：

```text
遇到 GitHub Actions 失败
  -> 查 PR 和 check run
  -> 找失败 job
  -> 下载日志
  -> 定位失败测试
  -> 本地复现
  -> 修改代码
  -> 重新运行验证命令
```

这不是单条事实，而是一套工作方法

所以它应该是 **Skill**，不是 **Memory**

#### 4.3、学习闭环为什么需要约束

自我改进听起来很自然，但工程上风险很高

如果每次任务都自动沉淀经验，系统可能会：

- 把偶然路径固化成规则
- 把错误观察写成长期记忆
- 把不可信网页内容当成经验
- 让过期结论长期影响后续任务
- 让上下文越来越大、越来越噪

因此，**Hermes** 需要学习闭环，同时也需要学习边界

```text
Learning Loop 的目标不是让 Agent 什么都记住
而是让稳定、可复用、可信的信息在未来正确时刻重新出现
```

### 五、Hermes 为什么需要工程防御

当 **Agent** 从一次性调用变成长期运行的个人代理，工程风险会明显增加

这就是 **Hermes** 需要很多防御机制的原因

#### 5.1、上下文压缩：解决长对话失控

标准 **ReAct** 可以假设上下文很短

真实任务会产生大量信息：

- 多轮模型响应
- 工具调用参数
- 命令输出
- 文件内容
- 错误日志
- 网页内容
- 中间计划

如果全部塞回 prompt，会出现三个问题：

- token 成本失控
- 旧信息挤掉关键信息
- 噪声让模型决策质量下降

**Context Compression** 的目标是保留任务连续性，而不是保留所有原文

源码阅读时重点看：

```text
什么内容被裁剪
什么内容被总结
总结后如何保持可追踪
压缩是否影响后续工具调用
```

#### 5.2、配置与 Profile：解决多实例和个人环境隔离

长期个人代理一定会接触个人数据、项目数据、模型配置和工具配置

这些内容不能混在一个全局空间里

**Profile** 的意义是把运行实例边界固定下来：

```text
当前使用哪个模型
当前启用哪些工具
当前读写哪套 session / memory / skill
当前属于哪个用户或项目环境
```

这比普通 demo 的配置文件复杂，但它解决的是长期运行时的隔离问题

#### 5.3、Runtime Defense：解决真实副作用

工具调用会影响真实环境

比如：

- 删除文件
- 修改代码
- 执行 shell 命令
- 访问网络
- 写数据库
- 操作浏览器

所以 **Agent Runtime** 不能只负责“把工具跑起来”，还要考虑：

- 哪些工具允许使用
- 哪些命令需要拒绝或确认
- 失败后如何回收资源
- 输出过大时如何处理
- 子进程如何关闭
- 长时间任务如何超时

这就是运行时防御

#### 5.4、Testing：解决 Agent 行为不可预测

普通函数的测试通常是输入确定、输出确定

**Agent** 的复杂点在于：

- 模型输出可能变化
- 工具调用路径可能变化
- 外部环境可能变化
- 上下文可能被压缩
- 记忆可能影响后续结果

因此，测试重点不只是“模型回答对不对”，还包括：

- 配置加载是否稳定
- session 隔离是否可靠
- 工具是否按权限暴露
- provider fallback 是否正确
- 上下文压缩是否保留关键状态
- 失败路径是否可恢复

### 六、回到源码阅读时应该看什么

现在不需要逐行看懂 **Python** 源码

读 **Hermes** 源码或教程时，每一章先只抓六个问题

#### 6.1、入口是谁

先找到这一段逻辑从哪里开始

它可能来自：

- CLI 命令
- Gateway 消息
- Runtime 方法
- Provider adapter
- Tool runner
- Memory provider

不要一上来就看类和函数细节

先判断它处在工作流里的哪一层

#### 6.2、输入是什么

看这一段拿到了什么数据：

- 用户输入
- session id
- message list
- config
- tools
- memory
- skill index
- model response
- observation

输入决定了它的职责边界

#### 6.3、输出是什么

看它把什么交给下一层：

- prompt / context
- provider request
- tool call
- observation
- session update
- final answer
- memory / skill 候选

输出决定了控制流怎么继续

#### 6.4、状态写到哪里

这是阅读长期 **Agent** 的关键

每次看到保存逻辑，都要区分：

| 写入位置 | 含义 |
|---|---|
| 当前上下文 | 下一轮模型马上要用 |
| **Session** | 当前任务轨迹和状态 |
| **Memory** | 跨任务长期信息 |
| **Skill** | 可复用工作流程经验 |
| 日志 | 排查、审计和观测 |
| Profile 目录 | 当前实例的数据边界 |

不要把所有写入都理解成“记忆”

#### 6.5、下一步谁接手

读完一个源码块后，要问：

```text
这段代码结束后，控制权交给谁
```

可能是：

- 回到 **AIAgent Runtime** 继续循环
- 交给 provider 调模型
- 交给 tool runner 执行工具
- 写入 session 后结束
- 触发压缩或学习逻辑
- 返回入口层给用户

能回答这个问题，源码块才会从碎片变成拼图

#### 6.6、体现了什么设计取舍

最后再看作者想说明的设计思想

常见取舍包括：

- 同步编排 vs 全异步
- 本地文件 / SQLite vs 远程服务
- 个人长期代理 vs 多租户平台
- 技能沉淀 vs 只增加工具
- 按需加载上下文 vs 全量历史塞 prompt
- 运行时防御 vs 完全信任模型

源码细节服务于这些取舍

如果一段源码看不懂，可以先跳过语法细节，只记录它处在这六个问题里的哪个位置

### 七、把 Hermes 放回标准 ReAct

可以用这张图作为后续阅读的总索引：

```text
标准 ReAct:

User Goal
  -> LLM
  -> Tool
  -> Observation
  -> Next LLM Step
  -> Final Answer

Hermes:

User Goal
  -> CLI / TUI / Gateway / Platform Adapter
  -> AIAgent Runtime
  -> Prompt / Context Builder
       - system rules
       - session history
       - available tools
       - relevant memory
       - relevant skills
  -> Model Provider
  -> Tool System
       - built-in tools
       - MCP tools
       - plugin tools
       - permission / safety filtering
  -> Observation
  -> SessionDB
       - messages
       - tool calls
       - observations
       - compression lineage
  -> Learning Loop
       - memory candidate
       - skill candidate
       - background review
  -> Next AIAgent Runtime Step
  -> Final Answer
```

这张图的重点不是模块名字，而是两条主线

第一条是执行主线：

```text
输入 -> 上下文 -> 模型 -> 工具 -> 观察 -> 下一轮
```

第二条是长期主线：

```text
任务轨迹 -> session -> memory / skill -> 后续任务复用
```

理解这两条主线后，再去读 **Hermes** 第 3 章、第 4 章这类源码导读，代码块就不再是零散片段，而是能挂到一张明确的工作流地图上

### 八、最小复盘框架

后续每读完一章，可以只写这张表

| 问题 | 记录 |
|---|---|
| 这一章解决什么 Agent 工程问题 |  |
| 它属于执行主线还是长期主线 |  |
| 入口函数 / 核心类是谁 |  |
| 输入数据是什么 |  |
| 输出或状态变化是什么 |  |
| 状态写入哪里 |  |
| 下一步谁接手 |  |
| 对标准 ReAct 做了什么扩展 |  |
| 如果用 JS / TS 写，等价结构是什么 |  |

这个表比逐行摘抄源码更重要

因为当前阶段的目标不是证明自己看懂了 **Python**，而是先让 **Hermes** 的工作流在脑海里成形
