## SSE 相关

### 一、前言

在很多前后端交互场景里，客户端发起一次请求之后，并不一定只等待一个最终结果

例如：

- 后端正在处理一个耗时任务，需要持续把进度推给前端
- 服务端有新的通知、告警、状态变化，需要主动告诉浏览器
- **AI** 对话、日志输出、构建进度这类内容，需要边生成边展示

如果只用普通 **HTTP** 请求，前端通常只能轮询：

```javascript
// 每 1 秒主动请求一次任务状态
setInterval(async () => {
  const response = await fetch('/api/task/status');
  const data = await response.json();

  // 根据本次查询结果刷新页面
  renderProgress(data);
}, 1000);
```

这种方式能用，但有明显问题：

- 即使状态没有变化，前端也会不断发请求
- 实时性取决于轮询间隔，间隔太短会浪费资源，间隔太长用户体验差
- 前端要自己处理请求节奏、失败重试、重复数据过滤

**SSE（Server-Sent Events）** 的核心价值是：==在保持 **HTTP** 简单性的前提下，让服务端可以持续向浏览器推送事件==

它适合解决“客户端只需要订阅服务端更新，不需要频繁向服务端反向发送消息”的问题

### 二、SSE 基础概念

#### 2.1、SSE 是什么

==**SSE** 是一种基于 **HTTP** 的**服务端单向推送技术**==

浏览器通过内置的 **EventSource** 接口向服务端建立一个长连接，服务端保持这个连接不关闭，并按照固定文本格式持续写入事件

这里需要前后端同时配合：

- 前端：使用 `EventSource` 发起 **SSE** 连接，并监听服务端推送事件
- 服务端：返回 `text/event-stream` 响应，保持连接不关闭，并持续按 **SSE** 文本格式写入数据

> 如果服务端只返回普通 **JSON**、普通文本或一次性响应，即使前端使用 `EventSource`，也不会自动变成 **SSE** 长连接
>

前端收到事件后，会触发 `message` 或自定义事件监听器，最小形式如下👇：

```javascript
// EventSource 会发起一个 GET 长连接请求
const source = new EventSource('/api/events');

// 默认事件会触发 onmessage
source.onmessage = (event) => {
  console.log(event.data);
};
```

服务端返回的不是一次性 **JSON**，而是一段持续输出的文本流👇：

```text
data: hello

data: world

```

每一条消息用空行分隔，也就是以 `\n\n` 作为事件边界

#### 2.2、SSE 不是什么

**SSE** 不是 **WebSocket**

- **SSE** 是服务端到客户端的单向推送，基于普通 **HTTP**，浏览器原生支持自动重连
- **WebSocket** 是客户端和服务端之间的全双工通信，需要独立的协议升级和更完整的连接管理

**SSE** 也不是普通的 **Fetch Stream**

- **Fetch Stream** 只是拿到原始字节流，消息边界、解析、重连都要自己处理
- **SSE** 规定了事件格式，浏览器会帮你解析消息、维护缓冲区、处理重连

所以可以把 **SSE** 理解成：

> ==一种浏览器原生支持的、带事件格式约定和自动重连能力的 **HTTP** 长连接推送方案==

### 三、SSE 的核心机制

#### 3.1、连接建立

前端创建 `EventSource` 对象时，浏览器会发起一个 **GET** 请求：

```javascript
const source = new EventSource('/api/task/events');
```

服务端需要返回关键响应头：

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

==其中最重要的是 `Content-Type: text/event-stream`，它告诉浏览器：这不是普通文本响应，而是一个 **SSE** 事件流==

#### 3.2、事件格式

**SSE** 事件是纯文本协议，常见字段有四个：

```text
event: progress
id: 12
retry: 3000
data: {"percent":60,"message":"正在处理"}
```

字段含义：

- `data`：事件数据，可以是普通字符串，也可以是序列化后的 **JSON**
- `event`：事件名称，前端可以用 `addEventListener` 监听指定事件
- `id`：事件编号，断线重连时浏览器会带上 `Last-Event-ID`
- `retry`：建议浏览器断线后多少毫秒再重连

如果不写 `event` 字段，浏览器会触发默认的 `message` 事件

```text
data: {"message":"默认消息"}
```

前端通过 `onmessage` 接收：

