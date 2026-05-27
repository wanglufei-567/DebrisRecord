## MCP

### 一、概述

#### 1.1、MCP 到底是什么

**MCP（Model Context Protocol）**是一个让 **Agent / LLM** 能==以统一方式调用外部工具的**协议规范**==

> **MCP** 本质上是一套 **AI Tool** 调用协议

主要解决的问题：

- **Tool** 如何声明
- **Agent** 如何发现 **Tool**
- **Agent** 如何调用 **Tool**
- **Tool** 如何返回结果
- **Context Resource** 如何暴露

#### 1.2、MCP 协议与 MCP Server 的区别

**MCP 协议**是一套规范，类似 **HTTP 协议**、**WebSocket 协议**

它规定请求怎么写、响应怎么写、有哪些标准 `method`，本身不提供具体能力

**MCP Server** 是实现了 **MCP 协议**的服务，类似 **Web Server**

例如：

- **GitHub MCP Server**
- **Jira MCP Server**
- **Database MCP Server**

这些服务内部调用 **GitHub API**、查询数据库或读取文件系统，再通过 **MCP 协议**暴露给 **Agent**

#### 1.3、MCP 的整体架构

整体结构：

```txt
Agent / LLM
    ↓
MCP Client
    ↓（JSON-RPC）
MCP Server
    ↓
GitHub / DB / Filesystem
```

例如：

> 用户：帮我 review PR

执行流程：

```txt
Agent
→ 调用 GitHub MCP Server
→ 获取 PR diff
→ LLM 分析
→ 调用 comment tool
→ 自动发表评论
```

### 二、MCP 的核心组成

**MCP** 可以分为两层：

| 层级                | 作用                                                   |
| ------------------- | ------------------------------------------------------ |
| **Transport Layer** | 负责底层连接、消息传输、消息分帧和认证                 |
| **Data Layer**      | 基于 **JSON-RPC 2.0** 定义消息结构、生命周期和核心能力 |

层级关系如下：

```txt
MCP
├── Transport Layer
│     ├── stdio
│     └── Streamable HTTP
│
└── Data Layer
      ├── JSON-RPC 2.0 消息结构
      ├── Server Primitives
      │     ├── Tools
      │     ├── Resources
      │     └── Prompts
      └── 其他协议流程
            ├── Lifecycle Management
            ├── Capability Negotiation
            └── Notifications
```

#### 2.1、Transport Layer（传输层）

**MCP** 不限制底层通信方式

常见：

| **Transport**    | 说明                 |
| ---------------- | -------------------- |
| **stdio**        | 本地进程通信         |
| **Streamable HTTP** | 网络通信          |
| **HTTP/SSE**     | 早期常见网络通信方式 |

==**MCP** 是“应用层协议”，**HTTP** 只是它的一种传输方式==

#### 2.2、Data Layer（数据层）

**Data Layer** 定义 **MCP Client** 和 **MCP Server** 之间==如何交换结构化消息==

对理解 **MCP Tool 调用**来说，可以先抓住两件事：

| 内容                      | 作用                                 |
| ------------------------- | ------------------------------------ |
| **JSON-RPC 2.0 消息结构** | 定义请求、响应、错误、通知的统一格式 |
| **Server Primitives**     | 定义服务端可暴露给客户端的能力       |

其中，**JSON-RPC 2.0** 是消息格式基础；**Server Primitives** 是 **MCP Server** 暴露能力的核心

> 完整规范里，**Data Layer** 还包括一些辅助协议流程：
>
> - **Lifecycle Management**：初始化连接、协商协议版本、关闭连接
> - **Capability Negotiation**：协商客户端和服务端分别支持哪些能力
> - **Notifications**：服务端能力变化时通知客户端，例如工具列表变化
>
> 另外，**MCP** 也支持 **Client Primitives**，也就是客户端暴露给服务端的反向能力，例如 **sampling**、**elicitation**、**logging**
>
> 但在普通 **MCP Server 调用工具**的场景里，主线仍然是：
>
> ```txt
> MCP Client
> → tools/list 发现工具
> → tools/call 调用工具
> → MCP Server 返回结果
> ```
>

