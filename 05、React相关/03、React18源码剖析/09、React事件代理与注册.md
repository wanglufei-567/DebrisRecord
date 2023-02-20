## React18源码解析（九）React事件代理与注册

### 一、前言

**==事件==**是用户或浏览器自身执行的某种动作（比如：`click`、`mouseover`），而响应某个事件的函数叫做事件处理程序

#### 1.1、DOM事件流

![eventflow](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/eventflow_1665894563837.jpg)

DOM事件流包含三个阶段

- 事件捕获阶段
  - 是先由最上一级的节点先接收事件,然后向下传播到具体的节点 `document->body->div->button`
- 处于目标阶段
  - 在目标节点上触发,称为目标阶段
  - 事件目标是真正触发事件的对象（`event.target`）<!--整个事件流中每个事件的target是同一个-->
- 事件冒泡阶段
  - 事件开始时由最具体的元素(文档中嵌套层次最深的那个节点)接收,然后逐级向上传播 `button->div->body->document`

首先发生的是事件捕获，然后是实际的目标接收到事件，最后阶段是冒泡阶段

#### 1.2、addEventListener

**EventTarget.addEventListener()** 方法将指定的监听器注册到 `EventTarget` 上，当该对象触发指定的事件时，指定的回调函数就会被执行。事件目标可以是一个文档上的任何元素 ，比如`Element`、`Document` 和 `Window`

语法：

```js
EventTarget.addEventListener(event, function, useCapture)
```

- `event` : 必须。字符串，指定事件名
- `function`: 必须。指定要事件触发时执行的函数
- `useCapture`: 可选 （默认值 `false`）。布尔值，`true`则在捕获阶段绑定函数，反之`false`在冒泡阶段绑定函数

#### 1.3、事件代理

**事件代理**又称之为**事件委托**，事件代理是把原本需要绑定在**子元素**的事件委托给**父元素**，让父元素负责事件监听，事件代理是利用**事件冒泡**来实现的

- 优点
  - 可以大量节省内存占用，减少事件注册
  - 当新增子对象时无需再次对其绑定

```html
<body>
  <ul id="list" onclick="show(event)">
    <li>item 1</li>
    <li>item 2</li>
    <li>item 3</li>
    <li>item n</li>
  </ul>
  <script>
    function show(event) {
      alert(event.target.innerHTML);
    }
  </script>
</body>
```

#### 1.4、React的合成事件

**合成事件**是围绕**浏览器原生事件**充当跨浏览器包装器的对象,它们将不同浏览器的行为合并为一个 API,这样做是为了确保事件在不同浏览器中显示一致的属性 <!--不理解，本身就是事件代理，也能抹平浏览器差异？-->

==**React为何采用合成事件？**==

React 采用合成事件的主要原因有以下几点：

1. **==提高性能==**：通过使用合成事件，==React 可以**减少浏览器事件的绑定数量**，避免过多的内存分配和垃圾回收==，从而提高页面性能。
2. ==统一事件处理==：通过合成事件，React 可以解决跨浏览器的事件==兼容性问题==，使得开发者可以以相同的方式处理事件，无需考虑不同浏览器之间的差异。
3. 事件对象重用：使用合成事件可以重用事件对象，减少了内存占用和垃圾回收，同时还能提高事件处理的效率。
4. 方便事件优化：通过使用合成事件，React 可以对事件进行统一的处理，使得事件的优化变得更加方便。
5. 给事件添加优先级，便于调度

总之，==**采用合成事件可以提高 React 应用的性能和可维护性**==，是 React 设计的一个重要特点。

<!--对比下Vue，Vue在事件绑定的地方也有优化（事件缓存，事件绑定的优化）,但仍然需要绑定事件（绑定数量不变），React通过将事件委托，只在root上进行一次事件绑定（捕获和冒泡两个阶段），但是也会产生一个新问题，不管目标元素的父元素上有没有事件处理器，都会需要反向遍历fiber树，并且一般情况下会遍历两遍（捕获和冒泡两个阶段），所以说React合成事件可以提高性能这一点值得商榷；真正让React采用合成事件机制的出发点，应该还是 统一事件处理 Reac对事件进行统一的处理，方便做一些优化工作，比如给事件添加优先级-->

![eventuse](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/eventuse_1665894712077.jpg)

简易实现👇

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>

<body>
  <div id="root">
    <div id="parent" xx="yy">
      <div id="child">点击</div>
    </div>
  </div>
</body>
<script>
  var parentBubble = () => {
    console.log('父React冒泡');
  }
  var parentCapture = () => {
    console.log('父React捕获');
  }
  var childBubble = () => {
    console.log('子React冒泡');
  }
  var childCapture = () => {
    console.log('子React捕获');
  }
  let root = document.getElementById('root');
  let parent = document.getElementById('parent');
  let child = document.getElementById('child');

  parent.onxxClick = parentBubble;
  parent.onxxClickCapture = parentCapture;
  child.onxxClick = childBubble;
  child.onxxClickCapture = childCapture;

  //模拟React中的事件委托
  root.addEventListener('click', dispatchEvent.bind(null, true), true);
  root.addEventListener('click', dispatchEvent.bind(null, false), false);

  function dispatchEvent(isCapture, nativeEvent) {
    console.log('dispatchEvent', isCapture ? '捕获' : '冒泡');

    let paths = [];//child parent div#root
    let currentTarget = nativeEvent.target;

    // 向上寻找父节点并收集起来
    while (currentTarget) {
      paths.push(currentTarget);
      currentTarget = currentTarget.parentNode;
    }

    if (isCapture) {
      for (let i = paths.length - 1; i >= 0; i--) {
        let handler = paths[i].onxxClickCapture;
        handler && handler();
      }
    } else {
      for (let i = 0; i < paths.length; i++) {
        let handler = paths[i].onxxClick;
        handler && handler();
      }
    }
  }

  parent.addEventListener('click', () => {
    console.log('父原生捕获');
  }, true);
  parent.addEventListener('click', () => {
    console.log('父原生冒泡');
  }, false);
  child.addEventListener('click', () => {
    console.log('子原生捕获');
  }, true);
  child.addEventListener('click', () => {
    console.log('子原生冒泡');
  }, false);
