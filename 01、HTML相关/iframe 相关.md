## iframe 相关

### 一、概述

**iframe**（**Inline Frame**）是 **HTML** 标签，用于在当前页面内嵌入另一个 **HTML** 文档，嵌入的内容可以是同域或跨域页面

通过 **iframe**，可以实现“页面嵌套页面”的效果，类似一个独立的浏览器窗口：

```html
<iframe src="https://example.com" width="600" height="400"></iframe>
```

**主要特点：**

- **文档隔离**：内部 **DOM**、**CSS** 和 **JS** 独立于父页面
- **跨域访问限制**：不同源的 **iframe**，父页面和 **iframe **之间无法互相访问 **DOM** 或 **JS**
- **独立执行环境**：内部 **JS**、变量和事件独立运行，不干扰父页面  <!--很多JS沙箱就是利用这个-->
- **渲染独立性**：布局和样式不受父页面影响，滚动也独立
- **权限控制**：可通过 `sandbox` 限制脚本执行、表单提交、同源访问等 <!--很多安全控制利用这个-->

**主要用途：**

1. **嵌入第三方内容**
   - 广告、分析、社交插件、视频播放器等
2. **隔离不可信代码**
   - 可配合 `sandbox` 属性限制 JS 执行、表单提交、父页面访问等
3. **跨域内容显示**
   - 通过 **iframe** 显示不同域的页面，同时保持主页面安全
4. **页面布局/微前端**
   - 某些复杂系统或微前端架构使用 **iframe** 实现模块隔离
5. **安全隔离用户生成内容（UGC）**
   - 防止评论区或论坛用户提交的 **HTML/JS** 影响主页面

### 二、核心属性

| 属性               | 功能                                             |
| ------------------ | ------------------------------------------------ |
| `src`              | 指定嵌入文档的 URL                               |
| `width` / `height` | 设置 iframe 尺寸                                 |
| `sandbox`          | 启用沙箱限制（可禁止 JS、表单、导航父页面等）    |
| `allow`            | 授权 iframe 使用某些特性，如摄像头、麦克风、全屏 |
| `srcdoc`           | 直接在 iframe 中写 HTML 内容，而不是加载 URL     |
| `name`             | iframe 名称，可用于表单目标或跨 iframe 通信      |
| `referrerpolicy`   | 控制发送给 iframe 的 Referer 信息                |
| `loading`          | `lazy` / `eager`，控制懒加载                     |

#### 2.1、沙箱（sandbox）特性

**作用**：限制 **iframe** 内内容对主页面和浏览器环境的访问

**默认行为**：开启 `sandbox` 后，**JS**、表单、导航、插件等默认禁止

**常用选项**：

- `allow-scripts`：允许执行 **JS**
- `allow-forms`：允许表单提交
- `allow-same-origin`：允许同源访问
  - 不加 `allow-same-origin` 时，即使同源，也会被视为**不同源**，因此无法访问父页面的 **DOM** 或 **cookies**


**适用场景**：

- 不信任的第三方内容
- 广告或分析脚本隔离
- 防止用户提交的 HTML/JS 影响主页面

### 三、跨域与安全

**跨域限制**：

- 不同 **origin** 的情况下，**iframe** 内 **JS** 默认无法访问父页面的 **DOM**
- 可以通过 `window.postMessage` 安全通信

**防护措施**：

- **CSP** 配合 **iframe** 使用
- 设置 `X-Frame-Options` 防止点击劫持
- 使用 `sandbox` 限制脚本权限

### 四. 与父页面交互

**window.postMessage**

- 支持跨域安全通信

```js
// 父页面发送消息
iframe.contentWindow.postMessage('hello', 'https://example.com');

// iframe 内接收
window.addEventListener('message', e => console.log(e.data));
```

**同源情况下**：

- 可以直接访问 `iframe.contentWindow` 或 `iframe.contentDocument` 操作 **DOM**
- 可以调用函数或读取变量