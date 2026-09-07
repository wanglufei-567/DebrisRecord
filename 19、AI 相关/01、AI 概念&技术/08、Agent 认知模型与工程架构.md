## Agent 认知模型与工程架构

让 **LLM** 回答“怎样修复一个启动失败的 **Vite** 项目”，它可以给出一系列的排查建议；但只有让它真正读取项目、运行命令、修改文件并用测试结果继续修正，系统才开始表现出 **Agent** 的特征

两者的差别不只是“有没有工具”，而是系统是否**围绕目标**形成了可持续的**环境反馈闭环**：它能观察真实状态、选择行动、接收结果，并依据成功条件决定继续、停止或交还控制权

> **Agent** 是围绕目标作用于环境、根据真实反馈持续调整行动的软件系统
>
> **LLM** 提供概率性决策，**Harness** 将这种决策接入可执行、可验证、可停止的工程闭环

本文所说的“认知模型”不是对模型内部思维过程的心理学模拟，而是一套理解 **Agent** 的稳定坐标：它面对什么环境、依据什么信息、怎样选择行动、如何判断任务结束

### 一、从文本生成到目标驱动的行动

#### 1.1、一次模型调用为什么不是 Agent

一次 **LLM** 调用完成的是**信息变换**：输入一段上下文，输出一段文本或结构化结果，即使结果中包含工具调用参数，也只是提出了一个动作，还没有改变外部世界

而 **Agent** 则承担一个持续任务：==它需要根据当前状态决定下一步，让动作在环境中发生，再把环境结果带入后续判断，直至任务进入明确终态==

可以把这种运行方式抽象成一个直观循环：观察当前状态，思考下一步，执行行动，再观察行动后的环境

> 这个循环正是 **ReAct** 架构： ==**Observe（观察）**→ **Think（思考）**→ **Act（行动）**→ **再 Observe**==

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/react-control-loop.svg" alt="Agent 的观察、思考与行动循环" style="zoom: 60%;" />

循环本身并不新鲜，关键变化发生在“思考”环节：传统程序用写死的 `if-else` 选择分支，**Agent** 则让 **LLM** 结合当前观察与目标，动态决定下一步行动

> 把循环里的**「思考」**从一堆写死的 **if-else**，换成**「让 LLM 来决定下一步」**，一个普通脚本就变成了真正的 **Agent**

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20260905081127609.png" alt="image-20260905081127609" style="zoom:50%;" />

**LLM** 负责提出下一步，工具负责执行行动，执行结果重新成为下一轮观察，循环持续到目标达成或进入其他明确终态

#### 1.2、Workflow 与 Agent：谁决定下一步

**Workflow** 与 **Agent** 都可以调用模型和工具，核心区别是：==运行过程中，下一步由谁决定==

**Anthropic** 给了一个很关键的区分：

- **Workflow（工作流）**：**LLM** 和工具被「预定义的代码路径」编排——路径是人提前写死的，可预测、可控、稳定
- **Agent（智能体）**：**LLM** 自己「动态决定」流程和用哪个工具——模型掌控「怎么完成任务」

![image-20260905084046142](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20260905084046142.png)

**Agent** 很酷，但不是所有问题都适合它，一句话经验法则：

> 流程越稳定、步骤越固定、输入输出越可预测，越用普通脚本就够了；变化越多、越需要判断和适应，才考虑 **Agent**

==别把锤子当万能工具，看见什么都要敲一下==，真实决策事可以借助下面的决策树来判断：

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/whiteboard_exported_image.png" alt="whiteboard_exported_image" style="zoom: 40%;" />

> **反例预警**：全班月考成绩出来了，要按固定规则算每个人的总分、再从高到低排名
>
> 这件事规则死（总分 = 各科相加）、必须可复现（同样的输入永远是同样的结果）、错一分都不行
>
> 交给一个会「自己判断、随机应变」的 **Agent** 会怎样？
>
> 它可能这次「贴心地」把 59 进位成 60、下次又「觉得」语文该加权，结果每次算出来都不一样、还可能算错

这种规则固定、要求精确又可复现的任务，用 **Excel** 公式或一个十行小脚本就够了、零差错；**Agent** 的「灵活」在这里反而是缺点

这正对应决策树：==流程稳定 → 用脚本，不用 **Agent**==

#### 1.3、不同公式是在压缩不同层级

常见公式并不互相冲突，它们是在不同叙事颗粒度上观察同一个系统：

