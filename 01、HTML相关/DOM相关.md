## 文档对象模型DOM

### 一、简述

> 文档对象模型（DOM）是 web 上构成文档结构和内容的对象的数据表示
>
> DOM 提供了对整个文档的访问模型，将文档作为一个树形结构，树的每个结点表示了一个 HTML 标签或标签内的文本项
>
> DOM 是一种跨平台的、独立于编程语言的 API，它把 HTML、XHTML 或 XML 文档当作一个树结构，而每个节点视为一个对象，这些对象可以被编程语言操作，进而改变文档的结构，映射到文档的显示

![image-20220410140143806](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220410140143806.png)

- `document` 是**DOM 树**中的一个节点，通常是整个**DOM 树**的根节点
- `html`是文档对象的一个节点，有两个字节点<head/> 和<body/>
- `dom`节点有很多种类型，元素节点、文本节点、属性节点
- `dom`元素是像<div></div>或者<p/>这种特殊的节点

### 二、DOM事件相关

### 2.1、scroll事件

当用户滚动指定的元素时，会触发 `scroll` 事件，这个事件适用于所有可滚动的元素和 window 对象（浏览器窗口）

使用示例：

```javascript
window.addEventListener('scroll', function(event) {  console.log('滚动...'); }); 
```

相关属性：

- `window.scrollY` 和 `window.scrollX`（只读）:

  - `window.scrollY` 返回文档在垂直方向上的滚动距离，以像素为单位
  - `window.scrollX` 返回文档在水平方向上的滚动距离，以像素为单位

  ```javascript
  const verticalScrollPosition = window.scrollY;
  const horizontalScrollPosition = window.scrollX;
  ```

- `element.scrollTop` 和`element.scrollLeft` （==**可写**==）:

  - `element.scrollTop` 返回特定元素的垂直滚动距离
  - `element.scrollLeft` 返回特定元素的水平滚动距离

  ```javascript
  const container = document.getElementById('scrollableContainer');
  const scrollTop = container.scrollTop;
  ```

  - `scrollTop` 和`scrollLeft` 属性可用于将元素滚动到指定位置

  ```javascript
  const container = document.getElementById('scrollableContainer');
  container.scrollTop = 200; // 将容器滚动到垂直位置200像素处
  ```

- `element.scrollHeight` 和 `element.scrollWidth`（只读）:

  - `element.scrollHeight` 返回元素的内容高度，包括不可见部分

  - `element.scrollWidth` 返回元素的内容宽度，包括不可见部分 

    <!--这些属性可用于检查元素是否需要滚动-->

  ```javascript
  const container = document.getElementById('scrollableContainer');
  const isOverflowingVertically = container.scrollHeight > container.clientHeight;
  ```

相关事件：

- `scrollend`：当用户停止滚动时，会触发 `scrollend` 事件
  - 这个事件可以用来检测用户何时停止滚动，从而执行一些操作，比如懒加载图片
- `scrollstart`：当用户开始滚动时，会触发 `scrollstart` 事件
  - 这个事件可以用来检测用户何时开始滚动