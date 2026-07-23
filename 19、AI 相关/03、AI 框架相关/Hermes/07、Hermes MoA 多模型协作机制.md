## Hermes MoA 多模型协作机制

### 一、前言：为什么一个 Agent 还要听多个模型的意见

**Mixture of Agents**，简称 **MoA**，解决的不是「把工作交给更多 Agent」，而是：

> 当前 Agent 遇到一个高价值判断时，怎样在不改变 Session、工具和行动者的前提下，获得多个模型视角

例如用户提出以下教学示例：

```text
评审这份数据库迁移方案，指出风险，并决定是否可以执行
```

单模型模式下，当前 Agent 会直接分析方案、读取脚本、调用工具并给出结论

这并不必然错误，但在迁移评审这类问题中，一个模型可能偏重可用性而遗漏数据回填，或偏重代码实现而遗漏回滚和业务中断风险

**MoA** 不会创建三个独立 Agent 去执行三份工作

它让多个模型先给出意见，再由一个模型保留行动权：

```text
同一个 Chat Session 中的一次模型推理
  -> Reference Models 分别提出风险判断
  -> Aggregator Model 阅读这些判断
  -> Aggregator Model 输出正式结论，或调用 Tool 查证
```

核心变化是：

> 单模型独立判断，变成多模型提供视角、一个模型负责行动

### 二、MoA 在 Hermes 中的位置

名字中的 **Agents** 很容易造成误解，先放回 **Hermes** 的正确层级：

```text
Hermes Agent Runtime
├── 模型层
│   ├── 普通 Model Provider
│   └── MoA Virtual Model Provider
│       ├── Reference Models
│       └── Aggregator Model
│
└── 多 Agent 协调层
    ├── delegate_task
    └── Kanban
```

| 机制 | 解决的问题 | 是否创建独立 Agent / Worker | 谁拥有行动权 |
|---|---|---:|---|
| **MoA** | 当前 Agent 如何获得多个模型视角 | 否 | Aggregator Model |
| `delegate_task` | 当前 Agent 如何短暂委派一段工作 | 是 | 子 Agent |
| **Kanban** | 多个 Agent 如何持久化协作完成工作 | 是 | 各 Task 的 Worker |

因此：

> **MoA** 是一个 Agent 的多模型顾问团，**Kanban** 是多个 Agent 的持久化工作系统

要理解它的运行位置，还要区分两个时间尺度：

```text
Chat Session：一段持续的对话和工具执行现场
模型迭代：Agent 在 Session 中的一次“思考 -> 回复或调用 Tool”
```

当选中 **MoA Preset** 后，**Hermes** 会在每一次主模型迭代中运行一次「参考模型先分析，Aggregator 后行动」的循环

### 三、最小组成：谁提供意见，谁作出行动

一个 **MoA Preset** 由三类对象组成：

| 对象 | 职责 | 能否调用 Tool | 是否向用户直接回复 |
|---|---|---:|---:|
| **Reference Model** | 提供分析、反例或风险提示 | 否 | 否 |
| **Aggregator Model** | 汇总意见，决定正式回答或 Tool Call | 是 | 是 |
| **MoA Preset** | 保存模型组合与推理参数的命名配置 | 不适用 | 不适用 |

最小配置的教学示意：

```yaml
moa:
  presets:
    migration_review:
      reference_models:
        - provider: provider-a
          model: model-a
        - provider: provider-b
          model: model-b
      aggregator:
        provider: provider-c
        model: model-c
```

`migration_review` 是可选择的模型 Preset，不是一个新的 **Profile**、**Session** 或 **Agent**

```text
MoA Preset = 模型协作配置
Profile = Agent 身份和能力配置
Task = 后台工作指令
```

这组区分决定了后面的控制权：参考模型可以影响判断，但不能直接改变文件、系统或任务状态

### 四、完整例子：数据库迁移评审如何走完一次 MoA 循环

以下都是教学示例，用来说明运行时关系，不代表 Hermes 会自动把参考模型固定成这些专业角色

#### 4.1、用户提出同一个问题

```text
评审这份数据库迁移方案，指出风险，并决定是否可以执行
```

用户仍然只面对一个 **Chat Session** 和一个 Agent，不会因此出现多个聊天窗口、多个 **Kanban Task** 或多个后台 Worker

#### 4.2、Reference Models 先给出互补意见

