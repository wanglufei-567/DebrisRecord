## Echarts 简单使用

### 一、简介

**Echarts** 是由百度开发的一款开源数据可视化库，基于 **JavaScript** 构建，支持多种图表类型，包括柱状图、折线图、饼图、散点图、地图等。它以其强大的功能、灵活的配置和优秀的性能而广受欢迎，尤其是在需要动态更新数据和交互式可视化的场景中

**安装：**

**Echarts** 的安装非常简单，可以通过 **npm** 或直接引入 **CDN** 来使用

- 使用 **npm** 安装

```bash
npm install echarts
```

- 使用 **CDN** 引入

```html
<script src="https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js"></script>
```

#### 1.1、快速上手

以下是一个简单的示例，展示如何创建一个柱状图：

**HTML** 结构

```html
<div id="chart" style="width: 600px; height: 400px;"></div>
```

**JavaScript** 实现

```javascript
import * as echarts from 'echarts';

// 初始化图表实例
const chartDom = document.getElementById('chart');
const myChart = echarts.init(chartDom);

// 配置项
const option = {
  title: {
    text: 'Echarts 示例 - 柱状图',
  },
  tooltip: {},
  legend: {
    data: ['销量']
  },
  xAxis: {
    data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']
  },
  yAxis: {},
  series: [
    {
      name: '销量',
      type: 'bar',
      data: [5, 20, 36, 10, 10, 20]
    }
  ]
};

// 使用配置项生成图表
myChart.setOption(option);
```

运行上述代码后，一个简单的柱状图就会显示在页面上

#### 1.2、核心概念

1. **Option 配置项**：**Echarts** 图表配置通过一个 **JavaScript** 对象 `option` 来定义，它是 **Echarts** 图表的核心，包含了所有的图表配置
   
   - **title**：设置图表标题
   
   - **xAxis/yAxis**：定义坐标轴，可以设置坐标轴的类型、数据、样式等
   
     - **xAxis**：`type` 默认值是 `'category'`（类目轴）
   
     - **yAxis**： `type` 默认值是 `'value'`（数值轴）
   
       > 类目轴：通常用来表示离散类别的数据，通常关联一个维度（如时间、产品种类等）
       >
       > 数值轴：通常用来表示连续数值的数据，数值轴的数据通常与另一个维度的数值相关（如销量、温度等）
   
   - **series**：定义具体的数据系列，支持不同类型的图表（如折线图、柱状图等）
   
   **示例**：
   
   ```javascript
   const option = {
     title: {
       text: '示例图表'
     },
     xAxis: {
       type: 'category',
       data: ['A', 'B', 'C']
     },
     yAxis: {
       type: 'value'
     },
     series: [
       {
         data: [10, 20, 30],
         type: 'bar'
       }
     ]
   };
   ```
   
2. **数据驱动**：**Echarts** 的图表渲染是基于数据驱动的
   
   - **series**：用来描述不同类型的图表，如柱状图、折线图、饼图等
     - 数据通过配置中的 `series` 来定义，`series` 可以包含多个数据项，每个数据项代表图表中的一个数据点
   
3. **组件化设计**：**Echarts** 是高度组件化的，每个图表组件都是一个独立的模块，可以单独配置
   
   - **grid**：设置网格区域，控制图表的整体布局
   - **title**：图表的标题
   - **legend**：图例组件
   - **toolbox**：工具箱组件，用于提供缩放、重置等工具
   - **visualMap**：视觉映射组件，用于将数据与颜色、大小等视觉元素进行映射
   
   这种组件化设计使得 **Echarts** 非常灵活，用户可以按需配置和组合不同的组件，轻松实现定制化的图表展示
   
4. **渲染模式**：**Echarts** 支持两种渲染模式：**Canvas** 和 **SVG**
   
   - **Canvas（默认）**：使用 **HTML5** 的 **Canvas** 渲染图形，性能较好，适用于数据量大的场景
   - **SVG**：使用 **SVG**（可缩放矢量图形）进行渲染，具有较好的可访问性，适用于需要细致控制的场景
   
8. **视觉编码**：**Echarts** 提供了强大的视觉编码功能，支持通过 `visualMap` 控制数据到视觉属性（如颜色、大小）的映射，通过视觉编码，**Echarts** 可以将数据的变化直观地展现给用户，增强图表的表现力
   
    - 例如，可以通过 `visualMap` 将数据的值映射到不同的颜色，帮助用户识别不同的数据区间

### 二、配置图表数据

**ECharts** 提供了多种方式来设置数据，用于满足不同场景下的数据管理需求，这些方式可以简单分为「直接设置」和通过「中间层」（如 `dataset`）管理

#### 2.1、直接在 `series.data` 中设置数据

