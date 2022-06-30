## Vue3源码剖析（十一）— keep-alive组件的实现

### 一、keep-alive

**什么是keep-alive组件？**

`keep-alive`组件是一个元组件，`keep-alive`组件本身不会渲染任何DOM元素，它只是一个容器组件，我们可以切换不同的组件在`keep-alive`组件上进行绑定；当切换不同的组件时，`keep-alive`组件会缓存这些组件的状态，也就是说一个组件切换走之后并没有销毁，而是缓存起来了，当这个组件被切换回来之后直接进行复用；这么做的好处有两点：1、保存了组件的状态；2、避免了反复渲染导致的性能问题

简而言之，`keep-alive`组件其内部的组件是**==动态可切换的==**且==**状态会保留**==

下面👇看具体使用方法

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
   <script src="../../../node_modules/@vue/runtime-dom/dist/runtime-dom.global.js"></script>
    <script>
        const { KeepAlive,render, h } = VueRuntimeDOM;
       const Component1 = {
            n:1,
            render:()=>{
                console.log('render1')
                return h(ComponentA)
            }
        }
        const Component2 = {
            n:2,
            render:()=>{
                console.log('render2')
                return h(ComponentB)
            }
        }
        const Component3 = {
            n:3,
            render:()=>{
                console.log('render3')
                return h(ComponentC)
            }
        }
        render(h(KeepAlive,{max:3, order:1},{
            default:()=>h(ComponentA)
        }),app);

        setTimeout(()=>{
            render(h(KeepAlive,{max:3, order:2},{
                default:()=>h(ComponentB)
            }),app);
        },1000)

        setTimeout(()=>{
            console.log('render3')
            render(h(KeepAlive,{max:3, order:3},{
                default:()=>h(ComponentA)
            }),app);
        },2000)
     </script>
</body>
</html>
```

初次渲染`ComponentA` 执行了`render`

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220629093051907.png" alt="image-20220629093051907" style="zoom:45%;" />

初次渲染`ComponentB` 执行了`render`

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220629093304369.png" alt="image-20220629093304369" style="zoom:50%;" />

再次渲染`ComponentA` 直接复用，没有执行render

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220629093357187.png" alt="image-20220629093357187" style="zoom:50%;" />

### 二、keep-alive组件的具体实现

在组件实例上增加`ctx`属性，用于记录组件上下文

```js
// packages/runtime-core/src/component.ts
export function createComponentInstance(vnode, parent) {
  let instance = {
    ctx: {} as any, // 当前组件实例的上下文，用于存储信息的
    // ...
  };
  return instance;
}
```

`keepAlive`基本结构

```typescript
// packages/runtime-core/src/keepAlive.ts

