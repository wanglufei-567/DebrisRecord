## webpack笔记（六）— module federation

### 一、前言

**Webpack 5** 的 **Module Federation** 是一个强大的特性，专为实现「模块间」的「**共享**」与「**远程加载**」而设计，==使多个独立构建的应用之间能够动态加载和共享模块==

它的应用场景特别适合于微前端架构，让不同的团队可以独立开发、构建、部署各自的应用部分，而无需将它们打包到一个单独的大型应用中

### 二、Module Federation 的关键概念

1. **Remote 和 Host**：**Module Federation** 引入了 **Remote** 和 **Host** 的概念
   - **Host**：可以看作是==**加载其他模块**的应用==，它可以访问远程模块，将它们加载到自己内部
   - **Remote**：==**提供模块**的应用==，其他应用可以通过 **Module Federation** 动态引入该模块
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
- **filename**：**Remote** 应用的入口文件（如 `remoteEntry.js`）**Host** 应用通过 **URL** 加载该文件
- **exposes**：**Remote** 应用暴露的模块路径，例如 `./Button`
- **remotes**：**Host** 应用引用的远程应用名称与 **URL**
- **shared**：配置共享的依赖库
  - `singleton`：应用程序中是否只存在一个该模块的实例
    - 默认值是 `false`
  - `requiredVersion`：指定共享模块的版本范围，确保所有应用使用兼容的版本
    - 默认值是 `undefined`，意味着没有版本约束

### 四、Shared 机制详解

**Shared 机制**允许多个独立构建的应用共享运行时依赖，通过 **Shared 机制**，**Webpack Module Federation** 能够：

- **减少重复加载**：通过缓存和复用模块实例，减少网络请求和加载时间
  - 避免重复加载相同的库，从而减少应用的总体积和内存占用
- **确保版本一致性**：通过版本匹配机制，确保在多个应用之间的模块版本一致

#### 4.1、基本配置

在 **webpack** 配置中，**shared 机制**通过 **ModuleFederationPlugin** 的 `shared` 选项配置：

```javascript
new ModuleFederationPlugin({
  name: 'app1',
  // ...
  shared: {
    react: { singleton: true, requiredVersion: "^18.0.0" },
    "react-dom": { singleton: true, requiredVersion: "^18.0.0" },
  },
})
```

**主要配置选项：**

- **singleton**: 确保共享模块在运行时只有一个实例
- **requiredVersion**: 指定应用所需的依赖版本
- **eager**: 是否在初始加载时就加载该依赖
- **shareScope**: 指定共享模块的作用域
- **shareKey**: 共享模块的唯一标识符

#### 4.2、版本控制与协商机制

##### 4.2.1、模块加载流程

- **应用启动时**：应用启动时，**Webpack** 初始化 `sharedScope`
  - 如果应用本身包含「共享模块」，这些模块会被注册到 `sharedScope` 中
  
- **动态加载**：当应用需要一个「共享模块」时，**Webpack** 首先检查 `sharedScope` 中是否已有该模块
  - **版本匹配**：如果模块存在且版本符合要求，直接使用缓存的模块实例
  - **远程请求**：如果模块不存在或版本不匹配，**Webpack** 从远程入口文件请求并加载模块，随后注册到 `sharedScope`

##### 4.2.2、版本协商过程：

当多个应用共享同一个依赖时，**Module Federation** 会进行版本协商：

1. 收集所有应用声明的版本要求
2. 根据语义化版本规则，选择满足所有要求的最高版本
3. 如果找不到兼容版本，则根据优先级规则选择版本

##### 4.2.3、版本冲突处理：

当版本要求不兼容时，**Module Federation** 提供了几种处理策略：

```javascript
shared: {
  react: {
    singleton: true,
    requiredVersion: "^18.2.0",
    strictVersion: true, // 严格版本匹配
    // 或者
    strictVersion: false // 宽松版本匹配（默认）
  }
}
```

#### 4.3、ShareScope 详解与实例

**ShareScope** 是 **Module Federation** 中的一个命名空间概念，用于组织和隔离不同的共享模块集合

它允许在**同一个应用**中维护**多个不同的共享模块集合**，每个集合可以有不同的版本协商规则

##### 4.3.1、多版本共存实例

假设我们有一个复杂的微前端应用，包含以下几个部分：

1. **主应用（host）**
2. **现代化的微应用（remote1）**：使用 **React 18**
3. **遗留的微应用（remote2）**：只能使用 **React 16**
4. **管理后台（admin）**：使用 **React 18** 和一些特殊库

**问题场景：**👇

如果所有应用都使用同一个 **shareScope**（默认的 `"default"`），会导致版本冲突：
- **remote1** 需要 **React 18**
- **remote2** 需要 **React 16**
- 它们无法共存于同一个 **shareScope**

