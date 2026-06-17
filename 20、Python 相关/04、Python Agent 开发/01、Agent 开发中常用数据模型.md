## Agent 开发中常用数据模型

### 一、数据模型

数据模型用于描述一类业务数据的字段结构、字段类型、默认值和校验规则

<!--类比 JavaScript / TypeScript，可以先把数据模型理解成“提前定义好的对象模板”，类似 interface-->

基础数据类型解决的是“单个值或基础容器怎么表示”

- `str`、`int`、`float`、`bool`：表示单个基础值
- `list`、`dict`：表示集合或键值结构
- `tuple`、`set`：表示固定组合或去重集合

数据模型解决的是“一个具体的业务对象应该长什么样”

- 一条消息需要 `role`、`content`、`metadata`
- 一次工具调用需要 `name`、`arguments`、`call_id`
- 一份配置需要 `model`、`base_url`、`timeout`
- 一次 provider 响应需要 `content`、`finish_reason`、`usage`

数据模型和基础数据类型的关系是：数据模型通常由多个基础数据类型组合而成

```python
# Python
from dataclasses import dataclass


@dataclass
class Message:
    role: str
    content: str
```

这里的 `Message` 是数据模型，`role: str` 和 `content: str` 是模型内部字段使用的基础类型

### 二、Python 开发中的常用数据模型

#### 2.1、常见类型

**Python** 开发里常见的数据模型不只一种，它们对“字段结构”和“运行时校验”的约束强度不同

- 普通 `dict`：用键值对保存数据，最灵活，但字段结构不固定
- 普通 `class`：用类定义对象，可以同时包含数据和方法
- `TypedDict`：给 `dict` 补充字段结构说明，主要服务静态类型检查
- `dataclass`：用类定义轻量数据对象，自动生成 `__init__`、`repr` 等方法
  - 来自标准库 `dataclasses` 模块，不是内置类型

- **Pydantic BaseModel**：用类型标注定义数据模型，并在运行时解析和校验输入
  - 来自第三方库 **Pydantic**，需要额外安装


### 三、dataclass

#### 3.1、语法与用法

`dataclass` 适合定义内部简单数据结构，它会根据字段自动生成 `__init__` 等方法

- 适合内部对象：tool call、message、session metadata
- 不负责复杂运行时校验
- 对外部输入不可信时，优先考虑 **Pydantic**

示例代码：

```python
# Python
from dataclasses import dataclass

@dataclass
class ToolCall:
    name: str
    argument: str

call = ToolCall(name="read_file", argument="README.md")
```

```ts
// TypeScript
type ToolCall = {
  name: string;
  argument: string;
};

const call: ToolCall = {
  name: "read_file",
  argument: "README.md",
};
```
