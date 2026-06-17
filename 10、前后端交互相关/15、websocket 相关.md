## WebSocket 相关

### 一、前言

在普通 **HTTP** 请求里，通信模式通常是“客户端发起请求，服务端返回响应”

这套模式很适合页面数据查询、表单提交、接口调用等场景，但不适合下面这类需要实时互动的业务：

- 聊天室，用户发送消息后，其他在线用户需要立刻收到
- 在线协作，多个人编辑同一份文档时，需要实时同步状态
- 实时行情，价格变化需要主动推送到浏览器
- 游戏或互动应用，客户端和服务端之间需要频繁交换状态

如果只用普通 **HTTP**，前端通常只能反复**「轮询」**接口，例如每 1 秒请求一次 `/messages`

这种方式的问题很明显：

- 没有新消息时，请求也是浪费
- 请求频率太低，实时性不够
- 请求频率太高，服务端压力和网络开销都会上升
- 服务端无法真正主动联系客户端，只能等客户端下一次请求

**WebSocket** 的核心价值是：==在浏览器和服务端之间建立一条**长连接**，连接建立后，双方都可以主动向对方发送消息==

### 二、WebSocket 基础概念

#### 2.1、WebSocket 是什么

==**WebSocket** 是一种基于 **TCP** 的全双工通信协议==

它一开始通过 **HTTP** 完成握手，握手成功后，连接会从普通 **HTTP** 升级为 **WebSocket** 连接

升级完成后，这条连接不再按“一次请求一次响应”的 **HTTP** 模型工作，而是变成一条可以持续收发消息的双向通道

#### 2.2、WebSocket 不是什么

**WebSocket** 不是普通 **HTTP** 接口的替代品

不是所有接口都应该改成 **WebSocket**，例如登录、获取用户信息、提交表单、分页查询列表，这些场景仍然更适合普通 **HTTP**

**WebSocket** 也不是天然可靠的业务消息系统

底层连接断开、网络切换、浏览器刷新、服务端重启、代理超时都会影响连接状态，如果业务要求消息不能丢，就需要额外设计消息确认、重连补偿和离线消息存储

### 三、WebSocket 的核心机制

#### 3.1、连接建立

浏览器通过 `new WebSocket(url)` 发起连接

连接地址通常长这样：

```JavaScript
const socket = new WebSocket('ws://localhost:3000');
```

如果是线上 **HTTPS** 页面，通常要使用加密连接：

```JavaScript
const socket = new WebSocket('wss://example.com/ws');
```

这里的协议含义是：

- `ws://`：普通 **WebSocket**，类似 `http://`
- `wss://`：加密 **WebSocket**，类似 `https://`

> 浏览器发起连接时，会先发送一个带有 `Upgrade: websocket` 的 **HTTP** 请求
>
> 这个握手请求里通常还会带上 `Origin` 请求头，它表示发起连接的页面来源
>
> 例如：页面地址是 `https://example.com/page`，页面里创建的 `websocket` 连接的是 `wss://api.example.com/ws`
>
> 那么 **WebSocket 握手阶段**的 **HTTP** 请求头里的 `Origin` 通常仍然是：
>
> ```http
> Origin: https://example.com
> ```
>
> `Origin` 是握手阶段的 **HTTP** 请求头，不是后续每条 **WebSocket** 消息里的字段
>
> 如果后端配置了 **Origin** 白名单或跨域校验，握手阶段可能会被拦截；
>
> - 若 `Origin` 不被允许，服务端会直接拒绝升级
>
> - 服务端同意升级后，返回握手成功响应，后续这条连接就进入 **WebSocket** 通信阶段

#### 3.2、消息传输

连接建立后，前端和服务端都可以调用 `send` 发送消息

浏览器侧常见事件如下：

```JavaScript
const socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('open', () => {
  socket.send(JSON.stringify({ type: 'join', roomId: 'general' }));
});

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  console.log('收到服务端消息:', message);
});

socket.addEventListener('close', () => {
  console.log('连接已关闭');
});

socket.addEventListener('error', (error) => {
  console.log('连接异常:', error);
});
```