</script>

</html>
```

这段实现的核心在于👇

```js
 //模拟React中的事件委托
  root.addEventListener('click', dispatchEvent.bind(null, true), true);
  root.addEventListener('click', dispatchEvent.bind(null, false), false);

  function dispatchEvent(isCapture, nativeEvent) {
    console.log('dispatchEvent', isCapture ? '捕获' : '冒泡');

    let paths = [];//child parent div#root
    let currentTarget = nativeEvent.target;
    console.log('currentTarget', currentTarget)

    // 向上寻找父节点并收集起来
    while (currentTarget) {
      paths.push(currentTarget);
      currentTarget = currentTarget.parentNode;
    }

    if (isCapture) {
      for (let i = paths.length - 1; i >= 0; i--) {
        let handler = paths[i].onxxClickCapture;
        handler && handler();
      }
    } else {
      for (let i = 0; i < paths.length; i++) {
        let handler = paths[i].onxxClick;
        handler && handler();
      }
    }
  }
```

分为两个部分：

- 给根节点`root`在捕获和冒泡阶段都添加事件监听方法

  ```js
   root.addEventListener('click', dispatchEvent.bind(null, true), true);
   root.addEventListener('click', dispatchEvent.bind(null, false), false);
  ```

- 事件的分发`dispatchEvent`

  - 先通过事件目标`target`向上寻找父节点并收集起来，维护一个元素队列
  - 再根据`isCapture`，选择正向或者反向遍历收集起来的元素队列
  - 从元素取到提前绑定的事件方法进行执行

  React中的合成事件与这个大致一样，只对**==根节点添加事件监听==**，当根节点内部的某个元素触发了相关事件，那么由于DOM事件流，在捕获和冒泡阶段，根节点的事件监听回调便会触发，然后再按照顺序收集事件流中的所有元素，最后再正向或者反向遍历从元素上拿到相关事件的监听回调进行执行，从而达到和DOM事件流相同的执行顺序；

  由于真正注册事件监听的是**==根节点==**，所以如果内部元素通过`addEventListener`添加了监听回调，那么根节点上的回调和内部元素的原生监听事件回调，仍然按照DOM事件流来执行

  看下打印结果👇

  <img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230214221357884.png" alt="image-20230214221357884" style="zoom:50%;" />

### 二、React中的合成事件

#### 2.1、注册事件名

首先改造下`main.jsx`，给组件内的元素都添加上事件方法

```jsx
import { createRoot } from 'react-dom/client';
function FunctionComponent() {
  return (
  <h1
      onClick={event => console.log(`ParentBubble`)}
      onClickCapture={event => {
        console.log(`ParentCapture`);
      }}
    >
      <span
        onClick={event => {
          console.log(`ChildBubble`);
        }}
        onClickCapture={event => console.log(`ChildCapture`)}
      >
        world
      </span>
    </h1>
  );
}

let element = <FunctionComponent />;
console.log('element', element);

// 创建root
const root = createRoot(document.getElementById('root'));
console.log('root', root);
//把element虚拟DOM渲染到容器中
root.render(element);

```

------

在`src\react-dom\src\client\ReactDOMRoot.js`中的`createRoot`上，添加给**==根节点==**注册事件监听的方法`listenToAllSupportedEvents`

> 这里的`listenToAllSupportedEvents`类似于前面简易实现中的这一部分逻辑
>
> ```js
>  root.addEventListener('click', dispatchEvent.bind(null, true), true);
>  root.addEventListener('click', dispatchEvent.bind(null, false), false);
> ```

后续的事件代理便是在`listenToAllSupportedEvents`中进行处理的

<!--根节点的事件监听只在`createRoot`时注册一次，后续便不会再重复注册-->

```jsx
import {
  createContainer,
  updateContainer
} from 'react-reconciler/src/ReactFiberReconciler';
import { listenToAllSupportedEvents } from 'react-dom-bindings/src/events/DOMPluginEventSystem';

// ...

/**
 * @description 创建root的方法
 * @description 调用createContainer()创建容器
 * @description 调用new ReactDOMRoot() 创建ReactDOMRoot对象
 * @param container 容器，真实的DOM节点，div#root
 * @returns 返回一个ReactDOMRoot对象，也就是所谓的root
 */
export function createRoot(container) {
  const root = createContainer(container);
  // 根节点上进行事件监听
  listenToAllSupportedEvents(container);
  return new ReactDOMRoot(root);
}

```

------

在`src/react-dom-bindings/src/events/DOMPluginEventSystem.js`中实现并导出给**==根节点==**注册事件监听的方法`listenToAllSupportedEvents`

```jsx
import { allNativeEvents } from "./EventRegistry";
import * as SimpleEventPlugin from "./plugins/SimpleEventPlugin";

// 先完成事件的注册
SimpleEventPlugin.registerEvents();

/**
 * @description 监听根容器
 * @param rootContainerElement 根容器，也就是div#root
 */
export function listenToAllSupportedEvents(rootContainerElement) {
  allNativeEvents.forEach((domEventName) => {
    console.log(domEventName);
  });
}
```

上面👆这段实现中主要逻辑在事件的注册中`SimpleEventPlugin.registerEvents();`

<!--现在只是注册原生事件名，所以listenToAllSupportedEvents中暂时没有任何实现-->

------

实现`SimpleEventPlugin.registerEvents`

```jsx
// src/react-dom-bindings/src/events/plugins/SimpleEventPlugin.js
import { registerSimpleEvents } from "../DOMEventProperties";
export { registerSimpleEvents as registerEvents };
```

`registerEvents`实际上是`DOMEventProperties`中的`registerSimpleEvents`

------

实现`registerSimpleEvents`

```jsx
// src/react-dom-bindings/src/events/DOMEventProperties.js
import { registerTwoPhaseEvent } from './EventRegistry';

