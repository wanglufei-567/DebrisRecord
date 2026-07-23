## **Hermes Desktop** 连接 **Remote Backend** 的机制

### 一、前言

默认情况下，**Hermes Desktop** 会启动并管理一个本机 `hermes serve` 进程，然后通过本机 **REST** 和 **JSON-RPC / WebSocket** 接口使用 **Hermes Runtime**

如果切换到远端模式，**Desktop** 不再使用本机实例，而是连接远端机器上已经运行的另一个 `hermes serve` 实例

```text
本机模式：Hermes Desktop
  -> 本机 hermes serve
  -> 本机 Hermes Profile / Runtime / Filesystem

远端模式：Hermes Desktop
  -> Remote URL
  -> 远端 hermes serve
  -> 远端 Hermes Profile / Runtime / Filesystem
```

因此，本机 **Backend** 和远端 **Backend** 确实是两套独立运行的实例，各自拥有独立的进程、配置、文件系统和运行环境，但它们使用的是同一个 `hermes serve` 后端实现

这里还需要区分三个容易混淆的命令：

| 命令 | 官方定位 | 与 **Desktop** 的关系 |
|---|---|---|
| `hermes serve` | 无界面的 **Hermes Backend Server**，提供 **JSON-RPC / WebSocket** 和 **REST** 接口 | **Desktop** 本机模式和远端模式实际连接的后端 |
| `hermes dashboard` | 带浏览器管理界面的 **Web Dashboard**，与 `hermes serve` 复用同一套服务器实现 | 适合通过浏览器管理配置和会话，不是 **Desktop** 当前的标准后端启动方式 |
| `hermes gateway` | 官方称为 **Messaging Gateway**，是可长期运行的后台进程 | 不是 **Desktop Remote URL**，除消息渠道外还承载会话路由、**Cron**、内嵌 **Kanban Dispatcher** 和后台通知等能力 |

`hermes serve` 是应用层网络服务器，不会自动成为操作系统托管的系统服务

- 本机实例通常由 **Desktop** 作为子进程启动和管理
- 远端实例需要用户保持运行，可以用 `systemd`、`tmux`、Docker 或其他进程管理器托管
- `hermes gateway` 则提供 `install`、`start`、`stop` 等命令，可以直接安装为 `systemd` 或 `launchd` 后台服务

旧版本 **Runtime** 如果还没有 `hermes serve`，**Desktop** 会兼容性回退到无界面的 `hermes dashboard --no-open`，这只是旧版本兼容路径，不是当前标准机制

### 二、远端连接有哪些鉴权方式

官方文档目前主要说明两类远端鉴权方式

**OAuth / Nous Portal**

- 适合公网 **VPS**、公共主机或其他公网可达的远端 **Backend**
- 通过 **Nous** 账号或自托管 **OIDC Provider** 完成登录
- 官方更推荐用于公网场景

**Username/password**

- 适合可信局域网、**VPN**、**Tailscale** 或内部试点
- 远端 `hermes serve` 用用户名和密码保护入口
- 没有外部身份提供商，本质上是共享凭据
- 官方不建议把这种方式直接暴露在公网

旧版静态 **Session Token** 仍可能出现在兼容逻辑中，但不应再作为新部署的首选方案

下面用 **Username/password** 作为示例

远端公开探测接口为：

```text
GET https://example.remote-hermes.com/api/status
GET https://example.remote-hermes.com/api/auth/providers
```

当 `/api/auth/providers` 返回类似结果时：

```json
{
  "providers": [
    {
      "name": "basic",
      "display_name": "Username & Password",
      "supports_password": true
    }
  ]
}
```

说明这个远端 `hermes serve` 实例启用了 **Basic Auth / Username & Password Provider**

### 三、Username/password 方式的登录链路

#### 3.1、远端 `hermes serve` 读取登录配置

远端 `hermes serve` 启动时会读取 **Hermes Home** 中的配置和环境变量

官方示例把凭据保存在：

```text
~/.hermes/.env
```

常用变量为：

```dotenv
HERMES_DASHBOARD_BASIC_AUTH_USERNAME=...
HERMES_DASHBOARD_BASIC_AUTH_PASSWORD=...
HERMES_DASHBOARD_BASIC_AUTH_PASSWORD_HASH=...
HERMES_DASHBOARD_BASIC_AUTH_SECRET=...
```

其中明文密码和密码 **Hash** 选择一种配置即可

| 变量 | 作用 |
|---|---|
| `HERMES_DASHBOARD_BASIC_AUTH_USERNAME` | 登录用户名 |
| `HERMES_DASHBOARD_BASIC_AUTH_PASSWORD` | 登录密码，适合简单部署 |
| `HERMES_DASHBOARD_BASIC_AUTH_PASSWORD_HASH` | 密码的单向 **scrypt Hash**，用于避免保存明文密码 |
| `HERMES_DASHBOARD_BASIC_AUTH_SECRET` | 登录会话签名密钥，使会话可以跨进程重启继续有效 |

这些变量仍然保留 `DASHBOARD` 前缀，是现有配置接口的历史命名，并不表示只能由 `hermes dashboard` 使用，`hermes serve` 使用的是同一套后端鉴权机制

