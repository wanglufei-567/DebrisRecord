## Node基本使用—fs模块

### 一、概述

Node.js 中的 `fs` 模块（**File System** 模块）是==用于文件系统操作==的核心模块之一。 `fs` 模块提供了一系列的方法，可以用于执行文件的==读取==、==写入==、==删除==、==修改==、==重命名==等操作；通过 `fs` 模块，可以直接与文件系统进行交互，读写文件内容，以及处理文件和目录

`fs` 模块的常用方法包括：

1. **文件读取和写入：**

   - `fs.readFile(path[, options], callback)`：异步地读取文件的内容

     ```js
     let fs = require("fs");
     fs.readFile("1.txt",(err,data)=>{
         if(err){
             return console.log(err);
         }
         console.log(data.toString());
     })
     ```

   - `fs.readFileSync(path[, options])`：同步地读取文件的内容

     ```js
     let fs = require("fs");
     let res = fs.readFileSync("1.txt");
     console.log(res.toString());
     ```

   - `fs.writeFile(file, data[, options], callback)`：异步地写入文件的内容

     ```js
     let fs = require("fs");
     //flag配置  "a":追加写入，"w":写入，"r":读取
     fs.writeFile("2.txt","我是要写入的内容",{flag:"w"},err=>{
         if(err){
             return console.log(err);
         }
         console.log("写入成功");   
     })
     ```

   - `fs.writeFileSync(file, data[, options])`：同步地写入文件的内容

     ```js
     //复制文件：先读取文件再写入文件
     function mycopy(src,dest){
        fs.writeFileSync(dest,fs.readFileSync(src));
     }
     mycopy("1.txt","4.txt");
     ```

2. **可读流和可写流：**

   - `fs.createReadStream(path[, options])`：创建一个可读流，用于从文件中读取数据
   - `fs.createWriteStream(path[, options])`：创建一个可写流，用于向文件中写入数据

3. **文件操作：**

   - `fs.unlink(path, callback)`：异步地删除文件

     接受两个参数：

     - `path`：表示要删除的文件的路径
     - `callback`：是一个可选参数，用于在文件删除完成后执行的回调函数；回调函数通常使用错误对象作为第一个参数，如果文件删除成功，则错误对象为 `null` 或 `undefined`

     ```js
     const fs = require('fs');
     
     fs.unlink(path, (err) => {
       if (err) {
         // 处理错误
         console.error('Error while deleting file:', err);
       } else {
         console.log('File deleted successfully');
       }
     });
     ```

     <!--执行 `fs.unlink` 将永久性地删除指定路径的文件-->

   - ```js
     fs.unlink("2.txt",err=>{
       if(err){
           return console.log(err);
       }
       console.log("删除成功");
     })
     ```

   - `fs.unlinkSync(path)`：同步地删除文件

   - `fs.rename(oldPath, newPath, callback)`：异步地重命名或移动文件

     ```js
     fs.rename("1.txt","5.txt",function (err) {
         if(err){
             console.log(err);
         }else{
             console.log("修改成功");
         }
     });
     ```

   - `fs.renameSync(oldPath, newPath)`：同步地重命名或移动文件

   - `fs.stat(path, callback)`：异步地获取文件信息（例如大小、修改日期等）

   - `fs.statSync(path)`：同步地获取文件信息

4. **目录操作：**

   - `fs.mkdir(path[, options], callback)`：异步地创建目录
   - `fs.mkdirSync(path[, options])`：同步地创建目录
   - `fs.readdir(path[, options], callback)`：异步地读取目录内容
   - `fs.readdirSync(path[, options])`：同步地读取目录内容
   - `fs.rmdir(path, callback)`：异步地删除目录
   - `fs.rmdirSync(path)`：同步地删除目录

5. **其他操作：**

   - `fs.exists(path, callback)`：检查文件或目录是否存在（不推荐使用，建议使用 `fs.access`）

     ```js
     fs.exists("4.txt",function (exists) {
         console.log(exists);
     })
     ```

   - `fs.access(path, mode, callback)`：检查文件或目录是否可访问

   - `fs.accessSync(path, mode)`：同步地检查文件或目录是否可访问

   - `fs.watchFile(filename[, options], listener)`：监视文件的变化

   - `fs.unwatchFile(filename[, listener])`：停止监视文件的变化

⚠️需要注意的是，`fs` 模块中的==绝大多数方法都有**异步**和**同步**两种版本==，==**异步方法使用回调函数来处理结果**==，==**而同步方法直接返回结果**==；通常建议使用异步方法，以避免阻塞主线程。