// 维护一个集合用于存储原生事件名与React事件名的对应关系
export const topLevelEventsToReactNames = new Map();

// 维护一个数组用于存储浏览器的事件名，有很多
const simpleEventPluginEvents = [
  'abort',
  'cancel',
  'click'
];

function registerSimpleEvent(domEventName, reactName) {
  topLevelEventsToReactNames.set(domEventName, reactName);
  // 注册捕获和冒泡两个阶段的事件
  registerTwoPhaseEvent(reactName, [domEventName]);//'onClick' ['click']
}

/**
 * @description 注册事件，根据原生事件名创建React事件名，并存储它们的对应关系
 */
export function registerSimpleEvents() {
  for (let i = 0; i < simpleEventPluginEvents.length; i++) {
    const eventName = simpleEventPluginEvents[i];//click
    const domEventName = eventName.toLowerCase();//click
    const capitalizeEvent = eventName[0].toUpperCase() + eventName.slice(1);// Click
    registerSimpleEvent(domEventName, `on${capitalizeEvent}`);//click,onClick
  }
}
```

`registerSimpleEvents`中也没有什么复杂的逻辑，只是

- 遍历`simpleEventPluginEvents`，根据其中的**原生事件名**创建**React事件名**，<!--simpleEventPluginEvents中有很多原生事件名，这里简单处理-->
- 将**原生事件名**和**React事件名**的对应关系存储在`topLevelEventsToReactNames`
- 注册捕获和冒泡两个阶段的事件 `registerTwoPhaseEvent`

------

实现`registerTwoPhaseEvent`

```jsx
export const allNativeEvents = new Set();

/**
 * @description 注册捕获和冒泡两个阶段的事件
 * 当我在页面中触发click事件的时候，会走事件处理函数
 * 事件处理函数需要找到DOM元素对应的要执行React事件 onClick onClickCapture
 * @param {*} registrationName React事件名 onClick
 * @param {*} dependencies 原生事件数组 [click]
 */
export function registerTwoPhaseEvent(registrationName, dependencies) {
  //注册冒泡事件的对应关系
  registerDirectEvent(registrationName, dependencies);
  //注意捕获事件的对应的关系
  registerDirectEvent(registrationName + 'Capture', dependencies);
}

export function registerDirectEvent(registrationName, dependencies) {
  for (let i = 0; i < dependencies.length; i++) {
    allNativeEvents.add(dependencies[i]);//click
  }
}
```

`registerTwoPhaseEvent`将原生事件名存到集合`allNativeEvents`中

到这里注册事件名就完成了，逻辑不复杂只是创建了很多文件，绕来绕去的，很晕，看下事件名注册的结果，遍历`allNativeEvents`并打印

![image-20230214231604388](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230214231604388.png)

<!--注册事件名这里感觉有些问题，registerDirectEvent中的registrationName没有用到，也就是说原生事件名存储了一次，没有存储React事件名，而React事件名是区分捕获和冒泡阶段的，比如onClick和onClickCapture，不过源码里也是这样的，有点不理解-->

#### 2.2、监听原生事件

完善`src/react-dom-bindings/src/events/DOMPluginEventSystem.js` 中**==根节点==**的注册事件监听方法`istenToAllSupportedEvents`

```js
import { allNativeEvents } from './EventRegistry';
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin';
import { IS_CAPTURE_PHASE } from './EventSystemFlags';
import { createEventListenerWrapperWithPriority } from './ReactDOMEventListener';
import {
  addEventCaptureListener,
  addEventBubbleListener
} from './EventListener';

/ 先完成事件名的注册
SimpleEventPlugin.registerEvents();

const listeningMarker =
  `_reactListening` + Math.random().toString(36).slice(2);

/**
 * @description 监听根容器
 * @param rootContainerElement 根容器，也就是div#root
 */
export function listenToAllSupportedEvents(rootContainerElement) {
  //只监听一次
  if (!rootContainerElement[listeningMarker]) {
    rootContainerElement[listeningMarker] = true;
    // 遍历所有的原生的事件比如click,进行监听
    allNativeEvents.forEach(domEventName => {
      listenToNativeEvent(domEventName, true, rootContainerElement);
      listenToNativeEvent(domEventName, false, rootContainerElement);
    });
  }
}
```

完善的有两点

- 增加了是否已经注册监听了的判断逻辑，保证根节点只注册一次监听

  ```js
   if (!rootContainerElement[listeningMarker]) {
      rootContainerElement[listeningMarker] = true;
     // ...
    }
  ```

  `listeningMarker`是一个随意字符串

- 完成所有原生事件的注册监听

  ```js
  allNativeEvents.forEach(domEventName => {
        listenToNativeEvent(domEventName, true, rootContainerElement);
        listenToNativeEvent(domEventName, false, rootContainerElement);
  });
  ```

  这里没有具体的注册逻辑，只是**==遍历了所有的原生事件名==**，然后调用监听注册的方法`listenToNativeEvent`，完成每一个事件的监听注册

------

实现`listenToNativeEvent`

```js
// src/react-dom-bindings/src/events/DOMPluginEventSystem.js

/**
 * 注册原生事件
 * @param {*} domEventName 原生事件 click
 * @param {*} isCapturePhaseListener 是否是捕获阶段 true false
 * @param {*} target 目标DOM节点 div#root 容器节点
 */
export function listenToNativeEvent(
  domEventName,
  isCapturePhaseListener,
  target
) {
  let eventSystemFlags = 0; //默认是0指的是冒泡 4是捕获
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }
  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener
  );
}

/**
 * @description 注册原生事件
 * @param {*} targetContainer 目标DOM节点 div#root 容器节点
 * @param {*} domEventName 原生事件 click
 * @param {*} eventSystemFlags 标识 冒泡 = 0 捕获 = 4
 * @param {*} isCapturePhaseListener 是否是捕获阶段 true false
 */
