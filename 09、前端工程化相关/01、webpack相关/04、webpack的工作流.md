## webpack笔记（四）— webpack的工作流

### 一、前言

### 1.1、使用webpack API

**webpack**的构建不仅可以通过**webpack-cli**来触发，还可以通过使用**API**的方式触发

看下示例

`debugger.js`

```js
const webpack = require('webpack');
const webpackConfig = require('./webpack.config');
const compiler = webpack(webpackConfig);
//执行`Compiler`对象的 run 方法开始执行编译
compiler.run((err, stats) => {
  if (err) {
    console.log(err);
  } else {
    //stats代表统计结果对象
    console.log(
      stats.toJson({
        files: true, //代表打包后生成的文件
        assets: true, //其它是一个代码块到文件的对应关系
        chunks: true, //从入口模块出发，找到此入口模块依赖的模块，或者依赖的模块依赖的模块，合在一起组成一个代码块
        modules: true //打包的模块
      })
    );
  }
});

```

`webpack`本身就是一个函数，将配置文件`webpack.config.js`传递给`webpack`方法可以得到一个`compiler`对象，通过调用`compiler.run`便可以开始进行编译并完成构建

看下打包的文件

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230315093723542.png" alt="image-20230315093723542" style="zoom:50%;" />

可以看到和使用`webpack-cli`是一样的效果

### 1.2、webpack工作流中的核心概念

**webpack**工作流中有许多很重要的概念，它们是`webpack`实现各种功能的核心

- **compiler**：==**webpack**的编译器，用于编译整个项目==
  - 在**webpack**启动时，会创建一个`compiler`对象，==该对象包含了整个webpack配置和所有插件的信息==，包括 `options`、`loaders`、`plugins` 这些信息，这个对象在 **webpack** 启动的时候被实例化，它是全局唯一的，可以简单地把它理解为 `webpack` 实例
  - `compiler`对象提供了各种钩子函数（`Hooks`），用于==监听和控制**webpack**编译过程的不同阶段==，例如读取配置文件、解析入口文件、打包输出等。==用户可以通过编写插件并监听`compiler`的钩子函数，来实现对**webpack**编译过程的控制和扩展== <!--插件中可以拿到compiler对象-->
