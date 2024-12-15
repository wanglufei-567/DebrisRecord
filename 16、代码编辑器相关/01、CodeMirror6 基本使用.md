## CodeMirror6 基本使用

### 一、概述

> CodeMirror is a code editor component for the web. It can be used in websites to implement a text input field with support for many editing features, and has a rich programming interface to allow further extension.

**CodeMirror** 是一个**JS**库，可以用来实现一个在线的代码编辑器，它支持多种语言模式的文本输入，具备众多编辑功能，比如语法高亮、语法提示、行数显示等，并且其还具有丰富的编程接口以允许我们进一步扩展编辑器功能，目前**CodeMirror**已更新至**V6**版本

### 二、简单使用

**安装依赖**：

```shell
npm install @codemirror/state @codemirror/view @codemirror/commands
```

这三个库是**CodeMirror**的核心库，通过这三个库便可以实现一个最简单的代码编辑器：

- `@codemirror/state` ：实现了编辑器状态的「数据结构」（ `state` ）以及能对此 `state` 进行更新操作的方法
  - 编辑状态中包含了当前文档内容、当前选中文本
- `@codemirror/view` ：实现了展示编辑器状态的 **UI** 组件
  - **UI** 组件将编辑器状态呈现给用户，并将基本的「编辑动作」转换成对应的 `state` 「更新操作」
- `@codemirror/commands` ：实现了一系列的编辑命令，这些命令可以用来修改编辑器的状态，还有一些快捷键的操作
  - 例如，可以使用这个库提供的命令来实现撤销、重做、剪切、复制、粘贴等操作

**创建编辑器**：

```js
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'

let startState = EditorState.create({
    doc: 'console.log("hello, javascript!")',
    extensions: [keymap.of(defaultKeymap)]
})
let view = new EditorView({
    state: startState,
    parent: document.body
})
```

### 三、Extension

**CodeMirror**的三个核心库只能实现简单的代码编辑器，当我们需要更多的编辑器功能时就需要给编辑器添加 **extension**；

**CodeMirror**的许多功能都是以 **extension** 形式进行配置的，在创建编辑器状态时可以通过 **extension** 给编辑器添加一些自定义配置，比如：

- 行号分隔
- 撤回历史
- 特殊字符高亮
- 自动补全
- lint

**CodeMirror**提供的`@codemirror/basic-setup` 实现了一些常用的功能配置可以开箱使用（除了语言支持），此外还提供了一个简易版本的 **extension** 库`@codemirror/minimal-setup` 

```js
import { EditorState, EditorView, basicSetup } from '@codemirror/basic-setup'
import { javascript } from '@codemirror/lang-javascript'

let view = new EditorView({
    state: EditorState.create({ extensions: [basicSetup, javascript()]}),
    parent: document.body
})

```

### 四、状态更新

**CodeMirror** 处理状态更新的方式受 `Redux` 启发，除了极少数情况（如组合和拖拽处理），视图的状态完全是由 **EditorState** 里的 `state` 属性决定的

通过创建一个描述文档「改变内容」、「选择范围」或其他 `state` 属性的 `transaction`，再通过 **EditorView** 的`dispatch`方法触发`state`的更新，之后`view`会根据`state`去更新`DOM`

```js
// 假设编辑器视图中现在展示的是 “123”
let transaction = view.state.update({ changes: { from: 0, insert: "0" }})
console.log(transaction.state.doc.toString()) // "0123"
// 此刻视图依然显示的旧状态
view.dispatch(transaction)
// 现在显示新状态了
```

典型的用户交互数据流如下图

![image-20240205164433480](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202402051644817.png)

视图监听文本输入、键盘事件、鼠标交互等操作并将这些操作转变成一个 `transition` 最后被 `dispatch` 到 `state` 中，从而触发视图层的更新

### 五、Facet

**Facets** 是 **CodeMirror** 的一个核心概念，用来处理 **extension** 之间的「配置共享」和「行为控制」，通过 **Facets**，**CodeMirror** 能够以「模块化」和「声明式」的方式管理复杂的编辑器配置，使其更灵活、更易扩展

**Facets** 的核心精髓是解决**复杂系统中扩展之间的「配置管理」和「行为协调」问题**

**CodeMirror** 这样的「可扩展系统」中，不同的模块和 **extension** 需要「定义配置」、「共享状态」、「动态调整行为」，**Facets** 的出现是为了提供一种**统一的机制**，让这些模块能够以**解耦的方式协作**

**为什么需要 Facets？**

1. **模块化的需求**：每个扩展或插件都可能定义自己的功能，它们需要一种方式与编辑器核心和其他扩展**共享信息**
   - 例：一个插件提供主题样式，另一个插件需要知道当前主题
2. **避免硬编码和耦合**：如果直接通过全局变量或固定的 **API** 管理这些配置，会导致模块间的强耦合，难以维护和扩展
3. **动态性**：扩展可能会在运行时被添加、移除，配置需要动态更新，而不是写死在代码中
4. **统一的数据流**：**Facets** 提供了一种声明式的方式，确保多个来源的配置能以清晰、一致的规则合并和使用

**Facets 的核心作用**

