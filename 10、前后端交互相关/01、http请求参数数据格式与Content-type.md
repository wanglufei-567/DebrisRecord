# http请求参数数据格式与Content-type

### 简介

前后端交互中，**http** 请求参数主要分为三种 `Query String Parameters`、`Form Data`、 `Request Payload` 

-  `Query String Parameters` 位于请求头中，拼接在`url?`后面，在`url`中可以直接看到入参
- `Form Data`、 `Request Payload` 位于==请求体==中，数据格式与请求头字段 `Content-type`有关

<!--Form Data、 Request Payload两种格式的数据都是在message-body中，只是chrome浏览器的开发者工具会根据ContentType区分显示方式-->

### 一、Query String Parameters

数据格式： `?key=value&key=value`

参数会以 url string 的形式进行传递，即?后的字符串则为其请求参数，并以&作为分隔符。常用在 GET 请求方式时使用。 其他请求方式也可以使用，拼接在接口地址 `url?` 后面。

```http
http://localhost:3000/post?name=123
```

### 二、Form Data

数据格式：`key=value&key=value`

当 `Content-type` 为 `application/x-www-form-urlencoded;charset=utf-8` 时，参数会以 `Form Data` 的形式(键值对格式)传递给接口，并且不会显示在接口 url 上

```js
let data = {
    name: '123',
    val: '456',
}
console.log(QS.stringify(data)
// namewa=123&val=456
xhr.send(QS.stringify(data));
```

![字符串提交场景](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/bVbqWfA.png)

对表单提交和文件上传时要做特殊处理，需要使用 `new FormData()` 方法处理后传递给接口，`Content-type` 为 `multipart/form-data; boundary=[xxx]` 格式

```js
const formData = new FormData();
formData.append('label', 'ID_photo-front');
formData.append('subId', 'fa6abb94000a4ba1b19a43e60eba1516');
formData.append('file', fileList[0]);

fetch('http://192.168.1.128:5022/tool/file/upload', {
    method: 'POST',
    headers: {
        'Authorization': '89199cf3294520765904d47c2c570c1b',
    },
    body: formData,
    cridentials: 'include',
    mode: 'no-cors',
    processData: false,
    cache: false,
    contentType: false,
});
```

**POST**请求时，请求体中会包含提交数据，服务端会根据请求头字段**Content-Type**来决定如何解析请求体中的提交数据

- 表单提交：
   - 当提交一个表单时，数据通常以键值对（`key1=value1&key2=value2`）的方式发送且**Content-Type**为`application/x-www-form-urlencoded`
   - 服务端收到请求之后，会根据**Content-Type** 对请求体中的数据按照键值对的形式进行解析
   - ==这种方式适用于文本类型的数据，但不适合传输二进制数据（如文件）==
- 文件上传：
   - 文件上传通常需要特殊处理，因为文件数据是二进制的，不能以普通的名值对方式进行传输
   - 文件上传时 **Content-Type** 通常为 `multipart/form-data`
   - 服务端收到请求之后，会根据 **Content-Type** 对请求体中的数据进行更复杂的处理，因为提交数据包含了二进制文件数据和其他可能的表单数据，服务端需要正确地解析这些数据，并将文件数据存储在适当的位置
   - ==这种方式允许将表单数据作为二进制数据流进行传输，这对于大文件或二进制数据的上传非常有用==

**JS** 的 **FormData API** 和 **HTML** 原生 `<form>` 创建的 **formData** 对象作为**请求 body** 时，请求头 `content-type` 的差异：

- **JS FormData API**：固定使用 `multipart/form-data`，浏览器会自动处理 `boundary`
  - 不要手动设置 `Content-Type`，会丢失`boundary`信息
- **HTML 原生 `<form>`**：默认是 `application/x-www-form-urlencoded`
  - 若需上传文件，**必须**显式添加 `enctype="multipart/form-data"` 属性

### 三、Request Payload

数据格式：`{key: value, key: value}`

当 `Content-type` 为 `application/json;charset=utf-8` 时，参数会以 `Request Payload` 的形式 (数据为 json 格式) 传递给接口，并且不会显示在接口 url 上。

```js
let data = {
    name: '123',
    val: '456',
}
xhr.send(JSON.stringify(data));
```

![对象提交场景](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/bVbqWfB.png)

### 四、Content-Type的差异

- 传统的**ajax**请求时候，`Content-Type`默认为`text/plain;charset=UTF-8`类型

  ```js
  var xhr = new XMLHttpRequest();
  xhr.timeout = 3000;
  var obj = {a: 1, b: 2};
  xhr.open('POST', '/');
  xhr.send(obj);
  ```

  ![传统ajax提交](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/bVbqWfp.png)

- 传统的**form**提交的时候，`Content-Type`默认为`application/x-www-form-urlencoded;charset=utf-8`类型

  ```html
  <form action="/" method="POST">
      <input name="name" type="text">
      <input name="password" type="text">
      <button>提交</button>
  </form>
  ```

  ![clipboard.png](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/bVbqWeV.png)

