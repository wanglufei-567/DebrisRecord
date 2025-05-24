## AOP 编程范式

**「面向切面编程」**（**AOP**，Aspect-Oriented Programming）是一种编程范式，旨在通过将「**横切关注点**」从业务逻辑中分离出来，从而提高代码的模块化和可维护性

<!--横切关注点是指那些在多个模块中都会涉及的功能，比如日志记录、安全检查、事务管理等-->

### 一、AOP 编程简介

「**AOP 编程**」有 5 个核心概念：**连接点**、**切入点**、**通知**、**切面**、**织入**

- **连接点（Join Point）**：程序中可「被拦截」、「增强」的 “执行点”，通常是函数调用

  示例：

  ```js
  function saveUser(user) {
    console.log("保存用户：", user);
  }
  ```

  这个 `saveUser` 函数本身就是一个**连接点**

- **切入点（Pointcut）**：用某种规则（比如函数名匹配）**筛选出**哪些「连接点」需要增强

  示例：

  ```js
  const isPointcutMatched = (fnName) => fnName.startsWith("save");
  ```

  这就是一个**切入点判断逻辑**，比如我们只想对函数名以 `save` 开头的函数插入日志

- **通知（Advice）**：指定在连接点“前”、“后”或“抛错时”执行的实际代码逻辑

  示例：

  ```js
  function logBefore(...args) {
    console.log("[前置通知] 函数将被调用，参数为：", args);
  }
  
  function logAfter(result) {
    console.log("[后置通知] 函数调用完毕，返回结果：", result);
  }
  ```

- **切面（Aspect）**：「通知逻辑」 +「 切入点规则」的组合，是 **AOP** 中的“模块”

  示例：

  ```js
  const loggingAspect = {
    pointcut: (fnName) => fnName.startsWith("save"), // 切入点
    before: logBefore,
    after: logAfter
  };
  ```

   这就是一个“切面”，描述了在哪些函数上应用什么通知

- **织入（Weaving）**：实际将切面逻辑插入到目标函数的过程

  示例：

  ```js
  // targetObj 原始对象，包含连接点
  // aspect 切面对象，指定切入点规则和通知逻辑
  function applyAspect(targetObj, aspect) {
    // 遍历所有函数
    for (const key of Object.keys(targetObj)) {
      // 临时缓存连接点
      const originalFn = targetObj[key];
      // 连接点命中切入点规则时，就将指定的通知逻辑添加到连接点上
      if (typeof originalFn === "function" && aspect.pointcut(key)) {
        // 包装连接点，给其添加特定逻辑
        targetObj[key] = function (...args) {
          aspect.before?.(...args);               // 前置通知
          const result = originalFn.apply(this, args);  // 执行业务逻辑
          aspect.after?.(result);                 // 后置通知
          return result;
        };
      }
    }
  }
  ```

**整体使用示例**

```js
const service = {
  saveUser(user) {
    console.log("【业务】正在保存用户：", user);
    return "OK";
  },

  deleteUser(id) {
    console.log("【业务】删除用户：", id);
  }
};

applyAspect(service, loggingAspect);

// 调用测试
service.saveUser({ name: "Tom" });
// ➜ 打印日志 + 执行业务

service.deleteUser(123);
// ➜ 不匹配切入点，不执行日志
```

**总结对照表**

| AOP 概念 | JS 对应示例                                |
| -------- | ------------------------------------------ |
| 连接点   | `saveUser()` 是一个连接点                  |
| 切入点   | `(fnName) => fnName.startsWith("save")`    |
| 通知     | `logBefore()` 和 `logAfter()`              |
| 切面     | 包含切入点规则和通知的对象 `loggingAspect` |
| 织入     | 用 `applyAspect()` 修改原函数行            |

### 二、AOP 在前端开发中的应用

#### 2.1、手动实现 AOP

可以通过函数包装来实现 **AOP**，例如使用高阶函数来添加通知：👇

```javascript
function before(target, advice) {
    return function() {
        advice.apply(this, arguments);
        return target.apply(this, arguments);
    };
}

function after(target, advice) {
    return function() {
        const result = target.apply(this, arguments);
        advice.apply(this, arguments);
        return result;
    };
}

// 示例函数
function sayHello(name) {
    console.log(`Hello, ${name}`);
}

// 添加前置通知
const sayHelloWithBefore = before(sayHello, () => console.log('Before advice'));

// 添加后置通知
const sayHelloWithAfter = after(sayHello, () => console.log('After advice'));

sayHelloWithBefore('World'); // 输出：Before advice \n Hello, World
sayHelloWithAfter('World'); // 输出：Hello, World \n After advice
```

或者通过添加原型方法实现：👇

