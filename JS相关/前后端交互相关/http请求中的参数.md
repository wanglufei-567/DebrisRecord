# http请求参数之Query String Parameters、Form Data、Request Payload

前后端交互中，http请求参数主要分为三种 `Query String Parameters`、`Form Data`、 `Request Payload` 。其中 `Query String Parameters`位于请求头中，拼接在`url?`后面，在`url`中可以直接看到入参；`Form Data`、 `Request Payload` 位于请求体中，数据格式有请求头字段 `Content-type`有关。



### 简介

#### 请求头字段 Content-Type

**Content-Type: [media-type];[charset];boundary**

原生 ajax 请求默认 `Content-Type: text/plain;charset=UTF-8`

常见的媒体格式：

| 媒体格式                          | 描述                                                         |
| --------------------------------- | ------------------------------------------------------------ |
| text/html                         | HTML格式                                                     |
| text/plain                        | 纯文本格式，不包含任何控件或格式字符                         |
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
| application/x-www-form-urlencoded | 默认的encType，form 表单数据被编码为 key/value 格式发送到服务器（表单默认的提交数据的格式）。数据被编码为名称/值对。这是标准的编码格式。 |
| multipart/form-data               | 数据被编码为一条消息，页上的每个控件对应消息中的一个部分，用在上传文件: Content-Type: multipart/form-data; boundary=----WebKitFormBoundarys9jOoKcA1Kwn9sYS |

#### 一、Query String Parameters

数据格式： `?key=value&key=value`

参数会以 url string 的形式进行传递，即?后的字符串则为其请求参数，并以&作为分隔符。常用在 GET 请求方式时使用。 其他请求方式也可以使用，拼接在接口地址 `url?` 后面。

```http
http://localhost:3000/post?name=123
```

### 二、Form Data

数据格式：`key=value&key=value`

当 `Content-type` 为 `application/x-www-form-urlencoded;charset=utf-8` 时，参数会以 `Form Data` 的形式(数据为 String 键值对格式)传递给接口，并且不会显示在接口 url 上。

### 三、Request Payload

数据格式：`{key: value, key: value}`

当 `Content-type` 为 `application/json;charset=utf-8` 时，参数会以 `Request Payload` 的形式(数据为 json 格式)传递给接口，并且不会显示在接口 url 上。

`Request Payload`更准确的说是`http request的payload body`。一般用在数据通过`POST`请求或者`PUT`请求。它是`HTTP`请求中*空行*的后面那部分。（PS:这里涉及一个http常被问到的问题，http请求由哪几部分组成，一般是请求行，请求头，空行，请求体。payload body应该是对应请求体。）



### 四、Content-Type的差异

1.传统的ajax请求时候，`Content-Type`默认为"文本"类型。
2.传统的form提交的时候，`Content-Type`默认为"Form"类型。
3.axios传递字符串的时候，`Content-Type`默认为"Form"类型。
4.axios传递对象的时候，`Content-Type`默认为"JSON"类型