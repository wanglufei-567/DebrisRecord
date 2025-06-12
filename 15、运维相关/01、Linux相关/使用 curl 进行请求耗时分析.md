## 使用 curl 进行请求耗时分析

### 一、curl 命令简介

> `curl` 并非 **Linux** 独有命令，而是一个跨平台的网络请求工具，在 Linux 中被广泛使用

`curl` （全称是 **Client URL**）是一个功能强大的命令行工具，用于发送网络请求，常用于测试 **API**、下载文件、提交表单等网络交互操作

`curl` 的主要功能是通过命令行与 **URL** 指定的服务器进行通信

语法如下：👇

```shell
curl [选项...] <URL>
```

#### 1.1、常用的选项

- `-X`：指定请求方法（如 **GET**、**POST**、**PUT**、**DELETE**）

  ```shell
  curl -X POST https://example.com/login
  ```

- `-d`：提交表单数据（`application/x-www-form-urlencoded`）

  ```shell
  curl -X POST -d "username=admin&password=123456" https://example.com/login
  ```

- `-H`：添加请求头

  ```shell
  curl -H "Authorization: Bearer <token>" https://api.example.com/user
  ```

- `-i`：显示响应头

  ```shell
  curl -i https://example.com
  ```

  - 不仅显示响应内容，还显示 **HTTP** 响应头（如 `200 OK`、`Content-Type` 等）

- `-o`：将响应内容输出到文件

  ```shell
  curl -o index.html https://example.com
  ```

  - 将响应内容保存为 `index.html` 文件

  ```
  curl -o /dev/null index.html https://example.com
  ```

  - 丢弃响应内容

- `-L`：跟随重定向

- `-s`：静默模式，不输出任何进度信息或错误信息

- `-k`：跳过 **HTTPS** 证书验证

### 二、--verbose 模式

`curl -v`（ `--verbose`）是 `curl` 中最常用的调试选项之一

它的作用是**开启详细输出模式**，显示请求和响应的所有底层过程，便于排查问题、进行抓包分析

示例：

```bash
curl -v https://example.com
```

典型输出结构如下（关键内容解释如下）：

```markdown
*   Trying 93.184.216.34:443...           ← DNS 解析和 TCP 建立
* Connected to example.com (93.184.216.34) port 443
* ALPN, offering h2                      ← HTTPS 协议协商
* successfully set certificate verify locations:
* TLSv1.3 (OUT), TLS handshake, Client hello (1) ← SSL 过程
> GET / HTTP/1.1                         ← 请求内容
> Host: example.com
> User-Agent: curl/7.79.1
> Accept: */*
>
< HTTP/1.1 200 OK                        ← 响应状态
< Content-Type: text/html
< Content-Length: 1256
< Connection: keep-alive
< Server: ECS (nyb/1D2B)
```

输出信息关键符号标识：

| 符号 | 说明                                                     |
| ---- | -------------------------------------------------------- |
| `*`  | 表示连接相关的信息（如 **DNS**、**TLS** 握手、连接状态） |
| `>`  | 表示 `curl` 发送给服务器的请求内容（如请求头和请求体）   |
| `<`  | 表示服务器返回的响应内容（如响应头和响应体）             |

### 三、 --write-out 模式

`curl` 的 `-w`（ `--write-out`）选项用于在请求完成后，**输出格式化的请求结果信息**，常用于性能分析和调试

它不会影响请求本身，而是控制终端输出的附加信息

语法如下：👇

```bash
curl -w "<格式化字符串>" <URL>
```

或更常见：

```bash
curl -s -o /dev/null -w "<格式化字符串>" <URL>
```

- `-s` 静默模式，不显示进度条
- `-o /dev/null` 丢弃响应内容
- `-w` 格式化输出请求结果

示例：

```shell
curl -s -o /dev/null -w "状态码: %{http_code}, TTFB: %{time_starttransfer}s\n" https://example.com
```

