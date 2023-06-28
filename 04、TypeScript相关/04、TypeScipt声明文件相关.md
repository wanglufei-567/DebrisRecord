## TypeScript使用记录(四) 声明文件相关

### 一、 TypeScript 查找第三方依赖包类型声明文件时的顺序

1. **==依赖包内查找==**
   1. 先查找 ==npm 包的 `package.json` 中的根属性 `types` 或 `typings` 字段指定的声明文件==，有则使用，否则继续查找
   2. 查找 npm 包的**==根目录==**是否有一个 `index.d.ts` 声明文件，有则使用，否则继续查找
   3. 查看 npm 包的 `package.json` 中的根属性 `main` 字段（入口文件），==查找和入口文件同级目录下==是否有同名的 `.d.ts` 文件，有则使用，否则认为此 npm 包完全没有声明文件
2. **==依赖包外查找==**
   1. 查找项目中的 `node_modules/@types` 目录下是否存在==与依赖包名称相对应==的类型声明文件
      - 例如，如果你的项目依赖了 `lodash`，TypeScript 会在 `node_modules/@types` 目录下查找是否存在 `lodash` 的类型声明文件，如 `lodash.d.ts`
   2. 如果在项目的 `node_modules/@types` 目录下找不到与依赖包名称相对应的类型声明文件，TypeScript 会继续查找全局安装的类型声明文件，全局安装的类型声明文件通常位于全局的 `typings` 或 `types` 目录下
   3. 如果以上步骤都没有找到类型声明文件，TypeScript 会查找项目中的 `typeRoots` 或 `types` 选项所配置的目录，这些目录通常用于存放项目内部的类型声明文件

如果 TypeScript 仍然无法找到类型声明文件，它会假设该依赖包不包含类型声明，将其视为一个纯 JavaScript 库，无法提供类型检查和推断

### 二、TypeScript 的配置文件（`tsconfig.json`）在项目中的生效顺序

1. 基于命令行：
   - 如果使用命令行直接指定了 TypeScript 配置文件，例如 `tsc --project tsconfig.json`，那么该指定的配置文件将直接生效
2. 当前目录的配置文件：
   - TypeScript 将会在当前目录中查找并使用名为 `tsconfig.json` 的配置文件。==如果找到了该配置文件，它将被用作主要的配置文件，并且不会继续查找其他位置的配置文件==
3. 父目录的配置文件：
   - 如果在当前目录中找不到 `tsconfig.json`，TypeScript 将会递归向上查找父目录，直到找到包含 `tsconfig.json` 的目录为止。找到的第一个 `tsconfig.json` 文件将被用作主要的配置文件，==并且不会继续查找其他位置的配置文件==
4. 默认配置：
   - 如果 TypeScript 在项目的根目录及其父目录中都找不到任何 `tsconfig.json` 文件，它将使用默认配置作为后备配置。默认配置是 TypeScript 自身定义的一组默认值，用于编译 TypeScript 代码。

需要注意的是，如果 TypeScript 在项目中找到了多个 `tsconfig.json` 文件，它只会使用第一个找到的配置文件，并忽略其他位置的配置文件



