## **AI Agent** 工程架构

### 一、**AI Agent** 是什么

#### 1.1、AI Agent 的定义

传统 **LLM** 的工作方式：用户输入 **Prompt** → **LLM** 推理 → 输出文本

缺陷：

- 只能生成内容
- 不能真正执行动作

而 **AI Agent** 不同，**AI Agent** 的核心是：==让 **LLM** 获得操作环境、调用工具、执行任务的能力==

```text
AI Agent = LLM + Context System + Action System + Control Loop
```

- **LLM**：负责推理、规划、生成决策

- **Context System（Memory / Context）**：负责保存和组织任务状态、历史信息、外部观察、用户偏好
- **Action System（Tool / Action）**：负责把模型决策转成外部动作，例如查文件、跑命令、调 API、操作浏览器
- **Control Loop / Harness**：负责把“观察 → 推理 → 行动 → 反馈 → 再推理”串成一个可持续执行的系统

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

**Agent** 的关键不只是“会说”，而是能：

- 理解目标
- 拆解任务
- 选择工具
- 执行动作
- 观察环境反馈
- 根据反馈继续调整策略

#### 1.3、Agent 的局限

**Agent** 存在以下局限：

- ==**可靠性**：**LLM** 可能误判任务、选错工具、生成错误参数==
- ==**可解释性**：多轮推理和工具调用链路较长，问题定位比普通函数调用更难==
- ==**安全性**：**Agent** 一旦具备文件、网络、数据库、Shell 等权限，就可能造成真实副作用==

因此，工程里的 **Agent** 通常需要配合：

- ==**权限控制**==
- ==**沙箱隔离**==
- ==**操作审计**==
- ==**人工确认**==
- ==可回滚机制==
- 工具白名单


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

     - 配置文件：package.json、vite.config.ts、tsconfig.json
  - 目录结构
     - 报错信息
- 这里通常会调用：
   
  - readFile
     - search
  - grep
2. 理解项目结构

   - **LLM** 会开始推理：

     - 依赖关系是否异常
     - alias 是否错误
     - 插件是否冲突


3. 执行 **Shell** 命令

   - 随后 **Agent** 会真正执行命令：

     ```bash
     pnpm install
     pnpm dev
     ```

4. 持续监听运行结果

   - **Agent** 会持续读取终端运行输出信息

     例如：

     ```text
  Port already in use
     Cannot resolve module
  TypeError
     ```

5. 修改代码

   - 发现问题后，**Agent** 会修改文件

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

**AI Coding** 不是自动生成代码，**AI** 是获得了操作软件工程环境的能力，**AI** 不是只负责“写代码”，而是参与完整的软件工程闭环：

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
