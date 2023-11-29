## React中异步加载组件

### 前言

异步加载组件是指在应用程序运行时，==不在初始加载时立即获取和加载组件，而是在需要时才获取和渲染组件内容==

这样做的主要目的是优化应用程序的==性能==和==加载速度==，以下是异步组件的优点：

1. **加快初始加载速度**：
   - 大型应用可能包含大量组件和模块，一次性加载所有内容可能会导致初始加载时间过长，影响用户体验
   - 异步加载允许应用在初始加载时只获取必要的内容，其他组件在需要时再进行加载，提高了初始加载速度
2. **按需加载**：
   - 当用户首次访问应用时，他们可能不需要或不会立即与所有部分进行交互，只加载当前视图所需的组件可以减少初始加载时间，并在用户浏览时动态加载其他组件
3. **降低资源消耗**：
   - 异步加载可以根据用户行为或特定路由的需求来获取组件，减少了不必要的资源消耗
   - 对于大型应用，一次性加载所有内容可能会占用大量内存，异步加载可以在需要时释放不必要的资源

### 一、require.ensure方式

#### 1.1、语法

`require.ensure` 是**Webpack**的旧语法，用于实现异步加载模块

它的工作方式是将指定的模块打包到一个单独的异步模块（也称为**chunk**）中，然后在需要的时候才加载这个异步模块

下面是 `require.ensure` 的语法：

```js
require.ensure(
  dependencies: Array<string>, // 依赖的模块数组
  callback: function(require: function), // 异步加载完成后的回调函数
  chunkName: string // 异步块的名称
);
```

使用示例：

```js
require.ensure([], require => require('./auth/LoginPage'), 'login')
```

这里的含义是：

- `[]`：没有依赖的模块需要加载
- `require => require('./auth/LoginPage')`：回调函数加载位于 `'./auth/LoginPage'` 路径的模块
- `'login'`：异步块的名称为 `'login'`

> require.ensure的原理
>
> ```js
> function() {
>   //获取 文档head对象
>   var head = document.getElementsByTagName('head')[0];
>   //构建 <script>
>   var script = document.createElement('script');
>   //设置src属性
>   script.async = true;
>   script.src = "http://map.baidu.com/.js"
>   //加入到head对象中
>   head.appendChild(script);
> }
> ```
>
> 和JSONP的原理一样，利用HTML的script标签进行chunk js文件的请求
>
> <!--这里只是请求部分的原理，js文件的加载是webpack帮我们完成的-->

#### 1.2、实现异步加载组件

**asyncComponent组件**

```js
import React, { Component } from 'react';

export default function AsyncComponent (importComponent) {
  let C = null
  const loadComponent = (resolve, reject) => importComponent()
        .then(res => {
            C = res.default
            resolve()
        }).catch(loadFailCatch).catch(reject)

  return class AsyncComponent extends Component {
      unmounted: boolean
      constructor (props) {
          super(props)
          this.state = { component: null, err: null }
      }
  
      componentDidMount () {
          if (!C) {
              loadComponent(() => {
                  !this.unmounted && this.forceUpdate() // 获取异步组件，并进行更新替换
              }, e => {
                  logger.error(`async component error: ${e}`)
                  !this.unmounted && this.setState({ err: e && e.message || '加载失败, 请刷新重试' })
              })
          }
      }

      componentWillUnmount () {
          this.unmounted = true
      }

      render () {
          const { err } = this.state
          if (!C && err) {
              return <RetryPage message={err} />
          }
          return C ? <C {...this.props} /> : <LoaderInline />
      }
  }
}
```

在路由中使用

**router.js**

```js
// 异步组件
import AsyncComponent from './asyncComponent.js';
// 组件页面
const Home = AsyncComponent(() => require.ensure([], require => require('./auth/LoginPage'), 'login'))
//...
<Route path="/" exact component={Home} />
```

### 二、import方式

#### 2.1、语法

`require.ensure` 可以被 ES6 的 `import`语法取代

例如：

上面的`require.ensure` 示例

```js
require.ensure([], require => require('./auth/LoginPage'), 'login')
```

可以用`import`写成

```javascript
const login = () => import (/* webpackChunkName: "login" */'./auth/LoginPage');
```

其中，`/* webpackChunkName: "login" */`是 **webpack** 的魔法注释（**magic comment**），用于指定 **webpack** 打包时生成的文件名将这些模块打包成名为 **“login.js”** 

#### 2.2、实现异步加载组件

**asyncComponent.js**

```javascript
import React, { Component } from 'react';
const asyncComponent = (importComponent) => {
  return class extends Component {
    constructor() {
      super();
      this.state = {
        component: null
      }
    }
    componentDidMount() {
      importComponent()
        .then(cmp => {
          this.setState({ component: cmp.default }); //.default 是模块有default输出接口
        });
    }
    //或者使用async/await 写成
    /* async componentDidMount() {
      const { default: component } = await importComponent(); //解构
      this.setState({
        component: component
      });
    } */
    render() {
      const C = this.state.component;
      return C ? <C {...this.props} /> : null;
    }
  }
};
export default asyncComponent; 
```

**router.js**

```javascript
// 异步组件
import AsyncComponent from './asyncComponent.js';
// 组件页面
const Home = AsyncComponent(() => import(/* webpackChunkName: "Home" */ './Home/index.jsx'));
...
<Route path="/" exact component={Home} />
```

### 三、React.Lazy方式

在 **React** 中，目前最流行的异步加载组件的方式是使用 **React.lazy** 和 **Suspense API**

**React.lazy** 允许我们定义一个动态加载的组件，该组件会在组件第一次渲染时进行加载，我们可以通过 `import`语法动态引入组件，**React.lazy** 会自动把这个返回 **Promise** 的函数包装成一个组件

**Suspense** 组件用于包裹需要异步加载的组件，并在 **fallback** 属性中指定一个加载中的组件。在组件加载过程中，**fallback** 属性接受任何你想展示的 **React** 元素

以下是一个简单的示例代码：

```javascript
const OtherComponent = React.lazy(() => import('./OtherComponent'));

function MyComponent() {
  return (
    <div>
      <React.Suspense fallback={<div>Loading...</div>}>
        <OtherComponent />
      </React.Suspense>
    </div>
  );
}
```

在这个例子中，**OtherComponent** 是一个通过 **React.lazy** 动态加载的组件。**React.Suspense** 组件用于包裹 **OtherComponent**，并在 **OtherComponent** 加载过程中显示 **"Loading…"**

