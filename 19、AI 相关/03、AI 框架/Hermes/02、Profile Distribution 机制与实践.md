## **Profile Distribution** 机制与实践

### 一、前言

这篇文档讲解了一个 **Hermes Profile Distribution** 被安装、加载、更新、扩展和验证的过程

它的重点不是介绍某个业务 **Profile**，而是用一个最小但完整的工程样本说明：

- **Profile Source** 和 **Runtime Instance** 的边界
- **Hermes** 如何从本地目录或远程 **Git** 安装 **Profile**
- `distribution.yaml`、`SOUL.md`、`config.yaml`、`skills/`、`cron/`、`tools/`、**MCP** 和 **L4** 数据各自承担什么职责
- 为什么 `.env`、`sessions/`、`logs/`、`memory/`、`local/` 属于本机私有状态
- 如何把本地工具逐步升级为 **Agent** 可调用的 **MCP Tool**
- 发布远程 **Profile** 前应该如何做质量门禁和测试 **Profile** 回归

### 二、核心模型

**Hermes Profile Distribution** 是==一套可分发的 **Agent** 配置和扩展内容==

它交付的不是 **Hermes Runtime** 本身，而是 **Runtime** 可以加载的一组 **Profile** 内容：

- **Agent** 身份和行为约束
- **Profile** 级 **Runtime** 配置
- **Profile-local Skills**
- **Profile-local Tools**
- **MCP Server Tool**
- **Cron Jobs**
- **L4** 本机数据区的 **Bootstrap** 和 **Schema**

安装链路可以概括为：

```text
profile source
  -> hermes profile install
  -> ~/.hermes/profiles/<profile-name>/
  -> hermes -p <profile-name> chat
```

这里有三个边界必须分清：

| 层 | 位置 | 职责 |
|---|---|---|
| **Profile Source** | **Git** 仓库或本地目录 | 保存可分发的 **L3 Profile** 内容 |
| **Profile Instance** | `~/.hermes/profiles/<name>/` | **Hermes Runtime** 实际读取的安装实例 |
| **Runtime Private Data** | `.env`、`sessions/`、`logs/`、`memory/`、`local/` | 本机私有状态，不回流到 **Source** |

**Profile** 仓库只保存可分发内容，**Hermes Runtime** 在本机 **Profile Instance** 中加载它，运行过程中产生的私有数据保留在本机

### 三、安装与更新

**Hermes Profile Install** 支持本地目录和远程 **Git Source**

#### 3.1、本地安装

本地安装适合开发、调试和学习

```bash
hermes profile install "$HOME/temporary/hermes-profile-demo" \
  --name hermes-profile-demo \
  --force \
  --alias \
  -y
```

安装结果：

```text
~/.hermes/profiles/hermes-profile-demo/
```

启动：

```bash
hermes-profile-demo chat
```

等价于：

```bash
hermes -p hermes-profile-demo chat
```

#### 3.2、远程安装

远程安装适合正式分发

```bash
hermes profile install github.com/<owner>/hermes-profile-demo \
  --name hermes-profile-demo \
  --alias \
  -y
```

也可以使用 **HTTPS**、**SSH** 或带 ref 的 **Source**：

```bash
hermes profile install https://github.com/<owner>/hermes-profile-demo.git --alias
hermes profile install git@github.com:<owner>/hermes-profile-demo.git#v0.1.0 --alias
```

远程安装的控制流是：

```text
git source
  -> 临时 clone
  -> 读取 distribution.yaml
  -> 复制 distribution-owned 内容
  -> ~/.hermes/profiles/<profile-name>/distribution.yaml 记录 source
```

安装后的 `distribution.yaml` 会记录 **Source**，后续 **Update** 会从这个 **Source** 重新拉取

#### 3.3、更新

普通更新：

```bash
hermes profile update hermes-profile-demo -y
```

如果源仓库更新了 `config.yaml`，需要显式覆盖：

```bash
hermes profile update hermes-profile-demo --force-config -y
```

**Update** 的关键语义：

- **Update** 使用安装实例 `distribution.yaml` 中记录的 **Source**
- `config.yaml` 默认保留本机版本
- `--force-config` 才覆盖已安装 **Profile** 的 `config.yaml`
- `.env`、`sessions/`、`logs/`、`memory/`、`workspace/`、`home/`、`cache/`、`local/` 属于 **User-owned**，不应被 **Distribution Update** 覆盖

### 四、Profile 仓库结构

 **Source** 目录：