这是最基础、最直观的方式，数据直接绑定到具体的`series`上

- 适用场景

  - 简单的单图表
  - 数据量小且不需要复杂的共享或转换

- 优点

  - 直观简单：直接在 `series` 对象中设置 `data` 属性，数据结构清晰，易于理解和操作

- 缺点：

  - 不利于多个 `series` 共享一份数据
  - 不利于基于原始数据进行图表类型、系列的映射安排

  **示例：**👇

  ```javascript
  option = {
    xAxis: {
      type: 'category',
      data: ['Matcha Latte', 'Milk Tea', 'Cheese Cocoa', 'Walnut Brownie']
    },
    yAxis: {},
    series: [
      {
        type: 'bar',
        name: '2015',
        data: [89.3, 92.1, 94.4, 85.4]
      },
      {
        type: 'bar',
        name: '2016',
        data: [95.8, 89.4, 91.2, 76.9]
      },
      {
        type: 'bar',
        name: '2017',
        data: [97.7, 83.1, 92.5, 78.1]
      }
    ]
  };
  ```

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202501071607584.png" alt="202501071607584" style="zoom: 50%;" />

### 2.2、通过 `dataset` 设置数据

`dataset` 提供了一个中间层，用于集中管理数据，便于数据共享、转换和多维数据操作

- 适用场景
  - 数据复杂或多维
  - 多个图表共享同一数据集
  - 需要对数据进行过滤、排序、分组等转换操作
- 优点
  - 数据分离：`dataset` 将数据与图表配置分离，使得数据管理更加清晰，尤其是在处理复杂数据时
  - 支持多维数据：`dataset` 可以处理多维数据，适合需要展示多种数据类型的图表，便于进行数据的组织和管理
  - 简化数据更新：通过更新 `dataset` 中的数据，可以更方便地进行批量更新，而不需要逐个更新每个系列的数据
  - 数据映射：可以通过 `transform` 属性对数据进行转换和处理，支持数据的预处理和格式化，增强了数据的灵活性
  - 与图表类型解耦：`dataset` 使得数据与图表类型解耦，便于在不同类型的图表之间复用相同的数据集
- 缺点
  - 性能开销：在某些情况下，使用 `dataset` 可能会引入额外的性能开销，尤其是在数据量非常大的时候
  - 配置复杂性：需要额外的配置来定义 `dataset` 的结构和数据映射，可能会增加配置的复杂性

示例：👇

```javascript
option = {
  legend: {},
  tooltip: {},
  dataset: {
    // 提供一份数据。
    source: [
      ['product', '2015', '2016', '2017'],
      ['Matcha Latte', 43.3, 85.8, 93.7],
      ['Milk Tea', 83.1, 73.4, 55.1],
      ['Cheese Cocoa', 86.4, 65.2, 82.5],
      ['Walnut Brownie', 72.4, 53.9, 39.1]
    ]
  },
  // 声明一个 X 轴，类目轴（category）。默认情况下，类目轴对应到 dataset 第一列
  xAxis: { type: 'category' },
  // 声明一个 Y 轴，数值轴。
  yAxis: {},
  // 声明多个 bar 系列，默认情况下，每个系列会自动对应到 dataset 的每一列
  series: [{ type: 'bar' }, { type: 'bar' }, { type: 'bar' }]
};
```

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202501071615253.png" alt="202501071615253" style="zoom:50%;" />

#### 2.3、数据到图形的映射

在 **ECharts** 中，「数据到图形的映射」是「数据可视化」的核心过程，它的目的是将原始数据映射为图形元素（如点、线、柱等），通过视觉化的方式呈现出数据的结构和关系

数据可视化的一个常见思路可以分为两个步骤：

- **提供数据**：这是输入阶段，数据通常以数据集（`dataset`）形式提供
- **指定数据到视觉的映射**：这是输出阶段，指定如何将数据集中的数据映射到图形的视觉属性（如位置、颜色、大小等）

**ECharts** 提供了一些配置项，允许用户灵活控制数据和图形元素之间的映射关系

##### 2.3.1、指定数据集到 `series` 的映射

数据集中的列（**column**）或行（**row**）可以映射到 **ECharts** 的**series**

默认情况下，**ECharts** 会根据数据的列（**column**）进行映射，但用户可以通过设置 `series.seriesLayoutBy` 属性来改变这个映射的方向（行或列）

- **默认映射**：

  - 数据集的**列（column**）会被映射到**系列（series）**上
    - **X 轴**为**「类目轴」**，自动对应到 `dataset.source` 中的第一列
    - 剩余每一列数据对应一个系列的数据
  - 每一列就称为一个**维度（dimension）**，而每一行称为**数据项（item）**

