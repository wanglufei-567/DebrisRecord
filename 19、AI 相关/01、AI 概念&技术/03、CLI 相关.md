## CLI

### 一、概述

#### 1.1、CLI 到底是什么

**CLI（Command Line Interface）**是通过文本命令与程序、系统或服务交互的接口形式

> **CLI** 本质上是一套面向人和程序的命令调用接口

常见例子：

- `git status`
- `npm test`
- `pnpm dev`
- `curl https://example.com`
- `docker ps`
- `kubectl get pods`

传统 **CLI** 主要解决的问题：

- 如何用命令表达操作意图
- 如何通过参数控制行为
- 如何读取命令输出
- 如何判断命令是否成功
- 如何把多个命令组合成工作流

因此，**CLI** 本身不是 **AI** 时代的新概念，它早就存在于传统软件工程中，例如 **Git**、**npm**、**Docker**、**kubectl**

在 **AI Coding** 场景里，**CLI** 重新变得重要，是因为使用者发生了变化：

| 维度 | 传统 **CLI** | **AI Agent** 中的 **CLI** |
| ---- | ------------ | ------------------------- |
| 使用者 | 人类开发者 | **Agent / LLM** |
| 调用方式 | 人手动输入命令 | **Agent** 自动选择并执行命令 |
| 反馈处理 | 人阅读输出并判断下一步 | **LLM** 读取 `stdout`、`stderr`、`exit code` 后继续推理 |
| 主要风险 | 人误操作 | 模型误判、误生成命令、自动执行危险操作 |
| 设计重点 | 人类易用 | 人和 **Agent** 都易用，输出稳定、错误清晰、可解析 |

#### 1.2、CLI 和 Shell 的区别

**CLI** 是程序暴露出来的命令行接口

**Shell** 是执行命令的运行环境，例如 `bash`、`zsh`、`fish`

二者关系如下：

```txt
用户 / Agent
    ↓
Shell
    ↓
CLI 程序
    ↓
操作系统 / 文件系统 / 网络 / 外部服务
```

例如：

```bash
# zsh / bash
git diff --stat

# git：CLI 程序
# diff：子命令
# --stat：参数，用来控制输出格式
```

#### 1.3、传统 CLI 和 AI Agent 中 CLI 的区别

**AI Agent** 中的 **CLI** 不是一种新的 **CLI** 类型，而是传统 **CLI** 被 **Agent** 自动调用

核心区别在调用链路：

```txt
传统 CLI
用户
→ Shell
→ CLI
→ 用户阅读输出
→ 用户决定下一步

AI Agent 中的 CLI
用户
→ Agent / LLM
→ Shell
→ CLI
→ Agent 读取输出
→ LLM 决定下一步
```

调用链路变化后，**CLI** 的设计重点也会变化

传统 **CLI** 更关注人类体验：

- 命令好记
- 帮助文档清楚
- 输出适合人阅读
- 交互体验友好

**Agent** 友好的 **CLI** 更关注机器可解析性和可控性：

- 输出是否稳定
- 是否支持 `--json`
- `exit code` 是否可靠
- 是否能非交互式运行
- 错误信息是否清晰
- 高风险操作是否可控

#### 1.4、CLI 和 MCP 的关系

**CLI** 和 **MCP** 都可以让 **Agent** 调用外部能力，但定位不同

| 对比项 | **CLI** | **MCP** |
| ------ | ------- | ------- |
| 核心形式 | 文本命令 | 协议化工具调用 |
| 调用方式 | 通过 **Shell** 执行命令 | 通过 **MCP Client** 调用 **MCP Server** |
| 能力发现 | 依赖文档、`--help`、模型经验 | 依赖 `tools/list` 和 `inputSchema` |
| 参数约束 | 较弱，主要靠命令文档 | 较强，由 `inputSchema` 定义 |
| 灵活性 | 高 | 中等 |
| 可控性 | 低到中等 | 中到高 |
| 典型场景 | 个人开发、本地自动化、临时排查 | 云端产品、企业集成、权限审计 |

==**CLI** 更适合低成本、高灵活的本地任务；**MCP** 更适合强约束、可审计的产品化场景==

### 二、传统 CLI 的核心组成

一个成熟的 **CLI** 通常由以下部分组成：

```txt
CLI
├── Command
├── Subcommand
├── Arguments
├── Options / Flags
├── stdin
├── stdout / stderr
├── Exit Code
└── Environment
```

#### 2.1、Command 与 Subcommand

`command` 是入口命令，`subcommand` 是具体动作

例如：

```bash
git status
git diff
git commit

# git 是主命令
# status、diff、commit 是具体动作
```

#### 2.2、Arguments 与 Options

**Arguments** 通常表示“操作对象”

**Options / Flags** 通常表示“如何操作”

例如：

```bash
rg "MCP" 19、AI\ 相关

# "MCP" 19、AI\ 相关 是 Arguments， "MCP"：搜索关键词，19、AI\ 相关：搜索目录

git log --oneline -5
#  --oneline -5 是 Options / Flags，--oneline：控制输出为单行格式，-5：只显示最近 5 条
```

#### 2.3、stdin、stdout、stderr

**CLI** 的输入输出通常基于三个标准流：

- `stdin`：标准输入，接收外部输入
- `stdout`：标准输出，返回正常结果
- `stderr`：标准错误，返回错误和诊断信息

例如：

```bash
cat package.json | jq '.scripts'
```

数据流如下：

```txt
cat package.json
→ stdout
→ jq '.scripts'
→ stdout
```

这也是 **CLI** 灵活的核心原因：命令之间可以通过管道组合

#### 2.4、Exit Code