```text
hermes-profile-demo/
├── distribution.yaml
├── SOUL.md
├── config.yaml
├── cron/
│   └── profile-learning-reminder.yaml
├── skills/
│   ├── profile-boundary/
│   │   └── SKILL.md
│   └── local-data-mcp-lab/
│       └── SKILL.md
├── tools/
│   ├── profile-inspector/
│   │   ├── README.md
│   │   └── inspect.js
│   └── local-data-store/
│       ├── README.md
│       └── store.js
├── schemas/
│   └── profile-demo-record.schema.json
├── templates/
│   └── local-data/
│       └── README.md
├── .env.example
├── .gitignore
└── README.md
```

这套结构可以分为四组：

| 分组 | 路径 | 说明 |
|---|---|---|
| **Profile** 核心 | `distribution.yaml`、`SOUL.md`、`config.yaml` | 安装识别、身份约束、**Runtime** 配置 |
| **Profile** 能力 | `skills/`、`cron/`、`tools/`、`schemas/`、`templates/` | 随 **Profile** 分发的能力和模板 |
| 本机私有 | `.env`、`sessions/`、`logs/`、`memory/`、`local/` | 不进入 **Git**，不作为 **Distribution** 内容 |

### 五、核心文件职责

#### 5.1、`distribution.yaml`

`distribution.yaml` 让 **Hermes** 识别这个目录是一个 **Profile Distribution**

它定义：

- `name`：默认安装后的 **Profile** 名称
- `version`：**distribution** 版本
- `env_requires`：安装者需要关注的环境变量
- `distribution_owned`：作者认为属于 **L3** 分发包的路径
- `post_install_hint`：安装后的提示
- `notes`：分发边界说明

#### 5.2、`SOUL.md`

`SOUL.md` 定义 **Agent** 的顶层身份和全局行为边界

安装后位于：

```text
~/.hermes/profiles/hermes-profile-demo/SOUL.md
```

它适合放：

- **Profile** 的身份设定
- 长期稳定的行为约束
- 回答风格
- 全局边界说明

它不适合放：

- 临时任务
- 单次操作步骤
- 具体工具实现逻辑

这些内容应放到 **Skill**、工具代码或测试脚本里

#### 5.3、`config.yaml`

`config.yaml` 定义 **Profile** 级 **Runtime** 配置

它负责：

- 显式配置 **Model** 和 **Provider**
- 配置 **Agent Turn**、**Reasoning**、**memory**、**Compression**
- 配置 **CLI** 可见 **Toolsets**
- 通过 **mcp_servers** 声明 **Profile-local MCP Server**

命名 **Profile** 不会自动继承默认 **Profile** 的 **Model** 配置

默认 **Profile** 和命名 **Profile** 是两份配置：

```text
默认 profile:
~/.hermes/config.yaml

命名 profile:
~/.hermes/profiles/hermes-profile-demo/config.yaml
```

如果命名 **Profile** 没有 **Model** / **Provider** 配置，可能出现类似 `No inference provider configured` 的报错

真实 **API Key** 仍应放在本机 `.env` 或 **Shell** 环境变量中

#### 5.4、`.gitignore`

`.gitignore` 是 **Profile Source** 和本机 **Runtime Data** 的隔离线

不应进入 **Git** 的内容包括：

- `.env`
- `sessions/`
- `logs/`
- `memory/`
- `state db`
- `workspace/`
- `cache/`
- `local/`

这保证 **Profile Source** 只保存可分发内容，本机运行数据不会随着 **Git** 或 **Profile Update** 流动

### 六、能力加载机制

#### 6.1、Skills

`skills/` 保存 **Profile-local Skills**

安装后，**Hermes** 会在该 **Profile** 作用域发现这些 **Skill**：

```text
~/.hermes/profiles/hermes-profile-demo/skills/
```

#### 6.2、Cron

`cron/` 保存 **Cron Jobs，自动化任务**

安装后路径：

```text
~/.hermes/profiles/hermes-profile-demo/cron/profile-learning-reminder.yaml
```

关键点：

- **Cron** 文件可以随 **Profile** 分发
- **Distribution** 只负责分发 **Cron** 文件
- **Cron Job** 不会自动启用
- 用户需要显式执行 enable

启用：

```bash
hermes -p hermes-profile-demo cron enable profile-learning-reminder
```

手动触发：

```bash
hermes -p hermes-profile-demo cron run profile-learning-reminder
```

#### 6.3、Tools

`tools/` 保存**Profile-local Tools**

用法：

- **Agent** 根据 **skill** 的指引进行调用
- **Agent** 自动调用 **MCP tool**

普通 **tool** 与 **MCP tool** 的区别：**Hermes** 不会自动把它注册成模型可见 **Tool**

