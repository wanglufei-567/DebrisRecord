## Vue3源码剖析（八）— 组件`setup`、`slot`、`lifecycle`的实现

### 一、组件`setup`的实现

#### 1.1、`setup`的使用

==组件的`render`函数每次更新时都会重新执行，但是`setup`函数只会在组件挂载时执行一次==

- `setup`函数是`compositionAPI`的入口
- 可以在函数内部编写逻辑，解决vue2中反复横跳问题
- `setup`返回的返回值有**==两种形式：==**
  - **函数**：==该函数就会覆盖掉组件原有的`render`函数，组件中原有`render`函数就不会执行了==
  - **对像：**==对象中的数据将暴露给模板使用==
- `setup`函数的参数为`props`、`context({slots,emit,attrs,expose})`

**具体使用效果**

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
  <script src="../../../node_modules/@vue/runtime-dom/dist/runtime-dom.global.prod.js"></script>
  <script>
    const { render, Text, h, Fragment, getCurrentInstance, reactive, toRefs } = VueRuntimeDOM;

    function useCount() {
      const state = reactive({ count: 0 });
      const handleClick = () => {
        state.count++
      }
      return {
        state,
        handleClick
      }
    }

    const MyComponent = {
      props: {
        count: {}
      },

      setup(props, { attrs, emit }) {
        return () => {
          return h(Fragment, [
            h('div', null, props.count),
            h('button', {
              onClick: () => {
                emit('childUpdate', 1, 2, 3);
              }
            }, '子组件增加')
          ])
        }
      }
    }

    const VueComponent = {
      setup() {
        const { state, handleClick } = useCount()
      /**
       * 若setup返回值是对象，则将该对象挂在组件实例上
       * 并对该对象进行代理，若是ref则自动.value取值
       */
        return {
          ...toRefs(state),
          handleClick
        }

      },
      render() {
        return h('div', [
          h('button', {
            onClick: () => this.handleClick()
          }, '父组件增加'),
          h(MyComponent, {
            count: this.count, onChildUpdate: (...args) => {
              this.handleClick()
            }
          })])
      }
    }


    render(h(VueComponent), app);
  </script>
</body>

</html>
```

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220621004635167.png" alt="image-20220621004635167" style="zoom:50%;" />

#### 1.2、`setup`主要结构实现

==在**组件初始化挂载方法`mountComponent`**中处理`setup`==

```typescript
// packages/runtime-core/src/renderer.ts
  function mountComponent(vnode, container, anchor) {
    
    //...

    /**
     * (2) 处理组件的属性和组件的插槽
     * 处理属性：
     *  初始化props：
     *    用户接收的props挂到instance.props上
     *    用户未接收的props挂到instance.attrs上
     *    将instance.props处理成响应式的
     *  设置代理对象instance.proxy供用户访问:
     *    对组件实例对象进行代理，data、props、$attrs...等的get和set
     *  处理setup:
     *    给setup的两个参数props和context进行赋值，并进行传参调用
     *    根据setup的执行结果改变组件的render或setupState
     */
    setupComponent(instance);

    // ... 
  }