function addTrappedEventListener(
  targetContainer,
  domEventName,
  eventSystemFlags,
  isCapturePhaseListener
) {
  // 创建事件监听的方法
  const listener = createEventListenerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags
  );

  // 添加事件监听方法
  if (isCapturePhaseListener) {
    addEventCaptureListener(targetContainer, domEventName, listener);
  } else {
    addEventBubbleListener(targetContainer, domEventName, listener);
  }
}
```

上面这段实现中主要完成了以下内容

- 创建事件监听的方法 `createEventListenerWrapperWithPriority`
- 将事件监听的方法添加到根节点上`addEventCaptureListener`、`addEventBubbleListener`

------

实现`createEventListenerWrapperWithPriority`

```jsx
// src/react-dom-bindings/src/events/ReactDOMEventListener.js
/**
 * @description 创建事件的的监听函数
 * @param {*} targetContainer 容器div#root
 * @param {*} domEventName 事件名 click
 * @param {*} eventSystemFlags 阶段 0 冒泡 4 捕获
 */
export function createEventListenerWrapperWithPriority(
  targetContainer,
  domEventName,
  eventSystemFlags
) {
  const listenerWrapper = dispatchDiscreteEvent;
  return listenerWrapper.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer
  );
}

/**
 * 派发离散的事件的的监听函数
 * @param {*} domEventName 事件名 click
 * @param {*} eventSystemFlags 阶段 0 冒泡 4 捕获
 * @param {*} container 容器div#root
 * @param {*} nativeEvent 原生的事件
 */
function dispatchDiscreteEvent(
  domEventName,
  eventSystemFlags,
  container,
  nativeEvent
) {
  dispatchEvent(
    domEventName,
    eventSystemFlags,
    container,
    nativeEvent
  );
}

/**
 * @description 此方法就是委托给容器的回调，
 * 当容器#root在捕获或者说冒泡阶段处理事件的时候会执行此函数
 * @param {*} domEventName 事件名 click
 * @param {*} eventSystemFlags 阶段 0 冒泡 4 捕获
 * @param {*} targetContainer 容器div#root
 * @param {*} nativeEvent 原生的事件 浏览器给的event参数
 */
export function dispatchEvent(
  domEventName,
  eventSystemFlags,
  targetContainer,
  nativeEvent
) {
  console.log("dispatchEvent", domEventName, eventSystemFlags, targetContainer, nativeEvent);
}
```

上面这段实现的核心在`dispatchEvent`，==这个方法就是委托给容器的回调，当根节点在捕获或者说冒泡阶段处理事件的时候会执行此函数==

> 这里的dispatchEvent和前面建议实现的事件委托中的dispatchEvent是一样的，根节点上事件触发的回调就是这个方法，后面根节点内部元素上React事件监听方法就是在这里完成调用

需要注意⚠️一点，`dispatchEvent`的四个个参数

- `domEventName` 事件名 比如'click'
-  `eventSystemFlags` 阶段 0 冒泡 4 捕获
- `targetContainer` 容器`div#root`
- `nativeEvent` 原生的事件 浏览器给的`event`参数

除了第四个参数`nativeEvent`，是后面事件触发时，浏览器执行监听方法`dispatchEvent`自动传入的，其余三个都是在注册原生事件时给添加进去的，这三个参数对于后续的监听方法的派发**==很重要==**

<!--这里先搭个架子，后续在这里去完成调用React事件监听方法-->

------

实现将事件监听方法添加到根节点上的方法`addEventCaptureListener`、`addEventBubbleListener`

```js
// src/react-dom-bindings/src/events/EventListener.js
/**
 * @description 添加捕获阶段的事件监听方法
 */
export function addEventCaptureListener(target, eventType, listener) {
  target.addEventListener(eventType, listener, true);
  return listener;
}

/**
 * @description 添加冒泡阶段的事件监听方法
 */
export function addEventBubbleListener(target, eventType, listener) {
  target.addEventListener(eventType, listener, false);
  return listener;
}
```

------

到这里根节点的**==原生事件注册==**就已经完成了，看下实现效果👇

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230215000651074.png" alt="image-20230215000651074" style="zoom:50%;" />

`click`事件成功地在捕获阶段和冒泡阶段触发了根节点的事件监听方法

原生事件的注册已经完成

> 相当于简易实现中的这一部分
>
> ```js
>  root.addEventListener('click', dispatchEvent.bind(null, true), true);
>  root.addEventListener('click', dispatchEvent.bind(null, false), false);
> ```

那么接下来就是要实现事件派发`dispatchEvent`的部分

> 相当于简易实现中的这一部分
>
> ```js
> function dispatchEvent(isCapture, nativeEvent) {
>     let paths = [];//child parent div#root
>     let currentTarget = nativeEvent.target;
>     // 向上寻找父节点并收集起来
>     while (currentTarget) {
>       paths.push(currentTarget);
>       currentTarget = currentTarget.parentNode;
>     }
> 
>     if (isCapture) {
>       for (let i = paths.length - 1; i >= 0; i--) {
>         let handler = paths[i].onxxClickCapture;
>         handler && handler();
>       }
>     } else {
>       for (let i = 0; i < paths.length; i++) {
>         let handler = paths[i].onxxClick;
>         handler && handler();
>       }
>     }
> ```

`dispatchEvent`主要分为两个部分

- 提取事件监听方法`extractEvents`

  > 相当于的这一部分
  >
  > ```js
  > while (currentTarget) {
  >   paths.push(currentTarget);
  >   currentTarget = currentTarget.parentNode;
  > }
  > ```

- 执行事件监听方法`processDispatchQueue`

  > 相当于的这一部分
  >
  > ```js
  > if (isCapture) {
  >   for (let i = paths.length - 1; i >= 0; i--) {
  >     let handler = paths[i].onxxClickCapture;
  >     handler && handler();
  >   }
  > } else {
  >   for (let i = 0; i < paths.length; i++) {
  >     let handler = paths[i].onxxClick;
  >     handler && handler();
  >   }
  > }
  > ```

