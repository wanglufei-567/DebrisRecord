# http请求参数数据格式与Content-type

### 简介

前后端交互中，http请求参数主要分为三种 `Query String Parameters`、`Form Data`、 `Request Payload` 。其中 `Query String Parameters`位于请求头中，拼接在`url?`后面，在`url`中可以直接看到入参；`Form Data`、 `Request Payload` 位于==请求体==中，数据格式与请求头字段 `Content-type`有关。

<!--Form Data、 Request Payload两种格式的数据都是在message-body中，只是chrome浏览器的开发者工具会根据ContentType区分显示方式-->

### 一、Query String Parameters

数据格式： `?key=value&key=value`

参数会以 url string 的形式进行传递，即?后的字符串则为其请求参数，并以&作为分隔符。常用在 GET 请求方式时使用。 其他请求方式也可以使用，拼接在接口地址 `url?` 后面。

```http
http://localhost:3000/post?name=123
```

### 二、Form Data

数据格式：`key=value&key=value`

当 `Content-type` 为 `application/x-www-form-urlencoded;charset=utf-8` 时，参数会以 `Form Data` 的形式(数据为 String 键值对格式)传递给接口，并且不会显示在接口 url 上。

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

对表单提交和文件上传时要做特殊处理，需要使用 `new FormData()` 方法处理后传递给接口，`Content-type` 为 `multipart/form-data; boundary=[xxx]` 格式。

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

- 补充说明
  1. 服务器为什么会对表单提交和文件上传做特殊处理，因为表单提交数据是名值对的方式，且
  
     `Content-Type为application/x-www-form-urlencoded`,而文件上传服务器需要特殊处理，普通的
  
     `post`请求（`Content-Type`不是`application/x-www-form-urlencoded`）数据格式不固定，不一定是
  
     名值对的方式，所以服务器无法知道具体的处理方式，所以只能通过获取原始数据流的方式来进行解析。
  
  2. processData: false --> 因为 data 值是 `formdata` 对象，不需要对数据做处理。
  
  3. cache: false --> 上传文件不需要缓存。
  
  4. contentType: false --> 因为是由 `<form>` 表单构造的 `FormData` 对象，且已经声明了属性 `enctype="multipart/form-data"`，所以这里设置为 false。
  
  5. xhrFields: { withCredentials: true }, 跨域请求设置

### 三、Request Payload

数据格式：`{key: value, key: value}`

当 `Content-type` 为 `application/json;charset=utf-8` 时，参数会以 `Request Payload` 的形式(数据为 json 格式)传递给接口，并且不会显示在接口 url 上。

```js
let data = {
    name: '123',
    val: '456',
}
xhr.send(JSON.stringify(data));
```

![对象提交场景](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/bVbqWfB.png)

### 四、Content-Type的差异

- 传统的ajax请求时候，`Content-Type`默认为`text/plain;charset=UTF-8`类型

  ```js
  var xhr = new XMLHttpRequest();
  xhr.timeout = 3000;
  var obj = {a: 1, b: 2};
  xhr.open('POST', '/');
  xhr.send(obj);
  ```

  ![传统ajax提交](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/bVbqWfp.png)

- 传统的form提交的时候，`Content-Type`默认为`application/x-www-form-urlencoded;charset=utf-8`类型

  ```html
  <form action="/" method="POST">
      <input name="name" type="text">
      <input name="password" type="text">
      <button>提交</button>
  </form>
  ```

  ![clipboard.png](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/bVbqWeV.png)

- axios传递`key=value&key=value`格式数据的时候，`Content-Type`默认为`application/x-www-form-urlencoded;charset=utf-8`类型

  ```js
  var sence1 = 'name=123&val=456';
  axios.post('/', sence1)
  ```

  ![字符串提交场景](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/bVbqWfA-20220517085949095.png)

- axios传递`{key: value, key: value}`格式数据的时候，`Content-Type`默认为 `application/json;charset=utf-8`类型

  ```js
  var sence2 = {name: 123, val: 456};
  axios.post('/', sence2)
  ```

  ![对象提交场景](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/bVbqWfB-20220517085954238.png)