##### 2.2.1、JSON-RPC：消息格式基础

**JSON-RPC（JSON-Remote Procedure Call）** 是==一种轻量级远程过程调用协议==

- 它用 **JSON** 表示请求、响应、错误和通知，==让一个程序可以通过统一消息格式调用另一个程序暴露的方法==
- ==它只定义消息格式和处理规则==，不绑定具体传输层

在 **MCP** 中，**JSON-RPC 2.0** 是 **Data Layer** 的消息格式基础

一个 **JSON-RPC** 请求通常包含：

| 字段      | 是否必需 | 作用                                                   |
| --------- | -------- | ------------------------------------------------------ |
| `jsonrpc` | 必需     | 协议版本，JSON-RPC 2.0 中固定为 `"2.0"`                |
| `method`  | 必需     | 要调用的方法名                                         |
| `params`  | 可选     | 调用参数，可以是对象或数组                             |
| `id`      | 可选     | 请求 ID，用于把响应和请求对应起来；没有 `id` 时表示通知 |

请求示例：

```json
{
  "jsonrpc": "2.0",
  "method": "subtract",
  "params": [42, 23],
  "id": 1
}
```

对于带 `id` 的请求，响应里必须带回同一个 `id`，这样请求方才能知道这次响应对应哪一次请求

成功响应包含 `result`；失败响应包含 `error`；二者不会同时出现

成功响应示例：

```json
{
  "jsonrpc": "2.0",
  "result": 19,
  "id": 1
}
```

错误响应示例：

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32601,
    "message": "Method not found"
  },
  "id": 1
}
```

对 **MCP** 来说，`method` 决定当前执行哪类协议操作，常见标准 `method` 如下：

- `tools/list`：获取工具列表
- `tools/call`：调用工具
- `resources/list`：获取资源
- `resources/read`：读取资源
- `prompts/list`：获取 **Prompt** 模板

##### 2.2.2、Server Primitives：Tools、Resources、Prompts

在 **Data Layer** 中，**MCP Server** 主要通过三类 **Server Primitives** 暴露能力

```txt
MCP Server
├── Tools
│     └── 可执行动作，例如查询 PR、读数据库、调用业务 API
├── Resources
│     └── 可读取上下文，例如文件、数据库记录、文档内容
└── Prompts
      └── 可复用提示词模板
```

> 其中，**Tools** 的声明结构一般包含：
>
> - `name`：工具名称
> - `description`：工具说明
> - `inputSchema`：工具入参的 **JSON Schema**

三类能力的边界如下：

| 类型          | 核心作用                 | 谁通常决定使用它           | 常见 `method` |
| ------------- | ------------------------ | -------------------------- | ----------- |
| **Tools**     | 执行动作、调用外部系统   | 模型或 **Agent** 根据任务决定  | `tools/list`、`tools/call` |
| **Resources** | 暴露可读取的上下文数据   | 应用、用户或 **Agent** 选择读取 | `resources/list`、`resources/read` |
| **Prompts**   | 暴露可复用的提示词模板   | 用户或应用选择使用         | `prompts/list`、`prompts/get` |

它们不是同一种东西：

- **Tool**：偏“动作”，例如查 PR、发评论、查询数据库、创建工单
- **Resource**：偏“数据”，例如文件内容、数据库 schema、项目文档、日志片段
- **Prompt**：偏“模板”，例如 code review 模板、SQL 分析模板、故障排查模板

对 **AI Agent** 来说，最常用的是 **Tools**，因为 **Agent** 需要通过工具改变外部世界或获取实时信息

但 **Resources** 和 **Prompts** 也很重要：

- **Resources** 解决“上下文从哪里来”
- **Prompts** 解决“某类任务如何组织提示词”
- **Tools** 解决“具体动作如何执行”

### 三、Agent 如何通过 MCP 与 MCP Server 交互

下面用一个具体例子说明：

> 用户：帮我查看 facebook/react 的 123 号 PR，并总结风险

假设本地已经接入一个 **GitHub MCP Server**，它暴露了 `get_pull_request` 这个工具

#### 3.1、连接和初始化

首先，**MCP Client** 与 **MCP Server** 建立连接

如果是本地工具，常见方式是 `stdio`：

```txt
Agent Host
└── 启动 GitHub MCP Server 子进程
    └── 通过 stdin/stdout 交换 JSON-RPC 消息
