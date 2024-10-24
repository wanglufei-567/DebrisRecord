##  Jest 常用方法

### 一、Jest 中的模拟函数 Mock

在项目中，一个模块的方法内常常会去调用另外一个模块的方法，在单元测试中，我们可能并不需要关心内部调用的方法的执行过程和结果，==只想知道它是否被正确调用即可，甚至会指定该函数的返回值==，此时，使用 **Mock** 函数是十分有必要

#### 1.1、 `jest.fn()`

`jest.fn()` 是用于创建 **Mock** 函数的工具，==可以捕获函数的调用情况，比如是否被调用，传入的参数==等，它有多种链式调用方式来配置其行为

`jest.fn()` 常被用来进行某些有回调函数的测试

**使用方式**：

```javascript
const mockFn = jest.fn(); // 如果没有定义函数内部的实现，jest.fn() 会返回 undefined 作为返回值
const anotherMockFn = jest.fn(() => 'mocked return value'); // 可以直接在声明时定义函数内部实现
```

- 除了在声明时定义 **Mock**  函数的返回值或行为，也可以通过**`mockReturnValue()` 与 `mockImplementation()`** 来定义

  - `mockReturnValue()`：直接定义返回值
  - `mockImplementation()`：允许更复杂的行为定义

  **示例**：

  ```javascript
  const mockFn = jest.fn().mockReturnValue('value');
  const anotherMockFn = jest.fn().mockImplementation(() => 'implemented value');
  ```

##### 1.1.1、`jest.fn(implementation)` 与 `jest.fn().mockImplementation(implementation)` 的区别

这两者看似类似，但适用场景稍有不同：

- `jest.fn(implementation)` 是在创建 **Mock** 函数时直接指定其实现，适合在函数一开始就确定其行为的场景
- `jest.fn().mockImplementation(implementation)` 是先创建一个 **Mock** 函数，随后动态指定实现，适合在测试过程中灵活修改 **Mock** 行为的场景

**示例**：

```javascript
// jest.fn(implementation)
const mockFn = jest.fn(() => 'initial value');

// jest.fn().mockImplementation(implementation)
const dynamicMockFn = jest.fn();
dynamicMockFn.mockImplementation(() => 'dynamic value');
```

#### 1.2、 `jest.mock()`

`jest.mock` 是 **Jest** 提供的一个功能，它可以在测试中==拦截对某个模块的引用==，==并返回模拟实现==，被用来 **mock** 模块中的**依赖或函数**，便于在单元测试中**隔离**特定的**模块或功能**

通过 `jest.mock`，可以创建一个虚假的模块或函数，以控制其行为，==确保测试专注于代码的逻辑，而不是依赖外部模块==

**基本语法：**

```javascript
jest.mock(moduleName, factory, options);
```

- `moduleName`: 要 **mock** 的模块路径或名称
- `factory`: 可选，返回一个替代的 **mock** 实现函数
- `options`: 可选，指定一些额外的配置，比如 `virtual` 属性（用于虚拟模块的情况）

**适用场景:**

1. **隔离外部依赖**：当模块依赖第三方库、数据库或外部 **API** 时，使用 `jest.mock` 可以==避免直接调用这些外部资源==，防止测试依赖它们的实际行为
2. **替代复杂逻辑**：如果某些依赖模块包含复杂逻辑或副作用，可以通过 `jest.mock` 简化，==专注于测试当前模块的功能==
3. **控制输出**：通过 **mock**，可以为函数提供自定义返回值，以测试特定场景下的代码行为

**使用示例:**

##### 1.2.1、Mock 默认导出的模块

```javascript
// math.js
export default function add(a, b) {
  return a + b;
}

// add.test.js
import add from './math';

// 使用 jest.mock 来 mock 'math' 模块
jest.mock('./math');

test('mock default export', () => {
  // 设置 mock 返回值
  add.mockImplementation(() => 42);

  expect(add(1, 2)).toBe(42);
  expect(add).toHaveBeenCalled();
});
```

##### 1.2.2、Mock 命名导出模块

```javascript
// math.js
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

// math.test.js
import * as math from './math';

jest.mock('./math');

test('mock named export', () => {
  // 为 add 和 subtract 提供 mock 实现
  math.add.mockImplementation(() => 10);
  math.subtract.mockImplementation(() => 5);

  expect(math.add(1, 2)).toBe(10);
  expect(math.subtract(10, 5)).toBe(5);
});
```

##### 1.2.3、Mock 第三方模块

```javascript
// 使用 axios 库
import axios from 'axios';
import getData from './getData'; // 假设 getData 使用 axios 获取数据

jest.mock('axios');

test('mock axios module', async () => {
  const mockResponse = { data: { success: true } };
  
  // 模拟 axios 的 get 方法返回数据
  axios.get.mockResolvedValue(mockResponse);
  
  const data = await getData();
  expect(data).toEqual({ success: true });
  expect(axios.get).toHaveBeenCalled();
});
```

##### 1.2.4、Mock 部分模块

