## Observer 相关

### 一、概述

在现代 **Web** 应用中，**页面结构**、**元素尺寸**、**可见性状态**以及**性能指标**都可能随着用户操作和数据更新而**持续变化**

若通过定时器轮询等方式主动检查变化，不仅代码维护成本高，而且可能引发不必要的性能开销，因此，浏览器提供了一系列 **Observer API** 用于在变化发生时由浏览器主动触发回调，从而让开发者能够及时、低成本地响应这些变化

这些 **API** 不依赖传统事件模型，而是由浏览器在内部调度合适的执行时机进行统一通知，因此能够有效避免不必要的反复检查和资源浪费

#### 1.1、常见的 Observer API

| API 名称                 | 观察目标                  | 主要作用          | 常见场景                                  |
| ------------------------ | ------------------------- | ----------------- | ----------------------------------------- |
| **ResizeObserver**       | 元素尺寸（宽/高）         | 监听元素大小变化  |响应式布局、图表重绘|
| **IntersectionObserver** | 元素与视口/容器的交叉状态 | 判断元素是否可见  | 懒加载、曝光埋点、无限滚动  |
| **MutationObserver**     | **DOM** 结构、属性、文本  | 监听 **DOM** 变动 | 动态组件、富文本、第三方 **DOM** 插入监控 |
| **PerformanceObserver**  | 浏览器性能指标事件        | 采集性能数据      | **FCP/LCP/CLS** 指标上报、性能分析        |

### 二、ResizeObserver

#### 2.1、CSS 的 resize 属性

**CSS** 的 `resize` 属性允许用户设置元素是否可调整尺寸，以及可调整的方向

**语法：**

```css
resize: none | both | horizontal | vertical | block | inline;
```

**属性值：**

- `none`: 默认值，用户不能调整元素的大小
- `both`: 用户可以水平和垂直方向调整元素的大小
- `horizontal`: 用户只能水平调整元素的大小
- `vertical`: 用户只能垂直调整元素的大小
- `block`: 用户可以在块级（垂直）方向上调整大小
- `inline`: 用户可以在内联（水平）方向上调整大小

**注意事项：**

- `resize` 属性仅在元素的 `overflow` 属性值==**不是** `visible` 时才有效==

  > 当通过设置`resize` 属性允许用户调整元素大小时，浏览器需要明确的边界来处理这个调整
  >
  > 然而，`overflow: visible` 会让内容溢出元素的边界，没有明确的可视范围
  >
  > 因此，`resize` 和 `overflow: visible` 不能一起使用，以确保调整元素大小时的行为是明确且可控的

- 对于某些元素（例如 `<textarea>`），在某些浏览器中可能需要使用 `overflow: auto` 或 `overflow: scroll` 来确保调整大小功能正常工作

**使用示例：**

```html
<div class="resizable">
  <p class="resizable">
    此段落可在各个方向上调整尺寸，这是因为在此元素上 CSS `resize` 属性设置为
    `both`。
  </p>
</div>
```

```css
.resizable {
  resize: both;
  overflow: scroll;
  border: 1px solid black;
}

div {
  height: 300px;
  width: 300px;
}

p {
  height: 200px;
  width: 200px;
}
```

**使用效果：**

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202406191552275.png" alt="image-20240619155215478" style="zoom:50%;" />

<!--也可以直接使用拖动改变元素尺寸的三方库，re-resizable，这个库提供了一个名为 Resizable 的组件，允许用户通过拖动边缘或角落来改变元素的尺寸-->

#### 2.2、使用 ResizeObserver 监控元素尺寸变化

**ResizeObserver** 是一种用来检测 **DOM** 元素尺寸变化的方法，避免了轮询或监听全局的 `resize` 事件

**使用 ResizeObserver 的步骤**：