运行时先并行调用配置好的 **Reference Models**

它们只能获得裁剪后的会话文本：用户与助手的文本消息，不包含 Hermes 系统提示词、Tool Schema 或工具调用轨迹

在这个例子中，三个参考意见可能分别是：

```text
Reference A：检查数据回填能否重复执行，是否存在重复写入
Reference B：检查锁表时间、停机窗口与回滚前提
Reference C：检查新旧 Schema 是否会破坏上游业务契约
```

它们的输出是私有建议，不会直接显示给用户，也不能替用户执行迁移

#### 4.3、Aggregator Model 决定要不要查证

**Aggregator Model** 取得正常的 Hermes 系统提示词、Tool Schema、会话上下文和参考意见

它不应把参考意见当成事实，而应作出下一步判断：

```text
若仅需概念性评审
  -> 直接给出“当前信息不足，需补充回滚方案”的结论

若需要验证脚本内容
  -> 调用 read_file / terminal 等 Tool，读取迁移脚本和执行计划
```

假设它选择读取脚本：

```text
Aggregator Model
  -> Tool Call：读取 migration.sql
  -> Hermes Runtime 执行 Tool
  -> Tool Result 写回当前 Session
```

#### 4.4、工具结果回来后，进入下一次模型迭代

工具结果返回后，当前 **Session** 已经更新，**Hermes** 会再次进入主模型迭代，并再次运行 **MoA** 流程

此时必须保持一个关键边界：

```text
Aggregator Model：拥有正常工具结果上下文，继续判断
Reference Models：仍只看到裁剪后的会话文本，不拥有 Tool Schema 或工具调用轨迹
```

因此，Reference Models 不是「三个独立审计员」，不会各自读取 `migration.sql` 并独立验证命令输出

它们提供的是模型视角，事实查证仍由 **Aggregator Model** 发起 **Tool Call**，并由 **Hermes Runtime** 执行

#### 4.5、一个模型给出唯一正式结论

最后仍由 **Aggregator Model** 对用户回答，例如：

```text
当前不可直接执行

原因：数据回填不是幂等操作，且迁移后缺少兼容读取路径
下一步：先补充幂等保护、回滚脚本和灰度窗口，再重新评审
```

到这里，读者应该能复述完整链路：

```text
多个模型提出意见
  -> 一个模型决定是否查证
  -> Runtime 执行工具
  -> 同一个模型给出唯一正式结论
```

### 五、数据流、控制权与事实边界

**MoA** 的关键不在模型数量，而在于意见、事实和行动权被刻意分开

```text
用户消息与历史对话
       │
       ├──────────────> Reference Models
       │                 裁剪后的文本上下文
       │                 私有分析意见
       │                 无 Tool Schema
       │
       └──────────────> Aggregator Model
                         正常 Agent 上下文 + 私有意见
                         正常 Tool Schema
                         唯一正式回复和 Tool Call
                                  │
                                  ▼
                           Hermes Runtime 执行 Tool
                                  │
                                  ▼
                           Tool Result 写回 Session
```

三种输出的性质不同：

| 输出 | 生产者 | 性质 | 能否直接改变外部世界 |
|---|---|---|---:|
| 参考意见 | Reference Model | 建议 | 否 |
| Tool Result | Hermes Runtime / 外部系统 | 可验证的执行结果 | 已由 Tool 执行 |
| 正式回复或下一步 Tool Call | Aggregator Model | 最终判断与行动决定 | 可以 |

这条边界解决了两个常见误解：

- **MoA 不是投票器**：三个参考模型即使意见一致，也不自动形成最终结论，Aggregator 仍要判断
- **MoA 不是事实验证器**：模型之间的共识不等于文件、数据库或外部系统的真实状态，关键事实仍应通过 Tool 核验

> 参考模型给意见，Runtime 给事实，Aggregator 作决定

### 六、它与 Kanban、delegate_task 如何组合

三种机制可以组合，但不能互相替代：

```text
Kanban Task
  -> Dispatcher 启动 Worker Process
  -> Worker 的 Agent Session 选择 MoA Preset
  -> Reference Models 提供判断视角
  -> Aggregator Model 决定是否调用 Tool 或 delegate_task
  -> Worker 将最终结果写回 Kanban Task
```

