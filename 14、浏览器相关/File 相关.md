## File 相关

### 一、File API

#### 1.1、概述

**File API **是 **Web 应用**中一种允许通过  **JavaScript** 读取用户选择的文件内容，并获取文件的基本元信息（大小、类型、修改时间等）的机制

它是 **Web 应用** 与**用户本地文件系统**的“单向桥梁”，主要用于用户通过 `<input type="file">` 或拖拽上传文件后，前端对文件进行预览、解析或上传到服务器

**特点：**

- ==**只能读取文件内容，不能修改文件内容**==
- 必须由用户触发（ `<input>` 或拖拽 ）

#### 1.2、File 接口

> **Blob (Binary Large Object)**: 表示一个不可变、原始数据的类文件对象

**File 接口**继承自 **Blob** 接口，除了包含文件数据内容外，还包含文件的元数据，例如：

-  `name` 文件名

- `size` 大小
- `type` **MIME** 类型
- `lastModified` 最后修改时间

**File 接口**构造函数语法👇：

```javascript
const file = new File(fileBits, fileName, options)
```

**入参**:

- `bits` (必填): 一个包含文件内容的数据片段集合（如 `Array`），可以是：
  -  `String`
  - `ArrayBuffer`
  - `ArrayBufferView`
  - `Blob` 对象
- `name` (必填): 字符串，表示文件的名称
- `options` (可选): 一个包含配置项的对象，支持两个属性：
  - `type`: 字符串，文件的 MIME 类型（默认为空字符串）
  - `lastModified`: 数值，文件最后修改的时间戳（默认为 `Date.now()`）

**出参**: 一个新的 `File` 实例对象

**File 实例对象上常用的方法：**

`File` 继承自 `Blob`，因此拥有以下核心方法👇 它们大多是异步的，返回 **Promise**

- **`slice(start, end, contentType)`**

  - `start` (可选): 切片的起始字节索引
  - `end` (可选): 切片的结束字节索引
  - `contentType` (可选): 新 **Blob** 的 **MIME** 类型

  - 返回一个新的 `Blob` 对象，包含原文件指定范围的数据

- **`text()`**: 返回一个 `Promise<string>`，解析为文件的 **UTF-8** 文本内容

- **`arrayBuffer()`**: 返回一个 `Promise<ArrayBuffer>`，包含文件的二进制数据

- **`stream()`**: 返回一个 `ReadableStream`，用于分块读取文件内容。

**使用示例：**

```javascript
// 使用内存数据生成文件并上传
const content = ["Hello World"];
const file = new File(content, "hello.txt", {
  type: "text/plain",
  lastModified: Date.now()
});

// 读取文件内容
const file = document.querySelector('input[type="file"]').files[0]; // 获取 File 对象
const text = await file.text();// 读取文本
const buffer = await file.arrayBuffer();// 读取二进制
```

#### 1.4、FileReader 接口

**FileReader 接口**是读取文件内容的核心工具，与 `File.text()` 等继承自 **Blob 接口** 的 **Promise API** 不同，**FileReader** 采用**事件驱动模型**，适用于需要监控读取进度（如大文件上传显示百分比）或兼容旧版本浏览器的场景

**FileReader 接口**构造函数语法👇：

```javascript
const reader = new FileReader()
```

- **出参：** 返回一个新的 `FileReader` 实例对象

**FileReader 实例对象上常用的方法和属性：**

> `FileReader` 的读取方法本身**没有直接返回值**（返回 `undefined`）
>
> 读取的结果通过实例的属性（如 `result`）和回调事件（如 `onload`）来获取

- `readAsText(blob, encoding)`：用于获取文件的**纯文本内容**
  - `blob` (必填): 要读取的 `Blob` 或 `File` 对象
  - `encoding` (可选): 指定编码格式，默认是 `UTF-8`
- `readAsDataURL(blob)`：用于将文件转换为 **Data URL** <!--常用于预览-->
  - `blob` (必填): 要读取的 `Blob` 或 `File` 对象
