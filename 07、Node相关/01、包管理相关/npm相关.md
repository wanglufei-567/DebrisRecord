## npm相关

### 一、npm常用命令

**npm查看配置信息**

```js
npm config ls
```

**npm查看配置文件路径**

```js
npm config get userconfig // 查看用户配置文件路径
npm config get globalconfig // 查看全局配置文件路径 
```

**npm查看源：** 

```js
npm config get registry
```

**npm修改源**

```js
npm config set registry https://registry.npm.taobao.org/
npm --registry http://registry.npm.xiaojukeji.com install [name]
npm --registry https://registry.npm.taobao.org
npm --registry=http://npm.intra.xiaojukeji.com install
```

**nrm切换不同源**

```js
nrm ls // 列出可选择的源
nrm use npm // 切换使用的源
nrm add <registry> <url> // 添加一个源
```

**npm查看已安装的包**

```js
npm list [dependency] // 查看某个包的依赖关系树
npm list [dependency] --depth=[depth] // 设置深度级别
npm list --depth=0 // 查看全部的包
npm list -g --depth 0  // 查看全局已安装的包
npm root // 查看本地node_modules路径
npm root -g // 查看全局node_modules路径
```

**安装指定版本的npm包**

```js
npm install [package]@[version]
npm install [package]@latest
```

**npm查看某个包的信息**

```js
npm view [package] version
npm view [package] versions
npm info [package] 
```

**dnpm添加人员**

```
dnpm add <user> <package>
```

**npm link**

```js
npm link // 创建链接，在你的包的目录下运行此命令，将会创建一个全局安装的符号链接

npm link <package-name> // 使用链接，在任何需要使用这个包的项目中运行此命令，将会在这个项目的 node_modules 目录下创建一个指向你的包的符号链接

npm unlink <package-name> // 解除链接，在你的项目目录下运行此命令，将会移除对应的链接

npm unlink --no-save // 解除全局链接，在你的包的目录下运行此命令，将会移除全局的链接

npm ls -g --link // 查看全局链接的模块，这个命令会列出所有全局链接的模块1。

// 查看本地链接的模块，可以在 node_modules 目录下使用 ls -l 命令，并通过 grep ^l 来过滤出符号链接1。例如，ls -l node_modules | grep ^l。
```

### 二、包版本管理

#### 2.1、npm 管理包版本

- ^: 保证最左边非零数字不变。 如果写入的是`^0.13.0`，则当运行`npm update` 时，可以更新到`0.13.1`、`0.13.2`等，但不能更新到`0.14.0`或更高版本。 如果写入的是`^1.13.0`，则当运行`npm update`时，可以更新到`1.13.1`、`1.14.0`等，但不能更新到`2.0.0` 或更高版本。
- `~`: 如果写入的是 `〜0.13.0`，则当运行 `npm update` 时，会更新到补丁版本：即 `0.13.1` 可以，但 `0.14.0` 不可以。
- `>`: 接受高于指定版本的任何版本。
- `>=`: 接受等于或高于指定版本的任何版本。
- `<=`: 接受等于或低于指定版本的任何版本。
- `<`: 接受低于指定版本的任何版本。
- `=`: 接受确切的版本。
- `-`: 接受一定范围的版本。例如：`2.1.0 - 2.6.2`。
- `||`: 组合集合。例如 `< 2.1 || > 2.6`。

#### 2.2、常见的版本号

- **Alpha**：软件或系统的**内部测试版本**，会有很多Bug，仅内部人员使用
- **Beta**：软件或系统的**测试版本**，这一版本通常是在Alpha版本后，会有很多新功能，同时也有不少Bug
- **Stable**：稳定版本，基于Beta版，已知Bug都被修复，一般情况下，更新比较慢
- **LTS（Long Term Support）**：**长期演进版**，LTS版本都是稳定正式版，维护更新时间为稳定正式版本发布后的持续维护更新时间 

### 三、package.json中的配置项

#### 3.1、peerDependencies

> `peerDependencies` 主要是用于库或插件开发者来指定他们的包需要在宿主环境中与特定的其他包共存，并且需要这些包达到特定的版本要求
>
> 它主要是向使用这个库或插件的项目的开发者发出一个信号，告诉他们需要确保他们的项目中安装了合适版本的依赖项

在库或插件的 `package.json` 中声明 `peerDependencies`，是为了：
- 告知使用该库或插件的项目开发者，他们需要在他们的项目中手动安装并管理这些依赖，以确保兼容性和功能正常
- 防止库或插件自动安装一个可能与项目中已有的同类依赖冲突的版本

在宿主环境<!--最终的项目或应用中--> `peerDependencies` ==本身不会起到安装或管理依赖的作用==，它不会导致 **npm** 自动安装声明中的包，因此，在一个终端用户的项目（宿主环境）的 `package.json` 中设置 `peerDependencies` 实际上并没有实际效果，因为它主要是为库或插件的开发者设计的

**实际应用举例**

如果你正在开发一个项目，并且决定使用某个第三方插件，例如一个基于 **React** 的 **UI** 组件库，你需要查看该插件的 `peerDependencies` 来了解必须安装哪些依赖以及哪些版本

如果该插件 `package.json` 中有如下声明：

```json
{
  "peerDependencies": {
    "react": ">=16.8.0"
  }
}
```

这意味着需要确保你的项目中已经安装了 **React 16.8.0** 或更高版本，如果没有，需要手动安装一个兼容的 **React** 版本

总之，`peerDependencies` 在宿主项目中主要起到声明和提醒的作用，而不是自动化的安装或版本控制作用。这是一种保证库与库之间、库与宿主项目之间的兼容性的策略

<!--如果自己的项目中直接设置 `peerDependencies`，它并不会影响 **npm** 的行为，除非自己的项目也被其他项目作为库引用-->