### 五、请求头字段 Content-Type

#### 4.1、Content-Type在http中的定义

 **HTTP**请求中的**Content-Type**是用来指定请求或者响应的内容类型，也叫做**MIME**类型（Multipurpose Internet Mail Extensions 互联网媒体类型）

**Content-Type**字段是用来告诉浏览器或者相关客户端如何显示或处理加载的数据（比如服务器响应时将**Content-Type**的值设置为**text/html**，那么浏览器或者客户端就可以将此内容识别为**html**类型的内容，就可以解析为网页了）

<!--简而言之，Content-Type就是HTTP协议中用来规定一些文件类型的，传输过程中根据设置好的Content-Type就可以知道要处理的内容是什么类型-->

#### 4.2、Content-Type语法结构

```http
Content-Type: text/html; charset=utf-8
Content-Type: multipart/form-data; boundary=something
```

<!--原生 ajax 请求默认 Content-Type: text/plain;charset=UTF-8-->

可以看出来语法结构为：`type/subtype(;parameter=value)` 

- **type 主类型**，MIME中规定的任意标识符，如`text`，如果是*号代表所有

  `type`包括两种类型：**独立类型**和**Multipart类型**

  - 独立类型从名字上可以看出来，只表示了一个单独的文件或者媒体的类型，表示组成内容的形式是独立存在的，比如一个HTML页面，一个视频文件，如下为常用的独立类型：

    - **Text**：用于标准化地表示的文本信息，文本消息可以是多种字符集和或者多种格式的
    - **Application**：用于传输应用程序数据或者二进制数据，例如`application/octet-stream`,`application/pdf`,`application/pkcs8`,`application/zip`
    - **Image**：图像或图形数据，包括位图和矢量图像以及动画图像，例如`image/gif`, `image/png`, `image/jpeg`, `image/bmp`, `image/webp`, `image/x-icon`
    - **Audio**：用于传输音频或者音声数据，例如`audio/mpeg`, `audio/vorbis`
    - **Video**：用于传输动态影像数据，可以是与音频编辑在一起的视频数据格式，例如`video/mp4`

  - `Multipart`类型表示此内容由多个部分组成的，且经常有不同的MIME类型（也就是由多个独立类型的内容组成的）

    也可以用来表示属于相同事物的多个且独立的文件，这些独立的文件构成一个复杂的文档。在电子邮件场景中常见，如下为常用的`Multipart`类型:

    - **Multipart**：用于连接消息体的多个部分构成一个消息，这些部分可以是不同类型的数据，由多个不同MIME类型组件构成的数据，例如 `multipart/form-data`(由多种内容类型进行传输，可能既包括多媒体内容，又包括数据内容)
    - **Message**：一个包括多种内容类型的消息，常用于下面的场景，例如指明一个邮件包含转发信息或者在多种信息的情况下，允许以`chunk`的形式发送数据量很大的信息。包括`message/rfc822`和`message/partial`，一般用于包装一个E-mail消息

    

- **subtype 子类型**，MIME中规定的任意标识符，如html，如果是*号代表所有 

  - `subtype` 是 `type` 的详细信息。例如 `text/plain` 中 `text` 指文本，`plain` 对 `text` 进一步限制，指纯文本

- **parameter** (可选)，一些参数，如`Accept`请求头的参数， `Content-Type`的 `charse`t参数等

  - `charse`t：是指定字符编码的标准，常见的有`ISO-8859-1`、`UTF-8`、`GB2312`、`ASCII`等
  - `boundary`：多用于上传文件时使用，用于分割数据

#### 4.3、常见的媒体格式

**application/x-www-form-urlencoded**

这是最常见的 POST 提交数据的方式了。浏览器的原生 `<form>` 表单，如果不设置 `enctype` 属性，那么最终就会以 `application/x-www-form-urlencoded` 方式提交数据。

比如下面一个简单的表单：

```html
<form action="http://homeway.me/post.php" method="POST">
    <input type="text" name="name" value="homeway">
    <input type="text" name="key" value="nokey">
    <input type="submit" value="submit">
</form>
```