这里有一个关键点：**WebSocket** 只负责传输消息，不负责定义业务消息格式

也就是说，消息里到底是聊天内容、操作指令、行情数据还是协作状态，需要业务自己定义

常见做法是统一使用 **JSON**：

```JavaScript
{
  "type": "chat:message",
  "payload": {
    "roomId": "general",
    "text": "大家好"
  }
}
```

#### 3.3、连接关闭

**WebSocket** 是长连接，但长连接不代表永远在线

连接可能因为下面原因关闭：

- 用户关闭页面或刷新页面
- 网络断开或切换
- 服务端主动关闭连接
- 中间代理长时间无数据后断开连接
- 服务端发布、重启或崩溃

所以工程上不能只写 `open` 和 `message`，还要处理 `close` 和 `error`

### 四、经典示例：聊天室

下面是一个最经典的 **WebSocket** 示例：浏览器发送聊天消息，服务端收到后广播给所有在线客户端

这个示例的模块边界很清楚：

- 浏览器负责建立连接、发送用户输入、展示收到的消息
- 服务端负责维护在线连接集合、接收消息、广播消息
- 消息格式使用 **JSON**，通过 `type` 区分业务动作

#### 4.1、服务端示例

安装依赖：

```bash
npm init -y
npm install ws
```

创建 `server.js`：

```JavaScript
const { WebSocket, WebSocketServer } = require('ws');

const server = new WebSocketServer({ port: 3000 });

// 保存当前所有在线客户端连接
const clients = new Set();

// 把一条消息广播给所有在线客户端
function broadcast(data) {
  const text = JSON.stringify(data);

  for (const client of clients) {
    // 只给仍然处于连接状态的客户端发送消息
    if (client.readyState === WebSocket.OPEN) {
      client.send(text);
    }
  }
}

// 每当浏览器成功建立一个 WebSocket 连接时，都会触发 connection 事件
server.on('connection', (socket) => {
  clients.add(socket);

  socket.send(JSON.stringify({
    type: 'system',
    payload: { text: '已连接聊天室' }
  }));

  socket.on('message', (rawMessage) => {
    // 浏览器发来的原始消息需要先转成字符串，再按 JSON 解析成业务对象
    const message = JSON.parse(rawMessage.toString());

    // 这个示例只处理聊天消息，其他类型直接忽略
    if (message.type !== 'chat:message') {
      return;
    }

    // 把收到的聊天消息广播给所有在线客户端
    broadcast({
      type: 'chat:message',
      payload: {
        text: message.payload.text,
        createdAt: new Date().toISOString()
      }
    });
  });

  socket.on('close', () => {
    // 从在线客户端集合里移除断开的连接，避免继续向它广播
    clients.delete(socket);
  });
});

console.log('WebSocket server running on ws://localhost:3000');
```

运行服务：

```bash
node server.js
```

#### 4.2、浏览器示例

创建 `index.html`：

```HTML
<!doctype html>
<html lang="zh-CN">
  <body>
    <ul id="messages"></ul>
    <input id="messageInput" placeholder="输入消息" />
    <button id="sendButton">发送</button>

    <script>
      // 创建到服务端的 WebSocket 长连接
      const socket = new WebSocket('ws://localhost:3000');

      const messages = document.querySelector('#messages');
      const messageInput = document.querySelector('#messageInput');
      const sendButton = document.querySelector('#sendButton');

      function appendMessage(text) {
        const item = document.createElement('li');
        item.textContent = text;
        messages.appendChild(item);
      }

      socket.addEventListener('open', () => {
        appendMessage('连接成功');
      });

      socket.addEventListener('message', (event) => {
        // 服务端发来的是 JSON 字符串，这里解析成业务对象
        const message = JSON.parse(event.data);

        appendMessage(message.payload.text);
      });

      socket.addEventListener('close', () => {
        appendMessage('连接已关闭');
      });

      sendButton.addEventListener('click', () => {
        const text = messageInput.value.trim();

        // 空消息不发送；连接还没建立或已经断开时也不发送
        if (!text || socket.readyState !== WebSocket.OPEN) {
          return;
        }

        // 按约定的 JSON 消息格式发送聊天内容
        socket.send(JSON.stringify({
          type: 'chat:message',
          payload: { text }
        }));

        messageInput.value = '';
      });
    </script>
  </body>
</html>
```