- `http_code` 是从 **HTTP** 响应头中提取的状态码

- `time_starttransfer` 是 `curl` 底层追踪的“客户端收到第一个字节的时间点”

#### 3.1、-w 选项中的常用变量

| 占位符                  | 含义描述                                    |
| ----------------------- | ------------------------------------------- |
| `%{http_code}`          | **HTTP** 状态码（如 200, 404）              |
| `%{time_total}`         | 总耗时（单位：秒）                          |
| `%{time_namelookup}`    | **DNS** 解析耗时                            |
| `%{time_connect}`       | 建立 **TCP** 连接耗时                       |
| `%{time_appconnect}`    | 建立 **TLS/SSL** 连接的耗时（仅 **HTTPS**） |
| `%{time_pretransfer}`   | 从开始到准备传输前的时间                    |
| `%{time_starttransfer}` | 从开始到第一字节开始接收的时间              |
| `%{size_download}`      | 下载的总字节数                              |
| `%{size_upload}`        | 上传的总字节数                              |
| `%{speed_download}`     | 下载速度（字节/秒）                         |
| `%{speed_upload}`       | 上传速度（字节/秒）                         |
| `%{url_effective}`      | 实际请求的 **URL**（处理重定向后）          |

### 四、具体案例

#### 4.1、简单分析

```shell
curl 'https://example.com' \
  -w "总耗时 time_total: %{time_total}s 文件大小 size_download:%{size_download} bytes \n" \
  -o /dev/null \
  -s \
  -k \
```

输出信息：

```markdown
总耗时 time_total: 0.825226s 文件大小 size_download:1287882 bytes
```

#### 4.2、完整分析

创建一个用于获取请求耗时的脚本

