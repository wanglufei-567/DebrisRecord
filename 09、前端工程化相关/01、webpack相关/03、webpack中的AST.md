## webpack笔记（三）— webpack中的AST

### 一、前言

#### 1.1、什么是抽象语法树

**抽象语法树**（Abstract Syntax Tree，AST）是一种用来==描述代码结构的树形数据结构==，可以将代码表示为树节点和它们的关系

**AST**由各种**节点（Node）**组成，==每个节点都表示源代码中的一种结构==，例如变量声明，函数调用等

#### 1.2、抽象语法树用途

代码语法的检查、代码风格的检查、代码的格式化、代码的高亮、代码错误提示、代码自动补全等等

==优化变更代码，改变代码结构使达到想要的结构==

#### 1.3、抽象语法树定义

通过`JavaScript Parser`把代码转化为一颗抽象语法树（AST），==这颗树定义了代码的结构，通过操纵这颗树，我们可以精准的定位到声明语句、赋值语句、运算语句等等，实现对代码的分析、优化、变更等操作==

![ast](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/ast.jpg)

### 二、JavaScript Parser

**JavaScript Parser**是==将JavaScript代码转化成抽象语法树（AST）的工具==。

**JavaScript Parser**有两种类型：==解析器和转换器==。**解析器**将原始的JavaScript代码转换成抽象语法树，而**转换器**则对抽象语法树进行操作并生成新的抽象语法树。

常见的**JavaScript Parser**包括：

1. **Acorn**：一个快速、轻量级的JavaScript解析器，可以输出标准的ECMAScript5或ECMAScript6的抽象语法树。
2. **Esprima**：一个用JavaScript编写的高性能JavaScript解析器，支持ECMAScript5和ECMAScript6的语法，可以输出JSON格式的抽象语法树。
3. **Babel Parser**：一个非常流行的JavaScript转换器，可以将ES6+代码转换为ES5代码，并支持自定义插件和转换规则。

通过使用**JavaScript Parser**，开发者可以轻松地对JavaScript代码进行分析和操作，并且==可以将JavaScript代码转化为可供其他工具使用的中间格式==。

常见的**AST节点**：

- **File**：文件
- **Program**： 程序
- **Literal**： 字面量 （NumericLiteral StringLiteral BooleanLiteral）
- **Identifier**： 标识符
- **Statement**： 语句
- **Declaration**： 声明语句
- **Expression**： 表达式
- **Class**： 类

![image-20230313103529704](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230313103529704.png)

#### 2.1、AST遍历

AST遍历采用的是深度遍历，下面看下一个AST遍历的示例

安装工具包

```shell
npm i esprima estraverse escodegen -S
```

- **esprima** ：把JS源代码转成AST语法树
- **estraverse** ：遍历语法树,修改树上的节点
- **escodegen**：把AST语法树重新转换成代码

```js
const esprima = require('esprima'); //把JS源代码转成抽象语法树
const estraverse = require('estraverse'); //遍历抽象语法树
const escodegen = require('escodegen'); //把语法树重新生成源代码
// 源代码
const sourceCode = `function ast(){}`;
// 将源代码变成AST
const AST = esprima.parse(sourceCode);
// 遍历AST
estraverse.traverse(AST, {
  enter(node) {
    console.log('进入' + node.type);
    // 修改函数声明的函数名字
    if (node.type === 'FunctionDeclaration') {
      node.id.name = 'newAST';
    }
  },
  leave(node) {
    console.log('离开' + node.type);
  }
});
const result = escodegen.generate(AST);
console.log(result);

```

打印结果

```
进入Program
进入FunctionDeclaration
进入Identifier
离开Identifier
进入BlockStatement
离开BlockStatement
离开FunctionDeclaration
离开Program
function newAST() {
}
```

对应AST看下

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230313104811040.png" alt="image-20230313104811040" style="zoom:50%;" />

### 三、Babel

#### 3.1、Babel工作流程

Babel是一个JavaScript编译器，可以将当前或较新版本的JavaScript代码转换成向后兼容的版本，以便在任何浏览器或环境中运行。

Babel的工作过程主要分为三个阶段，每个阶段都使用插件进行转换

