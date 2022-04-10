### 同步下的this.setState({newstate})

```js
import React, { Component } from "react";

export default class BatchedUpdatesUsage extends Component {
  state = {
    num: 0
  };

  async componentDidMount() {
    /**
     * 同步代码batchUpdate
     */
    console.log("wd1", this.state.num);
    this.setState({ num: this.state.num + 1 });
    console.log("wd2", this.state.num);
    this.setState({ num: this.state.num + 1 });
    console.log("wd3", this.state.num);
  }

  render() {
    console.log("render");
    return (
      <div>
        <p>batchedUpdateds usage</p>
        <p>num: {this.state.num}</p>
      </div>
    );
  }
}

```

打印结果

```js
  /**
   * render
   * wd1 0
   * wd2 0
   * wd3 0
   * render
   */
```



### 同步下的this.setState(updater)

```js
import React, { Component } from "react";

export default class BatchedUpdatesUsage extends Component {
  state = {
    num: 0
  };

  async componentDidMount() {
    /**
     * 同步代码this.setState(updater) batchUpdate
     */
    console.log("wd1", this.state.num);
    this.setState({ num: this.state.num + 1 });

    this.setState((state) => {
      console.log("wd2", this.state.num);
      console.log("wd3", state.num);
      return {
        ...state,
        num: state.num + 1
      };
    });

    this.setState((state) => {
      console.log("wd4", this.state.num);
      console.log("wd5", state.num);
      return {
        ...state,
        num: state.num + 1
      };
    });
    console.log("wd6", this.state.num);
  }

  render() {
    console.log("render");
    return (
      <div>
        <p>batchedUpdateds usage</p>
        <p>num: {this.state.num}</p>
      </div>
    );
  }
}

```

打印结果

```js
    /**
     * render
     * wd1 0
     * wd6 0
     * wd2 0
     * wd3 0
     * wd4 0
     * wd5 0
     * render
     */
```

### 异步下下的this.setState({newstate})

```js
import React, { Component } from "react";

export default class BatchedUpdatesUsage extends Component {
  state = {
    num: 0
  };

  async componentDidMount() {
    /**
     * 异步代码un_batchUpdate
     */
    await Promise.resolve(100);
    console.log("wd4", this.state.num);
    this.setState({ num: this.state.num + 1 });
    console.log("wd5", this.state.num);
    this.setState({ num: this.state.num + 1 });
    console.log("wd6", this.state.num);
  }

  render() {
    console.log("render");
    return (
      <div>
        <p>batchedUpdateds usage</p>
        <p>num: {this.state.num}</p>
      </div>
    );
  }
}

```

打印结果

```js
    /**
     * render
     * wd4 0
     * render
     * wd5 1
     * render
     * wd6 2
     */
```

### 

### React合成事件和生命周期中的批量更新流程

![image-20211217130015211](https://dongger-typora.oss-cn-beijing.aliyuncs.com/typora/image-20220410135754524.png)

setState并非异步，本质还是同步的，只不过它的表现形式是异步的，



### React中的事务流程图

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a65dbe50540f4a33ac6ef8ce5221f96c~tplv-k3u1fbpfcp-watermark.awebp)

#### React批量更新策略事务(ReactDefaultBatchingStrategyTransaction)

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e7e4a3118f394c1b89c4f6fdb93ff4bf~tplv-k3u1fbpfcp-watermark.awebp)



### state更新

```js
// _processPendingState：将setState的partialState与原state合并
_processPendingState: function(props, context) {
    // 1，inst:组件实例
    var inst = this._instance;
    // 2，queue:_pendingStateQueue
    var queue = this._pendingStateQueue;
    // ...
    // 3，nextState：这里不管replace，nextState即组件实例state对象
    var nextState = Object.assign({}, replace ? queue[0] : inst.state);
    // 4，遍历_pendingStateQueue中所有partialState，使用 Object.assign 合并到原state内
    for (var i = replace ? 1 : 0; i < queue.length; i++) {
      var partial = queue[i];
      Object.assign( nextState,
        typeof partial === 'function'
          // 5，如果是函数，获取函数返回值作为partialState合并进原state
          ? partial.call(inst, nextState, props, context)
          // 6，如果是state（一般设置的state对象），则直接向原state合并
          : partial,
      );
    }
    // 
    return nextState;
},

```


