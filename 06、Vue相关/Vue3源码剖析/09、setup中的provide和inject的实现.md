## Vue3源码剖析（九）— setup中的provide和inject的实现

### 一、provide和inject的使用

通常，当我们需要从父组件向子组件传递数据时，我们使用 `props`。想象一下这样的结构：有一些深度嵌套的组件，而深层的子组件只需要父组件的部分内容。在这种情况下，如果仍然将 `prop` 沿着组件链逐级传递下去，可能会很麻烦。

对于这种情况，我们可以使用一对 `provide` 和 `inject`。无论组件层次结构有多深，父组件都可以作为其所有子组件的依赖提供者。这个特性有两个部分：父组件有一个 `provide` 选项来提供数据，子组件有一个 `inject` 选项来开始使用这些数据。

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/components_provide.png" alt="Provide/inject scheme" />

**基本使用**

父组件`provide`提供数据

```vue
<!-- src/components/MyMap.vue -->
<template>
  <MyMarker />
</template>

<script>
import { provide } from 'vue'
import MyMarker from './MyMarker.vue'

export default {
  components: {
    MyMarker
  },
  setup() {
    provide('location', 'North Pole')
    provide('geolocation', {
      longitude: 90,
      latitude: 135
    })
  }
}
</script>
```

子组件`inject`使用数据

```vue
<!-- src/components/MyMarker.vue -->
<script>
import { inject } from 'vue'

export default {
  setup() {
    const userLocation = inject('location', 'The Universe')
    const userGeolocation = inject('geolocation')

    return {
      userLocation,
      userGeolocation
    }
  }
}
</script>
```

实际上，你可以将依赖注入看作是“**长距离的 `prop**`”，除了：

- 父组件不需要知道哪些子组件使用了它 `provide` 的 `property`
- 子组件不需要知道 `inject` 的 `property` 来自哪里

### 二、`provide`和`inject`的具体实现

其实 `provide` 和 `inject`的原理很简单

首先关于`provide`，每个组件实例上都一个`provides`属性用于存储组件自己`provide`的`props`和父组件的provides，那为了避免组件自己的props和父组件的`props`出现同名冲突，会将父组件的`provides`属性作为组件自己`provides`的原型对象，这样就有了一个原型链，保证了在孙子组件中可以拿到曾父组件`provide`的`props`

<!--若组件没有父组件则其provides的原型是null，另外，若组件自己本身并没有使用provide，那么其组件实例上的provides就是父组件的provides，只有当组件自己使用provide后，才会将其组件实例上的provides属性变成一个以父组件porvides为原型的对象-->

其次关于`inject`，`inject`就是通过组件实例上的`parent`属性拿到父组件的`provides`（`parent.provides`），因为原型链的存在，组件通过`parent.provides`不仅可以拿到父组件的`provides`还可以拿到曾父组件的`provides`

下面👇是具体实现

**给组件实例添加`parent`和`provides`属性**

```typescript
// packages/runtime-core/src/renderer.ts

function setupRenderEffect(instance, container, anchor) {
  const componentUpdate = () => {
      //...

      patch(null, subTree, container, anchor, instance);

      //...
      }
    } else {
      //...

      patch(instance.subTree, subTree, container, anchor, instance);

      //...
}


function mountComponent(vnode, container, anchor, parentComponent) {
  const instance = (vnode.component =
    createComponentInstance(vnode, parentComponent));
  
 // ...
  
  setupRenderEffect(instance, container, anchor);
 }

function processComponent(n1, n2, container, anchor, parentComponent) {
    if (n1 == null) {
      mountComponent(n2, container, anchor, parentComponent);
    } 
  //...
  }

const patch = (
    n1,
    n2,
    container,
    anchor = null,
    parentComponent = null
  ) => {
  //...
    const { type, shapeFlag } = n2;
    switch (type) {
      //...
      default:
        //...
        else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, anchor, parentComponent);
        }
    }
  };
```

```typescript
export function createComponentInstance(vnode, parent) {
  let instance = {
    // ...
    parent, // 标记当前组件的父亲是谁
    provides: parent
      ? parent.provides
      : Object.create(null) // 组件的provides默认值是父组件的provides
  };
  return instance;
}
```

上面👆这段实现中关于子组件的`parent`是怎么和父组件关联起来是有点隐蔽的，这个关联逻辑发生在

```typescript
function setupRenderEffect(instance, container, anchor) {
  const componentUpdate = () => {
      //...

      patch(null, subTree, container, anchor, instance);

      //...
      }
    } else {
      //...

      patch(instance.subTree, subTree, container, anchor, instance);

      //...
}
```

父组件执行时将自己的组件实例传给子组件的`patch`，从而完成了子组件的`parent`是和父组件关联

> 注意：父组件的`setupRenderEffect`中的这段`patch`
>
> ```typescript
>  patch(null, subTree, container, anchor, instance);
> ```
>
> 是在`patch`父组件的`render`生成的`VNode`，子组件就是在这个`VNode`中

父组件自己没有父组件的话，其`parent`属性就是`null`，其`provides`属性就是一个以`null`为原型的空对象

**provide的实现**

