## Vue插槽使用记录

### 一、插槽基本使用

假设有一个`parent`组件，使用时在组件的起始标签和结束标签之间的填充的内容 `XXX `（这里是`p`标签那部分）就是插槽

<!--在React中叫Children-->

```vue
<template>
  <parent>
    <p>插槽内容</p>
  </parent>
</template>
```

`parent`组件的实现

除了在使用组件时填充插槽内容，还需要在组件的实现中指定插槽渲染的位置，通过`<slot>`元素指定插槽位置

<!--若没有指定<slot>则插槽内容会被丢弃-->

```vue
<template>
  <div>
    <slot />
  </div>
</template>
```

以上就是插槽的基本使用，还是很简单的，看下实现效果

![image-20220708164638292](https://dongger-typora.oss-cn-beijing.aliyuncs.com/typora/image-20220708164638292.png)

所谓的插槽其实就是子组件，只不过子组件的实现是在父组件使用时才定义的，在父组件中指定子组件的渲染位置；是不是有点像函数传参数（只不过这里传的是组件）或者依赖注入

### 二、具名插槽

若在填充插槽内容时有多个插槽需要填充，这个时候就需要使用具名插槽，故名思义就是给插槽起个名字

通过`v-slot: xxx`（缩写是`#xxx`）指令来给插槽添加名字，

<!--没有使用v-slot: xxx的插槽默认名字是default-->

看下👇使用方式

```vue
<template>
  <div id="app">
    <parent>
      <template v-slot:header>
        <p>插槽内容1</p>
      </template>
      <template>
        <p>插槽内容2</p>
      </template>
    </parent>
  </div>
</template>
```

`parent`的实现

在`<slot>`元素上添加`name`属性，标明是哪一个插槽对应的`slot`

<!--没有添加name属性的slot，默认name是default-->

```vue
<template>
  <div>
    <p>parent 标签头部</p>
    <slot name="header" />
    <slot />
    <slot name="footer"> 默认渲染内容</slot>
    <p>parent 标签尾部</p>
  </div>
</template>
```

使用效果

![image-20220708165654996](https://dongger-typora.oss-cn-beijing.aliyuncs.com/typora/image-20220708165654996.png)

### 三、作用域插槽

既然插槽是子组件，那么自然父组件可以传递`props`给子组件，这个就是作用域插槽

看下👇使用方式

在填充插槽内容时，通过`v-slot: xxx = props`来接收`props`（`props`名字随便起）

```vue
<template>
  <div id="app">
   <parent>
      <template v-slot:header="slotProps">
        <p>插槽内容1{{ slotProps }}</p>
      </template>
    </parent>
  </div>
</template>
```

`parent`的实现

在`<slot>`元素上通过`v-bind`指令传递`props`给插槽

```vue
<template>
  <div>
    <p>parent 标签头部</p>
    <slot name="header" :info="'插槽props'" />
    <p>parent 标签尾部</p>
  </div>
</template>
```

看下实现效果

![image-20220708171235878](https://dongger-typora.oss-cn-beijing.aliyuncs.com/typora/image-20220708171235878.png)

**注意⚠️ ** 父组件传递给插槽的 `props`只能在插槽内容中使用，插槽内容以外的地方无法使用，很容易理解，插槽是子组件，父组件给子组件的`props`当然只能在子组件中使用；不过因为插槽是在父组件的父组件中完成填充的，由于模版编译作用域的存在，插槽是可以拿到父组件的父组件的`data`数据（是不是也是一种跨组件通信了🐶🐶）