1. **Parse(解析)** ：==将源代码转换成抽象语法树==，树上有很多的[estree节点](https://github.com/estree/estree)
2. **Transform(转换)**： ==对抽象语法树进行转换==，将其转换为新的抽象语法树
3. **Generate(代码生成)**： 将上一步经过转换过的抽象语法树生成新的代码

Babel的插件可以在任何阶段对代码进行修改、添加、删除或替换，以达到各种不同的转换目的。

![ast-compiler-flow.jpg](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/ast-compiler-flow.jpg)

#### 3.2、Babel 插件

- [@babel/parser](https://github.com/babel/babel/tree/master/packages/@babel/parser) 可以把源码转换成AST
- [@babel/traverse](https://www.npmjs.com/package/babel-traverse)用于对 AST 的遍历，维护了整棵树的状态，并且负责替换、移除和添加节点
- [@babel/generate](https://github.com/babel/babel/tree/master/packages/@babel/generate) 可以把AST生成源码，同时生成sourcemap
- [@babel/types](https://github.com/babel/babel/tree/master/packages/babel-types) 用于 AST 节点的 Lodash 式工具库, 它包含了构造、验证以及变换 AST 节点的方法，对编写处理 AST 逻辑非常有用
- [@babel/template](https://www.npmjs.com/package/@babel/template)可以简化AST的创建逻辑
- [@babel/code-frame](https://www.npmjs.com/package/@babel/code-frame)可以打印代码位置
- [@babel/core](https://www.npmjs.com/package/@babel/core) Babel 的编译器，核心 API 都在这里面，比如==常见的 transform、parse==，并实现了插件功能

#### 3.3、Babel中的visitor

在Babel中，**visitor**是一个非常重要的概念，==它指的是一个对象，用于描述如何访问和转换抽象语法树（AST）中的各个节点==。

当Babel对源代码进行转换时，它会遍历整个AST，并根据用户提供的配置和插件对每个节点进行相应的转换。==**visitor**对象就是为了帮助Babel遍历AST，访问每个节点，并进行相应的转换==。

**visitor**对象包含了多个==以AST节点 `type` 命名的方法==，每个方法对应了AST中不同类型的节点，例如FunctionDeclaration、VariableDeclaration、BinaryExpression等

==当Babel遍历AST时，如果匹配上 type，就会visitor对象中对应节点类型的方法==，并将==当前节点作为参数==传递给该方法。然后用户可以在该方法中对节点进行相应的转换。

<!--也就是说每个AST节点都会有一个对应的处理方法，用来操作AST节点，完成AST的转换-->

**visitor**对象中的方法通常包含两个参数：

1. **path**：表示当前==节点的路径==，包括当前节点和其祖先节点的引用。通过**path**对象，可以获取当前节点的各种信息，例如==节点的类型、属性、位置==等。
2. **state**：表示当前==转换的状态==，包括用户传递的配置和插件所维护的状态。state对象可以用于在不同节点之间共享数据和状态。

总之，Babel的**visitor**是一个用于描述如何遍历和转换AST的对象，它是Babel实现各种转换的重要工具。用户可以通过自定义visitor对象和对应的转换方法，对AST进行灵活和高效的转换，从而实现各种语言和扩展的支持。

**path参数上的属性：**

- **node：**当前 AST 节点
- **parent：**父 AST 节点
- **parentPath：**父AST节点的路径
- **scope：**作用域
- **get(key)：** 获取某个属性的 path
- **set(key, node)：** 设置某个属性
- **is类型(opts)：** 判断当前节点是否是某个类型
- **find(callback)：** 从当前节点一直向上找到根节点(包括自己)
- **findParent(callback)：**从当前节点一直向上找到根节点(不包括自己)
- **insertBefore(nodes)：** 在之前插入节点
- **insertAfter(nodes)：** 在之后插入节点
- **replaceWith(replacement)：** 用某个节点替换当前节点
- **replaceWithMultiple(nodes)**：用多个节点替换当前节点
- **replaceWithSourceString(replacement)：** 把源代码转成AST节点再替换当前节点
- **remove()**： 删除当前节点
- **traverse(visitor, state)：** 遍历当前节点的子节点,第1个参数是节点，第2个参数是用来传递数据的状态
- **skip()：**跳过当前节点子节点的遍历
- **stop()：**结束所有的遍历

**path.scope上的属性：**

- **scope.bindings：** 当前作用域内声明所有变量
- **scope.path：** 生成作用域的节点对应的路径
- **scope.references：** 所有的变量引用的路径
- **getAllBindings()：** 获取从当前作用域一直到根作用域的集合
- **getBinding(name)：** 从当前作用域到根使用域查找变量
- **getOwnBinding(name)：** 在当前作用域查找变量
- **parentHasBinding(name, noGlobals)：** 从当前父作用域到根使用域查找变量
- **removeBinding(name)：** 删除变量
- **hasBinding(name, noGlobals)：** 判断是否包含变量
- **moveBindingTo(name, scope)：** 把当前作用域的变量移动到其它作用域中
- **generateUid(name)：** 生成作用域中的唯一变量名,如果变量名被占用就在前面加下划线

#### 3.4、实现一个转换箭头函数的Babel插件

转换前

```js
const sum = (a,b)=>{
    console.log(this);
    return a+b;
}
```

转换后

```js
var _this = this;

const sum = function (a, b) {
  console.log(_this);
  return a + b;
};
```

安装babel

```shell
npm i @babel/core @babel/types babel-plugin-transform-es2015-arrow-functions -D
```

其中`babel-plugin-transform-es2015-arrow-functions`是转换箭头函数的插件

先看下官方插件的实现效果

```js
const core = require('@babel/core');
const types = require('@babel/types');
const arrowFunctionPlugin = require('babel-plugin-transform-es2015-arrow-functions');

//这是JS源代码，用字符串表示
const sourceCode = `
const sum = (a,b)=>{
  const minis = (a,b)=>{
    console.log(this);
    return a-b;
  }
  return a+b;
}
`;

const result = core.transform(sourceCode, {
  plugins:[arrowFunctionPlugin]
});
console.log(result.code);
```

打印结果

```js
var _this = this;
const sum = function (a, b) {
  const minis = function (a, b) {
    console.log(_this);
    return a - b;
  };
  return a + b;
};
```

接下来实现一个转换箭头函数的插件

```js
//实现一个转换箭头函数的插件
let arrowFunctionPlugin2 = {
  visitor: {
    // 处理箭头函数类型AST节点的方法
    ArrowFunctionExpression(path) {
      // 获取AST节点
      const { node } = path;
      // 修改该AST节点的类型为普通函数类型
      node.type = 'FunctionExpression';
      //指定this
      hoistFunctionEnvironment(path);
      const body = node.body;
      //判断body节点是不是块语句BlockStatement
      if (!types.isBlockStatement(body)) {
        //快速方便的构建节点
        node.body = types.blockStatement([
          types.returnStatement(body)
        ]);
      }
    }
  }
};
```

```js
/**
 * 要在函数的外面声明一个_this变量，值是this
 * 在函数的内容，换this 变成_this
 * @param {*} path
 */
function hoistFunctionEnvironment(path) {
  //1.看看当前节点里有没有使用到this
  const thisPaths = getThisPaths(path);
  if (thisPaths.length > 0) {
    //可以用来生成_this变量的路径，找到最外层不是箭头函数的节点
    const thisEnv = path.findParent(parent => {
      //如果是函数，但不是箭头函数的话就返回true
      return (
        (parent.isFunction() && !parent.isArrowFunctionExpress()) ||
        parent.isProgram()
      );
    });
    let thisBindings = '_this';
    //如果此路径对应的作用域中没_this这个变量
    if (!thisEnv.scope.hasBinding(thisBindings)) {
      //向它对应的作用域里添加一个变量 ，变量名_this,变量的值this
      const thisIdentifier = types.identifier(thisBindings);
      // 创建一个变量'_this'为'this'
      thisEnv.scope.push({
        id: thisIdentifier,
        init: types.thisExpression()
      });
      // 替换箭头函数中所有'this'为'_this'
      thisPaths.forEach(thisPath => {
        thisPath.replaceWith(thisIdentifier);
      });
    }
  }
}
```

```js
/**
 * 找到所有this的AST节点
 */
function getThisPaths(path) {
  let thisPaths = [];
  // 遍历此路径所有的子路径
  // traverse(visitor, state)
  path.traverse({
    // 处理this语句
    ThisExpression(thisPath) {
      thisPaths.push(thisPath);
    }
  });
  return thisPaths;
}
```

看下实现效果

```js
//这是JS源代码，用字符串表示
const sourceCode = `
const sum = (a,b)=>{
  const minis = (a,b)=>{
    console.log(this);
    return a-b;
  }
  return a+b;
}
`;
const result = core.transform(sourceCode, {
  plugins: [arrowFunctionPlugin2]
});
console.log(result.code);
```

```js
var _this = this;
const sum = function (a, b) {
  const minis = function (a, b) {
    console.log(_this);
    return a - b;
  };
  return a + b;
};
```

可以看到和官方插件的结果是一致的