- **compilation**：==**webpack**的编译上下文，用于表示一次编译过程中的所有资源和状态==
  - ==在每次编译时，都会创建一个`compilation`对象==，该对象包含了编译过程中的==模块资源(`modules`)==、编译==生成资源(`asset files)`==、==变化的文件(`files`)==、以及==被跟踪依赖的状态信息(`fileDependencies`)==等信息
  - 当 **webpack** 以开发模式运行时，每当检测到一个变化，一次新的 `compilation` 将被创建。`compilation` 对象也提供了很多事件回调供插件做扩展。<!--通过 compilation 也可以读取到 compiler 对象-->
- **tapable**：==**webpack**的事件处理器，用于实现事件的发布和订阅==
  - **tapable**是**webpack**的一个核心工具，它暴露了 `tap`、`tapAsync`、`tapPromise` 方法，可以使用这些方法来触发 `compiler` 钩子，使得插件可以监听 **webpack** 在运行过程中广播的事件，然后通过 `compiler` 对象去操作**webpack**。我们也可以使用这些方法注入自定义的构建步骤，这些步骤将在整个编译过程中的不同时机触发。
- **chunk**： ==**webpack**中的代码块，表示一组相关联的模块，例如一个入口文件及其所有依赖的模块==
- **bundle**：==**webpack**中的打包文件，表示经过处理和打包后的最终输出文件==。
  - **webpack**可以生成多个`bundle`，例如每个入口文件对应一个`bundle`，或者根据代码分割和动态导入生成多个`bundle`等

### 1.3、webpack工作流

![2020webpackflow](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/webpackflow2020.jpg)

**webpack**的整体工作流程：

1. 初始化参数：从==配置文件和 Shell 语句中读取并合并参数==,得出最终的配置对象
2. 用上一步得到的参数==初始化 **Compiler** 对象==
3. ==加载所有配置的插件==
4. 执行对象的 `run` 方法==开始执行编译==
5. 根据配置中的`entry`找出==入口文件==
6. 从入口文件出发,调用所有配置的`Loader`对模块==进行编译==
7. 再找出==该模块依赖的模块==，再==递归本步骤==直到==所有入口依赖的文件==都经过了本步骤的处理
8. ==根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 **Chunk**==
9. 再把每个**Chunk** 转换成一个单独的文件加入到输出列表 <!--files中-->
10. 在确定好输出内容后，根据配置确定输出的路径和文件名，把文件内容写入到文件系统 <!--写入文件-->

### 二、实现webpack工作流

先准备下配置文件

`webpack.config.js`

```js
const path = require('path');
const Run1Plugin = require('./plugins/run1-plugin');
const Run2Plugin = require('./plugins/run2-plugin');
const DonePlugin = require('./plugins/done-plugin');
module.exports = {
  mode: 'development',
  devtool: false,
  cache: {
    type :'filesystem'
  },
  entry: {
    entry1: './src/entry1.js',
    entry2:'./src/entry2.js'//name就是此模块属于哪个模块
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename:'[name].js' // 默认是main.js；[name]会被替换为entry中的文件名
  },
  resolve: {
    extensions:['.js','.jsx','.ts','.tsx']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          //最左则的loader需要返回合法的JS
          path.resolve(__dirname, 'loaders/loader2.js'),
          //最右侧的loader拿到的是源代码
          path.resolve(__dirname, 'loaders/loader1.js')
        ]
      }
    ]
  },
  plugins: [
    //插件的挂载或者说监听是在编译启动前全部挂载的
    new Run1Plugin(),
    new Run2Plugin(),
    new DonePlugin()
   ]
}
```

`plugins\run-plugin.js`

```js
class RunPlugin {
  //每个插件都是一个类，而每个类都需要定义一个apply方法
  apply(compiler) {
    compiler.hooks.run.tap("RunPlugin", () => {
      console.log("run:开始编译");
    });
  }
}
module.exports = RunPlugin;
```

`plugins\done-plugin.js`

```js
class DonePlugin {
  //每个插件都是一个类，而每个类都需要定义一个apply方法
  apply(compiler) {
    compiler.hooks.done.tap("DonePlugin", () => {
      console.log("done:结束编译");
    });
  }
}
module.exports = DonePlugin;
```

`loaders\logger1-loader.js`

```js
function loader(source) {
  return source + "//logger1"; //let name= 'entry1';/logger1
}
module.exports = loader;
```

`loaders\logger2-loader.js`

```js
function loader(source) {
  //let name= 'entry1';
  return source + "//logger2"; //let name= 'entry1';//logger1///logger2
}
module.exports = loader;
```

`src\entry1.js`

```js
let title = require("./title");
console.log("entry12", title);
```

`src\entry2.js`

```js
let title = require("./title.js");
console.log("entry2", title);
```

`src\title.js`

```js
module.exports = "title";
```

------

接下来实现一个简易版本的`webpack`

创建一个`webpack`方法，接收配置文件中的配置信息

`webpack2.js`

```js
const Compiler = require('./Compiler');

/**
 * @description webpack方法
 * @params options 配置文件中的配置信息
 */
function webpack(options) {

}

module.exports = webpack;
```

**1、初始化参数：从==配置文件和 Shell 语句中读取并合并参数==,得出最终的配置对象**

```diff
/**
 * @description webpack方法
 * @params options 配置文件中的配置信息
 */
function webpack(options) {
+  //argv[0]是Node程序的绝对路径 argv[1] 正在运行的脚本
+  const argv = process.argv.slice(2);
+  const shellOptions = argv.reduce((shellOptions, options) => {
+    // options = '--mode=development'
+    const [key, value] = options.split('=');
+    shellOptions[key.slice(2)] = value;
+    return shellOptions;
+  }, {});
+  const finalOptions = { ...options, ...shellOptions };
}

module.exports = webpack;
```

**webpack**的配置对象是由配置文件`webpack.config.js`和**Shell**语句中参数组合而成

**Shell**语句中的参数可以通过`process.argv`拿到，但是前两项是命令的路径可以直接跳过从第三项开始处理，`process.argv.slice(2)`，`shell`中的参数长这个样子：`'--mode=development'`

打印看下最后的配置项`finalOptions`

```js
finalOptions {
  mode: 'development',
  devtool: false,
  cache: { type: 'filesystem' },
  entry: { entry1: './src/entry1.js', entry2: './src/entry2.js' },
  output: {
    path: '/Users/wangdong/workData/DaliyRecord/05.构建工具相关/01.webpack相关/04.flow/dist',
    filename: '[name].js'
  },
  resolve: { extensions: [ '.js', '.jsx', '.ts', '.tsx' ] },
  module: { rules: [ [Object] ] },
  plugins: [ RunPlugin {}, RunPlugin {}, DonePlugin {} ]
}
```

------

**2、用上一步得到的参数初始化 ==Compiler 对象==**

```diff
+const Compiler = require('./Compiler');

/**
 * @description webpack方法
 * @params options 配置文件中的配置信息
 */
function webpack(options) {
  //argv[0]是Node程序的绝对路径 argv[1] 正在运行的脚本
  const argv = process.argv.slice(2);
  const shellOptions = argv.reduce((shellOptions, options) => {
    // options = '--mode=development'
    const [key, value] = options.split('=');
    shellOptions[key.slice(2)] = value;
    return shellOptions;
  }, {});
  const finalOptions = { ...options, ...shellOptions };
  console.log('finalOptions', finalOptions)

+  //2.用上一步得到的参数初始化 `Compiler` 对象
+  const compiler = new Compiler(finalOptions);

+  return compiler;
}

module.exports = webpack;

```

`Compiler.js`

```js
const { SyncHook } = require('tapable');

class Compiler{
  constructor(options) {
    this.options = options;
    this.hooks = {
      run: new SyncHook(),//在开始编译之前调用
      done:new SyncHook() //在编译完成时执行
    }
  }
}
module.exports = Compiler;
```

示例化一个`Compiler`对象，将配置信息挂到`Compiler`对象的`options`属性上

另外引入`tapable`给`Compiler`对象`hooks`属性上添加钩子函数 <!--webpack内部依赖tapable-->

> 下面是一段简易版本的`tapable`
>
> ```js
> class SyncHook {
>   constructor() {
>     this.taps = [];
>   }
>   tap(name, fn) {
>     this.taps.push(fn);
>   }
>   call() {
>     this.taps.forEach((tap) => tap());
>   }
> }
> 
> let hook = new SyncHook();
> hook.tap("some name", () => {
>   console.log("some name");
> });
> 
> class Plugin {
>   apply() {
>     hook.tap("Plugin", () => {
>       console.log("Plugin ");
>     });
>   }
> }
> new Plugin().apply();
> hook.call();
> ```
>
> `tapable`中采用了发布订阅的设计模式，通过`hook.tap`进行事件订阅，通过`hook.call`完成事件发布

------

**3、==加载所有配置的插件==**

```diff
const Compiler = require('./Compiler');

/**
 * @description webpack方法
 * @params options 配置文件中的配置信息
 */
function webpack(options) {
  // 1.初始化参数：从配置文件和 Shell 语句中读取并合并参数,得出最终的配置对象

  //argv[0]是Node程序的绝对路径 argv[1] 正在运行的脚本
  const argv = process.argv.slice(2);
  const shellOptions = argv.reduce((shellOptions, options) => {
    // options = '--mode=development'
    const [key, value] = options.split('=');
    shellOptions[key.slice(2)] = value;
    return shellOptions;
  }, {});
  const finalOptions = { ...options, ...shellOptions };
  console.log('finalOptions', finalOptions)

  //2.用上一步得到的参数初始化 `Compiler` 对象
  const compiler = new Compiler(finalOptions);

+  // //3.加载所有配置的插件
+  const { plugins } = finalOptions;
+  for (let plugin of plugins) {
+    plugin.apply(compiler);
+  }

  return compiler;
}

module.exports = webpack;

```

从配置信息中取得所有的插件，将`Compiler`对象传递给插件，加载所有的插件

看下配置文件中的插件信息，可以发现都是一个插件的实例化对象

`webpack.config.js`

```js
plugins: [
  //插件的挂载或者说监听是在编译启动前全部挂载的
  new Run1Plugin(),
  new Run2Plugin(),
  new DonePlugin()
 ]
```

`plugins\run-plugin.js`

```js
class RunPlugin {
  //每个插件都是一个类，而每个类都需要定义一个apply方法
  apply(compiler) {
    compiler.hooks.run.tap("RunPlugin", () => {
      console.log("run:开始编译");
    });
  }
}
module.exports = RunPlugin;
```

在插件中通过`Compiler`对象可以调用各种钩子函数

------

**4、执行对象的 `run` 方法==开始执行编译==**

将`debugger.js`中的`webpack`替换成自己实现的`webpack2`

```diff
+ const webpack = require('./webpack2');
const webpackConfig = require('./webpack.config');
const compiler = webpack(webpackConfig);
//4.执行`Compiler`对象的 run 方法开始执行编译
compiler.run((err, stats) => {
  if (err) {
    console.log(err);
  } else {
    //stats代表统计结果对象
    console.log(
      stats.toJson({
        files: true, //代表打包后生成的文件
        assets: true, //其它是一个代码块到文件的对应关系
        chunks: true, //从入口模块出发，找到此入口模块依赖的模块，或者依赖的模块依赖的模块，合在一起组成一个代码块
        modules: true //打包的模块
      })
    );
  }
});

```

调用`webpack`方法得到`compiler`对象，再调用`compiler`对象`run`方法

`Compiler.js`

```js
const { SyncHook } = require('tapable');
const Compilation = require('./Compilation');
const fs = require('fs');
const path = require('path');

class Compiler {
  constructor(options) {
    this.options = options;
    this.hooks = {
      run: new SyncHook(), //在开始编译之前调用
      done: new SyncHook() //在编译完成时执行
    };
  }
  run(callback) {
    //在编译开始前触发run钩子执行
    this.hooks.run.call();

    //在编译的过程中会收集所有的依赖的模块或者说文件
    const onCompiled = (err, stats, fileDependencies) => {

      // 执行用户的回调
      callback(err, { toJson: () => stats });

      //监听依赖的文件变化，如果依赖的文件变化后会开始一次新的编译
      for (let fileDependency of fileDependencies) {
        fs.watch(fileDependency, () => this.compile(onCompiled));
      }

      //在编译完成时触发done钩子执行
      this.hooks.done.call();
    };

    //调用compile方法进行编译
    this.compile(onCompiled);
  }

  //开启一次新的编译
  compile(callback) {
    //每次编译 都会创建一个新的Compilation实例
    let compilation = new Compilation(this.options, this);
    compilation.build(callback);
  }
}
module.exports = Compiler;
```

`run`方法便是**webpack**的编译方法，可以在`run`方法中执行钩子函数

```js
this.hooks.run.call();
this.hooks.done.call();
```

真正执行编译工作的是`Compilation`对象的`build`方法

`Compilation.js`

```js
class Compilation {
  constructor(options, compiler) {
    this.options = options;
    this.compiler = compiler;
    this.modules = [];//这里放置本次编译涉及的所有的模块
    this.chunks = [];//本次编译所组装出的代码块
    this.assets = {};//key是文件名,值是文件内容
    this.files = [];//代表本次打包出来的文件
    this.fileDependencies =new Set();//本次编译依赖的文件或者说模块
  }
  build(callback) {
    //...
  }
}
```

------

**5、根据配置中的`entry`找出==入口文件==**

`Compilation.js`

```diff
class Compilation {
  constructor(options, compiler) {
    this.options = options;
    this.compiler = compiler;
    this.modules = [];//这里放置本次编译涉及的所有的模块
    this.chunks = [];//本次编译所组装出的代码块
    this.assets = {};//key是文件名,值是文件内容
    this.files = [];//代表本次打包出来的文件
    this.fileDependencies =new Set();//本次编译依赖的文件或者说模块
  }
  build(callback) {
+    //5.根据配置中的entry找出入口文件
+    let entry = {};
+    if (typeof this.options.entry === 'string') {
+      entry.main = this.options.entry;
+    } else {
+      entry = this.options.entry;
+    }
 );
}
module.exports = Compilation;
```

------

**6、从入口文件出发,调用所有配置的`Loader`对模块==进行编译==**

**7、再找出==该模块依赖的模块==，再==递归本步骤==直到==所有入口依赖的文件==都经过了本步骤的处理**

**8、==根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 Chunk==**

**9、==再把每个Chunk 转换成一个单独的文件加入到输出列表==**

`Compilation.js`

```js
const path = require('path');
const fs = require('fs');
const parser = require('@babel/parser');
const types = require('@babel/types');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;

//处理baseDir，将'\'替换成'/'
const baseDir = normalizePath(process.cwd());
function normalizePath(path) {
  return path.replace(/\\/g, '/');
}
class Compilation {
  constructor(options, compiler) {
    this.options = options;
    this.compiler = compiler;
    this.modules = []; //这里放置本次编译涉及的所有的模块
    this.chunks = []; //本次编译所组装出的代码块
    this.assets = {}; //key是文件名,值是文件内容
    this.files = []; //代表本次打包出来的文件
    this.fileDependencies = new Set(); //本次编译依赖的文件或者说模块
  }

  build(callback) {
    //5.根据配置中的entry找出入口文件
    let entry = {};
    if (typeof this.options.entry === 'string') {
      entry.main = this.options.entry;
    } else {
      entry = this.options.entry;
    }

    // 遍历所有的入口文件
    for (let entryName in entry) {
      //处理入口文件的文件路径
      let entryFilePath = path.posix.join(baseDir, entry[entryName]);
      this.fileDependencies.add(entryFilePath);

      //6.从入口文件出发,调用所有配置的Loader对模块进行编译
      // 得到入口文件对应的模块
      let entryModule = this.buildModule(entryName, entryFilePath);

      //8.根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 Chunk
      // 有几个入口，就有几个chunk
      let chunk = {
        name: entryName,
        entryModule,
        modules: this.modules.filter(module =>
          module.names.includes(entryName)
        )
      };
      this.chunks.push(chunk);
    }

    //9.再把每个 Chunk 转换成一个单独的文件加入到输出列表
    this.chunks.forEach(chunk => {
      const filename = this.options.output.filename.replace(
        '[name]',
        chunk.name
      );
      // files 本次打包出来的文件
      this.files.push(filename);

      // assets key是文件名,值是文件内容
      this.assets[filename] = getSource(chunk);
    });

    // 执行compiler对象中的onCompiled方法
    callback(
      null,
      {
        modules: this.modules,
        chunks: this.chunks,
        assets: this.assets,
        files: this.files
      },
      this.fileDependencies
    );
  }

  /**
   * @description 编译模块，调用loader转换源码就是在这里做的
   * @param {*} name 模块所属的代码块(chunk)的名称
   * 也就是entry的name entry1 entry2
   * @param {*} modulePath 模块的路径
   */
  buildModule(name, modulePath) {
    //1.读取文件的内容，得到源码
    let sourceCode = fs.readFileSync(modulePath, 'utf8');
    let { rules } = this.options.module;

    //根据规则找到所有的匹配的loader
    let loaders = [];
    rules.forEach(rule => {
      if (modulePath.match(rule.test)) {
        loaders.push(...rule.use);
      }
    });

    //调用所有配置的Loader对模块进行转换，得到转换后的代码
    sourceCode = loaders.reduceRight((sourceCode, loader) => {
      return require(loader)(sourceCode);
    }, sourceCode);

    //7.再找出该模块依赖的模块，再递归本步骤直到所有入口依赖的文件都经过了本步骤的处理

    //声明当前模块的ID
    let moduleId = './' + path.posix.relative(baseDir, modulePath);

    /**
     * 创建module对象
     * 模块ID就是相对于根目录的相对路径
     * dependencies就是此模块依赖的模块
     * name是模块所属的代码块的名称,如果一个模块属于多个代码块，那么name就是一个数组
     */
    let module = { id: moduleId, dependencies: [], names: [name] };

    // 根据源码创建AST
    let ast = parser.parse(sourceCode, { sourceType: 'module' });

    /**
     * 遍历AST，处理require语句，
     * 1、修改语法树，把依赖的模块名换成模块ID
     * 2、将所有require的模块ID（depModuleId）和模块路径放（depModulePath）
     *    放到 当前模块module的依赖数组中（dependencies）
     */
    traverse(ast, {
      // 找到require节点
      CallExpression: ({ node }) => {
        if (node.callee.name === 'require') {
          let depModuleName = node.arguments[0].value; //"./title"
          let depModulePath;

          if (depModuleName.startsWith('.')) {
            //暂时先不考虑node_modules里的模块，先只考虑相对路径
            const currentDir = path.posix.dirname(modulePath);
            //要找当前模块所有在的目录下面的相对路径
            depModulePath = path.posix.join(
              currentDir,
              depModuleName
            );
            //此绝对路径可能没有后续，需要尝试添加后缀
            const extensions = this.options.resolve.extensions;
            depModulePath = tryExtensions(depModulePath, extensions);
          } else {
            //如果不是以.开头的话，就是第三方模块
            depModulePath = require.resolve(depModuleName);
          }

          this.fileDependencies.add(depModulePath);
          //获取依赖的模块的ID,修改语法树，把依赖的模块名换成模块ID
          let depModuleId =
            './' + path.posix.relative(baseDir, depModulePath);
          node.arguments[0] = types.stringLiteral(depModuleId);

          //把依赖的块ID和依赖的模块路径放置到当前模块的依赖数组中
          module.dependencies.push({
            depModuleId,
            depModulePath
          });
        }
      }
    });

    //使用改造后的ast语法要地重新生成新的源代码
    let { code } = generator(ast);

    //将新的源代码添加到module上
    module._source = code;

    /**
     * 遍历当前模块的所有依赖模块
     * 1、若是依赖模块已经编译过了，则将当前模块的name添加到依赖模块的names数组中，表明此依赖模块是被当前模块依赖的
     * 2、若是依赖模块没有被编译过，则调用buildModule对此依赖模块进行编译
     */
    module.dependencies.forEach(({ depModuleId, depModulePath }) => {
      let existModule = this.modules.find(
        module => module.id === depModuleId
      );
      if (existModule) {
        existModule.names.push(name);
      } else {
        let depModule = this.buildModule(name, depModulePath);
        this.modules.push(depModule);
      }
    });
    return module;
  }
}

/**
 * @description 判断文件是否存在，可以给文件添加后缀进行查找
 */
function tryExtensions(modulePath, extensions) {
  if (fs.existsSync(modulePath)) {
    return modulePath;
  }
  for (let i = 0; i < extensions.length; i++) {
    let filePath = modulePath + extensions[i];
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  throw new Error(`找不到${modulePath}`);
}

/**
 * @description 根据chunk得到源码
 * chunk是和入口文件一一对应的
 */
function getSource(chunk) {
  return `
  (() => {
    var modules = {
      ${chunk.modules
        .map(
          module => `
          "${module.id}": module => {
            ${module._source}
          }
        `
        )
        .join(',')}
    };
    var cache = {};
    function require(moduleId) {
      var cachedModule = cache[moduleId];
      if (cachedModule !== undefined) {
        return cachedModule.exports;
      }
      var module = cache[moduleId] = {
        exports: {}
      };
      modules[moduleId](module, module.exports, require);
      return module.exports;
    }
    var exports = {};
    (() => {
      ${chunk.entryModule._source}
    })();
  })();
  `;
}
module.exports = Compilation;
```

整个编译过程就是从入口文件出发，将所有的模块进行编译，生成一一对应`module`存放在`Compilation`的`modules`中，再根据入口文件组装`Chunk`，最后再将`Chunk`转换成文件内容`assets`

------

**10、在确定好输出内容后，根据配置确定输出的路径和文件名，把文件内容写入到文件系统**

```diff
const { SyncHook } = require('tapable');
const Compilation = require('./Compilation');
const fs = require('fs');
const path = require('path');

class Compiler {
  constructor(options) {
    this.options = options;
    this.hooks = {
      run: new SyncHook(), //在开始编译之前调用
      done: new SyncHook() //在编译完成时执行
    };
  }
  run(callback) {
    //在编译开始前触发run钩子执行
    this.hooks.run.call();

    //在编译的过程中会收集所有的依赖的模块或者说文件
    const onCompiled = (err, stats, fileDependencies) => {
      //stats指的是统计信息，其中包含modules chunks files=bundle assets等信息

+      //10.在确定好输出内容后，根据配置确定输出的路径和文件名，把文件内容写入到文件系统
+      for (let filename in stats.assets) {
+        let filePath = path.join(this.options.output.path, filename);
+        fs.writeFileSync(filePath, stats.assets[filename], 'utf8');
+      }

      // 执行用户的回调
      callback(err, { toJson: () => stats });

      //监听依赖的文件变化，如果依赖的文件变化后会开始一次新的编译
      for (let fileDependency of fileDependencies) {
        fs.watch(fileDependency, () => this.compile(onCompiled));
      }

      //在编译完成时触发done钩子执行
      this.hooks.done.call();
    };

    //调用compile方法进行编译
    this.compile(onCompiled);
  }

  //开启一次新的编译
  compile(callback) {
    //每次编译 都会创建一个新的Compilation实例
    let compilation = new Compilation(this.options, this);
    compilation.build(callback);
  }
}
module.exports = Compiler;

```

最后看下实现效果

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230315113131442.png" alt="image-20230315113131442" style="zoom:50%;" />

这里实现的只是简易版本的，但是也完成文件打包

最后再回顾下整个作流程👇

**webpack**的整体工作流程：

1. 初始化参数：从==配置文件和 Shell 语句中读取并合并参数==,得出最终的配置对象
2. 用上一步得到的参数==初始化 **Compiler** 对象==
3. ==加载所有配置的插件==
4. 执行对象的 `run` 方法==开始执行编译==
5. 根据配置中的`entry`找出==入口文件==
6. 从入口文件出发,调用所有配置的`Loader`对模块==进行编译==
7. 再找出==该模块依赖的模块==，再==递归本步骤==直到==所有入口依赖的文件==都经过了本步骤的处理
8. ==根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 **Chunk**==
9. 再把每个**Chunk** 转换成一个单独的文件加入到输出列表 <!--files中-->
10. 在确定好输出内容后，根据配置确定输出的路径和文件名，把文件内容写入到文件系统 <!--写入文件-->