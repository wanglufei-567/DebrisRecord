## pnpm相关

### 一、pnpm menorepo

**工程项目结构**

```shell
packages
    pkg1
        package.json
    pkg2
        package.json
package.json
pnpm-workspace.yaml
```

其中 `packages` 为工作区目录，里面可创建多个项目，项目里面需包含`package.json`文件，`package.json`里的`name`为项目名需要必填

`pnpm-workspace.yaml`可以自定义工作区目录，默认为packages下的所有子目录

```shell
// pnpm-workspace.yaml
packages:
    // packages目录下的所有子目录
    - 'packages/*'
    // components目录下的所有子目录
    - 'components/*'
    // 排除test目录下的包
    - '!**/test/**'
```

### 二、常用命令

**为所有 `packages` 安装依赖**

```js
pnpm install
```

**仅为`workpace package`安装依赖**

```shell
pnpm install -w
```

**安装全局的公共依赖包**

`pnpm` 提供了 `-w`, `--workspace-root` 参数，可以将依赖包安装到工程的根目录下，作为==所有 `package` 的公共依赖==

```shell
pnpm add react -w
pnpm add react -w -D // 安装公共开发依赖
```

**给某个package单独安装指定依赖**

```shell
pnpm add react --filter pkg1(项目名)
```

`--filter` 参数跟着的是`package`下的 `package.json` 的 `name` 字段，并不是目录名

也可进入到对应项目下执行以下代码

```shell
// packages/pkg1
pnpm add react
```

**`package`之间相互安装依赖**

将`package`下的`pkg1`包安装到`pkg2`中

```shell
pnpm add pkg1 --filter pkg2
```

**取消某个依赖的安装**

```shell
pnpm remove axios
pnpm remove axios --filter  @monorepo/http // 单个package
```

**查看依赖树**

```shell
pnpm list [package]// 查看全局公共依赖
pnpm list [package] -r // 查看每个package的依赖
pnpm list [package] -r --filter pkg1 // 查看pkg1的依赖
```

**查看某个包的依赖树**

```shell
pnpm why react -r // 显示依赖于指定 package的所有 package
```

`--recursive` `-r` 参数表示执行该命令于子目录所有`package` 中，或者如果执行在一个工作空间时，在工作空间的所有`package`执行