此外，`fs` 模块的方法通常需要传递文件路径或文件描述符作为参数。在使用这些方法时，务必小心处理错误，尤其是在文件系统操作中，因为错误可能导致文件丢失或数据损坏；使用错误处理回调或 `try...catch` 块来处理潜在的异常情况是一个很好的实践

### 二、文件读取写入与可读流可写流

读取和写入==整个文件==的方法`fs.readFile` 和 `fs.writeFile` 与创建可读流和可写流的方法`fs.createReadStream` 和 `fs.createWriteStream`都可以进行文件的读写操作，它们的区别如下👇：

- **fs.readFile 和 fs.writeFile：**

  - `fs.readFile(path[, options], callback)`：**用于异步读取整个文件的内容并将其返回**

    <!--适用于小型文件，因为它将整个文件加载到内存中，并在读取完成后通过回调函数返回文件内容-->

  - `fs.writeFile(file, data[, options], callback)`：**用于异步地将数据写入文件**

    <!--适用于小型文件，因为它将整个数据写入文件。如果文件已经存在，会覆盖文件内容-->

- **fs.createReadStream 和 fs.createWriteStream：**

  - `fs.createReadStream(path[, options])`：**创建一个可读流，用于从文件中读取数据**

    <!--适用于大型文件，因为它以块的形式读取数据，节省内存，适合处理大型文件-->

  - `fs.createWriteStream(path[, options])`：**创建一个可写流，用于向文件中写入数据**

    <!--适用于大型文件，因为它以块的形式写入数据，节省内存，适合处理大型文件-->

**可读/写流的特点：**

- **大文件读取/写入：** 当需要读取/写入大型文件时，使用可读流/可写流能够分块读取/写入文件内容，==避免将整个文件加载到内存中，从而节省内存资源==

- **高效性：** 由于可读/可写流以块的形式读取文件内容，能够更加高效地处理大型文件，尤其在网络传输或处理日志等场景下表现优秀

- **流式处理：** 可读/可写流可以与其他流（如`pipe`）配合使用，实现流式数据处理，使代码更易于理解和维护

- **异步处理：** 可读/可写流是基于事件的异步模式，可以利用回调或async/await 风格来处理读取的数据

  基本用法如下👇：

  ```js
  const fs = require('fs');
  
  // 输入文件路径
  const inputFilePath = 'input.txt';
  
  // 输出文件路径
  const outputFilePath = 'output.txt';
  
  // 创建可读流
  const readableStream = fs.createReadStream(inputFilePath);
  
  // 创建可写流
  const writableStream = fs.createWriteStream(outputFilePath);
  
  // 将读取到的数据块写入到输出文件
  readableStream.on('data', (chunk) => {
    writableStream.write(chunk);
  });
  
  // 当可读流结束时，关闭可写流
  readableStream.on('end', () => {
    writableStream.end();
  });
  
  // 处理错误
  readableStream.on('error', (err) => {
    console.error('Error while reading file:', err);
  });
  
  writableStream.on('error', (err) => {
    console.error('Error while writing file:', err);
  });
  ```

  或者👇

  ```js
  const fs = require('fs');
  
  // 异步函数，用于读取大型文件
  async function processLargeFile(filePath) {
    const readableStream = fs.createReadStream(filePath);
  
    // 使用 Buffer 临时存储数据
    const chunks = [];
    let totalSize = 0;
  
    // 使用 Promise 来等待数据读取完成
    await new Promise((resolve, reject) => {
      readableStream.on('data', (chunk) => {
        chunks.push(chunk);
        totalSize += chunk.length;
      });
  
      readableStream.on('end', () => {
        resolve(); // 数据读取完成时，解析 Promise
      });
  
      readableStream.on('error', (err) => {
        reject(err); // 处理错误时，拒绝 Promise
      });
    });
  
    // 将所有数据块拼接成一个完整的 Buffer
    const fileContentBuffer = Buffer.concat(chunks, totalSize);
  
    // 在此处可进行对文件内容的后续处理
    console.log(fileContentBuffer.toString());
    return fileContentBuffer;
  }
  
  // 使用 async/await 调用 processLargeFile
  (async () => {
    try {
      const filePath = 'largeFile.txt';
      const fileContentBuffer = await processLargeFile(filePath);
      // 可以继续在此处进行对 fileContentBuffer 的处理
    } catch (err) {
      console.error('Error while processing large file:', err);
    }
  })();
  ```

  

