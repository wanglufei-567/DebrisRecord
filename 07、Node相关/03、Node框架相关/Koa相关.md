## Koa学习笔记

### 前言

Koa是一款轻量级Node 的web开发框架，Koa不在内核方法中绑定任何中间件， 它仅仅提供了一个轻量优雅的函数库，本身代码只有1000多行，所有功能都通过插件实现，并且利用 async 函数避免回调地狱。

### 一、基础使用

#### 1.1、搭建一个服务器

```js
const Koa = require('koa');

const app = new Koa();

app.use(async ctx => {
  ctx.body = 'Hello World';
});

app.listen(4000);

```

就是这么简单，下面👇koa的一些api

**Application对象**

application是koa的实例  简写app

- **app.use(function)** 

  将给定的中间件方法添加到此应用程序 `app.use()` 返回 `this`, 因此可以链式表达

  ```js
  app.use(someMiddleware)
  app.use(someOtherMiddleware)
  app.listen(3000)
  ```

  等同于

  ```js
  app.use(someMiddleware)
    .use(someOtherMiddleware)
    .listen(3000)
  ```

- **app.listen(...)**

  创建并返回 HTTP 服务器，将给定的参数传递给 `Server#listen()`

  ```js
  const Koa = require('koa');
  const app = new Koa();
  app.listen(3000);
  ```

  这里的 `app.listen(...)` 方法只是以下方法的语法糖:

  ```js
  const http = require('http');
  const Koa = require('koa');
  const app = new Koa();
  http.createServer(app.callback()).listen(3000);
  ```

- 

- **app.callback()**

  返回适用于 `http.createServer()` 方法的回调函数来处理请求

- **app.on()** 

  错误处理

  ```js
  app.on('error', (err, ctx) => {
    log.error('server error', err, ctx)
  });
  ```

**上下文(Context)**

`context` 将`node`中的`request`和`response` 封装到一个对象中，并提供一些新的api提供给用户进行操作；

- `ctx.app`: 应用程序实例引用,等同于`app`
- `ctx.req`: Node 的 `request` 对象.
- `ctx.res`: Node 的 `response` 对象.
- `ctx.request`: koa中的`Request`对象；
- `ctx.response` : Koa中的`Response`对象；
- `ctx.throw`: 抛出错误；
- `ctx.status` : 获取响应状态。默认情况下，`response.status` 设置为 `404` 而不是像 node 的 `res.statusCode` 那样默认为 `200`。

`request`及`response`别名

- koa会把`ctx.requset`上的属性直接挂载到ctx上如：

  - ` ctx.header`  //头信息；

  - `ctx.headers`

  - `ctx.method`

  - `ctx.method=`

  - `ctx.url`

  - `ctx.url=`

    …...


同样也会把`ctx.response`上的属性直接挂载到ctx上如：

- `ctx.body`

- `ctx.body=`

- `ctx.status`

- `ctx.status=`

  ….

#### 1.2、http Response的Content-Type

Koa的默认返回类型是 `text/plain`，我们可以通过 `ctx.accepts`判断一下客户希望接收什么类型的数据（根据HTTP请求中的Accept字段），然后通过 `ctx.type`指定返回值类型

```js
const Koa = require('koa');
const app = new Koa();

const main = ctx => {
  if (ctx.accepts('xml')) {
    ctx.type = 'xml';
    ctx.body = '<data>Hello World</data>';
  } else if (ctx.accepts('json')) {
    ctx.type = 'json';
    ctx.body = { data: 'Hello World' };
  } else if (ctx.accepts('html')) {
    ctx.type = 'html';
    ctx.body = '<p>Hello World</p>';
  } else {
    ctx.type = 'text';
    ctx.body = 'Hello World';
  }
};

app.use(main);
app.listen(3000);
```

#### 1.3、http 参数取值

##### 1.3.1、URL中的参数

```js
const Koa = require('koa');
const Router = require('koa-router');

const app = new Koa();
const router = new Router();

//路由前缀
router.prefix('/api');

/**
 * 获取URL中的参数
 * http://localhost:4000/api/details:id?age=1&name=zhang
 */
router.get('/details:id', async ctx => {
  // /api/details:1?age=12&name=zhang
  console.log(ctx.url);
  // { age: '12', name: 'zhang' } 获取的是对象，用的最多的方式
  console.log(ctx.query);
  // age=12&name=zhang 获取的是字符串
  console.log(ctx.querystring);
  // { id: ':1' } 动态路由的传参
  console.log(ctx.params);
});

app.use(router.routes());
app.listen(4000);
```

##### 1.3.2、body中的参数

```js
const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');

const app = new Koa();
const router = new Router();

// 解析body
app.use(koaBody());

//路由前缀
router.prefix('/api');

/**
 * 获取body中的参数
 * 需要借助koa-body中间件
 * 通过ctx.request.body获取
 * 不能使用ctx.body
 */
router.post('/post', ctx => {
  console.log(ctx.request.body);
  ctx.body = {
    status: 1,
    info: 'post请求成功'
  };
});

app.use(router.routes());
app.listen(4000);
```

### 二、常用的插件

#### 2.1、koa-router  路由

```js
const Koa = require('koa');
const Router = require('koa-router');

const app = new Koa();
const router = new Router();

//路由前缀
router.prefix('/api');

router.get('/', ctx => {
  ctx.body = 'Hello';
});

router.get('/index', ctx => {
  ctx.body = 'World';
});

app.use(router.routes());
// 配置router.allowedMethods()可以自动设置响应头
app.use(router.allowedMethods());

app.listen(4000);
```

#### 2.2、koa-static 静态资源

使用`koa-static`之后可以通过url中加上文件路径直接访问静态资源

```js
const Koa = require('koa');
const static = require('koa-static');

const app = new Koa();
// 静态资源加载
app.use(static(__dirname + '/static'));

app.listen(4000);

```

#### 2.3、koa-body 解析body

```js
const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');

const app = new Koa();
const router = new Router();

// 解析body
app.use(
  koaBody({
    multipart: true, //解析多个文件
    formidable: {
      maxFileSize: 100 * 1024 * 1024 // 设置上传文件大小最大限制，默认2M
    }
  })
);

//路由前缀
router.prefix('/api');

/**
 * 文件上传
 */
router.post('/upload', (ctx, next) => {
  console.log(ctx.request.body);
  console.log(ctx.request.files.img);
  let fileData = fs.readFileSync(ctx.request.files.img.path);
  fs.writeFileSync('static/imgs/' + ctx.request.files.img.name, fileData);
  ctx.body = '请求成功';
});

app.use(router.routes());
// 配置router.allowedMethods()可以自动设置响应头
app.use(router.allowedMethods());

app.listen(4000);

```

