## Resize 相关

### 一、CSS 的 resize 属性

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

### 二、使用 ResizeObserver 监控元素尺寸变化

`ResizeObserver` 是一个 **JavaScript** 内置构造函数 ，用于观察元素的大小变化，它提供了一种更高效的方法来检测 **DOM** 元素尺寸的变化，而不需要轮询或监听全局的 `resize` 事件

**使用 `ResizeObserver` 的步骤**：

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