首先，`Content-Type` 被指定为 `application/x-www-form-urlencoded`；其次，提交的数据按照 `key1=val1&key2=val2` 的方式进行编码，`key` 和 `val` 都会进行 URL 转码。

**multipart/form-data**

常见的 POST 数据提交的方式。我们使用表单上传文件时（type=file），必须让 `form` 的 `enctype` 等于这个值。如果上传照片，文件等，由于很多情况下都会有批量上传，为了区分不同的数据，`multipart/form-data`的类型有`boundary`参数进行分割，

```html
<form action="/" method="post" enctype="multipart/form-data">
  <input type="file" name="file1" value="some text">
  <input type="file" name="file2">
  <button type="submit">Submit</button>
</form>
```

```http
------WebKitFormBoundary18bktajg65CSIx4j
Content-Disposition: form-data; name="files"; filename="test1.txt"
Content-Type: text/plain

this is file1;
------WebKitFormBoundary18bktajg65CSIx4j
Content-Disposition: form-data; name="files"; filename="test2.txt"
Content-Type: text/plain

this is file2;
------WebKitFormBoundary18bktajg65CSIx4j--
```

上面请求是上传了两个文件，分别是 `test1.txt` 和`test2.txt`，文件内容分别是“this is file1;” 和 “this is file2;” 可以看到两个文件由于是文本，`Content-Type` 为 `text/plain`，`Content-Disposition` 中包含 `name` 和 `filename` 属性，`name` 是 `form` 表单提交内容里的 `name` 属性，文件之间有 `------WebKitFormBoundary18bktajg65CSIx4j` 这样一串字符隔开，这串字符就是 `boundary` 分割符，字符串随机生成不会与文本内容重复。

**application/json**

application/json 是 POST 请求以 JSON 的格式向服务请求发起请求或者请求返回 JSON 格式的响应内容，服务端接收到数据后对 JSON 进行解析拿到所需要的参数。这也是现在用的比较多的一种形式。

```http
POST [http://www.example.com](http://www.example.com) HTTP/1.1 
Content-Type: application/json;charset=utf-8 

// body 
{"title":"test","sub":[1,2,3]}
```

**其他媒体格式**

| 媒体格式                          | 描述                                                         |
| --------------------------------- | ------------------------------------------------------------ |
| text/html                         | HTML格式                                                     |
| text/plain                        | 纯文本格式，不包含任何控件或格式字符（空格转换为 `"+"` 加号，但不对特殊字符编码） |
| text/xml                          | XML格式                                                      |
| image/gif                         | gif图片格式                                                  |
| image/jpeg                        | jpg图片格式                                                  |
| image/png                         | png图片格式                                                  |
| application/xhtml+xml             | XHTML格式                                                    |
| application/xml                   | XML数据格式                                                  |
| application/atom+xml              | Atom XML聚合格式                                             |
| application/json                  | JSON数据格式                                                 |
| application/pdf                   | pdf格式                                                      |
| application/msword                | Word文档格式                                                 |
| application/octet-stream          | 二进制流数据（如常见的文件下载）                             |
| application/x-www-form-urlencoded | 默认的`encType`，`form` 表单数据被==编码为 `key/value`== 格式发送到服务器（表单==默认==的提交数据的格式）数据被编码为名称/值对（一些特殊字符会被编码成转义字符，比如`+`会被转义成`%2B`）这是标准的编码格式 |
| multipart/form-data               | 数据被编码为一条消息，页上的每个控件对应消息中的一个部分，用在上传文件: Content-Type: multipart/form-data; boundary=----WebKitFormBoundarys9jOoKcA1Kwn9sYS |

### 六、参考链接

[MDN Content-Type](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Type)

[HTTP 请求参数之三种格式](https://juejin.cn/post/6844903960675876877)

[HTTP协议中的Content-Type](http://m.w3capi.com/m_doc/chapter/id/3.html)

[理解HTTP之 content-type](https://juejin.cn/post/6844903815737524237)

[前后端联调之Form Data与Request Payload，你真的了解吗？](https://segmentfault.com/a/1190000018774494)

