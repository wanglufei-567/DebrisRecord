## TypeScript使用记录(四) 声明文件相关

### 一、什么是TypeScript声明文件

在**TypeScript**中，==**声明文件**用于描述JavaScript库或模块的类型信息==。它们提供了有关变量、函数、类和模块等代码元素的类型定义，使得**TypeScript**编译器能够在开发过程中==进行类型检查和提供智能感知==，类型声明文件的后缀是`.d.ts` <!--屁话，难以理解，就是将TS类型单独放到一个文件中，并且TS可以自己引入这些类型-->

`*.d.ts`文件和`*.ts`文件的区别：

- `*.d.ts`对于**TypeScript**而言，是**类型声明文件**，
  - 在`*.d.ts`文件中的顶级声明必须以`declare`或`export`修饰符开头
  - `*.d.ts`文件==只在开发阶段有用==，用于声明一些变量或者类型，以免**TypeScript**在做检查的时候抛出变量或类型不存在的错误，从而导致编译失败，在项目编译过后，`*.d.ts`文件是不会生成任何代码的
  - 同时，`*.d.ts`文件还能帮助**TypeScript**获得对应的代码补全、接口提示等功能
- `*.ts`则没有那么多限制，任何在`*.d.ts`中的内容，均可以在`*.ts`中使用

### 二、TypeScript声明文件的分类

#### 2.1、全局声明文件与模块声明文件

**TypeScript**声明文件可以分为**全局声明文件**和**模块声明文件**：

1. **==全局声明文件==**：用于描述全局范围的变量、函数、类、命名空间等

   - 默认情况下，**TypeScript** 会解析项目内所有 `.d.ts` 文件，==当声明文件中不出现顶层 `import` 或 `export` 时==， 文件内声明的都是全局变量或全局类型
   - 也就是说，这些全局变量或全局类型都是可以在全局任何地方直接使用的，而不需要导入后再使用

2. **==模块声明文件==**：模块声明文件用于描述模块、库或第三方依赖的类型信息，它们提供了对模块导出的变量、函数、类和命名空间的类型定义
- 模块声明文件的命名通常与模块名称相匹配，并以`.d.ts`结尾。例如，`lodash.d.ts`、`react.d.ts`等
   
- ==只要声明文件中出现顶层的 `import` 或 `export`，那么这个声明文件就会被当做模块==，模块中所有的声明都是==局部变量==或==局部类型==，必须 `export` 导出后，才能在其他文件中通过`import`或`/// <reference>`指令引入使用

#### 2.2、全局声明文件书写技巧

- **声明类型**

  声明类型主要使用 `interface` 和 `type`

  ```ts
  interface IPeople {
    name: string
    age?: number
  }
  
  type NumAndString = number | string
  ```

  一个项目中，通常需要定义非常多的 `interface` 和 `type` ，如果像上面这样，所有的 `interface` 和 `type` 都暴露在最外层作为全局类型，很有可能会出现命名冲突

- **使用命名空间避免命名冲突**

  全局声明文件中可能会存在类型命名冲突，使用命名空间时，只有命名空间暴露在全局

  ```ts
  // 声明一个命名空间
  declare namespace mySpace {
    type name = 'myObj'
    interface IPeople {
      name: string
      age?: number
    }
  }
  ```

  在TS文件中使用

  ```ts
  const name:mySpace.name = 'myObj'
  
  const people:mySpace.IPeople = {
    name: 'zhangsan',
    age: '22'
  }
  ```

- **声明模块**

  `declare module` 可以用来为一个没有类型声明的模块声明类型，也可以用来扩展一个模块的类型声明

  假设，现在有一个模块叫做 `foo` ，直接使用时会报错：

  ```ts
  // TS 报错
  // Cannot find module 'foo' or its corresponding type declarations.
  import sayHi, { name, sayHello } from 'foo'
  ```

  由于上例报错，所以需要我们来写声明文件告诉 TS 这个模块的信息：

  ```ts
  declare module 'foo' {
    const name: string
    function sayHello (name: string): string
    export default function sayHi(): string
  }
  ```

  使用模块 `foo`：

  ```ts
  import sayHi, { name, sayHello } from 'foo'
  
  sayHi()
  sayHello(name)
  ```

