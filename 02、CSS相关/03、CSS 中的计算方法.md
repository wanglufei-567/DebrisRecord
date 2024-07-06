## CSS 中的计算方法

### 一、常用的计算方法

#### 1.1、calc 函数 <!--重要-->

**CSS** 的 `calc` 函数允许在 **CSS** 属性值中进行==简单的算术运算==，这使得我们可以在样式表中动态地设置属性值，而不需要通过 **JavaScript** 来计算和设置这些值 

`calc()` 函数支持加法 (`+`)、减法 (`-`)、乘法 (`*`)、和除法 (`/`) 运算

使用 `calc()` 时，需要注意以下几点：

- 加法和减法运算符两侧必须有空格
  - 例如：`calc(100% - 50px)`

- 乘法和除法运算符两侧可以没有空格
  - 例如：`calc(100% * 0.5)` 或 `calc(100% / 2)`

- 可以混合使用不同的单位
  - 例如：`calc(100% - 50px)`，`calc(2em + 5px)`

**示例：**

```css
div {
  width: calc(100% - 20px);
  height: calc(100vh - 50px);
}
```

在这个示例中，`div` 的宽度是视口宽度减去 20 像素，高度是视口高度减去 50 像素

#### 1.2、var 函数 <!--很重要-->

**CSS** 中的 `var` 函数用于引用**自定义属性**（也称为 **==CSS 变量==**）`var()` 函数的基本语法如下：

- 语法：`var(--name, fallback)`
- 参数：
  - `--name` 是要引用的自定义属性的名称
  - `fallback` 是可选的，默认值，当引用的自定义属性没有定义或无效时将使用这个值

**示例：**

```css
:root {
  --main-color: #3498db;
  --padding: 20px;
}

div {
  color: var(--main-color);
  padding: var(--padding);
}
```

在这个示例中，`--main-color` 和 `--padding` 是在 `:root` 选择器中定义的自定义属性

在 `div` 元素中使用 `var(--main-color)` 和 `var(--padding)` 来引用这些自定义属性的值

> **CSS 变量**允许在多个地方使用相同的值，并且只需在一个地方进行更改即可更新所有引用的地方
>
> - **CSS 变量**通常定义在 `:root` 选择器内，这样它们就具有全局作用域，可以在整个文档中使用
>
>   ```css
>   :root {
>       --main-bg-color: #cceeff;
>       --main-text-color: #333333;
>       --main-padding: 10px;
>   }
>   ```
>
> - **CSS 变量**可以保存任何有效的 **CSS** 值，包括颜色、尺寸、比例或甚至整个声明块，还可以一次保存多个值，只要这些值可以在需要的上下文中被解析
>
>   - 存储 **RGB** 颜色值，并使用它们：
>
>   ```css
>   :root {
>       --main-color: 204, 238, 255;
>   }
>   
>   body {
>       background-color: rgb(var(--main-color));
>   }
>   
>   .button {
>       background-color: rgba(var(--main-color), 05); /* 使用透明度 */
>   }
>   ```
>
>   - 存储多个尺寸值，并使用它们：
>
>   ```css
>   :root {
>       --padding-values: 10px 15px 20px 25px;
>   }
>   
>   .container {
>       padding: var(--padding-values);
>   }
>   ```
>
>   - 存储一组相关的样式属性值：
>
>   ```css
>   :root {
>       --box-shadow-values: 0px 4px 8px rgba(0, 0, 0, 0.1);
>   }
>   
>   .card {
>       box-shadow: var(--box-shadow-values);
>   }
>   ```
>
>   - 存储一组复杂的组合属性：
>
>   ```css
>   :root {
>       --complex-combination: 20px solid red, 10px, 1.5;
>   }
>   
>   .box {
>       border: var(--complex-combination); /* 使用组合属性的一部分 */
>       margin: var(--complex-combination);
>       line-height: var(--complex-combination);
>   }
>   /* 变量 --complex-combination 保存了一组复杂的属性值,不同的 CSS 属性可以根据需要引用这些值 */
>   ```

#### 1.3、min 函数和 max 函数

`min()` 和 `max()`：用于返回一组值中的最小值或最大值

```css
div {
  width: min(50%, 200px);
}
```

在这个示例中，`div` 的宽度会在 50% 和 200 像素之间取最小值

#### 1.4、rgb 函数和 rgba 函数 <!--一般重要-->

**RGB**（**Red**, **Green**, **Blue**）颜色模型是通过混合红、绿、蓝三种颜色的不同强度来生成各种颜色的

在 **CSS** 中，`rgb()` 函数用于定义颜色，其规则如下：

- **语法**: `rgb(red, green, blue)`
- **参数**:
   - `red`: 红色分量，范围是 0 到 255 或 0% 到 100%
   - `green`: 绿色分量，范围是 0 到 255 或 0% 到 100%
   - `blue`: 蓝色分量，范围是 0 到 255 或 0% 到 100%

