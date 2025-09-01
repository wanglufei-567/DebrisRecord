## SSO 登录

**单点登录（SSO，Single Sign-On）**是分布式系统和多应用体系中最常见的统一认证方案，它的目标是让用户在 **一个地方登录**，即可在多个系统间无感切换，而无需重复输入账号密码

### 一、SSO 的基本思路

在一个多应用的系统环境下，单点登录的典型流程是：

1. 用户访问某个业务系统
2. 如果该系统检测到用户未登录，则将用户重定向到 **SSO 服务**（统一认证中心）
3. 用户在 **SSO 服务**中完成认证
4. 认证成功后，**SSO 服务**将用户重定向回业务系统，并附带一个**临时凭证（ticket/code）**
5. 业务系统通过这个**临时凭证**与 **SSO 服务**进行后端交互，换取用户的真实信息
6. 业务系统建立本地会话，后续请求无需再次登录

### 二、路由跳转的关键过程

以下示例基于 **CAS 协议**和 **OAuth2.0 授权码**模式的通用逻辑

#### 2.1、用户访问业务系统 A

用户直接访问：

```http
https://app-a.com/home
```

```http
GET /home HTTP/1.1
Host: appa.com
Cookie: (无登录态)
```

应用 A 检查用户未登录 → 返回 302 将用户重定向到 **SSO 服务**的登录页，并附上 `redirect_uri`

```http
https://sso.com/login?client_id=appA&redirect_uri=https%3A%2F%2FappA.com%2Fsso%2Fcallback&state=xyz
```

```http
HTTP/1.1 302 Found
Location: https://sso.com/login?client_id=appA&redirect_uri=https%3A%2F%2FappA.com%2Fsso%2Fcallback&state=xyz
```

> **注意**：
>
> - 这里的 `redirect_uri=https%3A%2F%2FappA.com%2Fsso%2Fcallback&state=xyz` 参数实际上就是 **redirect 地址**，表示用户在登录成功后，**SSO 服务**要将结果回传到哪个路径
>
> - 如果应用有复杂的前端路由，还可以通过附带 `state` 或 `redirectUrl` 参数来记录用户最初访问的页面，例如：
>
>   ```http
>   https://sso.com/login?redirect_uri=https://app-a.com/callback&state=/home
>   ```
>
> **重定向：**
>
> - 当服务端返回 `3xx` 状态码（例如 `301 Moved Permanently` 或 `302 Found`），会在响应头里带上 `Location`，告诉客户端新的资源地址
> - 浏览器接收到后，会自动向 `Location` 指定的 **URL** 发送新的请求
>
> ```http
> HTTP/1.1 302 Found
> Location: https://example.com/login
> ```

#### 2.2、用户在 SSO 服务登录

 浏览器自动跳转到 **SSO 登录页**

```http
GET /login?client_id=appA&redirect_uri=https%3A%2F%2FappA.com%2Fsso%2Fcallback&state=xyz HTTP/1.1
Host: sso.com
```

**SSO** 返回登录页面（**HTML 表单**）：

```http
HTTP/1.1 200 OK
Content-Type: text/html

<html>
  <form method="POST" action="/login/submit">
    <input name="username">
    <input name="password" type="password">
  </form>
</html>
```

用户在 `sso.com` 输入账号密码并通过验证，**SSO 服务**生成一个临时凭证（如 `ticket=xxxx` 或 `code=xxxx`）

#### 2.3、SSO 回跳到应用 A

**SSO** 验证成功，生成一个**授权码（code）**返回 **302 重定向回应用 A**：

```http
https://app-a.com/callback?code=xxxx
```

```http
HTTP/1.1 302 Found
Location: https://appA.com/sso/callback?code=abcd1234&state=xyz
Set-Cookie: sso_session=SSO-TOKEN; Path=/; HttpOnly; Secure
```

此时，浏览器请求到达**应用 A**，但 **A** 只拿到一个 `ticket`，还无法得知用户身份

#### 2.4、应用 A 与 SSO 服务交互

**应用 A** 后端拿到 `code`，再发起服务端请求到 **SSO 服务**进行校验：

```http
POST https://sso.com/validate
Body: { ticket: "xxxx", service: "https://app-a.com/callback" }
```

**SSO** 验证成功后，返回用户的真实信息，例如：

```json
{
  "userId": "u12345",
  "username": "zhangsan",
  "roles": ["admin", "editor"]
}
```

#### 2.5、应用 A 建立本地会话

应用 A 拿到用户信息后，会选择以下方式之一来维持会话：

- **服务端 Session**：在服务端记录用户信息，返回一个 **SessionID** 给浏览器 **Cookie**
- **JWT/Token**：应用 A 自行签发一个 **JWT**，写入 **Cookie** 或 **LocalStorage**，后续请求携带

最终，用户被重定向回其最初访问的页面（如 `/home`），至此完成登录流程

### 三、用户信息的回传机制

需要强调的是，**用户信息并不是通过 URL 直接回传**

- **URL** 中只会携带 `ticket` 或 `code` 这种一次性凭证
- 应用必须通过后端与 **SSO 服务**的安全交互来换取用户信息

这样做的原因是安全考虑：

- 如果直接在 **URL** 中返回完整的用户信息，会存在泄露风险（如日志、Referer、抓包）
- 通过后端交互，可以保证信息只在服务端传输，避免泄漏

### 四、跨应用无感知跳转

假设用户已经在 **应用 A** 登录成功，然后访问 **应用 B**：

1. 用户访问 `https://app-b.com/home`

2. 应用 B 发现未登录，将用户重定向到：

   ```
   https://sso.com/login?service=https://app-b.com/callback
   ```

3. 浏览器访问 `sso.com` 时，会携带 **SSO 服务**设置的 **Cookie**，**SSO 服务**通过该 **Cookie** 判断用户已登录

4. **SSO 服务**无需再次要求输入账号密码，直接返回一个新的 `ticket`：

   ```
   https://app-b.com/callback?ticket=yyyy
   ```

5. 应用 B 用 `ticket` 去 **SSO** 换取用户信息，完成本地会话建立

这样就实现了 **一次登录，多系统共享** 的效果

### 五、总结

1. **路由跳转**：未登录的应用会把用户重定向到 **SSO 服务**，**SSO** 登录后再回跳应用，带回临时凭证
2. **用户信息回传**：用户信息不在 **URL** 中，而是通过应用后端与 **SSO 服务**交互获取
3. **无感切换**：**SSO 服务**通过自身的统一 **Cookie**，实现跨系统间的透明登录