```

**组件实例属性赋值方法`setupComponent`**

```typescript
// packages/runtime-core/src/component.ts
export function setupComponent(instance) {
  // type就是用户写的原始组件（是个对象）
  let { type, props, children } = instance.vnode;
  let { data, render, setup } = type;

 /**
   * 处理组件的setup属性
   * 执行setup，根据setup的执行结果改变组件的render或setupState
   */
  if (setup) {
    
    /**
     * 执行setup
     */
    const setupResult = setup(instance.props, context);

    if (isFunction(setupResult)) {
      // 若setup返回值是函数，则将该返回值置为组件的render
      instance.render = setupResult;
    } else if (isObject(setupResult)) {
      /**
       * 若setup返回值是对象，则将该对象挂在组件实例上
       * 并对该对象进行代理，若是ref则自动.value取值
       */
      instance.setupState = proxyRefs(setupResult);
    }
  }

  if (!instance.render) {
    // 若是setup中没有挂载render，则在这里挂载render
    if (render) {
      // 将用户写的render挂在组件实例上
      instance.render = render;
    } else {
      // 模板编译生成的render在这里挂到组件实例上
    }
  }
}
```

从用户书写的组件，也就是`instance.type`上获取`setup`

若有`setup`则处理`setup`

- ==若`setup`返回值是函数，**则将该返回值置为组件的`render`**==
- ==若`setup`返回值是对象，**则将该对象挂在组件实例上**，并对该对象进行代理，若是`ref`则自动`.value`取值==

------

**`setup`组件实例代理配置**

```typescript
// packages/runtime-core/src/component.ts
const instanceProxy = {
  get(target, key) {
    const { data, props, setupState } = target;

    if (setupState && hasOwn(setupState, key)) {
      return setupState[key];
    } 
    // ...
  },
  set(target, key, value) {
    const { data, props, setupState } = target;
    if (setupState && hasOwn(setupState, key)) {
      setupState[key] = value;
    } 
    // ...
  }
};

```

组件的`setup`的基本结构就是这样的👆，这里实现的核心在于:

- ==`setup`的处理，**发生组件初始化挂载处理流程中**，具体时间点是在组件渲染到真实节点之前== `mountComponent` :arrow_right: `setupComponent` :arrow_right:  `setup` 
- ==在`setup`的处理中根据`setup`的执行结果改变组件的`render`或`setupState`==
  - 若`setup`改变了组件的`render`，那么==这个`setup`的`render`便成为了组件的`render`，**优先级最高**==
  - ==若`setup`改变了组件的`setupState`，那么在组件的`render`中便可以通过`instance.proxy`拿到`setupState`中的数据==

#### 1.3、`setup`中的`emit`实现

`emit`是个触发器，可以在子组件中触发父组件的方法

**`setup`的处理逻辑中**

```typescript
// packages/runtime-core/src/component.ts
export function setupComponent(instance) {
  // type就是用户写的原始组件（是个对象）
  let { type, props, children } = instance.vnode;
  let { data, render, setup } = type;

 /**
   * 处理组件的setup属性
   * 执行setup，根据setup的执行结果改变组件的render或setupState
   */
  if (setup) {
    // setup的context
    const context = {
      // 调用父组件方法的触发器
      emit: (eventName, ...args) => {
        /**
         * 对方法名字进行处理
         * childUpdate（子组件中触发的事件名） => onChildUpdate（父组件中的事件名）
         */
        const name = `on${eventName[0].toUpperCase()}${eventName.slice(
          1
        )}`;

        // 用户绑定的属性 包括事件
        let invoker = instance.vnode.props[name];
        // 调用组件绑定的事件，即可
        invoker && invoker(...args);
      },
    };
    
   /**
     * 执行setup
     */
    const setupResult = setup(instance.props, context);

    // ...
  }

  // ...
}
```

==父组件给子组件传递的`props`中有`onChildUpdate`，那么子组件便可以通过`emit`触发`childUpdate`，完成对父组件方法的调用==

```js
setup(props, { attrs, emit }) {
  emit('childUpdate', [...args]);
}
```

#### 1.4、完整的`setup`实现

```typescript
// packages/runtime-core/src/component.ts
export function setupComponent(instance) {
  // type就是用户写的原始组件（是个对象）
  let { type, props, children } = instance.vnode;
  let { data, render, setup } = type;
  
  // ...

  /**
   * 处理组件的setup属性
   * 执行setup，根据setup的执行结果改变组件的render或setupState
   * 给setup的两个参数props和context，在这里进行赋值并传参
   */
  if (setup) {
    // setup的context
    const context = {
      // 调用父组件方法的触发器
      emit: (eventName, ...args) => {
        /**
         * 对方法名字进行处理
         * childUpdate（子组件中触发的事件名） => onChildUpdate（父组件中的事件名）
         */
        const name = `on${eventName[0].toUpperCase()}${eventName.slice(
          1
        )}`;

        // 用户绑定的属性 包括事件
        let invoker = instance.vnode.props[name];
        // 调用组件绑定的事件，即可
        invoker && invoker(...args);
      },
      slots: instance.slots, //插槽属性
      attrs: instance.attrs, // attrs
      expose: exposed => {
        instance.exposed = exposed || {};
      }
    };

    /**
     * 执行setup
     * 并在执行setup之前将当前组件实例挂到全局变量instance上
     * 在setup中便可以通过getCurrentInstance拿到当前组件实例
     * 在setup执行完之后将全局变量instance重新置为null
     */
    setCurrentInstance(instance);
    const setupResult = setup(instance.props, context);
    setCurrentInstance(null);

    if (isFunction(setupResult)) {
      // 若setup返回值是函数，则将该返回值置为组件的render
      instance.render = setupResult;
    } else if (isObject(setupResult)) {
      /**
       * 若setup返回值是对象，则将该对象挂在组件实例上
       * 并对该对象进行代理，若是ref则自动.value取值
       */
      instance.setupState = proxyRefs(setupResult);
    }
  }

  if (!instance.render) {
    // 若是setup中没有挂载render，则在这里挂载render
    if (render) {
      // 将用户写的render挂在组件实例上
      instance.render = render;
    } else {
      // 模板编译生成的render在这里挂到组件实例上
    }
  }
}
```

在这个完整的`setup`的实现中，有段逻辑需要注意

```typescript
/**
 * 执行setup
 * 并在执行setup之前将当前组件实例挂到全局变量instance上
 * 在setup中便可以通过getCurrentInstance拿到当前组件实例
 * 在setup执行完之后将全局变量instance重新置为null
 */