```shell
#!/bin/bash

# =============================================================================
# 请求耗时统计脚本
#
# 功能说明：
# 1. 使用curl命令进行请求
# 2. 统计网络请求的各个时间节点（DNS解析、连接建立、数据传输等）
# 3. 分析文件大小和下载速度
# 4. 生成格式化的性能报告
#
# =============================================================================

echo "🚀 开始测试 Wonderlab JS 文件加载耗时..."
echo ""

# =============================================================================
# 核心功能：执行HTTP请求并收集性能指标
# =============================================================================

# 使用curl执行HTTP请求，同时收集多种性能指标
# -w 参数定义输出格式，包含以下指标：
#   - time_total: 总耗时（从请求开始到完成的总时间）
#   - time_starttransfer: 首字节时间/TTFB（从请求开始到接收到第一个字节的时间）
#   - time_namelookup: DNS解析时间
#   - time_connect: TCP连接建立时间
#   - time_appconnect: SSL/TLS握手时间（HTTPS协议）
#   - size_download: 下载的总字节数
#   - speed_download: 平均下载速度（字节/秒）
#   - http_code: HTTP响应状态码

curl_output=$(curl -w "time_total:%{time_total}|time_starttransfer:%{time_starttransfer}|time_namelookup:%{time_namelookup}|time_connect:%{time_connect}|time_appconnect:%{time_appconnect}|size_download:%{size_download}|speed_download:%{speed_download}|http_code:%{http_code}" \
  ''https://example.com'' \
  -o /dev/null \
  -s)

# =============================================================================
# 错误处理：检查curl命令是否执行成功
# =============================================================================

# 检查curl的退出状态码
# $? 表示上一个命令的退出状态，0表示成功，非0表示失败
if [ $? -ne 0 ]; then
    echo "❌ 请求失败，请检查网络连接或URL是否正确"
    exit 1
fi

# =============================================================================
# 数据解析：从curl输出中提取各项性能指标
# =============================================================================

# 使用grep和cut命令解析curl的输出字符串
# grep -o 'pattern' : 只输出匹配的部分
# cut -d: -f2 : 以冒号为分隔符，取第二个字段

# 提取总耗时（秒）
time_total=$(echo "$curl_output" | grep -o 'time_total:[^|]*' | cut -d: -f2)

# 提取首字节时间（TTFB - Time To First Byte）
time_starttransfer=$(echo "$curl_output" | grep -o 'time_starttransfer:[^|]*' | cut -d: -f2)

# 提取DNS解析时间
time_namelookup=$(echo "$curl_output" | grep -o 'time_namelookup:[^|]*' | cut -d: -f2)

# 提取TCP连接建立时间
time_connect=$(echo "$curl_output" | grep -o 'time_connect:[^|]*' | cut -d: -f2)

# 提取SSL/TLS握手时间
time_appconnect=$(echo "$curl_output" | grep -o 'time_appconnect:[^|]*' | cut -d: -f2)

# 提取下载字节数
size_download=$(echo "$curl_output" | grep -o 'size_download:[^|]*' | cut -d: -f2)

# 提取下载速度（字节/秒）
speed_download=$(echo "$curl_output" | grep -o 'speed_download:[^|]*' | cut -d: -f2)

# 提取HTTP状态码
http_code=$(echo "$curl_output" | grep -o 'http_code:[^|]*' | cut -d: -f2)

# =============================================================================
# 数据处理：单位转换和格式化
# =============================================================================

# 将字节转换为MB（保留2位小数）
# bc -l : 使用bc计算器进行浮点运算
# 2>/dev/null : 重定向错误输出，避免bc不存在时的错误信息
# || echo "0.00" : 如果bc命令失败，则输出默认值
size_mb=$(echo "scale=2; $size_download / 1024 / 1024" | bc -l 2>/dev/null || echo "0.00")

# 将字节/秒转换为KB/秒（保留2位小数）
speed_kb=$(echo "scale=2; $speed_download / 1024" | bc -l 2>/dev/null || echo "0.00")

# =============================================================================
# 结果输出：生成格式化的性能报告
# =============================================================================

echo "📊 Wonderlab JS 文件加载统计报告"
echo "=================================================="
echo "🕐 总耗时:          ${time_total}s"               # 完整请求的总时间
echo "⚡ 首字节时间(TTFB): ${time_starttransfer}s"      # 服务器响应时间指标
echo "🔍 DNS解析:         ${time_namelookup}s"          # 域名解析耗时
echo "🔌 TCP连接:         ${time_connect}s"            # 网络连接建立耗时
echo "🔒 SSL握手:         ${time_appconnect}s"          # HTTPS安全连接耗时
echo "📦 文件大小:        ${size_download} bytes (${size_mb} MB)"  # 文件大小（原始字节数和MB）
echo "⬇️  下载速度:        ${speed_download} bytes/s (${speed_kb} KB/s)"  # 下载速度（字节/秒和KB/秒）
echo "📱 HTTP状态:        ${http_code}"                # HTTP响应状态码（200=成功）
echo "=================================================="
echo "✅ 测试完成!"

# =============================================================================
# 性能指标说明：
#
# 1. 总耗时 (time_total)：
#    从发起请求到完全下载完成的总时间
#
# 2. 首字节时间 (TTFB - Time To First Byte)：
#    从发起请求到接收到第一个字节的时间，反映服务器处理速度
#
# 3. DNS解析 (time_namelookup)：
#    将域名解析为IP地址的时间
#
# 4. TCP连接 (time_connect)：
#    建立TCP连接的时间
#
# 5. SSL握手 (time_appconnect)：
#    HTTPS协议中SSL/TLS握手的时间
#
# 6. 文件大小：
#    实际下载的文件大小
#
# 7. 下载速度：
#    平均下载速度，可用于评估网络带宽
#
# 8. HTTP状态：
#    200: 成功
#    404: 文件未找到
#    500: 服务器错误
#    其他: 参考HTTP状态码标准
# =============================================================================
```

结果输出：

