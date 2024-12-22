## CodeMirror6 中的核心概念

### 一、Facet

**Facets** 是 **CodeMirror** 的一个核心概念，用来处理 **extension** 之间的「配置共享」和「行为控制」；通过 **Facets**，**CodeMirror** 能够以「模块化」和「声明式」的方式管理复杂的编辑器配置，使其更灵活、更易扩展

- **Facets** 的核心精髓是解决**复杂系统中扩展之间的「配置管理」和「行为协调」问题**

- **CodeMirror** 这样的「可扩展系统」中，不同的模块和 **extension** 需要「定义配置」、「共享状态」、「动态调整行为」，**Facets** 的出现是为了提供一种**统一的机制**，让这些模块能够以**解耦的方式协作**

  <!-- 简单理解 Facet 就是一个收集数据的容器-->

**为什么需要 Facets？**

1. **模块化的需求**：每个扩展或插件都可能定义自己的功能，它们需要一种方式与编辑器核心和其他扩展**共享信息**
   - 例：一个插件提供主题样式，另一个插件需要知道当前主题
2. **避免硬编码和耦合**：如果直接通过全局变量或固定的 **API** 管理这些配置，会导致模块间的强耦合，难以维护和扩展
3. **动态性**：扩展可能会在运行时被添加、移除，配置需要动态更新，而不是写死在代码中
4. **统一的数据流**：**Facets** 提供了一种声明式的方式，确保多个来源的配置能以清晰、一致的规则合并和使用

**Facets 的核心作用**

- **Facets** 本质上是一个**“动态的配置总线”**，它把来自不同模块的配置汇总成一个**可用的统一视图**，并根据扩展的变化动态更新

- 换句话说：**Facets** 是编辑器的“神经系统”，帮助扩展模块像“器官”一样独立工作，但又能协同发挥作用

- 如果没有 **Facets**，编辑器将很难在模块化和动态性之间找到平衡

**Facets** 的核心价值在于它解决了扩展之间**信息流动的复杂性**，以模块化、动态化、声明式的方式，让整个系统更灵活、更易扩展

示例：通过 `Facet` 来控制行高👇

```tsx
import { Facet } from "@codemirror/state";

// 创建一个控制行高的 Facet
const lineHeightFacet = Facet.define({
  // 合并多个扩展的行高值，返回第一个值（或者根据需求可以做合并）
  combine(values) {
    return values.length > 0 ? values[0] : 20; // 默认行高为 20px
  }
});
```

- **`combine(values)`**:

  - 一个合并函数，用来处理 **Facet** 中存储的多个值
    - `values` 是所有设置此 **Facet** 值的扩展中的值的数组
    - 合并函数将这些值合并为一个最终的值，这个值将被编辑器使用
  - 默认行为：如果没有提供 `combine` 函数，**CodeMirror** 会使用默认的行为
    - 对于大多数 **Facet**，它会返回值数组中的第一个值

  **示例**：可以在多个扩展中设置同一个 **Facet**，`combine` 函数会决定如何合并这些值

  - 例如，多个扩展可能会设置不同的主题颜色，`combine` 函数可以返回一个最终的颜色值

<!--Facet 是一个容器，可以接受多个扩展提供的值，这些值会被聚合在一起-->

```tsx
import { EditorState, EditorView } from "@codemirror/view";

// 创建一个扩展来将行高应用到样式
const lineHeightExtension = (lineHeight) => {
  return EditorView.theme({
    "&": {
      lineHeight: `${lineHeight}px`, // 使用 `Facet` 的值来设置行高
    },
  });
};

// 创建一个编辑器状态并使用这个 Facet
const state = EditorState.create({
  extensions: [
    lineHeightFacet.of(24), // 直接提供一个静态值，行高为 24px
    lineHeightFacet.compute(["doc"], state => state.doc.lines), // 当文档内容发生变化时，动态计算一个值
    lineHeightExtension(state.facet(lineHeightFacet)), // 将 Facet 中的行高应用到视图中
  ],
});


// 创建编辑器视图并应用扩展
const view = new EditorView({
  state,
  parent: document.querySelector("#editor"),
});
```

### 二、StateField

**StateField** 是 **CodeMirror** 中用于存储 **EditorState** 之外的信息，许多 **Extension**（例如撤销历史、代码折叠等）需要在状态中保存某些数据，而这些数据通常**与编辑器的文档内容无关**，但又**与编辑器的行为或状态密切相关**，**StateField** 就是用来存储这种信息的

**StateField 的作用：**

