## **LangGraph** 认知模型与架构全景

### 一、问题与定位：**LangGraph** 接管哪一段运行责任

#### 1.1、从一次进程调用到一项可接续任务

当任务能够在一次进程调用中完成时，函数顺序、局部变量和调用栈已经足以保存数据与执行位置：

```text
应用提交输入 -> 当前进程依次执行 -> 返回结果，本次调用结束
```

只要路径稳定、进程能够覆盖完整执行，失败后可以整体重试，这种方式就已经足够

但有些任务无法自然结束在一次调用里

模型需要根据中间结果继续判断，工具可能产生外部副作用，高风险动作需要等待人工决定，进程退出后还要从原来的位置继续

```text
确定性预处理 -> 模型动态判断 -> 工具执行
                            ↓
                       等待外部决定
                            ↓
                     跨调用恢复并继续
```

一旦任务跨越调用边界，原调用栈就无法继续保存当前事实、已完成进度、待执行位置和正在等待的外部条件

这些运行信息必须离开临时进程，变成可以持久化、检查和重新加载的协议

> ==调用栈维持一次调用，状态化运行时维持一项任务==

这就是 **LangGraph** 处理的核心工程问题

> ==它不是让单次模型调用变得更聪明，而是让一项由确定性步骤、模型判断和外部输入共同推进的任务，可以跨越单次进程继续运行==

#### 1.2、三项核心责任：显式状态、推进控制、接续运行

**LangGraph** 是面向 **Workflow** 与 **Agent** 的低层状态化编排框架和运行时

它主要把三项原本散落在应用代码里的运行责任收拢起来：

- **显式状态**：把共享事实、状态变化与控制位置从隐含调用关系中提取出来
- **推进控制**：按照声明的工作单元和控制关系执行下一步，并合并运行结果
- **接续运行**：保存可恢复现场，在失败、中断或外部等待后继续原任务

> ==**LangGraph** 显式状态、推进控制、接续运行==

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/LangGraph-工程职责覆盖.svg" alt="LangGraph 在 Workflow 与 Agent 系统中的责任覆盖" style="zoom:67%;" />

这张图给出全文最重要的责任边界：

- **LangGraph** 核心承接状态协议、控制转移、运行调度与执行连续性

- 节点可以接入模型、工具和人工输入，但接入不等于接管

- 模型智能仍来自 **Provider / LLM**
- 现实动作仍由工具、应用进程或沙箱执行
- 身份授权、业务规则与最终验收仍由图外系统闭环

#### 1.3、**Workflow、Agent Loop** 与 **LangGraph** 不是同一个概念

知道 **LangGraph** 负责推进任务，还不足以确定它在 **Agent** 系统中的位置，必须继续区分三类概念：

- **Workflow** 描述主要由代码预先决定的控制结构
- **Agent Loop** 描述模型根据环境反馈，反复选择行动的控制结构
- **LangGraph** 提供承载和运行这些控制结构的**==状态化编排层==**

三者不是从低到高的等级

一张图可以只运行确定性 **Workflow**，也可以包含模型主导的 **Agent Loop**，还可以让两类结构共同服务于一项任务

因此，图中的回边、条件路由或模型节点都不能单独定义 **LangGraph** 的生态位：

- **Loop** 描述任务怎样反复推进
- ==**LangGraph** 负责让这种推进可执行、可观察并可恢复==

> ==**Agent Loop** 是任务中的动态控制结构，**LangGraph** 是承载控制结构的状态化运行时==

#### 1.4、**LangGraph** 没有替应用解决什么

**LangGraph** 可以记录任务怎样运行，却不能判断任务是否应该运行；可以恢复计算进度，却不能撤销已经发生的现实副作用

它没有替应用解决以下责任：

- **目标与验收**：任务要解决什么问题，什么结果才算真正完成
- **智能与事实**：模型是否具备足够能力，生成内容是否真实可靠
- **执行与授权**：工具是否有权执行动作，调用者是否拥有相应权限
- **事务与治理**：外部副作用如何保证幂等、补偿、审计与正式放行

> ==**LangGraph** 管理任务怎样继续运行，但不决定任务是否应该运行、是否有权运行、是否已经真正完成==

