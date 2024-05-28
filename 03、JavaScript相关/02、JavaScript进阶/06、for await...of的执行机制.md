## `for wait...of`执行机制

### 一、前言

**定义：**

> **`for await...of` 语句**创建一个循环，该循环遍历异步可迭代对象以及同步可迭代对象
>
> 它使用对象的每个不同属性的值调用要执行的语句来调用自定义迭代钩子
>
> 类似于 `await`符一样，该语句只能在 `async function` 内部使用。

<!--屁话，看不懂-->

**语法：**

```js
for await (variable of iterable) {
  statement
}
```

`variable`

在每次迭代中，将不同属性的值分配给变量，变量有可能以`const`, `let`, 或者 `var`来声明

`iterable`

被迭代枚举其属性的对象，与 `for...of` 相比，这里的对象可以返回 `Promise`，如果是这样，那么 `variable` 将是 `Promise` 所包含的值，否则是值本身

<!--iterable是Promise的话，variable就是Promise resolve的值-->

### 二、具体应用

**例子1**

自定义一个`fetch`函数模拟异步请求，返回值是一个`Promise`

```js
function fetch(x) {
  return new Promise((resolve, reject) => {
    console.log('start', x);
    setTimeout(() => {
      resolve(x);
      console.log('resolve', x);
    }, 500 * x);
  });
}
```

假设有一系列的请求，用一个数组存储请求入参，再去遍历这个数组进行请求

**使用`forEach`遍历**

```js
function test31() {
  let arr = [3, 2, 1];
  arr.forEach(async item => {
    const res = await fetch(item);
    console.log('res', res);
  });
  console.log('end');
}

test31();
// start 3
// start 2
// start 1
// end
// resolve 1
// res 1
// resolve 2
// res 2
// resolve 3
// res 3
```

打印结果还是符合我们的心智模型的，先打印了同步的部分：`"start"`和`"end"`，之后按照`setTimeout`延迟时间顺序打印`"resolve"`和`"res"`

`forEach`的内部实现机制如下

```js
while (index < arr.length) {
    callback(item, index)  //我们传入的回调函数
}
```

所以，上面`forEach`的写法相当于下面👇这种写法

```js
function test32() {
  let arr = [3, 2, 1];
  const callback = async item => {
    const res = await fetch(item);
    console.log('res', res);
  };
  callback(3);
  callback(2);
  callback(1);
  console.log('end');
}

test32();
// start 3
// start 2
// start 1
// end
// resolve 1
// res 1
// resolve 2
// res 2
// resolve 3
// res 3
```

采用这种写法之后，可以更加直观的理解打印结果的顺序了，先打印`callback`中同步的部分`"start"`，再打印最后的同步部分`"end"`，之后是`callback`中异步的部分`"resolve"`和`"res"`；

需要注意的是：这里的`callback`之间是隔离开的，`"res"`的打印顺序完全取决于`setTimeout`中`resolve`的时机(`resolve`之后，`await`后面的代码，相当于是`then`中注册的回调，会放到微任务队列中，队列中回调的位置取决于`resolve`的时机)

**使用`for...of`遍历**

```js
async function test41() {
  let arr = [3, 2, 1];
  for (const item of arr) {
    const res = await fetch(item);
    console.log('res', res);
  }
  console.log('end');
}

test41();

// test41();
// start 3
// resolve 3
// res 3
// start 2
// resolve 2
// res 2
// start 1
// resolve 1
// res 1
// end
```

打印结果和`forEach`不一样了，有点心智负担对吧

**使用`for...of`遍历**和**使用`forEach`遍历**的结果差异其实是因为，它们内部的实现机制不同，`forEach` 是直接调用回调函数，`for...of` 是通过迭代器的方式去遍历

所以上面👆的代码用迭代器来实现是这样的

```js
async function test41() {
  let arr = [3, 2, 1]
  const iterator = arr[Symbol.iterator]()  //for of会自动调用遍历器函数
  let res = iterator.next()
  while (!res.done) {
    const value = res.value
    const res1 = await fetch(value)
    console.log(res1)
    res = iterator.next()
  }
  console.log('end')
}
```

迭代器不熟，可以换种简单的写法来理解：

```js
async function test42() {
  let arr = [3, 2, 1];
  const res1 = await fetch(3);
  console.log('res', res1);
  const res2 = await fetch(2);
  console.log('res', res2);
  const res3 = await fetch(1);
  console.log('res', res3);
  console.log('end');
}
test42()
// start 3
// resolve 3
// res 3
// start 2
// resolve 2
// res 2
// start 1
// resolve 1
// res 1
// end
```

这样来看就很清晰了，`for...of`循环就相当于是这样的顺序执行，这样再去分析打印结果就很简单了

**例子2**

那有了`for...of`循环中加入`await`的例子，再来看`for await...of`就容易理解很多

有一个返回`Promise`的函数

```js
function getTime(seconds) {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(seconds);
      resolve(seconds);
    }, seconds);
  });
}
```

**直接使用`for...of`循环**

```js
function test1() {
  let arr = [getTime(2000), getTime(300), getTime(1000)];
  for (let x of arr) {
    console.log(x);
  }
}

test1()
// Promise { <pending> }
// Promise { <pending> }
// Promise { <pending> }
// 300
// 1000
// 2000
```

很简单，也符合心智模型

**使用`for await...of`循环**

```js
async function test21() {
  let arr = [getTime(2000), getTime(300), getTime(1000)];
  for await (let x of arr) {
    console.log(x);
  }
}

test21();
// 300
// 1000
// 2000
// 2000
// 300
// 1000
```

打印顺序和`for...of`循环中加入`await`的一致，不过区别在于

```js
 for await (let x of arr){}
```

`x`不再是`arr`中的某一项`value`了，而是`resolve`的值（`arr` 中的`value`是`promise`，那么`x`便是`promise` `resolve`的值）

其实上面的写法相当于下面👇这样的：

```js
async function test22() {
  let arr = [getTime(2000), getTime(300), getTime(1000)];
  const res1 = await arr[0];
  console.log('res1', res1);

  const res2 = await arr[1];
  console.log('res2', res2);

  const res3 = await arr[2];
  console.log('res3', res3);
}
test22()
```

