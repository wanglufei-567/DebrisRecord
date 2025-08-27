## Cookie生命周期与字段详解

### 一、Cookie 的生命周期

**Cookie** 的生命周期不仅仅取决于过期时间，还包括从创建到销毁的完整流程，通常包含以下几个阶段：

1. **服务端下发**

   - 服务端在响应头中使用 `Set-Cookie` 指令向浏览器下发 **Cookie**

     ```http
     Set-Cookie: token=abc123; Path=/; Max-Age=3600; HttpOnly; Secure
     ```

   - 这一步决定了 **Cookie** 的名称、值和相关属性

2. **浏览器保存**

   - 浏览器接收到响应后，将 **Cookie** 按照「域名」、「路径」和「安全规则」保存到**本地 Cookie 存储**中
   - 如果设置了 `Expires` 或 `Max-Age`，则是 **持久 Cookie**；否则为 **会话 Cookie**，在浏览器关闭时清除

3. **自动携带**

   - 当浏览器再次发起 **HTTP** 请求，如果请求的 **URL** 符合 **Cookie** 的 `Domain`、`Path`、`Secure` 等限制条件，浏览器会在请求头中**自动附带 Cookie**：

     ```http
     Cookie: token=abc123
     ```

4. **过期或删除**

   - 到达过期时间（`Expires` 或 `Max-Age`）后，浏览器会自动删除该 **Cookie**
   - 用户手动清理缓存或服务端下发同名 **Cookie**（值为空 + 过期时间为过去时间）时，**Cookie** 也会被清除

### 二、Cookie 字段详解

- **Expires** 与 **Max-Age**

  - **Expires**：绝对过期时间（GMT 时间格式）

  - **Max-Age**：相对存活时间（秒），优先级高于 Expires

- **Path**

  - 指定 **Cookie** 在服务端路径下的作用范围

  - 例如：

    ```http
    Set-Cookie: lang=zh; Path=/user
    ```

    仅在请求 `/user` 及其子路径时附带该 **Cookie**

- **Domain**
  - 决定 **Cookie** 的域名范围
  - **精准域名 (Host-only Cookie)**
    - 未显式设置 `Domain` 时，**Cookie** 只在当前主机有效
    - 例如：`www.example.com` 下发的 **Cookie**，只在该域名下使用
  - **泛域名 (Domain Cookie)**
    - 设置为 `.example.com` 时，该 **Cookie** 对 `example.com` 及其所有子域均有效：
      - `www.example.com` ✅
      - `api.example.com` ✅
      - `shop.example.com` ✅

⚠️ 安全注意：泛域名 **Cookie** 虽然方便共享，但可能被同主域下的其他子系统滥用，敏感信息建议绑定到具体子域

- **Secure**

  - 当 **Cookie** 设置了 `Secure` 标记时，浏览器只会在 **HTTPS** 请求中携带该 Cookie，而不会在明文的 **HTTP** 请求中发送

  - 这意味着 **Cookie** 的传输过程会通过 **TLS/SSL** 加密，避免在网络上传输时被窃听或篡改

  - **典型用途：**

    - 存储 **会话标识符（Session ID）**、**登录凭证** 等敏感信息时，通常会加上 `Secure`

      例如：

      ```
      Set-Cookie: SESSIONID=abc123; Secure; HttpOnly; SameSite=Strict
      ```

- **HttpOnly**
  - 禁止 **JavaScript** 读取 **Cookie**（`document.cookie`），防止 **XSS** 窃取

- **SameSite**
  - 控制跨站点请求是否携带 **Cookie**：
    - `Strict`：完全禁止跨站点请求带 **Cookie**
    - `Lax`：大多数跨站点请求禁止，但安全的 **GET** 导航允许
    - `None`：允许跨站点请求，但必须配合 `Secure`

### 三、域名的规范与层级

理解 **Cookie** 的 `Domain` 字段，需要先了解域名的规范，域名是 **自右向左** 的层级结构

#### 3.1.、域名组成

一个完整域名（FQDN）的形式为：

```
[子域].[二级域].[顶级域].[根域]
```

例如：

```
api.shop.example.com.
```

- **根域 (Root)**：`.`，通常省略
- **顶级域 (TLD)**：如 `.com`、`.cn`
- **二级域 (SLD)**：`example`，注册主体
- **子域 (Subdomain)**：`shop`、`api`

#### 3.2、必须与可选部分

- **顶级域**：必须
- **二级域**：通常必须（用户注册域）
- **子域**：可选
- **根域点号**：规范要求存在，但可省略

#### 3.3、 与 Cookie 的关系

- 精准域名 **Cookie** → 绑定到某个子域（如 `www.example.com`）
- 泛域名 **Cookie** → 绑定到二级域（如 `.example.com`），覆盖所有子域

### 四、总结

- **Cookie 生命周期** 包含四个阶段：服务端下发 → 浏览器保存 → 请求时自动携带 → 过期或删除
- **Cookie 字段** 包括 `Expires/Max-Age`（生命周期）、`Path`（路径范围）、`Domain`（域名范围）、`Secure`（HTTPS）、`HttpOnly`（禁止 JS 访问）、`SameSite`（跨站策略）
- **Domain 字段** 决定 **Cookie** 作用范围：精准域名仅限当前域，泛域名覆盖所有子域
- **域名规范** 是自右向左的层级结构，理解它有助于正确配置 **Cookie** 的作用范围