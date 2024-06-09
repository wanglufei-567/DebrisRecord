## webpack笔记（五）— webpack优化

### 一、引言

在现代前端开发中，**Webpack** 已经成为了一个不可或缺的前端工程构建工具。然而，随着项目**规模**的**扩大**和**复杂度**的**提高**，**Webpack** 的构建时间可能会变得越来越长，输出的文件也可能会变得越来越大，这就需要我们对 **Webpack** 进行深度优化

#### 1.1、为什么需要优化？

在 **Web** 开发中，**性能**是至关重要的，一个**高性能**的应用不仅可以提供更好的用户体验，还可以在一定程度上提高用户的转化率；因此，我们需要对 **Webpack** 进行优化，以提高应用的性能

#### 1.2、优化的目标

优化的主要目标是提高应用的**==加载速度==**和**==运行效率==**

具体来说，我们希望达到以下几个目标：

1. **提高构建速度**：通过优化 **Webpack** 的配置，减少构建的时间，==提高开发效率==
2. **减少输出文件的大小**：通过优化代码和资源的处理方式，减少输出文件的大小，==减少用户的下载时间==
3. **提高代码的运行效率**：通过优化代码的结构和运行方式，提高代码的运行效率，==提高应用的响应速度==

#### 1.3、优化的结果

经过优化后，我们可以期待以下的结果：

1. **更快的构建速度**：通过合理的配置和插件的使用，显著提高 **Webpack** 的构建速度
2. **更小的输出文件**：通过代码压缩、**Tree Shaking** 和代码分割等技术，显著减少输出文件的大小
3. **更高的运行效率**：通过代码优化和资源懒加载等技术，提高代码的运行效率

### 二、环境准备

为了能更加深刻的理解各种优化策略，需要一个具体前端工程来进行说明，这里创建一个 **React** 工程来为接下来的优化工作做准备

文件目录如下👇

```
optimize
├── .babelrc
├── .eslintrc.js
├── package.json
├── src
│   ├── index.html
│   └── index.tsx
├── tsconfig.json
└── webpack.config.js
```

`webpack.config.js` 如下👇

```js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    mode: 'development',
    entry: './src/index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'], // 模块引入时会自动添加这些后缀去找文件
    },
    devServer: {
        port: 9000,
    },
}
```

### 三、性能指标分析工具

为了直观的看到性能的变化，需要先安装一些性能指标分析工具：