```

连接建立后，客户端会发起初始化请求

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {},
    "clientInfo": {
      "name": "example-agent",
      "version": "1.0.0"
    }
  }
}
```

`initialize` 表示要建立一条 **MCP** 协议会话：

- 确认双方使用的协议版本
- 声明 **Client** 自己支持哪些能力
- 获取 **Server** 支持哪些能力类别
- 获取 **Server** 的基本信息

这个请求里的关键字段是：

| 字段 | 说明 |
| ---- | ---- |
| `protocolVersion` | **Client** 希望使用的 **MCP** 协议版本 |
| `capabilities` | **Client** 自己支持的能力；这里为空，表示暂不声明额外能力 |
| `clientInfo` | **Client** 的名称和版本，便于 **Server** 识别调用方 |

**Server** 返回自身支持的能力类别：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "tools": {
        "listChanged": true
      }
    },
    "serverInfo": {
      "name": "github-mcp-server",
      "version": "1.0.0"
    }
  }
}
```

这个响应里的关键字段是：

| 字段 | 说明 |
| ---- | ---- |
| `protocolVersion` | **Server** 接受并返回的协议版本 |
| `capabilities.tools` | 表示 **Server** 支持 **Tools** 能力 |
| `capabilities.tools.listChanged` | 表示工具列表变化时，**Server** 可以通知 **Client** |
| `serverInfo` | **Server** 的名称和版本 |

#### 3.2、发现工具

初始化完成后，**Agent** 不应该凭空猜 **Server** 有哪些工具，而是通过 `tools/list` 获取工具清单

**Client** 请求：

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

**Server** 返回：

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "get_pull_request",
        "description": "Get GitHub pull request details",
        "inputSchema": {
          "type": "object",
          "properties": {
            "repo": {
              "type": "string",
              "description": "Repository name, for example facebook/react"
            },
            "prNumber": {
              "type": "number",
              "description": "Pull request number"
            }
          },
          "required": ["repo", "prNumber"]
        }
      }
    ]
  }
}
```

上面这个工具定义可以拆成几部分理解：

| 字段 | 说明 | 对 **Agent** 的影响 |
| ---- | ---- | --------------- |
| `name` | 工具名是 `get_pull_request` | 后续 `tools/call` 要用这个名字指定调用哪个工具 |
| `description` | 工具用途是获取 **GitHub PR** 详情 | **LLM** 据此判断它是否适合当前任务 |
| `inputSchema.type` | 入参整体是 `object` | 调用参数应该是一个对象 |
| `inputSchema.properties.repo` | `repo` 是字符串 | 可以从用户输入里的 `facebook/react` 提取 |
| `inputSchema.properties.prNumber` | `prNumber` 是数字 | 可以从用户输入里的 `123` 提取 |
| `inputSchema.required` | `repo` 和 `prNumber` 必填 | 调用前必须补齐这两个参数 |

#### 3.3、LLM 决策是否调用工具

此时 **LLM** 并不是直接调用 **GitHub API**

它拿到的是：

- 用户目标
- 当前上下文
- **MCP Client** 提供的工具列表
- 每个工具的 `name`、`description`、`inputSchema`

然后模型判断：

```txt
用户要查看 PR
→ 工具列表中有 get_pull_request
→ description 表明它能获取 PR 详情
→ inputSchema 要求 repo 和 prNumber
→ 用户输入中可以提取 repo = facebook/react
→ 用户输入中可以提取 prNumber = 123
→ 参数齐全，可以调用工具
```