1. 创建 `ResizeObserver` 实例：

   - 传递一个回调函数，该函数会在观察到元素大小变化时执行

     ```js
     const resizeObserver = new ResizeObserver((entries) => {
       // 根据元素尺寸变化自定义逻辑
     });
     ```

     - 回调函数的参数 `entries` 是一个 [ResizeObserverEntry](https://developer.mozilla.org/zh-CN/docs/Web/API/ResizeObserverEntry) 对象数组，可以用于获取每个元素改变后的新尺寸

       <!-- entries 是一个数组，是因为 ResizeObserver 可以同时观察多个元素-->

       <!--另外需要注意的是： entries 数组中元素的顺序并不一定与 observe() 方法中添加观察的顺序一致，元素发生尺寸变化的顺序决定了它们在 entries 数组中的顺序，而不是观察它们的顺序，所以可以根据 target 判断当前ResizeObserverEntry对应的是哪个被观察的元素，可以通过元素 id 进行比对-->

     - 每个 `ResizeObserverEntry` 对象都有以下属性：

       - **`target`**：被观察的 **DOM** 元素

       - **`contentRect`**：一个 `DOMRectReadOnly` 对象，包含了被观察元素的内容区域（不包括边框和内边距）的尺寸和位置信息

         常用属性包括：

         - `width`：内容区域的宽度
         - `height`：内容区域的高度
         - `top`：内容区域相对于元素内容区的顶部边缘的位置（通常为0）
         - `bottom`：内容区域的底部边缘位置（`top + height`）
         - `left`：内容区域相对于元素内容区的左侧边缘的位置（通常为0）
         - `right`：内容区域的右侧边缘位置（`left + width`）

2. 调用 `observe` 方法：

   - 将目标元素传递给 `observe` 方法，以开始监听其大小变化

   - 当 `observe` 方法被调用时，监听函数会立即执行一次，提供被观察元素的当前尺寸

     ```js
     resizeObserver.observe(element)
     ```

3. 调用 `unobserve` 方法：

   - 在不再需要监听时，可以停止观察

     ```js
     resizeObserver.unobserve(element)
     ```

4. 调用 `disconnect` 方法：

   - 完全停止 `ResizeObserver` 实例的所有观察

     ```js
     resizeObserver.disconnect()
     ```

**示例**：

以下是一个使用 `ResizeObserver` 的完整示例：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ResizeObserver Example</title>
  <style>
    #a {
      display: flex;
      flex-direction: row;
      height: 100vh;
    }
    #b {
      flex: 1;
      border: 1px solid black;
      padding: 10px;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div id="a">
    <div id="b"></div>
  </div>

  <script>
    function updateContentBasedOnWidth(entries) {
      for (let entry of entries) {
        const bDiv = entry.target;
        const bWidth = entry.contentRect.width;

        let content;
        if (bWidth < 200) {
          content = '<p>Content for width < 200px</p>';
        } else if (bWidth >= 200 && bWidth < 400) {
          content = '<p>Content for width between 200px and 400px</p>';
        } else {
          content = '<p>Content for width >= 400px</p>';
        }

        bDiv.innerHTML = content;
      }
    }

    const bDiv = document.getElementById('b');
    const resizeObserver = new ResizeObserver(updateContentBasedOnWidth);
    
    // Start observing
    resizeObserver.observe(bDiv);

    // Optional: Stop observing after some condition
    // resizeObserver.unobserve(bDiv);
    // resizeObserver.disconnect();
  </script>
</body>
</html>
```

### 三、IntersectionObserver

**intersection** （**相交 / 交汇 / 交叉的区域**）表示元素与视口的交集区域，`inter` 含 “相互交错、在...之间” 之意

**IntersectionObserver** **API** 用于监听目标元素与视口（或指定容器）之间的相交状态变化，无需监听 `scroll` 性能更优

**常见场景：**

- 懒加载图片 / 视频
- 锚点高亮（**ScrollSpy**）
- 无限滚动加载
- 元素进入视区触发动画

#### 3.1、基本语法

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

#### 3.2、基本使用

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

### 五、MutationObserver

**MutationObserver** 用于监听 **DOM 节点结构、属性、文本内容** 的变化，这是识别 **DOM** 更新最直接、最低层的机制

**可监听的变动类型：**

- 节点添加 / 删除（`childList`）
- 节点属性变化（`attributes`）
- 文本节点内容变化（`characterData`）
- 是否递归监控子树（`subtree`）

**常见场景：**

- 监控动态插入的广告或第三方脚本对 **DOM** 的改动
- 富文本编辑器内容同步
- 前端框架中虚拟 **DOM** 的变动监听（早期用途）

**示例：**

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    console.log('变化类型:', mutation.type);
  });
});

observer.observe(document.body, {
  childList: true,
  attributes: true,
  subtree: true
});
```

### 六、PerformanceObserver

**PerformanceObserver** 用于监听浏览器性能指标事件，用于性能监控与数据上报

**常见场景：**

- 页面白屏时间、首次可绘制（**FP/FCP**）、最大内容绘制（**LCP**）等指标采集
- 长任务监控（**Long Task Detection**）
- 性能报表与可用性分析系统

**示例：**

```javascript
const po = new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => console.log(entry));
});
po.observe({ entryTypes: ['paint', 'longtask', 'navigation'] });
```