- [progress-bar-webpack-plugin](https://www.npmjs.com/package/progress-bar-webpack-plugin)：查看编译进度
- [speed-measure-webpack-plugin](https://www.npmjs.com/package/speed-measure-webpack-plugin)：查看编译速度
- [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)：打包文件体积分析

#### 3.1、编译进度

大型项目的编译时间往往要很久，这个过程中若是想知道当前编译进展到哪个阶段了，可以通过 [progress-bar-webpack-plugin](https://www.npmjs.com/package/speed-measure-webpack-plugin) 插件查看编译进度

安装：

```shell
npm i -D progress-bar-webpack-plugin
```

`webpack.config.js` 中的配置方式：

```js
const path = require('path')
const chalk = require('chalk')

const ProgressBarPlugin = require('progress-bar-webpack-plugin')

module.exports = {
  // ...
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
        new ProgressBarPlugin({
            // 编译进度条
            format: 'build :msg [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
            clear: false,
        }),
    ],
  // ...
}
```

`format` 表示在终端中要展示内容的格式，其中几个关键信息如下:

- `:msg`：编译阶段

  > **Webpack** 的编译流程分为 4 个阶段：**setup**、**make**、**seal**、**emit**
  >
  > - **setup**：**Initialization（初始化）**
  >   - 读取并合并配置文件，初始化插件和配置项，创建 **Compiler** 对象
  > - **make**：**Compilation（编译）**
  >   - 从入口点出发，递归地解析所有依赖模块，构建模块依赖图 **ModuleGraph**
  >   - 其中包含以下子阶段：
  >     - **Building Modules（模块构建）**：对每个模块用对应的 **loader** 处理，将每个模块编译为适合在浏览器中运行的 **JavaScript**
  >     - **Tree Shaking（摇树优化）**：在模块构建阶段中，**Webpack** 会对每个模块进行分析，删除未引用的代码
  >     - **Code Splitting（代码分离）**：在模块构建过程中，**Webpack** 会根据配置进行代码分离，将模块拆分成不同的 **chunks**
  > - **seal**：**Optimization（优化）**
  >   - 对 **ModuleGraph** 做 **Chunk** 拆分，按照 **splitChunks** 的逻辑或者其他拆分逻辑，拆分后就生成了 **ChunkGraph**
  >   - 其中包含以下子阶段：
  >     - **Tree Shaking（摇树优化）**：在此阶段继续对模块和 **chunks** 进行优化，移除多余的代码
  >     - **Code Splitting（代码分离）**：进一步优化和分离代码块
  > - **emit**：**Output（输出）**
  >   - 将不同 **Chunk** 用不同的模版打印成最终代码，并输出到目标目录
  >   - 其中包含以下子阶段：
  >     - **Code Minification（代码压缩）**：在输出之前，**Webpack** 使用 **Terser** 等插件对 **JavaScript** 文件进行压缩

- `:bar`：进度条

- `:percent`：百分比

- `:elapsed`：已消耗的时间（以秒为单位）

展示效果：

![image-20240605084824675](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20240605084824675.png)

#### 2.2、编译速度

优化 **Webpack** 构建速度，首先需要知道是哪些 `plugin`、哪些 `loader` 耗时长，可以通过 [speed-measure-webpack-plugin](https://www.npmjs.com/package/speed-measure-webpack-plugin) 插件进行构建速度分析，可以看到各个 `plugin`、 `loader`的构建时长，后续可针对耗时长的`plugin`、 `loader` 进行优化

安装：

```shell
npm i -D speed-measure-webpack-plugin
```

`webpack.config.js` 中的配置方式：

```js
const path = require('path')
const chalk = require('chalk')

const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')

const smp = new SpeedMeasurePlugin() // 编译速度分析

module.exports = smp.wrap({
  // ...
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
        new ProgressBarPlugin({
            // 编译进度条
            format: 'build :msg [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
            clear: false,
        }),
    ],
  // ...
})
```

展示效果：

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20240605230404245.png" alt="image-20240605230404245" style="zoom:50%;" />

其中  `general output time` 主要是用来衡量 **Webpack** 从文件系统中读取数据的时间，但一般来说，它包含了[speed-measure-webpack-plugin](https://www.npmjs.com/package/speed-measure-webpack-plugin)  无法直接测量的所有时间

#### 2.3、打包文件体积分析

优化 **Webpack** 打包体积，也需要先分析打包文件中各个 **bundle** 文件的占比大小，后续再进行针对优化，可以使用  [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer) 来进行文件体积的分析

[webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)  是一个用于分析和可视化 **Webpack** 打包结果的工具

它的主要功能包括：

- 可视化报告：插件生成一个可视化报告，以图表和表格的形式展示构建产物的组成部分
  - 通过直观的界面展示模块的大小、占比和依赖关系，可以快速了解整个构建结果的结构
- 模块大小分析：插件可以帮助了解每个模块（包括 **JavaScript**、**CSS**、图片等）的大小
  - 可以识别出哪些些占用空间较大的模块，并采取相应的优化措施，例如压缩、代码拆分等
- 依赖关系可视化：展示模块之间的依赖关系
  - 以图形方式显示模块之间的引用关系，帮助更好地理解代码库中不同模块之间的关联性

安装：

```shell
npm i -D webpack-bundle-analyzer
```

`webpack.config.js` 中的配置方式：

```js
const path = require('path')
const chalk = require('chalk')

const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const smp = new SpeedMeasurePlugin() // 编译速度分析

module.exports = smp.wrap({
  // ...
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
        new ProgressBarPlugin({
            // 编译进度条
            format: 'build :msg [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
            clear: false,
        }),
        new BundleAnalyzerPlugin({
            // 打包体积分析
            analyzerMode: 'static',
        }),
    ],
  // ...
})
```

展示效果：

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20240605232902024.png" alt="image-20240605232902024" style="zoom:30%;" />

可以直观的看到 `react-dom` 这个模块在当前工程中文件体积最大

报告中有几个关键指标：

- `stat size`：文件的“**输入**”大小，即在进行任何转换（如压缩）之前的大小
- `parsed size`：文件的“**输出**”大小，如果使用了压缩插件，那么这个值反映的是代码的压缩后的大小
- `gzip size`：文件的 **gzip 压缩**后的大小，如果配置了 **gzip 压缩**，那么这个值将反映的是代码在用户的浏览器中实际加载的大小

### 三、加快构建速度

通过优化 **Webpack** 的配置，比如：减少查找范围、避免无用模块和重复打包、使用缓存和并行模式、开启多进程打包和压缩，可以大大减少构建的时间

#### 3.1、 降低 loader、plugins 的时间

每个的 `loader`，`plugin` 都有其启动时间，我们应该减少非必要的 `loader`，`plugin`，或者通过使用 `include` 和 `exclude` 来缩小  `loader`  的查找范围

##### 3.1.1、使用 Webpack 资源模块

**Webpack5** 引入了一种新的方式来处理**静态资源**，即[**资源模块(Asset Modules)**](https://webpack.docschina.org/guides/asset-modules/)，它允许使用资源文件（字体，图标等）而无需配置额外 `loader`

**Webpack5** 提供了四种资源模块类型，每种类型都有不同的用途和生成的产物形式，可以通过配置 `type` 属性设置资源导出类型：👇

- `asset/resource`
  - **功能**: 将资源文件作为==单独的文件==输出到输出目录，并返回该文件的 **URL**
  - **生成的产物形式**: 单独的文件，输出到构建目录中
  - **如何添加到 bundle 中**: 生成一个 **URL**（路径），该 **URL** 会被包含在生成的 **JavaScript** 或 **CSS** 文件中

- `asset/inline`
  - **功能**: 将资源文件作为 **base64** 编码的字符串==内联==到 **JavaScript** 文件中
  - **生成的产物形式**: 内联的 **base64** 编码字符串
  - **如何添加到 bundle 中**: 资源内容以 **base64** 编码的形式直接嵌入到引用它的模块中

- `asset/source`
  - **功能**: 将资源文件的源代码作为字符串导出
  - **生成的产物形式**: 资源文件的源代码字符串
  - **如何添加到 bundle 中**: 资源内容以字符串的形式==直接嵌入==到引用它的模块中
- `asset`
  - **功能**: 自动选择在 `resource` 和 `inline` 之间，默认情况下小于 8kb 的文件会作为 **base64** 内联，否则作为单独的文件输出
  - **生成的产物形式**: 小文件（默认小于 8kb）内联，大文件输出为单独文件
  - **如何添加到 bundle 中**: 小文件内联为 **base64**，大文件输出为 **URL**

配置示例：

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
     {
        test: /\.png$/, // 会把png图片自动拷贝到输出目录中，并返回新路径或者说名称
        type: 'asset/resource',
        generator: {
          filename: 'png/[hash][ext]'
        }
      },
      {
        test: /\.ico$/, // 会把ico文件变成base64字符串并返回给调用者
        type: 'asset/inline'
      },
      {
        test: /\.txt$/, // 会把txt内容直接返回
        type: 'asset/source'
      },
      {
        test: /\.svg$/,
        type: 'asset/resource'
      },
      {
        test: /\.jpg$/,
        type: 'asset', // 表示可以根据实际情况进行自选择是resource还inline
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 
          }
        },
        generator: {
          filename: 'jpg/[hash][ext]'
        }
      }
    ],
  },
};
```

以`asset/resource`举例说明使用效果：

<!--在React工程中不太容易看出资源文件最终是如何添加到bundle中的，所以下面的例子是一个简单说明-->

假设有一个简单的项目结构如下：

```lua
project/
│
├── src/
│   ├── index.js
│   └── logo.png
├── dist/
│   └── (generated files will be here)
├── package.json
└── webpack.config.js
```

`webpack.config.js` 内容如下：

```js
const path = require('path');

module.exports = {
// ...
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
};
```

入口文件`src/index.js`内容如下：

```js
import logo from './logo.png';
const img = document.createElement('img');
img.src = logo; // 这里的 logo 后面会变成 Webpack 处理后生成的 URL
document.body.appendChild(img);
```

**Webpack** 构建完成后，会在 `dist` 目录下生成以下文件：

- `bundle.js`：包含所有 **JavaScript** 代码
- `logo.png`：被单独输出的图片文件，可能会被重命名以包含哈希值，例如 `logo.123456.png`

在 `bundle.js` 文件中，会看到类似如下的代码：<!--经过简化和格式化-->

```js
// 生成的文件 URL 被直接包含在 JavaScript 代码中
var logo = __webpack_require__("./logo.png");
var img = document.createElement('img');
img.src = logo; // logo 变量包含生成的图片文件的 URL
document.body.appendChild(img);
```

 这里，`__webpack_require__("./logo.png")` 会返回图片的 URL，例如 `/dist/logo.123456.png`

##### 3.1.2、缩小 loader 查找范围

通过 `include` 和 `exclude` 可以限制 `loader` 的应用范围，避免不必要的文件处理，从而提高构建速度

例如：

- 避免对 `node_modules` 目录中的文件进行处理，因为这些文件通常已经是编译好的，不需要再次处理
- 避免对特定的目录或文件进行处理，这些目录或文件可能包含大型文件或第三方库，不需要进行额外的编译

`webpack.config.js` 中的配置方式：

```js
module.exports = {
  // ...
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
        ],
    },
  // ...
}
```

##### 3.1.3、使用 noParse 跳过模块解析

`module.noParse` 用于告诉 **Webpack** 不要解析某些模块，比如那些已经被打包好的第三方库，因为这些文件没有依赖关系不需要进行模块依赖解析，这样可以显著提高构建速度

`module.noParse` 主要用于以下几种情况：

1. **大型第三方库**：如 **jQuery**、**Lodash** 等，这些库通常已经被打包和压缩过，不需要再被 **Webpack** 解析
2. **打包好的文件**：如已经被编译和打包的 **JavaScript** 文件，通常也不需要解析

`webpack.config.js` 中的配置方式：

```js
module.exports = {
  module: {
    noParse: [
      /jquery|lodash/, // 使用正则表达式匹配 jQuery 和 Lodash
      path.resolve(__dirname, 'node_modules/some-lib/dist/some-lib.min.js'), // 使用字符串指定具体文件路径
    ],
  },
};