- **axios**传递`key=value&key=value`格式数据的时候，`Content-Type`默认为`application/x-www-form-urlencoded;charset=utf-8`类型

  ```js
  var sence1 = 'name=123&val=456';
  axios.post('/', sence1)
  ```

  ![字符串提交场景](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/bVbqWfA-20220517085949095.png)

- **axios**传递`{key: value, key: value}`格式数据的时候，`Content-Type`默认为 `application/json;charset=utf-8`类型

  ```js
  var sence2 = {name: 123, val: 456};
  axios.post('/', sence2)
  ```

  ![对象提交场景](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/bVbqWfB-20220517085954238.png)

### 五、请求头字段 Content-Type

#### 4.1、Content-Type 在 http中的定义

 **HTTP ** 请求中的 **Content-Type** 是用来==**指定请求或者响应的内容类型**==，也叫做**MIME**类型（**Multipurpose Internet Mail Extensions** 互联网媒体类型）

**Content-Type ** 字段是用来告诉交互双方应该如何处理数据，比如服务器响应时将 **Content-Type** 的值设置为 **text/html**，那么浏览器便会将此内容识别为 **html** 类型的内容，之后就可以解析为网页了

<!--简而言之，Content-Type就是HTTP协议中用来规定一些文件类型的，传输过程中根据设置好的Content-Type就可以知道要处理的内容是什么类型-->

#### 4.2、Content-Type语法结构

```http
Content-Type: text/html; charset=utf-8
Content-Type: multipart/form-data; boundary=something
```

<!--原生 ajax 请求默认 Content-Type: text/plain;charset=UTF-8-->

可以看出来语法结构为：`type/subtype(;parameter=value)` 

- **type 主类型**：**MIME** 中规定的任意标识符
  - **独立类型**：表示只有一个单独的文件或者媒体的类型
    - **Text**：文本信息

    - **Application**：用于传输应用程序数据或者二进制数据，例如：
      - `application/octet-stream`：二进制流数据
      - `application/pdf`
      - `application/zip`
    - **Image**：图像或图形数据，例如：
      - `image/gif`
      -  `image/png`
      - `image/jpeg`

    - **Audio**：用于传输音频或者音声数据，例如：
      - `audio/mpeg`
      -  `audio/vorbis`

    - **Video**：用于传输动态影像数据，可以是与音频编辑在一起的视频数据格式，例如：
      - `video/mp4`

  - **Multipart类型**：表示此内容由多个部分组成的，且经常有不同的 **MIME** 类型
    - **Multipart**：由多个不同 **MIME** 类型内容组成的数据，例如：
      -  `multipart/form-data`：由多种内容类型进行传输，可能既包括多媒体内容，又包括数据内容

    - **Message**：一个包括多种内容类型的消息，常用于下面的场景，例如：
      - `message/rfc822` 或`message/partial`：表示一个邮件包含转发信息或者在多种信息，允许以`chunk`的形式发送数据量很大的信息，一般用于包装一个E-mail消息

- **subtype 子类型**：**MIME** 中规定的任意标识符，`subtype` 是 `type` 的详细信息，例如：
  -  `text/plain` 中 `text` 指文本，`plain` 对 `text` 进一步限制，指纯文本
- **parameter** (可选)，一些参数，如`Accept`请求头的参数， `Content-Type`的 `charse`t参数等
  - `charset`：是指定字符编码的标准，常见的有`ISO-8859-1`、`UTF-8`、`GB2312`、`ASCII`等
  - `boundary`：多用于上传文件时使用，用于分割数据

#### 4.3、常见的媒体格式

- **application/x-www-form-urlencoded**

  - 浏览器的原生 `<form>` 表单，如果不设置 `enctype` 属性，那么最终就会以 `application/x-www-form-urlencoded` 方式提交数据

    ```html
    <form action="http://homeway.me/post.php" method="POST">
        <input type="text" name="name" value="homeway">
        <input type="text" name="key" value="nokey">
        <input type="submit" value="submit">
    </form>
    ```


- **multipart/form-data**

  - 使用表单上传文件时（`type=file`），必须让 `form` 的 `enctype` 等于这个值

    ```html
    <form action="/" method="post" enctype="multipart/form-data">
      <input type="file" name="file1" value="some text">
      <input type="file" name="file2">
      <button type="submit">Submit</button>
    </form>
    ```

- **application/json**

  -  **JSON** 格式请求内容或响应内容

    ```http
    POST [http://www.example.com](http://www.example.com) HTTP/1.1 
    Content-Type: application/json;charset=utf-8 
    
    // body 
    {"title":"test","sub":[1,2,3]}
    ```


### 六、参考链接

[MDN Content-Type](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Type)

[HTTP 请求参数之三种格式](https://juejin.cn/post/6844903960675876877)

[HTTP协议中的Content-Type](http://m.w3capi.com/m_doc/chapter/id/3.html)

[理解HTTP之 content-type](https://juejin.cn/post/6844903815737524237)

[前后端联调之Form Data与Request Payload，你真的了解吗？](https://segmentfault.com/a/1190000018774494)

