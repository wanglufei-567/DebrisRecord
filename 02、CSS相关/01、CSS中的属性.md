## CSS中的属性

### 一、尺寸属性

- `width`、`height`
  - 设置的是元素的==可见宽度和高度==<!--不包括内外边距、边框和滚动条（如果存在）-->
  - `width`、`height`  的默认值为 `auto` 
    - 表示元素的宽度、高度会自动根据其内容来调整，即根据元素内部的内容自动扩展或收缩以适应内容的大小
  
- `overflow`
  1. `visible`：==默认值==，内容不会被修剪，会呈现在元素框之外
  2. `hidden`：与`visible`相反，内容会被修剪，并且其余内容是不可见的
  3. `scroll`：内容会被修剪，但是浏览器会显示滚动条以便查看其余的内容
  4. `auto`：如果内容被修剪，则浏览器会显示滚动条以便查看其余的内容，解决了`scroll`在不需要滚动条也会产生滚动条的问题

### 二、Flex属性

**Flex** 是 **Flexible Box** 的缩写，意为"**弹性布局**"，用来为盒状模型提供最大的灵活性

> 在传统的CSS布局中，元素被分为 `block-level` 和 `inline-level` ：
>
> - `block-level `元素通常会占据其父元素的整个宽度
> - `inline-level` 元素则不会，它们会在文档流中水平排列
>
> 当一个元素的 `display` 属性设置为 `flex`，这个元素便成为了一个弹性容器，其子元素的布局不再由它们原本的 `block` 或 `inline` 属性决定，而是由弹性盒模型（`Flexbox Layout`）控制
>
> 在弹性盒模型中，子元素变成了弹性项目（`flex items`），并且都是作为块级别的盒子来处理，它们的宽度==默认是由它们的内容决定的==，这与`inline-block`元素类似，但弹性项目的宽度也可以通过设置 `flex` 属性来控制

- `flex`属性是`flex-grow`, `flex-shrink` 和 `flex-basis`的简写，默认值为 `0 1 auto`，简写形式如下：

  ```css
  flex: [flex-grow] [flex-shrink] [flex-basis];
  ```

  - `flex-grow`：定义子容器的瓜分剩余可用空间的比例
    - 默认为 `0`，即如果存在剩余空间，也不会去瓜分
  - `flex-shrink`：定义子容器在空间不足时缩小的比例
    - 也是一个无单位的数字，默认值是1

  - `flex-basis`：定义弹性子项在分配空间之前的基础大小
    - 可以指定具体的长度值（如像素或百分比），也可以使用关键词如`auto`，默认值是`auto`，它表示子项的本来大小
    - 优先级：`max-width`/`min-width` > `flex-basis` > `width` > `box`


### 三、动画属性

#### 3.1、transform属性相关

`transform`属性是用于通过对元素进行变换来修改元素的视觉呈现

这些变换可以包括**平移**、**旋转**、**缩放**和**倾斜**等操作，从而改变元素的位置、大小和形状

以下是一些常见的`transform`属性及其示例：

- **平移（Translation）：** 通过`translate`函数来移动元素的位置，这是通过改变元素的 **X** 和 **Y** 坐标来实现的

  ```css
  .box {
    transform: translate(50px, 20px);
  }
  ```

- **旋转（Rotation）：** 使用`rotate`函数可以使元素旋转指定的角度

  ```css
  .box {
    transform: rotate(45deg); /* 将元素顺时针旋转45度 */
  }
  ```

- **缩放（Scale）：** 使用`scale`函数可以放大或缩小元素

  ```css
  .box {
    transform: scale(1.5); /* 将元素放大1.5倍 */
  }
  ```

- **倾斜（Skew）：** 使用`skew`函数可以使元素倾斜

  ```css
  .box {
    transform: skew(30deg, 20deg); /* 在X和Y轴上分别倾斜元素 */
  }
  ```

- **组合变换：** 可以将多个`transform`函数组合在一起以应用多个变换

  ```css
  .box {
    transform: translate(50px, 20px) rotate(45deg) scale(1.5);
  }
  ```

- **变换原点（Transform Origin）：** 通过`transform-origin`属性可以指定变换的原点，这是变换操作的基准点

  ```css
  .box {
    transform-origin: top left; /* 将变换基点设置为元素的左上角 */
    transform: rotate(45deg);
  }
  ```

