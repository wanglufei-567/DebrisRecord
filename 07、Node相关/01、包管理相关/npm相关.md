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

