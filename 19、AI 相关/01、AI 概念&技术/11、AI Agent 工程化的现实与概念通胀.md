## Graph Engineering

### 一、前言

2026 年，**AI Agent** 领域出现新概念的速度，已经快过了工程实践积累证据的速度

继 **Prompt Engineering**、**Context Engineering** 和 **Harness Engineering** 之后，讨论开始转向 **Loop Engineering**，最近又出现了 **Graph Engineering**

这些名字很容易制造一条看似合理的升级路线：

```text
Prompt → Context → Harness → Loop → Graph
```

仿佛只要不断升级抽象层次，就能得到越来越强的 **Agent** 系统

这条升级路线是否正确？有待商榷

但不妨先研究下这些概念到底抽象了些什么？

- **Harness**：定义系统具备什么能力和边界
- **Loop**：组织系统如何随时间持续运行
- **Graph**：组织多项工作如何依赖、分支与汇合

真正值得追问的不是哪个概念更新，而是：**删掉这个新名字以后，还剩下哪些可以实现、验证和回滚的工程对象**

![image-20260821113203309](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20260821113203309.png)

**Harness**、**Loop** 与 **Graph** 不是升级阶梯，而是**能力边界**、**时间控制**和**协作拓扑**三个控制面，所有复杂度最终都必须通过可信证据门槛

### 二、先用“删除测试”识别概念价值

判断一个新的 **Engineering** 是否成立，可以暂时删掉它的名字，只看四件事：

1. **它新增了什么工程对象**
2. **它解决了什么原有方法解决不了的问题**
3. **它能否被实现、测试、观察和回滚**
4. **是否已有证据证明收益大于新增复杂度**

如果删掉术语后，只剩下“多调用几次模型”或“再增加几个 **Agent**”，它更像趋势口号，还没有形成独立的工程范式

**新概念有没有价值，不看名字有多新，而看它留下了什么工程对象**

### 三、Harness Engineering：实践先发生，概念后出现

**Harness Engineering** 之所以迅速形成共识，是因为它总结的实践早已存在：为 **Agent** 准备上下文、工具、状态、沙箱、权限、测试、日志与人工接管，只是这些工作曾被分散地称为平台、运行时、工具链或工程规范

**Harness Engineering** 把它们组织成一个完整判断：模型只提供推理能力，**Agent** 能否可靠工作，还取决于模型之外的工程系统

这个判断能够立即指导行动：

- **Agent** 看不懂项目，检查上下文和知识入口
- 长任务不断失忆，检查状态保存与跨会话交接
- 修改经常越界，检查工具权限与工作区隔离
- 总是错误宣布完成，补充独立验证与完成证据

每个问题都有明确责任对象，也可以通过测试和运行结果验证

