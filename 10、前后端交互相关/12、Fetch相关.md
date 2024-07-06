## Fetch使用记录

### 前言

`Fetch`是一个浏览器内置的`api`，同`XMLHttpRequest`一样是被用来支持 `JavaScript` 发送 `HTTP` 请求的

### 一、Fetch基础

`fetch` 是一个用于发起网络请求的现代接口，基于 **Promise**，它提供了一种简洁和强大的方式来执行各种 **HTTP** 请求

以下是 `fetch` 方法的完整定义和语法规则：

**语法：**

```javascript
fetch(input, init)
  .then(response => {
    // 处理响应
  })
  .catch(error => {
    // 处理错误
  });
```

**参数：**

- **input**: 一个表示资源路径的 `URL` 或 `Request` 对象
  
  - `URL`： 一个字符串，表示要请求的资源的路径
  - `Request`：一个 `Request` 对象，可以包含更多详细的请求信息

- **init** (可选)：一个配置对象，包含请求的各种选项
  
  - **method**: 
  
     - 请求的方法，如 `GET`, `POST`, `PUT`, `DELETE` 等，默认值为 `GET`
     ```javascript
     method: 'POST'
     ```
  
  
  - **headers**: 
  
     - 请求的头信息，可以是一个包含键值对的对象，或一个 `Headers` 对象
     ```javascript
     headers: {
       'Content-Type': 'application/json'
     }
     ```
  
  
  - **body**: 
  
     - 请求的主体内容，通常用于 `POST` 或 `PUT` 请求
     - 可以是 `Blob`, `BufferSource`, `FormData`, `URLSearchParams`, `USVString` 或 `ReadableStream` 类型
     ```javascript
     body: JSON.stringify({ key: 'value' })
     ```
  
  
  - **mode**: 
  
     - 请求的模式，决定请求是否跨域
     - 可以是 `cors`, `no-cors`, `same-origin`，默认值为 `cors`
     ```javascript
     mode: 'cors'
     ```
  
  
  - **credentials**: 
  
     - 请求是否包含凭据（如 `cookies`）
     - 可以是 `omit`, `same-origin`, `include`，默认值为 `same-origin`
     ```javascript
     credentials: 'include'
     ```
  
  
  - **cache**: 
  
     - 请求的缓存模式
     - 可以是 `default`, `no-store`, `reload`, `no-cache`, `force-cache`, `only-if-cached`，默认值为 `default`
     ```javascript
     cache: 'no-cache'
     ```
  
  
  - **redirect**: 
  
     - 请求的重定向模式，可以是 `follow`, `error`, `manual`，默认值为 `follow`
     ```javascript
     redirect: 'follow'
     ```
  
  
  - **signal**: 
  
    - 一个 `AbortSignal` 对象实例，允许你在请求过程中取消 `fetch` 请求
  
    ```JavaScript
    const controller = new AbortController();
    const signal = controller.signal;
    
    fetch('https://api.example.com/data', { signal })
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
        } else {
          console.error('Fetch error:', error);
        }
      });
    
    // 取消请求
    controller.abort();
    ```

**示例 1：基本用法**

```javascript
fetch('https://jsonplaceholder.typicode.com/posts')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

**示例 2：使用配置对象**

```javascript
fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'foo',
    body: 'bar',
    userId: 1
  })
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

**示例 3：使用 `AbortController` 取消请求**

```javascript
const controller = new AbortController();
const signal = controller.signal;

fetch('https://jsonplaceholder.typicode.com/posts', { signal })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => {
    if (error.name === 'AbortError') {
      console.log('Fetch aborted');
    } else {
      console.error('Fetch error:', error);
    }
  });

// 在5秒后取消请求
setTimeout(() => {
  controller.abort();
}, 5000);
```

**返回值**

`fetch` 方法返回一个 `Promise`，该 `Promise` 在请求完成时解析为一个 `Response` 对象，可以通过 `Response` 对象的各种方法（如 `json()`, `text()`, `blob()` 等）来获取响应的内容