**LangChain** `createAgent()` 提供基于 **LangGraph** 的预构建模型&工具反馈循环

当默认循环不足以表达定制状态、路径与恢复语义时，应用就需要直接使用 **LangGraph** 的低层编排能力

- 这里的“低层”指抽象更基础、控制责任更多，不代表能力或成熟度更低


后文将回答四个问题：

- **架构**：应用声明的状态和控制关系，怎样变成一次真实运行
- **转换**：共享事实怎样更新，控制权怎样决定下一步
- **连续性**：运行现场怎样保存、交接、恢复和观察
- **边界**：状态化编排带来什么价值，又要求团队承担什么成本

### 二、整体架构：声明协议，运行时推进

定位清楚以后，下一步要回答的是：应用声明的结构怎样变成一次真实运行

在 **Graph API** 中，应用先声明状态、工作单元与控制关系，`compile()` 再把声明转换为可执行图

这形成一条贯穿全文的主链：

```text
State 定义共享事实
  -> Node 产生局部更新
  -> Reducer 合并新状态
  -> Edge / Command 决定下一步
  -> Graph Runtime 推进执行
  -> Checkpoint 保存可恢复现场
```

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/LangGraph-运行时架构全景.svg" alt="LangGraph 运行时架构全景" style="zoom:67%;" />

这里的 **Graph Runtime** 是对编译后图背后调度、通道、状态合并与执行循环的认知称呼，不等于用户必须直接构造的单一公开类

它也不是节点可以读取的 `Runtime` 上下文对象

还要区分另一条边界：**Graph Runtime** 负责安排节点何时运行，节点内部的工具、应用进程或沙箱才负责执行真实动作

把节点调度和现实执行统称为 **Runtime**，会掩盖权限、副作用与失败恢复的责任归属

#### 2.1、核心对象不是同一层

| 层次 | 对象 | 责任 | 不负责什么 |
|---|---|---|---|
| 状态契约 | **State Schema / State** | 定义共享字段、当前值与更新语义 | 不等于业务数据库或全部 **Context** |
| 工作单元 | **Node** | 读取状态，执行计算或副作用，返回更新 | 不自动获得智能、权限或幂等性 |
| 控制契约 | **Edge / Command** | 表达固定、条件或动态下一跳 | 不证明路径业务正确 |
| 图定义 | `StateGraph` | 组装节点、入口、出口与转移关系 | 不执行运行 |
| 可执行载体 | **Compiled Graph** | 提供 `invoke()`、`stream()`、状态查询等入口 | 编译成功不等于任务成功 |
| 执行系统 | **Graph Runtime** | 调度节点、合并更新、持久化、恢复与终止 | 不产生模型智能，不替代工具或进程执行真实动作 |

`compile()` 是控制反转边界：应用不再亲自按调用顺序推进函数，而是把“允许执行什么、共享什么、如何转移”交给运行时

这没有减少应用责任，只是把隐式约束改成了需要长期维护的显式协议

#### 2.2、**Super-step** 是稳定执行节拍

当前 **JavaScript** 实现采用受 **Pregel** 启发的消息传递模型

一个 **Super-step** 中，被激活的一个或多个节点执行并提交写入；运行时统一应用状态更新，再准备下一批任务，并按 **Durability** 策略保存 **Checkpoint**

它的认知价值不是解释底层算法，而是提供稳定的运行边界：顺序节点分步推进，同一步节点可以并行，状态合并与现场保存都围绕执行步发生

因此，并行写入必须有明确的合并语义，`recursionLimit` 计算的也是执行步而不是函数递归层数；更具体的执行规则由后续机制文章展开

### 三、状态转换：**State** 既是契约，也是耦合中心

运行时能够推进图，前提是节点之间共享的事实及其变化方式已经被明确声明

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/LangGraph-单步数据流与控制流.svg" alt="LangGraph 单步数据流与控制流" style="zoom:67%;" />

一次执行步必须分开两条链：

```text
数据：State -> Node -> Partial Update -> Reducer -> New State
控制：New State -> Router / Command -> Next Node / END
```

条件 **Router** 读取源节点更新已经合并后的状态

#### 3.1、节点只声明本次变化

