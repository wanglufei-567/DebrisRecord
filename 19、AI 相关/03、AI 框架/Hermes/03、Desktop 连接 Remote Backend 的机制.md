## **Hermes Desktop** 连接 **Remote Backend** 的机制

### 一、前言

默认情况下，**Hermes Desktop** 连接的是本机 **backend**

也就是 **Desktop** 自己启动本机的 `hermes dashboard`，然后通过本机 **REST** / **WebSocket** 使用 **Hermes**

如果要连接远端 **backend**，**Desktop** 连接的不是远端 `hermes gateway`，而是远端机器上已经运行的 `hermes dashboard`

核心关系是：

```text
Hermes Desktop
  -> Remote URL
  -> remote hermes dashboard
  -> remote Hermes profile runtime
```

这里要先区分两个进程：

| 名称 | 职责 |
|---|---|
| `hermes dashboard` | **Desktop** 连接的远端 **backend**，提供 `/api/status`、`/login`、`/api/ws` 等接口 |
| `hermes gateway` | Telegram、Discord、Slack 等 messaging gateway，不是 **Desktop Remote URL** |

所以，**Remote Backend** 不是一个抽象概念，实际入口就是远端可访问的 `hermes dashboard`

### 二、远端连接有哪些鉴权方式

官方文档里主要提到三类

**OAuth / Nous Portal**

- 适合公网 **VPS**、公共主机、任何公网可达的远端 **dashboard**
- 通过 **Nous** 账号或自托管 **OIDC** provider 完成登录
- 官方更推荐用于公网场景

**Username/password**

- 适合可信网络、**VPN**、**Tailscale** 或内部试点
- 远端 **dashboard** 用用户名密码保护入口
- 没有外部身份提供商，本质是一个共享凭据
- 官方不建议直接裸露在公网

**Token**

- 更偏旧式或 fallback 方式
- 需要复制 session token

下面用 **Username/password** 作为示例

证据是远端接口：

```text
GET https://example.remote-hermes.com/api/auth/providers
```

返回：

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

这说明远端启用的是 **Basic Auth** / **Username & Password** provider

### 三、Username/password 方式的登录链路

#### 3.1、远端 dashboard 启动时读取登录配置

远端 `hermes dashboard` 启动时读取环境变量

示例里，`systemd` service 可以加载一个专门的 dashboard env 文件：

```text
/home/ubuntu/.config/hermes-dashboard/<profile>.env
```

关键变量是：

```dotenv
HERMES_DASHBOARD_BASIC_AUTH_USERNAME=...
HERMES_DASHBOARD_BASIC_AUTH_PASSWORD_HASH=...
HERMES_DASHBOARD_BASIC_AUTH_SECRET=...
```

含义：

| 变量 | 作用 |
|---|---|
| `HERMES_DASHBOARD_BASIC_AUTH_USERNAME` | 登录用户名 |
| `HERMES_DASHBOARD_BASIC_AUTH_PASSWORD_HASH` | 密码的单向 hash，用来校验用户输入 |
| `HERMES_DASHBOARD_BASIC_AUTH_SECRET` | session signing secret，用来签发和校验 cookie |

这里有两个点容易混：

- `PASSWORD_HASH` 不能解密回原始密码，它只是用来验证密码是否匹配
- `BASIC_AUTH_SECRET` 不是密码 hash 的解密密钥，它只负责 session cookie 的签名

#### 3.2、Desktop 先探测远端 dashboard

**Desktop** 保存一个 **Remote URL**

例如：

```text
https://example.remote-hermes.com
```

> 本机 **Desktop** 的连接配置文件一般在：
>
> ```text
> /Users/Library/Application Support/Hermes/connection.json
> ```
>
> 它记录的是 **Desktop** 连接本地 **backend**，还是连接某个 **Remote URL**
>

启动连接时，**Desktop** 会先探测远端：

```text
GET /api/status
GET /api/auth/providers
```

`/api/status` 用来判断远端 **dashboard** 是否可达、是否需要登录

典型信号是：

```json
{
  "auth_required": true,
  "auth_providers": ["basic"]
}
```

`/api/auth/providers` 用来判断登录方式

如果返回 `basic`，**Desktop** 就知道远端是用户名密码登录

#### 3.3、Desktop 打开远端 login 页面

如果远端要求登录，**Desktop** 会打开：

```text
https://example.remote-hermes.com/login
```

这个页面不是 **Desktop** 本地写死的表单

准确边界是：

```text
Hermes Desktop
  -> Electron BrowserWindow
  -> remote /login
  -> remote dashboard renders Username & Password form
```

也就是说，本地 **Desktop** 只是提供一个 **Electron** 浏览器窗口

真正的登录页面、表单和认证逻辑都来自远端 **dashboard**

#### 3.4、远端校验密码并签发 cookie

用户在 `/login` 页面输入 username / password

远端 **dashboard** 做两件事：

1. 用 `HERMES_DASHBOARD_BASIC_AUTH_PASSWORD_HASH` 校验密码
2. 校验通过后，用 `HERMES_DASHBOARD_BASIC_AUTH_SECRET` 签发 session cookie

这个 **cookie** 会保存在 **Desktop** 的 **Electron session** 里

之后 **Desktop** 不需要反复提交用户名密码

#### 3.5、Desktop 用 cookie 换 ws-ticket

登录成功后，普通 **REST** 请求可以带着 session cookie 访问远端

但实时聊天走 **WebSocket**

**Desktop** 不直接把密码或 cookie 塞进 WebSocket，而是先请求：

```text
GET /api/auth/ws-ticket
```

远端 **dashboard** 校验 cookie 后返回 `ws-ticket`

然后 **Desktop** 用这个 ticket 连接：

```text
GET /api/ws
```

连接成功后，**Desktop** 就开始使用远端 **Hermes backend**

完整链路可以压缩成：

```text
Desktop reads Remote URL
  -> GET /api/status
  -> GET /api/auth/providers
  -> open remote /login in Electron BrowserWindow
  -> user inputs username/password
  -> remote dashboard verifies PASSWORD_HASH
  -> remote dashboard signs session cookie with BASIC_AUTH_SECRET
  -> Desktop stores cookie in Electron session
  -> Desktop calls /api/auth/ws-ticket
  -> Desktop connects /api/ws with ws-ticket
  -> Desktop uses remote Hermes backend
```