若是只想 **mock** 模块的一部分，而不是整个模块，可以在 `jest.mock` 之后对部分函数进行自定义处理

```javascript
// math.js
export function add(a, b) {
  return a + b;
}
export function multiply(a, b) {
  return a * b;
}

// math.test.js
import * as math from './math';

jest.mock('./math', () => ({
  ...jest.requireActual('./math'), // 保留 multiply 的实际实现
  add: jest.fn(), // 仅 mock add 函数
}));

test('mock only one function', () => {
  math.add.mockImplementation(() => 10);

  expect(math.add(1, 2)).toBe(10);
  expect(math.multiply(2, 3)).toBe(6); // multiply 仍然是原始实现
});
```

**注意事项**

- `jest.mock` 通常在文件的顶层调用，因为 **Jest** 在模块导入时就会自动 **mock** 相关依赖
- 如果想要对特定的测试用例使用不同的 **mock** 行为，可以通过 `mockImplementationOnce` 来临时设置 **mock** 行为

##### 1.2.5、 `jest.mock()` 的放置问题：`describe` 外部还是内部？

**Mock** 模块的时机非常关键，`jest.mock()` 通常放在 `describe` 外部，这是因为 **Jest** 的 **Mock** 机制会在模块加载时拦截模块调用

如果将 `jest.mock()` 放在 `describe` 之内，但模块在此之前已经被加载过，则 **Mock** 将不会生效

如果需要在不同的测试用例中对同一个模块使用不同的 **Mock** 实现，建议使用 `jest.resetModules()` 或 `jest.isolateModules()`，来确保每个测试用例加载时模块缓存是独立的

**示例**：

```javascript
describe('Test Suite 1', () => {
  jest.mock('./myModule', () => ({
    fetchData: jest.fn(() => 'mocked data 1')
  }));
  
  const { fetchData } = require('./myModule');
  
  test('fetchData should return mocked data 1', () => {
    expect(fetchData()).toBe('mocked data 1');
  });
});

```

#### 1.3、 `jest.spyOn()`

`jest.spyOn()` 创建一个 `spy`，监控对象方法的调用，而不修改原方法的实现（可以选择是否改变实现）

- **适用场景**: 当想监控一个现有对象的方法（例如，类实例的方法）时，使用 `jest.spyOn()` 是非常合适的，它允许检查该方法是否被调用以及传入的参数，同时保持原有的实现。

```javascript
const obj = {
  method: (arg) => arg + 1,
};

const spy = jest.spyOn(obj, 'method');

obj.method(1); // 调用原始方法

expect(spy).toHaveBeenCalledWith(1); // 断言方法被调用
expect(spy).toHaveReturned
```

##### 1.3.1、`mockRestore`

- **功能**：用于恢复被 `jest.spyOn` 监视的方法的原始实现

- **用法**：在测试用例结束时调用 `mockRestore()`，将该方法恢复为其原始实现。

- 示例：

  ```javascript
  const spy = jest.spyOn(myObj, 'myMethod').mockImplementation(() => 'mocked');
  myObj.myMethod(); // 调用的是模拟实现
  spy.mockRestore(); // 恢复原始方法
  myObj.myMethod(); // 现在调用的是原始方法
  ```

#### 1.3 、`toHaveBeenCalledWith()`

这个方法用于断言 **Mock** 函数是否被特定参数调用

```javascript
mockFn('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
```

#### 1.5、 处理 Webpack Alias 和 相对路径

在 **Webpack** 配置中，可能会为某些模块设置 `alias`，以便简化路径引入

但在项目中，除了 `alias` 引入，还可能有一些地方直接使用相对路径引入模块，这种情况下，**Mock** 模块时需要考虑如何同时处理 `alias` 和相对路径的情况

##### 1.5.1、Webpack Alias 的 Jest 配置

由于 **Jest** 不会自动解析 **Webpack** 的 `alias`，需要在 `jest.config.js` 中使用 `moduleNameMapper` 配置映射

```javascript
// jest.config.js
module.exports = {
  moduleNameMapper: {
    '^ModuleA$': '<rootDir>/src/modules/ModuleA'
  }
};
```

##### 1.5.2、同时 Mock Alias 和 相对路径

在测试中，需要分别对 `alias` 和相对路径进行 **mock**，确保无论引入方式如何，**Mock** 都能生效

```javascript
// __tests__/myComponent.test.js

// Mock alias 路径
jest.mock('ModuleA', () => ({
  someFunction: jest.fn(() => 'mocked value from alias')
}));

// Mock 相对路径
jest.mock('../modules/ModuleA', () => ({
  anotherFunction: jest.fn(() => 'mocked value from relative path')
}));

import { someFunction } from 'ModuleA';
import { anotherFunction } from '../modules/ModuleA';

test('should call mocked someFunction', () => {
  expect(someFunction()).toBe('mocked value from alias');
});

test('should call mocked anotherFunction', () => {
  expect(anotherFunction()).toBe('mocked value from relative path');
});
```

