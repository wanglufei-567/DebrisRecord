## rollup 笔记（三）实现 rollup 基础功能

### 一、前置知识

#### 1.1、Magic-String 的使用

**Magic-String** 是一个用于对字符串进行高效的修改和转换操作的 **JavaScript** 库，特别适用于代码转换和代码生成任务

**主要特性**：

1. **精确定位**：**Magic-String** 可以在修改字符串的同时，维护字符位置的精确映射
2. **方便操作**：提供了插入、替换、删除等一系列操作，使得对字符串的操作变得非常方便

**安装**：

```bash
npm install magic-string
# 或者
yarn add magic-string
```

**使用示例**：

下面是一些基本的使用示例：

```javascript
const MagicString = require('magic-string');

// 创建一个 MagicString 实例
const s = new MagicString('Hello World');

// 插入字符串
s.prepend('Say: ');  // 'Say: Hello World'
s.append('!');       // 'Say: Hello World!'

// 替换字符串
s.overwrite(4, 11, 'Hi');  // 'Say: Hi World!'

// 删除字符串
s.remove(4, 7);  // 'Say: World!'

// 获取修改后的字符串
console.log(s.toString());  // 'Say: World!'

// 生成 Source Map
const map = s.generateMap({
  source: 'original.js',
  file: 'transformed.js',
  includeContent: true
});

console.log(map.toString());
```

**主要方法**：

1. **prepend(content)**：在字符串的开头插入内容
2. **append(content)**：在字符串的末尾追加内容
3. **overwrite(start, end, content)**：替换指定范围内的内容
4. **remove(start, end)**：删除指定范围内的内容
5. **toString()**：获取修改后的字符串

#### 1.2、acorn 的使用

**Acorn** 是一个快速、小巧的 **JavaScript** 解析器，支持 **ECMAScript** 最新标准，它能够将 **JavaScript** 代码解析成抽象语法树（**AST**），适用于构建代码分析工具、编译器和其他需要理解和操作 **JavaScript** 代码的应用

**安装**：

```bash
npm install acorn
# 或者
yarn add acorn
```

**使用示例**：

下面是一个基本的使用示例，展示如何使用 **Acorn** 解析 **JavaScript** 代码并生成 **AST**：

```javascript
const acorn = require('acorn');
const sourceCode = `import $ from "jquery"`;
const ast = acorn.parse(sourceCode, {
  locations: true,
  ranges: true,
  sourceType: 'module',
  ecmaVersion: 8
});

console.log(ast);
```

打印结果：

```mathematica
 Node {
  type: 'Program',
  start: 0,
  end: 22,
  loc: SourceLocation {
    start: Position { line: 1, column: 0 },
    end: Position { line: 1, column: 22 }
  },
  range: [ 0, 22 ],
  body: [
    Node {
      type: 'ImportDeclaration',
      start: 0,
      end: 22,
      loc: [SourceLocation],
      range: [Array],
      specifiers: [Array],
      source: [Node]
    }
  ],
  sourceType: 'module'
}
```

