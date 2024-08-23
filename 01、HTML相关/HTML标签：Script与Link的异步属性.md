## HTML标签：Script与Link的异步属性

### 一、前言

在Web开发中，我们经常会使用到`<script>`和`<link>`这两个HTML标签，这两个标签各自都有一些属性可以帮助我们优化页面加载性能：

- `<script>`标签的`defer`和`async`属性
- `<link>`标签的`prefetch`和`preload`属性

本文将详细介绍这些属性的作用和使用场景

### 二、`<script>`与`<link>`标签的区别

首先，我们来看一下`<script>`和`<link>`这两个标签的基本区别

- `<script>`标签主要用于嵌入或引用**JavaScript**代码，**JavaScript**代码可以直接写在`<script>`标签内，也可以通过`src`属性引用外部**JavaScript**文件

```html
<script>
  console.log('Hello, World!');
</script>

<script src="app.js"></script>
```

- `<link>`标签主要用于链接**CSS**样式表或其他外部资源，它通常使用`href`属性指定要链接的资源的**URL**，`rel`属性定义当前文档与被链接资源之间的关系

```html
<link rel="stylesheet" href="styles.css">
```

### 三、`<script>`标签的`defer`和`async`属性

`<script>`标签的`defer`和`async`属性都是==用来控制浏览器如何异步加载外部**JavaScript**文件==

- `defer`属性：默认值为`false`
  - 没有设置或设置为`false`，脚本会立即加载并执行
  - 当设置为`true`时，脚本会在文档解析完成后，触发  **DOMContentLoaded** 事件前执行
  - 如果有多个带有`defer`属性的`<script>`标签，它们会按照在文档中出现的顺序依次执行

```html
<script src="app.js" defer></script>
```

- `async`属性：默认值为`false`
  - 如果没有设置或设置为`false`，脚本会在文档解析过程中同步加载和执行
  - 当设置为`true`时，脚本会异步加载，一旦脚本可用，就会立即执行，不会等待其他脚本或 **DOMContentLoaded** 事件

```html
<script src="app.js" async></script>
```

### 四、`<link>`标签的`prefetch`和`preload`属性

`<link>`标签的`prefetch`和`preload`属性都是==用来优化资源加载的==

- `prefetch`属性：没有默认值
  - 当`<link>`标签的`rel`属性设置为`prefetch`时，浏览器会在==**空闲时**预先获取==指定的资源，并存储在缓存中，以便将来使用，最常见的 `dns-prefetch`
    - 比如，当我们在浏览A页面，如果会通过A页面中的链接跳转到B页面，而B页面中我们有些资源希望尽早提前加载，那么我们就可以在A页面里添加这些资源 `Prefetch` ，那么当浏览器空闲时，就会去加载这些资源
    - 对于那些可能在用户的下一个导航或未来的某个时间点需要的资源非常有用

```html
<link rel="prefetch" href="next-page.html">
```

- `preload`属性：没有默认值
  - 当`<link>`标签的`rel`属性设置为`preload`时，浏览器会**==预先加载==**指定的资源，并尽快使其可用从而提高这些资源的请求优先级
    - 比如，对于那些本来请求优先级较低的关键请求，可以通过设置 `Preload` 来提升这些请求的优先
    - 这对于那些在当前页面需要的关键资源非常有用

```html
<link rel="preload" href="styles.css" as="style">
```

对于那些可能在当前页面使用到的资源可以利用 `Preload`，而对一些可能在将来的某些页面中被使用的资源可以利用 `Prefetch`

如果从加载优先级上看，`Preload` 会提升请求优先级；而 `Prefetch` 会把资源的优先级放在最低，当浏览器空闲时才去预加载



