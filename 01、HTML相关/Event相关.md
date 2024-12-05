## Event （事件）相关

### 一、Event

**Event**（事件） 是指在浏览器中发生的一些交互操作，可以由用户或浏览器本身触发，这些操作包括点击、加载页面、按键、鼠标移动等

当 **DOM** 中出现的事件被触发时，浏览器会==自动创建一个 **Event** 对象==，这个 **Event** 对象==存储了本次事件相关的信息==，包括「事件类型」、「事件目标」、「触发元素」等等

#### 1.1、Event 构造函数

**Event** 构造函数的语法👇：

```js
 event = new Event(typeArg, eventInit);
```

- `typeArg`： **DOMString** 类型，表示所创建事件的名称

- `eventInit` (可选)： `EventInit` 类型的字典，接受以下字段：
  - `bubbles`，可选，`Boolean`类型，默认值为认值为 `false`，表示该事件是否冒泡
  - `cancelable`，可选，`Boolean`类型，默认值为 `false`，表示该事件能否被取消
  - `composed`，可选，`Boolean`类型，默认值为 `false`，指示事件是否会在影子 **DOM** 根节点之外触发侦听器

#### 1.2、Event 对象

**Event** 对象上常用的属性和方法：

- `type`：只读属性，返回事件的类型，如 `click`、`keydown` 等
- `target`：只读属性，返回触发事件的元素
- `currentTarget`：只读属性，返回事件监听器绑定的元素
- `bubbles`：只读属性，返回一个布尔值，表示事件是否冒泡
- `cancelable`：只读属性，返回一个布尔值，表示事件是否可以被取消
- `preventDefault()`：阻止事件的默认行为
  - 如果事件是可取消的（即 `cancelable` 属性为 `true`），则调用 `preventDefault` 方法将阻止事件的默认行为
- `stopPropagation()`：阻止事件进一步传播，包括阻止在当前元素上的事件处理程序的执行和阻止事件的冒泡

**例子：**

```js
// 创建一个支持冒泡且不能被取消的 look 事件

var ev = new Event("look", { bubbles: true, cancelable: false });
document.dispatchEvent(ev);

// 事件可以在任何元素触发，不仅仅是 document
myDiv.dispatchEvent(ev);
```

 **DOM** 元素（比如 <button>、<div>、<span> 等等）可以**接收** (或者**监听**) 这些事件，并且通过「事件处理器」（事件监听回调函数）去响应（或者处理）它们

可以使用 `EventTarget.addEventListener()`   给 **DOM** 元素添加事件处理器，使用 `removeEventListener()` 方法移除这些事件处理器

### 二、EventTarget

**EventTarget**  是一个接口，由**可以接收事件**并且**可以创建侦听器**的对象实现 （一般是 **DOM** 元素）<!--换句话说，任何可以接收和处理事件的对象都会实现 EventTarget 接口-->

在 **Web** 中，最常见的事件目标包括 **Element**（**HTML** 元素）、**document**（文档对象）和 **window**（窗口对象）

**EventTarget**  接口主要提供了三个方法：

- `addEventListener(type, listener, options)`：在 **EventTarget** 上注册特定事件类型的事件侦听器
  - `type`：**String** 类型
    - 表示监听的**事件类型**
  - `listener`：当所监听的事件类型触发时，会接收到一个事件通知（实现了 `Event` 接口的对象）的对象
    - `listener` 必须是一个实现了 `EventListener` 接口的对象，或者是一个函数 <!--通常是一个函数-->
  - `options`：一个指定有关 `listener` 属性的可选参数对象，可用的选项如下：
    - `capture`：`Boolean`类型，默认值为 `false`
      - 设置为 `false` 或者不设置时，表示 `listener` 会在该类型的 **==事件冒泡阶段==** 传播到该 `EventTarget` 时触发 
      - 设置为 `true` 时，表示 `listener` 会在该类型的 **==事件捕获阶段==** 传播到该 `EventTarget` 时触发 
    - `once`：`Boolean`类型，默认值为 `false`
      - 表示 `listener` 在添加之后最多只调用一次，如果为 `true`，`listener` 会在其被调用之后自动移除
    - `passive`：`Boolean`类型，默认值为 `false`
      - 设置为 `true` 时，表示 `listener` 永远不会调用 `preventDefault()`
      - 如果 `listener` 仍然调用了这个函数，客户端将会忽略它并抛出一个控制台警告