节点读取当前 **State**，只返回本次产生的部分更新，而不复制完整状态

这样，“节点产生什么变化”和“变化怎样进入共享事实”由不同组件负责：节点负责计算，字段协议与运行时负责合并，状态写入也更容易测试与追踪

#### 3.2、字段语义决定怎样合并

普通字段通常由新值覆盖，累计字段可以通过 **Reducer** 合并，消息则使用专门的消息更新协议；不同字段采用什么语义，是 **State Schema** 的一部分

**Reducer** 由运行时调用，它统一的是更新方式，不保证证据真实、业务优先级正确、并行结果符合预期，也不授予调用者字段权限

因此不能写成：

```text
Schema = 业务正确
Reducer = 并发安全
State = 完整 Context
```

#### 3.3、显式协作会形成显式耦合

**State** 让节点通过稳定字段协作，也使字段成为跨节点耦合点

字段越多、语义越混杂，修改一个字段时需要同时检查节点、路由、**Reducer**、持久化迁移与输出适配

工程上应把 **State** 视为版本化协议，而不是方便传递任意对象的全局容器

### 四、控制协议：图没有智能，只有可执行转移

**State** 回答事实怎样变化，控制协议继续回答变化发生以后执行什么

#### 4.1、三种主要转移方式

| 方式 | 下一步由谁决定 | 是否同时更新状态 | 适用场景 |
|---|---|---:|---|
| 固定 **Edge** | 构建期关系 | 否 | 稳定顺序 |
| 条件 **Edge** | 独立 **Router** | 否 | 做事与选路需要分离 |
| `Command({ update, goto })` | 当前节点 | 是 | 更新与下一跳属于同一业务判断 |

三者不是能力等级

`Command.goto` 也不会自动覆盖已注册静态边，混用时多个目标都可能执行；一个出口应有清楚的控制所有者

#### 4.2、循环是回边，不是智能

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/LangGraph-模型工具循环.svg" alt="LangGraph 模型工具循环" style="zoom:67%;" />

典型模型工具循环中，模型节点提出文本或 **Tool Call**，工具节点执行动作并把结果写回消息状态，条件路由再决定调用模型还是进入 `END`

工具结果能够影响下一次判断，是因为它被写回模型可读取的上下文，而不是因为模型拥有了工具、执行环境或长期记忆

`bindTools()`、`ToolNode` 与 `MessagesValue` 分别承担契约绑定、工具执行和消息合并，具体调用方式由 04 分篇展开

固定边中调用一次模型仍是概率性工作流；只有模型根据反馈持续选择行动或路径并推进目标时，才形成典型 **Agent Loop**

#### 4.3、业务结束不等于运行停止

| 结束类型 | 含义 |
|---|---|
| 业务终止 | 证据充分、审批拒绝、模型给出最终回答等明确条件路由到 `END` |
| 运行保险丝 | 超过 `recursionLimit` 后抛出 `GraphRecursionError` |

图没有待执行节点，只能证明运行时静止；超过上限，只能证明运行失控或条件未收敛；两者都不能自动证明目标达成

因此，**Agent Loop** 是图中可能出现的一类动态控制结构，不是 **LangGraph** 的总称；同一张图也可以只承载完全由代码决定的 **Workflow**，或把二者组合在一个长任务中

显式控制也不是越多越好

若流程短、固定、失败后整体重试代价低，直接函数的调用栈已经足够清楚；把每个细节都建成节点，只会制造图结构和状态迁移成本

### 五、持久化与恢复：保存现场，不包办现实事务

控制协议可以推进当前运行，但任务一旦跨越进程和调用，还需要回答现场怎样留下

配置 **Checkpointer** 后，图可按 `thread_id` 保存、查询与接续运行现场

#### 5.1、恢复依赖一组稳定坐标

**Checkpointer** 负责保存和读取运行现场，`thread_id` 把多次调用关联到同一个 **Thread**，每个执行边界形成 **Checkpoint**

应用通过 **StateSnapshot** 与历史记录读取当前状态和待执行位置

可以把它们的关系压缩为：

```text
thread_id -> Thread -> Checkpoint 序列 -> 当前快照 / 历史轨迹
```

