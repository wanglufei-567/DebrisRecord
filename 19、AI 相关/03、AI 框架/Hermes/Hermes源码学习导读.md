## Hermes 源码学习导读

### 一、文档目标

这篇文档用于后续学习 `NousResearch/hermes-agent` 源码时建立阅读边界

重点不是把 Hermes 全仓库读完，而是先抓住 Agent 框架最核心的几条主线：

- 上下文管理
- 控制循环
- 状态与记忆
- 工具调用
- 接入层边界

Hermes 是一个完整产品化 Agent Runtime，源码规模较大，如果从 Dashboard、Gateway、具体工具或具体 memory provider 细节开始，很容易迷路

更合适的方式是先理解最小 Agent 骨架，再逐步扩展到 Hermes 的工程化能力

### 二、Agent 去掉 LLM 之后还剩什么

一个 Agent 不是单纯的 LLM 调用封装

更准确的结构是：

```text
Agent = LLM + 上下文管理 + 控制循环 + 状态/记忆 + 工具系统 + 权限边界 + 接入层
```

其中 LLM 负责推理和生成，但 Agent Runtime 负责把推理放进一个真实可执行的系统里

LLM 调用之外，Agent 至少还包括：

| 模块 | 作用 |
|---|---|
| 输入接入层 | 接收 CLI、TUI、Web、Gateway、消息平台等入口请求 |
| 上下文管理 | 决定每一轮模型能看到什么 |
| 控制循环 | 组织 LLM、工具调用、结果反馈和终止条件 |
| 状态与记忆 | 保存 session、历史、偏好、任务进度和跨会话信息 |
| 工具系统 | 让模型可以操作文件、终端、浏览器、搜索、数据库等外部能力 |
| 权限边界 | 控制哪些用户、路径、命令、工具可以被使用 |
| 输出适配层 | 把 Agent 结果返回 CLI、Web、机器人或其他客户端 |

### 三、最小可行 Agent 的核心

如果只讨论最小可行 Agent，可以压缩成三件事：

```text
上下文管理 + 控制循环 + 状态/记忆
```

再加一个很薄的模型调用层，就能组成 MVP

三者关系如下：

| 能力 | 关注点 |
|---|---|
| 上下文管理 | 给模型看什么 |
| 控制循环 | 下一步做什么 |
| 记忆系统 | 过去发生过什么 |

普通 Chatbot 更像：

```text
用户输入 → 拼 prompt → LLM 输出
```

最小 Agent 更像：

```text
用户目标
  ↓
组装上下文
  ↓
LLM 决策
  ↓
执行动作或记录状态
  ↓
把结果写回上下文
  ↓
继续下一轮
  ↓
完成任务
```

工具系统严格来说不是最小 Agent 的必要条件，但进入真实工程场景后很快会变成必要能力

因此可以分成两层：

```text
最小 Agent = 上下文管理 + 控制循环 + 状态/记忆 + 模型调用
实用 Agent = 最小 Agent + 工具系统 + 权限边界
```

### 四、应用接入模式的边界

Hermes 接入微信、QQ、Telegram、Discord 等应用时，本质上是把这些应用作为 Chat Client 使用

它替代的是独立 Web Chat、桌面端或 CLI 这一层，而不是替代 Agent Runtime

典型结构：

```text
微信 / QQ / Telegram / Discord
  ↓
机器人通道层
  ↓
Agent 接入中间层
  ↓
Hermes Runtime
  ↓
LLM + Tools + Memory
```

各层职责边界：

| 层 | 只关心什么 | 不关心什么 |
|---|---|---|
| 应用平台 | 用户、群聊、消息、机器人 API | Agent 内部如何推理 |
| 机器人通道层 | 平台协议、事件接收、消息发送 | LLM、工具、记忆 |
| Agent 接入中间层 | 鉴权、session 映射、格式转换、策略控制 | 模型如何生成答案 |
| Hermes Runtime | 上下文、控制循环、工具调用、记忆 | 微信、QQ 的协议细节 |