```text
LLM + Tool + Loop
    └─ 最小能力：模型可以行动并根据结果重复决策

LLM + Context + Action + Control Loop
    └─ 系统构成：信息、决策、执行与推进怎样协作

Model + Harness
    └─ 工程承载：概率性模型与外围运行系统怎样分工
```

这些公式仍然没有回答一个更基础的问题：为什么这种系统能够被称为 **Agent**；答案不在组件数量，而在它和环境形成的关系

### 二、Agent 的认知内核：与环境形成反馈闭环

从最小认知关系看，**Agent** 是围绕目标与环境持续行动的闭环系统：它接收环境反馈，根据已有观察选择行动，再用行动结果更新下一步判断

进一步解构的话，可以将这个系统拆解成下图👇所示：

![Agent 与环境形成目标驱动的反馈闭环](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/agent-environment-loop.svg)

这个闭环包含六个不可跳过的要素：

| 要素 | 决定什么 | 常见误读 |
|---|---|---|
| **目标与成功标准** | 什么叫推进、完成或失败 | 只有一句开放式 **Prompt** |
| **感知历史** | **Agent** 到目前为止知道了什么 | 把模型未看到的系统事实也算作已知信息 |
| **决策** | 基于当前信息选择什么行动 | 把 **LLM** 当成完整 **Agent** |
| **行动** | 向环境提出查询或施加改变 | 把工具调用文本当成执行结果 |
| **环境反馈** | 行动以后真实发生了什么 | 用模型自述代替文件、日志或业务状态 |
| **终止判断** | 继续、完成、失败还是交还人工 | 只要模型说“完成”就结束 |

以修复 **Vite** 启动失败为例：

- 读取 `package.json` 是**「感知」**
- 判断依赖可能冲突是**「决策」**
- 执行安装或修改配置是「**行动」**
- 进程退出码与测试结果是**「环境反馈」**

只有这些反馈会改变下一步判断，重复调用模型才构成真正的闭环

这也解释了两个重要边界：

- ==自主并不等于脱离人类==：信息不足、高风险动作或责任判断都可以成为合法的人工检查点
- ==循环并不自动代表推进==：没有目标、反馈与终止条件的循环只是在重复消耗资源

认知闭环说明了 **Agent** 为什么成立，但它仍是抽象行为模型，把它落到软件系统后，每个箭头都必须由具体对象和责任主体承接

### 三、从认知闭环到工程架构

#### 3.1、闭环怎样展开成软件系统

在工程层面，可以把 **LLM Agent** 压缩为：

```text
LLM Agent System = Model + Context System + Action System + Control Loop
```

将认知闭环落到工程系统时，需要同时看清两个层面：系统由哪些对象协作，以及工程责任是否闭合

下图先展示组件及其运行关系，随后再用六类工程责任检查是否存在责任空缺，两者不是一一对应的物理分层，一个组件可以同时承接多类责任

这是工程归纳，不是行业强制分层

![Agent 工程组件与运行链全景](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/agent-engineering-architecture.svg)

图中颜色用于区分组件的角色族，组件与工程责任的对应关系见下表

| 工程责任 | 必须回答的问题 | 典型对象 |
|---|---|---|
| 任务契约 | 要改变什么，怎样算成功，何时必须停止 | **Goal**、验收条件、预算、终态 |
| **Context System** | 系统知道什么，本轮让模型看到什么 | **State、Memory、Retrieval、Context Builder** |
| **Decision System** | 谁选择下一步，依据和策略是什么 | **Model、Instruction、Policy、Planner、Router** |
| **Action System** | 模型能提出什么动作，谁真正执行 | **Tool Schema、Action Proposal、Executor、Runtime** |
| **Control System** | 任务怎样继续、暂停、恢复、取消 | **Loop、Workflow、Checkpoint、Scheduler** |
| **Verification / Governance** | 结果是否成立，动作是否被允许，谁能放行 | **Test、Eval、Permission、Audit、Human Approval** |

这些责任不要求对应六个独立服务，一个小型 **Agent** 可以把它们写在同一个进程里，但任何一项都不能因此无人负责

#### 3.2、三条运行链不能混为一谈

工程架构的复杂性主要来自三条链同时运行：

| 运行链 | 主路径 | 核心问题 |
|---|---|---|
| 信息链 | **Environment / Memory → State → Context → Model** | 模型这一轮究竟看见了什么 |
| 行动链 | **Model → Action Proposal → Policy → Executor → Runtime → Environment** | 谁提出动作，谁承担真实副作用 |
| 控制链 | **Task Contract → Loop → Verification** → 继续 / 停止 / 交还 | 谁决定任务怎样推进和结束 |

