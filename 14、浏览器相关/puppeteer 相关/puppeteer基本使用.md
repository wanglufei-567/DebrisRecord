## Puppeteer 基本使用

### 一、什么是 Puppeteer？

**Puppeteer** 是一个用于控制 **Chrome** 或 **Chromium** 浏览器的 **Node.js** 库。它提供了一组高层次的 **API**，可以用来执行各种==**浏览器自动化任务**==，如网页抓取、生成 PDF、截图、测试和自动化表单填写等

**Puppeteer** 可以以无头模式（没有图形界面的浏览器）运行，但也可以在完整的浏览器环境中运行

<img src="https://user-images.githubusercontent.com/746130/40333229-5df5480c-5d0c-11e8-83cb-c3e371de7374.png" alt="puppeteer 概述" style="zoom: 80%;" />

### 二、Puppeteer 的使用场景

**Puppeteer** 的应用场景非常广泛，包括但不限于：

1. **生成页面截图和 PDF**：可以使用 **Puppeteer** 将网页转换为 **PDF** 或截图
2. **爬虫**：**Puppeteer** 可以模拟用户操作，用于爬取动态渲染的网页内容
3. **自动化表单提交**：**Puppeteer** 可以模拟表单填写和提交
4. **UI 测试**：可以创建一个可视化测试用例，使用 **Puppeteer** 模拟用户操作
5. **性能监测**：分析网页性能并生成报告

### 三、Puppeteer 中的概念

1. **Browser**：**Browser** 对象在 **Puppeteer** 中代表一个**浏览器实例**
   
   - 可以通过 `puppeteer.launch()` 方法启动一个新的浏览器实例
   - **Browser** 对象提供了一系列的方法来操作浏览器
     - 例如创建新的页面（**Page** 对象）、监听浏览器事件等
2. **Page**：**Page** 对象在 **Puppeteer** 中代表一个**浏览器标签页**
   
   - 可以通过 `browser.newPage()` 方法创建一个新的 **Page** 对象
   - **Page** 对象提供了一系列的方法来操作页面
     - 例如导航到新的 **URL**、查找页面元素、填写和提交表单等
3. **JSHandle**：**JSHandle** 对象在 **Puppeteer** 中代表一个 **JavaScript** 对象 <!--这个重要，相当于在 Node 中获取浏览器中的 JavaScript 对象-->
   
   - **JSHandle** 对象提供了一系列的方法来操作 **JavaScript** 对象
     
     - 例如获取对象的属性、调用对象的方法等
     
   - 可以通过 `page.evaluate()` 方法在页面上下文中执行 **JavaScript** 代码，并获取返回的 **JSHandle** 对象
   
     <!--page.evaluate 的返回值就是一个 JSHandle 对象 -->
4. **ElementHandle**：**ElementHandle** 对象是 **JSHandle** 对象的一个特殊类型，它代表一个 **DOM** 元素 <!--这个也很重要，模拟用户操作就是通过获取到 ElementHandle 来操作真实 DOM 的-->
   
   - 可以通过 `page.$()` 或 `page.$$()` 方法查找页面元素，并获取返回的 **ElementHandle** 对象
   - **ElementHandle** 对象提供了一系列的方法来操作 **DOM** 元素
     - 例如点击元素、输入文本、获取元素属性等

### 四、Puppeteer 常用 API

#### 4.1、启动浏览器实例

```js
puppeteer.launch([options])
```

这个方法用于启动浏览器实例，返回一个 **Promise**，解析为一个 **Browser** 对象

参数：

- `options` 是一个可选对象，包含以下属性：
  - `headless`: 是否以无头模式运行浏览器，默认为 `true`
  - `slowMo`: 放慢 **Puppeteer** 的操作速度，这对于观察页面上发生的情况很有用，单位为毫秒

示例：

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  // ... your code here ...
  await browser.close();
})();
```

#### 4.2、打开一个页面

```js
page.goto(url[, options])
```

这个方法导航到指定的 **URL**，返回一个 **Promise**，解析为一个 **Response** 对象

参数：

- `options` 是一个可选对象，包含以下属性：
  - `waitUntil`: 等待何种事件才认为导航成功，默认为 `load`
    - 可选值有 `load`、`domcontentloaded`、`networkidle0`、`networkidle2`

示例：

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  // ... your code here ...
  await browser.close();
})();
```

#### 4.3、在页面上下文中执行自定义逻辑

```js
page.evaluate(pageFunction[, …args])
```

这个方法可以在页面上下文中执行 **Node** 中自定义的**JavaScript** 函数，返回一个 **Promise**，解析为函数的返回值

参数：

- `pageFunction` 是要在页面上下文中执行的函数
- `args` 是传递给函数的参数，可以是一个 **JSHandle**

示例：

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  const title = await page.evaluate(() => document.title);
  console.log(title);
  await browser.close();
})();
```

#### 4.4、选择元素

```js
page.$(selector)
```

这个方法在页面上查找一个元素，返回一个 **Promise**，解析为一个 **ElementHandle** 或 `null`

参数：

- `selector` 是一个 **CSS** 选择器

示例：

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  const heading = await page.$('h1');
  // ... your code here ...
  await browser.close();
})();
```

#### 4.5、获取元素属性

```js
elementHandle.getProperty(propertyName)
```

这个方法获取元素的属性值，返回一个 **Promise**，解析为一个 **JSHandle**

参数：

