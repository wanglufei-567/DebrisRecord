## Agent 工程测试

### 一、常用的测试工具

- `pytest` ：测试运行器，负责发现和执行测试
- `fixture` ：测试依赖准备机制，负责给测试函数提供可复用的输入、状态或资源
- `monkeypatch` ：`pytest` 内置 fixture，用于临时修改运行环境，例如环境变量、对象属性、当前工作目录

三者的关系：

- `pytest`：负责“跑测试”
- `fixture`：负责“准备测试依赖”
- `monkeypatch`：负责“临时替换环境或对象”

### 二、pytest 基本测试函数

#### 2.1、语法与用法

`pytest` 用约定发现测试文件和测试函数，接近 **Vitest** / **Jest** 的测试运行器

- 测试文件通常命名为 `test_*.py`
- 测试函数通常命名为 `test_*`
- 直接使用 `assert`
- 失败信息由 `pytest` 自动增强

#### 2.2、示例代码

```python
# Python
def normalize_tool_name(name: str) -> str:
    return name.strip().lower()

def test_normalize_tool_name():
    assert normalize_tool_name(" Read_File ") == "read_file"
```

```js
// JavaScript
import { expect, test } from "vitest";

function normalizeToolName(name) {
  return name.trim().toLowerCase();
}

test("normalizes tool name", () => {
  expect(normalizeToolName(" Read_File ")).toBe("read_file");
});
```

####