#### 2.3、extractEvents

接下来实现提取事件监听方法的这一部分

完善`src/react-dom-bindings/src/events/ReactDOMEventListener.js`中的`dispatchEvent`方法

```js
/**
 * @description 此方法就是委托给容器的回调，
 * 当容器#root在捕获或者说冒泡阶段处理事件的时候会执行此函数
 * @param {*} domEventName 事件名 click
 * @param {*} eventSystemFlags 阶段 0 冒泡 4 捕获
 * @param {*} targetContainer 容器div#root
 * @param {*} nativeEvent 原生的事件 浏览器给的event参数
 */
export function dispatchEvent(
  domEventName,
  eventSystemFlags,
  targetContainer,
  nativeEvent
) {
  // 获取事件源，它是一个真实DOM
  const nativeEventTarget = getEventTarget(nativeEvent);
  // 获取该真实DOM对应的fiber
  const targetInst = getClosestInstanceFromNode(nativeEventTarget);
  
  // console.log("dispatchEvent", domEventName, eventSystemFlags, targetContainer, nativeEvent);

  // 从事件系统中派发事件
  dispatchEventForPluginEventSystem(
    domEventName, //click
    eventSystemFlags, //0 4
    nativeEvent, //原生事件
    targetInst, //此真实DOM对应的fiber
    targetContainer //目标容器
  );
}
```

增加的内容：

- `getEventTarget`：通过原生的事件对象`nativeEvent`（浏览器提供的`event`）获取到事件目标（`event.target` 是个DOM节点）
- `getClosestInstanceFromNode`：通过事件目标（`nativeEventTarget`）获取到该真实DOM对应的`fiber`（`targetInst`） <!--这个很重要，因为所有的React事件都是在fiber节点上的，但是事件触发时只能通过浏览器提供的event对象获取到事件目标，所以如何通过真实DOM节点获取到对应的fiber节点很重要-->

- `dispatchEventForPluginEventSystem`：从事件系统中派发事件，事件监听方法的收集和执行在这里完成的，<!--事件监听方法的收集需要遍历fiber链，所以这里将事件目标对应的fiber节点透传下去了-->

------

实现`getEventTarget`

```js
// src/react-dom-bindings/src/events/getEventTarget.js
function getEventTarget(nativeEvent) {
  const target = nativeEvent.target || nativeEvent.srcElement || window;
  return target;
}
export default getEventTarget;
```

------

在`src/react-dom-bindings/src/client/ReactDOMComponentTree.js`中实现并导出`getClosestInstanceFromNode`

```js
const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = '__reactFiber$' + randomKey;
const internalPropsKey = "__reactProps$" + randomKey;

/**
 * @description 从真实的DOM节点上获取它对应的fiber节点
 * @param {*} targetNode 真实的DOM节点
 */
export function getClosestInstanceFromNode(targetNode) {
  const targetInst = targetNode[internalInstanceKey]
  if (targetInst) {
    return targetInst;
  }
  return null;
  //如果真实DOM上没有fiber,就不要返回undefined,而是要返回null
}
```

可以发现`fiber`节点是通过真实DOM节点的`internalInstanceKey`属性获取到的

```js
const targetInst = targetNode[internalInstanceKey]
```

而`internalInstanceKey`是一个随机字符串，那么问题来了，真实DOM节点上什么时候添加的`internalInstanceKey`属性？

答案是在工作循环中根据`fiber`创建真实DOM时完成的这一步操作，那怎么完成的呢？看下面👇

在`ReactDOMComponentTree.js`中再添加几个方法

```js
/**
 * @description 提前缓存fiber节点的实例到DOM节点上
 * @param {*} hostInst fiber实例
 * @param {*} node 真实DOM
 */
export function preCacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst;
}


/**
 * @description 在DOM节点保存props
 * @param node DOM节点
 * @param props 虚拟DOM上的props
 */
export function updateFiberProps(node, props) {
  node[internalPropsKey] = props;
}

/**
 * @description 从DOM节点获取props
 * @param node DOM节点
 */
export function getFiberCurrentPropsFromNode(node) {
  return node[internalPropsKey] || null;
}
```

- `preCacheFiberNode` 缓存fiber节点的实例到DOM节点上 <!--有了fiber就能回溯父fiber-->
- `updateFiberProps` 在DOM节点保存props <!--为了后续取到React事件-->
- `getFiberCurrentPropsFromNode` 从DOM节点获取`props` <!--为了后续取到React事件-->

再回顾下`ReactDOMHostConfig.js`中创建真实DOM的方法`createInstance`

```js
/**
 * 在原生组件初次挂载的时候，会通过此方法创建真实DOM
 * @param {*} type 类型 span
 * @param {*} props 属性
 * @param {*} internalInstanceHandle 它对应的fiber
 * @returns
 */
export function createInstance(type, props, internalInstanceHandle) {
  const domElement = document.createElement(type);
  return domElement;
}
```

就是在这里👇完成了提前缓存fiber节点的实例和`props`到DOM节点上

```js
export function createInstance(type, props, internalInstanceHandle) {
  const domElement = document.createElement(type);
  // 提前缓存fiber节点的实例到DOM节点上
  preCacheFiberNode(internalInstanceHandle, domElement);
  //把属性直接保存在domElement的属性上
  updateFiberProps(domElement, props);
  return domElement;
}
```

这样便可以通过事件目标获取到对应的fiber节点

------

在DOM插件事件系统`src/react-dom-bindings/src/events/DOMPluginEventSystem.js`中实现并导出`dispatchEventForPluginEventSystem`