1. **存储不可变的数据**：**StateField** 用于存储编辑器状态中的额外数据
   - 这些数据必须是不可变的，即一旦创建，它们的值不能直接改变
   - 每次状态更新时，都会通过类似 `reducer` 的方式来计算新的字段值
2. **与编辑器状态同步**：每当编辑器状态（**EditorState**）更新时，**StateField** 会与其他状态字段保持同步
   - 每次状态更新时，会调用一个更新函数，它接收当前的字段值和事务（`transaction`）并返回新的字段值
3. **支持扩展存储数据**：不同的扩展需要在编辑器的状态中存储额外的数据
   - 例如，撤销历史（**undo history**）需要存储撤销的变化，代码折叠需要记录哪些区域被折叠等
   - **StateField** 提供了一种管理和更新这些数据的机制

**语法：**

创建一个 **StateField** 时，通常需要提供以下配置项：

- **`create`**: 定义该字段的初始值
- **`update`**: 定义如何在状态更新时根据事务（`transaction`）更新该字段的值
  - `transaction ` 上包含以下属性
    - `docChanged`：一个布尔值，指示文档是否被此事务更改
    - `newDoc`：事务后的文档新状态
    - `changes`：描述对文档所做更改的对象
    - `annotations`：关于事务的附加元数据或信息
    - `effects`：事务中附加的副作用
    - `selection`：事务后的新选择状态


示例：👇

```javascript
import { StateField } from "@codemirror/state";

// 定义一个新的 StateField
const counterField = StateField.define({
  // 设置字段的初始值
  create() {
    return 0; // 初始值为 0
  },

  // 更新字段的值
  update(value, transaction) {
    // 每当文档发生变化时，我们在此简单地将字段值加1
    if (transaction.docChanged) {
      return value + 1;
    }
    return value;
  },
});
```

**使用 StateField：**👇

创建好 **StateField** 后，可以将它添加到 **EditorState** 的 **extensions** 中，通过 `EditorState.field` 方法，可以访问当前字段的值

```javascript
import { EditorState, EditorView } from "@codemirror/basic-setup";
import { counterField } from "./counterField"; // 假设上面定义了 counterField

// 创建 EditorState
const state = EditorState.create({
  doc: "Hello, world!",
  extensions: [counterField] // 添加自定义的 StateField
});

// 创建 EditorView
const view = new EditorView({
  state,
  parent: document.querySelector("#editor")
});

// 获取并访问 StateField 的值
console.log(view.state.field(counterField)); // 输出当前字段值
```

**更新和访问 StateField：**👇

当状态更新时，**StateField** 会根据事务更新其值

```javascript
// 获取当前字段的值
const currentCount = view.state.field(counterField);
console.log("当前计数: ", currentCount);
```

### 三、StateEffect

在 **CodeMirror** 中，**StateEffect** 是一个用于表示与事务（`transaction`）相关的「副作用」的机制，通常与编辑器状态相关的修改结合使用，**StateEffect** 允许对编辑器的状态进行「细粒度」的控制和修改

#### 3.1、StateEffect 与 StateField 结合使用

**StateEffect 的作用：**

- **StateEffect** 主要用于在编辑器的状态中产生「副作用」，尤其是针对 **StateField** 中存储的自定义字段进行更新
- 在 **CodeMirror** 的事务（`transaction`）中，**StateEffect** 可以作为「副作用」存在，它们可以帮助表达状态变化，而这些变化并不是直接由文档内容或选择位置引起的
-  **StateEffect** 可以在事务（`transaction`）中传递额外的「指令」或「数据」，进而影响编辑器的状态

**`StateEffect` 的使用流程：**

1. **创建 StateEffect**: 使用 `StateEffect.define` 定义一个 **StateEffect**，这个 **StateEffect** 通常会携带一些值
2. **在事务中附加 StateEffect**: 在需要的地方（例如编辑器操作中），将 **StateEffect** 通过 **effects** 属性附加到事务（`transaction`）中
3. **在 StateField 更新中处理 StateEffect**: 在 **StateField** 的 `update` 函数中，检查事务中是否包含特定的 **StateEffect**，并据此更新状态字段的值

**创建 StateEffect：**👇

```javascript
import { StateEffect } from "@codemirror/state";

// 定义一个新的 StateEffect，用于增加计数器值
const incrementCounterEffect = StateEffect.define<{num: number, pos:number}>({
  map: (value, mapping) => {
    // 使用 mapping.mapPos 来调整效果的位置
    return { ...value, pos: mapping.mapPos(value.pos) };
  }
});

```

