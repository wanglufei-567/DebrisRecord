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

当用户滚动指定的元素时，会触发 `scroll` 事件，这个事件适用于所有可滚动的元素和 `window` 对象（浏览器窗口）

使用示例：

```javascript
window.addEventListener('scroll', function(event) {  console.log('滚动...'); }); 
```

相关属性：

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405251730710.png" alt="scrollTop / scrollHeight / clientHeight"  /><img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405251732975.png" alt="img" style="zoom: 40%;" />

- `element.scrollTop` 和`element.scrollLeft` （==**可写**==）:

  - `element.scrollTop` 返回某个特定滚动容器==元素==的垂直滚动距离
  - `element.scrollLeft` 返回某个特定滚动容器==元素==的水平滚动距离

  ```javascript
  const container = document.getElementById('scrollableContainer');
  const scrollTop = container.scrollTop;
  ```

  - `scrollTop` 和`scrollLeft` 属性可用于将==元素==滚动到指定位置

  ```javascript
  const container = document.getElementById('scrollableContainer');
  container.scrollTop = 200; // 将容器滚动到垂直位置200像素处
  ```

- `element.scrollHeight` 和 `element.scrollWidth`（**==只读==**）:

  - `element.scrollHeight` 返回==元素==的内容高度，包括不可见部分

  - `element.scrollWidth` 返回==元素==的内容宽度，包括不可见部分 

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

### 三、DOM 位置距离相关

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405251737181.png" alt="区别图" />
               <img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405251737040.png" alt="img" style="zoom:90%;" />

#### 3.1、位置距离属性

- `clientX`/`clientY`：这两个属性表示的是**鼠标指针**相对于**浏览器窗口可视区域**的  **X**  和  **Y**  坐标（单位为像素），不包括任何滚动偏移
- `clientWidth`/`clientHeight`：这两个属性表示元素的内部**宽度和高度**（单位为像素）
  - ==包括内边距，但不包括垂直滚动条（如果有）、边框和外边距==
  - 计算公式为
    - `clientWidth` = `content`宽度 + 左`padding` + 右`padding`
    - `clientHeight` = `content`高度 + 左`padding` + 右`padding` 
- `clientLeft`/`clientTop`: 这两个属性表示元素边框的宽度和高度

  - `clientLeft` 属性（只读）不包括元素的左内边距或左外边距
  - `clientTop` 属性（只读）不包括元素的上外边距和上内边距

------

- `offsetX`/`offsetY`：这两个属性表示**鼠标指针**相对于**触发事件的元素**的内填充边（`padding edge`）的 **X** 和 **Y** 坐标

- `offsetWidth`/`offsetHeight`：这两个属性表示元素的内部**宽度和高度（**单位为像素）

  - ==包括内边距、垂直滚动条（如果有）、边框，但不包括外边距==
  - 计算公式为
    - `offsetWidth` = `content`宽度 + 左`padding` + 右`padding` + 左`boder` + 右`boder`
    - `offsetHeight` = `content`高度 + 左`padding` + 右`padding` + 左`boder` + 右`boder`
- `offsetLeft`/`offsetTop`：这两个属性表示当前元素的 **左/上边框外边缘** 到最近的已定位父级元素（`offsetParent`） **左/上边框内边缘** 的距离 <!--比较常用-->

#### 3.2、位置距离方法

- `getBoundingClientRect()` ：用于获取元素的大小及其相对于视口的位置，返回一个 `DOMRect` 对象，其中包含了元素的位置和尺寸信息

  `DOMRect` 对象包含以下几个属性：

  - `x` / `left`：元素左上角的 x 坐标
  - `y` / `top`：元素左上角的 y 坐标
  - `width`：元素的宽度，通常等于 `offsetWidth` <!--包含内边距、边框、滚动条-->
  - `height`：元素的高度，通常等于 `offsetHeight` <!--包含内边距、边框、滚动条-->
  - `right`：元素右下角的 x 坐标
  - `bottom`：元素右下角的 y 坐标

  这些坐标是相对于视口的，也就是说，如果页面被滚动了，这些值会改变

  如果需要获取元素相对于整个文档的位置，可以加上 `window.scrollX` 和 `window.scrollY`

  例如：

  ```javascript
  var rect = element.getBoundingClientRect();
  var x = window.pageXOffset + rect.left;
  var y = window.pageYOffset + rect.top;
  ```

### 四、DOM intersection 相关

`intersection` （**相交 / 交汇 / 交叉的区域**）表示元素与视口的交集区域，`inter` 含“相互交错、在...之间”之意，浏览器提供一个 `IntersectionObserver` **API** 用于监听目标元素与视口（或指定容器）之间的相交状态变化，无需监听 `scroll`，性能更优

常用于：

- 懒加载图片 / 视频
- 锚点高亮（ScrollSpy）
- 无限滚动加载
- 元素进入视区触发动画

#### 4.1、基本语法

```javascript
// 创建观察器
const callback = (entries, observer) => {
  entries.forEach(entry => {
    // entry 为 IntersectionObserverEntry 对象
  });
};

const options = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver(callback, options);

// 观察目标
observer.observe(element);
observer.unobserve(element);   // 停止观察某个元素
observer.disconnect();        // 停止观察全部元素
```

- **options**
  - `root` :  用于判断“相交”的参考容器（即交叉检测的根
  - `rootMargin`:  对 `root`（通常是视口）边界做扩展或收缩
    - 用 **CSS margin** 语法写法
    - 例如 `rootMargin: "200px 0px"` 表示垂直方向提前 200px 就触发回调
  - `threshold`：触发回调所需的交集比率（`intersectionRatio`）阈值，取值范围 `0.0`~`1.0`，也可为数组（多阈值）
    - `0`（默认）：一旦元素与 root 有任意交集（哪怕 1px）即触发（进入/离开都会触发）
    - `1.0`：当元素**完全**进入 root 时才触发。
    - `[0, 0.25, 0.5, 0.75, 1]`：用于监听多个可视比例变化（常用于动画或精细进度感知）。
    - `0.1`：当元素至少 10% 可见时触发
- **entry**
  - `target` ：当前条目对应的被观察元素（DOM 元素）
  - `isIntersecting`：布尔值，表示目标是否当前与 `root` 有交集（是否“可见”）

#### 4.2、基本使用

使用 `IntersectionObserver` 实现图片懒加载

```html
<img data-src="real.jpg" src="placeholder.jpg" />
```

```javascript
// 懒加载示例（核心逻辑）

const images = document.querySelectorAll('img[data-src]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const img = entry.target;
    img.src = img.dataset.src;
    observer.unobserve(img);
  });
}, {
  root: null,
  threshold: 0,
  rootMargin: '200px'
});

images.forEach(img => observer.observe(img));
```

当图片即将进入视口区域（通过 `rootMargin: "200px"` 提前触发）时，将其真实图片地址从 `data-src` 替换至 `src`，从而延迟网络请求