```js
/**
 * @description 分派事件
 * @param domEventName 原生事件名 click
 * @param eventSystemFlags 标识 冒泡 = 0 捕获 = 4
 * @param nativeEvent 原生的事件 浏览器给的event参数
 * @param targetInst 此真实DOM对应的fiber
 * @param targetContainer 目标容器 div#root
 */
export function dispatchEventForPluginEventSystem(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst,
  targetContainer
) {
  // 给插件分派事件
  dispatchEventForPlugins(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetInst,
    targetContainer
  );
}

/**
 * @description 分派事件
 * @param domEventName 原生事件名 click
 * @param eventSystemFlags 事件系统标题 冒泡 = 0 捕获 = 4
 * @param nativeEvent 原生的事件 浏览器给的event参数
 * @param targetInst 此真实DOM对应的fiber
 * @param targetContainer 目标容器 div#root
 */
function dispatchEventForPlugins(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst,
  targetContainer
) {
  // 获取事件源，它是一个真实DOM
  const nativeEventTarget = getEventTarget(nativeEvent);
  //派发事件的队列
  const dispatchQueue = [];
  // 从下往上遍历fiber链，并提取事件
  extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  );

  // 执行派发队列中的事件监听方法
  //processDispatchQueue(dispatchQueue, eventSystemFlags);
}
```

上面这段实现的核心逻辑在`dispatchEventForPlugins`中

主要完成了以下内容：

- 创建了一个派发队列`dispatchQueue`，用于后续存储所有事件的监听方法
- 从下往上遍历`fiber`链，并提取事件`extractEvents`
- 执行派发队列中的事件监听方法 `processDispatchQueue` <!--这个在2.4再实现-->

------

接下来实现`extractEvents`方法

```js
// src/react-dom-bindings/src/events/DOMPluginEventSystem.js
/**
 * @description 从下往上遍历fiber链，并提取事件
 * @param dispatchQueue 派发事件的数组
 * @param domEventName 原生事件名 click
 * @param targetInst 此真实DOM对应的fiber
 * @param nativeEvent 原生的事件 浏览器给的event参数
 * @param nativeEventTarget 事件源，它是一个真实DOM
 * @param eventSystemFlags 标识 冒泡 = 0 捕获 = 4
 * @param targetContainer 目标容器 div#root
 */
function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer
) {
  SimpleEventPlugin.extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  );
}
```

没有具体逻辑，只是调用`SimpleEventPlugin.extractEvents`

------

在`src/react-dom-bindings/src/events/plugins/SimpleEventPlugin.js`中实现并导出`SimpleEventPlugin.extractEvents`

```js
import {
  registerSimpleEvents,
  topLevelEventsToReactNames
} from '../DOMEventProperties';
import { IS_CAPTURE_PHASE } from '../EventSystemFlags';
import { accumulateSinglePhaseListeners } from '../DOMPluginEventSystem';
import { SyntheticMouseEvent } from '../SyntheticEvent';

/**
 * @description 从下往上遍历fiber链，并提取事件添加到dispatchQueue中
 * @param dispatchQueue 派发队列，里面放置我们的监听函数
 * @param domEventName 原生事件名 click
 * @param targetInst 此真实DOM对应的fiber
 * @param nativeEvent 原生的事件对象 浏览器给的event参数
 * @param nativeEventTarget 事件源，它是一个真实DOM
 * @param eventSystemFlags 事件系统标题 冒泡 = 0 捕获 = 4
 * @param targetContainer 目标容器 div#root
 */
function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget, //click => onClick
  eventSystemFlags,
  targetContainer
) {
  // 根据真实事件名获取React事件名
  const reactName = topLevelEventsToReactNames.get(domEventName);
  // 是否是捕获阶段
  const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;

  //合成事件的构建函数
  let SyntheticEventCtor;
  switch (domEventName) {
    case 'click':
      SyntheticEventCtor = SyntheticMouseEvent;
      break;
    default:
      break;
  }

  // 提取事件监听方法
  const listeners = accumulateSinglePhaseListeners(
    targetInst, // 此真实DOM对应的fiber
    reactName, // React事件名
    nativeEvent.type, // 事件类型
    isCapturePhase // 是否是捕获阶段
  );

  // 利用原生的事件对象生成一个合成事件对象，并和事件监听方法队列一起放入到派发队列中
  if (listeners.length > 0) {
    const event = new SyntheticEventCtor(
      reactName, // React事件名
      domEventName, // 原生事件名
      null,
      nativeEvent, // 原生的事件对象 浏览器给的event参数
      nativeEventTarget // 事件源，它是一个真实DOM
    );
    // 注意这里，后面所有的事件监听方法用的是同一个合成事件对象
    dispatchQueue.push({
      event, //合成事件实例
      listeners //事件监听方法队列
    });
  }
}

export { registerSimpleEvents as registerEvents, extractEvents };
```

`SimpleEventPlugin中的extractEvents`主要完成以下内容：

- 根据原生事件名获取React事件名

- 遍历`fiber`链并提取事件监听方法（`accumulateSinglePhaseListeners`） 得到事件监听方法队列（`listeners`）
- 利用原生的事件对象生成一个合成事件对象 `new SyntheticEventCtor` <!--为什么需要合成事件对象？1、原生事件对象event中有许多属性，React事件不是都需要；2、React事件需要事件对象中有一些自己的属性，比如React的阻止冒泡的方法stopPropagation、阻止默认行为的方法preventDefault-->
- 将事件监听方法队列`listener`和合成事件对象一起放入派发队列中

------

实现`accumulateSinglePhaseListeners`