- **设置映射方式**：

  - `seriesLayoutBy: 'row'`：将数据集的**行（row**）映射到**系列（series）**

  - `seriesLayoutBy: 'column'`（默认）：将数据集的**列（column）**映射到**系列（series）**

    例子： 👇

    ```javascript
    option = {
      legend: {},
      tooltip: {},
      dataset: {
        source: [
          ['product', '2012', '2013', '2014', '2015'],
          ['Matcha Latte', 41.1, 30.4, 65.1, 53.3],
          ['Milk Tea', 86.5, 92.1, 85.7, 83.1],
          ['Cheese Cocoa', 24.1, 67.2, 79.5, 86.4]
        ]
      },
      xAxis: [
        { type: 'category', gridIndex: 0 },
        { type: 'category', gridIndex: 1 }
      ],
      yAxis: [{ gridIndex: 0 }, { gridIndex: 1 }],
      grid: [{ bottom: '55%' }, { top: '55%' }],
      series: [
        // 这几个系列会出现在第一个直角坐标系中，每个系列对应到 dataset 的每一行。
        { type: 'bar', seriesLayoutBy: 'row', xAxisIndex: 0, yAxisIndex: 0 },
        { type: 'bar', seriesLayoutBy: 'row', xAxisIndex: 0, yAxisIndex: 0 },
        { type: 'bar', seriesLayoutBy: 'row', xAxisIndex: 0, yAxisIndex: 0 },
        // 这几个系列会出现在第二个直角坐标系中，每个系列对应到 dataset 的每一列。
        { type: 'bar', seriesLayoutBy: 'column', xAxisIndex: 1, yAxisIndex: 1 },
        { type: 'bar', seriesLayoutBy: 'column', xAxisIndex: 1, yAxisIndex: 1 },
        { type: 'bar', seriesLayoutBy: 'column', xAxisIndex: 1, yAxisIndex: 1 },
        { type: 'bar', seriesLayoutBy: 'column', xAxisIndex: 1, yAxisIndex: 1 }
      ]
    };
    ```

    ![下载11](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202501081722337.png)

##### 2.3.2、维度映射规则：如何将维度映射到视觉元素

在 **ECharts** 中，维度（**dimension**）代表了数据集中的属性或特征，每个维度可能对应数据集中的一列或者一行

可以通过以下几种方式指定维度到图形元素的映射：

- **`series.encode`**：指定如何将数据集中的维度映射到系列的属性上，`encode` 允许映射维度到坐标轴、标签、提示框等
- **`visualMap`**：当需要通过颜色、大小等视觉元素来表达数据的不同维度时，可以使用 `visualMap` 组件进行映射配置

#### 2.3、维度（Dimension）

> **维度（Dimension）**：在数据集中，维度通常指的是数据的属性或特征
>
> 例如时间、类别、地区等，每个维度可以看作是数据的一个切片

在 **ECharts** 中，`dimension` 用于定义数据的维度，可以理解为数据的「属性」或「特征」

维度的确定主要取决于数据的组织方式和图表类型，主要有两种方式来定义维度：

1. 默认维度推断：

   ```javascript
   // 数据格式示例
   const data = [
       // 维度顺序：时间，销量，价格
       ['2021-01', 200, 85],
       ['2021-02', 300, 90],
       ['2021-03', 400, 95]
   ];
   
   const option = {
       dataset: {
           source: data
       }
       // ...
   }
   ```

   在这种情况下，**ECharts** 会自动将「第一列」识别为类目维度（**category dimension**），也就是自动将第一列数据作为类目轴的刻度标签

   > 默认维度推断规则：
   >
   > 1. 一维数组：
   >
   > ```javascript
   > const data = [10, 20, 30, 40]; 
   > // 会被视为一个维度的数据
   > ```
   >
   > 2. 二维数组：
   >
   > ```javascript
   > const data = [
   >   ['产品A', 123],
   >   ['产品B', 456],
   >   ['产品C', 789]
   > ];
   > // 第一列是维度名称，第二列是数值
   > ```
   >
   > 3. 对象数组：
   >
   > ```javascript
   > const data = [
   >   {product: '产品A', sales: 123, price: 50},
   >   {product: '产品B', sales: 456, price: 60},
   >   {product: '产品C', sales: 789, price: 70}
   > ];
   > // 每个属性名就是一个维度
   > ```
   >