```

<!-- 需要注意⚠️的是，使用 noParse 进行忽略的模块文件中不能使用 import、require、define 等进行依赖导入 -->

#### 3.2、优化 resolve、modules 配置

**Webpack** 的 [resolve](https://webpack.docschina.org/configuration/resolve/#root) 配置项用于设置模块解析方式，可通过优化 `resolve` 配置来覆盖默认配置项，减少解析范围

##### 3.2.1、alias

`alias` 可以创建 `import` 或 `require` 的别名，用来简化模块引入

`webpack.common.js` 配置方式如下：

```javascript
module.exports = {
    resolve: {
        alias: {
          '@': paths.appSrc, // @ 代表 src 路径
        },
    }
}
```

##### 3.2.2、extensions

`extensions` 表示需要解析的文件类型列表

根据项目中的文件类型，定义 `extensions`，以覆盖 **Webpack** 默认的 `extensions`，加快解析速度

由于 **Webpack** 的解析顺序是从左到右，因此要将使用频率高的文件类型放在左侧，如下将 `tsx` 放在最左侧

`webpack.common.js` 配置方式如下：

```javascript
module.exports = {
    resolve: {
        extensions: ['.tsx', '.js'],
    }
}
```

##### 3.2.3、symlinks

如果项目不使用 `symlinks`（例如 `npm link` 或者 `yarn link`），可以设置 `resolve.symlinks: false`，减少解析工作量

`webpack.common.js` 配置方式如下：

```javascript
module.exports = {
    resolve: {
        symlinks: false,
    },
}
```

##### 3.2.4、modules

`modules` 表示 **Webpack** 解析模块时需要解析的目录

指定目录可缩小 **Webpack** 解析范围，加快构建速度

`webpack.common.js` 配置方式如下：

```javascript
module.exports = {
    modules: [
      'node_modules',
       paths.appSrc,
    ]
}
```

#### 3.3、多进程打包

**Wepack** 的 [thread-loader](https://webpack.docschina.org/loaders/thread-loader/#root) 可以将部分 `loader` 的工作转移到子进程中，从而加快处理速度，适用于需要大量 **CPU** 资源的 `loader`，例如处理 **Babel**、**TypeScript** 等

安装：

```bash
npm install --save-dev thread-loader
```

`webpack.config.js` 中的配置方式：

```js
module.exports = smp.wrap({
  // ...
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                    },
                    {
                        loader: 'thread-loader',
                        options: {
                            workers: 2, // 开启两个 worker 线程
                        },
                    },
                ],
            },
        ],
    },
  // ...
})

