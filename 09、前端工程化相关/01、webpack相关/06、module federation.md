## webpack笔记（六）— module federation

### 一、前言

**Webpack 5** 的 **Module Federation** 是一个强大的特性，专为实现模块间的「共享」与「远程加载」而设计，使多个独立构建的应用之间能够动态加载和共享模块；它的应用场景特别适合于微前端架构，让不同的团队可以独立开发、构建、部署各自的应用部分，而无需将它们打包到一个单独的大型应用中

### 二、Module Federation 的关键概念

1. **Remote 和 Host**：**Module Federation** 引入了 **Remote** 和 **Host** 的概念
   - **Host**：可以看作是**加载其他模块**的应用，它可以访问远程模块，将它们加载到自己内部
   - **Remote**：**提供模块**的应用，其他应用可以通过 **Module Federation** 动态引入该模块
2. **Shared Dependencies（共享依赖）**：定义需要共享的依赖库
   - 例如，在多个应用中共享 `react` 或 `react-dom`，以避免重复加载，减少体积，提升性能
   - **Module Federation** 允许定义哪些依赖应在多个应用间共享，以保持一致性
3. **Exposes（暴露）**：**Remote** 应用通过 `exposes` 定义哪些模块可以对外暴露，这样其他应用就可以访问这些模块
   - 比如，一个组件库应用可以暴露常用的组件，而其他应用可以直接引用并使用这些组件
4. **Dynamic Remotes（动态远程加载）**：**Module Federation** 支持通过配置动态加载远程模块，这在微前端架构下尤其有用，可以通过用户的路由或行为来动态加载特定的模块

### 三、基本配置

以下是一个基本的 **Module Federation** 配置示例，包括 **Host** 和 **Remote** 应用的设置：

#### 3.1、Remote 应用的 webpack 配置

假设有一个 **Remote** 应用名为 `remoteApp`，其中暴露了一个名为 `Button` 的组件：

```javascript
// webpack.config.js
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  // 应用的入口配置
  entry: "./src/index",
  // 配置模块联邦插件
  plugins: [
    new ModuleFederationPlugin({
      name: "remoteApp",
      filename: "remoteEntry.js", // 生成的远程入口文件
      exposes: {
        "./Button": "./src/components/Button", // 暴露 Button 组件
      },
      shared: {
        // 共享依赖配置
        react: { singleton: true, requiredVersion: "^18.0.0" },
        "react-dom": { singleton: true, requiredVersion: "^18.0.0" },
      },
    }),
  ],
  // 其他 Webpack 配置
};
```

#### 3.2、Host 应用的 webpack 配置

在 **Host** 应用中，通过 `remote` 配置来引入远程模块：

```javascript
// webpack.config.js
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  entry: "./src/index",
  plugins: [
    new ModuleFederationPlugin({
      name: "hostApp",
      remotes: {
        // remoteApp 是上面 Remote 应用中定义的名称
        remoteApp: "remoteApp@http://localhost:3001/remoteEntry.js",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^18.0.0" },
        "react-dom": { singleton: true, requiredVersion: "^18.0.0" },
      },
    }),
  ],
};
```

#### 3.3、使用远程模块

在 **Host** 应用的代码中，可以直接从 **Remote** 应用加载暴露的模块：

```javascript
import React from "react";

// 从 remoteApp 引入远程模块
const Button = React.lazy(() => import("remoteApp/Button"));

const App = () => (
  <div>
    <h1>Host Application</h1>
    <React.Suspense fallback="Loading Button...">
      <Button />
    </React.Suspense>
  </div>
);

export default App;
```

配置详解：

- **name**：模块联邦的名称，`remoteApp` 和 `hostApp` 分别为 **Remote** 和 **Host** 的应用名称
- **filename**：**Remote** 应用的入口文件（如 `remoteEntry.js`），**Host** 应用通过 **URL** 加载该文件
- **exposes**：**Remote** 应用暴露的模块路径，例如 `./Button`
- **remotes**：**Host** 应用引用的远程应用名称与 **URL**
- **shared**：配置共享的依赖库
  - `singleton`：应用程序中是否只存在一个该模块的实例
    - 默认值是 `false`
  - `requiredVersion`：指定共享模块的版本范围，确保所有应用使用兼容的版本
    - 默认值是 `undefined`，意味着没有版本约束

### 四、expose vs shared

直接定义一个 `lib` 应用专门用于安装「通用依赖」，再通过 `expose` 提供给其他应用使用，这种方式可以替代 `shared` 配置，但两者有不同的优缺点

**使用 `lib` 应用暴露通用依赖：**

- **优点**：
  1. 清晰的依赖管理：
     - `lib` 应用集中管理通用依赖版本，其他应用只需消费 `lib` 暴露的模块，降低依赖版本冲突的概率
  2. 版本控制更直观：
     - 通用依赖的版本更新只需要更新 `lib` 应用，其他应用无感知，适合大型项目或严格的版本控制需求
- **缺点**：
  1. 额外的网络开销：
     - 每次远程模块调用都需要通过网络请求加载（取决于 **Webpack** 的动态加载实现）
  2. 性能问题：
     - 如果多个应用频繁调用 `lib` 暴露的依赖，会增加运行时的调用延迟
  3. 不灵活：
     - 每次依赖版本变更都需要更新 `lib`，而无法像 `shared` 那样动态选择运行时版本

**使用 `shared`：**

- **优点**：
  1. 动态加载，版本灵活：
     - 运行时动态解析模块，优先选择主应用或已加载的版本
     - 适合对版本兼容要求不高的场景
  2. 减少网络开销：
     - 主工程和远程工程共享依赖，避免重复下载
- **缺点**：
  1. 版本冲突风险：
     - 如果多个应用依赖的版本范围不兼容，可能导致运行时问题
  2. 依赖不集中：
     - 每个工程都需要单独声明依赖版本，管理复杂度较高

**总结：`shared` vs `lib` 的选择**

| 特性               | 使用 `shared`            | 使用 `lib` 应用暴露依赖    |
| ------------------ | ------------------------ | -------------------------- |
| **性能**           | 较优，直接在主工程中共享 | 较差，需要网络请求加载     |
| **依赖管理复杂度** | 较高，每个应用需声明版本 | 较低，集中管理版本         |
| **版本灵活性**     | 动态解析，灵活匹配版本   | 版本固定，更新需显式修改   |
| **适用场景**       | 通用依赖（React 等库）   | 特殊需求（如公共业务模块） |

**建议**：

- **优先使用 `shared`**：特别是对于 **React**、**lodash** 等通用库，`shared` 的动态共享机制是最优选择
- **考虑使用 `lib`**：当需要集中管理某些通用业务模块或对依赖版本控制要求严格时，可以定义专门的 `lib` 应用暴露模块