**使用多个 ShareScope 解决问题：**👇

我们可以创建两个不同的 **shareScope**：

1. **"modern"** ：用于共享 **React 18** 及相关库
2. **"legacy"** ：用于共享 **React 16** 及相关库

**配置示例：**👇

**主应用（host）的配置**:

```javascript
// host/webpack.config.js
new ModuleFederationPlugin({
  name: 'host',
  shared: {
    // 在 "modern" 作用域中共享 React 18
    react: { 
      singleton: true, 
      requiredVersion: "^18.0.0",
      shareScope: "modern" 
    },
    // 在 "legacy" 作用域中共享 React 16
    "react-legacy": { 
      import: "react", // 实际导入的是 react 包
      singleton: true,
      requiredVersion: "^16.0.0",
      shareScope: "legacy" 
    }
  }
})
```

**现代微应用（remote1）的配置**:

```javascript
// remote1/webpack.config.js
new ModuleFederationPlugin({
  name: 'remote1',
  shared: {
    react: { 
      singleton: true, 
      requiredVersion: "^18.0.0",
      shareScope: "modern" // 使用 modern 作用域中的 React
    }
  }
})
```

**遗留微应用（remote2）的配置**:

```javascript
// remote2/webpack.config.js
new ModuleFederationPlugin({
  name: 'remote2',
  shared: {
    react: { 
      singleton: true, 
      requiredVersion: "^16.0.0",
      shareScope: "legacy" // 使用 legacy 作用域中的 React
    }
  }
})
```

#### 运行时效果

- **remote1** 会使用 `"modern"` 作用域中的 **React 18**
- **remote2** 会使用 `"legacy"` 作用域中的 **React 16**
- 它们可以在同一个页面上共存，互不干扰

##### 4.3.2、ShareScope 使用建议

- 对于大多数简单的微前端架构，使用默认的 **shareScope** 就足够了
- 只有在需要处理复杂的版本共存场景时，才考虑使用多个 **shareScope**
- 为每个 **shareScope** 制定清晰的命名和使用规范，避免混淆

#### 4.4、Shared 机制的高级用法

- **动态加载共享模块**

```javascript
shared: {
  moment: {
    eager: false, // 默认值，按需加载
    singleton: true
  },
  lodash: {
    eager: true, // 初始加载时就加载
    singleton: true
  }
}
```

- **自定义共享模块提供者**

```javascript
shared: {
  "custom-lib": {
    import: "./src/custom-implementation", // 自定义实现
    shareKey: "custom-lib", // 共享标识符
    singleton: true
  }
}
```

- 共享模块的回退策略

```javascript
shared: {
  react: {
    singleton: true,
    requiredVersion: "^18.2.0",
    fallback: "./src/polyfills/react-polyfill" // 当无法找到兼容版本时使用
  }
}
```

#### 4.5、实际应用中的最佳实践

- **依赖共享策略**
  - **核心库共享**：**React**、**Vue** 等框架库应设置为 **singleton**
  - **工具库共享**：**lodash**、**moment** 等工具库可以根据需要共享
  - **业务库共享**：内部业务组件库也可以通过 **shared 机制**共享

- **性能优化**

  - **合理使用 eager**：频繁使用的库可以设置为 **eager**，减少运行时加载延迟

  - **避免过度共享**：只共享真正需要共享的依赖，避免不必要的协商开销

  - **版本管理**：尽量保持共享库的版本一致，减少版本协商的复杂性

#### 4.6、调试技巧

1. 使用 **webpack** 的 `--display-used-exports` 查看共享模块的使用情况
2. 在浏览器中检查 `window.__webpack_share_scopes__` 对象，了解运行时共享状态
3. 使用网络面板监控共享模块的加载情况

#### 4.7、常见问题与解决方案

##### 4.7.1、版本冲突问题

**问题**：不同应用要求不兼容的依赖版本

**解决方案**：
- 使用多个 **shareScope** 隔离不同版本
- 升级应用使其使用兼容版本
- 对于无法升级的应用，考虑使用适配层

##### 4.7.2、加载顺序问题

**问题**：共享模块的加载顺序影响应用行为

**解决方案**：
- 使用 **eager** 选项确保关键依赖优先加载
- 实现更可靠的初始化逻辑，减少对加载顺序的依赖

##### 4.7.3、构建与运行时不一致

**问题**：构建时使用的依赖版本与运行时不一致

**解决方案**：

- 确保 **package.json** 中的版本与 **shared** 配置一致
- 使用 **strictVersion** 选项强制版本匹配
- 实现更健壮的应用初始化逻辑，处理可能的版本差异

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

