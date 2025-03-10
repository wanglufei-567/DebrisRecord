## URL 相关

### 一、概述

**URL** 构造函数是一种内置机制，用于解析、创建和操作 **URL**，它通过将一个 **URL** 字符串解析为一个结构化对象

**语法：**

```javascript
new URL(input[, base])
```

- **input**：必需的参数，是一个字符串，表示要解析的 **URL**
  - 该字符串可以是**绝对 URL**，也可以是**相对 URL**
- **base**：可选参数，当 **input** 为**相对 URL** 时必须提供，用于指定解析**相对 URL** 的基础
  - **base** 可以是字符串形式的 **URL**，也可以是一个 **URL** 对象

**注意：**

- 如果 **input** 是一个**绝对 URL**，则忽略 **base** 参数；
- 当 **input** 为**相对 URL** 而未提供 **base** 参数时，会抛出错误

### 二、参数详解

1. **input 参数**
   - 表示目标 URL
   - 示例：`"https://example.com/path?query=123#section"` 或 `"/path?query=123#section"`（相对 URL）
2. **base 参数**
   - 用于解析相对 URL
   - 示例：`"https://example.com"`
   - 当 input 为相对 URL时，new URL() 会将 input 与 base 结合，生成完整的绝对 URL

**示例代码：**

```javascript
// 绝对 URL，不需要 base 参数
let url1 = new URL("https://example.com/path?query=123#section");
console.log(url1.href); // 输出: "https://example.com/path?query=123#section"

// 相对 URL，需要提供 base 参数
let url2 = new URL("/path?query=123#section", "https://example.com");
console.log(url2.href); // 输出: "https://example.com/path?query=123#section"
```

------

### 三、URL 对象的属性

创建 URL 对象后，可以通过其内置属性来访问和操作各部分信息：

1. **href**
   - **描述**：整个 URL 的完整字符串表示。
   - **读写**：可以获取或设置整个 URL。
2. **protocol**
   - **描述**：协议部分（例如 `"https:"`）。
   - **读写**：设置时必须包含冒号。
3. **username** 与 **password**
   - **描述**：用于包含 URL 中的用户名和密码（如 `https://user:pass@example.com`）。
   - **读写**：可以修改，但通常建议通过其他认证方式处理。
4. **host**
   - **描述**：主机部分，包括域名和端口（例如 `"example.com:8080"`）。
   - **读写**：修改时会影响 hostname 和 port。
5. **hostname**
   - **描述**：域名部分（例如 `"example.com"`）。
   - **读写**：仅包含主机名，不含端口。
6. **port**
   - **描述**：端口号部分（例如 `"8080"`），作为字符串表示。
   - **读写**：空字符串表示使用默认端口。
7. **pathname**
   - **描述**：URL 的路径部分（例如 `"/path"`）。
   - **读写**：可以通过修改此属性改变路径。
8. **search**
   - **描述**：查询字符串部分，包括前导问号（例如 `"?query=123"`）。
   - **读写**：修改时也会更新 searchParams。
9. **searchParams**
   - **描述**：一个 URLSearchParams 对象，用于方便地操作查询参数。
   - **方法**：支持 `get()`、`set()`、`append()`、`delete()` 等方法。
10. **hash**
    - **描述**：片段标识符，包括井号（例如 `"#section"`）。
    - **读写**：用于标识文档内的位置。
11. **origin**
    - **描述**：只读属性，返回 URL 的原始地址（协议 + 主机名 + 端口），如 `"https://example.com"`。

**示例代码：**

```javascript
let url = new URL("https://user:pass@example.com:8080/path/page.html?query=123#section");

// 获取各部分属性
console.log(url.href);         // "https://user:pass@example.com:8080/path/page.html?query=123#section"
console.log(url.protocol);     // "https:"
console.log(url.username);     // "user"
console.log(url.password);     // "pass"
console.log(url.host);         // "example.com:8080"
console.log(url.hostname);     // "example.com"
console.log(url.port);         // "8080"
console.log(url.pathname);     // "/path/page.html"
console.log(url.search);       // "?query=123"
console.log(url.hash);         // "#section"
console.log(url.origin);       // "https://example.com"

// 操作查询参数
url.searchParams.set("query", "456");
console.log(url.href);         // URL 中的查询字符串更新为 "?query=456"
```

