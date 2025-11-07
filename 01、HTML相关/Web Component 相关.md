## Web Component 相关

### 一、概述

#### 1.1、定义

**Web Components** 是一套由**浏览器原生支持的组件化**前端技术标准，用于创建**可复用**、**可封装**、**可独立运行**的 **UI 组件**

它允许开发者以 **HTML 标签**的形式在页面中引入**组件**，并保证**组件的 DOM 结构与样式**不会影响或被影响于外部页面  <!--许多微前端技术里面的样式隔离就是利用该特性做的-->

其核心由以下三项技术组成：

- **Custom Elements（自定义元素）：**定义新的 **HTML** 标签及其行为
- **Shadow DOM（影子 DOM）：** 提供 **DOM** 结构与样式的封装与隔离
- **HTML Template（HTML 模板）：** 提供可复用、不会被立即渲染的组件结构模板

#### 1.2、为什么会出现这种技术

传统 **Web** 开发长期面临以下问题：

- **UI 组件**缺乏统一的封装机制，容易造成样式冲突、脚本侵入
- 各框架（如 **React**、**Vue**、**Angular**）均有自己的组件体系，缺乏跨框架通用性
- 随着前端工程规模增长，组件复用性与可维护性要求提高

**Web Components** 作为**浏览器原生组件机制**，旨在解决跨框架复用和样式隔离问题，并减少对三方框架的依赖

#### 1.3、它能做什么

- 创建可复用的 **UI** 组件，例如按钮、弹窗、表格模块等
- 与任何框架或原生 **JavaScript** 一起使用，不存在技术栈绑定
- 实现真正意义上的前端模块化和隔离式 **UI** 部件

#### 1.4、常见应用场景

- **设计系统 / UI 组件库**：在跨框架、跨应用之间复用组件
- **企业后台系统**：多团队协作时避免样式与依赖冲突
- **微前端架构**：各模块可独立交付，统一以 **Web Components** 形式集成
- **内部工具平台**：降低维护成本，减少对框架版本迭代的耦合

#### 1.5、特点

- **原生标准：**无需引入第三方框架
- **封装性强：** **DOM** 和 **CSS** 可完全隔离（**Shadow DOM**）
- **可复用性高：**组件可在不同项目、框架中直接使用
- **生命周期可控：**自定义元素提供生命周期钩子
- **可与现有技术并存：**可结合 **React**/**Vue**/**Angular** 使用，无冲突

### 二、Custom Elements（自定义元素）

#### 2.1、定义

**Custom Elements** 允许开发者定义自己的 **HTML** 标签，并为其绑定行为（逻辑和生命周期），定义完成后即可像使用原生标签一样在页面中使用

#### 2.2、语法

```javascript
customElements.define(name, constructor, options)
```

| 参数          | 说明                                               | 必填 | 默认值      |
| ------------- | -------------------------------------------------- | ---- | ----------- |
| `name`        | 自定义元素名称（必须包含 `-`）                     | 是   | 无          |
| `constructor` | 继承自 `HTMLElement` 的类                          | 是   | 无          |
| `options`     | 配置扩展原生元素用法，例如 `{ extends: 'button' }` | 否   | `undefined` |

**生命周期回调（可选实现）**

| 方法                                                 | 触发时机             |
| ---------------------------------------------------- | -------------------- |
| `connectedCallback()`                                | 元素插入文档时       |
| `disconnectedCallback()`                             | 元素从文档中移除时   |
| `attributeChangedCallback(name, oldValue, newValue)` | 观察的属性变化时     |
| `adoptedCallback()`                                  | 元素被移动到新文档时 |

#### 2.3、示例

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Custom Elements 示例</title>
</head>
<body>

<my-button></my-button>

<script>
  class MyButton extends HTMLElement {
    connectedCallback() {
      this.innerText = "自定义按钮";
      this.style.padding = '6px 12px';
      this.style.border = '1px solid #333';
      this.style.display = 'inline-block';
      this.style.cursor = 'pointer';
    }
  }

  customElements.define('my-button', MyButton);
</script>

</body>
</html>

```

### 三、Shadow DOM（影子 DOM）

#### 3.1、定义

**Shadow DOM** 是创建 **组件内部私有 DOM 子树** 的技术，使组件的结构、样式和行为与外部隔离，避免干扰和冲突

#### 3.2、语法

```javascript
element.attachShadow({ mode })
```

| 参数   | 说明                  | 可选值                                  | 默认值 |
| ------ | --------------------- | --------------------------------------- | ------ |
| `mode` | Shadow DOM 的访问模式 | `open`（可访问） / `closed`（不可访问） | `open` |

#### 3.3、示例

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Shadow DOM 示例</title>
  <style>
    p { color: red; } /* 外部样式，无法影响 Shadow DOM */
  </style>
</head>
<body>

<div id="host"></div>

<script>
  const host = document.getElementById('host');
  const shadow = host.attachShadow({ mode: 'open' });

  shadow.innerHTML = `
    <style>
      p { color: blue; }
    </style>
    <p>这是 Shadow DOM 内部文本</p>
  `;
</script>

<p>这是外部文本</p>

</body>
</html>

```

外部页面即使定义 `p { color: red; }`，此段文字仍保持 `blue`

### 四、HTML Template（HTML 模板）

#### 4.1、定义

`<template>` 标签用于定义一段不会立即渲染的 **HTML** 内容，可作为组件的静态结构模板，后续可以通过 **JavaScript** 进行克隆和插入

#### 4.2、语法

```html
<template id="tpl">
  <!-- 内容不会直接渲染 -->
</template>
```

模板内容在被 **JavaScript** 操作前 **不参与页面布局和解析**

#### 4.4、示例

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>HTML Template 示例</title>
</head>
<body>

<template id="hello-tpl">
  <p>Hello Template</p>
</template>

<div id="app"></div>

<script>
  const tpl = document.getElementById('hello-tpl');
  const clone = tpl.content.cloneNode(true);
  document.getElementById('app').appendChild(clone);
</script>

</body>
</html>

```

### 结语

**Web Components** 由三项核心技术构成：

| 技术                | 作用                     |
| ------------------- | ------------------------ |
| **Custom Elements** | 定义组件的行为与生命周期 |
| **Shadow DOM**      | 提供 **DOM** 与样式隔离  |
| **HTML Template**   | 提供可复用的组件结构模板 |

它提供浏览器原生的组件模块化能力，可跨框架复用，适合构建长期可维护的前端系统。

