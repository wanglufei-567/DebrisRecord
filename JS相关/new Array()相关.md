```
new Array() 与 Array()相同

构造函数里这段逻辑可以实现
function Array()
{
   // 如果用户没有使用new进行调用则静默调用new
   if ( !(this instanceof Array) )
      return new Array();

   // constructor logic follows...
}

```



```
new Array() 做了什么
new Array(length)
其实Array(len) 仅仅就是给生成的新数组对象设了个 length 属性并且赋值而已
而[undefined,undefined]则是给生成的数组对象设置了”0“：undefined，”1“：undefined，”length“：2
另外Array(5)[99]===undefined,这相当于是访问了一个对象的未声明的属性
```



```
为什么Array(len)不可以使用map(),而[undefined]可以使用
  Array.prototype.map(callbackfn [ , thisArg ]),map 函数会先检查 HasProperty,要map的话首先要有这个属性
  new Array(2).hasOwnProperty(0) // false
  [undefined, undefined].hasOwnProperty(0) // true
  所以Array(len).map(callback)中的callback 其实就没执行
  new Array(2).map(e => console.log('hey~~')) // 这里不会打印
```



```
为什么let a = Array.apply( null ,{ length : 100 } ); 会创建个100长度数组 都是undefined
apply 接受的 argArray 会被要求执行 CreateListFromArrayLike，然后它只会 check 一下有没有 length 就开始逐个对 index 调用 [[Get]] 了，[[Get]] 最差就是返回 undefined。所以最后会生成这个 100 undefined 的 List 作为参数给 Array 构造函数
```