这套机制本质是事件驱动的一来一回网络请求：

```text
应用平台 → 机器人服务 → Hermes → 机器人服务 → 应用平台
```

复杂度不是 Agent 特有魔法，而是传统服务端中间层逻辑

真正要抓住的是边界：

```text
应用负责消息通道
机器人负责平台协议
中间层负责转换与策略
Hermes 负责 Agent 执行
```

### 五、Hermes 源码是否复杂

Hermes 的 Agent 核心逻辑并不神秘，用 Node.js / TypeScript 也能写出类似骨架：

```text
buildContext()
callLLM()
parseToolCalls()
executeTools()
appendResults()
repeatUntilDone()
saveSession()
```

真正复杂的是 Hermes 不是教学 Demo，而是完整产品化 Agent Runtime

它包含：

- 多模型 Provider
- CLI / TUI / Web Dashboard
- Gateway / 消息平台接入
- Tools / Skills / Plugins
- Session / Memory / Logs
- 权限、安全、沙箱、配置迁移
- Streaming、fallback、压缩、长上下文处理

所以源码复杂度主要来自工程化边界，而不是 Agent 控制循环本身

如果不懂 Python，也可以先按 Node.js 的流程编排思路去读

重点不是语法细节，而是找清楚：

```text
输入在哪里进入
上下文在哪里组装
模型在哪里被调用
工具在哪里被执行
状态在哪里保存
记忆在哪里注入
结果在哪里返回
```

### 六、最小源码阅读范围

建议优先阅读以下源码范围

不要从 Dashboard、Gateway、具体工具、具体 memory provider 细节开始

#### 1、入口和配置

| 文件 | 关注点 |
|---|---|
| `hermes_cli/main.py` | CLI、chat、oneshot 等入口 |
| `hermes_cli/config.py` | 配置加载、默认配置、provider、toolsets、memory、session 配置 |

先理解一次请求如何进入 Hermes：

```text
CLI / chat / oneshot
  ↓
读取 config
  ↓
创建或恢复 session
  ↓
初始化 Agent
```

#### 2、Agent 初始化

| 文件 | 关注点 |
|---|---|
| `agent/agent_init.py` | Agent 实例如何被创建 |

这部分可以类比为：

```ts
createAgent({
  model,
  tools,
  memory,
  session,
  config,
})
```

它把模型、工具、记忆、配置、session 组装成一个可运行 Agent

#### 3、控制循环

| 文件 | 关注点 |
|---|---|
| `agent/conversation_loop.py` | 对话循环、模型调用、工具结果反馈 |
| `agent/chat_completion_helpers.py` | 模型 API 调用、消息转换、provider 适配 |

这是最值得优先看的部分

核心流程：

```text
messages
  ↓
调用模型
  ↓
判断是否有 tool call
  ↓
执行工具
  ↓
追加 tool result
  ↓
再次调用模型
  ↓
直到最终回复
```

这就是 Agent 和普通 Chatbot 的核心差异

#### 4、上下文管理

| 文件 | 关注点 |
|---|---|
| `agent/prompt_builder.py` | prompt 和上下文如何组装 |
| `agent/system_prompt.py` | 系统提示词和规则构造 |
| `agent/context_engine.py` | 上下文引擎 |
| `agent/conversation_compression.py` | 长对话压缩与摘要 |

这部分回答的问题是：

```text
模型每一轮到底看见什么
```

包括系统规则、用户消息、历史消息、工具描述、技能说明、压缩摘要、记忆片段等

#### 5、工具执行

| 文件 | 关注点 |
|---|---|
| `agent/tool_executor.py` | 工具执行入口 |
| `agent/tool_dispatch_helpers.py` | 工具分发辅助逻辑 |
| `tools/registry.py` | 工具注册和查找 |

只需要先理解工具调用主链路：

```text
模型输出 tool call
  ↓
Runtime 找到对应工具
  ↓
执行工具
  ↓
把结果作为 tool result 塞回 messages
```

