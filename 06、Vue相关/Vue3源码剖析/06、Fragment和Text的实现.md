## Vue3源码剖析（六）— Fragment和Text的实现

除了元素虚拟节点之外，Vue3中还有很多其他类型的虚拟节点，这里先实现`Text`和`Fragment`

### 一、`Fragment`的实现

```typescript
renderer.render(h(Fragment,[h(Text,'hello'),h(Text,'jw')]),document.getElementById('app'))
```

```typescript
const patch = (n1,n2,container,anchor?) => {
    // ...
  
    const {type,shapeFlag} = n2;
    switch(type){
        case Fragment:
            processFragment(n1,n2,container); // 处理fragment
            break;
        default:
            // ...
    }
}
```

```js
const processFragment = (n1,n2,container)=>{
    if(n1 == null){ 
        mountChildren(n2.children,container);
    }else{
        patchChildren(n1,n2,container);
    }
}
```

> 为了让Vue3支持多根节点模板，Vue.js 提供Fragment来实现，核心就是一个无意义的标签包裹多个节点。

**同时这里要处理下卸载的逻辑，如果是fragment则删除子元素**

```js
const unmount = (vnode) =>{
    if(vnode.type === Fragment){
        return unmountChildren(vnode.children)
    }
    hostRemove(vnode.el)
}
```

### 二、`Text`的实现

```js
renderer.render(h(Text,'jw handsome'),document.getElementById('app'))
```

```js
const patch = (n1,n2,container,anchor?) => {
    // ...
    const {type,shapeFlag} = n2;
    switch(type){
        case Text:
            processText(n1,n2,container); // 处理文本
            break;
        default:
            // ...
    }
}
```

```js
const processText = (n1,n2,container)=>{
    if(n1 == null){
        hostInsert((n2.el = hostCreateText(n2.children)),container)
    }else{
        const el = n2.el = n1.el;
        if(n2.children !== n1.children){
            hostSetText(el,n2.children)
        }
    }
}
```