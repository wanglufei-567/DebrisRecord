## rollup 笔记（二）rollup 基础使用

### 一、前言

使用 **Rollup** 的过程中，有几个关键概念需要了解：👇

- **Input**：入口文件

  - 通过配置入口文件，**Rollup** 可以从这里开始解析依赖树，找到所有需要打包的模块

  - 常见的配置方式是在 Rollup 配置文件 `rollup.config.js` 中指定 `input` 属性

    示例：

    ```javascript
    export default {
      input: 'src/main.js', // 指定入口文件
      // ...
    };
    ```


- **Output**：**Rollup** 打包后的输出配置，它包括输出文件的路径、格式、命名等属性

  - 常见的 `output` 配置选项包括：

    - `file`：输出文件的路径

    - `format`：输出模块的格式

      例如：

      -  `esm` (**ES Module**)
      - `cjs` (**CommonJS**)
      - `iife` (**Immediately Invoked Function Expression**) 
      - `umd` (**Universal Module Definition)**

    - `name`：当输出格式为 `iife` 或 `umd` (**Universal Module Definition**) 时，需要指定全局变量名称

    - `sourcemap`：是否生成 **source map** 文件，用于调试


  示例：

  ```javascript
  export default {
    input: 'src/main.js',
    output: {
      file: 'dist/bundle.js', // 输出文件路径
      format: 'iife', // 输出模块格式
      name: 'MyBundle', // 全局变量名称
      sourcemap: true // 生成 source map
    }
  };
  ```


- **Plugins**：**Rollup** 的插件系统，用于扩展和定制 **Rollup** 的功能

- 通过插件用户可以实现解析非 **JavaScript** 文件类型（如 **TypeScript**、**CSS**）、代码压缩、代码分割等功能

- **Rollup** 官方和社区提供了大量插件，常见的插件包括：

  - `@rollup/plugin-node-resolve`：用于解析 **Node.js** 风格的模块

  - `@rollup/plugin-commonjs`：用于将 **CommonJS** 模块转换为 **ES6** 模块

  - `@rollup/plugin-babel`：用于通过 **Babel** 转换最新的 **JavaScript** 语法

  - `rollup-plugin-terser`：用于压缩输出的代码

  示例：

  ```javascript
  import resolve from '@rollup/plugin-node-resolve';
  import commonjs from '@rollup/plugin-commonjs';
  import babel from '@rollup/plugin-babel';
  import { terser } from 'rollup-plugin-terser';
  
  export default {
    input: 'src/main.js',
    output: {
      file: 'dist/bundle.js',
      format: 'iife',
      name: 'MyBundle',
      sourcemap: true
    },
    plugins: [
      resolve(), // 解析 Node.js 模块
      commonjs(), // 转换 CommonJS 模块
      babel({
        exclude: 'node_modules/**', // 排除 node_modules 目录
        babelHelpers: 'bundled'
      }),
      terser() // 压缩代码
    ]
  };
  ```


- **External**：指定哪些模块是外部依赖，不应打包到最终的输出文件中
  
  - 使用 `external` 可以避免将某些库（如 `lodash`）打包进输出文件，而是保持为外部依赖
  
  
  示例：
  ```javascript
  export default {
    input: 'src/main.js',
    external: ['lodash'], // lodash 将不会被打包进输出文件
    output: {
      file: 'dist/bundle.js',
      format: 'cjs'
    }
  };
  ```
  
- **Watch 模式**：在开发过程中，可以使用 `watch` 模式让 **Rollup** 监视文件变化，并在文件变化时自动重新打包，可以通过命令行参数 `rollup -w` 或在配置文件中使用 `watch` 选项

  示例：
  ```javascript
  export default {
    input: 'src/main.js',
    output: {
      file: 'dist/bundle.js',
      format: 'iife',
      name: 'MyBundle',
      sourcemap: true
    },
    watch: {
      include: 'src/**', // 监视 src 目录下的所有文件
      exclude: 'node_modules/**' // 排除 node_modules 目录
    }
  };
  ```

### 二、安装依赖与简单使用

安装依赖：

```shell
npm install rollup
```

添加相关配置：

文件目录

```
usage
├── package.json
├── rollup.config.js
└── src
    └── index.js
```

`index.js`

```javascript
console.log('hello');
```

`rollup.config.js`

```javascript
export default {
  input:'src/index.js',
  output:{
      file:'dist/bundle.js',//输出文件的路径和名称
      format:'iife',//五种输出格式：amd/es6/iife/umd/cjs
      name:'bundleName'//当format为iife和umd时必须提供，将作为全局变量挂在window下
  },
}
```

打包结果：

`dist/bundle.js`

```javascript
(function () {
	'use strict';

	console.log('hello');

})();
```

### 三、配置 babel

为了使用新的语法，可以使用 **babel** 来进行编译输出

安装依赖：

- `@babel/core` 是 **babel** 的核心包
- `@babel/preset-env` 是预设
- `@rollup/plugin-babel` 是 **babel** 插件

```shell
npm install @rollup/plugin-babel @babel/core @babel/preset-env --save-dev
```