**示例**:

```css
.element {
    color: rgb(255, 0, 0);  /* 纯红色 */
    background-color: rgb(0, 255, 0);  /* 纯绿色 */
    border-color: rgb(0, 0, 255);  /* 纯蓝色 */
    box-shadow: 0 0 10px rgb(100%, 50%, 50%);  /* 淡红色的阴影 */
}
```

**RGBA** 是在 **RGB** 基础上增加了 **Alpha** 通道（透明度）的颜色模型

在 **CSS** 中，`rgba()` 函数用于定义带有透明度的颜色，适用于背景、阴影、覆盖层等场景

其规则如下：

- **语法**: `rgba(red, green, blue, alpha)`
- **参数**:
   - `red`: 红色分量，范围是 0 到 255 或 0% 到 100%
   - `green`: 绿色分量，范围是 0 到 255 或 0% 到 100%
   - `blue`: 蓝色分量，范围是 0 到 255 或 0% 到 100%
   - `alpha`: 透明度，范围是 0 到 1，0 表示完全透明，1 表示完全不透明

**示例**:
```css
.element {
    color: rgba(255, 0, 0, 0.5);  /* 半透明的红色 */
    background-color: rgba(0, 255, 0, 0.3);  /* 半透明的绿色 */
    border-color: rgba(0, 0, 255, 0.8);  /* 80% 不透明的蓝色 */
    box-shadow: 0 0 10px rgba(100%, 50%, 50%, 0.7);  /* 70% 不透明的淡红色阴影 */
}
```

### 二、媒体查询方法

**CSS** 中的媒体查询（**media queries**）是用于在不同的设备和屏幕尺寸上应用不同样式的一种强大工具

媒体查询允许根据设备的特性（如宽度、高度、分辨率、方向等）来指定不同的 **CSS** 规则，从而实现响应式设计

下面是关于媒体查询的一些详细介绍：

**基本语法**：

```css
@media 媒体类型 and (条件) {
  /* 样式规则 */
}
```

例如：

```css
/* 适用于屏幕宽度不超过 600 像素的设备 */
@media screen and (max-width: 600px) {
  body {
    background-color: lightblue;
  }
}
```

#### 2.1、常用媒体特性

1. **width 和 height**：表示视口的宽度和高度
   
   ```css
   @media (min-width: 768px) {
     /* 适用于宽度不小于 768 像素的设备 */
   }
   ```
   
2. **device-width 和 device-height**：表示设备的屏幕宽度和高度
   
   ```css
   @media (min-device-width: 1024px) {
     /* 适用于设备宽度不小于 1024 像素的设备 */
   }
   ```
   
3. **orientation**：表示设备的方向，值可以是 `portrait`（纵向）或 `landscape`（横向）
   
   ```css
   @media (orientation: landscape) {
     /* 适用于横向模式的设备 */
   }
   ```
   
4. **resolution**：表示设备的分辨率，通常用于高分辨率（**Retina**）屏幕
   
   ```css
   @media (min-resolution: 2dppx) {
     /* 适用于分辨率不低于 2dppx 的设备 */
   }
   ```
   
5. **aspect-ratio**：表示视口宽高比
   
   ```css
   @media (min-aspect-ratio: 16/9) {
     /* 适用于宽高比不小于 16:9 的设备 */
   }
   ```

#### 2.2、组合媒体查询

可以通过 `and`、`not` 和 `only` 等关键字组合多个媒体查询条件：

- **and**：将多个条件组合在一起
  
  ```css
  @media screen and (min-width: 600px) and (max-width: 1200px) {
    /* 适用于宽度在 600 到 1200 像素之间的设备 */
  }
  ```
  
- **not**：排除特定条件
  
  ```css
  @media not screen and (max-width: 600px) {
    /* 不适用于宽度不超过 600 像素的设备 */
  }
  ```
  
- **only**：仅针对特定媒体类型应用样式
  
  ```css
  @media only screen and (max-width: 600px) {
    /* 仅适用于屏幕宽度不超过 600 像素的设备 */
  }
  ```

#### 2.3、媒体查询的实际应用

媒体查询广泛应用于响应式设计中，以适应不同设备的显示需求

例如，可以根据屏幕尺寸调整布局、字体大小、图像大小等

```css
/* 针对手机 */
@media screen and (max-width: 600px) {
  body {
    font-size: 14px;
  }
}

/* 针对平板 */
@media screen and (min-width: 601px) and (max-width: 1024px) {
  body {
    font-size: 16px;
  }
}

/* 针对桌面 */
@media screen and (min-width: 1025px) {
  body {
    font-size: 18px;
  }
}
```

通过使用媒体查询，可以确保网站在不同设备上都具有良好的用户体验