## CodeMirror6基本使用

### 一、概述

> CodeMirror is a code editor component for the web. It can be used in websites to implement a text input field with support for many editing features, and has a rich programming interface to allow further extension.

**CodeMirror** 是一个**JS**库，可以用来实现一个在线的代码编辑器，它支持多种语言模式的文本输入，具备众多编辑功能，比如语法高亮、语法提示、行数显示等，并且其还具有丰富的编程接口以允许我们进一步扩展编辑器功能，目前**CodeMirror**已更新至**V6**版本



### Decorations

CodeMirror编辑器的DOM结构是由其EditorState和EditorView进行生成的，就像React一样也是有VirtualDOM，手动修改DOM结构之后，在下一次更新之后，手动修改的内容便会消失



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