`thread_id` 只是状态关联键，不是已认证身份、资源所有权或权限凭证

应用必须先完成身份与权限校验，再把可信的 `thread_id` 交给图

#### 5.2、**Durability** 决定保存时机

**Durability** 决定现场在什么时候写入：同步保存提供更明确的恢复边界，但会增加等待；异步或退出时保存降低运行开销，也会扩大崩溃时可能丢失的进度范围

具体模式属于实现选择，架构上更重要的是：图状态与现实副作用并不共享同一个事务边界

必须保留四个不等式：

```text
Checkpoint != 数据库事务
Durability != Exactly-once
Replay != 现实回滚
Thread State != 长期 Memory
```

外部数据库写入、通知、扣费或文件修改可能已经发生，而对应 **Checkpoint** 尚未保存，反向情况也可能出现

因此恢复语义依赖幂等键、去重记录、事务边界或补偿流程，不能只依赖图状态

### 六、人工介入与观察：控制事件不是业务事实

保存现场解决了“以后从哪里继续”，接下来还要解决“外部怎样接管控制、怎样观察运行”

#### 6.1、**Interrupt** 是跨调用控制转移

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/LangGraph-中断与恢复时序.svg" alt="LangGraph Interrupt 与 Resume 跨调用链" style="zoom:67%;" />

`interrupt(payload)` 使本次运行暂停，运行时保存可恢复现场，并把中断信息交给调用方

后续调用使用相同 `thread_id` 和 `Command({ resume })` 重新加载现场，从包含中断的节点开头执行

它恢复的是图语义位置，不是原 **JavaScript** 调用栈

中断负载只是一项“请求外部决定”的控制事件，恢复输入也只是一项“外部提交了值”的控制事件

是否由正确的人批准、批准是否仍有效、是否允许释放高风险动作，必须由应用、身份系统、策略和审计记录共同判断

因此：

```text
Interrupt != 审批事实
Resume value != 已授权决定
```

包含 `interrupt()` 的节点会从头重放，中断前逻辑必须确定且可重复；不可逆副作用应移到批准后，或拆为独立节点并提供幂等保护

#### 6.2、**Streaming** 是观察投影

**Streaming** 可以投射状态变化、模型消息、自定义信号和更细的运行事件，让调用方按需要观察同一次执行

| 层次 | 回答的问题 |
|---|---|
| 运行投影 | 当前发生了什么 |
| 运行取消 | 当前执行是否继续 |
| 业务验收 | 目标是否真正达成 |

停止读取 `for await` 不等于取消底层运行，技术运行产生输出也不等于业务通过

原始事件还可能包含节点名、模型元数据与完整状态，生产应用需要筛选、脱敏和协议适配，不能把框架事件直接当成稳定前端接口

### 七、端到端控制链：一类长任务如何运行

现在回到开篇的结构性长任务，它不对应某个特定业务，而是同时包含确定性步骤、模型判断、外部动作、人工介入与跨调用恢复的一类任务

```text
1 应用建立任务契约、身份、预算与 thread_id
        ↓
2 Graph Runtime 读取 State，启动确定性预处理节点
        ↓
3 模型节点根据当前状态决定下一项动作或是否结束
        ↓
4 工具或应用节点执行动作，Reducer 合并返回结果
        ↓
5 Edge / Command 根据新状态进入下一轮、验证或 END
        ↓
6 高风险动作触发 Interrupt，Checkpoint 保存可恢复现场
        ↓
7 应用验证外部决定，再用同一 thread_id 恢复图
        ↓
8 节点从规定位置重放，业务验收决定任务是否真正完成
```

这八步不只描述执行顺序，更揭示了控制权怎样在不同责任主体之间交接：

| 控制权交接 | 发生了什么 | 没有随之转移的责任 |
|---|---|---|
| 应用 → **Graph Runtime** | 应用提交状态、控制协议与运行约束，运行时开始推进任务 | 任务目标、预算与成功标准仍由应用定义 |
| **Graph Runtime** → 模型 | 运行时把当前事实交给模型，由模型判断下一项动作 | 模型只能在应用允许的边界内提出选择，不获得最终控制权 |
| 模型 → 工具或应用节点 | 模型提出动作，图将调用路由给相应执行者 | 权限校验、副作用安全与幂等性仍由应用、身份系统和执行环境共同保障 |
| **Graph Runtime** → 外部人或系统 | 图在中断处保存现场，把继续或停止的决定交还外部 | 身份、授权、决定有效性与最终验收仍由图外系统判断 |

