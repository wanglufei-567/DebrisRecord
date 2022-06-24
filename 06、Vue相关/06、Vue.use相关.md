## Vue.use笔记

### 前言

插件通常用来为 Vue 添加全局功能。插件的功能范围没有严格的限制——一般有下面几种：

1. 添加全局方法或者 property。如：[vue-custom-element](https://github.com/karol-f/vue-custom-element)
2. 添加全局资源：指令/过滤器/过渡等。如 [vue-touch](https://github.com/vuejs/vue-touch)
3. 通过全局混入来添加一些组件选项。如 [vue-router](https://github.com/vuejs/vue-router)
4. 添加 Vue 实例方法，通过把它们添加到 `Vue.prototype` 上实现。
5. 一个库，提供自己的 API，同时提供上面提到的一个或多个功能。如 [vue-router](https://github.com/vuejs/vue-router)

### 一、Vue.use的使用

##### 1.1、`Vue.use`语法

**[Vue.use( plugin )](https://cn.vuejs.org/v2/api/#Vue-use)**

- **参数**：

  - `{Object | Function} plugin`

- **用法**：

  安装 `Vue.js` 插件。如果插件是一个对象，必须提供 `install` 方法。如果插件是一个函数，它会被作为 `install` 方法。`install` 方法调用时，会将 `Vue` 作为参数传入。

  该方法需要在调用 `new Vue()` 之前被调用

  当 `install` 方法被同一个插件多次调用，插件将只会被安装一次

```js
// plugins.js
const Plugin1 = {
  install(Vue,a){
    console.log('Plugin1 第一个参数：',Vue)
    console.log('Plugin1 第二个参数：',a)
  }
}

function Plugin2(Vue,b){
  console.log('Plugin2 第一个参数：',Vue)
  console.log('Plugin2 第二个参数：',b)
}

export{Plugin1,Plugin2}
```

```js
// main.js
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import './assets/plugins/use'
import {Plugin1,Plugin2} from './plugins'


Vue.use(Plugin1,'参数a')
Vue.use(Plugin2,'参数b')

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
```

#### 1.2、`Vue.use`基本使用

```js
Vue.use({
  install: function (Vue, options) {
  // 1. 添加全局方法或属性
  Vue.myGlobalMethod = function () {
    // 逻辑...
  }
  // 2. 添加全局资源
  Vue.directive('my-directive', {
    bind (el, binding, vnode, oldVnode) {
      // 逻辑...
    }
    ...
  })
  // 3. 注入组件选项
  Vue.mixin({
    created: function () {
      // 逻辑...
    }
    ...
  })
  // 4. 添加实例方法
  Vue.prototype.$myMethod = function (methodOptions) {
    // 逻辑...
  }
  // 5. 注册全局组件
  Vue.component('myButton',{
    // ...组件选项
  })
}
},args)
```

### 二、Vue.use源码

```typescript
import { toArray } from '../util/index'

export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    const args = toArray(arguments, 1)
    args.unshift(this)
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)
    return this
  }
}
```

```typescript
export function toArray (list: any, start?: number): Array<any> {
  start = start || 0
  let i = list.length - start
  const ret: Array<any> = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}
```

核心的地方`args.unshift(this)` ,这里的 `this` 指向 `Vue` 构造函数；install的第一个参数`Vue`就是在这里注入进去的

### 三、总结

`Vue`中有很多种全局功能的使用方式：

```js
//给Vue添加全局功能（相当于为某个功能做准备），一般有以下几种用法

//1.  添加全局方法 或者 属性。（不能与Vue原本全局方法和属性重名）
Vue.myGlobalMethod = function () { // 逻辑... }
Vue.age = 18;
    
//2.  添加全局资源：指令/过滤器/过渡等。
Vue.directive('my-directive', { 
    bind (el, binding, vnode, oldVnode) { // 逻辑... }
});
    
//3.  通过全局混入来添加一些组件选项。
Vue.mixin({ created: function () { // 逻辑... } })
    
//4.  添加 Vue 实例方法，通过把它们添加到 `Vue.prototype` 上实现。
Vue.prototype.$myMethod = function (methodOptions) { 
    // 逻辑... 
}
    
//5.  一个库，提供自己的 API，同时提供上面提到的一个或多个功能
```

所谓的插件就是将一些全局功能的逻辑进行组合，封装成一个整体功能，最后通过`Vue.use(plugin)`添加插件，将这些全局功能挂到`Vue`上；

添加全局功能本质上就是往`Vue`上添加`options`，后续组件渲染时的`mergeoptions`逻辑中会将`Vue`上的`options`和组件自己的`options`进行合并，这样变实现了组件中使用全局功能的目的，和全局组件一样的意思


