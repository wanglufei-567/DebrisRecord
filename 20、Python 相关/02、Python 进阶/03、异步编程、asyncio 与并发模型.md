## 异步编程、asyncio 与并发模型

### 一、async def 与 await

#### 1.1、语法与用法

`async def` 定义 **coroutine function**（协程函数），调用后得到 **coroutine object**（协程对象），不等于立即完整执行

- `await` 只能在异步上下文里使用
- `await` 表示挂起当前 **coroutine**（协程），等待另一个异步结果
- **Python coroutine**（协程）需要 **event loop** 调度
- **JavaScript** 的 `async function` 返回 `Promise`

#### 1.2、示例代码

```python
# Python
async def call_model(prompt: str) -> str:
    return f"response: {prompt}"

async def main() -> None:
    result = await call_model("hello")
    print(result)
```

```js
// JavaScript
async function callModel(prompt) {
  return `response: ${prompt}`;
}

async function main() {
  const result = await callModel("hello");
  console.log(result);
}
```

### 二、asyncio.run

#### 2.1、语法与用法

`asyncio.run(coro)` 是运行异步程序的常见顶层入口，这里的 `coro` 是 **coroutine**（协程）的常见缩写

#### 2.2、参数说明

`asyncio.run(coro, *, debug=None)` 的核心参数如下

- `coro`：要运行的 **coroutine**（协程）
- `debug`：是否启用 **event loop** 调试模式

注意：如果当前线程已经有运行中的 **event loop**，再调用 `asyncio.run()` 可能报错

#### 2.3、示例代码

```python
# Python
import asyncio


async def main() -> None:
    print("agent async entry")


asyncio.run(main())
```

```js
// JavaScript
async function main() {
  console.log("agent async entry");
}

await main();
```

### 三、gather 与并发等待

#### 3.1、语法与用法

`asyncio.gather` 用于同时等待多个 **awaitable**，接近 **JavaScript** 的 `Promise.all`

#### 3.2、参数说明

`asyncio.gather(*aws, return_exceptions=False)` 的核心参数如下

- `*aws`：多个 **awaitable**
- `return_exceptions`：为 `False` 时异常会向外抛出，为 `True` 时异常会作为结果返回

#### 3.3、示例代码

```python
# Python
import asyncio


async def call_tool(name: str) -> str:
    return f"{name}:ok"


async def main() -> None:
    results = await asyncio.gather(
        call_tool("read_file"),
        call_tool("search"),
    )
    print(results)
```

```js
// JavaScript
async function callTool(name) {
  return `${name}:ok`;
}

async function main() {
  const results = await Promise.all([
    callTool("read_file"),
    callTool("search"),
  ]);
  console.log(results);
}
```

### 四、timeout 与取消

#### 4.1、语法与用法

异步工具调用必须设置超时，否则可能长期卡住

#### 4.2、参数说明

`asyncio.wait_for(aw, timeout)` 的核心参数如下

- `aw`：要等待的 **awaitable**
- `timeout`：超时时间，单位是秒

超时后会抛出 `TimeoutError`，取消语义后续再深入

#### 4.3、示例代码

```python
# Python
import asyncio


async def call_model() -> str:
    await asyncio.sleep(10)
    return "done"


async def main() -> None:
    result = await asyncio.wait_for(call_model(), timeout=3)
    print(result)
```

```js
// JavaScript
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 3000);

try {
  const response = await fetch("https://example.com", {
    signal: controller.signal,
  });
} finally {
  clearTimeout(timer);
}
```