```javascript
source.onmessage = (event) => {
  // event.data 是服务端 data 字段里的字符串
  const data = JSON.parse(event.data);

  console.log(data.message);
};
```

如果写了 `event: progress`，前端要监听 `progress`：

```javascript
// 监听服务端写出的 event: progress
source.addEventListener('progress', (event) => {
  const data = JSON.parse(event.data);

  console.log(data.percent);
});
```

#### 3.3、数据流和控制流

一次 **SSE** 通信可以拆成下面几个步骤：

1. 前端通过 `new EventSource(url)` 发起 **GET** 请求
2. 服务端设置 `text/event-stream` 响应头，并保持连接打开
3. 服务端每次有新状态时，通过 `res.write()` 写入一段符合 **SSE** 格式的文本
4. 浏览器内部维护缓冲区，直到读到空行 `\n\n`，才认为一条事件结束
5. 浏览器把完整事件解析成 `MessageEvent`，交给前端监听函数
6. 如果连接异常断开，浏览器会自动尝试重连

这里的关键点是：==**SSE** 不是让前端直接处理原始字节，而是把原始流封装成一个个事件==

这也是它比普通 **Fetch Stream** 更容易使用的原因

### 四、经典示例：任务进度推送

这个例子模拟一个后端耗时任务，前端实时展示任务进度

#### 4.1、后端示例

```javascript
const express = require('express');

const app = express();

app.get('/api/task/progress', (req, res) => {
  // 声明这是 SSE 事件流，而不是普通 JSON 响应
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  let percent = 0;

  const sendEvent = (event, data) => {
    // event 对应前端 addEventListener 监听的事件名
    res.write(`event: ${event}\n`);

    // data 是事件负载，每条事件必须以空行结尾
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // 连接建立后，先推送一次初始状态
  sendEvent('progress', {
    percent,
    message: '任务已开始',
  });

  const timer = setInterval(() => {
    percent += 20;

    // 模拟任务进度变化，并持续推送给浏览器
    sendEvent('progress', {
      percent,
      message: `任务进度 ${percent}%`,
    });

    if (percent >= 100) {
      // 任务完成后推送 done 事件
      sendEvent('done', {
        percent: 100,
        message: '任务已完成',
      });

      clearInterval(timer);

      // 任务完成后主动结束这次 SSE 响应
      res.end();
    }
  }, 1000);

  // 浏览器关闭页面或连接断开时，清理服务端资源
  req.on('close', () => {
    clearInterval(timer);
    res.end();
  });
});

app.listen(3000, () => {
  console.log('SSE server running at http://localhost:3000');
});
```

这个后端接口有几个重点：

- 响应头必须声明 `text/event-stream`
- 每条事件必须用 `\n\n` 结束
- 任务完成后可以主动 `res.end()`
- 客户端断开时要清理定时器、文件句柄、数据库订阅等资源
- 示例里的 `Access-Control-Allow-Origin: *` 只适合本地演示，生产环境应按实际域名收敛

#### 4.2、前端示例

```html
<div>
  <progress id="progress" value="0" max="100"></progress>
  <span id="text">等待开始</span>
</div>

<script>
  const progress = document.querySelector('#progress');
  const text = document.querySelector('#text');

  // 创建 EventSource 时，浏览器会立即向后端发起 GET 长连接请求
  // SSE 是服务端单向推送，EventSource 没有 send 方法
  const source = new EventSource('http://localhost:3000/api/task/progress');

  // 接收服务端 event: progress 的事件
  source.addEventListener('progress', (event) => {
    const data = JSON.parse(event.data);

    progress.value = data.percent;
    text.textContent = data.message;
  });

  // 接收服务端 event: done 的事件
  source.addEventListener('done', (event) => {
    const data = JSON.parse(event.data);

    progress.value = data.percent;
    text.textContent = data.message;

    // 任务完成后，前端主动关闭 SSE 连接
    source.close();
  });

  source.onerror = () => {
    text.textContent = '连接异常，浏览器会尝试自动重连';
  };
</script>
```

这个例子里，前端没有写轮询，也没有==手动解析流式字节==

==浏览器会把服务端连续写入的文本事件解析成 `progress` 和 `done` 两类事件，前端只需要关心业务状态如何渲染==

### 五、工程注意事项

#### 5.1、SSE 默认只能使用 GET

`EventSource` 默认只能发起 **GET** 请求，不能像 `fetch` 那样直接携带复杂 **Body**