### 七、**MCP** 工具机制

**MCP Server** 是把本地能力注册成 **Hermes first-class tool** 的方式

在 `config.yaml` 中声明：

```yaml
mcp_servers:
  profile_demo:
    command: "node"
    args: ["${HERMES_PROFILE_DIR}/tools/profile-mcp/server.js"]
    enabled: true
    tools:
      include: [profile_summary, local_data_write, local_data_list, local_data_validate]
```

加载链路：

```text
config.yaml
  mcp_servers.profile_demo
       |
       | hermes -p hermes-profile-demo chat
       v
Hermes runtime
  启动 node tools/profile-mcp/server.js
       |
       | MCP initialize / tools/list / tools/call
       v
agent 可见 MCP tools
```

普通脚本和 **MCP Tool** 的差异：

| 维度 | 普通脚本 | **MCP Server** |
|---|---|---|
| 启动方式 | agent 通过 terminal 显式运行 | **Hermes** 按 `config.yaml` 启动 |
| 工具发现 | 不进入模型工具 **Schema** | 通过 **MCP** `tools/list` 进入工具 **Schema** |
| 调用协议 | shell 参数和 stdout | stdio **JSON-RPC** / **MCP** |
| 适用场景 | 检查、调试、一次性脚本 | 稳定能力、结构化参数、agent 直接调用 |

### 八、**L4** 本机数据机制

**Profile Source** 是 **L3**，用户机器上产生的数据是 **L4**

```text
~/.hermes/profiles/hermes-profile-demo/local/profile-demo/
├── README.md
├── raw/
├── wiki/
│   └── records/
├── kanban/
└── dashboard/
```

源仓库不直接携带真实 **L4** 数据，只分发：

- `templates/local-data/README.md`
- `scripts/bootstrap-local-data.sh`
- `schemas/profile-demo-record.schema.json`
- `tools/local-data-store/store.js`

初始化：

```bash
PROFILE_DIR="$HOME/.hermes/profiles/hermes-profile-demo" \
  "$HOME/.hermes/profiles/hermes-profile-demo/scripts/bootstrap-local-data.sh"
```

#### 8.1、Schema

`schemas/profile-demo-record.schema.json` 描述 **L4 Record** 的结构

它属于 **L3 Distribution-Owned** 内容，只保存规则，不保存真实数据

当前 **Record** 字段：

| 字段 | 含义 |
|---|---|
| `id` | 文件级唯一 ID |
| `kind` | `note`、`task`、`reference` |
| `title` | 短标题 |
| `body` | 正文 |
| `created_at` | ISO 时间戳 |
| `source` | 写入来源，固定为 `local-data-store` |

#### 8.2、local-data-store

`tools/local-data-store/store.js` 是 **L4** 文件读写实现

命令：

```bash
node tools/local-data-store/store.js write \
  --profile-dir ~/.hermes/profiles/hermes-profile-demo \
  --kind note \
  --title "Example note" \
  --body "A local schema-backed record"

node tools/local-data-store/store.js list \
  --profile-dir ~/.hermes/profiles/hermes-profile-demo

node tools/local-data-store/store.js validate \
  --profile-dir ~/.hermes/profiles/hermes-profile-demo
```

边界：

- 只写入 `local/profile-demo/wiki/records/`
- 写入前做 **Schema** 校验
- 不读取 `.env`、`sessions/`、`logs/`、`memory/` 或 `state db`

#### 8.3、**MCP** 包装

**MCP** 包装层把 `local-data-store` 暴露成 **Agent** 可调用的 **Tool**

```text
Hermes agent
  mcp_profile_demo_local_data_write
       |
       | MCP tools/call
       v
tools/profile-mcp/server.js
       |
       | 复用模块，不复制文件写入逻辑
       v
tools/local-data-store/store.js
       |
       v
local/profile-demo/wiki/records/*.json
```

这里有一个重要设计：**MCP Server** 不复制另一套 **L4** 文件写入逻辑，而是复用 `local-data-store`

这样可以避免 terminal 脚本路径和 **MCP** 工具路径产生两套行为

#### 8.4、Skill 编排

`skills/local-data-mcp-lab/SKILL.md` 演示 **Profile-local Skill** 如何编排 **MCP** 工具

它定义：

- 何时使用 `mcp_profile_demo_local_data_write`
- 写入后必须调用 `mcp_profile_demo_local_data_list`
- 最后必须调用 `mcp_profile_demo_local_data_validate`
- 如果 **MCP** 工具不可见，先提示同步 `config.yaml`
- 不要通过 terminal 直接写 **L4 Record**