```js
// src/react-dom-bindings/src/events/DOMPluginEventSystem.js

/**
 * @description 根据fiber和React事件名，向上收集事件监听方法
 * @param targetFiber 此真实DOM对应的fiber
 * @param reactName React事件名
 * @param nativeEventType 事件类型
 * @param isCapturePhase 否是捕获阶段
 * @returns listeners 收集到的时间监听方法的队列
 */
export function accumulateSinglePhaseListeners(
  targetFiber,
  reactName,
  nativeEventType,
  isCapturePhase
) {
  const captureName = reactName + 'Capture';
  const reactEventName = isCapturePhase ? captureName : reactName;

  // 事件监听方法的队列，用于存储一条fiber链上每个节点相同事件的监听方法
  // 注意：与派发队列区分开来
  const listeners = [];

  let instance = targetFiber;

  // 根据事件源真实DOM节点对应的fiber，向上收集对应的事件监听方法
  while (instance !== null) {
    //stateNode 真实DOM节点
    const { stateNode, tag } = instance;
    if (tag === HostComponent && stateNode !== null) {
      // 获取此fiber上对应的回调函数
      const listener = getListener(instance, reactEventName);

      // 将事件监听方法添加到监听方法的队列中
      if (listener) {
        listeners.push(
          createDispatchListener(instance, listener, stateNode)
        );
      }
    }

    instance = instance.return;
  }

  return listeners;
}

/**
 * @param instance fiber实例
 * @param listener 监听方法
 * @param currentTarget fiber对应的真实DOM节点
 */
function createDispatchListener(instance, listener, currentTarget) {
  return { instance, listener, currentTarget };
}
```

在这段实现中是如何完成遍历`fiber`链收集事件监听方法的？

首先我们已经有了事件目标对应的`fiber`节点，然后通过`getListener`获取到`fiber`节点上存的React事件监听方法，再将其放入到`listeners`队列中，最后在通过`fiber.return`获取到父fiber节点，再重复一遍上面的操作，直到遍历到`root`节点

需要注意⚠️一下这点

```js
const captureName = reactName + 'Capture';
const reactEventName = isCapturePhase ? captureName : reactName;
```

这里对`reactEventName`的赋值**==区分了捕获和冒泡阶段==**，这个很重要，因为后续`getListener`就是通过这个名字去`fiber`节点上取`React`事件监听方法 

在`src/react-dom-bindings/src/events/getListener.js`中实现并导出`getListener`

```js
import { getFiberCurrentPropsFromNode } from '../client/ReactDOMComponentTree';

/**
 * 获取此fiber上对应的回调函数
 * @param {*} inst fiber节点
 * @param {*} registrationName React事件名
 */
export default function getListener(inst, registrationName) {
  const { stateNode } = inst;
  if (stateNode === null) return null;

  // 从当前fiber节点对应的真实DOM上获取props
  const props = getFiberCurrentPropsFromNode(stateNode);
  if (props === null) return null;

  // 获取事件监听方法
  const listener = props[registrationName]; //props.onClick
  return listener;
}

```

`getListener`就是从`fiber`节点的`props`上取到React事件监听方法

最后注意下事件队列`listeners`的数据格式应当是这样的

```js
listeners = [{ fiber1, 监听方法1, 真实DOM1 }, { fiber2, 监听方法2, 真实DOM2 }, ...]
```

------

再看下合成事件对象 `SyntheticEventCtor`是如何实现的

```js
import assign from 'shared/assign';

function functionThatReturnsTrue() {
  return true;
}

function functionThatReturnsFalse() {
  return false;
}

const MouseEventInterface = {
  clientX: 0,
  clientY: 0
};

/**
 * @description 创建合成事件对象
 */
function createSyntheticEvent(inter) {
  /**
   *合成事件的基类
   * @param {*} reactName React属性名 onClick
   * @param {*} reactEventType click
   * @param {*} targetInst 事件源对应的fiber实例
   * @param {*} nativeEvent 原生事件对象
   * @param {*} nativeEventTarget 原生事件源 span 事件源对应的那个真实DOM
   */
  function SyntheticBaseEvent(
    reactName,
    reactEventType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    this._reactName = reactName;
    this.type = reactEventType;
    this._targetInst = targetInst;
    this.nativeEvent = nativeEvent;
    this.target = nativeEventTarget;

    //把此接口上对应的属性从原生事件上拷贝到合成事件实例上
    for (const propName in inter) {
      if (!inter.hasOwnProperty(propName)) {
        continue;
      }
      this[propName] = nativeEvent[propName];
    }

    //是否已经阻止默认事件
    this.isDefaultPrevented = functionThatReturnsFalse;
    //是否已经阻止继续传播
    this.isPropagationStopped = functionThatReturnsFalse;
    return this;
  }

  assign(SyntheticBaseEvent.prototype, {
    preventDefault() { // 阻止默认事件
      const event = this.nativeEvent;
      if (event.preventDefault) {
        event.preventDefault();
      } else {
        // Event.returnValue 属性表示该事件的默认操作是否已被阻止。
        // 默认情况下，它被设置为 true，即允许进行默认操作。
        // 将该属性设置为 false 即可阻止默认操作
        event.returnValue = false;
      }
      this.isDefaultPrevented = functionThatReturnsTrue;
    },
    stopPropagation() { // 阻止冒泡
      const event = this.nativeEvent;
      if (event.stopPropagation) {
        event.stopPropagation();
      } else {
        // cancelBubble 原生事件对象上的属性，将其值设置为true可阻止事件的传播
        event.cancelBubble = true;
      }
      this.isPropagationStopped = functionThatReturnsTrue;
    }
  });
  return SyntheticBaseEvent;
}

export const SyntheticMouseEvent = createSyntheticEvent(
  MouseEventInterface
);

```

整个实现不复杂，主要是设计了一个合成事件对象的基类`SyntheticBaseEvent`，再通过工厂方法`createSyntheticEvent`和每个事件的接口（比如：`MouseEventInterface`，不同React事件需要不同的原生事件对象属性）去生成一个独特的合成事件对象；

`SyntheticBaseEvent`中的逻辑也不复杂，主要有以下几部分

- 根据接口提取原生事件对象属性到合成事件对象上
- 实现React事件的阻止默认行为的方法：`preventDefault`
- 实现React事件的阻止冒泡行为的方法：`stopPropagation`

------

有了事件监听方法的队列listeners和合成事件对象event，便可以将它们放入到派发队列中

```js
dispatchQueue.push({
  event, //合成事件实例
  listeners //事件监听方法队列
});
```

需要注意的是，这里派发队列存在的意义，因为用户单次交互时可能不止触发了一种事件，所以派发队列的数据格式应当是这样的

```js
dispatchQueue = [{event1, listeners1}, {event2, listeners2}, ...]
```