```

<!--需要注意的是，启动子进程同样需要时间，只有当某个 loader 的耗时成为 Webpack 构建速度的瓶颈时，使用 thread-loader 才是比较合适的-->

#### 3.5、缓存机制 （重点❗）

**Webpack** 的 `cache` 机制通过缓存生成的 `webpack` 模块和 `chunk`，来改善构建速度

**Webpack**  的 `cache` 机制包括**==内存缓存==**和**==文件系统缓存==**两种类型：

- 内存缓存是在构建过程中存储在内存中的缓存
- 文件系统是缓存可在存储在磁盘上，从而实现持久缓存

`webpack.config.js` 中的配置方式：只需添加 `cache` 配置项👇

```js
const path = require('path');

module.exports = {
  // ...
  cache: {
    type: 'filesystem', // 使用文件系统缓存
    cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack'), // 缓存目录
    buildDependencies: {
      config: [__filename], // 以当前配置文件作为缓存失效依赖
    },
    hashAlgorithm: 'md5', // 使用 md5 哈希算法
    compression: false, // 不启用压缩
    store: 'pack', // 默认存储方式
    managedPaths: ['node_modules'], // 默认的管理路径
    immutablePaths: [], // 默认的不可变路径
  },
};

```

 `cache` 选项的配置参数说明如下：👇

- `type`

  - **`memory`**: 使用内存缓存，默认选项

  - **`filesystem`**: 使用文件系统缓存，适用于需要跨构建会话持久化缓存的场景

- `cacheDirectory`
  - 指定缓存目录，仅在 `filesystem` 类型下有效
    - 默认值是 `node_modules/.cache/webpack`

- `cacheLocation`
  - 与 `cacheDirectory` 类似，但可以更灵活地指定缓存的路径，包括文件名

- `hashAlgorithm`
  - 用于生成缓存文件名的哈希算法
    - 默认是 `md4`，可以更改为任何支持的哈希算法（如 `md5`, `sha256`）

- `buildDependencies`
  - 指定影响缓存失效的构建依赖项，通常用于配置文件、环境变量等

- `managedPaths` 和 `immutablePaths`这两个选项用于优化缓存管理：

  - `managedPaths`: 指定哪些路径下的模块不会被缓存
    - 默认值是 `['node_modules']`，因为它们是由包管理器管理的，不会频繁变动

  - `immutablePaths`: 这些路径下的内容被认为是不可变的，不需要重新计算

- `compression`
  - 是否启用缓存压缩
    - 压缩可以减少缓存文件的大小，但会增加压缩和解压缩的开销

- `store`
  - 指定如何存储缓存数据
    - 默认是 `pack`，可以改为 `idle`（空闲时存储），以减少构建时的存储开销

配置缓存之后效果如下👇

![image-20240608223621371](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20240608223621371.png)

可以发现配置缓存之后的首次构建时间会比之前增加 30% 左右，但是二次构建时时间减少了50% 

<!--这个数据是基于之前创建的 React 工程，每个工程的时间减少程度会不一致，但是会明显比不配置缓存要快很多-->

### 四、减小文件体积

#### 4.1、使用 CDN

> CDN称之为内容分发网络（Content Delivery Network或Content Distribution Network，缩写：CDN），它是指通过相互连接的网络系统，利用最靠近每个用户的服务器， 更快、更可靠地将音乐、图片、视频、应用程序及其他文件发送给用户

在工程中若是想使用 **CDN** 来加载某些模块，而不是将这些模块打包到你的 **bundle** 中，可以使用 `externals` 配置来跳过这些模块的解析，并通过 `HtmlWebpackPlugin` 插件将 **CDN** 引入到打包产物中

`webpack.config.js` 中的配置方式：

1. 使用 `externals` 配置

   - `externals` 配置项可以告诉 **Webpack** 某些模块不需要打包，而是在运行时从外部（如 **CDN**）获取

     > - `externals`：用于指定哪些模块不需要被打包，而是从外部环境（例如 **CDN**）中获取
     >   - **Webpack** 在构建时会跳过这些模块，并在**运行时**通过全局变量从外部环境中加载它们
     > - `noParse`：用于指定哪些模块不需要进行依赖解析
     >   - **Webpack** 在构建时会将这些模块视为独立文件，从而跳过依赖解析，但这些模块仍然会被打包到最终的 **bundle** 中

     ```js
     module.exports = {
       // ...
       externals: {
         // 键是模块名，值是外部全局变量名，打包产物会在运行时从全局对象（通常是 window）上取值
         // 例如，import React from 'react' 被编译之后会通过 window.React 访问 react 模块
         'react': 'React',
         'react-dom': 'ReactDOM'
       }
     };
     ```

2. 通过 `html-webpack-plugin` 插件在 **HTML** 中引入 **CDN** 脚本

   1. 首先，创建一个模板 **HTML** 文件（例如 `template.html`），并在其中添加一个 **script** 标签来引入 **CDN** 上的库，例如：

   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <title>My App</title>
     <script src="https://cdnjs.cloudflare.com/ajax/libs/react/17.0.2/umd/react.production.min.js"></script>
   </head>
   <body>
     <div id="app"></div>
   </body>
   </html>
   ```

   2. 然后，在 `webpack.config.js` 中，配置 `html-webpack-plugin` 插件使用这个模板，例如：

   ```javascript
   const HtmlWebpackPlugin = require('html-webpack-plugin');
   const path = require('path');
   
   module.exports = {
     // ...
     plugins: [
       new HtmlWebpackPlugin({
         template: path.resolve(__dirname, 'path/to/your/template.html'), // 使用模板文件
       }),
     ],
   };
   ```

   这样配置后，`html-webpack-plugin` 插件就会根据模板文件生成 **HTML** 文件，并自动引入 **Webpack** 打包后的 **JS** 和 **CSS** 文件，同时也会引入在模板文件中指定的 **CDN** 库

