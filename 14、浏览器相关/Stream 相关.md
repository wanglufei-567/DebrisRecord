## Stream 相关

### 一、概述

**Web Streams API** 可以用来处理“**分块数据（chunk）**”，且支持**边接收边处理**，而不是一次性加载全部数据

#### 1.1、背景

**传统处理资源的方式（`fetch().json()` / `FileReader`）存在以下问题：**

- **内存问题：** 需要将完整数据加载到内存，若是遇到大文件（几十 MB ~ GB）时会导致卡顿甚至崩溃
- **无法流式处理**：必须在完整地接收到所有的内容后才能进行处理，不适合日志流、AI 流式输出、视频流等场景
- **数据处理链路无法“流水线化”**：数据处理链路（网路 → 解压 → 解码 → 解析）每一步都需要等上一步全部完成

#### 1.2、**Web Streams API**的特点

为了解决传统处理资源方式的不足，**Streams API** 具备以下特点：

- **降低内存占用：** 不需要存完整数据，只保留当前**分块数据（chunk）**
- **支持流式处理：**无需等待完整接收，数据一旦到达即可开始处理或显示
  - 比如流式播放视频、在下载过程中实时解析 **JSON** 数据
- **背压处理**：如果数据源产生数据的速度快于消费者处理数据的速度，浏览器会暂停前端的数据读取，并利用 TCP 底层协议通知服务端，减缓数据传输速度，防止数据积压造成系统崩溃

### 二、核心接口

#### 2.1、ReadableStream（可读流）

**Stream API** 中的 **ReadableStream** 接口，表示可读取的字节数据流，允许以分块的形式处理从网络或其他来源获取的原始数据

> **Fetch API** 的 **Response** 的属性 **body** 提供了一个具体的 **ReadableStream** 对象 
>
> 可以直接使用 `getReader().read()` 读取数据

**ReadableStream** 构造函数的语法👇：

```javascript
const stram = new ReadableStream(underlyingSource, queuingStrategy)
```

- **入参**：

  - `underlyingSource` : 一个包含生命周期钩子的对象，可选，默认值为 `{}`

    常用方法👇

    -  `start(controller)`：初始化

    - `pull(controller)`:  数据被拉取时调用

      >  `start(controller)` 或 `pull(controller)` 会接收一个 **`ReadableStreamDefaultController`**
      >
      > 可以通过它向流中填充数据，供消费者（如 `reader.read()`）读取
      >
      > 常用方法：
      >
      > - `enqueue(chunk)`：将一块数据放入流的内部队列中
      > - `close()`：通知消费者流已结束，不再有新数据
      > - `error(e)`：发生严重错误时调用，会立即中断流并通知消费者

    - `cancel(reason)`:  流被关闭时调用

  - `queuingStrategy`:  控制背压策略的对象，可选，默认值为 `{ highWaterMark: 1 }`

    常用属性👇

    - `highWaterMark`：缓冲区大小
    - `size`：计算 **chunk** 大小的方法

- **出参**：返回一个 `ReadableStream` 实例对象，通常用来“消费”数据，或者将数据“管道化”到目的地

  常用的方法👇

  - `getReader()`：返回一个 `ReadableStreamDefaultReader` 读取器对象 

    读取器对象常用方法：

    -  `read()`：从流中读取下一块数据的核心方法 <!--最常用-->

      - 返回一个 **Promise**，当 **Promise** `resolve` 时，它会返回一个包含两个属性的对象： <!--重要-->

        - `value`: 当前读取到的数据块（**Chunk**）
        - `done`:  是否数据已经读取完了
          -  `true` 表示流已关闭且没有更多数据
          - `false` 表示流仍有数据可读

        **示例：**

        ```javascript
        const reader = stream.getReader();
        reader.read().then(({ value, done }) => {
          if (done) {
            console.log('流读取完毕');
          } else {
            console.log('读取到数据:', value);
          }
        });
        ```

  - `pipeThrough(transformStream)`：==**数据转换与管道连接**，将当前 **ReadableStream** 导入一个 **TransformStream** ，并返回处理后的 **ReadableStream**==

    - **核心作用**：在数据传输过程中对其进行加工（如压缩、加密、格式转换）
    - **入参**：一个包含 `{ writable, readable }` 属性的对象（通常是一个 `TransformStream` 实例）
    - **返回值**：返回一个新的 `ReadableStream`（即该 `TransformStream` 的 `readable` 侧）

  - `pipeTo(writableStream)`：==**管道终点（消费）**，将当前 **ReadableStream** 中的数据写入到目标 **WritableStream**中==

    - **核心作用**：作为流处理的最后一步，将数据“沉淀”到目标（如文件写入、网络上传、DOM 显示）

    - **入参**：一个 `WritableStream` 实例

    - **返回值**：返回一个 `Promise`，该 **Promise** 会在流成功传输完成时 `resolve`，如果传输过程中发生错误则会 `reject`

    <!--一般不需要手动 getReader 和 getWriter，可以使用 pipeTo 和 pipeThrough 直接将流“管道”连接起来-->