打印结果可能不是很直观，可以使用[在线工具](https://astexplorer.net/)进行 **AST** 的转换，效果如下：

![image-20240626084842256](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20240626084842256.png)

在上述示例中，`acorn.parse` 方法将 **JavaScript** 代码解析成一个抽象语法树（**AST**）

**配置选项**：

`acorn.parse` 方法接受两个参数：要解析的代码和一个配置对象。常用的配置选项包括：

- **ecmaVersion**：指定要解析的 **ECMAScript** 版本。例如：`5`，`6`，`2020` 等
- **sourceType**：指定代码的类型，可以是 `"script"` 或 `"module"`
- **locations**：如果为 `true`，则在 **AST** 节点中包含位置信息
- **ranges**：如果为 `true`，则在 **AST** 节点中包含范围信息（开始和结束索引）

接下来实现一个 **AST** 的遍历的方法

```javascript
function walk(astNode, { enter, leave }) {
  visit(astNode, null, enter, leave);
}

function visit(node, parent, enter, leave) {
  if (enter) {
    enter(node, parent);
  }
  const keys = Object.keys(node).filter(key => typeof node[key] === 'object')

  keys.forEach(key => {
    let value = node[key];
    if (Array.isArray(value)) {
      value.forEach(val => {
        if (val.type) {
          visit(val, node, enter, leave)
        }
      });
    } else if (value && value.type) {
      visit(value, node, enter, leave);
    }
  });

  if (leave) {
    leave(node, parent);
  }
}
```

这个方法并不复杂，就是通过 **AOP** 的形式深度遍历 **AST** 的节点

看下使用效果：

```javascript
//遍历语法树
ast.body.forEach((statement) => {
  walk(statement, {
    enter(node) {
      console.log('进入' + node.type);
    },
    leave(node) {
      console.log('离开' + node.type);
    }
  });
});
```

打印结果：

```mathematica
进入ImportDeclaration
进入ImportDefaultSpecifier
进入Identifier
离开Identifier
离开ImportDefaultSpecifier
进入Literal
离开Literal
离开ImportDeclaration
```

#### 1.3、作用域与作用域链

在 **JS** 中，作用域是用来规定变量访问范围的规则，作用域链是由当前执行环境与上层执行环境的一系列变量对象组成的，它保证了当前执行环境对符合访问权限的变量和函数的有序访问

下面实现一个简易版的作用域链👇

```javascript
class Scope {
  constructor(options = {}) {
    //作用域的名称
    this.name = options.name;
    //父作用域
    this.parent = options.parent;
    //此作用域内定义的变量
    this.names = options.names || [];
  }
  add(name) {
    this.names.push(name);
  }
  findDefiningScope(name) {
    if (this.names.includes(name)) {
      return this;
    } else if (this.parent) {
      return this.parent.findDefiningScope(name);
    } else {
      return null;
    }
  }
}
module.exports = Scope;
```

实现效果：

```javascript
var a = 1;
function one() {
  var b = 1;
  function two() {
    var c = 2;
     console.log(a, b, c);
  }
}
let Scope = require('./scope');
let globalScope = new Scope({ name: 'global', names: ['a'], parent: null });
let oneScope = new Scope({ name: 'one', names: ['b'], parent: globalScope });
let twoScope = new Scope({ name: 'two', names: ['c'], parent: oneScope });
let threeScope = new Scope({ name: 'three', names: ['c'], parent: oneScope });

console.log(
  threeScope.findDefiningScope('a').name,
  threeScope.findDefiningScope('b').name,
  threeScope.findDefiningScope('c').name
  ) // global one three
```

### 二、实现 rollup

目录结构

```mathematica
├── package.json
├── README.md
├── src
    ├── ast
    │   ├── analyse.js //分析AST节点的作用域和依赖项
    │   ├── Scope.js //有些语句会创建新的作用域实例
    │   └── walk.js //提供了递归遍历AST语法树的功能
    ├── Bundle//打包工具，在打包的时候会生成一个Bundle实例，并收集其它模块，最后把所有代码打包在一起输出
    │   └── index.js 
    ├── Module//每个文件都是一个模块
    │   └── index.js
    ├── rollup.js //打包的入口模块
    └── utils
        ├── map-helpers.js
        ├── object.js
        └── promise.js
```

`src\main.js`

```js
console.log('hello');
```

`debugger.js`

```js
const path = require('path');
const rollup = require('./lib/rollup');
let entry = path.resolve(__dirname, 'src/main.js');
rollup(entry, 'bundle.js');
```

`lib\rollup.js`

```js
const Bundle = require('./bundle')

function rollup(entry, filename) {
  const bundle = new Bundle({ entry });
  bundle.build(filename);
}

module.exports = rollup;
```

`lib\bundle.js`

```js
let fs = require('fs');
let path = require('path');
let Module = require('./module');
let MagicString = require('magic-string');

class Bundle {
  constructor(options) {
    // 入口文件数据
    this.entryPath = path.resolve(options.entry.replace(/\.js$/, '') + '.js');
    // 存放所有的模块
    this.modules = {};
  }
  
  build(filename) {
    const entryModule = this.fetchModule(this.entryPath);// 获取模块代码
    this.statements = entryModule.expandAllStatements(true);// 展开所有的语句
    const { code } = this.generate();// 生成打包后的代码
    fs.writeFileSync(filename, code);// 写入文件系统
  }
  
  fetchModule(importee) {
    let route = importee;
    if (route) {
      // 读取文件内容
      let code = fs.readFileSync(route, 'utf8');
      // 生成模块信息
      const module = new Module({
        code,
        path: importee,
        bundle: this
      })
      return module;
    }
  }
  
  generate() {
    let magicString = new MagicString.Bundle();
    this.statements.forEach(statement => {
      const source = statement._source.clone();
      magicString.addSource({
        content: source,
        separator: '\n'
      })
    })
    return { code: magicString.toString() }
  }
}

module.exports = Bundle;
```

`lib\module.js`

```js
const MagicString = require('magic-string');
const { parse } = require('acorn');
let analyse = require('./ast/analyse');

class Module {
  constructor({ code, path, bundle }) {
    this.code = new MagicString(code, { filename: path });
    this.path = path;
    this.bundle = bundle;
    
    //先获取语法树
    this.ast = parse(code, {
      ecmaVersion: 8,
      sourceType: 'module'
    })
    //分析语法树
    analyse(this.ast, this.code, this);
  }
  
  expandAllStatements() {
    let allStatements = [];
    this.ast.body.forEach(statement => {
      let statements = this.expandStatement(statement);
      allStatements.push(...statements);
    });
    return allStatements;
  }
  
  expandStatement(statement) {
    statement._included = true;
    let result = [];
    result.push(statement);
    return result;
  }
}
module.exports = Module;
```

`lib\ast\analyse.js`

```js
function analyse(ast, code,module) {
  //给statement定义属性
  ast.body.forEach(statement => {
    Object.defineProperties(statement, {
      _module: { value: module },
      _source: { value: code.snip(statement.start, statement.end) }
    })
  });
}
module.exports = analyse;
```