其中有三组边界最容易被模糊

**Memory、State 与 Context**

- **Memory** 是可以跨时间保留的信息来源
- **State** 是当前任务可恢复的运行事实
- **Context** 是某一次模型调用实际看到的信息投影

三者可以相互生成，但不是同一个对象；系统拥有一条记忆，不代表模型本轮一定看到了它；模型本轮看到了某段文本，也不代表它已经成为可恢复状态

**Tool Call、Tool Execution 与 Runtime**

- **Tool Call** 是模型产生的结构化动作提议
- **Tool Executor** 负责解析、校验、调用并转换结果
- **Runtime** 是代码、命令或浏览器操作真正运行的地方
- **Sandbox** 只是限制 **Runtime** 影响范围的一种隔离机制

模型生成 `{"command":"pnpm test"}` 不等于测试已经执行，更不等于测试通过

**Control Loop 与 Harness**

- **Control Loop** 描述一次任务按什么规则重复和终止
- **Harness** 是承载上下文、工具、权限、状态、恢复和反馈等外围责任的工程系统

前者是一种控制机制，后者是让多种机制能够共同运行的工程载体

### 四、Harness：把模型能力变成可运行系统

认知闭环解释了 **Agent** 如何与环境交互，却没有说明概率性模型如何安全、持续地运行在真实系统中；**Harness** 正是承接这些外围工程责任的载体

可以用下面的公式来理解：

```text
Agent(Model + Harness) ↔ Environment
```

- **Model** 负责理解、推理和提出下一步
- **Harness** 决定模型看到什么、动作能否执行、结果怎样反馈、失败怎样恢复
- **Environment** 保存独立于模型的真实状态，并承担动作产生的结果

![Harness 六组运行能力及其在闭环中的位置](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/harness-capability-map.svg)

#### 4.1、Harness 的六组运行能力

| 能力 | 解决的问题 | 缺失时的典型后果 |
|---|---|---|
| **上下文管理** | 选择、排序、预算、截断和压缩本轮信息 | 关键信息丢失，噪声挤占上下文 |
| **会话管理** | 持久化、断点续接、回放和恢复任务状态 | 中断后只能从头开始，事实难以追溯 |
| **工具系统** | 注册、描述、校验、调用并转换工具结果 | 工具难以选择，错误无法稳定反馈 |
| **权限系统** | 按身份、工具、资源、路径和会话决定允许、确认或禁止 | 模型提议直接变成未授权副作用 |
| **反馈闭环** | 将日志、测试、错误和业务结果转成下一轮可消费的观测 | 模型只能依据自己的猜测继续行动 |
| **护栏与恢复** | 控制步数、时间、成本、重试、降级与取消 | 错误路径被循环放大 |

这六项是对 **Harness** 运行骨架的工程归纳，它们属于外围工程责任的载体

它们并没有覆盖整个 **Agent**：任务契约位于入口，模型提供决策，**Runtime** 和外部系统承担执行，业务验收与正式放行仍需要明确责任主体

#### 4.2、六组能力怎样支撑同一个主闭环

六组能力不是六个串行步骤。进入运行过程后，它们围绕同一个主闭环形成三组主要协作关系：

| 主循环环节 | 核心能力 | 协作能力 | 共同作用 |
|---|---|---|---|
| 准备模型输入 | 上下文管理 | 会话管理 | 组织本轮信息，并让任务能够持久化、续接和回放 |
| 执行模型行动 | 工具系统 | 权限系统 | 将动作提议转成受控调用，阻止未授权副作用 |
| 消化执行结果 | 反馈闭环 | 护栏与恢复 | 将真实结果送入下一轮，并在异常时限制、重试、降级或取消 |

```text
Context → Model → Tool → Runtime / Environment → Feedback → Context
```

#### 4.3、为什么一个 while 循环还不够

下面的代码可以演示最小闭环，但不能代表一个完整 **Harness**：

```typescript
while (!state.done) {
  const context = buildContext(state)
  const proposal = await model.decide(context)
  const observation = await execute(proposal)
  state = reduce(state, observation)
}
```

它没有说明 `proposal` 是否被授权、`execute` 在哪里运行、错误是否允许重试、状态能否恢复、完成条件由谁验证，也没有限制循环的成本和时间

因此，研究 **Agent Framework** 的目的不是记住多少 **API**，而是识别：