- **使用示例：**

  ```javascript
  // 模拟一个从数据库或 API 读取数据的过程，每秒产生一个数字
  
  // 1. 创建实例
  const sourceStream = new ReadableStream({
    start(controller) {
      let count = 0;
      // 模拟数据生成
      const interval = setInterval(() => {
        count++;
        // 写入数据到 chunk 中
        controller.enqueue(`数据块-${count}`); 
        
        // 停止写入
        if (count >= 3) {
          clearInterval(interval);
          // 结束流
          controller.close(); 
        }
      }, 500);
    }
  });
  
  // 2. 使用实例的 getReader 方法读取数据快
  const reader = sourceStream.getReader();
  
  async function consume() {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log("读取到:", value);
    }
  }
  consume();
  
  // 输出结果 
  // 读取到: 数据块-1
  // 读取到: 数据块-2
  // 读取到: 数据块-3
  ```

#### 2.2、WritableStream (可写流)

**Stream API** 中的 **WritableStream** 接口，表示一个可写入的目标，提供了一个标准接口，用于将数据异步地写入底层接收器（如文件系统或网络请求）

**WritableStream** 构造函数的语法👇：

```javascript
const stream = new WritableStream(underlyingSink, queuingStrategy)
```

- **入参：**

  - `underlyingSink` ：一个包含生命周期钩子的对象，可选，默认值为 `{}`

    常用方法👇

    -  `start(controller)`

    - `write(chunk, controller)`：处理写入的数据块

    - `close(controller)`

      > `WritableStream` 的钩子函数（ `start`, `write`, `close`, `abort`）接收的是 **`WritableStreamDefaultController`**
      >
      > 可以通过它来进行**状态管理**
      >
      > 常用的方法：
      >
      > - `error(e)`：当写入逻辑出现无法恢复的错误时，调用此方法使流进入错误状态

    - `abort(reason)`

  - `queuingStrategy` ：控制背压策略的对象，可选，默认值为 `{ highWaterMark: 1 }`

- **出参：**返回一个 `WritableStream` 实例，主要用来“接收”数据，并管理写入过程

  常用的方法👇

  - `getWriter()` ：返回一个 `WritableStreamDefaultWriter` 写入器 <!--最常用-->

    常用的方法👇

    - `write(chunk)`：用于写入数据
      - 返回一个 **Promise**，如果写入流正在繁忙（处理之前的写入），该 **Promise** 会在写入流准备好后才 **resolve**，这能有效防止内存溢出 <!--重要-->
    - `close()`：等待所有挂起的 `write()` 操作完成后再关闭流

  - `abort(reason)` ：忽略所有挂起的写入操作，并直接将流标记为 `errored`

- **使用示例：**

  ```javascript
  // 模拟一个“持久化”存储（比如写入本地文件或发送到服务端日志）
  
  // 1. 创建实例
  const destinationStream = new WritableStream({
    write(chunk) {
      // 模拟写入磁盘的延迟
      return new Promise(resolve => {
        console.log(`[存储中] 处理数据: ${chunk}`);
        setTimeout(resolve, 1000); 
      });
    },
    close() {
      console.log("所有数据已写入完毕");
    }
  });
  
  // 2. 使用实例的 getWriter 方法写入数据
  const writer = destinationStream.getWriter();
  writer.write("文件片段 A");
  writer.write("文件片段 B");
  writer.close();
  
  // 输出结果
  // [存储中] 处理数据: 文件片段 A
  // [存储中] 处理数据: 文件片段 B
  // 所有数据已写入完毕
  ```