- `readAsArrayBuffer(blob)`：用于获取文件的**原始二进制数据**
  - `blob` (必填): 要读取的 `Blob` 或 `File` 对象
- `abort()`：立即中止当前的读取操作

- `onload`: ==读取操作成功完成时触发==
- `onerror`: 读取操作发生错误时触发
- `onprogress`: 读取过程中周期性触发（常用于显示进度条）

- `reader.result`: ==读取到的数据（读取完成后填充）== <!--在回调中通过此属性获取读到的文件内容-->
- `reader.readyState`: 当前状态
  - 0: EMPTY
  - 1: LOADING
  - 2: DONE

**使用示例：**

```javascript
// 示例 1：用户选择图片后立即显示预览
const reader = new FileReader();
const file = document.querySelector('input').files[0];
// 定义回调函数
reader.onload = (e) => {
  const img = document.createElement('img');
  // 通过 result 属性，获取到的 Base64 字符串
  img.src = e.target.result; 
  document.body.appendChild(img);
};
// 执行读取方法
reader.readAsDataURL(file);

// 示例 2：监控文件读取进度
const reader = new FileReader();
const file = document.querySelector('input').files[0];
// 定义回调函数
reader.onprogress = (event) => {
  if (event.lengthComputable) {
    const percent = Math.round((event.loaded / event.total) * 100);
    console.log(`当前读取进度: ${percent}%`);
  }
};
// 执行读取方法
reader.readAsArrayBuffer(file);
```

> 现代 **Web** 标准为 `Blob`（包括 `File` 继承自 `Blob`）引入了直接读取的方法，这些方法返回的是 **Promise**
>
> 比基于事件（**Event**）的 `FileReader` 写法更简洁、更符合现代 `async/await` 的编程范式
>
> **使用 Blob 的替代方案 ：**
>
> - `blob.text()`: 替代 `readAsText()`
> - `blob.arrayBuffer()`: 替代 `readAsArrayBuffer()`
> - `blob.stream()`: 返回一个可读流（ReadableStream），适合处理超大文件，避免一次性占用过多内存
>
> 示例：
>
> ```javascript
> // FileReader 的写法
> const reader = new FileReader();
> reader.onload = () => {
>     console.log(reader.result);
> };
> reader.readAsText(file);
> 
> // Blob 的写法
> const text = await file.text();
> console.log(text);
> ```
>
> 不过，尽管 `Blob` 的新方法更方便，但 `FileReader` 在有些场景中依然是不可替代的：
>
> - **对于简单的文本或二进制读取**：优先使用 `blob.text()` 或 `blob.arrayBuffer()`，代码更清晰
> - **对于需要进度条、取消操作或需要 data URL 的复杂场景**：使用 `FileReader`

#### 1.5、FileList 接口

**FileList 接口** 主要用于表示用户从 `<input type="file">` 元素选择的文件，或者通过拖拽操作上传的文件列表

**FileList 实例对象**是一个**只读的类数组对象**，其中存储了若干个 **File** 对象，无法通过 `new FileList()` 手动实例化它，**FileList 实例对象**完全由浏览器在用户触发文件选择或拖拽行为时自动创建并填充

**使用示例：**

配合 `<input type="file">` 处理文件上传，通过监听 `change` 事件，获取 `event.target.files` 即可得到 `FileList`

```html
<input type="file" id="fileInput" multiple>

<script>
  const fileInput = document.getElementById('fileInput');

  fileInput.addEventListener('change', (event) => {
    // 获取 FileList 对象
    const fileList = event.target.files;

    if (fileList.length > 0) {
      console.log(`用户选择了 ${fileList.length} 个文件`);

      // 遍历 FileList
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList.item(i); // 或 fileList[i]
        console.log(`文件名: ${file.name}, 大小: ${file.size} bytes`);
      }
    }
  });
</script>
```

### 二、File System API

#### 2.1、概述

