

**npm查看源：** 

```
npm config get registry
```

**npm查看配置文件**

```
npm config get userconfig // 查看用户配置文件路径
npm config get globalconfig // 查看全局配置文件路径 
```

**npm修改源**

```
npm config set registry https://registry.npm.taobao.org/
npm --registry http://registry.npm.xiaojukeji.com install [name]
npm --registry https://registry.npm.taobao.org
npm --registry=http://npm.intra.xiaojukeji.com install
```

**nrm使用**

```
nrm ls // 列出可选择的源
nrm use npm // 切换使用的源
nrm add <registry> <url> // 添加一个源
```

**npm查看已安装的包**

```
npm list [dependency] // 查看某个包的依赖关系树
npm list [dependency] --depth=[depth] // 设置深度级别
npm list --depth=0 // 查看全部的包
npm list -g --depth 0
```

**npm查看配置信息**

```
npm config ls
```

**安装指定版本的npm包**

```
npm install [package]@[version]
npm install [package]@latest
```

**npm查看某个包的信息**

```
npm view [package] version
npm view [package] versions
npm info [package] 
```

**dnpm添加人员**

```
dnpm add <user> <package>
```



**npm 管理包版本**

- ^: 保证最左边非零数字不变。 如果写入的是`^0.13.0`，则当运行`npm update` 时，可以更新到`0.13.1`、`0.13.2`等，但不能更新到`0.14.0`或更高版本。 如果写入的是`^1.13.0`，则当运行`npm update`时，可以更新到`1.13.1`、`1.14.0`等，但不能更新到`2.0.0` 或更高版本。
- `~`: 如果写入的是 `〜0.13.0`，则当运行 `npm update` 时，会更新到补丁版本：即 `0.13.1` 可以，但 `0.14.0` 不可以。
- `>`: 接受高于指定版本的任何版本。
- `>=`: 接受等于或高于指定版本的任何版本。
- `<=`: 接受等于或低于指定版本的任何版本。
- `<`: 接受低于指定版本的任何版本。
- `=`: 接受确切的版本。
- `-`: 接受一定范围的版本。例如：`2.1.0 - 2.6.2`。
- `||`: 组合集合。例如 `< 2.1 || > 2.6`。