#### 2.3、TransformStream (转换流)

**Stream API** 中的 **TransformStream** 接口，由一对可读和可写流组成的转换器，用于在数据传输过程中对其进行实时处理或修改（如压缩或加密）

**TransformStream** 构造函数的语法👇：

```javascript
const stream = new TransformStream(transformer, writableStrategy, readableStrategy)
```

- **入参：**

  - `transformer` ：一个包含生命周期钩子的对象，可选，默认为 `{}`

    常用方法👇

    -  `start(controller)`
    - `transform(chunk, controller)`：当 **TransformStream** 返回的 **ReadableStream** 开始消费时触发，核心转换逻辑所在
      - `chunk`：输入的数据块
      - `controller`：转换控制器
        - 可以调用 `controller.enqueue(newChunk)` 将转换后的数据发往 `readable` 端
    - `flush(controller)`：当写入端（**WritableStream**）被显式关闭（`.close()`）且所有数据块都经过 `transform` 处理后触发

  - `writableStrategy` / `readableStrategy` (可选)：分别用于配置该转换流内部的可写端和可读端的缓冲区策略

- **出参：** 返回一个包含两个属性的对象：`{ readable: ReadableStream, writable: WritableStream }`

  - `writable`：==**数据的入口**，将原始数据写入这里==（通常使用 `.pipeTo()` 或 `Writer`）

  - `readable`：==**数据的出口**，转换后的数据会出现在这里，供下游消费==

    > 返回的 **ReadableStream** 和 **WritableStream** 是转换过程的中间产物
    >
    > `writable` 接收原始数据
    >
    > `readable` 存储加工后的数据

- **使用示例：**

  ```javascript
  // 在数据传输过程中，将所有文本转换为大写，或者进行简单的格式化
  
  // 1. 创建实例
  const transformer = new TransformStream({
    transform(chunk, controller) {
      // 对数据进行加工
      const processed = chunk.toUpperCase();
      controller.enqueue(processed); // 将加工后的数据放入输出端
    }
  });
  
  // 2. 使用示例：手动调用（在实际中通常结合 pipe 使用）
  const writer = transformer.writable.getWriter();
  const reader = transformer.readable.getReader();
  
  writer.write("hello stream"); // 写入原始数据
  
  reader.read().then(({ value }) => {
    console.log("转换结果:", value); // 输出: HELLO STREAM
  });
  ```

### 三、具体应用

#### 3.1、可读流、转换流、可写流综合使用

一般不需要手动 `getReader` 或 `getWriter`，而是直接将流“管道”连接起来，**流机制会自动处理背压（Backpressure）**

**场景**：源源不断产生小写字母 -> 转换为大写 -> 打印输出

```javascript
// 定义一个可读流，开始读取数据时，可以添加数据进去，作为原始数据
const source = new ReadableStream({
  start(controller) {
    ['apple', 'banana', 'cherry'].forEach(item => controller.enqueue(item));
    controller.close();
  }
});

// 定义一个转换流，用来加工数据
const upperCaseTransformer = new TransformStream({
  transform(chunk, controller) {
    controller.enqueue(chunk.toUpperCase());
  }
});

// 定义一个可写流，将加工后的数据写入其中
const sink = new WritableStream({
  write(chunk) {
    console.log(`[最终输出]: ${chunk}`);
  }
});

// 核心：使用 pipeThrough 连接转换流，使用 pipeTo 连接最终的可写流
source
  .pipeThrough(upperCaseTransformer) // 经过转换流
  .pipeTo(sink);                     // 送入目的地

// 输出：
// [最终输出]: APPLE
// [最终输出]: BANANA
// [最终输出]: CHERRY
```

#### 3.2、流式读取文件

**Blob** 实例对象上自带一个  `.stream()` 方法，它会直接创建一个 `ReadableStream` ，而 **File** 继承自 **Blob**，因此 **File** 实例对象上也有一个 `.stream()` 方法，可以实现流式读取文件内容

