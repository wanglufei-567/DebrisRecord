## rollup 笔记（一）rollup 介绍

### 一、rollup 是什么

> **Rollup** 是一个 **JavaScript** 模块打包工具，用于将小块代码编译成更大更复杂的库和应用程序

同 **Wepack** 一样，**Rollup** 也是一个模块打包工具，其主要特点和优势如下👇：

1. **ES Module 支持**：==**Rollup** 原生支持 **ES** 模块，这使得它在处理现代 **JavaScript** 代码时表现得非常好==

   <!-- 基于 ES 模块规范，这个是其核心设计理念-->

2. **Tree Shaking**：==**Rollup** 以其卓越的 **Tree Shaking** 功能著称== 

   <!--得益于 ES 模块规范的静态结构，可以高效准确的进行静态分析，从而 Tree Shaking 效果更好-->

   - **Tree Shaking** 是一种通过消除未使用代码来优化打包结果的技术
   - **Rollup** 能够通过==静态分析模块依赖关系==，只打包实际用到的代码，从而减少输出文件的大小，提高加载速度

3. **插件体系**：**Rollup** 拥有丰富的插件体系，开发者可以利用这些插件来扩展 **Rollup** 的功能

   - 如处理 **CSS**、图片等非 **JavaScript** 文件，使用 **Babel** 来转译 **JavaScript** 代码

4. **输出灵活**：**Rollup** 支持多种输出格式

   - 包括 **CommonJS**、**ES Module**、**IIFE**（立即调用函数表达式）、**UMD**（通用模块定义）等，
   - 使得开发者可以根据不同的需求来选择最合适的输出格式

### 二、Rollup 与 Webpack 对比

**Webpack** 的设计目标和 **Rollup** 有些不同，以下是两者在不同方面的对比：

**Rollup**

- **特点**：

  - **专注于库的打包**：更适合用于构建 **JavaScript** 库 <!--Rollup 适用于 JS 库的打包-->

  - **Tree Shaking**：**Rollup** 的 **Tree Shaking** 功能非常强大，能够自动去除未使用的代码，生成更小的打包文件

  - **原生支持 ES Modules**：更好地支持和优化 **ES6** 模块


- **优势**：

  - **更小的打包体积**：由于有效的 **Tree Shaking** 和优化，打包后的文件体积通常更小

  - **简单配置**：配置文件相对简单，==适合快速上手和构建小型项目==
  - **多输出格式**：能够输出多种模块格式（如 **ES Module**、**CommonJS**、**UMD** 等），适应不同的使用场景

**Webpack**

**特点**：

- **适用于复杂应用程序**：更适合用于构建==复杂的==前端应用程序，能够处理多种资源类型（如 **CSS**、图片、字体等）<!--Webpack 适用于大型应用程序-->
- **模块热替换（HMR）**：开发过程中支持模块热替换，提高开发效率
- **更强的生态系统**：拥有丰富的插件和 **loader**，可以满足几乎所有的前端构建需求

**优势**：
- **灵活性高**：配置选项丰富，能够处理复杂的构建需求
- **强大的生态系统**：拥有大量的插件和社区支持，能够扩展和自定义构建过程
- **代码拆分与懒加载**：内置代码拆分和懒加载功能，优化大型应用的加载性能

**总结**：

- **Rollup** ==设计简洁==，专注于打包和优化代码，生成体积小、性能高效的库，非常适合构建 **JavaScript** 库
- **Webpack** ==功能全面==，能够处理多种资源和复杂的构建需求，适合构建大型、复杂的前端应用程序

<!--rollup 的静态分析、打包高效，webpack 也能做到，因为 webpack 也能处理 ES 模块，所以 rollup 在功能层面相比较于 webpack 并没有什么显著的优势，但是胜在设计简洁、配置简单-->

### 三、为什么 **Rollup** 原生支持 **ES** 模块？

**ES** 模块具有**静态结构**，这意味着==模块的依赖关系在**编译时**是**已知**的，而**不是**在**运行时动态解析**的==

这为 **Rollup** 提供了一些关键优势：

- **静态分析**：**Rollup** 可以在编译时解析和分析模块依赖关系，确定哪些模块和代码是实际需要的，从而进行树摇（`tree-shaking`）优化，去除未使用的代码 

  <!--静态分析是重点，得益于 ES 模块规范，Rollup 可以在编译时就能解析和分析模块依赖-->