**File System API** 是一组强大的 **Web** 标准接口，==允许 **Web 应用**在用户授权后直接**读取**、**创建**、**修改**和**保存**本地文件或目录==，使 **Web 应用**具备接近桌面软件的文件管理能力

在它出现之前， **Web 应用**只能通过 `<input type="file">` 以“一次性上传”的方式获取文件内容，且无法保存修改

**File System API** 主要解决了 **Web 应用**在处理复杂文件任务时的痛点，适用于：

- **在线 IDE / 代码编辑器：** 支持直接打开文件夹、新建/修改项目文件
- **图像/音频编辑器：** 允许用户打开本地图片/音频，并在处理后直接“保存”覆盖原文件或另存为
- **本地保存：** 将网页内容以 **Markdown** 文件形式保存在本地文件夹中

**常用接口：**

- `window.showOpenFilePicker(options)`：用于触发浏览器原生文件选择对话框，通过让用户主动选择文件来获取访问该文件的操作句柄，从而赋予网页读取或修改该本地文件的权限

  - 入参： `options` 对象（可选）
    - 例如  `types: [{ description: 'Text', accept: {'text/plain': ['.txt']} }]`, `multiple: true`）。
  - 出参： 返回一个 `Promise`，解析为 `FileSystemFileHandle` 数组

- `FileSystemFileHandle` (文件句柄)：代表本地的一个具体文件，用于读取文件内容或开启写入权限 <!--相当于文件控制权-->

  - 属性：

    - `kind` ：类型，值为 `'file'`
    - `name` ：文件名
  - 方法：

    - `getFile()`: 将句柄转换为标准的 `File` 对象

      - 返回一个 `Promise<File>` 对象（包含 `size`、`type`、`lastModified` 等元数据
    - `createWritable()`: 开启一个写入流，用于向文件中写入数据

      - 入参：`options` 对象（可选）
      - 出参：返回一个 `Promise<FileSystemWritableFileStream>` 对象

      > `FileSystemWritableFileStream`（写入流）：以流式方式将数据写入磁盘，它采用原子操作，只有调用 `close()` 时才会真正覆盖原文件
      >
      > 常用方法：
      >
      > - `write(data)`：将数据写入临时文件
      > - `close()`：提交更改并关闭写入流

- `FileSystemDirectoryHandle`（目录句柄）：代表本地的一个文件夹，主要用于遍历目录下的内容或查找特定子文件

  - 属性：
    -  `kind` ：类型，值为 `'directory'`
    -  `name` ：文件夹名
  - 方法：
    - `getFileHandle(name, options)`: 获取子文件句柄
    - `getDirectoryHandle(name, options)`: 获取子文件夹句柄
    - `entries()` / `values()`: 遍历目录下的所有内容

**使用示例：** **打开并修改文件，用户选择一个文本文件 -> 读取内容 -> 修改内容 -> 保存回原文件**

```JavaScript
// 1. 获取文件句柄 (必须在用户点击事件中触发)
async function editLocalFile() {
  try {
    // 触发浏览器原生文件选择对话框，返回值是一个 FileSystemFileHandle 数组
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt'] } }],
    });

    // 2. 读取文件内容
    // fileHandle.getFile() 返回值是一个 File 实例对象，可以直接读取文件内容
    const file = await fileHandle.getFile();
    const contents = await file.text();
    console.log("读取的内容:", contents);

    // 3. 对内容进行处理（假设我们追加一行文字）
    const newContent = contents + "\n[修改时间: " + new Date().toLocaleString() + "]";

    // 4. 创建写入流以保存修改
    // createWritable() 会创建一个临时的交换文件，确保写入安全
    const writable = await fileHandle.createWritable();
    
    // 写入数据
    await writable.write(newContent);
    
    // 关闭流（此时数据真正持久化到磁盘）
    await writable.close();
    
    alert("文件保存成功！");

  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error("操作失败:", err);
    }
  }
}

// 绑定按钮点击事件
document.getElementById('save-btn').addEventListener('click', editLocalFile);
```
