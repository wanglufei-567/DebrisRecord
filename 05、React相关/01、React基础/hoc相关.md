## HOC高阶组件相关

高阶组件（HOC，Higher-Order Components）不是组件，而是一个**函数**，它会接收一个组件作为参数并返回一个经过改造的新组件。高阶组件React中复用组件逻辑的一种高级技巧。

高阶组件主要应用于以下几个方面

- 抽取重复代码，实现组件复用，常见场景：页面复用。
- 条件渲染，控制组件的渲染逻辑（渲染劫持），常见场景：权限控制。
- 捕获/劫持被处理组件的生命周期，常见场景：组件渲染性能追踪、日志打点。

------

高阶组件有两种实现方式

- 正向属性代理
- 反向组件继承

反向组件继承相比于正向属性代理功能更强大，可以直接操作组件的state、生命周期以及render方法，从而实现生命周期劫持和渲染劫持；

但目前工作中没有使用到反向组件继承这种方式，所以也就不记录了，下面这两篇文章写的很详细，后续若有使用的场景再参考；

[React高阶组件(HOC)的入门📖及实践💻](https://juejin.cn/post/6844904050236850184#heading-17)

[「react进阶」一文吃透React高阶组件(HOC)](https://juejin.cn/post/6940422320427106335#heading-7)

这里记录的也是这两篇文章中和我目前工作相关的部分

------

下面是高阶组件的一些具体应用

##### 强化Props

```js
import React, { Component, useState } from "react";
/**
 * 高阶组件基础使用之强化props
 */

//  原组件
function WrapComponent(props) {
  const { classHocProps, functionHocProps } = props;
  return (
    <div>
      {classHocProps && (
        <p>this is classHocProps: {JSON.stringify(classHocProps)}</p>
      )}
      {functionHocProps && (
        <p>this is functionHocProps: {JSON.stringify(functionHocProps)}</p>
      )}
    </div>
  );
}

// class高阶组件
const classHoc = (WrapComponent) => {
  return class Index extends Component {
    state = {
      classHocProps: {
        name: "classHoc"
      }
    };
    render() {
      return <WrapComponent {...this.props} {...this.state} />;
    }
  };
};

// function 高阶组件
const functionHoc = (WrapComponent) => {
  return function Index(props) {
    const [state] = useState({
      functionHocProps: {
        name: "functionHoc"
      }
    });
    return <WrapComponent {...props} {...state} />;
  };
};

const ClassHocCoponent = classHoc(WrapComponent);
const FuntionHocComponet = functionHoc(WrapComponent);

class StrengthenProps extends Component {
  render() {
    return (
      <div>
        <ClassHocCoponent />
        <FuntionHocComponet />
      </div>
    );
  }
}

export default StrengthenProps;

```



##### 控制渲染

**实现一个懒加载功能的HOC，可以实现组件的分片渲染,用于分片渲染页面，不至于一次渲染大量组件造成白屏效果**

大致流程，初始化的时候，`HOC`中将渲染真正组件的渲染函数，放入`renderQueue`队列中，然后初始化渲染一次，接下来，每一个项目组件，完成 `didMounted` 状态后，会从队列中取出下一个渲染函数，渲染下一个组件, 一直到所有的渲染任务全部执行完毕，渲染队列清空，有效的进行分片的渲染，这种方式对海量数据展示，很奏效。

用`HOC`实现了条件渲染-分片渲染的功能，实际条件渲染理解起来很容易，就是通过变量，控制是否挂载组件，从而满足项目本身需求

```js
import React, { useState, useEffect } from "react";

const renderQueue = [];
let isFirstrender = false;

const tryRender = () => {
  const render = renderQueue.shift();
  if (!render) return;
  setTimeout(() => {
    render(); /* 执行下一段渲染 */
  }, 300);
};
/* HOC */
function renderHOC(WrapComponent) {
  return function Index(props) {
    const [isRender, setRender] = useState(false);
    useEffect(() => {
      renderQueue.push(() => {
        /* 放入待渲染队列中 */
        setRender(true);
      });
      if (!isFirstrender) {
        tryRender(); /**/
        isFirstrender = true;
      }
    }, []);
    return isRender ? (
      <WrapComponent tryRender={tryRender} {...props} />
    ) : (
      <div className="box">
        <div className="icon">加载中</div>
      </div>
    );
  };
}
/* 业务组件 */
class Index extends React.Component {
  componentDidMount() {
    const { name, tryRender } = this.props;
    /* 上一部分渲染完毕，进行下一部分渲染 */
    tryRender();
    console.log(name + "渲染");
  }
  render() {
    return (
      <div>
        <img src="https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=294206908,2427609994&amp;fm=26&amp;gp=0.jpg" />
      </div>
    );
  }
}
/* 高阶组件包裹 */
const Item = renderHOC(Index);

export default () => {
  return (
    <React.Fragment>
      <Item name="组件一" />
      <Item name="组件二" />
      <Item name="组件三" />
    </React.Fragment>
  );
};

```


