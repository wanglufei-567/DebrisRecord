## CSS中的属性

### 一、尺寸属性

- `width`、`height`
  - 设置的是元素的==可见宽度和高度==，不包括内外边距、边框和滚动条（如果存在）
  - `width`、`height`  的默认值为 `auto` 表示元素的宽度、高度会自动根据其内容来调整，即根据元素内部的内容自动扩展或收缩以适应内容的大小。
  
- `overflow`
  1. `visible`：==默认值==，内容不会被修剪，会呈现在元素框之外
  2. `hidden`：与`visible`相反，内容会被修剪，并且其余内容是不可见的
  3. `scroll`：内容会被修剪，但是浏览器会显示滚动条以便查看其余的内容
  4. `auto`：如果内容被修剪，则浏览器会显示滚动条以便查看其余的内容，解决了`scroll`在不需要滚动条也会产生滚动条的问题

### 二、动画属性

#### 2.1、transform属性相关

`transform`属性是用于通过对元素进行变换来修改元素的视觉呈现

这些变换可以包括平移、旋转、缩放和倾斜等操作，从而改变元素的位置、大小和形状

以下是一些常见的`transform`属性及其示例：

- **平移（Translation）：** 通过`translate`函数来移动元素的位置，这是通过改变元素的X和Y坐标来实现的

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
    transform: scale(1.5); /* 将元素放大1.5倍。 */
  }
  ```

- **倾斜（Skew）：** 使用`skew`函数可以使元素倾斜

  ```css
  .box {
    transform: skew(30deg, 20deg); /* 在X和Y轴上分别倾斜元素。 */
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
    transform-origin: top left; /* 将变换基点设置为元素的左上角。 */
    transform: rotate(45deg);
  }
  ```

`transform`属性的示例可以用于创建各种动画、用户交互效果和页面布局。这些变换通常==不会影响元素的文档流==，因此可以与其他布局属性一起使用，以实现复杂的页面设计和动画效果

### 三、Flex属性

**Flex** 是 **Flexible Box** 的缩写，意为"**弹性布局**"，用来为盒状模型提供最大的灵活性

 `flex`属性是`flex-grow`, `flex-shrink` 和 `flex-basis`的简写，默认值为 `0 1 auto`，简写形式如下：

```css
flex: [flex-grow] [flex-shrink] [flex-basis];
```

- `flex-grow`：定义子容器的瓜分剩余可用空间的比例
  - 默认为 `0`，即如果存在剩余空间，也不会去瓜分
- `flex-shrink`：定义子容器在空间不足时缩小的比例
  - 也是一个无单位的数字，默认值是1
- `flex-basis`：定义弹性子项在分配空间之前的基础大小
  - 可以指定具体的长度值（如像素或百分比），也可以使用关键词如`auto`。默认值是`auto`，它表示子项的本来大小
  - 优先级：`max-width`/`min-width` > `flex-basis` > `width` > `box`