- 它替开发者承接了哪些责任
- 控制权留在哪里
- 哪些边界仍必须由应用自己完成

一个框架在 **Agent** 开发生态中的位置，也正是由这三者共同决定

### 五、一次 Coding Agent 任务怎样穿过完整系统

前面讨论了同一个系统的三个层级：

- **「认知闭环」**说明任务如何推进
- **「工程架构」**说明责任如何分工
- **「Harness 六组能力」**说明这些责任如何稳定运行

下面继续使用“修复 **Vite** 项目启动失败”这个任务，作为示例进行讲解：

![Coding Agent 修复任务的运行时序](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/coding-agent-runtime-sequence.svg)

**任务如何推进**：

- **观察**：读取项目文件和启动报错
- **思考**：模型提出诊断或修改方案
- **行动**：工具修改文件或执行命令
- **再观察**：新的日志、退出码和测试结果返回下一轮

**责任如何分工**：

- **State / Context** 组织模型看到的事实
- **Model** 提出下一步
- **Tool System** 校验并适配调用
- **Runtime** 执行动作
- 真实项目与测试产生独立于模型的结果

**责任如何稳定运行**：

- 「上下文与会话管理」维持任务连续
- 「工具与权限系统」约束真实动作
- 「反馈闭环与护栏」恢复消化结果并处理失败

当这些责任开始协作，任务中会同时形成三条工作流：

- **数据流**：项目文件、命令输出和测试结果进入 **State**，再由 **Context Builder** 选择为本轮 **Context**
- **控制流**：模型提出下一步，**Harness** 校验动作和权限，**Runtime** 执行，验收结果决定继续或结束
- **状态流**：每次观测都形成可恢复事实，使任务在失败、中断或人工确认后能够续接

==关键不是“模型一次就猜对”，而是每一轮都用退出码、日志、**Diff** 和测试结果缩小不确定性==

即使模型说“已经修复”，只要系统没有运行约定的测试，任务仍然只有完成提议，没有完成事实

这条链路跑通，只能说明系统能够工作

要判断它是否可靠，还需要继续检查动态路径之外，哪些责任必须保持稳定并最终闭合

### 六、从可以运行到责任闭合

#### 6.1、开放路径不等于开放责任

**Agent** 的价值来自==允许模型根据反馈**动态选择路径**，但动态性不应扩散到**所有边界**==

| 可以动态形成 | 必须有稳定依据 |
|---|---|
| 下一步读取哪个文件 | 哪些路径允许读取 |
| 选择哪个诊断工具 | 哪些工具需要确认或禁止 |
| 先修改配置还是代码 | 什么结果算通过验收 |
| 根据错误决定是否再尝试 | 最大步数、时间与成本 |
| 生成候选解决方案 | 谁能正式提交、发布或改变业务状态 |

**==路径可以开放，权限、验收、停止与正式放行必须收敛==**

#### 6.2、四类失控点

- **错误被循环放大**
  - 模型基于错误假设连续修改多个文件，如果没有**步数限制**、**阶段性验证**和**变更范围控制**，循环会把一次误判扩大成**系统性破坏**

- **副作用已经发生但状态不明**
  - 命令超时不代表没有执行，网络失败也不代表远端没有收到请求
  - 重试前必须判断动作是否幂等，并重新读取环境状态
- **模型同时担任执行者和验收者**
  - 模型可以建议测试、解释结果或生成评审意见，但不能用自己的陈述替代独立测试、策略检查和业务验收

- **技术完成被当成业务放行**
  - 测试通过证明的是已定义条件成立，不自动代表可以提交代码、部署生产或批准业务结果
  - 正式放行仍属于应用政策或人的责任
  - **治理因此不是闭环末尾的一个安全模块，而是贯穿入口、运行和出口**：
    - 进入前限定身份与范围
    - 运行中约束权限与资源
    - 结束时要求证据
    - 审计和明确的放行主体

### 七、用于理解任何 Agent 系统的最终模型

面对一个新的 **Agent Framework**、**SDK** 或产品，不必先从组件名称开始，可以依次提出三个问题：

1. 它怎样形成目标驱动的环境反馈闭环
2. 它承接了 **Context、Decision、Action、Control、Verification** 中的哪些责任
3. 它没有承接哪些 **Runtime**、权限、验收和业务放行责任

最终只需要记住三句话：

> **Agent** 以目标为方向，以环境反馈修正行动

> **Model** 提议，**Harness** 承载，**Runtime** 执行，**Environment** 反馈