- `removeEventListener(type, listener, options)`：在 **EventTarget** 中删除事件侦听器
  - `type`：**String** 类型
    - 表示需要移除的事件类型
  - `listener`：需要从目标事件移除的**事件监听器**函数
  - `options`：一个指定事件侦听器特征的可选对象，可选项有：
    - `capture`：`Boolean`类型，默认值为 `false`
      - 设置为 `true` 时，表示需要移除的事件监听器函数是否为捕获监听器
- `dispatchEvent(event)`：将 **Event** 分派到指定的 **EventTarget**，并以合适的顺序（同步地）调用所有受影响的 **EventListener**
  - `event`：被派发的 `Event`，其 `Event.target` 属性为当前的 `EventTarget`

**例子:**

1. 假设有一个 <button>（一个 `EventTarget`），可以使用  `addEventListener()` 方法为其添加一个 `click` 事件的**监听器**

2. 当用户点击这个按钮时，浏览器就会**自动创建**一个 `Event` 对象，并调用之前添加的**监听器**，同时将 `Event` 对象**作为参数传入**

3. 这样就可以在监听器中获取到事件的相关信息，如事件类型、事件目标等

   ```html
   <button id="myButton">点击我</button>
   ```

   ```js
   // 获取按钮元素
   var button = document.getElementById('myButton');
   
   // 为按钮添加点击事件的监听器
   button.addEventListener('click', function(event) {
     // 当按钮被点击时，这个函数会被调用
     console.log('Button was clicked!');
   });
   ```

==**Event** 和 **EventTarget** 的关系：共同实现了**事件驱动**的程序结构，**EventTarget** 负责维护事件与对应的监听器，而 **Event** 用于传递事件发生时的状态与信息==

### 三、浏览器内置事件

浏览器中**内置**了很多 **Event** 的**子类**，也就是浏览器**内置事件**

常见的浏览器事件：

- **MouseEvent（鼠标事件）**：这类事件与鼠标操作有关，例如：
  - `click`：当用户点击鼠标时触发
  - `dblclick`：当用户双击鼠标时触发
  - `mousemove`：当鼠标在元素内部移动时触发
  - `mouseover`：当鼠标移入元素时触发
  - `mouseout`：当鼠标移出元素时触发
- **KeyboardEvent（键盘事件）**：这类事件与键盘操作有关，例如：
  - `keydown`：当用户按下键盘上的任意键时触发
  - `keyup`：当用户释放键盘上的键时触发
  - `keypress`：当用户按下并释放键盘上的键时触发
- **UIEvent（用户界面事件）**：这类事件与用户界面有关，例如：
  - `load`：当页面加载完成时触发
  - `unload`：当页面即将关闭或跳转时触发
  - `scroll`：当用户滚动指定的元素或页面时触发
- **FocusEvent（焦点事件）**：这类事件与元素的焦点状态有关例如：
  - `focus`：当元素获得焦点时触发
  - `blur`：当元素失去焦点时触发

### 四、自定义事件

浏览器中除了内置事件之外，还允许我们创建自定义事件

浏览器提供了一个 **Event** 的子类 **CustomEvent** 供我们创建自定义事件

**CustomEvent** 构造函数的语法

```js
new CustomEvent(type, options)
```

- `type`：一个字符串，提供事件的名称，<!--事件名称是区分大小写的-->
- `options`：一个可选的对象，除了在 **Event** 中定义的属性外，还可以有以下属性：
  - `detail`：与事件相关的任何数据，默认值为 `null`
    - 这个值可以在处理程序中通过 `CustomEvent.detail` 属性获取

**例子：**

```js
// 创建自定义事件
const catFound = new CustomEvent("animalfound", {
  detail: {
    name: "cat",
  },
});

// 添加一个事件监听器
window.addEventListener("animalfound", (e) => console.log(e.detail.name));

// 分派事件
window.dispatchEvent(catFound);  // "cat" 将会在控制台中打印出来
```

### 五、浏览器事件流

事件流描述了浏览器页面接收事件的顺序

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/202405181814289.jpg" alt="eventflow" style="zoom:60%;" />

事件流包含三个阶段

- 事件捕获阶段
  - 是先由最上一级的节点先接收事件,然后向下传播到具体的节点 `document->body->div->button`
- 处于目标阶段
  - 在目标节点上触发,称为目标阶段
  - 事件目标是真正触发事件的对象（`event.target`）<!--整个事件流中每个事件的target是同一个-->
- 事件冒泡阶段
  - 事件开始时由最具体的元素(文档中嵌套层次最深的那个节点)接收，然后逐级向上传播 `button->div->body->document`

首先发生的是事件捕获，然后是实际的目标接收到事件，最后阶段是冒泡阶段

