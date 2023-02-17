## React18源码解析（一）React设计思想与理念

### 一、对于React的理解

#### 1.1 React 是什么?

==React==是一个**==用于构建用户界面的 JavaScript 库==**

#### 1.2 React 能干什么?

可以通过**==组件化==**的方式构建快速响应的大型`Web`应用程序

#### 1.3 React 如何干的?

- **声明式：**使用声明式的编写用户界面,代码**方便调试**

  > 声明式渲染和命令式渲染
  >
  > - 命令式渲染 命令我们的程序去做什么,程序就会跟着你的命令去一步一步执行
  > - 声明式渲染 我们只需要告诉程序我们想要什么效果，其他的交给程序来做
  >
  > ```js
  > let root = document.getElementById("root");
  > //声明式
  > ReactDOM.render(<h1 onClick={() => console.log("hello")}>hello</h1>, root);
  > 
  > //命令式
  > let h1 = document.createElement("h1");
  > h1.innerHTML = "hello";
  > h1.addEventListener("click", () => console.log("hello"));
  > root.appendChild(h1);
  > ```

- **组件化：** 把页面拆分为一个个组件，方便视图的**拆分和复用**，还可以做到**高内聚和低耦合**

- **一次学习，随处编写**
  - 可以使用 React 开发 Web、Android、IOS、VR 和命令行程序
  - ReactNative 使用 React 来创建 Android 和 iOS 的原生应用
  - React 360 是一个创建 3D 和 VR 用户交互的框架

#### 1.4 React 干的怎么样?

##### 1.4.1 优点

- 开发团队和社区强大
- 一次学习，随处编写
- API 比较简洁

##### 1.4.2 缺点

- 没有官方系统解决方案，选型成本高
- 过于灵活，不容易写出高质量的应用