不要一开始阅读每个具体工具，例如 terminal、browser、file、GitHub 等

#### 6、记忆系统

先看抽象和管理层：

| 文件 | 关注点 |
|---|---|
| `agent/memory_provider.py` | memory provider 抽象接口 |
| `agent/memory_manager.py` | 记忆管理与注入 |
| `plugins/memory/__init__.py` | memory plugin 注册入口 |

具体 provider 后看：

```text
plugins/memory/honcho/
plugins/memory/hindsight/
plugins/memory/supermemory/
plugins/memory/mem0/
```

不要一开始跳进 provider 细节

### 七、Hermes 记忆机制如何理解

Hermes 的记忆机制概念不难，但实现偏复杂

可以分三层理解：

| 类型 | 作用 |
|---|---|
| 短期上下文 | 当前 session 的消息历史 |
| 中期记忆 | 压缩摘要、会话检索、任务状态 |
| 长期记忆 | 跨 session 的用户偏好、事实、经验、外部 memory provider |

Hermes 复杂在它不是只有一种 memory

它同时有：

- 内置 memory
- session history
- conversation compression
- memory provider 抽象
- 外部 memory 插件
- skills / curator 相关经验沉淀

阅读时先问三个问题：

```text
记忆从哪里写入
记忆如何被检索
记忆如何进入 prompt
```

如果能回答这三个问题，就已经抓住了主线

### 八、建议阅读顺序

建议按这个顺序阅读：

1. `README.md`，粗看 Hermes 能力边界
2. `hermes_cli/main.py`，找到请求入口
3. `agent/agent_init.py`，看 Agent 如何创建
4. `agent/conversation_loop.py`，看控制循环
5. `agent/chat_completion_helpers.py`，看模型调用和 provider 适配
6. `agent/prompt_builder.py`，看上下文如何组装
7. `agent/system_prompt.py`，看系统规则如何进入模型
8. `agent/tool_executor.py`，看工具如何执行
9. `agent/memory_provider.py`，看记忆抽象
10. `agent/memory_manager.py`，看记忆如何管理和注入
11. 最后再看具体 memory plugin、Gateway、Dashboard、具体工具

### 九、源码阅读时的判断标准

读每个文件时，不要追求逐行理解

先判断它属于哪一层：

```text
入口层
配置层
Agent 初始化层
上下文层
控制循环层
模型 provider 层
工具执行层
记忆层
接入层
UI 层
```

如果一个文件属于 UI、平台 Gateway、具体工具、具体 provider，先跳过

当前阶段优先关注：

```text
一次用户请求如何变成 Agent 执行过程
一次模型输出如何变成下一步动作
一次工具结果如何回到模型上下文
一次会话如何被保存并影响后续请求
一段记忆如何被写入、检索、注入 prompt
```

### 十、最小心智模型

可以把 Hermes 先简化成下面这个模型：

```text
User Input
  ↓
Entry / CLI / Gateway
  ↓
Session Resolver
  ↓
Context Builder
  ↓
LLM Provider
  ↓
Tool Call Parser
  ↓
Tool Executor
  ↓
Memory / Session Writer
  ↓
Loop or Final Response
```

这就是后续阅读源码时的主干

### 十一、当前阶段不要优先看的内容

以下内容不是不重要，而是不适合作为源码学习的第一入口：

- Web Dashboard
- TUI 前端实现
- 各个平台 Gateway 细节
- 每一个具体 tool 的实现
- 每一个 memory provider 的内部实现
- Docker / Nix / Homebrew packaging
- OAuth provider 细节
- Web search、image、video、voice 等扩展能力

这些都应该在主线清楚之后再看

### 十二、一句话总结

Hermes 的 Agent 核心可以用 Node.js 的流程编排思路理解

先抓住：

```text
上下文管理、控制循环、状态/记忆、工具执行
```

再去看：

```text
Provider、Gateway、Dashboard、Plugins、Skills、Memory Provider
```

不要从外围能力进入源码

先读主干，后看扩展