| 需求 | 首选机制 | 为什么 |
|---|---|---|
| 对同一份材料需要安全、性能、业务等多种模型视角 | **MoA** | 不改变任务边界，只增强当前判断 |
| 当前 Agent 需要立刻得到一段独立研究或分析 | `delegate_task` | 子 Agent 独立执行后，把摘要返回父 Agent |
| 工作需要跨 Profile、跨重启、人工介入、依赖和审计 | **Kanban** | 任务、状态和交接可以持久化 |

反例：

- 四个研究方向、一个评审节点和一份最终报告，应使用 **Kanban Task Graph**，而非只开更多 Reference Models
- 一段代码的快速风险判断，不需要创建 **Kanban Task**，单模型或 **MoA** 即可
- 需要独立验证生产数据库，不应把多个 Reference Models 的一致意见当成审计结果，必须通过受控 Tool 和真实证据核验

### 七、失败、降级与成本

**MoA** 提升的是判断视角，不承诺每次都比单模型更正确

| 情况 | Hermes 当前行为或应有判断 |
|---|---|
| 一个 Reference Model 凭据失败 | 不会中止整轮，失败信息与其他可用意见一并交给 Aggregator |
| Reference Models 意见冲突 | 没有自动投票或裁决，Aggregator 结合证据决定下一步 |
| `enabled: false` | 不再扇出 Reference Models，Aggregator 单独运行，等同选择其普通模型 |
| Aggregator 想再套一层 MoA | 不允许，Hermes 阻止递归 MoA Preset |
| 参考模型越多 | 不等于越可靠，可能增加相似偏见、调用成本和等待时间 |

每次模型迭代都包含多个参考调用和一次 Aggregator 调用

因此总等待时间会受最慢参考模型影响，成本也随参考调用数量增加

可以使用 `reference_max_tokens` 限制参考意见长度，保留结论、依据和反例，避免让参考模型写成长篇复述

### 八、最小可操作闭环

**MoA** 是 Model Provider，不是 Toolset，因此不需要启用 `moa` Tool

先建立或修改一个命名 Preset：

```bash
hermes moa configure architecture_review
```

查看当前 Preset：

```bash
hermes moa list
```

在当前 Session 持续选择一个 Preset：

```text
/model architecture_review --provider moa
```

只对单个问题临时使用默认 Preset：

```text
/moa 评审这个迁移方案的回滚风险
```

`/moa` 只影响这一轮，完成后会恢复原本选中的模型；若要让后续对话持续使用 MoA，应使用 `/model <preset> --provider moa`

建议先从一个明确场景开始：

```text
Preset：architecture_review
Reference Models：两个互补模型，分别偏重反例和实现风险
Aggregator Model：最可信的工具调用与结论表达模型
输入：同一批真实架构评审问题
比较：单模型与 MoA 的遗漏、耗时和成本
```

不要一开始就把所有日常 Chat 都切到 MoA

### 九、什么时候应该使用 MoA

适合：

- 架构取舍、方案评审、代码审查等存在合理分歧的问题
- 需要安全、性能、可维护性等不同思考视角的问题
- 结论质量比单轮延迟和额外模型调用成本更重要的问题
- 希望保留同一 Session 和工具循环，只提高当前判断质量的问题

不适合：

- 简单问答、格式转换、机械性文件操作
- 需要强实时响应的交互
- 关键事实尚未通过 Tool 获取的任务
- 本质上需要拆成独立角色、持久化任务或人工审批的工作流

最后的判断式：

```text
同一件事，需要多个模型视角，但只有一个行动者
  -> MoA

多件独立工作，需要多个行动者协作
  -> delegate_task 或 Kanban
```

### 十、最终心智模型

请记住以下四句话：

> **MoA** 不是多 Agent 编排，而是一个 Agent 的多模型协作

> Reference Model 给意见，Runtime 给事实，Aggregator 作决定

> 多个模型不增加行动者，只有 Aggregator 能回复用户和调用 Tool

> **Kanban** 管理多个 Agent 的工作，**MoA** 提升一个 Agent 的判断

### 十一、参考资料

- [Hermes 官方文档：Mixture of Agents](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/mixture-of-agents.md)
- [Hermes 官方文档：Kanban](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/kanban.md)
- [Hermes 官方文档：Subagent Delegation](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/delegation.md)

本文依据 Hermes 官方主分支文档整理于 2026-07-15，模型 Provider、配置字段与交互入口可能随版本演进
