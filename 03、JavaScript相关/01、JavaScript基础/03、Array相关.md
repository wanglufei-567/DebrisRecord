## Array相关

### 一、new Array()使用

在JS中除了使用字面量的形式直接创建数组之外，还可以通过内置的Array构造函数来创建

使用方式：

```js
const arr1 = new Array();
// 或
const arr2 = Array();
```

为何可以省略new关键字

```js
// 构造函数里这段逻辑可以实现
function Array()
{
   // 如果用户没有使用new进行调用则静默调用new
   if ( !(this instanceof Array) )
      return new Array();

   // constructor logic follows...
}
```

#### 1.1、new Array() 做了什么

当我们使用Array创建一个指定长度的数组时`new Array(length)` ，其实`Array(length)` 仅仅就是给生成的新数组对象设了个 `length` 属性并且赋值而已;

而若我们使用`[undefined,undefined]`的形式创建一个长度为2的数组，则是给生成的数组对象设置了这些属性`”0“：undefined，”1“：undefined，”length“：2`
<!--另外Array(5)[99]===undefined,这相当于是访问了一个对象的未声明的属性-->

- **为什么`Array(length)`不可以使用map方法,而`[undefined]`可以使用?**

  **map**方法是**Array**原型上的一个方法`Array.prototype.map(callbackfn [ , thisArg ])`；当执行**map** 函数进行遍历数组时，会先通过 **HasProperty**方法进行检查，若**map**进行遍历的话首先要有这个属性👇

  ```js
  new Array(2).hasOwnProperty(0) // false
  [undefined, undefined].hasOwnProperty(0) // true
  
  // 所以Array(len).map(callback)中的callback 其实就没执行
  new Array(2).map(e => console.log('hey~~')) // 这里不会打印
  ```

- **为什么`let a = Array.apply( null ,{ length : 100 } )`会创建个100长度数组且属性值都是undefined？**
  `apply` 接受的 **argArray** 会被要求执行**CreateListFromArrayLike**方法，然后它只会**check**一下有没有`length`就开始逐个对`index` 调用 **[[Get]]** 了，**[[Get]]** 最差就是返回 `undefined`

  所以最后会生成这个100 `undefined` 的**List**作为参数给**Array**构造函数

