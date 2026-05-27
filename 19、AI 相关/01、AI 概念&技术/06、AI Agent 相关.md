## **AI Agent** 工程架构

### 一、**AI Agent** 是什么

#### 1.1、AI Agent 的定义

传统 **LLM** 的工作方式：用户输入 **Prompt** → **LLM** 推理 → 输出文本

本质上：

- 只能生成内容
- 不能真正执行动作
- 不具备环境操作能力

而 **AI Agent** 不同，**AI Agent** 的核心是：==让 **LLM** 获得操作环境、调用工具、执行任务的能力==

```text
AI Agent = LLM + Tool Runtime + Environment
```

- **LLM** 负责理解、推理、规划

- **Tool Runtime** 负责调用工具

- **Environment** 提供真实运行环境

  例如：

  - 文件系统

  - 浏览器

  - 数据库
  - **Git**
  - **Shell**

  - **MCP Tool Server**

#### 1.2、Agent 的本质

**Agent 是一个能 “自主决策 + 调用工具 + 多步执行” 的 LLM 系统**

**Agent** 的工作流程：**理解 → 规划 → 行动 → 观察 → 再决策（循环）**

它不是单纯的“模型回答问题”，而是把 **LLM** 放进一个可执行系统里，让模型能根据目标持续做决策

```text
用户目标
  ↓
LLM 推理
  ↓
选择 Tool
  ↓
Tool Runtime 执行
  ↓
Environment 返回结果
  ↓
LLM 基于反馈继续决策
```

所以，**Agent** 的关键不只是“会说”，而是：

- 能理解目标
- 能拆解任务
- 能选择工具
- 能执行动作
- 能观察环境反馈
- 能根据反馈继续调整策略

#### 1.3、Agent 的局限

**Agent** 存在以下局限：

- **可靠性**：**LLM** 可能误判任务、选错工具、生成错误参数
- **可解释性**：多轮推理和工具调用链路较长，问题定位比普通函数调用更难
- **安全性**：**Agent** 一旦具备文件、网络、数据库、Shell 等权限，就可能造成真实副作用

因此，工程里的 **Agent** 通常需要配合：

- ==**权限控制**==
- ==**沙箱隔离**==
- ==**操作审计**==
- ==**人工确认**==
- ==可回滚机制==
- 工具白名单

#### 1.4、Agent、RPA 自动化脚本和 Workflow 的区别

**Agent**、**RPA**、**Workflow** 都能自动执行任务，但控制方式不同

| 类型 | 核心特征 | 适合场景 | 局限 |
| ---- | -------- | -------- | ---- |
| **RPA** | 按固定脚本模拟人操作 | 表单录入、固定系统操作、重复性流程 | 对页面变化和异常情况适应弱 |
| **Workflow** | 按预设流程节点执行 | 审批流、CI/CD、数据同步 | 流程提前设计好，动态决策能力弱 |
| **Agent** | 基于目标动态决策并调用工具 | 代码修复、复杂检索、多步骤分析、开放式任务 | 不确定性更高，需要权限和安全治理 |

三者的差异可以理解为：

- **RPA**：按脚本执行
- **Workflow**：按流程执行
- **Agent**：按目标动态决策

例如“处理线上报错”：

- **RPA** 适合固定打开系统、复制日志、提交表单
- **Workflow** 适合固定执行告警通知、创建工单、分配负责人
- **Agent** 适合阅读日志、判断可能原因、搜索代码、提出修复方案、运行验证命令

所以，**Agent** 不是替代所有自动化，而是适合处理传统脚本和固定流程难以覆盖的开放式任务


### 二、**AI Agent** 的完整工作流程

一个典型 **AI Agent** 的执行流程如下：

```text
用户请求
  ↓
LLM 理解需求
  ↓
任务拆解（Planner）
  ↓
工具选择（Tool Router）
  ↓
调用原子能力
  ↓
获取环境反馈
  ↓
再次推理
  ↓
继续执行
```

它本质上是：==感知 → 决策 → 执行 → 反馈 的循环系统==

这和传统聊天机器人有本质区别：

- 传统聊天：一次性输出结果


- **AI Agent**：

  - 持续观察环境

  - 动态调整行为

  - 逐步完成任务

### 三、AI Coding Agent 

#### 3.1、工作流程示例

以 **Codex** 类 **Agent** “帮我修复 **Vite** 项目启动失败” 为例，其真实工作过程通常如下：

1. 获取工程上下文

   - **Agent** 会先分析项目：

     - package.json

     - vite.config.ts

     - tsconfig.json

     - 目录结构

     - 报错信息

   - 这里通常会调用：

     - readFile

     - search

     - grep

     - glob

2. 理解项目结构

   - **LLM** 会开始推理：

     - 使用了什么框架

     - 依赖关系是否异常

     - alias 是否错误

     - 插件是否冲突

     - **TypeScript** 配置是否有问题


3. 执行 **Shell** 命令

   - 随后 **Agent** 会真正执行命令：

     ```bash
     pnpm install
     pnpm dev
     ```

   - 这里会创建：

     - bash process

     - node process

     - vite process

     这些都属于：**child process**（子进程）

4. 持续监听运行结果

   - **Agent** 会持续读取：

     - stdout

     - stderr

     - terminal stream

     - console log

     例如：

     ```text
     Port already in use
     Cannot resolve module
     TypeError
     ```