`src\main.js`

```js
let sum = (a,b)=>{
    return a+b;
}
let result = sum(1,2);
console.log(result);
```

`.babelrc`

```js
{
    "presets": [
       [
        "@babel/env",
        {
            "modules":false
        }
       ]
    ]
}
```

`rollup.config.js`

```javascript
import babel from '@rollup/plugin-babel'

export default {
    input: 'src/index.js',
    output: {
        file: 'dist/bundle.js', //输出文件的路径和名称
        format: 'iife', //五种输出格式：amd/es6/iife/umd/cjs
        name: 'bundleName', //当format为iife和umd时必须提供，将作为全局变量挂在window下
    },
    plugins: [
        babel({
            exclude: 'node_modules/**',
        }),
    ],
}
```

### 四、配置解析 CommomJs 模块的插件

虽然现在许多库已经开始使用 **ES** 模块，但仍有大量的 **npm** 包使用 **CommonJS** 规范，为了确保 **Rollup** 能够处理这些模块并进行正确的打包，需要使用 `@rollup/plugin-commonjs` 和  `@rollup/plugin-node-resolve` 插件解析 **CommomJs** 模块

安装依赖：

```shell
npm install --save-dev rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs
```

`rollup.config.js`

```javascript
import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default {
    input: 'src/index.js',
    output: {
        file: 'dist/bundle.js', //输出文件的路径和名称
        format: 'iife', //五种输出格式：amd/es6/iife/umd/cjs
        name: 'bundleName', //当format为iife和umd时必须提供，将作为全局变量挂在window下
    },
    plugins: [
        resolve(), // 解析 node_modules 中的模块
        commonjs(), // 转换 CommonJS 模块为 ES6
        babel({
            exclude: 'node_modules/**',
        }),
    ],
}

```

### 五、使用 CDN

index.js

```javascript
import _ from 'lodash';
import $ from 'jquery';
console.log(_.concat([1,2,3],4,5));
console.log($);
export default 'main';
```

rollup.config.js

```javascript
export default {
   // ...
    output: {
        // ...
        format: 'iife', 
        globals: {
            lodash: '_', // 告诉 rollup 全局变量_即是lodash
            jquery: '$', // 告诉 rollup 全局变量$即是jquery
        },
    },
    external: ['lodash', 'jquery'],
}

```

打包结果：

`dist/bundle.js`

```javascript
var bundleName = (function (_, $) {
	'use strict';

	function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

	var ___default = /*#__PURE__*/_interopDefaultLegacy(_);
	var $__default = /*#__PURE__*/_interopDefaultLegacy($);

	console.log(___default["default"].concat([1, 2, 3], 4, 5));
	console.log($__default["default"]);
	var index = 'main';

	return index;

})(_, $);
```

可以发现 `_`, `$ `是通过外部传递给自执行函数，并在函数内部组装成一个模块

### 六、压缩 JS

**terser** 是常用的 **JavaScript** 压缩器工具

安装依赖：

```shell
npm install rollup-plugin-terser --save-dev
```

`rollup.config.js`

```javascript
import {terser} from 'rollup-plugin-terser';

export default {
    // ...
    plugins: [
        // ...
        terser(),
    ],
}

```

打包结果：

`dist/bundle.js`

```javascript
var bundleName=function(e,t){"use strict";function n(e){return e&&"object"==typeof e&&"default"in e?e:{default:e}}var o=n(e),u=n(t);console.log(o.default.concat([1,2,3],4,5)),console.log(u.default);return"main"}(_,$);
```

### 七、编译 CSS

安装依赖：

```javascript
npm install  postcss rollup-plugin-postcss --save-dev
```

`rollup.config.js`

```javascript
import postcss from 'rollup-plugin-postcss';

export default {
    // ...
    plugins: [
        postcss()
    ],
}
```

### 八、配置本地开发服务器

安装依赖：

```shell
npm install rollup-plugin-serve --save-dev
```

开发环境配置文件：`rollup.config.dev.js`

```javascript
import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import postcss from 'rollup-plugin-postcss';
import serve from 'rollup-plugin-serve'

export default {
    input: 'src/index.js',
    output: {
        file: 'dist/bundle.js', //输出文件的路径和名称
        format: 'iife', //五种输出格式：amd/es6/iife/umd/cjs
        name: 'bundleName', //当format为iife和umd时必须提供，将作为全局变量挂在window下
        globals: {
            lodash: '_', //告诉rollup全局变量_即是lodash
            jquery: '$', //告诉rollup全局变量$即是jquery
        },
    },
    plugins: [
        resolve(), // 解析 node_modules 中的模块
        commonjs(), // 转换 CommonJS 模块为 ES6
        babel({
            exclude: 'node_modules/**',
        }),
        postcss(),
        serve({
          open: true,
          port: 8080,
          contentBase: './dist'
        })
    ],
    external: ['lodash', 'jquery'],
}
```

配置命令：

`package.json`

```json
{
  "scripts": {
    "build": "rollup --config rollup.config.build.js",
    "dev": "rollup --config rollup.config.dev.js -w"
  },
}
```