**Facets** 本质上是一个**“动态的配置总线”**，它把来自不同模块的配置汇总成一个**可用的统一视图**，并根据扩展的变化动态更新

**换句话说**：

- **Facets** 是编辑器的“神经系统”，帮助扩展模块像“器官”一样独立工作，但又能协同发挥作用

**如果没有 Facets**，编辑器将很难在模块化和动态性之间找到平衡

**Facets** 的核心价值在于它解决了扩展之间**信息流动的复杂性**，以模块化、动态化、声明式的方式，让整个系统更灵活、更易扩展

示例👇：

```tsx
let info = Facet.define<string>()
let state = EditorState.create({
  doc: "abc\ndef",
  extensions: [
    info.of("hello"),
    info.compute(["doc"], state => lines: ${state.doc.lines})
  ]
})
console.log(state.facet(info))
// ["hello", "lines: 2"]
```

1. **定义 Facet**

   ```javascript
   let info = Facet.define<string>();
   ```

   - 定义了一个 **Facet**，可以存储和处理字符串类型的数据
   - 它是一个容器，可以接受多个扩展提供的值，这些值会被聚合在一起

2. **创建编辑器状态**

   ```javascript
   let state = EditorState.create({
     doc: "abc\ndef",
     extensions: [
       info.of("hello"),
       info.compute(["doc"], state => `lines: ${state.doc.lines}`)
     ]
   });
   ```

   - 创建了一个 **EditorState**，其中包含：
     1. **文档内容** (`doc`)：初始文本为 `"abc\ndef"`
     2. 两个 **Facet** 扩展：
        - **info.of("hello")**：直接提供值 `"hello"` 给 Facet
        - **info.compute(["doc"], callback)**：
          - 动态计算一个值并提供给 **Facet**
          - 依赖 `doc` 的内容，当文档发生变化时，`callback` 会重新计算
            - **callback 函数**：接收当前状态 `state`，计算并返回一个字符串值
          - 回调返回文档的行数：`lines: 2`

3. **输出 Facet 的值**

   ```javascript
   console.log(state.facet(info)); 
   ```

   - 获取 `info` **Facet** 的所有值，并返回一个数组
     - **Facet** 会将来自多个扩展的值（静态值和动态值）聚合在一起，形成一个数组
   - 输出结果：`["hello", "lines: 2"]

**简化理解**

- **Facet** 是一个收集数据的容器
- 可以给它：
  - 静态值（直接提供）
  - 动态值（通过计算规则）
- **Facet** 最终会聚合所有值，方便在编辑器状态中读取这些数据

**这个示例展示的 Facet 结果是**：

```javascript
["hello", "lines: 2"]
```

表示它同时收到了固定的值 `"hello"` 和动态计算的值 `"lines: 2"`

### 六、Selection

`state` 上除了保存文档属性外，还保存了一份当前的 `selection` 属性

**Selection** 可能由多个 `range` 组成,每个都可能是一个 `cursor` 或者由 `anchor` 和 `head` 描述的 `range`，重叠的 `range` 会自动合并，而且 `range` 会被排序，`selection` 的 `range` 属性总是一个有序的非重叠的 `range` 数组

```js
import {EditorState, EditorSelection} from "@codemirror/state"

let state = EditorState.create({
  doc: "hello",
  selection: EditorSelection.create([
    EditorSelection.range(0, 4), // 从位置 0 到位置 4的范围（即 “hell”）
    EditorSelection.cursor(5) // 位置 5 的光标（即 “o” 的后面）
  ]),
  extensions: EditorState.allowMultipleSelections.of(true)
})

console.log(state.selection.ranges.length) // 2

// 将选中的内容替换为 “!”
let tr = state.update(state.replaceSelection("!"))
console.log(tr.state.doc.toString()) // "!o!"
```

### 七、Decorations

**CodeMirror** 编辑器的 **DOM** 结构是由其 **EditorState** 和 **EditorView** 进行生成的，就像 **React** 一样也是有 **VirtualDOM**，手动修改 **DOM** 结构之后，在下一次更新之后，手动修改的内容便会消失

**Mark decorations** 

```tsx
  ViewPlugin.define(
    () => {
       return {
        decorations: Decoration.set([
          Decoration.mark({
            class: 'wrapper',
          }).range(11, 70),

          Decoration.widget({
            widget: new SimpleWidget(),
            side: 1, // is after the cursor
          }).range(34),

          Decoration.widget({
            widget: new SimpleWidget(),
            side: 1, // should be after the cursor
          }).range(67),
        ]),
      };
    },
    {
      decorations: (value) => value.decorations,
    },
  ),
```

**Widget decorations** 

```tsx
class SimpleWidget extends WidgetType {
  toDOM() {
    const element = document.createElement('span');
    element.className = 'filler';
    return element;
  }
}

ViewPlugin.define(
    () => {
       return {
        decorations: Decoration.set([
          Decoration.widget({
            widget: new SimpleWidget(),
            side: 1, // is after the cursor
          }).range(34),

          Decoration.widget({
            widget: new SimpleWidget(),
            side: 1, // should be after the cursor
          }).range(67),
        ]),
      };
    },
    {
      decorations: (value) => value.decorations,
    },
  ),
```