**OpenAI** 的 [Harness engineering](https://openai.com/index/harness-engineering/) 实践与 **Anthropic** 的 [长任务 Harness](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) 都体现了同一条路径：**先让环境、状态、工具和验证对 Agent 可读、可执行，再谈更长时间的自治**

> ==**Harness** 把 **Agent** 问题变成了工程问题==

### 三、Loop Engineering：成熟机制与未来想象被装在了一起

**Loop Engineering** 的基本提醒是正确的：人不再逐轮提示 **Agent** 后，系统必须决定何时再次运行、携带什么状态、接受什么反馈以及何时停止

问题在于，[LangChain 的四类 Loop](https://www.langchain.com/blog/the-art-of-loop-engineering) 成熟度并不相同：

- **Agent Loop** 已经是主流 **Agent Runtime** 的基本工作方式
- **Verification Loop** 在成功标准明确时能够落地
- **Event-driven Loop** 主要复用消息、定时器、队列与工作流平台
- **Improvement Loop** 则试图根据多次运行证据修改未来 **Harness**

前三类主要重新组织了现有机制，真正的新想象集中在第四类

- 但从 **Trace** 发现重复问题，不等于已经找到根因，生成一个修改候选，也不等于证明系统得到改善
- 自动改进仍然依赖覆盖充分的 **Eval**、版本治理、审批、灰度和回滚

**Loop Engineering** 并不是完全无法落地，更准确的说法是：==任务级 **Loop** 已经可用，但跨任务自动改进仍然超前，更多运行不会自动产生更多可靠性==

### 四、Graph Engineering：新的往往是名字，不是机制

截至 2026 年 8 月，本文没有找到 **Graph Engineering** 稳定统一的定义

这里讨论的不是知识图谱或 **GraphRAG**，而是把 **Agent**、工具、验证器和人工节点组织成显式执行图：

- 节点负责工作
- 边定义依赖
- 状态在节点之间传递
- 路由决定分支、并行、汇合和退出

如果采用这个定义，它并不是一种遥远技术

工作流、状态机与 **DAG** 早已在解决同类问题；[LangGraph 官方文档](https://docs.langchain.com/oss/python/langgraph/graph-api) 也已经用 **State**、**Node** 和 **Edge** 实现条件路由、循环和并行执行

真正需要区分的是两种 **Graph**：

- **显式 Graph**：人预先设计职责、依赖和恢复路径，已经可以落地
- **动态 Graph**：**Agent** 自行创建、重组并优化协作结构，仍缺乏稳定证据

**Anthropic** 已将主 **Agent** 编排并行子 **Agent** 用于 [Research 生产系统](https://www.anthropic.com/engineering/multi-agent-research-system)，同时也指出多 **Agent** 会显著增加 **Token** 成本，而且编码任务通常没有研究任务那么容易并行

因此，**Graph** 不是比 **Loop** 更高级的下一阶段，它只在任务真的存在并行关系、独立权限、上下文隔离或失败边界时才值得采用

> ==**Loop** 扩展运行时间，**Graph** 扩展协作拓扑==

### 五、Agent 当前真正的瓶颈是验证

今天的模型已经能够调用工具、持续执行，也能组织多个 **Agent** 并行工作

但增加运行次数和协作节点，只是在扩大系统的行动半径，并没有自动回答最关键的问题：**系统凭什么相信结果是对的**

- 更多调用可能重复同一种错误
- 多个相似模型可能共享盲点并互相确认
- 更复杂的 **Graph** 会增加状态一致性和错误归因难度
- 自动修改 **Harness** 还可能通过钻指标漏洞获得虚假的提升

因此，当前 **Agent** 工程的主要矛盾，已经==从 “模型能不能做” 转向 “系统能不能用可接受的成本证明它做对了”==

这也是为什么 **Harness Engineering** 比后来的概念更有现实力量：

- 它首先建设环境证据、权限边界、停止条件和人工责任；
- 而 **Loop** 与 **Graph** 往往先扩大自治，再假设验证问题能够随后解决

> ==当前瓶颈不是执行，而是可信验证==

### 六、当下应该专注什么

这三个概念更适合被理解为不同控制面，而不是一条升级路线：

| 概念 | 当前定位 | 采用条件 |
| --- | --- | --- |
| **Harness Engineering** | 当前工程主线 | 只要 **Agent** 需要进入真实环境就应建设 |
| **Loop Engineering** | 按需增加的时间控制 | 任务需要持续反馈、验证和停止机制 |
| **Graph Engineering** | 按需增加的拓扑控制 | 工作存在真实依赖、并行、隔离或汇合 |
| 自动改进与动态图 | 前沿假设 | 已有可信 **Eval**、治理、灰度与回滚证据 |

这也给出了一个简单的实践顺序：先把单次任务放进可靠 **Harness**，再增加有停止条件的 **Loop**；只有单个 **Loop** 无法表达真实协作关系时，才引入 **Graph**

最终，可以把全文收成一句话：

> ==**Harness** 定义可靠运行的条件，**Loop** 扩大运行的时间，**Graph** 扩大协作的空间；没有可信验证，后两者只是在放大不确定性==

### 参考资料

- [OpenAI：Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)
- [Anthropic：Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Anthropic：How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- [LangChain：The Art of Loop Engineering](https://www.langchain.com/blog/the-art-of-loop-engineering)
- [LangGraph：Graph API overview](https://docs.langchain.com/oss/python/langgraph/graph-api)
- [Addy Osmani：Loop Engineering](https://addyosmani.com/blog/loop-engineering/)