```typescript
// packages/runtime-core/src/apiInject.ts
import { instance } from './component';

/**
 * provide方法
 * @param key 往组件实例上instance.provides挂的数据属性名
 * @param value 数据值
 * provide方法必须在组件的setup中使用
 */
export function provide(key, value) {

  /**
   * 如果没有实例则直接返回，
   * 说明这个方法没有在setup中使用
   */
  if (!instance) return;

  // 获取父组件的provides
  let parentProvides = instance.parent && instance.parent.provides;
  // 获取组件自己的provides
  let currentProvides = instance.provides;

  /**
   * 因为在初次挂载时，组件自身的provides是用父组件的provides作为默认值
   * 所以若组件自己的provides与父组件的provides相等时，则说明子组件没有自己的provides
   * 这样当组件内自己使用provide API时，便会出现覆盖父组件provides的风险
   * 因此需要创建一个属于自己的provides
   * 并且需要使用父组件的provides，作为自己provides对原型对象
   * 从而保证自己的子组件可以拿到自己父组件的provides
   * 这里使用到了原型链的原理
   * 父provides  儿子provides  孙子 provides
   * 曾孙 provides = {父provides,儿子provides，孙子provides } inject
   */
  if (currentProvides === parentProvides) {
    currentProvides = instance.provides =
      Object.create(parentProvides);
  }
  currentProvides[key] = value;
}
```

上面👆这段实现中的核心在于

```typescript
if (currentProvides === parentProvides) {
  currentProvides = instance.provides =
    Object.create(parentProvides);
}
```

这段逻辑的目的是，因为组件实例的`provides`属性默认值是`parent.provides`，那么若是组件要`provide` 自己的`props`时，便可能会覆盖掉父组件的`props`，因此需要隔离开来；此外通过利用原型链的原理，不管嵌套多少层，子组件都可以拿到最上层父组件`provide`的`props`，而且由于原型链的特性，子组件是从下至上逐层拿到原型链上的属性，所以即使存在同名属性，子组件也是取离自己最近的

**inject的实现**

```typescript
// packages/runtime-core/src/apiInject.ts
import { instance } from './component';

/**
 * inject方法
 * @param key 要使用的属性名
 * @param defaultValue 默认值
 */
export function inject(key, defaultValue) {
  // 如果没有实例则直接返回，说明这个方法没有在setup中使用
  if (!instance) return;

  /**
   * 父组件的provides
   * 当前组件首先从父组件的provides取数据
   * 父组件的provides中若没有，便会从父组件的父组件中取
   * 原型链的原理
   * 若父组件中的provides的数据是响应式的
   * 通过原型链取，不会丢失响应式
   * 所以可以在父组件中修改响应式数据，引起子组件的响应式变化
   */
  const provides = instance.parent?.provides;
  if (provides && key in provides) {
    return provides[key];
  } else {
    return defaultValue;
  }
}
```

`inject` 的实现就是去父组件上的`provides`上取数据

**最后，导出`provide`和`inject`**

```typescript
// packages/runtime-core/src/index.ts

// ...

export * from './apiInject';
```

### 三、实现效果

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
  <div id="app"></div>
  <!-- <script src="../../../node_modules/@vue/runtime-dom/dist/runtime-dom.global.js"></script> -->
  <script src="./runtime-dom.global.js"></script>
  <script>
    const { render, Text, h, Fragment, getCurrentInstance, reactive, provide, inject } = VueRuntimeDOM;

    /**
     * 原型链
     * 组件的渲染流程 父 instance.provides = {state:state} -》 子 instance.provides = instance.parent.provides  -》 孙子 instance.provides = instance.parent.provides
     * parent 构建组件的父子关系， 渲染的时候 我们是按照 父 -》 子  -》 孙子的方式来渲染
     */

    const ChildComponent = { // instance
      setup() {
        const state = inject('state', { name: '默认值', age: 13 });
        return () => {
          console.log('ChildComponent')
          return h(Text, state.name + state.age)
        }
      }
    }

    const VueComponent = {
      setup() {
        const state = reactive({ name: '张三', age: 13 });

        provide('state', state)

        setTimeout(() => {
          state.name = '李四'
        }, 6000)
        return () => {
          console.log('VueComponent')
          return h(ChildComponent)
        }
      }
    }

    render(h(VueComponent), app)

  </script>
</body>

</html>
```

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220622090658048.png" alt="image-20220622090658048" style="zoom:50%;" />

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220622090728651.png" alt="image-20220622090728651" style="zoom:50%;" />

**注意**

从上面👆的使用中可以发现，通过`provide`和`inject`子组件不仅可以从父组件中拿到响应数据使用，而且当父组件去修改这个响应式数据，子组件也会有响应式更新

这其中的原理是，组件的`provides`是个原型链，父组件在这个原型链上放一个响应式数据，当子组件从原型链上拿到这个响应式数据并在自己的`render`中使用到这个响应式数据时，便会发生响应式依赖收集，当这个响应式数据发生变化便会触发子组件的更新，这样应该就能理解为啥父组件修改数据可以触发子组件更新了

现在看官网上的这句话就有了更深入的理解了

> 实际上，你可以将依赖注入看作是“**长距离的 `prop**`”，除了：
>
> - 父组件不需要知道哪些子组件使用了它 `provide` 的 `property`
> - 子组件不需要知道 `inject` 的 `property` 来自哪里

<!--上面这段话可以这么去理解，子组件inject一个响应式数据，相当于在子组件自己内部使用了一个外部的state，对吧，有点像vuex了，全局数据其实也就是这么个套路，pinia中就是用了provide和inject-->

另外还有一个注意点，响应式数据是谁用，依赖收集就收集谁，看下图👇，父组件没有用这个响应式数据，就不会重新`render`

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220622091202329.png" alt="image-20220622091202329" style="zoom:50%;" />