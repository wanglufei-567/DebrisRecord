## 搭建一个 React 工程

下面是一个不借助脚手架工具 `create-react-app` 创建 **React** 应用程序的步骤，配置 **TypeScript** 和 **ESLint**

- **创建项目目录**：

```shell
mkdir my-react-app cd my-react-app 
```

- **初始化 npm 项目**：

```shell
npm init -y 
```

- **安装 React 和 ReactDOM**：

```shell
npm install react react-dom 
```

- **安装 TypeScript**：

```shell
npm install --save-dev typescript @types/react @types/react-dom
```

- **安装 Babel**：需要 **Babel**来转换 **JSX **

  ```shell
  npm install --save-dev \
  @babel/core \
  @babel/preset-env \
  @babel/preset-react \
  @babel/preset-typescript
  ```

  - `@babel/core`： **Babel** 核心库，
    - 主要作用是将 **JavaScript** 代码解析成抽象语法树（**AST**），以便各种插件可以分析和处理这些语法
    - 例如，有些新语法在低版本的 **JavaScript** 中是不存在的，如箭头函数、**rest**参数、函数默认值等，这种语言层面的不兼容只能通过将代码转为 **AST**，分析其语法后再转为低版本的 **JavaScript**
  - `@babel/preset-env`：一个智能预设
    - 允许使用最新的 **JavaScript** 语法，而无需微观管理哪些语法需要转换以适应目标环境
    - 它会根据指定的目标环境（如特定版本的浏览器或 **Node.js**）来决定需要使用哪些 **Babel** 插件进行语法转换
  - `@babel/preset-react`：这个预设包含了一些 **Babel** 插件
    - 这些插件可以将 **React** 的 **JSX** 语法转换为标准的 **JavaScript** 语法，这样浏览器就可以正常解析和执行转换后的代码了
  - `@babel/preset-typescript`：这个预设是用于将 **TypeScript** 转换为 **JavaScript** 的

- **安装 Webpack**：

```shell
npm install --save-dev webpack webpack-cli webpack-dev-server html-webpack-plugin 
```

- **安装 Babel Loader**：这个 **loader** 让 **Webpack** 可以使用 **Babel**

```shell
npm install --save-dev babel-loader 
```

- **安装 ESLint：**

```shell
npm install --save-dev eslint eslint-plugin-react 
```

- **创建源代码目录和文件**：

```shell
mkdir src touch src/index.tsx touch src/index.html 
```

- **配置 Webpack**：在项目根目录下创建一个名为`webpack.config.js`的文件，并添加以下内容：

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode:'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
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
  devServer: {
    compress: true,
    port: 9000,
  },
};

```

- **配置 tsconfig.json**: 在项目根目录下创建一个名为`tsconfig.json`的文件，并添加以下内容：

```json
{
  "compilerOptions": {
    "outDir": "./dist/",
    "sourceMap": true,
    "noImplicitAny": true,
    "module": "commonjs",
    "target": "es6",
    "jsx": "react",
    "esModuleInterop":true
  },
  "include": [
    "./src/**/*"
  ]
}

```

- **配置 Babel**：在项目根目录下创建一个名为`.babelrc`的文件，并添加以下内容：

```json
{
  "presets": ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript"]
}

```

- **配置 ESLint**：在项目根目录下创建一个名为`.eslintrc.js`的文件，并添加以下内容：

```javascript
module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g. "@typescript-eslint/explicit-function-return-type": "off",
  },
  settings: {
    react: {
      version: "detect"
    }
  }
};
```

- **编写 React 代码**：在`src/index.tsx`文件中添加一些 **React** 代码，例如：

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  return <h1>Hello, React!</h1>;
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

```

- **创建HTML模板**：在`src/index.html`文件中添加以下内容：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My React App</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>

```

- **启动应用**：在`package.json`文件中的`scripts`部分添加以下内容：

```json
"scripts": {  "start": "webpack serve",  "build": "webpack" } 
```

可以运行`npm start`来启动开发服务器，或者运行`npm run build`来构建生产版本的应用



​              