------

到这里事件监听方法的收集就实现完成了，看下实现效果，打印下派发队列`dispatchQueue`

![image-20230217214009892](/Users/wangdong/Library/Application Support/typora-user-images/image-20230217214009892.png)

再对比下JSX

```jsx
 <h1
    onClick={event => console.log(`ParentBubble`)}
    onClickCapture={event => {
      console.log(`ParentCapture`);
    }}
  >
    <span
      onClick={event => {
        console.log(`ChildBubble`);
      }}
      onClickCapture={event => console.log(`ChildCapture`)}
    >
      world
    </span>
  </h1>
```

可以发现当点击’world‘时，所有的事件监听方法都收集到队列中了（这里截图的时捕获阶段的派发队列）

那么接下来就要实现事件监听方法的执行了

#### 2.4、processDispatchQueue

回顾下`dispatchEventForPlugins`方法，`extractEvents`已经实现了，接下来实现`processDispatchQueue`

```js
/**
 * @description 分派事件
 * @param domEventName 原生事件名 click
 * @param eventSystemFlags 事件系统标题 冒泡 = 0 捕获 = 4
 * @param nativeEvent 原生的事件 浏览器给的event参数
 * @param targetInst 此真实DOM对应的fiber
 * @param targetContainer 目标容器 div#root
 */
function dispatchEventForPlugins(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst,
  targetContainer
) {
  // 获取事件源，它是一个真实DOM
  const nativeEventTarget = getEventTarget(nativeEvent);
  //派发事件的队列
  const dispatchQueue = [];
  // 从下往上遍历fiber链，并提取事件
  extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  );

  // 执行派发队列中的事件监听方法
  processDispatchQueue(dispatchQueue, eventSystemFlags);
}
```

------

实现`processDispatchQueue`

```js
// src/react-dom-bindings/src/events/DOMPluginEventSystem.js
/**
 * @description 执行派发队列中的事件监听方法
 * @param dispatchQueue 派发队列，里面放置我们的监听函数
 * @param eventSystemFlags 事件系统标题 冒泡 = 0 捕获 = 4
 */
function processDispatchQueue(dispatchQueue, eventSystemFlags) {
  //判断是否在捕获阶段
  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;

  // 遍历派发队列，执行事件监听的方法
  // dispatchQueue 长这样[{event:事件1, listeners:[...]},{event:事件2, listeners:[...]}]
  for (let i = 0; i < dispatchQueue.length; i++) {
    const { event, listeners } = dispatchQueue[i];
    processDispatchQueueItemsInOrder(
      event, // 合成事件对象
      listeners, // 事件监听方法的队列
      inCapturePhase // true 捕获， false 冒泡
    );
  }
}
```

遍历了派发队列，并调用`processDispatchQueueItemsInOrder`执行单个事件的监听方法

------

实现`processDispatchQueueItemsInOrder`

```js
/**
 * @description 依次执行派发队列中的事件监听方法
 * @param event 合成事件对象
 * @param dispatchListeners 事件监听方法的队列
 * @param inCapturePhase true 捕获， false 冒泡
 */
function processDispatchQueueItemsInOrder(
  event,
  dispatchListeners,
  inCapturePhase
) {
  if (inCapturePhase) {
    // 捕获阶段

    // dispatchListeners中的顺序[子，父]
    for (let i = dispatchListeners.length - 1; i >= 0; i--) {
      const { listener, currentTarget } = dispatchListeners[i];
      if (event.isPropagationStopped()) {
        // 若停止冒泡则直接退出循环
        // event对象是当前事件所有监听方法共有的
        return;
      }
      executeDispatch(event, listener, currentTarget);
    }
  } else {
    // 冒泡阶段
    for (let i = 0; i < dispatchListeners.length; i++) {
      const { listener, currentTarget } = dispatchListeners[i];
      if (event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
    }
  }
}

/**
 * @description 执行事件监听方法
 * @param event 合成事件对象
 * @param listener 事件监听方法
 * @param currentTarget 当前的事件源
 */
function executeDispatch(event, listener, currentTarget) {
  //合成事件实例currentTarget是在不断的变化的
  // event target 它的是原始的事件源，是永远不变的
  // event currentTarget 当前的事件源，它是会随着事件回调的执行不断变化的
  event.currentTarget = currentTarget;
  listener(event);
}
```

这段实现中就是根据是否在捕获阶段，选择是正向还是反向遍历`listeners`，和简易实现合成事件的例子中一致

不过有一点不同，就是增加了阻止冒泡的逻辑

```js
if (event.isPropagationStopped()) {
    // 若停止冒泡则直接退出循环
    // event对象是当前事件所有监听方法共有的
    return;
  }
```

`isPropagationStopped`属性是合成事件上的，当事件监听方法中调用了`event.stopPropagation()`，这个属性`isPropagationStopped`就会被置为`true`，那么遍历执行`listener`时便会直接退出循环，达到阻止冒泡的目的

到这里整个合成事件就实现完成了，接下来看下实现效果

#### 2.5、实现效果

JSX

```jsx
function FunctionComponent() {
  // hooks 用到更新 更新需要有事件触发
  return (
    <h1
      onClick={event => console.log(`ParentBubble`)}
      onClickCapture={event => {
        console.log(`ParentCapture`);
        //event.stopPropagation();
      }}
    >
      <span
        onClick={event => {
          console.log(`ChildBubble`);
          event.stopPropagation();
        }}
        onClickCapture={event => console.log(`ChildCapture`)}
      >
        world
      </span>
    </h1>
  );
}

let element = <FunctionComponent />;
```

打印结果

![image-20230217223050833](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230217223050833.png)

总结下，React的合成事件的主要思路和最开始的简易版合成事件是一致的

- 给根节点注册事件，进行事件代理
- 事件触发时，从事件目标对象向上回溯DOM节点完成事件收集
- 根据是否在捕获阶段，进行正向或反向遍历派发队列，将事件取出来进行执行