- **`/// <reference />` 三斜线指令引用声明文件**

  当我们在编写一个全局声明文件但又依赖其他声明文件时，文件内不能出现 `import` 去导入其他声明文件的声明，此时就需要通过三斜线指令来引用其他的声明文件

  `<reference />` 可以通过 `types` 属性或 `path` 属性来引用其他声明文件

  ```ts
  /// <reference types="foo" />
  /// <reference path="bar.d.ts" />
  ```

### 三、 TypeScript 查找第三方依赖包类型声明文件时的顺序

第三方依赖包的类型声明文件属于**模块声明文件**，通常当当我们在代码中导入一个模块时，**TypeScript** 会根据导入的模块名==自动查找对应的类型声明文件==，例如`import React from 'react'`时，便会自动去查找`react`的类型声明文件

这种自动查找模块声明文件的模式，会按照下面的顺序进行查找

1. 首先会在**==依赖包内部查找==**
   - 先查找 npm 包的 `package.json` 中的==根属性 `types` 或 `typings` 字段指定的声明文件==，有则使用，否则继续查找
   - 查找 npm 包的**==根目录==**是否有一个 `index.d.ts` 声明文件，有则使用，否则继续查找
   - 查看 npm 包的 `package.json` 中的根属性 `main` 字段（入口文件），==查找和入口文件同级目录下==是否有同名的 `.d.ts` 文件，有则使用，否则认为此 npm 包完全没有声明文件
2. 接着会在**==依赖包外查找==**
   - 首先会按照文件目录层级依次向上查找项目中的 `node_modules/@types` ，查找==与依赖包名称相对应==的类型声明文件
      - 例如，如果你的项目依赖了 `lodash`，**TypeScript** 会在 `node_modules/@types` 目录下查找是否存在 `lodash` 的类型声明文件，如 `lodash.d.ts`
   - 如果在项目的 `node_modules/@types` 目录下找不到与依赖包名称相对应的类型声明文件，**TypeScript** 会继续查找全局安装的类型声明文件，全局安装的类型声明文件通常位于全局的 `typings` 或 `types` 目录下

如果 **TypeScript** 仍然无法找到类型声明文件，它会假设该依赖包不包含类型声明，将其视为一个纯 **JavaScript** 库，无法提供类型检查和推断

### 四、TypeScript 的配置文件（`tsconfig.json`）在项目中的生效顺序

1. 基于命令行：
   - 如果使用命令行直接指定了 **TypeScript** 配置文件，例如 `tsc --project tsconfig.json`，那么该指定的配置文件将直接生效
2. 当前目录的配置文件：
   - **TypeScript** 将会在当前目录中查找并使用名为 `tsconfig.json` 的配置文件。==如果找到了该配置文件，它将被用作主要的配置文件，并且不会继续查找其他位置的配置文件==
3. 父目录的配置文件：
   - 如果在当前目录中找不到 `tsconfig.json`，**TypeScript** 将会递归向上查找父目录，直到找到包含 `tsconfig.json` 的目录为止。找到的第一个 `tsconfig.json` 文件将被用作主要的配置文件，==并且不会继续查找其他位置的配置文件==
4. 默认配置：
   - 如果 **TypeScript** 在项目的根目录及其父目录中都找不到任何 `tsconfig.json` 文件，它将使用默认配置作为后备配置。默认配置是 **TypeScript** 自身定义的一组默认值，用于编译 TypeScript 代码。

需要注意的是，如果 **TypeScript** 在项目中找到了多个 `tsconfig.json` 文件，它只会使用第一个找到的配置文件，并忽略其他位置的配置文件