setCurrentInstance(instance);
const setupResult = setup(instance.props, context);
setCurrentInstance(null);


```

这段逻辑的目的在于保证，在`setup`的执行中可以通过`getCurrentInstance`方法拿到当前的组件实例

<!--注意：只有在setup执行中才能通过`getCurrentInstance`拿到组件实例(后面的lifecycle也可以)-->

**获取、设置当前组件实例的方法**

```typescript
/**
 * 全局变量 当前的组件实例
 * 在setup中使用
 */
export let instance = null;

/**
 * 获取、设置当前组件实例的方法
 */
export const getCurrentInstance = () => instance;
export const setCurrentInstance = i => (instance = i);
```



在`setup`中的第二个参数`context`中还可以拿到组件插槽`slots`，这个在下面的`slot`实现中会挂到`instance`上

### 二、组件`slot`的实现

#### 2.1、组件`slot`的使用

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
  <script src="../../../node_modules/@vue/runtime-dom/dist/runtime-dom.global.prod.js"></script>
  <script>
    const { render, h, Fragment, } = VueRuntimeDOM;

    const MyComponent = {
      setup(props, { attrs, emit, slots, expose }) {
        return function () {
          return h(Fragment, [
            h('div', this.$slots.default()),
            h('div', slots.header()),
            h('div', slots.main()),
            h('div', slots.footer())
          ])
        }
      }
    }

    const VueComponent = {
      render() {
        return h('div', h(MyComponent, null, { // 类型是一个对象
          default: () => {
            return h('a', 'default')
          },
          header: () => {
            return h('a', 'hello')
          },
          main: () => {
            return h('a', 'world')
          },
          footer: () => {
            return h('a', 'Vue3.X')
          }
        }))
      }
    }
    render(h(VueComponent), app);
  </script>
</body>

</html>
```

<!--children是对象的话，可以直接判断为插槽（还有可能为其他类型）-->

#### 2.2、组件的`slot`的具体实现

`createVNode`中增加`slot`类型`children`