三层边界：

```text
skill
  -> 决定调用顺序和失败处理

MCP server
  -> 暴露结构化 tool schema

local-data-store
  -> 执行 L4 文件读写
```

### 九、发布与回归验证

发布前先跑本地质量门禁：

```bash
scripts/check-release.sh --quick
```

当前门禁检查：

- **YAML** 文件可解析
- **Node** 工具语法检查通过
- **JSON Schema** 可解析
- **shell** 脚本可执行且包含顶部用途注释
- **Profile** 结构测试通过
- **L4 Bootstrap** 测试通过
- **L4** local-data-store 测试通过
- **MCP** 最小协议测试通过
- **MCP L4** 工具测试通过
- **Skill** 编排测试通过
- 文档中没有已知陈旧占位表述

门禁不会执行：

- 真实 `hermes profile install`
- 真实 `hermes profile update`
- 写入 `~/.hermes/profiles/`

远程发布后，可以用独立测试 **Profile** 回归：

```bash
scripts/test-remote-profile.sh --dry-run github.com/<owner>/hermes-profile-demo
```

dry-run 只打印命令，确认后再真实执行：

```bash
scripts/test-remote-profile.sh github.com/<owner>/hermes-profile-demo
```

默认测试 **Profile**：

```text
hermes-profile-demo-test
```

真实流程：

```text
scripts/check-release.sh --quick
  -> hermes profile install <git-source> --name hermes-profile-demo-test
  -> bootstrap local/profile-demo/
  -> validate L4 records
  -> hermes profile update hermes-profile-demo-test --force-config
  -> hermes profile info hermes-profile-demo-test
```

### 十、验证命令

日常本地门禁：

```bash
cd "$HOME/temporary/hermes-profile-demo"
scripts/check-release.sh --quick
```

单项验证：

```bash
tests/test-profile-structure.sh
tests/test-scripts.sh
tests/test-local-data-bootstrap.sh
tests/test-local-data-store.sh
tests/test-profile-mcp.sh
tests/test-profile-mcp-local-data.sh
tests/test-profile-inspector.sh
tests/test-remote-profile-flow.sh
tests/test-stage-11-skill.sh
tests/test-release-gate.sh
```

语法验证：

```bash
node --check tools/profile-inspector/inspect.js
node --check tools/profile-mcp/server.js
node --check tools/local-data-store/store.js
ruby -e 'require "yaml"; ["distribution.yaml", "config.yaml", "cron/profile-learning-reminder.yaml"].each { |f| data = YAML.load_file(f); raise "#{f} not mapping" unless data.is_a?(Hash) }; puts "yaml ok"'
```

文件结构检查：

```bash
find . -maxdepth 4 -type f -not -path './logs/*' -not -path './local/*' | sort
```

### 十一、学习路径附录

下面保留 Stage map，用于回看这个 demo 是如何逐步长成完整 **Profile Distribution** 的

| Stage | 名称 | 重点 |
|---|---|---|
| Stage 1：增加第二个 **Skill** | `profile-boundary` | 学习 **Skill** 拆分和加载边界 |
| Stage 2：增加 **Cron** | `profile-learning-reminder` | 学习 **Cron** 文件分发和显式启用 |
| Stage 3：增加 **Tools** | `profile-inspector` | 学习普通本地工具和 **Hermes First-class Tool** 的区别 |
| Stage 4：增加 **MCP Server** | `profile_demo` | 学习 **MCP Server** 如何注册 **Tool Schema** |
| Stage 5：远程 **Git** 安装和 **Update** | `install-remote.sh` | 学习远程 **Source**、**Update**、`--force-config` |
| Stage 6：增加 **L4** 本机私有数据区 | `local/profile-demo` | 学习 **L3 Source** 和 **L4 Runtime Data** 隔离 |
| Stage 7：增加 **L4** 数据 **Schema** 和安全读写工具 | `profile-demo-record`、`local-data-store` | 学习 **Schema** 约束和受控路径写入 |
| Stage 8：增加发布检查清单和质量门禁 | `check-release.sh` | 学习发布前自动检查 |
| Stage 9：把 **L4** 工具包装进 **MCP** | `local_data_write/list/validate` | 学习把本机工具暴露成受控 **MCP Tool** |
| Stage 10：增加远程测试 **Profile** 流程 | `hermes-profile-demo-test` | 学习发布后安装和 **Update** 回归 |
| Stage 11：增加 **Profile-local Skill** 调用 **MCP** 工具的端到端学习任务 | `local-data-mcp-lab` | 学习 **Skill** 如何编排 **MCP Tool** |