> 路径可以开放，责任必须收敛

### 八、复习问题

1. 为什么一次 **LLM** 调用或一次 **Tool Calling** 不能自动称为 **Agent**
2. **ReAct** 怎样描述 **Agent** 的基本循环，**LLM** 替代写死的 `if-else` 改变了什么
3. **Workflow** 与 **Agent** 的核心区别是什么，分别适合什么任务
4. **Agent** 与 **Environment** 怎样形成目标驱动的反馈闭环
5. **Context、State、Memory** 分别是什么，为什么不能混用
6. 模型产生 **Tool Call** 后，谁真正执行动作并承担副作用
7. **Control Loop** 与 **Harness** 为什么不是同义词
8. **Harness** 六组能力分别支撑闭环中的什么责任
9. 一次 **Coding Agent** 任务中的数据流、控制流与状态流怎样协作
10. 哪些责任不能因为模型能力增强而交给模型临场决定

### 九、复习问题参考答案

1. **单次调用与 Agent**：单次模型调用只完成输入到输出的变换，**Tool Call** 也只是动作提议；**Agent** 还必须让行动作用于环境，并依据真实反馈继续或终止

2. **ReAct 与动态决策**：**ReAct** 将 **Agent** 的运行表达为观察、思考、行动、再观察的持续循环；把写死的 `if-else` 换成 **LLM** 后，下一步可以依据当前观察与目标动态形成

3. **Workflow 与 Agent**

   - **Workflow** 的下一步由代码预先确定，适合流程明确且要求稳定精确的任务
   - **Agent** 由 **LLM** 根据目标与观察动态选路，适合过程难以提前写死的任务

4. **Agent 与环境闭环**：**Agent** 根据目标和感知历史选择行动，行动查询或改变环境，环境结果成为新观测，终止判断再决定继续、完成或交还控制权

5. **Memory、State 与 Context**

   - **Memory** 是可持久化的信息来源
   - **State** 是当前任务可恢复的运行事实
   - **Context** 是一次模型调用实际看到的信息投影

6. **动作提议与真实执行**：**Tool Executor** 校验并发起调用，**Runtime** 执行代码或命令，真实副作用发生在 **Environment** 中；模型本身只提出动作

7. **Control Loop 与 Harness**：**Control Loop** 是任务重复和终止的控制机制，**Harness** 是承载 **Context、Tool、State、Permission、Recovery** 和 **Feedback** 等责任的工程系统

8. **Harness 六组能力**

   - 上下文管理组织本轮信息，会话管理保持任务连续
   - 工具系统承接动作，权限系统约束执行
   - 反馈闭环把真实结果送回下一轮，护栏与恢复限制失控

9. **数据流、控制流与状态流**

   - 数据流决定模型看到什么
   - 控制流决定谁选择、执行和终止
   - 状态流让每轮事实可记录、恢复和续接

   三者通过 **Observation** 汇合

10. **必须保持稳定的责任**：权限、验收、停止条件和正式放行必须依据稳定政策与明确责任主体，不能只由模型输出临场决定

### 十、参考资料

- [**Artificial Intelligence: A Modern Approach** Chapter 2](https://aima.cs.berkeley.edu/4th-ed/pdfs/newchap02.pdf)：**Agent–Environment、Percept、Action、Agent Function** 与 **Performance Measure** 的基础模型
- [**ReAct: Synergizing Reasoning and Acting in Language Models**](https://arxiv.org/abs/2210.03629)：推理与面向环境的行动交替进行，外部结果进入后续判断
- [**Anthropic: Building Effective Agents**](https://www.anthropic.com/engineering/building-effective-agents)：区分预定义代码路径的 Workflow 与由模型动态决定过程和工具使用的 Agent，并强调环境反馈、停止条件与人工检查点
- [**OpenAI: A Practical Guide to Building Agents**](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/)：从 Model、Tool、Instruction、Orchestration 与 Guardrail 解释 Agent 的工程构成
- [**OpenAI: Harness Engineering**](https://openai.com/index/harness-engineering/)：说明 Agent 工程需要可读环境、工具、反馈循环、测试、评审与可观测性，而不只是模型调用
- [**仓桥智能：认识 Agent——它和 chatbot / workflow 有什么不同**](https://yulo85m1na.feishu.cn/docx/CjO9dgEEJoW7xmxMZEGcPRZKn4b)：以教学案例解释 Agent Loop、动态决策和 Workflow / Agent 的使用边界