```typescript
/**
 * 创建VirtualNode
 */
export function createVNode(type, props = null, children = null) {
  // ...

  /**
   * 通过位运算
   * 将当前的VNode 和 children VNode映射起来
   * 通过shapeFlags 就可以知道children VNode的类型了 是数组 还是元素 还是文本、插槽
   * 利用的是位运算在权限控制中的应用
   */
  if (children !== undefined) {
    let temp = 0;
    
    //...
 
    else if (isObject(children)) {
      // children是对象的话，暂时直接判断为插槽（还有可能为其他类型）
      temp = ShapeFlags.SLOTS_CHILDREN;
    } 
    
    // ...
    
    vnode.shapeFlag = vnode.shapeFlag | temp;
  }

  return vnode;
}

```

在`setupComponent`中初始化`slot`

```typescript
// packages/runtime-core/src/component.ts
export function setupComponent(instance) {
  let { type, props, children } = instance.vnode;
  
  // ...

  /**
   * 初始化slots
   */
  initSlots(instance, children);
  
  // ...

}
```

```typescript
/**
 * 初始化slots
 * @param instance 组件实例
 * @param children 组件vnode上的children，也就是插槽对象
 */
function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    // 若children为slot类型，则将children挂到instance.slots上
    instance.slots = children;
  }
}
```

组件实例代理配置中增加`$slots`

```typescript
/**
 * 可以供用户访问的属性
 */
const publicProperties = {
  $attrs: instance => instance.attrs,
  $slots:(instance)=>instance.slots
};
```

==组件的`slot`的实现很简单，就是将`slot`挂到组件实例上；==

其实组件的`slot`就是组件的`children`，这个`children`是对象形式的，所以核心的地方在于将`template`中的`slot`的转变成组件的`VNode`的`children`

### 三、组件的`lifecycle`的实现

#### 3.1、`lifecycle`的使用

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
    const { render, h, getCurrentInstance, onMounted} = VueRuntimeDOM;

    const VueComponent = {
      setup() {

        onMounted(() => {
          console.log(getCurrentInstance())
          console.log('m1')
        })
        onMounted(() => {

          console.log('m2')
        })
        onMounted(() => {
          console.log('m3')

        })
      },
      render() {
        return h('div', 'hello')
      }
    }
    render(h(VueComponent), app);

  </script>
</body>

</html>
```

#### 3.2、`lifecycle`的具体实现

**==钩子的定义==**

```typescript
// packages/runtime-core/src/apiLifeCycle.ts
import { instance, setCurrentInstance } from './component';

export const enum LifeCycle {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  UPDATED = 'u'
}

/**
 * 创建生命周期方法的方法
 * @param type 生命周期钩子函数的类型
 * @returns 返回值便是提供给用户使用的生命周期钩子
 * 当用户在setup中使用某个具体的钩子时
 * 会在当前组件实例上添加一个表示当前钩子的属性
 * 该属性的值是个数组，用于存储用户填写的钩子回调函数
 */
function createInvoker(type) {

  /**
   * @param hook 用户填写的钩子回调
   * @param currentInstance 就是当前调用 钩子 所在的组件的实例
   * 后续全局变量 instance 变化了不会影响 currentInstance
   */
  return function (hook, currentInstance = instance) {
    if (currentInstance) {
      // 给当前组件实例上挂上钩子属性
      const lifeCycles =
        currentInstance[type] || (currentInstance[type] = []);
      /**
       * 采用AOP思想
       * 包装用户填写的钩子回调
       * 保证钩子在执行时
       * 调用getCurrentInstance可以拿到当前组件实例
       */
      const wrapHook = () => {
        setCurrentInstance(currentInstance);
        // 指定用户的钩子回调的this指向当前组件实例
        hook.call(currentInstance);
        setCurrentInstance(null);
      };

      lifeCycles.push(wrapHook);
    }
  };
}