于是 **Agent** 决定调用工具

#### 3.4、调用工具

**Client** 发送 `tools/call`：

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "get_pull_request",
    "arguments": {
      "repo": "facebook/react",
      "prNumber": 123
    }
  }
}
```

**MCP Server** 收到请求后，在内部调用 **GitHub API**：

```txt
MCP Server
→ 校验 arguments
→ 调用 GitHub API
→ 整理返回结果
→ 返回 MCP tool result
```

**Server** 返回：

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "PR #123 changes 8 files, adds a new cache layer, and modifies retry behavior."
      }
    ],
    "isError": false
  }
}
```

#### 3.5、LLM 基于工具结果继续推理

**Agent** 把工具结果交给 **LLM**，**LLM** 继续分析风险点：

1. 缓存失效策略是否正确
2. 重试是否导致重复请求
3. 错误处理是否会吞掉异常

最后返回用户：

> 这个 PR 的主要风险集中在缓存一致性和重试副作用，建议重点检查...

完整数据流如下：

```txt
用户
↓
Agent Host
↓
LLM 判断是否需要工具
↓
MCP Client 发起 JSON-RPC 请求
↓
MCP Server 执行外部系统调用
↓
MCP Server 返回工具结果
↓
LLM 基于结果继续推理
↓
Agent 返回最终回答
```

这里要区分清楚：

| 角色           | 作用 |
| -------------- | ---- |
| **LLM**        | 负责理解任务、推理、决定是否需要工具、生成最终回答 |
| **Agent**      | 负责编排上下文、工具调用、执行步骤和反馈循环 |
| **MCP Client** | 负责按 **MCP** 协议向 **Server** 发请求 |
| **MCP Server** | 负责把外部系统能力包装成 **Tools**、**Resources**、**Prompts** |
| **Tool**       | 具体可调用能力，例如查询 **PR**、读数据库、写文件 |

### 四、总结

#### 4.1、MCP 对于 Agent 的价值

**MCP** 的核心价值是把 **Agent** 与外部工具之间的集成方式标准化，让 **Agent** 用统一协议发现和调用外部能力

在没有 **MCP** 之前，每个 **Agent** 应用都要单独适配外部系统：

```txt
Agent
├── GitHub API adapter
├── Jira API adapter
├── Database adapter
├── Slack adapter
└── Filesystem adapter
```

**MCP** 把这层关系改成：

```txt
Agent
↓
MCP Client
↓
多个 MCP Server
↓
GitHub / Jira / DB / Filesystem / SaaS
```

#### 4.2、MCP 的缺陷与未来展望

##### 4.2.1、MCP 的缺陷

在一些 **AI Coding** 和个人开发场景里，开发者开始减少 **MCP** 的使用，转向 **CLI** 或 **Skill**

核心原因不是 **MCP** 协议失效，而是它==在这些场景里成本偏高，尤其是 **token** 消耗偏高==

**MCP Server** 暴露工具时，通常要把 `tool.name`、`description`、`inputSchema` 等元信息交给 **Agent**

如果工具很多，或 `inputSchema` 很复杂，就会占用大量上下文：

- 工具越多，工具列表越长
- 参数越复杂，`inputSchema` 越长
- 很多本轮用不到的工具，也可能被提前注入上下文

例如，浏览器自动化 **MCP Server** 可能暴露：

```txt
browser_navigate
browser_click
browser_type
browser_screenshot
...
```

这些工具都需要描述参数结构，模型还没执行任务，就已经==消耗了一批 **token** 来“认识工具”==，这就是 **MCP** 在本地开发场景里显得“不够轻”的主要原因

##### 4.2.2、为什么越来越多人选择 CLI

相比 **MCP**，**CLI** 在 **AI Coding** 场景里更自然：

