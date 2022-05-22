## XMLHttpRequst使用记录

### 前言

`XMLHttpRequest`（XHR） 是一个内建的浏览器对象，它允许使用 JavaScript 发送 HTTP 请求。通过 XMLHttpRequest 可以在不刷新页面的情况下请求特定 URL，获取数据。这允许网页在不影响用户操作的情况下，更新页面的局部内容。

### 一、XHR基础

#### 1.1、发送一个请求

使用`XHR`发送一个请求，最简单只需要三个步骤

1、创建 `XMLHttpRequest`对象：

```js
const xhr = new XMLHttpRequest();
```

2、调用`open()`配置请求

```js
xhr.open(method, URL, [async, user, password])
```

此方法指定请求的主要参数：

- `method` —— HTTP 方法，通常是 `"GET"` 或 `"POST"`
- `URL` —— 要请求的 URL，通常是一个字符串，也可以是 [URL](https://zh.javascript.info/url) 对象
- `async` —— 一个可选的布尔参数，表示是否异步执行操作，默认为`true`。如果值为`false`，`send()`方法直到收到答复前不会返回。如果`true`，已完成事务的通知可供事件监听器使用
- `user`—— 可选的用户名用于认证用途；默认为`null`。
- `password` ——可选的密码用于认证用途，默认为`null`。

注意，`open` 调用与其名称相反，不会建立连接；它仅配置请求，而网络活动仅以 `send` 调用开启

3、发送请求

```js
xhr.send([body])
```

这个方法会建立连接，并将请求发送到服务器。如果是异步请求（默认为异步请求），则此方法会在请求发送后立即返回；如果是同步请求，则此方法直到响应到达后才会返回。可选参数 `body` 包含了 request body。如果请求方法是 GET 或者 HEAD，则请求主体应设置为 null。

#### 1.2、 `XHR` 相关属性

##### 1.2.1、`readyState`

返回一个 XMLHttpRequest 实例对象当前所处的状态。一个 XHR 代理总是处于下列状态中的一个：

| 值   | 状态               | 描述                                              |
| ---- | ------------------ | ------------------------------------------------- |
| `0`  | `UNSENT`           | 代理被创建，但尚未调用 open() 方法                |
| `1`  | `OPENED`           | `open()` 方法已经被调用                           |
| `2`  | `HEADERS_RECEIVED` | `send()` 方法已经被调用，并且头部和状态已经可获得 |
| `3`  | `LOADING`          | 下载中； `responseText` 属性已经包含部分数据      |
| `4`  | `DONE`             | 下载操作已完成                                    |

```js
var xhr = new XMLHttpRequest();
console.log('UNSENT', xhr.readyState); // readyState 为 0

xhr.open('GET', '/api', true);
console.log('OPENED', xhr.readyState); // readyState 为 1

xhr.onprogress = function () {
    console.log('LOADING', xhr.readyState); // readyState 为 3
};

xhr.onload = function () {
    console.log('DONE', xhr.readyState); // readyState 为 4
};

xhr.send(null);

```

##### 1.2.2、`status`

HTTP 状态码（一个数字）：`200`，`404`，`403` 等，如果出现非 HTTP 错误，则为 `0`。

```js
var xhr = new XMLHttpRequest();
console.log('UNSENT', xhr.status);

xhr.open('GET', '/server', true);
console.log('OPENED', xhr.status);

xhr.onprogress = function () {
  console.log('LOADING', xhr.status);
};

xhr.onload = function () {
  console.log('DONE', xhr.status);
};

xhr.send(null);

/**
 * 输出如下：
 *
 * UNSENT（未发送） 0
 * OPENED（已打开） 0
 * LOADING（载入中） 200
 * DONE（完成） 200
 */
```

##### 1.2.3、`statusText`

HTTP 状态消息（一个字符串）：状态码为 `200` 对应于 `OK`，`404` 对应于 `Not Found`，`403` 对应于 `Forbidden`

```js
var xhr = new XMLHttpRequest();
console.log('0 UNSENT', xhr.statusText);

xhr.open('GET', '/server', true);
console.log('1 OPENED', xhr.statusText);

xhr.onprogress = function () {
  console.log('3 LOADING', xhr.statusText);
};

xhr.onload = function () {
  console.log('4 DONE', xhr.statusText);
};

xhr.send(null);

/**
 * 输出如下:
 *
 * 0 UNSENT
 * 1 OPENED
 * 3 LOADING OK
 * 4 DONE OK
 */
```

##### 1.2.4、`response`

响应的正文。返回的类型为`ArrayBuffer` 、`Blob` 、`Document`、 JavaScript `Object`或`DOMString`中的一个。 这取决于 [`responseType`](https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/responseType) 属性。

##### 1.2.5、`responseType`

`XMLHttpRequest` 属性 **`responseType`** 是一个枚举字符串值，用于指定响应格式

- `""`（默认）—— 响应格式为字符串，
- `"text"` —— 响应格式为字符串，
- `"arraybuffer"` —— 响应格式为 `ArrayBuffer`（对于二进制数据，请参见 [ArrayBuffer，二进制数组](https://zh.javascript.info/arraybuffer-binary-arrays)），
- `"blob"` —— 响应格式为 `Blob`（对于二进制数据，请参见 [Blob](https://zh.javascript.info/blob)），
- `"document"` —— 响应格式为 XML document（可以使用 XPath 和其他 XML 方法）或 HTML document（基于接收数据的 MIME 类型）
- `"json"` —— 响应格式为 JSON（自动解析）。

例如，我们以 JSON 格式获取响应：

```js
let xhr = new XMLHttpRequest();

xhr.open('GET', '/article/xmlhttprequest/example/json');

xhr.responseType = 'json';

xhr.send();

// 响应为 {"message": "Hello, world!"}
xhr.onload = function() {
  let responseObj = xhr.response;
  alert(responseObj.message); // Hello, world!
};
```

##### 1.2.6、`timeout`

用于指定指定超时时间

```js
xhr.timeout = 10000; // timeout 单位是 ms，此处即 10 秒
```

如果在给定时间内请求没有成功执行，请求就会被取消，并且触发 `timeout` 事件

##### 1.2.7、`withCredentials`

`withCredentials`  属性是一个`Boolean`类型，它指示了是否该使用类似cookies,authorization headers(头部授权)或者TLS客户端证书这一类资格证书来创建一个跨站点访问控制（cross-site `Access-Control`）请求

在发同域请求时，浏览器会将`cookie`自动加在`request header`中。但在发送跨域请求时，`cookie`不会自动加在`request header`中

造成这个问题的原因是：在`CORS`标准中做了规定，默认情况下，浏览器在发送跨域请求时，不能发送任何认证信息（`credentials`）如"`cookies`"和"`HTTP authentication schemes`"。除非`xhr.withCredentials`为`true`（`xhr`对象有一个属性叫`withCredentials`，默认值为`false`）。

根本原因是`cookies`也是一种认证信息，在跨域请求中，`client`端必须手动设置`xhr.withCredentials=true`，且`server`端也必须允许`request`能携带认证信息（即`response header`中包含`Access-Control-Allow-Credentials:true`），这样浏览器才会自动将`cookie`加在`request header`中。

另外，要特别注意一点，一旦跨域`request`能够携带认证信息，`server`端一定不能将`Access-Control-Allow-Origin`设置为`*`，而必须设置为请求页面的域名。

#### 1.3、 `XHR` 相关方法

##### 1.3.1、`setRequestHeader`

```js
setRequestHeader(name, value)
```

设置HTTP请求的头部。此方法必须在  [`open()`](https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/open) 方法和 [`send()`](https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/send)  之间调用。

**注意点**：

- 方法的第一个参数 header 大小写不敏感，即可以写成`content-type`，也可以写成`Content-Type`，甚至写成`content-Type`;
- `Content-Type`的默认值与具体发送的数据类型有关，请参考本文【可以发送什么类型的数据】一节；
- `setRequestHeader`必须在`open()`方法之后，`send()`方法之前调用，否则会抛错；
- `setRequestHeader`可以调用多次，最终的值不会采用覆盖`override`的方式，而是采用追加`append`的方式。下面是一个示例代码：

```js
var client = new XMLHttpRequest();
client.open('GET', 'demo.cgi');
client.setRequestHeader('X-Test', 'one');
client.setRequestHeader('X-Test', 'two');
// 最终request header中"X-Test"为: one, two
client.send();
```

##### 1.3.2、`getResponseHeader`

获取具有给定 `name` 的 header（`Set-Cookie` 和 `Set-Cookie2` 除外）

例如

```js
xhr.getResponseHeader('Content-Type')
```

##### 1.3.3、`getAllResponseHeaders`

返回除 `Set-Cookie` 和 `Set-Cookie2` 外的所有 response header。

header 以单行形式返回，例如：

```js
Cache-Control: max-age=31536000
Content-Length: 4260
Content-Type: image/png
Date: Sat, 08 Sep 2012 16:53:16 GMT
```

header 之间的换行符始终为 `"\r\n"`（不依赖于操作系统），所以我们可以很容易地将其拆分为单独的 header。name 和 value 之间总是以冒号后跟一个空格 `": "` 分隔。这是标准格式。

因此，如果我们想要获取具有 name/value 对的对象，则需要用一点 JavaScript 代码来处理它们。

像这样（假设如果两个 header 具有相同的名称，那么后者就会覆盖前者）：

```js
let headers = xhr
  .getAllResponseHeaders()
  .split('\r\n')
  .reduce((result, current) => {
    let [name, value] = current.split(': ');
    result[name] = value;
    return result;
  }, {});

// headers['Content-Type'] = 'image/png'
```

##### 1.3.4、`send`

发送 HTTP 请求。如果是异步请求（默认为异步请求），则此方法会在请求发送后立即返回；如果是同步请求，则此方法直到响应到达后才会返回

`xhr.send(data)`的参数data可以是以下几种类型：

- `ArrayBuffer`
- `Blob`
- `Document`
- `DOMString`
- `FormData`
- `null`

如果是 GET/HEAD请求，`send()`方法一般不传参或传 `null`。不过即使传入了参数，参数也最终被忽略，`xhr.send(data)`中的data会被置为 `null`

`xhr.send(data)`中data参数的数据类型会影响请求头部`content-type`的默认值：

- 如果`data`是 `Document` 类型，同时也是`HTML Document`类型，则`content-type`默认值为`text/html;charset=UTF-8`;否则为`application/xml;charset=UTF-8`；
- 如果`data`是 `DOMString` 类型，`content-type`默认值为`text/plain;charset=UTF-8`；
- 如果`data`是 `FormData` 类型，`content-type`默认值为`multipart/form-data; boundary=[xxx]`
- 如果`data`是其他类型，则不会设置`content-type`的默认值

当然这些只是`content-type`的默认值，但如果用`xhr.setRequestHeader()`手动设置了中`content-type`的值，以上默认值就会被覆盖

##### 1.3.5、`abort`

终止请求并触发 `abort` 事件，且 `xhr.status` 变为 `0`

```js
xhr.abort(); // 终止请求
```

#### 1.4、 `XHR` 相关事件

##### 1.3.1、常用的三个事件

下面这三个`XHR`事件是最常用的：

- `load` —— 当请求完成（即使 HTTP 状态为 400 或 500 等），并且响应已完全下载时触发
- `error` —— 当无法发出请求时触发，例如网络中断或者无效的 URL。
- `progress` —— 在下载响应期间定期触发，报告已经下载了多少。

```js
xhr.onload = function() {
  alert(`Loaded: ${xhr.status} ${xhr.response}`);
};

xhr.onerror = function() { // 仅在根本无法发出请求时触发
  alert(`Network Error`);
};

xhr.onprogress = function(event) { // 定期触发
  // event.loaded —— 已经下载了多少字节
  // event.lengthComputable = true，当服务器发送了 Content-Length header 时
  // event.total —— 总字节数（如果 lengthComputable 为 true）
  alert(`Received ${event.loaded} of ${event.total}`);
};
```

##### 1.3.2、`timeout`

当请求超时时会触发**timeout** 事件

```js
var client = new XMLHttpRequest()
  client.open("GET", "http://www.example.org/example.txt")
  client.ontimeout = function(e) {
    console.error("Timeout!!")
  }
  client.send()
```

### 参考

[MDN XMLHttpRequest](https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest#%E5%B1%9E%E6%80%A7)

[XMLHttpRequest 详解](https://blog.csdn.net/z550449054/article/details/80538623)

[现代 JavaScript 教程 XMLHttpRequest](https://zh.javascript.info/xmlhttprequest#zhong-zhi-qing-qiu-aborting)

