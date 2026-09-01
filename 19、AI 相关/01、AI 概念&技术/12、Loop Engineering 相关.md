## Loop Engineering 相关

### 一、Loop Engineering 是什么

#### 1.1、从人提示 Agent 到系统提示 Agent

**LLM** 能调用工具之后，容易产生一种错觉：==只要让 **Agent** 多运行几轮，它就会越来越接近正确答案==，但是：

- **没有可靠状态、可信反馈和停止条件，重复执行只会扩展错误**
- **没有跨任务证据和发布治理，所谓自我改进还可能把偶然现象固化成系统规则**

2026 年 6 月，许多 **Coding Agent** 实践者不约而同地把注意力从 “**下一条 Prompt 该怎么写**”，转向 “**怎样让一个系统自己找到工作、交给 Agent、检查结果，再决定接下来做什么**”

**Peter Steinberger** 把这种模式概括为“**设计能够提示 Agent 的 Loop**”，**Boris Cherny** 也分享过类似的工作方式

之后，**Addy Osmani** 在 [Loop Engineering](https://addyosmani.com/blog/loop-engineering/) 中把这些正在发生的实践放到一起，并将这种工作模式称作 **Loop Engineering** 

如果只看最核心的变化，可以这样理解：

```text
Prompt Engineering：想清楚这一次该怎样告诉 Agent
Loop Engineering：想清楚下一次由什么触发、带着什么状态，又根据什么结果继续
```

**Loop Engineering** 并不是不要 **Prompt**，而是不再要求人守在旁边一轮轮接着写

系统会根据当前状态和上一轮结果，决定什么时候再次调用 **Agent**，以及下一次应该告诉它什么

#### 1.2、为什么一个 Loop 不够

以本文贯穿始终的文档修复任务为例：

> 团队希望文档 **Agent** 自动接收群聊消息中的请求，读取仓库、修改内容、检查链接与 **CI**，最终创建 **PR**

一个 **Agent Loop** 可以反复读取仓库、修改文档和修复错误，却不能可靠地包办整项工作

因为同一个 **Loop** 同时决定**任务是否开始、下一步做什么、结果是否合格以及以后如何运行**的话，它就既是**执行者**又是**验收者**，**所有判断都来自自身，错误也就失去了被独立发现和阻断的机会**

所以，==一个真实任务需要把**启动**、**执行**、**验收**和**改进**交给依据不同反馈的 **Loop**==，再将它们连接成完整工作流

#### 1.3、完整任务需要哪些 Loop

沿着一个任务从发生到结束的过程，系统需要解决四个问题：

- **何时启动**：**Event-driven Loop** 发现任务
- **如何推进**：**Agent Loop** 持续行动
- **谁判完成**：**Verification Loop** 独立验收
- **如何变好**：**Improvement Loop** 改进未来运行

> 记忆主线是：**启动 → 推进 → 完成 → 变好**

![image-20260821112219849](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20260821112219849.png)

#### 1.4、Loop Engineering 的本质

四类 **Loop** 不是为了让系统显得更高级，而是把原本集中在人身上的控制责任分离出来：

- **Event-driven Loop**：谁有权启动一次任务
- **Agent Loop**：谁在任务内决定下一步行动
- **Verification Loop**：谁有权判定任务结束
- **Improvement Loop**：谁能改变未来任务使用的系统版本

因此，本文将 **Loop Engineering** 定义为：

> ==在不同时间尺度上设计任务的启动权、行动权、结束权与演进权，并让每次再次进入都携带可信状态、反馈和停止边界==

### 二、Loop Engineering 的整体运行模型

#### 2.1、它组织的是两条生命周期

**LangChain** 在 [The Art of Loop Engineering](https://www.langchain.com/blog/the-art-of-loop-engineering) 中提出 **Event-driven Loop**、**Agent Loop**、**Verification Loop**与 **Hill-climbing Loop**

这套表达容易被误读成四层逐级套娃，但更准确的理解是两条相互连接的生命周期：

```text
任务运行生命周期
Event → Task Run → Agent 执行 → Verification → Outcome

系统演进生命周期
多次 Trace + Outcome → 归因 → 候选修改 → Eval / Review / Gray → Harness vN+1
```

![image-20260821112311954](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20260821112311954.png)

第一条生命周期处理一次真实任务，通常持续数秒到数小时；第二条生命周期处理多次任务暴露的系统性问题，通常跨越数天或一个版本周期

它们通过两种对象连接：

- **Trace** 记录模型决策、工具调用、验证反馈和中间过程
- **Outcome** 记录任务结束后环境中真实存在的结果，例如 PR 是否创建、链接是否有效、CI 是否通过

只保存 Trace，系统只能知道“Agent 做过什么”；只有同时保存 Outcome，才有依据判断“这些行动是否真的产生了有效结果”

第二条生命周期也不能反向修改正在运行的当前任务，它产生的是 Harness 候选版本，经验证发布后只影响未来 Task Run

这条时间边界非常重要：当前任务负责完成工作，跨任务改进负责改变未来系统，两者不能共享未经验证的修改权

#### 2.2、什么才算工程闭环

程序中的 `while`、**Cron** 和消息队列重复消费都可以形成循环，但并不天然构成工程闭环

一个可控 **Loop** 至少包含：

```text
目标 → 状态 → 行动 → 观测 → 判定 → 停止／再次进入
```

- **目标** 规定这一轮要改变什么
- **状态** 保存开始前已经发生了什么
- **行动** 由模型、工具或确定性程序改变环境
- **观测** 从环境中取得真实结果
- **判定** 由明确标准决定通过、失败或继续
- **停止／再次进入** 限制重试、成本、权限和人工接管

闭环的关键不是箭头最终回到起点，而是结果能够改变下一轮行为

```text
重复执行：A → A → A
反馈闭环：A → 结果 → 判断 → 携带反馈的 A'
```

没有状态，每轮都会重新发现同一个问题；没有外部观测，模型只能根据自己的文字评价自己；没有停止条件，失败会变成无限重试；没有责任边界，循环可能执行不可逆动作，却无人承担判定责任

因此：

> ==重复不产生可靠性，只有携带可信反馈、明确状态与停止条件的重复，才构成工程闭环==

#### 2.3、Loop 与 Workflow 的边界

**Workflow** 与 **Loop** 可以组合，但负责不同问题：

```text
Workflow：预先定义步骤和责任如何流转
Loop：根据反馈决定是否再次进入某一步或某个系统
```

文档任务可以用确定性 **Workflow** 固定外部骨架：

```text
接收请求 → 创建隔离工作区 → 执行修改 → 运行验收 → 创建 PR
```

其中“执行修改”内部允许 **Agent Loop** 根据仓库状态动态决定步骤；“运行验收”失败后通过 **Verification Loop** 把结构化反馈送回执行阶段

生产系统通常不是把所有步骤都交给 **Agent**，而是用 **Workflow** 固定责任边界，只把无法预先编码的局部判断交给模型

### 三、一次文档任务如何穿过完整系统

#### 3.1、Event-driven Loop 创建 Task Run，而不是直接调用模型

群聊中出现文档修复请求后，**Event-driven Loop** 不会直接调用模型，而是先校验事件、过滤重复请求，再创建一次可追踪的 **Task Run**

**Task Run** 固化任务来源与范围、仓库和工作区、运行版本、资源预算以及人工审批点，作为 **Runtime** 执行和恢复任务的结构化契约

> **Event 决定任务是否进入系统，不决定任务应该怎样完成**

#### 3.2、Agent Loop 在任务内部取得行动权

**Runtime** 根据 **Task Run** 准备工作区和 **Context**，然后启动 **Agent Loop**：

```text
Model 读取目标与当前状态
→ 决定调用哪个 Tool
→ Runtime 校验权限并执行 Tool
→ Tool 改变文件或读取环境
→ Observation 写回当前任务状态
→ Model 基于新状态继续判断
```

其中，**Model** 选择下一步行动，**Runtime** 保存状态并执行策略，**Tool** 才真正读取或改变文件

> **Model 负责选择，Runtime 负责执行，Tool 负责改变环境**

循环结束时，**Agent** 只能提交候选结果，不能自行宣布整个任务完成

#### 3.3、Verification Loop 掌握结束权

候选修改产生后，**Verification Loop** 检查文件 **Diff**、链接、格式与 **CI**，而不是接受 **Agent** 的完成声明

```text
候选结果 → 独立验证
              ├─ 通过：进入交付
              ├─ 失败：携带反馈返回 Agent Loop
              └─ 超出预算或风险边界：交给人工
```

验证优先使用能够复现和审计的环境结果；无法确定性判断的内容，再交给独立 **Agent** 或人工评审

> **Agent 产生候选结果，Verifier 决定任务能否结束**

#### 3.4、任务结束后留下两类证据

任务通过后，系统创建 **PR**，并留下两类证据：

- **Trace** 解释过程，适合定位在哪一步偏离
- **Outcome** 证明结果，适合判断任务是否真正成功

因此，**Outcome** 不能只记录“链接检查通过”，还要包含内容完整性、修改范围和构建状态等不可退化的约束，否则删除问题内容也可能被误判为成功

> **Trace 解释过程，Outcome 证明结果**

到这里，一次任务已经闭环，但系统还没有发生自我改进

### 四、从一次任务到跨任务的受控改进

#### 4.1、为什么大量运行之后才需要 Improvement Loop

一两次失败通常只需要修复当前任务；只有同类问题在多次运行中反复出现，系统才有理由怀疑 **Harness** 存在稳定缺陷

例如，多次文档任务都修改了请求范围之外的文件，问题可能来自请求、**Prompt**、检索、**Tool**、验证规则或模型版本

**Trace** 能帮助定位现象出现在哪里，却不能自动证明根因；分析 **Agent** 给出的归因也只是等待验证的假设

> **一次失败修任务，多次同类失败才考虑改系统**

因此，**LangChain** 所称的 **Hill-climbing Loop**，更适合被理解为基于跨任务证据推进的受控改进，而不是系统每运行一轮就会自动变好

#### 4.2、可信改进必须闭合到下一版 Harness

![image-20260821112338925](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20260821112338925.png)

系统从多次运行中收集 **Trace**、**Outcome**、成本与人工反馈，形成问题假设，再修改 **Context**、**Prompt**、**Tool**、策略、验证器或模型版本

这些修改首先只是 **Harness** 候选版本，必须经过离线 **Eval**、回归检查、人工审批和灰度，才能进入未来的 **Task Run**

候选修改不能直接进入生产，因为某项指标变好，并不代表任务整体变好

例如：

- 如果验收规则只检查“是否还有失效链接”，**Agent** 删除包含链接的整段内容也能通过检查，链接问题看似解决了，文档质量却变差了


因此，**Eval** 既要验证目标问题是否改善，也要检查内容完整性、修改范围、成本和安全等约束

**Anthropic** 在 [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) 中也强调，自动 **Eval** 还需要与生产监控、用户反馈和人工审查结合

> **改进闭环的返回箭头，不是 Trace 回到 Agent，而是经过验证的新 Harness 进入未来任务**

#### 4.3、更多 Loop 不等于更高成熟度

每增加一层 **Loop**，都会增加延迟、成本、状态空间、并发冲突和治理难度

只有当现有系统反复暴露某类问题，而且评估能够证明新机制有效时，增加 **Loop** 才有意义

这也引出了更基础的问题：这些**状态**、**工具**、**权限**、**验证**和**版本机制**由什么承载，又如何被工程化，答案指向 **Harness Engineering**

### 五、当前的工程主线：先做好 Harness，再谈 Loop

先给出本文的判断：

> ==截至 2026 年 8 月，**Harness Engineering** 已经能够直接改善 **Agent** 的可靠性；==
>
> ==完整的 **Loop Engineering**，尤其是跨任务自动改进，仍然是一种前置条件很高的系统能力==

两者不是需要二选一的竞争方案，而是存在明确的依赖顺序：

> - **Harness Engineering**：先让 **Agent** 在一次任务中看得见、做得到、记得住、验得过
> - **Loop Engineering**：再让这套系统持续启动、反复运行，并根据跨任务证据演进

#### 5.1、Harness 解决的是今天已经存在的问题

**Model** 只提供推理、规划和生成能力，**Agent** 最终能否完成任务，还取决于模型之外的整套 **Harness**：它如何取得上下文、调用工具、保存状态、执行命令、接受验证以及在失败时停止或交给人

这个视角最重要的认知更新是：**Agent 的失败不再被笼统归因于“模型不够聪明”，而是可以被拆成具体的工程缺口**

- 看不懂项目，检查上下文和知识入口
- 长任务失忆，检查状态保存与跨会话交接
- 修改越界，检查工具权限与工作区隔离
- 错误宣布完成，补充独立验证与完成证据

这些问题都有明确的工程对象，可以实现、测试、观察和回滚

**OpenAI** 在 [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/) 中展示了这条路径：把仓库知识、工作区、浏览器、日志、指标、**Lint** 与 **CI** 变成 **Agent** 可以读取和使用的环境能力，并用机械约束守住架构边界

**Anthropic** 的 [长任务实验](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) 也从同一层入手：初始化环境、拆分任务、保存进度，并通过文件与 **Git** 历史把状态交给下一次运行

> **Harness 把 Agent 问题变成了可以立即动手解决的工程问题**

#### 5.2、Loop 的可靠运行依赖成熟 Harness

四类 **Loop** 都不是悬空运行的：

- **Event-driven Loop** 需要任务契约、幂等、权限与隔离
- **Agent Loop** 需要工具、状态、执行环境与停止条件
- **Verification Loop** 需要可复现环境、验收标准与可信结果
- **Improvement Loop** 需要稳定 Trace、回归集、版本管理、审批、灰度与回滚

这些能力都属于 **Harness** 或传统工程基础设施，**Harness** 尚不可靠时，增加 **Loop** 只会让不确定性运行得更久、触发得更频繁、影响得更广

所以二者的关系不是“静态系统”和“动态系统”并列，而是：

> **Harness 先提供可靠运行的条件，Loop 再放大这套系统的运行范围与时间尺度**

#### 5.3、Loop Engineering 超前在哪里

并非四类 **Loop** 都离落地很远

- 工具调用循环、有限重试和事件触发已经有成熟实现；

- 任务级验证在成功标准明确时也能够可靠工作

这些机制大多已经存在于 **Agent Harness**、测试系统、消息队列和工作流平台中

真正超前的是 **Improvement Loop**：系统要从多次运行中判断什么是稳定缺陷，找到可能的责任组件，提出修改，再证明新版本没有造成其他退化

这条链路中的归因、**Eval** 覆盖、版本治理和发布责任，目前仍然需要大量人工判断

现有实践更可靠的做法，也是让系统自动发现问题、生成候选修改，再由评估与人审决定是否发布，而不是让 Agent 在线改写自己

因此，更准确的结论不是“**Loop Engineering** 不可行”，而是==现在应该投资 **Harness**，选择性地使用任务级 **Loop**，并把自动改进留在有人审、有回归、可回滚的边界内==

### 六、总结：Loop Engineering 的价值与边界

**Loop Engineering** 最有价值的地方，是把关注点从“一次怎样提示 **Agent**”，推进到“系统如何在不同时间尺度上持续工作”

它提醒我们，一项真实任务至少包含四种不同责任：

- 事件决定何时启动
- **Agent** 负责推进任务
- **Verifier** 判断能否结束
- 改进机制决定如何影响未来系统

但这套表达也容易制造一种错觉：仿佛只要叠加更多 **Loop**，系统就会越来越成熟

事实恰好相反，前三类 **Loop** 主要建立在现有 **Agent Harness**、测试体系与事件驱动基础设施之上；最有想象力的 **Improvement Loop**，又依赖最困难的归因、**Eval**、版本治理、审批与回滚

因此，本文对 **Loop Engineering** 的最终判断是：

> ==它是一种理解 **Agent** 运行与演进的有用视角，但还不是比 **Harness Engineering** 更基础、更应优先投入的工程范式==

实践顺序也应由此确定：先建立可靠 **Harness**，再加入任务级验证；单次运行稳定后接入事件，积累足够证据后才尝试有人审、可回滚的改进闭环

读完整篇文章，可以用三个层次恢复整个模型：

- **Model**：提供推理、规划与生成能力
- **Harness**：提供 **Context**、**Tool**、**Runtime**、**State**、**Policy** 与 **Evidence**
- **Loop**：组织系统何时启动、如何反馈、何时停止与怎样再次进入

最终只需要记住三句话：

> ==**Harness** 定义系统，**Loop** 推进系统==
>
> ==重复不产生可靠性，可信反馈才产生闭环==
>
> ==自动修改不等于自我改进，经过验证、审批与回滚保护的修改才算工程演进==

### 参考资料

- [LangChain：The Art of Loop Engineering](https://www.langchain.com/blog/the-art-of-loop-engineering)
- [LangChain：The Anatomy of an Agent Harness](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)
- [Addy Osmani：Loop Engineering](https://addyosmani.com/blog/loop-engineering/)
- [Anthropic：Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Anthropic：Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [Anthropic：Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [OpenAI：Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)