**LangGraph** 的作用，是保存并推进这些交接，而不是替代参与交接的责任主体

这也解释了几项核心机制为何必须共同存在：

- **State** 保存各方协作所依据的共享事实
- **Edge / Command** 把下一步控制权变成显式转移
- **Checkpoint** 让控制链跨越进程和调用后仍能接续
- **Interrupt** 让运行时可以暂停任务，并以可恢复方式把决定权交还外部

因此，模型仍有判断能力边界，工具执行仍需要权限与幂等保护，人工输入仍要经过身份与有效性校验，最终结果仍由业务规则验收

> **LangGraph** 保证控制链可以继续推进，不保证业务目标已经真正完成

控制链成立以后，最后的问题不再是 **LangGraph** 能否做到，而是这些能力是否值得应用承担相应的协议成本

### 八、边界与选型：价值必须覆盖维护成本

#### 8.1、真正的采用门槛

判断起点不是“流程能否画成图”，而是动态控制、并行协作、跨调用连续性、人工介入等压力是否已经超过直接代码的承载能力

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/LangGraph-选型压力与成本门槛.svg" alt="LangGraph 选型压力与成本门槛" style="zoom:67%;" />

这些压力只构成需求侧动机，真正的采用门槛还包括：团队是否愿意把 **State Schema**、转移条件、恢复语义、副作用幂等与版本迁移，当成长期业务契约维护

只会画出节点和边，不代表已经获得可恢复系统

#### 8.2、五个架构判断

1. **图只是表达，执行连续性才是价值**

   - **Graph API** 用状态图显式描述控制
   - **Functional API** 用过程式代码表达同类任务
   - 两者共享的核心价值，是让一次执行脱离单次进程后仍能继续

2. **显式化不会消灭复杂度，只会改变复杂度的位置**

   - 原本藏在局部变量、调用顺序和异常处理中的复杂度，被迁移为 **State Schema**、更新语义、转移条件与恢复协议
   - ==系统更容易观察和测试，也必须承担相应的版本维护成本==

3. **持久化保护计算现场，不保护现实原子性**

   - **Checkpoint** 可以记录状态与执行位置，却无法保证数据库写入、通知、扣费或文件修改恰好发生一次
   - 计算能够恢复，不代表现实已经回滚

4. **模型可以参与控制流，但不能继承系统控制权**
   - 模型可以拆解任务、选择路径和持续行动
   - ==运行预算、工具权限、外部放行与结果验收仍由确定性系统掌握==
   - 决策空间扩大，不等于责任边界转移

5. **价值随控制断点增加，而不是随节点数量增加**

   - 跨调用恢复、人工介入、历史分叉和过程审计，才会放大状态化运行时的价值
   - 流程只是步骤多、分支多，不足以单独证明应该采用 **LangGraph**

> ==**LangGraph** 将隐式运行复杂度变成显式协议，以维护成本换取执行连续性、可观察性与可恢复性==

#### 8.3、选型顺序：先责任，再表达

**LLM SDK**、**LangChain、LangGraph** 与 **Deep Agents** 不在同一条成熟度阶梯上，它们分别回答“是否需要状态化运行时”、“是否复用预制循环”、“怎样表达编排”和“外围能力预置多少”

选型时应按责任缺口依次判断：

1. **先判断是否需要运行==连续性==**
   - 如果任务可以在单次进程中完成，失败后能够整体重试，**LLM SDK** 或普通工作流通常已经足够
   - ==如果任务必须**跨调用恢复**、**等待外部决定**或**保留中间现场**，才真正出现**状态化运行时**的需求==

2. **再判断是否复用预制 Agent 结构**
   - 如果主要需要标准模型&工具反馈循环，并通过提示、工具和 **Middleware** 扩展，优先使用 **LangChain** `createAgent()`
   - 如果应用需要==自行定义状态、路径和恢复语义==，再直接使用 **LangGraph** 的低层编排能力