**场景：** 选择一个大文件，流式读取其中内容

```javascript
const fileInput = document.querySelector('input[type="file"]');

fileInput.addEventListener('change', async (e) => {
  // 获取选中的 File 实例对象
  const file = e.target.files[0];
  // 创建一个 ReadableStream
  const readableStream = file.stream();
  // 使用 reader 读取流
  const reader = readableStream.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log(`读取到一块数据，大小: ${value.length} bytes`);
    // 在这里处理数据 (value 是 Uint8Array)
  }
});
```

#### 3.3、流式读取请求响应内容

**Response** 实例对象上的 `body` 属性是一个 `ReadableStream` 实例

我们通常使用 `response.json()` 或 `response.text()` 进行响应内容解析时，浏览器会等待**整个响应体**下载完成、解析完毕后，才会返回最终结果

如果响应体很大（比如几个 G 的大文件、或者是 AI 对话框那种持续输出的长文本），这种做法会导致：

- **内存占用过高**：所有数据必须一次性载入内存
- **延迟高**：用户必须等到所有内容接收完毕才能看到第一部分

可以通过 `response.body.getReader()` 获取一个读取器，然后循环读取**数据块（Chunk）**，通过流式读取，做到**边下载、边处理**，几乎实现“零内存消耗”的实时数据处理

==**关键点：** `stream` 输出的是原始二进制数据 (`Uint8Array`)，通常需要配合 `TextDecoder` 将其转化为字符串==

**示例：**

```javascript
async function streamFetch(url) {
  const response = await fetch(url);
  
  if (!response.body) {
    throw new Error('当前浏览器不支持响应流');
  }

  // 1. 获取读取器
  const reader = response.body.getReader();
  // 2. 创建解码器（处理 UTF-8 字符）
  const decoder = new TextDecoder();

  try {
    while (true) {
      // 3. 读取数据块
      const { done, value } = await reader.read();
      
      if (done) {
        console.log("数据接收完毕！");
        break;
      }

      // 4. 将 Uint8Array 转为字符串并处理
      const chunk = decoder.decode(value, { stream: true });
      console.log("收到数据块:", chunk);
    }
  } catch (error) {
    console.error("读取出错:", error);
  }
}
```

**常见应用场景：**

- **AI 对话实时展示**：
  - **请求端（前端）**：发起一个普通的 `fetch` 请求（**POST** 或 **GET**）
  - **响应端（后端）**：设置响应头 `Content-Type: text/event-stream` 或不设置 `Content-Length`，保持 **HTTP** 连接不关闭，直接连续地向客户端写入数据块（**Chunk**）
  - **传输层**：浏览器接收到数据后，不会等待请求结束，而是立刻将接收到的每一个字节“吐”给前端逻辑进行处理
  - 前端利用 `ReadableStream` 实时将文字打字机般显示在界面上
- **大文件下载进度监控**：虽然 `fetch` 本身没有自带进度事件，但通过读取 `ReadableStream` 的大小，可以精确计算已下载的字节数，从而实现自定义的进度条
- **实时音视频处理**：在浏览器中直接处理流式的媒体数据，而不需要等待整个文件下载

#### 3.4、流式写入文件

原生的 `new WritableStream()` 无法直接向硬盘上的文件写入数据，要写入文件，需要使用 **File System Access API**

该 **API** 提供了一个 `FileSystemWritableFileStream` 对象，它是 `WritableStream` 的一个具体实现，专门用于写入文件

**示例：**

```javascript
async function saveFile(data) {
  // 1. 弹出保存文件对话框，获取 FileSystemFileHandle
  const fileHandle = await window.showSaveFilePicker({
    suggestedName: 'example.txt',
    types: [{ description: 'Text File', accept: { 'text/plain': ['.txt'] } }]
  });

  // 2. 创建可写流
  const writableStream = await fileHandle.createWritable();

  // 3. 写入数据
  await writableStream.write(data);

  // 4. 关闭流（此时文件才会真正保存到磁盘）
  await writableStream.close();
}

// 调用示例
saveFile("Hello, World! 这是一段通过 WritableStream 写入的数据。");
```

