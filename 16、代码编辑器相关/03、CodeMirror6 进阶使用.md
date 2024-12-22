## CodeMirror6 进阶使用

### 一、Decorations

**CodeMirror** 编辑器的 **DOM** 结构是由其 **EditorState** 和 **EditorView** 进行生成的，就像 **React** 一样也是有 **VirtualDOM**，手动修改 **DOM** 结构之后，在下一次更新之后，手动修改的内容便会消失

为了能够动态的在编辑器内容中添加样式、替换内容或插入额外的元素，同时保持编辑器的状态一致性，便需要使用 **Decoration** 这种机制，**Decoration** 能够以非侵入的方式对编辑器内容进行增强，而不破坏编辑器的 **DOM** 结构

**Decoration **有以下四种：

1. **Mark Decorations**：最常见的 **Decoration** 类型，用于为文本添加属性或包裹 **DOM** 元素
   - 主要用于 **语法高亮** 或为特定内容设置样式
   - 不改变文本本身，只在外观上增加修饰
2. **Widget Decorations**：用于在编辑器中插入自定义的 **DOM** 元素
   - 这些元素可以是**内联元素**或**块级元素**
   - 应用场景包括在某段内容旁边显示工具提示、在颜色代码旁边插入颜色选择器等
   - **Widget** 不会对文本内容本身产生影响，但会在对应位置插入新的元素
3. **Replacing Decorations**：用于**隐藏一段内容**，并可以选择显示替代内容或 **Widget**
   - 常用于 **代码折叠** 或 **将一段文本替换为其他元素**
   - 可以结合 **Widget** 来为隐藏内容提供交互功能，例如折叠/展开按钮
4. **Line Decorations**：作用于整行，在行首位置插入，可以影响该行的整体属性或 **DOM** 包裹元素的样式
   - 应用场景包括为整行添加背景颜色、设置行号样式等

#### 1.1、Mark decorations 

利用 **Mark decorations** 实现语法高亮

先利用 **StateField** 定义一个 `highlightField`

```tsx
import { StateField, RangeSetBuilder } from '@codemirror/state'
import { EditorView, Decoration, DecorationSet } from '@codemirror/view'

// 定义高亮装饰器，用于设置文本的样式
const highlightDecoration = Decoration.mark({
    class: 'color-text-dim color-background-dim',
})

// 创建一个高亮字段函数，用于处理文本高亮
const highlightField = (regex = /\bSELECT\b/g) => {

    return StateField.define<DecorationSet>({
        // 初始化 DecorationSet
        create () {
            return Decoration.none
        },
        // 更新 Decoration
        update (decorations, tr) {
            if (tr.docChanged) {
                // 创建一个新的范围集合构建器
                const builder = new RangeSetBuilder<Decoration>()
                // 获取新文档的文本内容
                const text = tr.newDoc.toString()
                // 查找所有匹配的关键字
                let match = regex.exec(text)
                while (match !== null) {
                    // 为每个匹配项添加装饰效果
                    builder.add(match.index, match.index + match[0].length, highlightDecoration)
                    match = regex.exec(text)
                }
                // 完成构建并返回装饰集合
                return builder.finish()
            }
            // 如果文档没有变化，则根据变更映射更新现有装饰
            return decorations.map(tr.changes)
        },
        // 将装饰效果提供给编辑器视图
        provide: f => EditorView.decorations.from(f),
    })
}

export { highlightField }
```

- 首先定义当前 **StateField** 是用来存储 **DecorationSet** 且初始值是 `Decoration.none`

  ```tsx
  StateField.define<DecorationSet>({
        // 初始化 DecorationSet
        create () {
            return Decoration.none
        },
  })
  ```

- 然后在文档内容发生改变时更新 **DecorationSet** 中的内容

  ```tsx
      update (decorations, tr) {
          if (tr.docChanged) {
              // 创建一个新的范围集合构建器
              const builder = new RangeSetBuilder<Decoration>()
              // 获取新文档的文本内容
              const text = tr.newDoc.toString()
              // 查找所有匹配的关键字
              let match = regex.exec(text)
              while (match !== null) {
                  // 为每个匹配项添加装饰效果
                  builder.add(match.index, match.index + match[0].length, highlightDecoration)
                  match = regex.exec(text)
              }
              // 完成构建并返回装饰集合
              return builder.finish()
          }
          // 如果文档没有变化，则根据变更映射更新现有装饰
          return decorations.map(tr.changes)
      },
  ```

  - `RangeSetBuilder`: 用于创建一个新的 `DecorationSet`
  - `decorations.map(tr.changes)`：根据 `tr`（**transition**） 描述的更改来更新当前的装饰集合（即高亮文本区域）
    - `map` 方法是 **RangSet**（`DecorationSet` 的父类） 上的方法，用于根据文档更新内容更新 **RangeSet**

- 将当前 `StateField` 作为一个 **Extension** 提供给编辑器

  ```tsx
  provide: f => EditorView.decorations.from(f)
  ```

  - `provide` 方法：`provide` 是 `StateField` 的一个可选属性，用于基于当前的 `StateField` 提供额外的 **Extension**

    ```tsx
    provide?: (field: StateField<Value>) => Extension
    ```

    - **参数**：
      - `field`：表示当前 `StateField` 的实例，已经初始化并绑定到编辑器的状态中
    - **返回值**：
      - 一个扩展（**Extension**）可以是：
        - 使用 `facet.from` 创建的 **Extension**
        - 其他 **CodeMirror Extension** （例如 **ViewPlugin**、语言支持等）

  - `EditorView.decorations.from(f)`：让编辑器视图自动从当前 `StateField` 的实例中获取装饰信息，并在视图中应用它们

    - `EditorView.decorations` 是一个特殊的 **Facet**，用于管理和应用装饰（**decorations**）到编辑器视图中
      - `Facet.from(field)` 会创建一个 **Extension**

------

使用 `highlightField`

```tsx
import { EditorState, EditorView } from "@codemirror/basic-setup";
import {  highlightField } from "./highlightField"; // 假设上面定义了 counterField

// 创建 EditorState
const state = EditorState.create({
  doc: "Hello, world!",
  extensions: [ highlightField()] // 添加自定义的 StateField
});

// 创建 EditorView
const view = new EditorView({
  state,
  parent: document.querySelector("#editor")
});
```

### 1.2、Widget decorations 

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

