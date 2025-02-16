## React18源码解析（三）JSX与Virtual DOM

### 一、前言

**JSX是什么？**

```jsx
const element = <h1>Hello, world!</h1>;
```

上面这段代码便是一段 **JSX**，**JSX** 是一种 **JavaScript** 的「语法扩展」，它可以很好地描述 **UI** 应该呈现出它应有交互的本质形式。

<!--屁话，难以理解，其实就是jsx写起来就像写js一样，没有引入新的概念-->

**为什么使用JSX？**

> React 认为渲染逻辑本质上与其他 UI 逻辑内在耦合，比如，在 UI 中需要绑定处理事件、在某些时刻状态发生变化时需要通知到 UI，以及需要在 UI 中展示准备好的数据。
>
> React 并没有采用将「标记」与「逻辑」分离到不同文件这种人为的分离方式，而是通过将二者共同存放在称之为「组件」的松散耦合单元之中，来实现[*关注点分离*](https://en.wikipedia.org/wiki/Separation_of_concerns)。
>
> React [不强制要求](https://zh-hans.reactjs.org/docs/react-without-jsx.html)使用 JSX，但是大多数人发现，在 JavaScript 代码中将 JSX 和 UI 放在一起时，会在视觉上有辅助作用，它还可以使 React 显示更多有用的错误和警告消息。

<!--也是屁话，让人费解，其实就是jsx写的时候，DOM结构与UI逻辑写在一起，比较清晰明了-->

**JSX 也是一个表达式**

> 在**编译**之后，**JSX** 表达式会被转为**普通 JavaScript 函数**调用，其执行过后可以得到一个 **JavaScript** 对象

==**JSX**是一种**JavaScript**的语法扩展，所以其本质上还是**JavaScript**；**JSX**经过**Babel**的编译之后会被转换成一段**JavaScript**函数调用逻辑，执行之后会生成一个**JavaScript**对象==<!--这个对象就是Virtual DOM-->

**JSX的编译转换新旧对比**

在 **React17** 之前的**JSX**的转换是下面👇这样的：

```js
const babel = require('@babel/core');
const sourceCode = `
<h1>
  hello<span style={{ color: 'red' }}>world</span>
</h1>
`;
const result = babel.transform(sourceCode, {
  plugins: [
    ["@babel/plugin-transform-react-jsx", { runtime: 'classic' }]
  ]
});

console.log(result.code);
```

转换结果

```js
React.createElement("h1", null, "hello", React.createElement("span", {
  style: {
    color: 'red'
  }
}, "world"));
```

可以看到，**JSX**被转换成 `React.createElement()` 函数的调用，所以这也能解释了为什么要在有 **JSX** 的文件中引入 **React**，即使在文件中并没有显式的使用到 **React**

在 **React17** 之后的 **JSX** 的转换是下面👇这样的：

```js
const babel = require("@babel/core");
const sourceCode = `
<h1>
    hello<span style={{ color: "red" }}>world</span>
</h1>
`;
const result = babel.transform(sourceCode, {
 plugins: [["@babel/plugin-transform-react-jsx", { runtime: "automatic" }]],
});
console.log(result.code);
```

转换结果

```js
import { jsx as _jsx } from "react/jsx-runtime";
import { jsxs as _jsxs } from "react/jsx-runtime";
/*#__PURE__*/
_jsxs("h1", {
  children: ["hello", /*#__PURE__*/_jsx("span", {
    style: {
      color: 'red'
    },
    children: "world"
  })]
});
```

可以看到转换结果中，会自动的引入相关依赖，也就是说不用我们手动的引入 **React** 了

可以发现新旧两种转换方式不同，是因为 **Babel** 插件选择的模式不同导致的，两种模式`classic`、`automatic`

### 二、实现JSX转换为Virtual DOM的方法

先修改下 `main.jsx` 增加一段 **JSX** 代码片段

```jsx
console.log('main');

let element = (
  <h1>
    hello<span style={{ color: "red" }}>world</span>
  </h1>
);
console.log('element', element)
```

可以发现浏览器中有以下报错

![image-20221002162317710](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20221002162317710.png)

<!--很明显这段报错的原因是因为依赖模块导入的问题，`src/react/jsx-dev-runtime`这个文件路径并没有找到相对应的文件；-->

<!--报错原因很清楚，但是为什么会有这样一个报错却让人费解，最后查了下资料，发现是因为 vite 打包编译时，检测到 JSX 的语法，自动引入了 src/react/jsx-dev-runtime 这个文件-->

```js
// vite.config.js

import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      react: path.posix.resolve("src/react"),
      "react-dom": path.posix.resolve("src/react-dom"),
      "react-reconciler": path.posix.resolve("src/react-reconciler"),
      scheduler: path.posix.resolve("src/scheduler"),
      shared: path.posix.resolve("src/shared"),
    },
  },
  plugins: [react()],
});
```

根据上面👆这个 `vite.config.js` 配置文件，可以发现完成自动引入 `src/react/jsx-dev-runtime` 的应该是这个插件`@vitejs/plugin-react`

#### 2.1、实现jsxDEV方法

根据上面👆的报错信息，那么接下要做的事情就很明显了，创建 `src/react/jsx-dev-runtime` 这个文件，并实现相关方法

> src/react/jsx-dev-runtime 这个文件，和前言中 Babel 转换 JSX 时自动引入的文件是一致的，只不过一个是开发模式引入的，一个是生产模式引入的
>
> ```js
> import { jsx as _jsx } from "react/jsx-runtime";
> import { jsxs as _jsxs } from "react/jsx-runtime";
> ```
>
> 同样的道理，jsxDEV方法也就是jsx方法的开发模式

创建 `jsx-dev-runtime.js`

```js
// src/react/jsx-dev-runtime.js

export { jsxDEV } from './src/jsx/ReactJSXElement';
```

创建 `ReactJSXElement.js`

```js
// src/react/src/jsx/ReactJSXElement.js

import hasOwnProperty from 'shared/hasOwnProperty';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';

/**
 * 保留属性，不会写到虚拟DOM中的props中去
 */
const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
}

/**
 * 校验key属性是否有效
 */
function hasValidKey(config) {
  return config.key !== undefined;
}

/**
 * 校验ref属性是否有效
 */
function hasValidRef(config) {
  return config.ref !== undefined;
}

/**
 * @description 生成虚拟DOM
 * @param type 元素类型
 * @param key 唯一标识
 * @param ref 用来获取真实DOM元素
 * @param props 属性对象
 */
function ReactElement(type, key, ref, props) {
  //返回值就是React元素，也被称为虚拟DOM
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props
  }
}

/**
 * @description 将JSX转换为虚拟DOM的方法，Babel编译JSX之后的结果就是此函数的调用
 * @param type 元素类型
 * @param config babel转译JSX之后，根据原始JSX自动生成的配置信息
 */
export function jsxDEV(type, config) {
  // 属性名
  let propName;
  // 属性对象
  const props = {};
  // 每个虚拟DOM可以有一个可选的key属性，用来区分一个父节点下的不同子节点
  let key = null;
  //可以通过ref实现获取真实DOM的需求
  let ref = null;

  if (hasValidKey(config)) {
    key = config.key;
  }
  if (hasValidRef(config)) {
    ref = config.ref;
  }

  // 遍历config，将属性信息挂到props中去
  for (propName in config) {
    if (hasOwnProperty.call(config, propName)
      && !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName]
    }
  }

  // 生成最终的虚拟DOM
  return ReactElement(type, key, ref, props);
}
```

```js
// src/shared/hasOwnProperty.js

const { hasOwnProperty } = Object.prototype;
export default hasOwnProperty;
```

```js
// src/shared/ReactSymbols.js

//表示此虚拟DOM的类型是一个React元素
export const REACT_ELEMENT_TYPE = Symbol.for('react.element');
```

以上👆就是 **jsxDEV** 方法的实现，很简单没有什么难度

看下 `main.jsx` 中的打印结果

```js
console.log('main');

let element = (
  <h1>
    hello<span style={{ color: "red" }}>world</span>
  </h1>
);
console.log('element', element)
```

`element` 的打印结果如下👇，也就是「**虚拟 DOM**」

```
{
    "type": "h1",
    "key": null,
    "ref": null,
    "props": {
        "children": [
            "hello",
            {
                "type": "span",
                "key": null,
                "ref": null,
                "props": {
                    "style": {
                        "color": "red"
                    },
                    "children": "world"
                }
            }
        ]
    }
}
```

> **所谓的虚拟DOM就是一个描述真实DOM的纯JS对象**

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/virutaldom_1664073330011-20221003105707613.jpg)

上图👆描述的是 **JSX** 如何转换为 **虚拟DOM**，用户编写的 **JSX** 在**工程打包时**会由 **Babel** 进行一次转译，之后是由浏览器运行转译结果得到**「虚拟 DOM」**<!--浏览器运行得到虚拟DOM，到根据虚拟DOM生成真实DOM，这里的逻辑就是运行时，也就是runtime-->

![image-20221003110306253](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20221003110306253.png)

打开浏览器的 **Sources** 可以发现，浏览器运行的文件是已经经过 **Babel** 编译之后的了

### 三、总结

**JSX** 是一种 **JavaScript** 的语法扩展，其本质上还是 **JavaScript**；**JSX** 在工程打包时会自动编译成一段 ==**JavaScript**函数调用==的代码，并在==**运行时**执行调用==生成虚拟DOM