- **高效的依赖管理**：由于 **ES** 模块在编译时就知道了所有的依赖关系，**Rollup** 可以生成更高效、更简洁的打包输出

  - **ES6** 模块支持按需加载（动态 `import`），**Rollup** 可以根据使用情况生成高效的代码分割（**code splitting**）

- **模块化开发**：**ES** 模块的标准化使开发者可以使用现代的模块化语法进行开发，而不需要依赖特定的模块加载器或环境

  - **ES** 模块之前的那些模块系统（**AMD**，**UMD**，**CommonJS**）均需要模块加载器（如 **RequireJS**）和环境配置才能正确解析和加载模块
  -  ==**ES** 模块是标准化的模块系统，被现代 **JavaScript** 引擎直接支持，不需要额外的加载器或特殊的环境配置==

### 四、为什么 ES 模块更容易进行静态分析？

**ES6** 模块具有以下特性，使其更适合静态分析：

1. **==静态结构==**：

   - **ES6** 模块的导入（`import`）和导出（`export`）语句是**静态的**，必须出现在**文件的顶层**，并且语法明确

     例如：

     ```javascript
     import { foo, used } from './module';
     used();
     
     export const bar = () => {};
     ```

     这意味着所有的**==模块依赖关系==**在**模块解析时**都是**固定的**，**==不会在运行时改变==**，这对于静态分析非常有利，因为工具可以在不运行代码的情况下确定哪些导入的模块被实际使用了

2. **==确定性==**：

   - **ES6** 模块的导入和导出是明确和确定的，==没有条件导入或导出==，这使得工具能够准确地跟踪代码中的依赖关系

     例如，以下 **ES6** 导入语句明确指明了依赖关系：

     ```javascript
     import { foo } from './module';
     ```

相比之下，**CommonJS** 模块具有一些**动态特性**，使得静态分析变得更加复杂：

1. **==动态导入==**：

   - **CommonJS** 使用 `require` 函数进行模块导入，这个过程是动态的

     例如：
   
     ```javascript
    const foo = require('./module');
     ```

     `require` 可以在代码的==任意位置调用==，甚至可以根据条件进行调用：
   
     ```javascript
     if (condition) {
       const foo = require('./module');
    }
     ```
   
     由于导入可以是动态的，编译器在编译时很难确定所有的模块依赖关系，这使得静态分析变得更加困难

2. **==导出方式多样==**：

   - **CommonJS** 模块导出使用 `module.exports` 或 `exports` 对象，可以是任意类型的数据（对象、函数、变量等），这使得导出的内容在编译时难以确定

     例如：

     ```javascript
     module.exports = {
       foo: () => {}
     };
     ```
   
     或者：

     ```javascript
     exports.foo = () => {};
     ```

#### 4.1、ES6 模块与 Tree Shaking

由于 **ES6** 模块的静态结构和确定性，工具（如 **Rollup** 和 **Webpack**）可以轻松地确定哪些导入的模块或导出的功能是未使用的，并将其从最终的打包文件中删除

例如：

```javascript
// module.js
export const used = () => {};
export const unused = () => {};

// main.js
import { used } from './module';

used();
```

在这种情况下，**Tree Shaking** 可以明确地确定 `unused` 是未使用的，并将其从打包文件中移除

#### 4.2、CommonJS 模块与 Tree Shaking

由于 **CommonJS** 模块的动态特性和导出方式的多样性，静态分析和 **Tree Shaking** 变得更加困难

例如以下几种情况：

1. **条件加载**：

   ```javascript
   if (someCondition) {
     const { used } = require('./module');
   }
   ```

2. **动态路径**：

   ```javascript
   const moduleName = getModuleName(); // getModuleName 在运行时确定
   const module = require(moduleName);
   module.used();
   ```

3. **动态属性访问**：

   ```javascript
   const module = require('./module');
   const func = module[getFunctionName()]; // getFunctionName 在运行时确定
   func();
   ```

在这些情况下，静态分析工具很难准确确定哪些代码是未使用的，从而影响 **Tree Shaking** 的效果

虽然许多打包工具（如 **Webpack** 和 **Rollup**）可以通过引入插件来支持 **CommonJS** 模块的 **Tree Shaking**，但由于其动态特性和不确定性，效果和效率远不如 **ES6** 模块

因此，**ES6** 模块更加适合静态分析和 **Tree Shaking**，这也是为什么 **Rollup** 优先支持 **ES6** 模块的原因