// lifecycle hook BEFORE_MOUNT
export const onBeforeMount = createInvoker(LifeCycle.BEFORE_MOUNT);
// lifecycle hook MOUNTED
export const onMounted = createInvoker(LifeCycle.MOUNTED);
// lifecycle hook UPDATED
export const onUpdated = createInvoker(LifeCycle.UPDATED);
```

==需要注意的一点：钩子回调是如何存储在组件实例上的==

```ts
const lifeCycles = currentInstance[type] || (currentInstance[type] = []);

const wrapHook = () => {
    setCurrentInstance(currentInstance);
    // 指定用户的钩子回调的this指向当前组件实例
    hook.call(currentInstance);
    setCurrentInstance(null);
  };

lifeCycles.push(wrapHook);
```
当用户在组件中使用了一个生命周期钩子函数，比如`onMounted`方法，那么组件实例`instance`上便会多一个`m`属性，==`instance.m`是一个**数组**用于存放用户传入的钩子回调==

为何`instance.m`是一个数组？==这是因为用户可能多次使用同一个生命周期钩子函数==

------

**==钩子的安装==**

```typescript
 // packages/runtime-core/src/renderer.ts
  function setupRenderEffect(instance, container, anchor) {
    const componentUpdate = () => {
      const { render } = instance;

      if (!instance.isMounted) {
        // 组件初始化挂载

        /**
         * lifeCycle hook BEFORE_MOUNT
         * 生命周期钩子，挂载前
         */
        if (instance.bm) {
          // ...
          invokerFns(instance.bm);
        }

        const subTree = render.call(instance.proxy);
        patch(null, subTree, container, anchor);
        instance.subTree = subTree;
        instance.isMounted = true; // 标识当前组件已经挂载过了

        /**
         * lifeCycle kook MOUNTED
         * 生命周期钩子，挂载完成
         */
        if (instance.m) {
          // ...
          invokerFns(instance.m);
        }
      } else {
        // 组件更新

        // ...
        
        /**
         * 更新逻辑
         * 将新的VNode和旧的VNode传给patch方法进行更新
         */
        patch(instance.subTree, subTree, container, anchor);
        instance.subTree = subTree;

        /**
         * lifeCycle hook UPDATED
         * 生命周期钩子，更新完成
         */
        if (instance.u) {
          // ....
          invokerFns(instance.u);
        }
      }
    };
  }
```

```ts
// packages/shared/src/index.ts
export function invokerFns(fns) {
  for (let i = 0; i < fns.length; i++) {
    fns[i]();
  }
}
```

`lifecycle`的实现也很简单，核心的地方在

- ==首先，将**使用到的钩子**添加到组件实例上==

  ```typescript
  // 给当前组件实例上挂上钩子属性
  const lifeCycles = currentInstance[type] || (currentInstance[type] = []);
  ```

- 保证用户在钩子回调中可以拿到当前组件实例

  ```typescript
  const wrapHook = () => {
    setCurrentInstance(currentInstance);
    // 指定用户的钩子回调的this指向当前组件实例
    hook.call(currentInstance);
    setCurrentInstance(null);
  };
  ```
  
- 然后，在组件的更新方法`componentUpdate`中，==**调用组件实例上的钩子**==

  <!--用户使用到的钩子才会挂到组件实例上，没有用到就不会有，所以每个钩子函数在执行前都会判断是否有值-->

  ```ts
  /**
  * lifeCycle hook BEFORE_MOUNT
  * 生命周期钩子，挂载前
  */
  if (instance.bm) {
  // ...
  invokerFns(instance.bm);
  }
  
  
  /**
   * lifeCycle kook MOUNTED
   * 生命周期钩子，挂载完成
   */
  if (instance.m) {
    // ...
    invokerFns(instance.m);
  }
  ```

  

### 四、总结

==在组件 `mount` 阶段会调用 `setup` 方法，之后会判断 `render` 方法是否存在，如果不存在会调用 `compile` 方法将 `template` 转化为 `render`==

组件的`setup`、`slot`、`lifecycle`的实现其实都不复杂，都是建立在组件的渲染原理上的