`exit code` 用来表示命令执行是否成功

常见规则：

- `0`：成功
- 非 `0`：失败

例如：

```bash
pnpm test
```

如果测试通过，通常返回 `0`；如果测试失败，返回非 `0`

对 **Agent** 来说，`exit code` 很重要，因为它可以作为控制流判断条件：

```txt
exit code = 0
→ 继续下一步

exit code != 0
→ 读取错误日志
→ 修改代码
→ 重新运行测试
```

#### 2.5、Environment

**CLI** 运行时还会受到环境变量、工作目录、权限和系统依赖影响

常见因素：

- 当前工作目录
- 环境变量，例如 `NODE_ENV`
- 用户权限
- 可执行文件路径，例如 `PATH`
- 系统中是否安装依赖

这也是 **CLI** 容易出现“不稳定”的原因之一：

```txt
同一条命令
在不同目录、不同系统、不同环境变量下
可能得到不同结果
```

### 三、AI Agent 如何通过 CLI 执行任务

下面用一个具体例子说明：

> 用户：帮我检查这次修改有没有破坏测试

#### 3.1、理解任务

**LLM** 先理解用户目标：

```txt
用户想确认当前代码修改是否通过测试
需要查看改动范围
需要运行测试
需要根据结果判断是否有问题
```

此时 **LLM** 不直接修改系统，而是由 **Agent** 组织步骤

#### 3.2、选择命令

**Agent** 根据任务选择命令：

```bash
git status --short
git diff --stat
pnpm test
```

选择依据：

- `git status --short`：查看工作区状态
- `git diff --stat`：查看改动范围
- `pnpm test`：运行测试

#### 3.3、执行命令

**Agent** 通过 **Shell** 执行命令：

```txt
Agent
→ Shell
→ CLI 程序
→ stdout / stderr / exit code
→ Agent
→ LLM
```

例如测试失败时，**Agent** 会拿到：

```txt
exit code: 1
stderr: AssertionError ...
stdout: failed tests ...
```

然后 **LLM** 根据输出继续分析

#### 3.4、根据结果迭代

如果测试失败，**Agent** 通常会继续执行：

```bash
rg "failedFunction"
sed -n '1,160p' src/example.ts
```

然后进入下一轮：

```txt
读取错误
→ 定位代码
→ 修改实现
→ 重新运行测试
→ 输出结论
```

这就是 **AI Coding** 中 **CLI** 非常常见的工作流

### 四、Agent 友好的 CLI 设计

传统 **CLI** 面向人，**AI Agent** 中的 **CLI** 同时要面向人和模型

#### 4.1、输出稳定

如果 **Agent** 要解析输出，输出格式必须尽量稳定

不稳定的输出：

```txt
Found 3 files!
Great, all checks passed.
```

更适合 **Agent** 的输出：

```json
{
  "matchedFiles": 3,
  "status": "passed"
}
```

所以，一个 **Agent** 友好的 **CLI** 最好支持：

- 默认输出给人看
- `--json` 输出给程序和 **Agent** 解析
- 错误时也返回结构化错误信息

#### 4.2、Exit Code 可靠

**Agent** 通常会根据 `exit code` 判断下一步

| `exit code` | **Agent** 的理解 |
| ----------- | ---------------- |
| `0` | 成功，可以继续 |
| 非 `0` | 失败，需要读取错误并处理 |

因此，**CLI** 不应该把失败伪装成成功

例如，测试失败就应该返回非 `0`，而不是只在 `stdout` 打印一段失败信息

#### 4.3、避免强交互

很多传统 **CLI** 会要求用户二次确认：

```txt
Are you sure? (y/n)
```

这对人类友好，但对 **Agent** 不一定友好

更好的设计是：

- 默认保护高风险操作
- 支持显式参数，例如 `--yes`
- 在危险命令上要求更明确的权限
- 在 **Sandbox** 中限制可访问资源

#### 4.4、错误信息可诊断

**Agent** 需要根据错误信息继续修复问题

不好的错误信息：

```txt
failed
```

更好的错误信息：

```txt
Config file not found: ./cli.config.json
Run `my-cli init` to create one.
```

这类错误信息能直接指导下一步动作

### 五、CLI 的优势与缺陷

#### 5.1、CLI 的优势

**CLI** 在 **AI Coding** 场景里更自然，主要原因是成本低、灵活、模型熟悉

| 优势 | 说明 | 典型例子 |
| ---- | ---- | -------- |
| 模型更熟悉 | 训练语料中有大量命令行示例，不一定需要提前读取完整 schema | `git diff`、`rg`、`npm test` |
| **token** 成本低 | 按需探索和执行，不需要提前注入完整工具列表 | `git --help`、`git diff --stat` |
| 组合灵活 | 可以组合命令、管道和操作系统能力 | `rg "TODO" src \| head` |
| 调试直接 | 可以复制命令运行，直接看到输出和退出码 | `pnpm test` |

**CLI** 的模式是“需要什么查什么”，这也是它在个人、本地、临时开发任务里通常比 **MCP** 更轻的原因

#### 5.2、CLI 的缺陷

**CLI** 的问题是灵活但不够可控

常见风险：

- 参数写错
- 路径写错
- 命令不存在
- 输出格式不稳定
- 不同操作系统行为不同

安全风险也更明显，如果 **Agent** 拥有 **shell** 权限，理论上可以执行高风险命令：

```bash
rm -rf
curl | sh
```

即使有 **Sandbox**，也需要限制命令白名单、目录权限、网络权限和危险参数

因此，**CLI** 适合个人和本地开发场景，但不适合在云端产品里直接暴露任意 **shell** 能力
