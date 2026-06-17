## 装饰器、协议、ABC 与可扩展接口设计

### 一、装饰器基本语法

#### 1.1、语法与用法

装饰器写在函数或类定义上方，本质上是把被装饰对象传入另一个函数处理

- `@decorator` 等价于 `target = decorator(target)`
- 装饰器在定义阶段执行，不是调用阶段才执行
- 多个装饰器会叠加包装
- 读源码时要优先确认装饰器是否注册了工具、修改了调用行为或附加了元数据

#### 1.2、示例代码

```python
# Python
registry: dict[str, object] = {}


def tool(name: str):
    # decorator 会接收被 @tool 装饰的函数
    def decorator(func):
        # 把函数注册到 registry，key 是工具名，value 是函数本身
        registry[name] = func
        # 返回原函数，避免装饰后函数丢失调用能力
        return func

    return decorator

# 等价于 read_file = tool("read_file")(read_file)
@tool("read_file")
def read_file(path: str) -> str:
    return path
```

```js
// JavaScript
const registry = new Map();

function tool(name) {
  return function decorator(fn) {
    registry.set(name, fn);
    return fn;
  };
}

const readFile = tool("read_file")(function readFile(path) {
  return path;
});
```

### 二、函数装饰器参数

#### 2.1、语法与用法

函数装饰器如果要保持原函数调用能力，通常会接收任意参数并透传

- `*args`：接收任意位置参数
- `**kwargs`：接收任意关键字参数
- **wrapper** 内部调用原函数
- `functools.wraps` 用于保留原函数名称和文档信息，后续补充

#### 2.2、示例代码

```python
# Python
def trace(func):
    # *args 接收任意位置参数，**kwargs 接收任意关键字参数
    def wrapper(*args, **kwargs):
        print(f"call {func.__name__}")
        # 透传参数，保持原函数的调用方式不变
        return func(*args, **kwargs)

    return wrapper

# 等价于 run_tool = trace(run_tool)
@trace
def run_tool(name: str) -> str:
    return name
```

```js
// JavaScript
function trace(fn) {
  return function wrapper(...args) {
    console.log(`call ${fn.name}`);
    return fn(...args);
  };
}

const runTool = trace(function runTool(name) {
  return name;
});
```

### 三、ABC 与 abstractmethod

#### 3.1、语法与用法

`ABC` 用于定义抽象基类，`@abstractmethod` 表示子类必须实现的方法

- 抽象类不能直接实例化
- 子类没有实现抽象方法时，也不能实例化

#### 3.2、示例代码

```python
# Python
from abc import ABC, abstractmethod

class MemoryProvider(ABC):
    # abstractmethod 表示子类必须实现 load
    @abstractmethod
    def load(self, key: str) -> str | None:
        # 抽象方法只声明接口，不写具体实现
        pass


class FileMemoryProvider(MemoryProvider):
    # 子类实现 load 之后，才能被实例化
    def load(self, key: str) -> str | None:
        return None
```

```ts
// TypeScript
abstract class MemoryProvider {
  abstract load(key: string): string | null;
}

class FileMemoryProvider extends MemoryProvider {
  load(key: string): string | null {
    return null;
  }
}
```

### 四、Protocol 与结构化接口约束

#### 4.1、语法与用法

**Python** 很多时候不要求显式继承，只要对象具备该有的方法即可

- `Protocol` 可以把这种结构化约束写给类型检查器
- 它更接近 **TypeScript** 的结构化类型
- 实现类不需要显式继承 `Protocol`，只要结构兼容即可
- `runtime_checkable` 可以让 `Protocol` 支持 `isinstance` 检查
- `runtime_checkable` 只适合做浅层运行时检查，不能替代完整参数和返回值校验

#### 4.2、示例代码

```python
# Python
from typing import Protocol, runtime_checkable


# runtime_checkable 允许 isinstance(tool, ToolLike) 这种运行时浅层检查
@runtime_checkable
class ToolLike(Protocol):
    name: str

    def run(self, argument: str) -> str:
        # Protocol 只声明需要的方法结构，不写具体实现
        ...


class ReadFileTool:
    name = "read_file"

    # 没有显式继承 ToolLike，但结构兼容：有 name，也有 run 方法
    def run(self, argument: str) -> str:
        return argument


def execute(tool: ToolLike, argument: str) -> str:
    # 类型检查器会按 ToolLike 约束 tool
    return tool.run(argument)


tool = ReadFileTool()

if isinstance(tool, ToolLike):
    # 运行时只做浅层结构检查，不能替代完整参数校验
    execute(tool, "README.md")
```

```ts
// TypeScript
type ToolLike = {
  name: string;
  run(argument: string): string;
};

function execute(tool: ToolLike, argument: string): string {
  return tool.run(argument);
}
```
