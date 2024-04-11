## CodeMirror6基本使用

### 一、概述

> CodeMirror is a code editor component for the web. It can be used in websites to implement a text input field with support for many editing features, and has a rich programming interface to allow further extension.

**CodeMirror** 是一个**JS**库，可以用来实现一个在线的代码编辑器，它支持多种语言模式的文本输入，具备众多编辑功能，比如语法高亮、语法提示、行数显示等，并且其还具有丰富的编程接口以允许我们进一步扩展编辑器功能，目前**CodeMirror**已更新至**V6**版本

### 二、简单使用

**安装依赖**：

```shell
npm install @codemirror/state @codemirror/view @codemirror/commands
```

这三个库是**CodeMirror**的核心库，通过这三个库便可以实现一个最简单的代码编辑器：

- `@codemirror/state` ：实现了编辑器状态的数据结构( `state` )以及能对此 `state` 进行更新操作的方法
  - 编辑状态中包含了当前文档内容、当前选中文本
- `@codemirror/view` ：实现了展示编辑器状态的UI组件
  - UI组件将编辑器状态呈现给用户，并将基本的编辑动作转换成对应的 `state` 更新操作
- `@codemirror/commands` ：实现了一系列的编辑命令，这些命令可以用来修改编辑器的状态
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

**CodeMirror**的三个核心库只能实现简单的代码编辑器，当我们需要更多的编辑器功能时就需要给编辑器添加**extension**；

**CodeMirror**的许多功能都是以**extension**形式进行配置的，在创建编辑器状态时可以通过**extension**给编辑器添加一些自定义配置，比如行号分隔、撤回历史、特殊字符高亮等；

**CodeMirror**提供的`@codemirror/basic-setup` 实现了一些常用的功能配置可以开箱使用（除了语言支持），此外还提供了一个简易版本的**extension**库`@codemirror/minimal-setup` 

```js
import { EditorState, EditorView, basicSetup } from '@codemirror/basic-setup'
import { javascript } from '@codemirror/lang-javascript'

let view = new EditorView({
    state: EditorState.create({ extensions: [basicSetup, javascript()]}),
    parent: document.body
})

```

### 四、状态更新

**CodeMirror** 处理状态更新的方式受`Redux`启发，除了极少数情况（如组合和拖拽处理），视图的状态完全是由 **EditorState** 里的 `state` 属性决定的

通过创建一个描述文档改变内容、选择范围或其他 `state` 属性的 `transaction`，再通过**EditorView**的`dispatch`方法触发`state`的更新，之后`view`会根据`state`去更新`DOM`

```js
let transaction = view.state.update({ changes: { from: 0, insert: "0" }})
console.log(transaction.state.doc.toString()) // "0123"
// 此刻视图依然显示的旧状态
view.dispatch(transaction)
// 现在显示新状态了
```

典型的用户交互数据流如下图

![image-20240205164433480](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202402051644817.png)

### 五、Selection

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



### Decorations

CodeMirror编辑器的DOM结构是由其EditorState和EditorView进行生成的，就像React一样也是有VirtualDOM，手动修改DOM结构之后，在下一次更新之后，手动修改的内容便会消失

> q q q
>

Mark decorations 

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

Widget decorations 

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