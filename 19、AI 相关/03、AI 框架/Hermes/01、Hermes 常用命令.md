## Hermes 常用命令

### 基础使用

```bash
# 启动默认交互会话，适合日常直接和 Agent 对话
hermes

# 启动现代 TUI，适合长会话、需要更好交互界面的场景
hermes --tui

# 强制使用经典 CLI，适合 TUI 异常或只想保留简单终端交互时使用
hermes --cli

# 单轮提问，但仍会按当前目录加载规则、工具、memory 等上下文
hermes chat -q "总结当前目录的主要内容"

# 启动 Hermes Web Dashboard，默认会启动本地 Web 页面，通常是：http://127.0.0.1:9119
hermes dashboard --tui

# 指定端口
hermes dashboard --tui --port 9120

# 启动服务但不自动打开浏览器
hermes dashboard --no-open

# 查看 Dashboard 是否已运行
hermes dashboard --status

# 停止 Dashboard
hermes dashboard --stop
```

### 配置、模型与认证

```bash
# 进入交互式模型选择器，日常切换默认模型时优先使用
hermes model

# 查看当前生效配置
hermes config show

# 直接设置默认模型，适合明确知道配置 key 时使用
hermes config set model.default anthropic/claude-sonnet-4
```

### Profile 日常管理

```bash
# 查看所有 Profile，适合确认当前机器有哪些隔离实例
hermes profile list

# 查看某个 Profile 的路径、描述、alias、配置等详情
hermes profile show <profile_name>

# 本次命令临时切换到指定 Hermes Profile 运行
hermes -p/--profile <profile_name> chat

# 切换 sticky 默认 Profile，后续 hermes 命令默认进入该 Profile
hermes profile use <profile_name>

# 恢复使用默认 Profile
hermes profile use default

# 从当前目录安装 Profile distribution，当前目录根部需要有 distribution.yaml
hermes profile install . --name <profile_name>

# 从 GitHub 仓库安装 Profile distribution
hermes profile install github.com/<user>/<repo> --name <profile_name>

# 重新安装当前目录的 Profile distribution，覆盖同名 Profile 的分发文件但保留用户数据，常用于本地修改 SOUL.md、skills、mcp.json 后同步到已安装 Profile
hermes profile install . --force -y

# 从 Profile 记录的分发源拉取更新，并覆盖 SOUL.md、skills、cron、mcp.json 等分发文件，保留 memories、sessions、auth、.env 和默认 config.yaml
hermes profile update <profile_name> -y

# 更新 Profile 时连 config.yaml 也覆盖，只有确定要丢弃本地配置覆盖时再用
hermes profile update <profile_name> --force-config -y
```

### Skill、Tool 与 MCP

```bash
# 查看已安装 Skill
hermes skills list

# 查看所有工具及启用状态
hermes tools list

# 查看已配置 MCP server
hermes mcp list
```

### 排查时常用组合

```bash
# 模型、Provider、base_url 或环境变量不生效时，先确认配置文件和 .env 路径
hermes config path

# 确认当前实例读取哪个 .env 文件
hermes config env-path

# 查看当前生效配置，重点检查 model、provider、base_url 等字段
hermes config show
```