- `propertyName` 是要获取的属性名称

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  const heading = await page.$('h1');
  const text = await heading.getProperty('textContent');
  console.log(await text.jsonValue());
  await browser.close();
})();
```

#### 4.6、模拟点击

```js
page.click(selector[, options])
```

这个方法点击页面上的元素，返回一个 **Promise**，解析为 `undefined`

参数：

- `selector` 是一个 **CSS** 选择器
- `options` 是一个可选对象，包含以下属性：
  - `delay`: 点击事件之间的延迟，单位为毫秒，默认为 0
  - `button`: 要点击的鼠标按钮，默认为 `left`
    - 可选值有 `left`、`right`、`middle`

示例：

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.click('button');
  // ... your code here ...
  await browser.close();
})();
```

#### 4.7、截图

```js
page.screenshot([options])
```

这个方法生成页面截图，返回一个 **Promise**，解析为一个 **Buffer**

参数：

- `options` 是一个可选对象，包含以下属性：
  - `path`: 截图文件的保存路径
  - `type`: 截图的类型，可选值有 `jpeg`、`png`。默认为 `png`
  - `quality`: 图片质量，只对 `jpeg` 有效
    - 取值范围为 0-100，不设置则使用默认质量

示例：

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({path: 'example.png'});
  await browser.close();
})();
```

#### 4.8、等待方法

```javascript
page.waitFor(selectorOrFunctionOrTimeout[, options[, ...args]])
```

 `waitFor` 方法是一个通用的等待方法，可以用于：

- 等待指定的时间
- 等待某个函数在页面上下文中返回 `true`
- 等待某个元素出现在 **DOM** 中

参数：

- `selectorOrFunctionOrTimeout`：这是一个必选参数，可以是字符串、函数或数字
  - 如果是字符串，那么它应该是一个 **CSS** 选择器，`waitFor` 方法将等待元素出现在 **DOM** 中
  - 如果是函数，那么 `waitFor` 方法将等待函数在页面上下文中返回 `true`
  - 如果是数字，那么它应该是一个毫秒数，`waitFor` 方法将等待指定的时间
- `options`：这是一个可选对象，包含以下属性：
  - `visible`：等待元素变为可见。默认为 `false`。
  - `hidden`：等待元素变为隐藏。默认为 `false`。
  - `timeout`：最大等待时间，单位为毫秒。默认为 30000 (30 秒)。
- `...args`：这是一组可选参数，只有当 `selectorOrFunctionOrTimeout` 是函数时才有效。这些参数将被传递给函数。              

#### 4.9、等待元素渲染完成

```js
page.waitForSelector(selector[, options])
```

这个方法等待页面上出现指定的元素，返回一个 **Promise**，解析为一个 **ElementHandle**

参数：

- `selector` 是一个 **CSS** 选择器
- `options` 是一个可选对象，包含以下属性：
  - `visible`: 等待元素变为可见，默认为 `false`
  - `hidden`: 等待元素变为隐藏，默认为 `false`
  - `timeout`: 最大等待时间，单位为毫秒，默认为 30000 (30 秒)

示例：

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.waitForSelector('h1');
  // ... your code here ...
  await browser.close();
})();
```

### 五、Puppeteer 处理网络请求

#### 5.1、拦截请求修改入参

在 **Puppeteer** 中，可以通过监听请求事件，拦截请求，修改参数后再发送

下面是一个简单的示例：

```js
const puppeteer = require('puppeteer');

async function run() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // 设置请求拦截
    await page.setRequestInterception(true);

    // 监听 request 事件
    page.on('request', async (request) => {
        // 获取原始请求参数
        const originalPostData = request.postData();

        // 修改请求参数
        let newPostData = originalPostData;
        if (request.url().includes('example.com')) {
            // 在这里根据需要修改 newPostData
            newPostData += '&newParameter=newValue';
        }

        // 继续请求
        request.continue({
            method: 'POST',
            postData: newPostData,
            headers: { ...request.headers(), 'Content-Length': newPostData.length }
        });
    });

    await page.goto('http://example.com');
    await browser.close();
}

run();

```

#### 5.2、获取请求返回值

在 **Puppeteer** 中，可以使用 `page.on('response')` 来监听请求并获取返回值

下面是一个简单的示例：

```js
const puppeteer = require('puppeteer');

async function run() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // 监听 response 事件
    page.on('response', async (response) => {
        const request = response.request();
        console.log(`URL: ${request.url()}`);
        console.log(`Status code: ${response.status()}`);

        // 获取返回值
        const responseBody = await response.json();
        console.log(`Response body: ${responseBody}`);
    });

    await page.goto('http://example.com');
    await browser.close();
}

run();
```

#### 5.3、保存请求并在需要的时候发送

在 **Puppeteer** 中，可以通过监听请求事件，将请求保存下来，然后在需要的时候再次发送

下面是一个简单的示例：

```js
const puppeteer = require('puppeteer');

async function run() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // 设置请求拦截
    await page.setRequestInterception(true);

    await page.goto('http://example.com');
  
      // 保存请求
    let savedRequest = null;

    // 监听 request 事件
    page.on('request', (request) => {
        // 保存请求
        savedRequest = request;
        // 继续请求
        request.continue();
    });

    // 在需要的时候再次发送请求
    if (savedRequest) {
        const newRequest = {
            url: savedRequest.url(),
            method: savedRequest.method(),
            postData: savedRequest.postData(),
            headers: savedRequest.headers()
        };
        await page.evaluateHandle(({url, method, postData, headers}) => {
            return fetch(url, {
                method,
                body: postData,
                headers
            });
        }, newRequest);
    }

    await browser.close();
}

run();
```



####                     