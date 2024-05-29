## webpack笔记（一）— webpack基本概念

### 一、前言

==组件模块化==是目前主流的开发方式，通常我们会将一个应用涉及到的所有的功能拆分为一个个==组件==，如路由组件、页面组件、表单组件、表格组件等，一个组件对应一个源文件。源文件开发完成到应用部署上线中间，有一步骤很关键，那就是==**构建**==（也可称之为**==打包==**），==构建==就是把==源代码==转换成发布到线上的可执行 **JavaScrip**、**CSS**、**HTML** 代码

> **==构建==**其实是==工程化==、==自动化==思想在前端开发中的体现，把一系列流程用代码去实现，让代码自动化地执行这一系列复杂的流程，构建给前端开发注入了更大的活力，解放了我们的生产力

被用来进行**构建**的工具，我们称之为==构建工具==，而**webpack**正是目前主流的一款构建工具

<!--关于前端模块化发展及构建工具的变化，可以看看下面👇这篇文章 -->

[前端构建工具的前世今生](https://juejin.cn/post/7121279495494959111)

### 二、webpack简介

先看下**webpack**官网是如何定义自己的👇：

> 本质上，**==webpack==** 是一个现代 **JavaScript** 应用程序的==静态模块打包器==(`module bundler`)。当 **webpack** 处理应用程序时，它会递归地构建一个依赖关系图`(dependency graph`)，其中包含应用程序需要的每个模块，然后将所有这些模块打包成一个或多个 `bundle`

**模块打包**，通俗地说就是：==找出模块之间的依赖关系，按照一定的规则把这些模块**组织合并**为**一个JavaScript文件**==

**Webpack**认为一切都是**模块**，JS文件、CSS文件、jpg/png图片等等都是**==模块==**，这样的好处是能清晰地描述出各个模块之间的**==依赖关系==**，以方便 **Webpack** 对模块进行组合和打包。

**Webpack**会把所有的这些模块都合并为一个JS文件，这是它最本质的工作。当然，我们可能并不想要它把这些合并成一个JS文件，这个时候我们可以通过一些规则或工具来改变它

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/32af52ff9594b121517ecdd932644da4.png" alt="img" style="zoom: 30%;" />

<!--Webpack官网示意图，从一个js文件开始构建，打包成一个js文件，最后又拆分出需要的4种文件-->

下面是**Webpack**的一些核心概念和功能：

1. **entry**：入口文件，**Webpack**通过`entry`来找到==需要打包的模块==<!--一个应用可以有多个入口文件，每个入口文件对应一个bundle-->

2. **output**：打包后的文件输出的位置和文件名

3. **loader**：**==文件加载器==**，能够加载资源文件，并对这些文件进行一些处理，诸如编译、压缩等，最终一起打包到指定的文件中

   - **Loader**专注于==文件的转换==，使得**Webpack**能够处理==非**JavaScript**模块==

   - 例如，通过使用`css-loader`和`style-loader`，**Webpack**可以处理**CSS**模块并将其嵌入到**HTML**中

4. **plugin**：插件，**plugin**赋予了**Webpack**各种灵活的功能，例如打包优化、资源管理、环境变量注入等，目的是==解决**loader**无法实现的其他事==

   - **plugin**提供了更丰富的功能扩展，可以在==构建过程中==的不同阶段插入==自定义逻辑==
     - 例如压缩代码、拷贝文件等
   - **plugin**在整个编译周期都起作用

5. **mode**：设置`mode`可以指定**Webpack**的运行模式，可以是`development`、`production`或`none`

   - 不同的模式会对**Webpack**的行为进行优化，例如`development`模式会启用`devtool`来方便调试

6. **resolve** ：用于设置模块如何解析

   常用配置如下：

   - `alias`：配置别名，简化模块引入
   - `extensions`：在引入模块时可不带后缀
   - `symlinks`：用于配置 `npm link` 是否生效，禁用可提升编译速度

