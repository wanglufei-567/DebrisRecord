## pnpm相关

### 一、什么是 pnpm

> **pnpm** 是一种高效、快速、节省磁盘空间的 **JavaScript** 包管理工具
>
> **pnpm** 的核心理念是“链接和共享”，它通过「符号链接」（symlink）和「去重机制」来高效管理依赖关系

#### 1.1、 pnpm 优势

1. **更小的内存占用**
   - **pnpm** 使用一个「全局的」存储目录（类似于缓存），并通过硬链接或符号链接将包引用到项目中
   - 避免了传统包管理器重复下载和存储相同版本的依赖，从而大幅减少磁盘占用
2. **更快的安装速度**
   - **pnpm** 的安装速度非常快，因为它避免了重复的文件写入，同时使用高效的并发机制来处理依赖安装
3. **严格的依赖隔离**
   - **pnpm** 使用唯一的 `node_modules` 结构，将每个包的依赖严格限制在其作用域内。这种机制能够有效防止包的幽灵依赖问题
4. **Monorepo 支持**
   **pnpm** 提供了内置的 `workspaces` 支持，非常适合管理 **Monorepo** 项目

#### 1.2、pnpm menorepo 项目概览

**工程项目结构：👇**

```di
packages
    pkg1
        package.json
    pkg2
        package.json
package.json
pnpm-workspace.yaml
```

- `packages` 为工作区目录，里面可创建多个项目，项目里面需包含`package.json`文件，`package.json`里的`name`为项目名需要必填

- `pnpm-workspace.yaml`可以自定义工作区目录，默认为 `packages` 下的所有子目录

  ```yaml
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

- 初始化项目

  ```shell
  pnpm init
  ```

- 为所有 `packages` 安装依赖

  ```shell
  pnpm install
  ```

- 安装全局的公共依赖包

  - `pnpm` 提供了 `-w`, `--workspace-root` 参数，可以将依赖包安装到工程的根目录下，作为所有 `package` 的公共依赖

  ```shell
  pnpm add react -w
  pnpm add react -w -D // 安装公共开发依赖
  ```

- 给某个`package`单独安装指定依赖

  ```shell
  pnpm add react --filter pkg1(项目名)  --filter pkg2(项目名)
  
  #`--filter` 参数跟着的是`package`下的 `package.json` 的 `name` 字段，并不是目录名
  ```

  或者先进入到对应项目下执行以下代码

  ```bash
  # 先cd到子包的目录下再进行install
  
  cd packages/pkg1 
  
  pnpm add react
  ```


- `package`之间相互安装依赖

  将`package`下的`pkg1`包安装到`pkg2`中

  ```shell
  pnpm add pkg1 --filter pkg2
  ```


- 取消某个依赖的安装

  ```shell
  pnpm remove axios
  pnpm remove axios --filter  @monorepo/http // 单个package
  ```

- 查看依赖树

  ```shell
  pnpm list [package]// 查看全局公共依赖
  pnpm list [package] -r // 查看每个package的依赖
  pnpm list [package] -r --filter pkg1 // 查看pkg1的依赖
  ```

- 查看某个包的依赖树

  ```shell
  pnpm why react -r // 显示依赖于指定 package的所有 package
  
  #`--recursive` `-r` 参数表示执行该命令于子目录所有`package` 中，或者如果执行在一个工作空间时，在工作空间的所有`package`执行
  ```

- 执行子包中的命令

  
  - 通过 `-F` 或 `--filter` 运行子包命令
  
    ```bash
    # 假设有一个名为 `my-package` 的子包，可以从根目录运行该子包的命令
    # 例如，如果子包的 `package.json` 中有一个 `build` 脚本，可以执行：
    pnpm -F my-package run build
    ```
  
  - 执行多个子包的命令
  
    ```bash
    # 如果想在多个子包上执行命令，可以使用逗号分隔子包名
    pnpm -F my-package,another-package run build
    ```
  
  - 运行所有子包的命令
  
    ```bash
    # 如果想在所有子包中执行相同的命令，使用 `-r` 或 `--recursive` 参数
    pnpm -r run build
    ```
  
    或者在根目录的 `package.json` 中定义一个命令
  
    ```json
    {
      "scripts": {
        "build:all": "pnpm -r run build"
      }
    }
    ```
  
    然后在根目录下运行命令
  
    ```bash
    pnpm run build:all
    ```
  
- 在项目的上下文中执行指定的命令

  ```shell
  pnpm exec <command>
  
  # `<command>` 是要在项目上下文中执行的任何命令
  
  # 例如 pnpm exec npm test
  # 通过这个命令，可以在项目依赖项中执行特定的命令，而无需在全局范围安装这些命令或将它们作为项目的开发依赖项安装
  # 类似于 npx，但专门用于 pnpm 管理的项目
  ```

  