#### 4.2、Tree Shaking（摇树优化）

[Tree Shaking](https://webpack.docschina.org/guides/tree-shaking/) 是一种用于**删除未使用代码（Dead Code**）的技术，主要用于 **JavaScript** 应用程序的打包和优化，其目标是减少最终输出的文件体积，从而提升加载速度和执行性能

**Tree Shaking** 名字的灵感来源于摇树的过程，通过抖动树木，未附着的叶子会掉落，留下那些紧紧抓住的叶子，同样，**Tree Shaking** 通过分析代码依赖关系，删除未被使用的代码部分

**Dead Code** 一般具有以下几个特征：

- 代码不会被执行，不可到达
- 代码执行的结果不会被用到
- 代码只会影响死变量（只写不读）

在 **Webpack5** 中，**Tree Shaking** 是默认在生产模式下启用的，但是默认情况下，**Webpack** 会假设所有模块都**可能有副作用**，因此不会轻易地移除任何模块

可以通过在 `package.json` 中配置 `sideEffects` 字段，告诉 **Webpack** 哪些文件或模块有副作用的

> `package.json` 中的 `sideEffects` 字段是 **Webpack** 用来标识哪些文件或模块有副作用的
>
> **副作用**是指文件在被导入时，会产生一些全局的影响或修改其他模块或全局状态的行为
>
> `sideEffects` 字段有助于 **Webpack** 更好地进行 **Tree Shaking**，从而删除未使用的代码

`sideEffects` 的配置方式：

1. **`sideEffects: false`**

   当所有模块都没有副作用时，可以将 `sideEffects` 设置为 `false`，这意味着整个工程中的所有模块都可以进行 **Tree Shaking**

   ```json
   {
     "name": "your-project",
     "version": "1.0.0",
     "main": "index.js",
     "sideEffects": false
   }
   ```

2. **`sideEffects: true`**

   不确定哪些模块有副作用时，可以将 `sideEffects` 设置为 `true`，这意味着 **Webpack** 不会进行任何模块的 **Tree Shaking**

   ```json
   {
     "name": "your-project",
     "version": "1.0.0",
     "main": "index.js",
     "sideEffects": true
   }
   ```

3. **指定有副作用的文件**

   当大多数模块没有副作用，但有一些特定的文件有副作用时，可以通过数组来列出有副作用的文件路径**Webpack** 会对这些列出的文件保留处理，而其他没有副作用的文件则会进行 **Tree Shaking**

   ```json
   {
     "name": "your-project",
     "version": "1.0.0",
     "main": "index.js",
     "sideEffects": [
       "./src/someFileWithSideEffects.js",
       "./src/anotherFileWithSideEffects.css"
     ]
   }
   ```

#### 4.3、Code Splitting（代码分离）

[SplitChunksPlugin](https://webpack.docschina.org/plugins/split-chunks-plugin) 是 **Webpack** 内置的插件，用于优化和分割代码块（**chunks**），它的主要目的是将公共模块提取到单独的文件中，从而减少代码的重复，优化浏览器缓存，提升加载性能

**SplitChunksPlugin 的作用**：

1. **减少重复代码**：将应用程序中共享的依赖提取到单独的文件中，避免重复加载相同的模块
2. **提高缓存效率**：分离出的公共模块可以被浏览器缓存，从而在后续的页面加载中直接使用缓存，减少加载时间
3. **优化加载顺序**：按需加载代码块，减少初始加载体积，提高首屏渲染速度

**Wepack5** 中`SplitChunksPlugin` 是默认开启的，但默认情况下，它只会影响到**按需加载**的 **chunks**

**SplitChunksPlugin 的配置参数**：

```js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'async', // 仅分割异步加载的代码块
      minSize: 20000, // 模块的最小大小，单位为字节
      minRemainingSize: 0, // 确保拆分后块的最小大小
      minChunks: 1, // 模块被引用的最少次数
      maxAsyncRequests: 30, // 按需加载时的最大并行请求数
      maxInitialRequests: 30, // 入口点的最大并行请求数
      enforceSizeThreshold: 50000, // 强制执行拆分的大小阈值
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/, // 匹配第三方模块
          priority: -10, // 优先级，数值越大优先级越高
          reuseExistingChunk: true, // 允许重用现有的代码块
        },
        default: {
          minChunks: 2, // 至少被两个模块引用才会被分割
          priority: -20, // 优先级
          reuseExistingChunk: true, // 允许重用现有的代码块
        },
      },
    },
  },
};

```

**配置参数说明**：

1. **chunks**：决定哪些 **chunks** 会被选优化
   -  `'async'`：默认值，表示只对异步加载的 **chunks** 进行优化
     - 异步加载的 **chunks** 通常是那些通过动态导入`import()`加载的代码块
   -  `'initial'` ：表示只对同步加载的 **chunks** 进行优化
     - 同步加载的 **chunks** 通常是那些在页面加载时就加载的代码块，
     - 例如通过`<script>`标签引入的代码块
   -  `'all'`：表示对所有的 **chunks** 进行优化，无论它们是同步加载的还是异步加载的
2. **minSize**：决定了生成 **chunk** 的最小体积（以`bytes`为单位）
   - 默认值为 `20000` 字节，表示只有当 **chunk** 的体积大于 20KB 时，才会被拆分
3. **minRemainingSize**：决定了生成 **chunk** 所需的主 **chunk**（**bundle**）的最小体积
   - 默认值为 `0`
4. **minChunks**：决定了拆分前必须共享模块的最小 **chunks** 数
   - 默认值为 `1`，表示只有当一个模块被至少一个 **chunk** 使用时，才会被拆分

#### 4.4、Code Minification（代码压缩）

[TerserWebpackPlugin](https://webpack.docschina.org/plugins/terser-webpack-plugin/) 是 **Webpack5**  中内置的一个代码压缩插件，它使用 **Terser** 来压缩和最小化工程中的**JavaScript** 代码，生产环境中默认开启

**TerserWebpackPlugin 的配置参数**：

```javascript
const TerserPlugin = require('terser-webpack-plugin');
module.exports = {
    optimization: {
        minimizer: [
            new TerserPlugin({
              test: /\\.js(\\?.*)?$/i, // 匹配文件的测试条件，默认值为/\\.m?js(\\?.*)?$/i
              include: /\\/includes/, // 需要包含的文件
              exclude: /\\/excludes/, // 需要排除的文件
              parallel: true, // 是否使用多进程并行运行以提高构建速度。默认值为true
              terserOptions: { // 传递给 Terser 的压缩选项，可以配置更多 Terser 的参数
                compress: { // 用于配置代码压缩的选项
                  ecma: 5,
                  warnings: false,
                  comparisons: false,
                  inline: 2,
                },
                output: { // 用于配置输出选项
                  ecma: 5,
                  comments: false,
                  ascii_only: true,
                },
              },
            }),
        ]
    }
}
```

### 五、提高运行效率

#### 5.1、按需加载

通过 **Webpack** 提供的 [import() 语法](https://webpack.docschina.org/api/module-methods/#import-1) 功能进行代码分离，通过按需加载，可以大大提升网页加载速度

使用方式如下：

```javascript
export default function App () {
    return (
        <div>
            hello react 111
            <Hello />
            <button onClick={() => import('lodash')}>加载lodash</button>
        </div>
    )
}
```