```javascript
Function.prototype.before = function (beforeFn) {
  // before 被buy调用，因此this指向buy这个函数
  let _this = this;
  return function () {
    beforeFn(arguments);
    return _this(arguments);
  };
};
Function.prototype.after = function (afterFn) {
  let _this = this;
  return function () {
    _this(arguments);
    afterFn(arguments);
  };
};
function buy(money, goods) {
  console.log(`花${money}买${goods}`);
}

buy = buy.before(function () {
  console.log(`向媳妇申请1块钱.`);
});

buy = buy.after(function () {
  console.log(`把剩下的2毛钱还给媳妇.`);
});
buy(0.8, '盐');
// 向媳妇申请1块钱
// 花0.8买盐
// 把剩下的2毛钱还给媳妇
```

#### 2.2、 使用 AOP 库

一些 **JavaScript** 库可以帮助更方便地实现 **AOP**，比如 `aop.js`、`meld` 等。

```javascript
import meld from 'meld';

const target = {
    sayHello(name) {
        console.log(`Hello, ${name}`);
    }
};

// 添加前置通知
meld.before(target, 'sayHello', () => console.log('Before advice'));

// 添加后置通知
meld.after(target, 'sayHello', () => console.log('After advice'));

target.sayHello('World'); // 输出：Before advice \n Hello, World \n After advice
```

### 三、洋葱模型

**Koa** 的「**洋葱模型**」（**middleware 中间件机制**），虽然没有没有「切点」、「通知」、「切面」等完整 **AOP** 核心概念，但它有明确的「横切关注点分离」、「环绕逻辑」、「低侵入性」、「动态插入」等特点，很好的体现了 **AOP** 编程范式的思想

 **Koa** 的「**洋葱模型**」最经典的实现方式👇

```javascript
// compose 函数：将多个中间件函数组合成一个“洋葱结构”
function compose(middlewares) {
  return function (context) {
    // 变量 index 是为了记录上一次调用的是哪个中间件下标，确保每个中间件只能顺序执行 next() 一次
    let index = -1;

    // 核心：递归执行每个中间件
    function dispatch(i) {
      // 一个中间件执行 next() 一次时，index 就会被赋值为i，同一中间件再次执行 next() 时就会报错
      if (i <= index) throw new Error('next() 被多次调用');
      index = i;

      // 获取当前中间件
      const fn = middlewares[i];

      // 所有中间件执行完毕，返回一个 resolved 的 Promise
      if (!fn) return Promise.resolve();

      // 执行当前中间件，并传入 context 和 “下一个中间件的执行器” dispatch(i + 1)
      return Promise.resolve(
        fn(context, () => dispatch(i + 1))
      );
    }

    // 启动第一个中间件
    return dispatch(0);
  };
}
```

「中间件」定义示例：

```javascript
const middlewares = [
  async (ctx, next) => {
    console.log('中间件1: 进入');
    ctx.arr.push(1);
    await next(); // 调用下一个中间件
    ctx.arr.push(6);
    console.log('中间件1: 退出');
  },
  async (ctx, next) => {
    console.log('中间件2: 进入');
    ctx.arr.push(2);
    await next(); // 调用下一个中间件
    ctx.arr.push(5);
    console.log('中间件2: 退出');
  },
  async (ctx, next) => {
    console.log('中间件3: 进入');
    ctx.arr.push(3);
    await next(); // 最后一层，实际不执行任何后续
    ctx.arr.push(4);
    console.log('中间件3: 退出');
  }
];
```

洋葱模型使用方式

```javascript
const ctx = { arr: [] };
const fn = compose(middlewares);

// 启动中间件链
fn(ctx).then(() => {
  console.log('全部中间件执行完毕');
  console.log(ctx.arr); // 输出 [1, 2, 3, 4, 5, 6]
});
```

**执行顺序说明**：

以 `ctx.arr.push(x)` 来观察洋葱结构的行为：

```css
中间件1: 进入        -> push(1)
  中间件2: 进入      -> push(2)
    中间件3: 进入    -> push(3)
    中间件3: 退出    -> push(4)
  中间件2: 退出      -> push(5)
中间件1: 退出        -> push(6)
```

这就构成了一个典型的“从外到内进入 -> 从内到外退出”的流程

特点总结：

| 特性                | 说明                                                         |
| ------------------- | ------------------------------------------------------------ |
| 控制流依赖 `next()` | 每层中间件调用 `await next()` 决定是否继续向下传递           |
| 响应时自动“出栈”    | 执行完最后一层后，中间件的 `await next()` 才会“归来”，继续执行自己的后半段逻辑 |
| 错误保护机制        | 判断 `next()` 是否被多次调用（`i <= index`），防止死循环或重复执行 |
| 兼容异步操作        | 全部基于 `Promise`，适用于所有异步流程                       |

### 四、总结

**AOP** 通过将横切关注点从业务逻辑中分离出来，提高了代码的模块化和可维护性

在前端开发中，可以通过手动实现、使用 **AOP** 库或利用框架的机制来实现 **AOP**

通过这种方式，开发者可以更清晰地管理日志记录、性能监控、安全检查等功能，从而使代码更加简洁和易于维护