7. **optimization**： 用于自定义 **Webpack** 的内置优化配置，一般用于生产模式提升性能

   常用配置项如下：

   - `minimize`：是否需要压缩 **bundle**
   - `minimizer`：配置压缩工具，如 **TerserPlugin**、**OptimizeCSSAssetsPlugin**
   - `splitChunks`：拆分 **bundle**
   - `runtimeChunk`：是否需要将所有生成 **chunk** 之间共享的运行时文件拆分出来

8. **Code Splitting**：将打包后的代码拆分成多个`chunk`，以优化性能和减少加载时间

9. **Dev Server**：可以使用`webpack-dev-server`来启动一个本地开发服务器，方便在开发过程中调试和热更新

### 三、webpack的基本使用

**安装**

```shell
npm install  webpack webpack-cli --save-dev
```

`webpack`是打包的核心包，`webpack-cli`是命令行工具

**配置脚本命令**

```js
// package.json

"scripts": {
  "build": "webpack --mode=production",
  "dev": "webpack"
},
```

**创建配置文件**

```js
// webpack.config.js
module.exports = {

};
```

接下来是具体的配置项👇

#### 3.1、 入口(entry)

- 入口起点(`entry point`)指示 **webpack** 应该使用哪个模块，来作为构建其内部依赖图(`dependency graph`) 的**开始**。进入入口起点后，**webpack**会找出有==哪些模块和库是入口起点（直接和间接）依赖的==
- 默认值是 `./src/index.js`，但你可以通过在 `webpack configuration` 中配置 `entry` 属性，来指定一个（或多个）不同的入口起点

 `src\index.js`

```js
const A = 111
console.log(A)
```

 `webpack.config.js`

```js
const path = require('path');
module.exports = {
  entry: './src/index.js',
};
```

#### 3.2、 输出(output)

- `output` 属性告诉**webpack**在哪里输出它所创建的 `bundle`，以及如何命名这些文件
- 主要输出文件的默认值是 `./dist/main.js`，其他生成文件默认放置在 `./dist` 文件夹中。

`webpack.config.js`

```diff
const path = require('path');
module.exports = {
  entry: './src/index.js',
+  output: {
+    path: path.resolve(__dirname, 'dist'),
+    filename: 'main.js'
+  }
};
```

执行打包命令

```shell
npm run dev
```

看下输出文件`./dist/main.js`

```js
console.log(111);
```

#### 3.3、 loader

- ==**webpack** 只能理解 `JavaScript` 和 `JSON` 文件==
- **loader** 让 **webpack** 能够去处理其他类型的文件，并将它们转换为有效模块，以供应用程序使用，以及被添加到依赖图中

`webpack.config.js`

```diff
const path = require('path');
module.exports = {
  mode: 'development',
  devtool:false,
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js'
  },
+  module: {
+    rules: [
+      { test: /\.css$/, use: ['style-loader','css-loader']}
+    ]
+  }
};
```

<!--loader是从右往左的顺序生效的，最右侧的loader读的是源文件内容 最左侧的loader一定会返回一个js模块-->

#### 3.4、 插件(plugin)

- **loader** 用于转换某些类型的模块
- **插件(plugin)**目的在于解决 **loader**无法实现的**其他事**，插件可以用于执行范围更广的任务，包括：打包优化，资源管理，注入环境变量

`src\index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>webpack5</title>
</head>
<body>
</body>
</html>
```

`webpack.config.js`

```diff
const path = require('path');
+const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  mode: 'development',
  devtool:false,
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js'
  },
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader','css-loader']}
    ]
  },
+  plugins: [
+    new HtmlWebpackPlugin({template: './src/index.html'})
+  ]
};
```

`html-webpack-plugin` 这个插件的作用是：当使用 `webpack`打包时，创建一个 `html` 文件，并把 `webpack` 打包后的静态文件自动插入到这个 `html` 文件当中

#### 3.5、模式(mode)