5. 修改代码

   - 发现问题后，**Agent** 会修改文件，这里会调用：

     - writeFile

     - patch

     - rename

     - diff

6. 再次验证

   - 例如再次执行：

     ```bash
     pnpm dev
     pnpm build
     npm test
     ```

   - 形成：执行 → 反馈 → 再推理的闭环


#### 3.2、AI Coding Agent 的原子能力（Tool Primitives）

**AI Agent** 的核心竞争力不是 **Prompt**，而是**Tool Primitives**（原子能力）这些能力决定了 **Agent** 能做什么

| 能力层 | 主要用途 | 典型能力 | 常见依赖 / 场景 |
| :-: | :-: | :-: | :-: |
| 文件系统能力 | 读取代码、搜索代码、修改代码，是最核心的一层 | readFile、writeFile、appendFile、rename、deleteFile、mkdir、copyFile、moveFile | 搜索：grep、glob、search、findReferences、findSymbol；Diff：diff、patch、applyPatch |
| Shell / Process 能力 | 真正执行程序，会产生 child process | runCommand、spawn、exec、fork、openTerminal、killProcess | npm、pnpm、node、python、git、vite、webpack |
| Git 能力 | 代码版本分析与变更管理 | gitStatus、gitDiff、gitCommit、gitCheckout、gitBranch、gitLog | 查看变更、分析历史、切换分支、提交版本 |
| IDE / LSP 能力 | 理解代码语义 | getDiagnostics、goToDefinition、findReferences、renameSymbol、getSymbols | TypeScript Server、Language Server Protocol（LSP）、tsserver、rust-analyzer、eslint server |
| Browser Automation 能力 | 自动测试页面、检查 DOM、获取 console error、自动点击操作 | openBrowser、click、type、scroll、screenshot、inspectDOM、captureConsole | Playwright、Puppeteer、Chrome DevTools Protocol；常见行为包括打开 localhost、点击按钮、获取报错、自动修复 |
| 网络 / API 能力 | 访问外部系统 | fetch、httpRequest、graphqlQuery、uploadFile、downloadFile | GitHub API、GitLab API、OpenAPI、Figma API |
| MCP / Tool Server 能力 | 让外部工具向 LLM 暴露能力 | database.query、figma.getDesign、browser.openPage、slack.sendMessage | 通过 Model Context Protocol（MCP）把数据库、设计工具、浏览器、协作工具等接入 Agent |

#### 3.3、AI Coding Agent 的本质

很多人以为：**AI Coding** = 自动生成代码

但真正的本质是：**AI** 获得了操作软件工程环境的能力

也就是说，**AI Coding Agent** 不是只负责“写代码”，而是参与完整的软件工程闭环：

```text
理解需求
  ↓
读取工程上下文
  ↓
定位相关代码
  ↓
修改文件
  ↓
运行命令
  ↓
读取报错和测试结果
  ↓
继续修复
  ↓
形成最终变更
```

它真正做的是把 **LLM**、文件系统、命令行、版本控制、测试框架、浏览器和外部工具连接起来

从工程角度看，**AI Coding Agent** 至少包含四个核心闭环

| 闭环 | 说明 | 典型动作 |
| ---- | ---- | -------- |
| 上下文闭环 | 持续读取项目结构、代码、配置、报错和文档 | readFile、search、grep、findReferences |
| 执行闭环 | 真正运行项目、测试、构建和脚本 | `pnpm test`、`pnpm build`、`git diff` |
| 反馈闭环 | 从 stdout、stderr、diagnostics、test result 中获得反馈 | 读取终端输出、分析错误堆栈、查看测试失败 |
| 修复闭环 | 基于反馈继续修改代码并重新验证 | patch、applyPatch、rename、重新运行命令 |

因此，**AI Coding Agent** 的能力边界不是“能不能生成函数”，而是：

- 能否读懂现有工程结构
- 能否定位真正相关的文件
- 能否选择正确的命令验证结果
- 能否从失败日志中提取有效信号
- 能否把修改控制在合理范围
- 能否避免破坏用户已有改动
- 能否形成可验证、可回滚的变更

例如修复一个 **TypeScript** 报错时，它不是简单生成一段代码，而是会经历：

```text
读取 tsconfig.json
→ 搜索相关类型定义
→ 打开报错文件
→ 判断类型不匹配原因
→ 修改最小必要代码
→ 运行 tsc / test
→ 根据结果继续调整
```

这也是 **AI Coding Agent** 和普通聊天 **LLM** 的区别：

| 对比项 | 普通 **LLM** | **AI Coding Agent** |
| ------ | ------------ | ------------------- |
| 输入 | 用户描述和上下文片段 | 完整工程环境、文件、命令输出、工具结果 |
| 输出 | 文本、代码片段、解释 | 实际文件修改、命令执行、测试验证、提交建议 |
| 反馈 | 主要依赖用户继续提问 | 直接读取环境反馈并继续迭代 |
| 风险 | 答错、幻觉 | 真实修改文件、运行命令、影响仓库状态 |

所以，现代 **AI Coding** 更像「自动化软件工程系统」或「工具编排系统」，而不是传统意义上的聊天 **AI**