```
🚀 开始测试 Wonderlab JS 文件加载耗时...

📊 Wonderlab JS 文件加载统计报告
==================================================
🕐 总耗时:          6.651283s
⚡ 首字节时间(TTFB): 0.225136s
🔍 DNS解析:         0.013541s
🔌 TCP连接:         0.044381s
🔒 SSL握手:         0.084646s
📦 文件大小:        3782638 bytes (3.60 MB)
⬇️  下载速度:        633379 bytes/s (618.53 KB/s)
📱 HTTP状态:        200
==================================================
✅ 测试完成!

```

##### 4.2.1、时序关系图

```
时间轴 ────────────────────────────────────────────────────────────────────►

0s     DNS解析    TCP连接    SSL握手     发送请求+等待响应    传输完成
│      完成       完成       完成        (到接收首字节)      总耗时
│      │          │          │           │                │
│      │          │          │           │                │
├──────┼──────────┼──────────┼───────────┼────────────────┤
│      │          │          │           │                │
│ 0.013541s   0.044381s  0.084646s    0.225136s       6.651283s
│      │          │          │           │                │
└──────┴──────────┴──────────┴───────────┴────────────────┘
  DNS    TCP建立     SSL握手    HTTP请求发送   数据传输      数据传输完成
  解析     连接       完成       +服务器处理   (首字节后)
                               +响应首字节
```

##### 4.2.2、各阶段耗时计算

基于上述数据，可以计算出各个阶段的实际耗时：

```bash
# 各阶段耗时分解
DNS解析耗时     = time_namelookup = 0.013541s
TCP连接耗时     = time_connect - time_namelookup = 0.044381 - 0.013541 = 0.030840s
SSL握手耗时     = time_appconnect - time_connect = 0.084646 - 0.044381 = 0.040265s
请求发送+等待   = time_starttransfer - time_appconnect = 0.225136 - 0.084646 = 0.140490s
数据传输耗时    = time_total - time_starttransfer = 6.651283 - 0.225136 = 6.426147s
```

**指标项判断示例**

| 场景                                 | 可能问题                 |
| ------------------------------------ | ------------------------ |
| `time_namelookup` 高                 | **DNS** 配置问题         |
| `time_connect` 高                    | 网络拥堵或端口阻塞       |
| `time_appconnect` 高                 | **TLS** 握手慢，证书问题 |
| `time_starttransfer` 高              | 后端响应慢               |
| `time_total - time_starttransfer` 高 | 响应体较大或下载慢       |

##### 4.2.3、时序分析结论

1. **连接建立阶段** (0 → 0.084646s = 84.6ms)
   - **DNS解析**：13.5ms (很快，可能有缓存)
   - **TCP连接**：30.8ms (网络延迟正常)
   - **SSL握手**：40.3ms (HTTPS握手时间合理)

2. **请求响应阶段** (0.084646s → 0.225136s = 140.5ms)
   - **HTTP** 请求发送 + 服务器处理 + 响应首字节
   - 这个时间包含了服务器的处理时间

3. **数据传输阶段** (0.225136s → 6.651283s = 6.43秒)
   - 下载3.6MB文件用了6.43秒
   - 平均速度约555KB/s，这是主要的耗时部分

##### 4.2.4、基于时序分析的优化方向

1. **数据传输优化** (占总时间96.6%)：
   - 启用 **gzip** 压缩
   - 使用 **CDN** 加速
   - 文件分片加载
   - 考虑文件大小优化

2. **连接优化** (占总时间1.3%)：
   - **HTTP/2** 多路复用
   - **Keep-Alive** 连接复用
   - **DNS** 预解析

3. **服务器响应优化** (占总时间2.1%)：
   - 服务器缓存策略
   - 数据库查询优化
   - 服务器性能调优

在上述案例中，数据传输时间占了绝大部分（96.6%），这说明主要瓶颈在网络带宽和文件大小，而不是连接建立或服务器响应时间