这里有两个点容易混淆：

- `PASSWORD_HASH` 不能解密回原始密码，只用于验证用户输入
- `BASIC_AUTH_SECRET` 不是密码 **Hash** 的解密密钥，只负责登录会话和令牌签名

远端启动示例：

```bash
hermes serve --host 0.0.0.0 --port 9119
```

非本机地址绑定会启用鉴权门禁，如果使用 `systemd` 托管，需要让服务单元通过 `EnvironmentFile` 加载 `~/.hermes/.env`

#### 3.2、Desktop 先探测远端 `hermes serve`

在 **Desktop** 中通过 `Settings -> Gateway -> Remote gateway` 配置 **Remote URL**，例如：

```text
https://example.remote-hermes.com
```

也可以在启动 **Desktop** 前设置：

```bash
HERMES_DESKTOP_REMOTE_URL=https://example.remote-hermes.com
```

**Desktop** 的连接选择会保存在 **Electron userData** 下的 `connection.json` 中，macOS 上通常是：

```text
~/Library/Application Support/Hermes/connection.json
```

它记录的是使用本机 `hermes serve`，还是连接某个远端 `hermes serve`，不保存远端进程本身

连接前，**Desktop** 会先调用：

```text
GET /api/status
GET /api/auth/providers
```

`/api/status` 用于判断远端 **Backend** 是否可达、是否要求鉴权，典型信号为：

```json
{
  "auth_required": true,
  "auth_providers": ["basic"]
}
```

`/api/auth/providers` 用于识别具体登录方式，如果包含 `basic`，**Desktop** 就会提供用户名和密码登录入口

#### 3.3、Desktop 打开远端登录页面

用户点击登录后，**Desktop** 会创建一个使用独立持久化 **Session Partition** 的 **Electron BrowserWindow**，并打开：

```text
https://example.remote-hermes.com/login
```

准确边界是：

```text
Hermes Desktop
  -> Electron BrowserWindow
  -> 远端 hermes serve 的 /login 鉴权路由
  -> Username & Password 表单或 OAuth Provider
```

`hermes serve` 虽然不会挂载完整的 **Dashboard SPA**，但仍然提供登录和鉴权所需的路由，因此登录页面来自远端 **Backend** 的鉴权插件，而不是 **Desktop** 本地写死的表单

#### 3.4、远端校验密码并签发登录 Cookie

用户在 `/login` 页面输入用户名和密码后，远端 **Basic Auth Provider** 校验用户名与密码或密码 **Hash**

校验通过后，远端会签发 **HttpOnly Session Cookie**，并将其保存在 **Desktop** 专用的 **Electron Session Partition** 中

之后的 **REST** 请求通过同一个 **Electron Session** 发出，由网络层自动附带 Cookie，**Desktop Renderer** 不需要读取 Cookie 内容，也不需要反复提交用户名和密码

#### 3.5、Desktop 用 Cookie 换取 WebSocket Ticket

实时聊天和事件流使用 **WebSocket**

**Desktop** 不会把密码或 Cookie 直接放进 **WebSocket URL**，而是先通过已经认证的 Cookie 请求一次性票据：

```text
POST /api/auth/ws-ticket
```

远端 `hermes serve` 校验 Cookie 后返回短期、单次使用的 `ws-ticket`，然后 **Desktop** 连接：

```text
WebSocket /api/ws?ticket=<ws-ticket>
```

每次重新连接都需要获取新的 Ticket，连接成功后，**Desktop** 才开始通过远端 `hermes serve` 使用远端的 **Hermes Runtime**

完整链路可以压缩成：

```text
Desktop 读取 Remote URL
  -> GET /api/status
  -> GET /api/auth/providers
  -> 在 Electron BrowserWindow 中打开远端 /login
  -> 用户输入用户名和密码
  -> 远端 hermes serve 校验凭据
  -> 远端签发 HttpOnly Session Cookie
  -> Electron Session 保存 Cookie
  -> POST /api/auth/ws-ticket
  -> WebSocket /api/ws?ticket=<ws-ticket>
  -> Desktop 使用远端 Hermes Backend
```

### 四、最终心智模型

```text
Desktop 本机模式
  = Desktop 管理本机 hermes serve 实例

Desktop 远端模式
  = 用户管理远端 hermes serve 实例
  + Desktop 通过 Remote URL 连接该实例

hermes dashboard
  = 同源后端实现 + Web Dashboard UI

hermes gateway
  = 独立的常驻后台进程
  + 消息渠道、会话路由、Cron、Kanban Dispatcher 和通知
```

需要记住的边界是：本机和远端是两套独立运行的 **Backend 实例**，但两者都由 `hermes serve` 提供；`hermes dashboard` 是浏览器管理界面，`hermes gateway` 则负责另一条长期后台运行链路

### 五、资料依据

- [Desktop App](https://hermes-agent.nousresearch.com/docs/user-guide/desktop)
- [CLI Commands Reference](https://hermes-agent.nousresearch.com/docs/reference/cli-commands)
- [Messaging Gateway](https://hermes-agent.nousresearch.com/docs/user-guide/messaging)
- [Kanban — Multi-Agent Profile Collaboration](https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban)