2. 显式定义维度：

   ```javascript
   option = {
     legend: {},
     tooltip: {},
     dataset: {
       // 用 dimensions 指定了维度的顺序。直角坐标系中，如果 X 轴 type 为 category，
       // 默认把第一个维度映射到 X 轴上，后面维度映射到 Y 轴上。
       // 如果不指定 dimensions，也可以通过指定 series.encode 完成映射
       dimensions: ['product', '2015', '2016', '2017'],
       source: [
         { product: 'Matcha Latte', '2015': 43.3, '2016': 85.8, '2017': 93.7 },
         { product: 'Milk Tea', '2015': 83.1, '2016': 73.4, '2017': 55.1 },
         { product: 'Cheese Cocoa', '2015': 86.4, '2016': 65.2, '2017': 82.5 },
         { product: 'Walnut Brownie', '2015': 72.4, '2016': 53.9, '2017': 39.1 }
       ]
     },
     xAxis: { type: 'category' },
     yAxis: {},
     series: [{ type: 'bar' }, { type: 'bar' }, { type: 'bar' }]
   };
   ```
   
   <img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202501071615253.png" alt="202501071615253" style="zoom:50%;" />

#### 2.4、`series.encode` 映射图形元素属性

`series.encode` 是 **ECharts** 中用于将数据集中的 `dimension`  映射到图形元素属性的配置项

通过这个配置可以控制数据如何在视觉上展现，例如映射到坐标轴、提示框、标签、颜色等

主要映射项：

- **坐标轴映射**（`x`, `y`, `radius`, `angle`）：将数据映射到 X 轴、Y 轴或极坐标的半径/角度
- **提示框映射**（`tooltip`）：指定哪些维度显示在提示框中
- **标签映射**（`label`）：将数据映射到图形元素的标签
- **样式映射**（`itemStyle`）：控制图形元素的颜色、边框等样式

示例：

```javascript
option = {
  dataset: {
    source: [
      ['product', 'sales', 'profit'],
      ['A', 120, 32],
      ['B', 200, 50],
      ['C', 150, 40]
    ]
  },
  series: [{
    type: 'bar',
    encode: {
      x: 'product',    // 映射 'product' 到 X 轴
      y: 'sales',      // 映射 'sales' 到 Y 轴
      tooltip: ['sales', 'profit'],  // 映射 'sales' 和 'profit' 到提示框
      label: 'sales',  // 映射 'sales' 到标签
      itemStyle: { color: 'profit' } // 映射 'profit' 到颜色
    }
  }]
};
```

#### 2.5、`visualMap `映射视觉属性

`visualMap` 是 **ECharts** 中用于实现**数据到视觉元素（如颜色、大小等）的映射**的组件，它能够根据数据的**数值范围「动态地」**调整图形元素的颜色、大小、透明度等等视觉属性，增强图表的表现力和可视化效果

`visualMap` 的配置项通常包含以下几个部分：

- **`type`**：指定映射类型，通常有两种类型：
  - `continuous`：连续型映射，适用于数值范围较广的数据
  - `piecewise`：分段型映射，适用于将数据分为多个区间进行映射
- **`dimension`**：指定映射的维度，通常是数据集中某一列的索引（从 0 开始）
- **`min` 和 `max`**：定义映射的数值范围
- **`inRange`**：定义数值范围内的视觉属性（如颜色、大小等）
- **`outOfRange`**：定义数值超出范围时的视觉属性

**示例：**

- **连续型映射（`continuous`）**

适用于数据值范围比较连续的情况，如温度、销售额等

```javascript
option = {
  visualMap: {
    type: 'continuous',
    dimension: 1,  // 映射第 2 列（如 'sales'）的数据
    min: 0,
    max: 200,
    inRange: {
      color: ['#ffcccc', '#ff0000']  // 数值从 0 到 200 映射为从浅红到深红的颜色
    }
  },
  dataset: {
    source: [
      ['product', 'sales'],
      ['A', 120],
      ['B', 200],
      ['C', 150]
    ]
  },
  series: [{
    type: 'bar',
    encode: {
      x: 'product',
      y: 'sales',
      itemStyle: {
        color: 'sales'  // 使用 visualMap 映射的颜色
      }
    }
  }]
};
```

- #### **分段型映射（`piecewise`）**

适用于数据值需要被分段处理的情况，如风险等级、分数等

```javascript
option = {
  visualMap: {
    type: 'piecewise',
    dimension: 1,  // 映射第 2 列（如 'sales'）的数据
    pieces: [
      { gt: 0, lte: 100, color: '#ffcccc' },  // 小于等于 100 映射为浅红
      { gt: 100, lte: 200, color: '#ff0000' }  // 大于 100 小于等于 200 映射为红色
    ]
  },
  dataset: {
    source: [
      ['product', 'sales'],
      ['A', 120],
      ['B', 200],
      ['C', 150]
    ]
  },
  series: [{
    type: 'bar',
    encode: {
      x: 'product',
      y: 'sales',
      itemStyle: {
        color: 'sales'  // 使用 visualMap 映射的颜色
      }
    }
  }]
};
```

