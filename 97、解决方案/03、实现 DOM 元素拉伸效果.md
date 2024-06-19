

## 实现 DOM 元素拉伸效果

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

- `resize` 属性仅在元素的 `overflow` 属性值不是 `visible` 时才有效。
- 对于某些元素（例如 `<textarea>`），在某些浏览器中可能需要使用 `overflow: auto` 或 `overflow: scroll` 来确保调整大小功能正常工作。

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

### 二、使用 CSS 实现 DOM 元素拉伸

**具体方案：**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <style>
      .column {
        display: flex;
      }
      .column-left {
        height: 400px;
        background-color: #fff;
        position: relative;
      }
      /* 内容区域 */
      .resize-save {
        /* 设置 absolute 是为了内容区域可以覆盖可拖动区域 */
        position: absolute;
        top: 0;
        /* 设置 right 是为了使内容区域不完全覆盖可拖动区域，使可拖动区域留一些空白地方*/
        right: 5px;
        bottom: 0;
        left: 0;
        overflow-x: hidden;
      }
      /* 可拖动区域
        可拖动区域由于设置了 resize 属性，其宽度可以拖动调整，其宽度会撑开父容器.column-left的宽度
        而内容区域由于设置了 position:absolute 所以其宽度会随着父容器.column-left的宽度变化自动调整
        从而实现了内容区域款的的宽度可拖动改变的效果
      */
      .resize-bar {
        /* 默认宽度*/
        width: 200px;
        /* 继承父容器高度 */
        height: inherit;
        resize: horizontal;
        /* 设置 opacity 为 0 使可拖动区域不可见 */
        opacity: 0;
        /* 设置 resize 是，overflow 不能为 visible*/
        overflow: auto;
      }
      /* 拖拽线，只用于显示效果 */
      .resize-line {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        border-right: 2px solid #eee;
        border-left: 1px solid #bbb;
        pointer-events: none;
      }
      .resize-bar:hover ~ .resize-line,
      .resize-bar:active ~ .resize-line {
        border-left: 1px dashed skyblue;
      }
      /* 对于 webkit 浏览器设置右下角拖动小三角的大小 */
      .resize-bar::-webkit-scrollbar {
        width: 200px;
        height: inherit;
      }
      .column-right {
        height: 400px;
        padding: 16px;
        background-color: #eee;
        box-sizing: border-box;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div class="column">
      <div class="column-left">
        <div class="resize-save">左侧的内容，左侧的内容，左侧的内容，左侧的内容</div>
        <div class="resize-bar"></div>
        <div class="resize-line"></div>
      </div>
      <div class="column-right">右侧的内容，右侧的内容，右侧的内容，右侧的内容</div>
    </div>
  </body>
</html>
```

**方案细节：**

- `.column-left`：父容器，宽度随着拉伸大小而决定
- `.resize-bar`：可以拉伸的容器, 控制父容器的宽度
- `.resize-save`：真正展示内容的容器，其宽度由父容器决定

**实现效果：**

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202406191554919.gif)

### 三、借助 re-resizable 实现 DOM 元素拉伸

`re-resizable` 是一个用于 **React** 的可调整大小（`resizable`）的组件

它提供了一种简单的方法来实现可调整大小的 **UI** 元素，支持多种方向的调整，并提供了丰富的 API 和事件来满足不同的需求

**安装**

```bash
npm install re-resizable
```
**基本用法**

以下是一个基本的使用示例：

```jsx
import React from 'react';
import { Resizable } from 're-resizable';

function App() {
  return (
    <div>
      <Resizable
        defaultSize={{
          width: 200,
          height: 200,
        }}
      >
        <div style={{ border: '1px solid black', padding: '20px' }}>
          可调整大小的组件
        </div>
      </Resizable>
    </div>
  );
}

export default App;
```

**主要属性**

- `defaultSize`: 初始大小，包括 `width` 和 `height`
- `size`: 固定大小
  - 若设置此属性，则元素大小将无法调整，只能通过改变 `size` 属性来更新大小

- `minWidth`, `minHeight`, `maxWidth`, `maxHeight`: 限制调整大小的最小和最大宽度、高度
- `onResizeStart`, `onResize`, `onResizeStop`: 回调函数，用于在调整大小的不同阶段执行操作

**示例 1：限制调整大小的范围**

```jsx
import React from 'react';
import { Resizable } from 're-resizable';

function App() {
  return (
    <div>
      <Resizable
        defaultSize={{
          width: 200,
          height: 200,
        }}
        minWidth={100}
        minHeight={100}
        maxWidth={300}
        maxHeight={300}
      >
        <div style={{ border: '1px solid black', padding: '20px' }}>
          可调整大小的组件（限制范围）
        </div>
      </Resizable>
    </div>
  );
}

export default App;
```

**示例 2：响应调整大小事件**

```jsx
import React from 'react';
import { Resizable } from 're-resizable';

function App() {
  const handleResizeStart = () => {
    console.log('开始调整大小');
  };

  const handleResize = (e, direction, ref, d) => {
    console.log('调整中', { e, direction, ref, d });
  };

  const handleResizeStop = () => {
    console.log('停止调整大小');
  };

  return (
    <div>
      <Resizable
        defaultSize={{
          width: 200,
          height: 200,
        }}
        onResizeStart={handleResizeStart}
        onResize={handleResize}
        onResizeStop={handleResizeStop}
      >
        <div style={{ border: '1px solid black', padding: '20px' }}>
          响应调整大小事件的组件
        </div>
      </Resizable>
    </div>
  );
}

export default App;
```

**示例 3：只允许水平方向调整大小**

```jsx
import React from 'react';
import { Resizable } from 're-resizable';

function App() {
  return (
    <div>
      <Resizable
        defaultSize={{
          width: 200,
          height: 200,
        }}
        enable={{
            top: false,
            right: true,
            bottom: false,
            left: true,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false,
        }}
      >
        <div style={{ border: '1px solid black', padding: '20px' }}>
          只能水平调整大小的组件
        </div>
      </Resizable>
    </div>
  );
}

export default App;

```

