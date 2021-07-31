#### npm查看源：

```
npm config get registry
```

#### npm查看配置文件

```
npm config get userconfig // 查看用户配置文件路径
npm config get globalconfig // 查看全局配置文件路径
```

#### npm修改源

```
npm config set registry https://registry.npm.taobao.org/
npm --registrt https://registry.npm.taobao.org install [name]
```

#### nrm使用

```
nrm ls // 列出可选的源
nrm use npm // 切换使用的源
nrm add <registry> <url> // 添加一个源
```

#### npm查看已安装的包

```
npm list [dependency] // 查看某个包的依赖关系树
npm list [dependency] --depth=[depth] // 设置深度级别
npm lisst --depth=0 // 查看全部的包
npm list -g --depth=0 // 查看全局安装的包
```

#### npm查看配置信息

```
npm config ls
```

#### 安装指定版本的npm包

```
npm install [package]@[version]
npm install [package]@latest
```

#### npm查看某个包的信息

```
npm view [package] version
npm info [package]
```