**webpack 4.x** 版本引入了 [mode](https://webpack.docschina.org/configuration/mode/) 的概念

`mode` 是`development`, `production` 或 `none` 之中的一个，默认值为`production`

- **`development` 开发环境**
  - 需要生成 `sourcemap` 文件
  - 需要打印 `debug` 信息
  - 需要 `live reload` 或者 `hot reload` 的功能
- **`production`生产环境**
  - 可能需要分离 **CSS** 成单独的文件，以便多个页面共享同一个 **CSS** 文件
  - 需要压缩 **HTML**/**CSS**/**JS** 代码
  - 需要压缩图片

**环境变量的设置方式**

1. 命令行中使用`--mode`用来设置==模块内的`process.env.NODE_ENV`==
2. 配置文件中设置`mode`属性来设置==模块内的`process.env.NODE_ENV`==
3. 配置文件中使用**webpack**插件`DefinePlugin`用来设置==模块内的全局变量==
4. 命令行中使用跨平台设置环境变量的工具`cross-env`来设置==`node`环境==的`process.env.NODE_ENV`
5. 通过`.env`文件配置环境变量

**1、命令行配置**

- `webpack`命令的`mode`默认为`production`

- `webpack serve`命令的`mode`默认为`development`

可以在==模块内==通过`process.env.NODE_ENV`获取当前的环境变量，无法在**webpack**配置文件中获取此变量

```json
"scripts": {
  "build": "webpack",
  "dev": "webpack serve"
},
```

 `src\index.js`

```js
console.log(process.env.NODE_ENV);// development | production
```

`webpack.config.js`

```js
console.log('NODE_ENV',process.env.NODE_ENV);// undefined
```

或者使用`--mode`直接指定模块内的环境变量

```json
  "scripts": {
    "build": "webpack --mode=production",
    "dev": "webpack --mode=development serve"
  },
```

------

**2、配置文件中设置`mode`**

```js
module.exports = {
  mode: 'development'
}
```

------

**3、使用DefinePlugin设置==模块内的全局变量==**

- 可以在任意模块内通过 `process.env.NODE_ENV_XXX` <!--只是个key--> 获取当前的环境变量
- 无法在`node环境`(**webpack** 配置文件中)下获取设置的环境变量

```js
plugins:[
   new webpack.DefinePlugin({
      'process.env.NODE_ENV_XXX':JSON.stringify(value)
   })
]   
```

`index.js`

```js
console.log(NODE_ENV);//  production
```

`webpack.config.js`

```js
console.log('process.env.NODE_ENV_XXX',process.env.NODE_ENV_XXX);// undefined
console.log('NODE_ENV',NODE_ENV);// error ！！！
```

------

**4、cross-env**

只能设置`node环境`下的变量`NODE_ENV`

`package.json`

```json
"scripts": {
  "build": "cross-env NODE_ENV=development webpack"
}
```

`webpack.config.js`

```js
console.log('process.env.NODE_ENV',process.env.NODE_ENV);// development
```

**5、`.env`文件**

通过第三方工具包dotenv读取.env配置文件中的环境变量

配置文件

`.env`

```
NAME="AAAAA"
```

`environment/.prod.env`

```
NAME="PROD"
```

`environment/.dev.env`

```
NAME="DEV"
```

使用方式

```js
require('dotenv').config()
console.log(process.env.NAME) // AAAAA

const PROD = require('dotenv').config({ path: 'environment/.prod.env' })
console.log(PROD.parsed.NAME) // PROD

const DEV = require('dotenv').config({ path: 'environment/.dev.env' })
console.log(DEV.parsed.NAME) // DEV
```

### 四、开发服务器

#### 4.1、安装服务器

```js
npm install webpack-dev-server --save-dev
```

#### 4.2、webpack.config.js

| 类别      | 配置名称   | 描述                                                         |
| :-------- | :--------- | :----------------------------------------------------------- |
| output    | path       | 指定输出到硬盘上的目录                                       |
| output    | publicPath | 表示的是打包生成的index.html文件里面引用资源的前缀           |
| devServer | publicPath | 表示的是打包生成的静态文件所在的位置(若是devServer里面的publicPath没有设置，则会认为是output里面设置的publicPath的值) |
| devServer | static     | 用于配置提供额外静态文件内容的目录                           |

```js
module.exports = {
  devServer: {
    static: path.resolve(__dirname, 'public'),
    port: 8080,
    open: true
  }
}
```

#### 4.3、package.json

```diff
  "scripts": {
    "build": "webpack",
+   "dev": "webpack serve"
  }
```

运行命令`npm run dev`会起一个8080的本地服务，并默认打开网页

#### 4.4、webpack-dev-server

关于开发服务器**webpack-dev-server**需要知道的是：

1. 使用`webpack`打包项目，得到输出的文件，==放到输出目录里==<!--output配置的目录-->
2. ==使用`webpack-dev-server`（`webpack serve`）打包的话，**结果文件并不会写入硬盘，只会写到内存里**== <!--所以使用开发服务器时，在工程里看不到打包后的文件-->

`webpack-dev-server`会启一个**http服务器**，用来返回打包后的文件

**http服务器**的静态文件根目录有两个：

1.打包后的`dist`目录

2.我们指定的静态文件根目录

### 五、支持less和sass

**安装**

```shell
npm i less less-loader -D
npm i node-sass sass-loader -D
npm rebuild node-sass
```

`webpack.config.js`

```diff
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  mode: 'development',
  devtool: false,
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
+     { test: /\.less$/, use: ['style-loader','css-loader', 'less-loader'] },
+     { test: /\.scss$/, use: ['style-loader','css-loader', 'sass-loader'] }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' })
  ]
};
```

`src\index.html`

```diff
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>webpack5</title>
</head>
<body>
+  <div id="less-container">less-container</div>
+  <div id="sass-container">sass-container</div>
</body>
</html>
```

`src\index.js`

```diff
import './index.css';
+import './less.less';
+import './sass.scss';
```

`src\less.less`

```less
@color:blue;
#less-container{
    color:@color;
}
```

`src\sass.scss`

```less
$color:orange;
#sass-container{
    color:$color;
}
```

### 六、资源模块

**资源模块**是一种模块类型，它允许使用资源文件（字体，图标等）而==无需配置额外 loader==

通过配置`type`属性设置资源导出类型

- `asset/source` ：导出资源的源代码
- `asset/resource` ：发送一个单独的文件并导出 **URL**
- `asset/inline` ：导出一个资源的 `data` **URI**
- `asset` ：在导出一个 `data` **URI** 和发送一个单独的文件之间自动选择。之前通过使用 `url-loader`，并且配置资源体积限制实现

#### 6.1、webpack.config.js

```diff
module.exports = {
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      {
        test: /\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader']
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
+      {
+        test: /\.png$/, // 会把png图片自动拷贝到输出目录中，并返回新路径或者说名称
+        type: 'asset/resource',
+        generator: {
+          filename: 'png/[hash][ext]'
+        }
+      },
+      {
+        test: /\.ico$/, // 会把ico文件变成base64字符串并返回给调用者
+        type: 'asset/inline'
+      },
+      {
+        test: /\.txt$/, // 会把txt内容直接返回
+        type: 'asset/source'
+      },
+      {
+        test: /\.svg$/,
+        type: 'asset/resource'
+      },
+      {
+        test: /\.jpg$/,
+        type: 'asset', // 表示可以根据实际情况进行自选择是resource还inline
+        parser: {
+          dataUrlCondition: {
+            maxSize: 4 * 1024 // 如果文件大小小于4K就走inline,如果大于4K就
+          }
+        },
+        generator: {
+          filename: 'jpg/[hash][ext]'
+        }
+      }
   ]
  },
};
```

`src\index.js`

```js
import png from './assets/logo.png';
import ico from './assets/logo.ico';
import jpg from './assets/logo.jpg';
import txt from './assets/logo.txt';
console.log(png,ico,jpg,txt);
```

### 七、JS兼容性处理

JS兼容性通过Babel进行处理，Babel其实是一个编译JavaScript的平台,可以把ES6/ES7,React的JSX转义为ES5

#### 7.1、安装依赖

- [babel-loader](https://www.npmjs.com/package/babel-loader)使用**Babel**和**webpack**转译**JavaScript**文件
- [@babel/@babel/core](https://www.npmjs.com/package/@babel/core)**Babel**编译的核心包
- [babel-preset-env](https://www.babeljs.cn/docs/babel-preset-env)
- [@babel/@babel/preset-react](https://www.npmjs.com/package/@babel/preset-react)**React**插件的**Babel**预设
- [@babel/plugin-proposal-decorators](https://babeljs.io/docs/en/babel-plugin-proposal-decorators)把类和对象装饰器编译成**ES5**
- [@babel/plugin-proposal-class-properties](https://babeljs.io/docs/en/babel-plugin-proposal-class-properties)转换静态类属性以及使用属性初始值化语法声明的属性

```js
npm i babel-loader @babel/core @babel/preset-env @babel/preset-react  -D
npm i @babel/plugin-proposal-decorators @babel/plugin-proposal-class-properties @babel/plugin-proposal-private-property-in-object  @babel/plugin-proposal-private-methods -D
```

#### 7.2、webpack.config.js

```diff
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
module.exports = {
  mode: 'development',
  devtool: false,
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
  },
  module: {
    rules: [
+      {
+        test: /\.jsx?$/,
+        use: {
+          loader: 'babel-loader',
+          options: {
+            presets: ["@babel/preset-env", '@babel/preset-react'],
+            plugins: [
+              ["@babel/plugin-proposal-decorators", { legacy: true }],
+              ["@babel/plugin-proposal-private-property-in-object", { "loose": true }],
+              ["@babel/plugin-proposal-private-methods", { "loose": true }],
+              ["@babel/plugin-proposal-class-properties", { loose: true }],
+            ],
+          },
+        },
+      },
      { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] },
      { test: /\.less$/, use: ['style-loader', 'css-loader','postcss-loader', 'less-loader'] },
      { test: /\.scss$/, use: ['style-loader', 'css-loader', 'postcss-loader','sass-loader'] },
      {
        test: /\.(jpg|png|gif|bmp|svg)$/,
        type:'asset/resource',
        generator:{
          filename:'images/[hash][ext]'
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' })
  ]
};
```

`src\index.js`

```diff
+function readonly(target,key,descriptor) {
+    descriptor.writable=false;
+}
+
+class Person{
+    @readonly PI=3.14;
+}
+let p1=new Person();
+p1.PI=3.15;
+console.log(p1)
```

`jsconfig.json`

```json
{
  "compilerOptions": {
      "experimentalDecorators": true
  }
}
```

### 八、服务器代理

如果有单独的后端开发服务器 API，并且希望在同域名下发送 API 请求 ，那么代理某些 URL 会很有用。

#### 8.1、不修改路径

请求到 `/api/users` 现在会被代理到请求 http://localhost:3000/api/users。

```js
devServer: {
  proxy: {
    "/api": 'http://localhost:3000'
  }
}
```

#### 8.2、修改路径

```js
devServer: {
  proxy: {
    '/api1': {
      target: 'http://localhost:3000',
      pathRewrite: {
        '^/api': '',
        '^/home/name/api': '/home/name',
      },
    },
    '/api2': {
      target: 'http://localhost:4000',
      pathRewrite: {
        '^/api': '',
        '^/home/name/api': '/home/name',
      },
    },
  },
}
```

#### 8.3、onBeforeSetupMiddleware

`onBeforeSetupMiddleware` 在 `webpack-dev-server` 静态资源中间件处理之前，可以用于拦截部分请求返回特定内容，或者实现简单的数据 `mock`

```js
devServer: {
  onBeforeSetupMiddleware(devServer){// express()
      devServer.app.get('/api/users', (req, res) => {
        res.json([{ id: 1 }, { id: 2 }]);
      });
  }
}
```

