### useRef

```js
const myRef = useRef(initialValue);
```

react官方是这样描述`useRef`的

> `useRef` 返回一个可变的 ref 对象，其 `.current` 属性被初始化为传入的参数（`initialValue`）。返回的 ref 对象在组件的整个生命周期内持续存在。

其实简单理解就是useRef这个hooks给我们提供了一个贯穿组件生命周期的一个对象，我们可以在里面存任何数据，类比于<u>***类式组件***</u>，这个对象就相当于this对象，在类式组件中我们有时会在实例对像上存放数据，***<u>函数式组件</u>***由于没有实例所以就有了**<u>*useRef*</u>**这个hooks;

### 基础使用

```js
import React, {useRef} from 'react'

function BasicUsage() {
  const myRef01 = useRef(0);
  console.log('myRef01', myRef01);

  // ref的值更新并不会引起视图的重新render
  const add = () => {
    myRef01.current += 1;
    console.log('myRef01.current add 之后的值', myRef01.current);
  }
  return (
    <div>
      <h1>myRef.current:{myRef01.current}</h1>
      <button onClick={add}>点击+1</button>
    </div>
  )
}

export default BasicUsage

```

就像类式组件中，改变实例对象上的数据不会引起rerender一样，改变ref对象上的数据也不会引起rerender;

### 利用useRef实现componentDidUpdate

```
useEffect(fn,[dep])
```

`useEffect`在初次渲染或者state更新时，都会执行fn，可以利用`useRef`实现初次渲染不执行fn，只在更新时执行fn

```js
  const useDidUpdateEffect = (fn:()=>void, dep?: any[]) => {
     const ref = useRef(false)
     useEffect(()=>{
       if(ref.current){
         fn()
       }
       ref.current = true;
     }, dep)
  }
```

其实useEffect还是在初次渲染时有调用回调，只不过包了一层匿名函数让fn在初次渲染时没执行而已，第一次render之后，ref.current的值已经变成true,当state更新时，useEffect的回调再次执行时就会调用fn



### ForwardRefUsage的使用

要在函数式组件上使用`ref={myRef}`就必须使用ForwardRefUsage传递ref(不然会报错)，React.forwardRef字面意思理解为转发Ref，它会创建一个React组件，这个组件能够将其接受的 `ref` props转发到其组件树下的另一个组件中,另外还可以通过`useImperativeHandle(ref,fn,[dep])`将子组件中的数据传回给父组件，也是一种组件间的通信方式

```js
import React, { useRef, useState, useImperativeHandle, useEffect, Ref } from 'react';

/*
通过ref可以直接拿到组件的dom
原生标签可以直接使用ref，例如 <input type="text" ref="myRef"/>
但是在函数式组件使用是没有办法获取到dom的，例如下面这种使用
<MyComponent ref="myRef"/> 会报错
这个时候就需要使用forWardRef方法
*/

function _Child(props:any, ref:Ref<any>) {
  const [name] = useState('child 的state')
  const childRef = useRef(null);

  const childFun = () => {
    console.log('子组件的方法childFun');
  }

  // 第三个参数时依赖值，依赖值发生变化时传给副组件的值才会更新
  useImperativeHandle(
    ref,
    () => ({
      childFun,
      name,
      childRef,
    })
  )

  return (
    <div ref={childRef}>
      <h2 >子组件</h2>
    </div>
  );
}

const Child = React.forwardRef(_Child)

function ForwardRefUsage() {
  const myRef = useRef<any>(null);

  useEffect(()=>{
    console.log('子组件的dom', myRef.current);
  })

  const callBack = () => {
    if(myRef.current){
      const { childFun } = myRef.current;
      childFun();
    }
  }

  return (
    <div>
      <h1>父组件</h1>
      <Child ref={myRef}/>
      <button onClick={callBack}>调用子组件的方法</button>
    </div>
  );
}

export default ForwardRefUsage;

```