语法： `StateEffect.define(spec?)`

- `spec`
  - `map`?:  `fn(value, mapping)`
    - `value`: `StateEffect` 所保存的更新值
    - `mapping`：一个对象，用于处理文档更改时的位置映射
      - 当文档发生更改时，文本的插入或删除会导致文本位置的偏移，`mapping` 提供了一种机制来更新效果的位置，使其在文档更改后仍然指向正确的位置
      - `mapping.mapPos(pos)`: 将给定的文档位置 `pos` 映射到**更改后的文档中对应的位置**，这是最常用的方法，用于调整效果的位置

------

**将 StateEffect 附加到事务中：**👇

当想要在某次编辑器操作中触发 **StateEffect** 时，需要通过事务来附加该效果，通常会在某个事件中触发效果，并更新状态

```javascript
import { EditorState, StateField } from '@codemirror/state'
import { EditorView } from '@codemirror/view'

// 定义一个 StateField 来跟踪计数器值
const counterField = StateField.define({
  create() {
    return 0; // 初始值为 0
  },

  update(value, transaction) {
    // 如果事务中包含 incrementCounterEffect，我们就增加计数器值
    for (let effect of transaction.effects) {
      if (effect.is(incrementCounterEffect)) {
        return value + effect.num; // 每次遇到这个 effect，计数器增加 1
      }
    }
    return value;
  },

  name: "counterField"
});

// 创建编辑器状态
const state = EditorState.create({
  doc: "Hello, world!",
  extensions: [counterField] // 加入 counterField
});

// 创建编辑器视图
const view = new EditorView({
  state,
  parent: document.querySelector("#editor")
});

// 创建一个触发 StateEffect 的事务
const transaction = view.state.update({
  effects: [incrementCounterEffect.of({ num: 1 })] // 附加 effect
});

// 应用事务，更新视图
view.dispatch(transaction);

// 获取更新后的 StateField 值
console.log(view.state.field(counterField)); // 输出计数器值
```

**总结：**

- **`StateEffect` 的作用**: 用于表示附加效果，它们通常不会直接影响文档或选择，但会影响与这些事务相关的「自定义状态字段」（`StateField`）
- **如何与 `StateField` 配合使用**: 通过将 **StateEffect** 附加到事务中，**StateField** 可以通过 `transaction.effects` 来响应这些效果，从而更新自定义状态字段的值
- 相关语法:
  - `StateEffect.define<Value>()` 用来定义一个新的「副作用」
  - `StateEffect.of(value)` 用来创建一个特定的效果实例，将值附加到效果中
  - 在 `StateField.update` 函数中，使用 `effect.is()` 方法来检查事务中是否包含该效果，并根据需要更新状态

#### 3.2、通过 StateEffect 配置 Extension

通过 **StateEffect** 还可以对编辑器的 **Extension** 进行变更修改

常用方法：👇

- `StateEffect.reconfigure`

  - **作用**：`reconfigure` 用于重新配置编辑器的 **根扩展（root extensions）**，它会替换当前的顶层配置
    - 使用此方法时，编辑器的现有扩展会被完全替换，而不是追加或修改现有扩展的配置

  - **用法**：

    - 当需要更新或更改编辑器的 **根扩展** 时，可以使用 `reconfigure`
    - 这会重新配置 **根扩展**，适用于需要完全更换或调整根扩展的场景

    ```js
    const reconfigured = StateEffect.reconfigure(newExtensions);
    ```

    这里的 `newExtensions` 是一个新的扩展列表，会替换掉原有的根扩展，另外任何通过 `appendConfig` 添加的扩展将会被丢弃

- `StateEffect.appendConfig`

  - **作用**：`appendConfig` 用于将新的扩展 **追加到编辑器的根扩展（root extensions）**，即在当前的配置基础上增加新的 **Extension**，而不影响已存在的 **Extension**

    - 与 `reconfigure` 的替换行为不同，`appendConfig` 是一种增量式操作，可以在不丢失原有扩展的情况下，动态添加新的功能或行为

  - **用法**：

    - 可以使用 `appendConfig` 在不干扰现有配置的情况下，向编辑器的配置中追加新的扩展
    - 通常适用于动态地扩展编辑器的功能，而不影响已有的设置

    ```js
    const additionalExtensions = [newExtension1, newExtension2];
    const updatedEffect = StateEffect.appendConfig(additionalExtensions);
    ```

    这里的 `additionalExtensions` 是一组将被追加到编辑器配置中的扩展