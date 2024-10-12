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

`jest.mock()` 是 **Jest** 用于 **Mock** 整个模块的函数

它可以在测试中==拦截对某个模块的引用==，并返回模拟实现，通常用于模拟第三方依赖或复杂的业务逻辑模块

- **如何使用**：
  
  ```javascript
  jest.mock('./myModule', () => ({
    fetchData: jest.fn(() => Promise.resolve('mocked data'))
  }));
  ```

- **放置位置**：`jest.mock()` 一般放在 `describe` 的外部，这样每个测试用例都会使用到 **Mock** 的模块，不过也可以根据需要在 `describe` 内部放置

##### 1.2.1、 `jest.mock()` 的放置问题：`describe` 外部还是内部？

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

