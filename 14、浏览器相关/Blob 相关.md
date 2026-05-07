## Blob 相关

### 一、概述

**Blob（Binary Large Object 二进制大对象）** 是 **JavaScript** 运行环境中内置的用于表示**「原始二进制数据」**的==不可变**「类文件对象」**==

**核心特点：**

- **不可变性 (Immutable)：** 一旦创建，**Blob** 的内容就不能修改
- **类文件 (File-like)：** 一个由浏览器管理的数据对象，具备文件的属性（如 `size`、`type`）和操作接口（如 `slice`），使这段数据可以被当作“文件资源”来使用
- **内存高效：** 它不会直接把整个数据加载到内存中，而是通过引用指向数据，这使得处理大文件非常高效

**与其他二进制存储方式的区别：**

| **特性**     | **Blob**                 | **File**                                        | **ArrayBuffer**                  |
| ------------ | ------------------------ | ----------------------------------------------- | -------------------------------- |
| **定义**     | 原始二进制数据的只读容器 | **Blob** 的子类，包含元数据（文件名、修改时间） | 原始的内存二进制缓冲区           |
| **可变性**   | 不可变                   | 不可变                                          | **可变** (通过 TypedArray 读写)  |
| **主要用途** | 数据流转、下载、展示     | 文件上传、读取本地文件                          | 底层算法处理、WebAssembly、WebGL |
| **层级**     | 基础                     | 继承自 **Blob**                                 | 独立底层存储                     |

### 二、Blob 构造函数

**Blob** 构造函数的语法：

```javascript
const myBlob = new Blob(blobParts, options);
```

- **`blobParts` (必填)：** 一个数组，数组中可以放入多种格式的数据，浏览器会将这些数据组装成一个完整的 Blob
  - **字符串 (Strings)**：会被自动转为 **UTF-8** 编码的二进制数据
  - **Blob 对象**：会被合并
  - **ArrayBuffer / TypedArray**：这是底层的二进制数据格式

- **`options` (可选)：**
  - `type`：表示 **Blob** 对象的 **MIME** 类型（例如 `'text/html'` 或 `'image/png'`），默认值为 `""`
  - `endings`：用于指定行结束符如何转换（通常不需要设置，默认即可）
- **返回值：** 一个新的 `Blob` 对象

### 三、实例对象上常用的属性与方法

- `blob.size`：只读，返回 **Blob** 对象中包含的数据大小（字节）

- `blob.type`：只读，返回 **MIME** 类型

- `blob.slice(start, end, contentType)`：返回一个新的 **Blob** 对象，包含原 **Blob** 指定范围的数据

  - `start`：起始字节偏移量（可选，默认为 0）

  - `end`：结束字节偏移量（可选，默认为 size）

  - `contentType`：给新切片设置的 **MIME** 类型（可选）

    ```javascript
    const bigFile = new Blob(['1234567890'], { type: 'text/plain' });
    
    // 切取前 5 个字节
    const part1 = bigFile.slice(0, 5); 
    // 切取后 5 个字节
    const part2 = bigFile.slice(5, 10);
    
    console.log(part1.size); // 输出: 5
    ```

- `blob.stream()`：返回一个读取 **Blob** 内容的 `ReadableStream` （可读流）

  - ==适合超大文件处理，可以流式地读取数据，而不需要一次性把整个文件加载进内存，从而避免内存溢出==

    ```javascript
    const blob = new Blob(['数据流示例'], { type: 'text/plain' });
    
    // 创建一个可读流
    const stream = blob.stream();
    const reader = stream.getReader();
    
    // 循环读取数据流
    async function readStream() {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        console.log('读取到数据片段:', value);
      }
    }
    readStream();
    ```

- `blob.text()`：**异步方法**，以字符串形式返回 **Blob** 内容

  - 适合处理文本文件（如 `.txt`, `.csv`, `.json`）

    ```javascript
    const blob = new Blob(['Hello, World!'], { type: 'text/plain' });
    
    blob.text().then(text => {
      console.log(text); // 输出: "Hello, World!"
    });
    ```

- `blob.arrayBuffer()`：**异步方法**，以 `ArrayBuffer` （原始二进制数据）格式返回 **Blob** 内容

  - 适合需要对二进制数据进行底层处理的场景（如图片处理、加密、音频分析）

    ```javascript
    const blob = new Blob(['\u0000\u0001'], { type: 'application/octet-stream' });
    
    blob.arrayBuffer().then(buffer => {
      console.log(buffer.byteLength); // 输出: 2
      const view = new Uint8Array(buffer);
      console.log(view); // 输出: Uint8Array(2) [0, 1]
    });
    ```


### 四、使用示例

#### 4.1、生成一个文件并触发浏览器下载

动态生成文本内容并让用户下载

```JavaScript
function downloadTextFile(content, filename) {
  // 1. 创建 Blob
  const blob = new Blob([content], { type: 'text/plain' });
  
  // 2. 创建一个指向该 Blob 的临时 URL
  const url = URL.createObjectURL(blob);
  
  // 3. 创建隐藏的 a 标签触发下载
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // 4. 清理
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 调用示例
downloadTextFile('Hello, World! 这是一个 Blob 测试文件。', 'test.txt');
```

#### 4.2、使用 Blob 进行图片预览

在用户选择上传图片后，通过 **Blob URL** 立即在页面上展示预览

```JavaScript
const input = document.querySelector('input[type="file"]');
const preview = document.querySelector('#preview');

input.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    // URL.createObjectURL 返回一个代表该 Blob 的本地 URL
    const imageUrl = URL.createObjectURL(file);
    preview.src = imageUrl;
    
    // 记得在图片加载完成后释放内存，或者在页面卸载时释放
    preview.onload = () => URL.revokeObjectURL(imageUrl);
  }
});
```

#### 4.3、将 Blob 转为文本读取

通过 `fetch` 获取数据或处理上传的文本文件时

```javascript
async function readBlobAsText(blob) {
  try {
    const text = await blob.text();
    console.log('文件内容:', text);
  } catch (err) {
    console.error('读取失败:', err);
  }
}

// 示例用法：假设你有一个 File 对象
const myBlob = new Blob(['{"name": "Gemini", "type": "AI"}'], { type: 'application/json' });
readBlobAsText(myBlob);
```