3. **直接使用 LangGraph 时，再选择编排表达**
   - 希望保留普通函数、条件和循环，同时获得持久化、恢复与人工介入，选择 **Functional API**
   - 需要显式共享状态、复杂分支、循环、并行合并与路径测试，选择 **Graph API**

4. **最后判断外围能力需要预置多少**
   - 如果任务需要直接获得规划、文件系统、子 **Agent** 与上下文管理，可以采用 **Deep Agents** 等预置能力更多的 **Harness**
   - **Harness** 预置责任更多，不代表底层 **Loop** 或 **Runtime** 更高级，==只代表应用需要自行建设的外围能力更少==

反过来，==如果路径稳定、没有中间恢复需求、人工节点只增加形式，或状态图比业务代码本身更难解释，就不应为了“使用图”而采用 **Graph API**==

这些选择可以上下组合，并非互斥替代：**LangChain** 与 **Deep Agents** 可以把预制能力建立在 **LangGraph Runtime** 上，应用也可以在预制结构之外直接使用 **LangGraph** 定制局部控制

> ==选型不是寻找能力最多的框架，而是决定哪些责任由系统预置，哪些责任仍由应用掌握==

### 九、最终记忆模型

不用记住所有对象，只需要回答四个问题：

| 问题 | 记忆锚点 |
|---|---|
| 为什么需要它 | 单次进程无法继续承载执行进度，运行必须能够跨调用接续 |
| 它怎样表达任务 | **Graph API** 显式声明状态与转移，**Functional API** 保留过程式控制流 |
| 它怎样维持连续性 | 运行时推进工作单元，并保存状态、执行位置与恢复依据 |
| 它没有替代什么 | 目标、智能、现实副作用、身份授权、事务与业务验收 |

一句话结论：

> **LangGraph** 把依附于单次进程的执行进度，变成可持久化、可接管、可恢复的运行协议
>
> 状态图是显式组织任务的一种方式，运行连续性才是贯穿 **Workflow** 与 **Agent** 的核心价值

### 十、参考资料

- [LangGraph Overview](https://docs.langchain.com/oss/javascript/langgraph/overview)
- [Choosing between Graph and Functional APIs](https://docs.langchain.com/oss/javascript/langgraph/choosing-apis)
- [LangGraph Graph API](https://docs.langchain.com/oss/javascript/langgraph/graph-api)
- [LangGraph Functional API](https://docs.langchain.com/oss/javascript/langgraph/functional-api)
- [Workflows and Agents](https://docs.langchain.com/oss/javascript/langgraph/workflows-agents)
- [Persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence)
- [Interrupts](https://docs.langchain.com/oss/javascript/langgraph/interrupts)
- [Use Time Travel](https://docs.langchain.com/oss/javascript/langgraph/use-time-travel)
- [Streaming](https://docs.langchain.com/oss/javascript/langgraph/streaming)
- [Event Streaming](https://docs.langchain.com/oss/javascript/langgraph/event-streaming)
- [LangChain Agents](https://docs.langchain.com/oss/javascript/langchain/agents)
- [LangGraphJS Pregel Execution Model](https://github.com/langchain-ai/langgraphjs/blob/%40langchain/langgraph%401.4.13/libs/langgraph-core/spec/pregel-execution-model.md)
- [@langchain/langgraph 1.4.13 Source Tag](https://github.com/langchain-ai/langgraphjs/tree/%40langchain/langgraph%401.4.13)
- [@langchain/langgraph 1.4.14 Source Tag](https://github.com/langchain-ai/langgraphjs/tree/%40langchain/langgraph%401.4.14)
- [1.4.13 interrupt() Source](https://github.com/langchain-ai/langgraphjs/blob/3609b35/libs/langgraph-core/src/interrupt.ts)
- [1.4.13 StateSchema Source](https://github.com/langchain-ai/langgraphjs/blob/3609b35/libs/langgraph-core/src/state/schema.ts)
- [1.4.13 GraphRunStream Source](https://github.com/langchain-ai/langgraphjs/blob/3609b35/libs/langgraph-core/src/stream/run-stream.ts)
