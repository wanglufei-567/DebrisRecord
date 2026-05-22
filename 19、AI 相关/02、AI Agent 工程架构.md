## **AI Agent** 工程架构

### 一、**AI Agent** 是什么

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

很多人以为：**AI Coding** = 自动生成代码，但真正的本质是：**AI** 获得了操作软件工程环境的能力

它不仅能：理解代码，还能：操作环境、运行程序、获取反馈、自动验证、持续修复

因此，现代 **AI Coding** 更像「自动化软件工程系统」或「工具编排系统」，而不是传统意义上的聊天 **AI**