`transform`属性的示例可以用于创建各种动画、用户交互效果和页面布局

这些变换通常==不会影响元素的文档流==，因此可以与其他布局属性一起使用，以实现复杂的页面设计和动画效果

#### 3.2、transition属性

`transition` 是 **CSS** 中的一个属性，主要用于==在一定的时间内平滑地改变 **CSS** 属性的值==，它是一个简写属性，用于设置四个过渡属性：

- `transition-property`：规定设置过渡效果的 **CSS** 属性的名称
  - 可以是任何 **CSS** 属性，如 `width`、`height`、`color` 等，特殊的值 `all` 表示所有属性都将过渡
- `transition-duration`：规定完成过渡效果需要多少秒或毫秒
  - 例如，2s 表示过渡效果持续 2 秒
- `transition-timing-function`：规定速度效果的速度曲线，这决定了过渡效果的中间状态，也就是过渡效果如何从开始状态过渡到结束状态，常见的值有 ：
  - `linear`（线性）
  - `ease`（缓入缓出）
  - `ease-in`（缓入）
  - `ease-out`（缓出）
  - `ease-in-out`（先缓入后缓出）
- `transition-delay`：定义过渡效果何时开始
  - 例如，1s 表示过渡效果将在 1 秒后开始

这四个属性可以单独使用，也可以一起使用

当一起使用时，可以使用 `transition` 属性进行简写

例如：

```css
div {
  transition: width 2s ease-in-out 1s;
}
```

这行代码表示 `div` 元素的 `width` 属性将在 2 秒内平滑地改变，过渡效果为先缓入后缓出，过渡效果将在 1 秒后开始

示例: 

`hover` 到一个元素上时，其宽度可以自适应扩大到父元素宽度

```html
<div class="parent">
  <div class="child">文案00000000000</div>
</div>
```

```css
.rounded-div {
  display: flex;
  flex-direction: row;
  width: 400px;
  height: 100px;
}
.element{
  flex-grow: 0;
  transition: flex-grow 5s;
}
.rounded-div:hover .element {
  flex-grow: 1;
}
```



### 不常用的属性：

#### grid属性

**grid** 属性用于==创建网格布局==，在网格布局中，页面被划分为多个网格，可以任意组合不同的网格，做出各种各样的布局

当一个元素的 `display` 属性设置为 `grid` 或 `inline-grid` 后，它就变成了一个网格容器，这个元素的所有直系子元素将成为网格元素

在 `display` 设置为 `grid` 时，可以设置的一些属性包括：

- `grid-template-rows` 和 `grid-template-columns`：定义网格中的行和列的大小
- `grid-template-areas`：定义网格区域
- `grid-auto-rows` 和 `grid-auto-columns`：定义隐式网格的行和列的大小
- `grid-auto-flow`：控制自动布局算法的运作方式
- `grid-column-gap` 和 `grid-row-gap`：设置列和行之间的间隙
- `grid-gap`：`grid-row-gap` 和 `grid-column-gap` 的简写属性
- `grid-column-start`，`grid-column-end`，`grid-row-start` 和 `grid-row-end`：定义网格元素的网格线

此外，`grid` 属性是一个简写属性，可以用来设置显式网格属性（`grid-template-rows`、`grid-template-columns` 和 `grid-template-areas`），隐式网格属性（`grid-auto-rows`、`grid-auto-columns` 和 `grid-auto-flow`），以及间距属性（`grid-column-gap` 和 `grid-row-gap`）

示例：

```html
<div class="grid-container">
  <div class="grid-item">1</div>
  <div class="grid-item">2</div>
  <div class="grid-item">3</div>
  <div class="grid-item">4</div>
  <div class="grid-item">5</div>
  <div class="grid-item">6</div>
</div>
```

在这个例子中，我们有一个 `.grid-container` 类的元素，它包含了六个 `.grid-item` 类的子元素

```css
.grid-container {
  display: grid;
  grid-template-columns: auto auto auto;
  grid-gap: 10px;
}

.grid-item {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 20px;
  font-size: 30px;
  text-align: center;
}
```

在这个例子中，`.grid-container` 的 `display` 属性被设置为 `grid`，这使得它成为一个网格容器

- `grid-template-columns: auto auto auto` :表示容器被划分为三列，每列的宽度由其内容决定
- `grid-gap: 10px` :设置了网格单元之间的间距

`.grid-item` 的样式则用于设置网格单元的外观