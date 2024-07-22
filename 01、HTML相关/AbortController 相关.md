## AbortController 相关

### 一、AbortController

`AbortController` 是一个 **Web API**，提供了一种机制来中止异步任务，例如 `fetch` 请求

它包含两个主要部分：`AbortController` 本身和与之关联的 `AbortSignal`

**AbortController**：

- **语法：**

  - 构造函数：**`AbortController()`**，用于创建一个新的 `AbortController` 实例
    
    ```javascript
    const controller = new AbortController();
    ```


- **属性**

  - **`signal`**：返回与 `AbortController` 实例关联的 `AbortSignal` 对象
    
    - 可以将这个 `signal` 传递给需要支持中止的异步任务
    
    ```javascript
    const signal = controller.signal;
    ```


- **方法**

  - **`abort()`**：触发与 `AbortController` 关联的 `AbortSignal` 对象的中止（**abort**）操作，导致任何与该信号相关的任务被中止
    
    ```javascript
    controller.abort();
    ```


**AbortSignal：**

`AbortSignal` 是一个接口，表示一个信号对象，它允许你通过 `AbortController` 来中止一个或多个异步操作

- **属性**

  - **`aborted`**：一个布尔值，表示该信号是否已经中止
    
    - 当调用 `AbortController.abort()` 时，这个值会变为 `true`
    
    ```javascript
    if (signal.aborted) {
      console.log('The request has been aborted');
    }
    ```


- **事件**

  - **`abort`**：当 `AbortController.abort()` 被调用时，会触发 `AbortSignal` 对象上的 `abort` 事件
    
    - 可以使用 `addEventListener` 来监听这个事件
    
    ```javascript
    signal.addEventListener('abort', () => {
      console.log('The request has been aborted');
    });
    ```


**使用示例1：基本用法**

创建一个 `AbortController` 实例，获取其 `signal` 属性，并将其传递给 `fetch` 请求，然后，通过调用 `abort()` 方法来中止请求

```javascript
const controller = new AbortController();
const signal = controller.signal;

fetch('/some-api-endpoint', { signal })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => {
    if (error.name === 'AbortError') {
      console.log('Fetch aborted');
    } else {
      console.error('Fetch error:', error);
    }
  });

const timeout = setTimeout(() => {
  controller.abort();
}, 5000); // 5秒超时
```

**使用示例2：请求发送之前，取消上次请求**

```javascript
let currentController = null;

async function fetchData(url) {
  // 如果有当前的控制器，先中止之前的请求
  if (currentController) {
    currentController.abort();
  }

  // 创建一个新的控制器
  currentController = new AbortController();
  const signal = currentController.signal;

  try {
    const response = await fetch(url, { signal });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Previous request aborted');
    } else {
      console.error('Fetch error:', error);
    }
  }
}

// 调用 fetchData 函数
fetchData('/api/endpoint1');
fetchData('/api/endpoint2'); // 之前的请求会被中止

```

**其他支持 `AbortSignal` 的 API**

除了 `fetch`，还有其他一些 **Web API** 也支持 `AbortSignal`，例如：

- **`EventTarget.addEventListener`**：可以使用 `AbortSignal` 来移除事件监听器
  
  ```javascript
  const controller = new AbortController();
  const signal = controller.signal;
  
  const target = new EventTarget();
  target.addEventListener('example', () => console.log('Event triggered'), { signal });
  
  // 在需要时中止事件监听
  controller.abort();
  ```

### 参考

- [MDN Web Docs: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN Web Docs: AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)

`AbortController` 和 `AbortSignal` 提供了一个干净、可控的机制来中止异步任务，特别是在处理网络请求时，使得资源管理和用户体验得到了显著的改善