| 原因 | 说明 | 典型例子 |
| ---- | ---- | -------- |
| 模型更熟悉 | 训练语料中有大量命令行示例，不一定需要提前读取完整 schema | `git diff`、`rg`、`npm test`、`curl` |
| **token** 成本更低 | **Agent** 可以按需探索和执行，而不是提前加载完整工具列表 | `git --help`、`git diff --stat` |
| 组合更灵活 | 可以直接组合命令、管道和操作系统能力 | `rg "TODO" src \| head` |
| 调试更直接 | 可以复制命令运行，直接看到 stdout、stderr、exit code | `pnpm test` |

- **CLI** 的模式是“需要什么查什么”
- **MCP** 更容易变成“先把工具清单和参数 `schema` 注入上下文”

这也是 **CLI** 在一次性、本地开发任务里更省 **token** 的原因

##### 4.2.3、CLI 的缺陷

**CLI** 的问题是：

- 灵活，但不够可控

  常见风险包括：

  - 参数写错

  - 路径写错

  - 命令不存在

  - 输出格式和预期不一致

  - 不同操作系统行为不同


- 安全边界也更难控制

  - 如果 **Agent** 拥有 **shell** 权限，理论上可以执行高风险命令：

    ```bash
    rm -rf
    curl | sh
    ```

- 输出信息不是结构化数据
  - **CLI** 输出通常是给人看的文本，不是稳定 **API**，即使支持 `--json`，不同工具的 **JSON** 结构也不统一

因此，个人开发者可以接受 **CLI** 的风险，但在多人、多租户、企业权限体系下，**CLI** 的风险会被放大，不会轻易让 **Agent** 执行任意 **shell** 命令

##### 4.2.4、MCP 相比 CLI 的优势

**MCP** 的优势来自强约束：不如 **CLI** 灵活，但更可控

| 对比项 | **CLI** | **MCP** |
| ------ | --- | --- |
| 能力边界 | 取决于 **shell** 和系统权限 | 由 **MCP Server** 明确暴露 |
| 参数结构 | 依赖命令文档和模型经验 | 由 `inputSchema` 明确定义 |
| 调用方式 | 灵活组合，但容易越界 | 固定 `method` 和 `arguments` |
| 返回结果 | 文本为主，格式不一定稳定 | 可以返回结构化 `content` |
| 权限控制 | 需要额外做命令级限制 | 可以在 **Server** 内做能力级限制 |
| 审计治理 | 需要记录 **shell** 命令和环境 | 可以记录工具调用、参数和结果 |

**MCP** 更适合把能力封装成明确边界，例如只能查 **PR**、只能访问当前用户授权的数据、只能调用经过审核的业务 **API**

在云端产品里，**MCP Server** 可以集中处理：

- **OAuth** 和用户身份
- 权限校验
- 参数校验
- 调用审计
- 多租户隔离

这些能力用 **CLI** 也能做，但通常要额外搭建安全和治理层

##### 4.2.5、CLI 和 MCP 的适用场景

更合理的结论不是“**CLI** 取代 **MCP**”，而是二者分工不同：

| 场景 | 更适合 | 原因 |
| ---- | ------ | ---- |
| 个人开发、本地 **AI Coding** | **CLI** | **token** 成本低、模型熟悉、调试方便、组合灵活 |
| 临时脚本、一次性排查 | **CLI** | 不需要封装工具，直接执行命令更快 |
| 云端 **Agent** 产品 | **MCP** | 需要明确能力边界、认证、审计和权限控制 |
| 企业 **SaaS** 集成 | **MCP** | 需要按用户授权访问外部系统 |
| 多租户环境 | **MCP** | 不能让 **Agent** 直接执行任意 **shell** 命令 |
| 稳定、可复用、高频能力 | **MCP** / **Skill** | 适合沉淀成受控工具或任务模板 |

总结：

- **CLI** 更适合个人、本地、开发者、低成本、高灵活任务
- **MCP** 更适合云端、企业、跨系统、强权限、可审计任务

> **MCP** 不再适合作为所有 **Agent** 工具连接的默认答案，但仍然适合作为云端产品和企业场景中的受控工具协议层