打开两个浏览器窗口访问这个页面，任意一个窗口发送消息，另一个窗口都会收到服务端广播

这就是 **WebSocket** 最典型的数据流：

```text
用户输入
  -> 浏览器 socket.send
  -> 服务端 message 事件
  -> 服务端 broadcast
  -> 所有浏览器 message 事件
  -> 页面更新
```

### 五、工程使用中的注意事项

#### 5.1、不要把所有接口都改成 WebSocket

**WebSocket** 适合高频、实时、双向通信

普通查询、提交、删除、分页、导出等一次性动作，仍然应该优先使用 **HTTP**

一个常见组合是：

- **HTTP** 负责登录、初始化数据、历史记录查询
- **WebSocket** 负责实时消息、状态变更通知、在线协作事件

#### 5.2、必须考虑重连

浏览器和服务端之间的连接随时可能断开

前端通常需要在 `close` 事件里做重连，但不能无限高频重连，否则服务端故障时会被客户端重连请求进一步压垮

更稳妥的方式是使用递增延迟：

```JavaScript
let retryCount = 0;
let socket;

function connect() {
  socket = new WebSocket('ws://localhost:3000');

  socket.addEventListener('open', () => {
    retryCount = 0;
  });

  socket.addEventListener('close', () => {
    const delay = Math.min(1000 * 2 ** retryCount, 30000);
    retryCount += 1;
    setTimeout(connect, delay);
  });
}

connect();
```

#### 5.3、需要心跳保活

很多代理、负载均衡或网关会关闭长时间无数据的连接

所以实际项目里通常会设计心跳机制

常见方式是客户端定时发送 `ping`，服务端收到后返回 `pong`

```JavaScript
setInterval(() => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);
```

心跳的目的不是传业务数据，而是确认连接仍然可用，并避免连接长时间空闲

#### 5.4、需要设计消息协议

**WebSocket** 只是传输通道，不会帮业务定义消息语义

实际项目里至少要约定这些字段：

- `type`：消息类型，例如 `chat:message`、`user:typing`、`order:updated`
- `payload`：业务数据
- `requestId`：需要请求响应匹配时使用
- `createdAt`：消息创建时间
- `version`：协议版本，方便后续兼容升级

如果没有统一协议，后续会很容易出现“前端以为是 A 格式，后端发的是 B 格式”的问题

#### 5.5、鉴权不能只依赖前端

**WebSocket** 建立连接时也需要鉴权

常见做法包括：

- 通过 **Cookie** 携带登录态，由服务端在握手阶段校验
- 通过连接参数携带短期令牌，例如 `wss://example.com/ws?token=xxx`
- 连接建立后发送鉴权消息，服务端校验通过后才允许订阅业务数据

需要注意，令牌放在 URL 里可能被日志记录，生产环境要控制令牌有效期和日志脱敏

#### 5.6、广播要注意权限和范围

聊天室示例里服务端直接把消息广播给所有客户端，这是为了展示核心机制

真实业务不能简单全量广播

例如订单状态变更只能推给订单所属用户，协作文档事件只能推给有权限访问该文档的成员

工程上通常会维护连接与用户、房间、订阅主题之间的关系：

```text
userId -> sockets
roomId -> sockets
topic -> sockets
```

这样服务端才能把消息推给正确的人，而不是推给所有在线用户

### 七、总结

**WebSocket** 的本质不是“更高级的 HTTP”，而是一条通过 **HTTP** 握手升级出来的双向长连接

它解决的是实时双向通信问题，不是替代所有后端接口

真正使用 **WebSocket** 时，重点不只是能不能连上，还包括消息协议、鉴权、重连、心跳、权限广播、异常断开和历史消息补偿

如果只记一句话，可以这样理解：

**WebSocket** 负责建立实时双向通道，业务系统负责定义消息语义、连接状态和可靠性策略