export const KeepAlive = {
  __isKeepAlive: true, // 自定义用来标识keep-alive组件
  props: {
    max: {}
  },
  setup(props, { slots }) {
    const instance = getCurrentInstance();
    const sharedContext = instance.ctx;
    
   /**
     * 用来缓存那些已经挂载过的但当前不显示的组件（缓存的是真实节点）
     * 避免重复渲染，后续切换的时候直接从缓存中取真实节点挂载即可
     */
    let storageContainer = createElement('div');

    const keys = new Set(); // 缓存组件的key
    const cache = new Map(); // 缓存key和组件的映射关系
    
    /**
     * pendingCacheKey存储当前keepAlive组件的插槽组件的key
     */
    let pendingCacheKey = null;
   
    return () => {
     /**
       * KeepAlive组件要render的其实是default插槽组件
       * 若是插槽不是组件的就不会走缓存，直接返回插槽的VNode
       */
      let vnode = slots.default();
      if (!(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
        return vnode;
      }

       /**
       * 给当前插槽组件标记COMPONENT_SHOULD_KEEP_ALIVE
       * 后续插槽切换时，在unmount逻辑中，不会真的卸载当前插槽组件
       * 而是走instance.ctx.deactivate 插槽组件的失活逻辑
       * 将当前插槽组件对应的真实节点移动到缓存容器中
       */
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
      return vnode;
    };
  }
};

```

从`keepAlive`的基本结构可以发现，`keepAlive`本身就是一个组件，`render`方法返回的是插槽生成的`VNode`，`VNode`上增加`ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE`的标识用于后续卸载插槽组件时缓存操作，此外`keepAlive`组件上还有后面用于缓存插槽组件的配置

```typescript
  /**
   * 用来缓存那些已经挂载过的但当前不显示的组件（缓存的是真实节点）
   * 避免重复渲染，后续切换的时候直接从缓存中取真实节点挂载即可
   */
  let storageContainer = createElement('div');

  const keys = new Set(); // 缓存组件的key
  const cache = new Map(); // 缓存key和组件的映射关系

  /**
   * pendingCacheKey存储当前keepAlive组件的插槽组件的key
   */
  let pendingCacheKey = null;
  const cacheSubTree = () => {
    cache.set(pendingCacheKey, instance.subTree);
  };
```

keepAlive组件挂载时缓存插槽组件的`key`

```typescript
// packages/runtime-core/src/keepAlive.ts

export const KeepAlive = {
  __isKeepAlive: true, // 自定义用来标识keep-alive组件
  props: {
    max: {}
  },
  setup(props, { slots }) {
    // ... 
    
    const keys = new Set(); // 缓存组件的key
    const cache = new Map(); // 缓存key和组件的映射关系
    
    /**
     * pendingCacheKey存储当前keepAlive组件的插槽组件的key
     * 这个key是插槽组件本身或者是组件属性上的key
     * 当keepAlive组件挂载完成之后或者更新之后
     * （注意：是在挂载和更新之后，这就是为什么要用pendingCacheKey变量存储可以的原因）
     * 将插槽组件的key和插槽组件(slots.default()的返回值，是个Vnode缓存起来
     * 后续keepAlive组件要切换之前已经挂载过的插槽组件时
     * 就直接从缓存中取出这个插槽组件，进行DOM移动操作
     */
    let pendingCacheKey = null;

    /**
     * 缓存插槽组件Vnode的方法
     * 注意：instance是当前keepAlive组件
     * instance.subTree是keepAlive组件render方法生成的VNode
     * 也就是slots.default()的VNode，插槽组件的VNode
     */
    const cacheSubTree = () => {
      cache.set(pendingCacheKey, instance.subTree);
    };

    /**
     * keepAlive组件挂载完成时
     * 执行缓存插槽的逻辑
     */
    onMounted(cacheSubTree);
   
    return () => {
      let vnode = slots.default();
      if (!(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
        return vnode;
      }
      
     /**
       * 处理pendingCacheKey
       * 保存当前插槽组件的key
       * 组件属性上有key就直接使用，没有就用组件本身
       */
      let comp = vnode.type;
      let key = vnode.key == null ? comp : vnode.key;
      pendingCacheKey = key;
      
      /**
       * 缓存插槽组件的key
       */
      keys.add(key);

      return vnode;
    };
  }
};
```

上面👆这段实现就是，在`keepAlive`组件的生命周期钩子`onMounted`中完成对插槽组件的缓存，也就是说`keepAlive`组件完成挂载之后，`keys`和`cache`上便会缓存下来当前的插槽组件

另外，组件挂载时给`keepAlive`组件的实例上添加上下文属性`ctx.render`

```typescript
// packages/runtime-core/src/renderer.ts

export function createRenderer(options) {
  // 传入进来的renderOptions，内部属性都是DOM Api
  let {
    patchProp: hostPatchProp, // 对节点属性的操作
    createElement: hostCreateElement, // 创建元素
    createTextNode: hostCreateTextNode, // 创建文本
    querySelector: hostQuerySelector,
    insert: hostInsert,
    remove: hostRemove,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling
  } = options;
  
  // ...
  
  /**
   * 组件类型的VNode的挂载
   * @param vnode 虚拟节点
   * @param container 父容器
   * @param anchor 锚点 用于真实节点的insert操作
   * 组件的更新流程 插槽的更新 属性更新
   */
  function mountComponent(vnode, container, anchor, parentComponent) {
    //...

    /**
     * 若是KeepAlive组件则
     * 给组件实例上的上下文属性
     * 挂上DOM操作方法
     */
    if (isKeepAlive(vnode)) {
      instance.ctx.renderer = internals;
    }

    // ...
  }


  /**
   * VNode对应的真实节点的移动方法
   * @param vnode 虚拟节点
   * @param container 父容器（真实节点）
   * @param anchor 锚点
   */
  const move = (vnode, container, anchor) => {
    const { el, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.COMPONENT) {
      move(vnode.component!.subTree, container, anchor);
      return;
    }
    hostInsert(el, container, anchor);
  };

  /**
   * 一些DOM和组件的挂载、卸载、移动等方法
   * 目前是在KeepAlive组件有用到
   */
  const internals = {
    um: unmount,
    m: move,
    o: options
  };
  
  // ...
}
```

`ctx.render`上主要是一些DOM和组件的挂载、卸载、移动等方法，这些方法后面会在`keepAlive`组件中用到

在`keepAlive`组件中给组件实例的上下文属性`ctx`配置上keepAlive组件的激活方法`active`和失活方法`deactivate`

```typescript

export const KeepAlive = {
  __isKeepAlive: true, // 自定义用来标识keep-alive组件
  props: {
    max: {}
  },
  setup(props, { slots }) {
    
    // ...
   
    /**
     * keepAlive组件的插槽组件的激活方法
     * @param n2 新的插槽组件的VNode（要被挂载的，已经缓存过了的）
     * @param container 父容器（真实的DOM节点）
     * @param anchor 锚点
     */
    instance.ctx.active = (n2, container, anchor) => {
      move(n2, container, anchor);
    };

    /**
     * keepAlive组件的插槽失活方法
     * 组件卸载的时候 会将虚拟节点对应的真实节点，移动到容器中
     * @param n1 旧的插槽组件的VNode（要被移除的）
     * @param storageContainer 缓存容器（真实的DOM节点，KeepAlive创建的div）
     */
    instance.ctx.deactivate = n1 => {
      move(n1, storageContainer);
    };
    
    return () => {
    // ...
  }
};
```

在组件卸载方法里添加`keepAlive`组件的插槽卸载的特殊逻辑

```typescript
// packages/runtime-core/src/renderer.ts

export function createRenderer(options) {
  // ...
  
  const patch = (
    n1,
    n2,
    container,
    anchor = null,
    parentComponent = null
  ) => {
    // 若n1有值且n2、n1不相等，则说明是要将n1替换成n2
    if (n1 && !isSameVNode(n1, n2)) {
      // 卸载n1并重制为null，后续走n2的初始化
      unmount(n1, parentComponent);
      n1 = null;
    }
      
  };
  
  /**
   * VNode的卸载
   */
  const unmount = (n1, parentComponent) => {
    let { shapeFlag, component } = n1;

    /**
     * 判断要卸载的是否是keepAlive 要缓存的组件
     * 若是则走keepAlive的失活逻辑（将组件对应的真实节点缓存起来）
     * 并不真的卸载
     */
    if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
      parentComponent.ctx.deactivate(n1);
    }
    
    // ...

    hostRemove(n1.el);
  };
}
```

这一段逻辑需要仔细思考一下

首先`ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE`这个标识是在keepAlive组件实例上的subtree上的（也就是插槽组件的VNode）

```js
// packages/runtime-core/src/keepAlive.ts

rerurn () => {
  let vnode = slots.default();
  vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
  return vnode;
}
```

再者，走到这段特殊逻辑的上游是在`keepAlive`组件本身的更新逻辑中，在`patch`自己的`subtree`(其实就是插槽组件的`VNode`)时触发的

**注意**：这里给`patch`方法的第五个入参`parentComponent`传的实参是`instance`，是`subtree`的父组件，也就是`keepAlive`组件实例，

```js
// packages/runtime-core/src/renderer.ts

  // 生成新的VNode
  const subTree = render.call(instance.proxy);
  /**
   * 更新逻辑
   * 将新的VNode和旧的VNode传给patch方法进行更新
   */
  patch(instance.subTree, subTree, container, anchor, instance);
```

由于插槽组件不同，才会走到`unmount`逻辑中，

这个时候，由于`subtree`上有`ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE`标识，所以会走`parentComponent.ctx.deactivate(n1)`这段逻辑，其实就是keepAlive组件中的这段逻辑

```js
// packages/runtime-core/src/keepAlive.ts

/**
 * 用来缓存那些已经挂载过的但当前不显示的组件（缓存的是真实节点）
 * 避免重复渲染，后续切换的时候直接从缓存中取真实节点挂载即可
 */
let storageContainer = createElement('div');

/**
 * keepAlive组件的插槽失活方法
 * 组件卸载的时候 会将虚拟节点对应的真实节点，移动到容器中
 * @param n1 旧的插槽组件的VNode（要被移除的）
 * @param storageContainer 缓存容器（真实的DOM节点，KeepAlive创建的div）
 */
  instance.ctx.deactivate = n1 => {
    move(n1, storageContainer);
  };
```

```typescript
// packages/runtime-core/src/renderer.ts

/**
   * VNode对应的真实节点的移动方法
   * @param vnode 虚拟节点
   * @param container 父容器（真实节点）
   * @param anchor 锚点
   */
  const move = (vnode, container, anchor) => {
    const { el, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.COMPONENT) {
      move(vnode.component!.subTree, container, anchor);
      return;
    }
    hostInsert(el, container, anchor);
  };
```

所以插槽组件的缓存，就是发生在这里，将插槽组件的上的`el`(真实节点)移动到缓存容器中

整个流程是这样的：`keepAlive`组件更新插槽 :arrow_right: `patch subtree(`插槽组件的`VNode`) :arrow_right: `unmount subtree` :arrow_right: 判断标识`ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE` :arrow_right: 移动插槽组件的真实节点到缓存容器中

上面👆是`keepAlive`组件缓存插槽组件的逻辑实现，下面👇进行`keepAlive`组件从缓存容器中取值的实现

```js
  return () => {
    /**
     * KeepAlive组件要render的其实是default插槽组件
     * 若是插槽不是组件的就不会走缓存，直接返回插槽的VNode
     */
    let vnode = slots.default();
    if (!(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
      return vnode;
    }

    /**
     * 处理pendingCacheKey
     * 保存当前插槽组件的key
     * 组件属性上有key就直接使用，没有就用组件本身
     */
    let comp = vnode.type;
    let key = vnode.key == null ? comp : vnode.key;
    pendingCacheKey = key;

    let cacheVnode = cache.get(key);
    if (cacheVnode) {
      /**
       * 若是缓存中有当前的插槽组件
       * 则直接复用组件实例
       * 同时标记当前插槽组件是COMPONENT_KEPT_ALIVE
       * 后续挂载时（processComponent）就不会走组件的初始化挂载逻辑
       * 直接走instance.ctx.active 插槽组件的激活逻辑
       * 从缓存容器中直接移动当前插槽组件对应的真实节点到container上
       */
      vnode.component = cacheVnode.component;
      vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE;
    } else {
      keys.add(key);
    }
    vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
    return vnode;
  };
```

`keepAlive`组件更新插槽时，若是缓存中已经与这个插槽了，则直接复用插槽组件的组件实例，并且给`VNode`添加`ShapeFlags.COMPONENT_KEPT_ALIVE`标识（当前插槽组件是被缓存起来的）

```js
let cacheVnode = cache.get(key);
if (cacheVnode) {
  vnode.component = cacheVnode.component;
  vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE;
}
```

另外，在组件挂载的方法中添加`keepAlive`组件更新插槽组件的特殊逻辑

```js
  /**
   * 组件类型的VNode的挂载和更新处理
   */
  function processComponent(
    n1,
    n2,
    container,
    anchor,
    parentComponent
  ) {
    if (n1 == null) {
      if (n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        /**
         * 判断是否是keepAlive 要激活的组件
         * 若是，则走keepAlive组件的激活逻辑（从缓存中取出真实节点直接挂载）
         * 不走初始化挂载逻辑，
         */
        parentComponent.ctx.active(n2, container, anchor);
      } else {
        // 初始化挂载组件
        mountComponent(n2, container, anchor, parentComponent);
      }
    } else {
      // 组件的更新流程 插槽的更新 属性更新
      updateComponent(n1, n2);
    }
  }
```

若是判断当前插槽组件上有`ShapeFlags.COMPONENT_KEPT_ALIVE`标识，则走`parentComponent.ctx.active(n2, container, anchor)`逻辑，将缓存的插槽组件的真实节点从缓存容器中取出来挂载，不走组件的初始化挂载逻辑

`parentComponent.ctx.active(n2, container, anchor)`就是这里

```js
// packages/runtime-core/src/keepAlive.ts

/**
   * keepAlive组件的插槽组件的激活方法
   * @param n2 新的插槽组件的VNode（要被挂载的，已经缓存过了的）
   * @param container 父容器（真实的DOM节点）
   * @param anchor 锚点
   */
  instance.ctx.active = (n2, container, anchor) => {
    move(n2, container, anchor);
  };
```

```typescript
// packages/runtime-core/src/renderer.ts

/**
   * VNode对应的真实节点的移动方法
   * @param vnode 虚拟节点
   * @param container 父容器（真实节点）
   * @param anchor 锚点
   */
  const move = (vnode, container, anchor) => {
    const { el, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.COMPONENT) {
      move(vnode.component!.subTree, container, anchor);
      return;
    }
    hostInsert(el, container, anchor);
  };
```

所以整个流程是这样的：`keepAlive`组件更新插槽 :arrow_right: 插槽有缓存则直接复用插槽组件实例，并且增加`ShapeFlags.COMPONENT_KEPT_ALIVE`标识 `patch subtree(`插槽组件的`VNode`) :arrow_right: 组件的`patch`方法`processComponent` :arrow_right: 判断标识`ShapeFlags.COMPONENT_KEPT_ALIVE`  :arrow_right: 移动插槽组件的真实节点到父容器中



好了，以上就是`keepAlive`组件的实现过程

### 三、keep-alive组件的完整代码

```typescript
// packages/runtime-core/src/keepAlive.ts

import { onMounted, onUpdated } from './apiLifeCycle';
import { getCurrentInstance } from './component';
import { ShapeFlags } from './createVNode';

/**
 * 判断是否是KeepAlive组件的方法
 */
export const isKeepAlive = (vnode): boolean =>
  vnode.type.__isKeepAlive;


/**
 * 组件keep-alive标记的重置方法
 */
function resetFlag(vnode) {
  if (vnode.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
    vnode.shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE;
  }
  if (vnode.shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
    vnode.shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
  }
}

export const KeepAlive = {
  __isKeepAlive: true, // 自定义用来标识keep-alive组件
  props: {
    max: {}
  },
  setup(props, { slots }) {
    /**
     * dom操作api都在instance.ctx.renderer上面
     * createElement创建元素
     * move 节点移动
     * unmount 节点卸载
     */
    const instance = getCurrentInstance();
    const sharedContext = instance.ctx;
    const {
      renderer: {
        m: move,
        um: unmount,
        o: { createElement }
      }
    } = sharedContext;

    /**
     * 用来缓存那些已经挂载过的但当前不显示的组件（缓存的是真实节点）
     * 避免重复渲染，后续切换的时候直接从缓存中取真实节点挂载即可
     */
    let storageContainer = createElement('div');

    const keys = new Set(); // 缓存组件的key
    const cache = new Map(); // 缓存key和组件的映射关系

    /**
     * pendingCacheKey存储当前keepAlive组件的插槽组件的key
     * 这个key是插槽组件本身或者是组件属性上的key
     * 当keepAlive组件挂载完成之后或者更新之后
     * （注意：是在挂载和更新之后，这就是为什么要用pendingCacheKey变量存储可以的原因）
     * 将插槽组件的key和插槽组件(slots.default()的返回值，是个Vnode缓存起来
     * 后续keepAlive组件要切换之前已经挂载过的插槽组件时
     * 就直接从缓存中取出这个插槽组件，进行DOM移动操作
     */
    let pendingCacheKey = null;

    /**
     * 缓存插槽组件Vnode的方法
     * 注意：instance是当前keepAlive组件
     * instance.subTree是keepAlive组件render方法生成的VNode
     * 也就是slots.default()的VNode，插槽组件的VNode
     */
    const cacheSubTree = () => {
      cache.set(pendingCacheKey, instance.subTree);
    };

    /**
     * keepAlive组件挂载完成时
     * 执行缓存插槽的逻辑
     */
    onMounted(cacheSubTree);

    /**
     * keepAlive组件更新完成时
     * 执行缓存插槽的逻辑
     */
    onUpdated(cacheSubTree);

    /**
     * keepAlive组件的插槽组件的激活方法
     * @param n2 新的插槽组件的VNode（要被挂载的，已经缓存过了的）
     * @param container 父容器（真实的DOM节点）
     * @param anchor 锚点
     */
    instance.ctx.active = (n2, container, anchor) => {
      move(n2, container, anchor);
    };

    /**
     * keepAlive组件的插槽失活方法
     * 组件卸载的时候 会将虚拟节点对应的真实节点，移动到容器中
     * @param n1 旧的插槽组件的VNode（要被移除的）
     * @param storageContainer 缓存容器（真实的DOM节点，KeepAlive创建的div）
     */
    instance.ctx.deactivate = n1 => {
      move(n1, storageContainer);
    };

    /**
     * 当缓存容器中数量大于用户配置的最大缓存数量后
     * 调用此方法清除缓存
     */
    const pruneCacheEntry = vnode => {
      const subTree = cache.get(vnode);
      resetFlag(subTree); // 移除keep-alive标记
      unmount(subTree);
      cache.delete(vnode);
      keys.delete(vnode);
    };

    return () => {
      /**
       * KeepAlive组件要render的其实是default插槽组件
       * 若是插槽不是组件的就不会走缓存，直接返回插槽的VNode
       */
      let vnode = slots.default();
      if (!(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
        return vnode;
      }

      /**
       * 处理pendingCacheKey
       * 保存当前插槽组件的key
       * 组件属性上有key就直接使用，没有就用组件本身
       */
      let comp = vnode.type;
      let key = vnode.key == null ? comp : vnode.key;
      pendingCacheKey = key;

      let cacheVnode = cache.get(key);
      if (cacheVnode) {
        /**
         * 若是缓存中有当前的插槽组件
         * 则直接复用组件实例
         * 同时标记当前插槽组件是COMPONENT_KEPT_ALIVE
         * 后续挂载时（processComponent）就不会走组件的初始化挂载逻辑
         * 直接走instance.ctx.active 插槽组件的激活逻辑
         * 从缓存容器中直接移动当前插槽组件对应的真实节点到container上
         */
        vnode.component = cacheVnode.component;
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE;
      } else {
        /**
         * 若是缓存中没有当前的插槽组件
         * 则存储插槽组件的key
         * 若缓存数量大于用户配置
         * 则走清除缓存逻辑
         */
        keys.add(key);
        let { max } = props;
        if (max && keys.size > max) {
          //清除第一个元素， next 返回的是一个对象 {value,done}
          pruneCacheEntry(keys.values().next().value);
        }
      }

      /**
       * 给当前插槽组件标记COMPONENT_SHOULD_KEEP_ALIVE
       * 后续插槽切换时，在unmount逻辑中，不会真的卸载当前插槽组件
       * 而是走instance.ctx.deactivate 插槽组件的失活逻辑
       * 将当前插槽组件对应的真实节点移动到缓存容器中
       */
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
      return vnode;
    };
  }
};

```

### 四、总结

`keepAlive`组件的精髓在于 `instance.ctx.active` 和 `instance.ctx.deactivate`，插槽组件卸载时，将其对应的真实节点放到缓存容器中，插槽组件挂载时，再从缓存容器中取出对应的真实节点挂到父容器中