常见做法是：

1. 先用 `POST /api/tasks` 创建任务，并把复杂参数提交给后端
2. 后端返回 `taskId`
3. 前端用 `new EventSource('/api/tasks/:taskId/events')` 订阅任务事件

这样既能保留复杂入参，也能用 **SSE** 做进度推送

#### 5.2、SSE 是单向通信

如果业务需要客户端频繁向服务端发送消息，例如在线协作、游戏同步、实时聊天输入状态，**SSE** 通常不是首选

这种场景更适合 **WebSocket**

如果只是服务端推状态、推日志、推通知、推模型输出，**SSE** 的复杂度更低

#### 5.3、注意代理和服务端缓冲

**SSE** 依赖服务端“写一点，浏览器收一点”

如果中间经过 **Nginx**、网关、云函数平台或反向代理，它们可能会缓冲响应，导致前端不能实时收到事件

常见处理方式：

```http
X-Accel-Buffering: no
```

同时要避免对 **SSE** 响应做不必要的压缩或缓存，否则可能把多条事件攒在一起再发送

#### 5.4、需要心跳保持连接

长连接可能被浏览器、代理、负载均衡或服务端超时断开

如果服务端不是一直有业务消息，可以定期发送注释行作为心跳：

```text
: ping

```

服务端实际写入时一般是这样：

```javascript
const heartbeatTimer = setInterval(() => {
  // 以冒号开头的是 SSE 注释行，用来保持连接活跃
  res.write(': ping\n\n');
}, 15000);

req.on('close', () => {
  clearInterval(heartbeatTimer);
});
```

以冒号开头的行是 **SSE** 注释，浏览器不会把它当成业务消息，但它可以让连接保持活跃

#### 5.5、鉴权要谨慎设计

因为 `EventSource` 使用 **GET** 请求，所以不要把敏感信息直接放在查询参数里

更常见的方式是：

- 同源场景下使用 **Cookie** 鉴权
- 跨域场景下结合 `withCredentials` 和服务端 **CORS** 配置
- 如果必须使用短期令牌，应控制有效期，并避免写入日志

带凭据的跨域连接可以这样创建：

```javascript
// 跨域并需要携带 Cookie 时，必须显式开启 withCredentials
const source = new EventSource('https://api.example.com/events', {
  withCredentials: true,
});
```

服务端需要配套允许凭据，否则浏览器会拒绝连接

#### 5.6、不要忽略连接数量

在 **HTTP/1.1** 下，浏览器对同一域名的并发连接数有限制，多个页面同时打开多个 **SSE** 连接时可能影响其他请求

如果业务会大量并发订阅，需要考虑：

- 合并多个业务事件到一个 **SSE** 连接
- 使用 **HTTP/2** 改善连接复用
- 对长期无用的连接及时 `close`

### 六、什么时候适合用 SSE

适合使用 **SSE** 的场景：

- 任务进度推送
- 服务端日志实时输出
- 通知、告警、状态变化
- 股票、行情、监控指标这类服务端主动更新
- **AI** 对话输出、生成式任务进度、后端工作流状态

不太适合使用 **SSE** 的场景：

- 需要客户端和服务端频繁双向通信
- 需要传输二进制数据
- 需要复杂自定义协议
- 移动端、网关或代理环境无法稳定保持长连接

### 七、总结

可以用一句话概括 **SSE**：

> **SSE** 是浏览器原生支持的 **HTTP** 服务端事件流，适合服务端持续向前端推送文本事件

工程上可以按下面这个框架判断是否使用 **SSE**：

| 判断点 | 适合 SSE | 更适合其他方案 |
| --- | --- | --- |
| 通信方向 | 服务端主要向客户端推送 | 客户端和服务端频繁双向通信 |
| 数据类型 | 文本、JSON、状态事件 | 二进制、自定义协议 |
| 连接管理 | 希望浏览器自动重连 | 需要完全控制连接生命周期 |
| 实现复杂度 | 希望保持 **HTTP** 简单性 | 可以接受更复杂的协议和服务端状态 |
| 典型方案 | **EventSource** | **WebSocket**、**Fetch Stream** |

如果一个需求可以描述成“前端订阅某个服务端状态变化，然后持续接收事件”，优先考虑 **SSE**

如果需求是“双向实时交互”，再考虑 **WebSocket**
