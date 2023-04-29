## async await 原理

### 一、迭代器Iterator

#### 1.1、什么是迭代器Iterator

==**迭代器（Iterator）** 是一种**用于遍历数据集合**的通用接口，为各种不同的数据结构**提供统一的访问机制**==

==任何数据结构只要部署**Iterator** 接口（在**js**中就是对象的一个属性**Symbol.iterator** ）就可以完成遍历操作==

在 **JavaScript** 中，许多内置的数据结构都实现了 **Iterator** 接口，包括数组、Set、Map、字符串等。这意味着，这些数据结构都可以通过 **for...of** 循环来遍历。

例如，以下代码演示了如何使用 **for...of** 循环遍历一个数组：

```js
const myArray = [1, 2, 3];
for (const value of myArray) {
  console.log(value);
}
// 输出:
// 1
// 2
// 3
```

在该示例中，我们定义了一个名为 **myArray** 的数组，并使用 **for...of** 循环遍历该数组中的每个元素；**for...of** 循环通过获取 **myArray** 对象的**==迭代器==**来实现遍历，因为==数组实现了 **Iterator** 接口==

除了 **for...of** 循环之外，还可以使用迭代器对象的 ==**next**== 方法来**==手动遍历一个可迭代对象==**

例如，以下代码演示了如何手动遍历一个数组：

```js
const myArray = [1, 2, 3];
const iterator = myArray[Symbol.iterator]();
let result = iterator.next();
while (!result.done) {
  console.log(result.value);
  result = iterator.next();
}
// 输出:
// 1
// 2
// 3
```

在该示例中，我们使用 **myArray** 对象的 ==**Symbol.iterator** 方法==获取一个迭代器对象，并使用 **while** 循环来逐个获取该数组中的元素

每次调用迭代器对象的 ==**next**== 方法都会==返回一个对象==，该对象包含==一个 **value** 属性==和==一个 **done** 属性==，用于表示当前元素和迭代器是否已完成

**Iterator** 是一个非常通用的接口，许多内置的数据结构都实现了该接口，允许我们使用 **for...of** 循环或手动遍历的方式来遍历这些数据集合

#### 1.2、利用Iterator使对象可迭代

一个普通**JavaScript**对象如果想要成为**==可迭代对象==**，必须实现==一个名为 **Symbol.iterator** 的方法==，该方法必须返回一个**==迭代器对象==**。

迭代器对象必须实现一个 **==next==** 方法，该方法返回**==一个对象==**，该对象包含一个 **==value==** 属性和一个 **==done==** 属性，用于表示**==迭代器的当前值==**和**==迭代器是否已完成==**

以下代码定义了一个普通**JavaScript**对象，并使用 **Symbol.iterator** 方法来定义一个迭代器：

```js
let likeArray = { // 数组中有Symbol(Symbol.iterator) 这个方法就是告诉浏览器如何迭代此对象
    0:1,
    1:2,
    2:3,
    3:4,
    length:4,
   [Symbol.iterator](){ // 此方法要返回一个迭代器
        let i = 0;
        // this
        return {
             next:()=>{
                return {value:this[i],done:this.length === i++}
            }
        }
    }
}

for (const value of myIterable) {
  console.log(value);
}
// 输出:
// 1
// 2
// 3
// 4
```

**迭代器（Iterator）工作原理**

1. 创建一个指针，指向当前数据结构的起始位置

2. 第一次调用对象的**next**方法，指针自动指向**数据结构的第一个成员**

3. 接下来不断调用**next**方法，**指针一直往后移动**，直到指向最后一个成员

4. 每调用**next**方法返回一个包含**value**和**done**

### 二、生成器Generator

#### 2.1、什么是生成器Generator

==**生成器Generator**==是一种**==特殊类型的函数==**，它可以通过 **yield** 语句来**==暂停函数执行==**，并**==在需要时恢复执行==**

每次调用 **Generator** 函数时，它都会返回一个==**新的迭代器对象**==，该对象可以==用于遍历生成器生成的值==

例如，以下代码定义了一个简单的生成器函数，它可以生成一些数字：

```js
function* generateNumbers() {
  yield 1;
  yield 2;
  yield 3;
}

const iterator = generateNumbers();

console.log(iterator.next()); // 输出: { value: 1, done: false }
console.log(iterator.next()); // 输出: { value: 2, done: false }
console.log(iterator.next()); // 输出: { value: 3, done: false }
console.log(iterator.next()); // 输出: { value: undefined, done: true }
```

该代码定义了一个名为 **generateNumbers** 的生成器函数，它使用 **yield** 语句生成一系列数字

在调用 **generateNumbers** 函数时，它返回一个**迭代器对象**，该对象可以通过调用 **next** 方法来遍历生成器生成的值

每次调用 **next** 方法时，==生成器函数都会执行到下一个 **yield** 语句==，==并将 **yield** 语句后面的值返回给调用者==。当生成器函数执行完所有 **yield** 语句后，它将返回一个 **done** 属性为 **true** 的对象

#### 2.2、利用Generator使对象可迭代

由于**生成器Generator**的返回值是一个**迭代器Iterator**，并且使用**迭代器Iterator**的**next** 方法来遍历生成器**yield**的值，所以可以利用**Generator**使对象可迭代

改造下1.2中的例子👇

```js
let likeArray = { // 数组中有Symbol(Symbol.iterator) 这个方法就是告诉浏览器如何迭代此对象
    0:1,
    1:2,
    2:3,
    3:4,
    length:4,
    [Symbol.iterator]:function *(){ // 迭代数组的时候 会自动调用next
      let i = 0;
      let len = this.length;
      while(len !== i){
          yield this[i++]
      }
  }
}

for (const value of myIterable) {
  console.log(value);
}
// 输出:
// 1
// 2
// 3
// 4
```

输出结果是一样的

### 三、Generator+Promise的使用 ‼️

**Promise**是我们摆脱了回调地狱，解决了回调嵌套的问题，但链式操作看起来仍然是异步的写法，使用**Generator+Promise**可以让我们像写同步代码一样写异步代码

看下面👇的实例

先创建两个文本文件 `a.txt`、`b.txt`

```js
// a.txt
b.txt
```

```js
// b.txt
hello world
```

再创建两个读取文件内容的方法`readA`、`readB`，两个方法的返回值都是一个**Promise**对象，我们若想读取`b.txt`中的内容，需要执行`readA`获取`a.txt`中的内容，再执行`readB`

```js
const fs = require("fs/promises");
const path = require('path')
const readA = () =>
  fs.readFile(path.resolve(__dirname, 'a.txt'), 'utf8');
const readB = data1 =>
  fs.readFile(path.resolve(__dirname, data1), 'utf8');
```

------

先看下**Promise**链式操作的写法👇

```js
readA()
  .then(data => {
    console.log('ReadA', data);
    return readB(data);
  })
  .then(data => console.log('readB', data));

// ReadA b.txt
// readB hello world
```

------

再看下**Generator**的同步写法👇

先定义一个**Generator** 函数`readFile`

```js
function* readFile() {
  let data1 = yield readA()
  let data2 = yield readB(data1)
  return data2; // 30
}
```

> 这样的写法就像同步代码一样，先执行readA，再执行readB
>
> 是不是看起来很熟悉，和async await的写法基本一致了
>
> yield后面同样跟一个Promise

上面只是定义了**Generator** 函数，还未执行，接下来看下`readFile`的执行 ‼️

<!--这里很重要，有助于理解await的原理-->

```js
let it = readFile();
// 执行readA，value是一个Promise
let {value,done} = it.next();
// value再进行then操作
value.then(data1=>{
    let {value,done} = it.next(data1)
    value.then(data2=>{
        let {value,done} = it.next(data2);
        console.log('value', value)
    })
})

// value hello world
```

> 看到这里，可以发现then的执行不再是是链式操作了，而是**==嵌套操作==**了
>
> ⚠️注意，这里的then的嵌套是和await对应的，
>
> ==一个await语句之后的所有语句都可以当作是一个then的回调函数==
>
> ==await之后再接await，就相当于then里面嵌套then==

仔细观察`readFile`的执行，可以发现执行**next方法**的这段逻辑

```js
let {value,done} = it.next();
value.then(data1=>{
    let {value,done} = it.next(data1)
    value.then(data2=>{
    })
  })
```

完全可以封装成一个递归方法👇

```js
// 递归的写法
function co(it) {
  // co方法返回一个Promise
  return new Promise((resolve, reject) => {
    //递归执行next的方法
    function step(data) {
      let { value, done } = it.next(data);
      // 检测是否没有yeild了
      if (!done) {
        // 不管yeild的value是否是Promise，这里都使用Promise.resolve包装下
        Promise.resolve(value)
          .then(data => {
            // 第一步完成
            step(data); // 下一步
          })
          .catch(e => {
            reject(e);
          });
      } else {
        resolve(value);
      }
    }
    
    step();
  });
}
```

> 是不是发现和async方法一样，返回值是一个Promise
>
> 其实有一个三方库https://www.npmjs.com/package/co就是实现co这个方法的
>
> 这个库的作者tj同样也是Koa的作者

结下来看使用**co**方法来执行**Generator**函数`readfile`

```js
function* readFile() {
  let data1 = yield readA()
  let data2 = yield readB(data1)
  return data2; // 30
}

co(readFile())
  .then(data => {
    console.log('data', data);
  })
  .catch(e => {
    console.log(e);
  });

// data hello world
```

将`co`和**Generator**函数`readfile`结合起来，就会发现和**async await**一样的特征了

- **Generator**函数使我们摆脱了链式操作，写起来像是同步代码
- **co**方法内部完成了**Promise**的链式操作，同时返回一个**Promise**

<!--实际上，将async await通过babel编译成es5，就会发现和co+Generator的写法是一致的-->

### 四、Generator原理

有这样一个**Generator**函数

```js
function *read() {
  const a = yield 1;
  const b = yield 2;
  const c = yield 3;
}
```

使用[Babel](https://www.babeljs.cn/repl#?browsers=&build=&builtIns=false&corejs=3.21&spec=false&loose=false&code_lz=GYVwdgxgLglg9mABAKgE4FMCGATAFASkQG8AoRRCBAZykU0QF5EBPGdAG20QEYBuMitVoAjRizadEAJn7lKYGhTGsOXAMz8AvkA&debug=false&forceAllTransforms=false&modules=false&shippedProposals=false&circleciRepo=&evaluate=true&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=es2015%2Ces2016%2Ces2017%2Creact%2Ces2015-loose&prettier=false&targets=&version=7.13.10&externalPlugins=&assumptions=%7B%7D)进行转换，编译成es5的代码

```js
"use strict";

var _marked = /*#__PURE__*/regeneratorRuntime.mark(read);

function read() {
  var a, b, c;
  return regeneratorRuntime.wrap(function read$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return 1;

        case 2:
          a = _context.sent;
          _context.next = 5;
          return 2;

        case 5:
          b = _context.sent;
          _context.next = 8;
          return 3;

        case 8:
          c = _context.sent;

        case 9:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}
```

可以发现**Generator**函数其实就是通过**switch...case**来实现的，**regeneratorRuntime**这个包并没有编译出来具体代码 <!--可能regeneratorRuntime是更低版本es的-->，接下来实现下一个**Generator**

#### 4.1、Generator原理

先实现**regeneratorRuntime**

```js
let regeneratorRuntime = {
    // iteratorFn就是Generator函数
    wrap(iteratorFn){
        // 创建一个上下文对象
        const context = {
            next:0,
            done:false, // 表示迭代器没有执行完毕
            stop(){
                context.done = true; // 表示整个函数执行完毕
            },
            sent:null
        }
        // 创建一个Iterator
        let it = {};

        // 创建Iterator的next方法
        it.next = function(value){ // 此value会传递给上一次yield的返回值
            context.sent = value;
            // 执行Generator函数，参数是上下文对象context
            let v = iteratorFn(context);
            return {
                value:v,
                done:context.done
            }
        }
        // 将Iterator返回出去
        return it;
    }
}
```

再将上面的**Generator**方法`*read`改成**es5**的写法

```js
function read() {
  var a, b, c;
  /**
   * regeneratorRuntime.wrap接收一个Generator函数
   * 返回一个Iterator对象
   * 每次调用Iterator对象的next方法，便会继续执行Generator函数
   * 通过 上下文对象_context.next来匹配具体的case，也就是yield
   */
  return regeneratorRuntime.wrap(function(_context) {
    /**
     * _context是接收到的上下文对象
     * 通过上下文对象的_context.next属性，来匹配case
     * 每一个case对应一个yield
     * 每一个case中会切换_context.next属性为下一个case
     */
      switch (_context.prev = _context.next) {
        // 这里每一个case对应一个yield
        case 0:
          // 将_context.next切换成下一个case
          _context.next = 2;
          return 1;
        case 2:
          // 获取到next方法传入的数据
          a = _context.sent;
          console.log(a);
          // 将_context.next切换成下一个case
          _context.next = 6;
          return 2;
        case 6:
          b = _context.sent;
          console.log(b);
          // 将_context.next切换成下一个case
          _context.next = 10;
          return 3;
        case 10:
          c = _context.sent;
          console.log(c);
        case 12:
        case "end":
          return _context.stop();
      }
  });
}
```

**Generator**的原理：

1. 首先，将**Generator**函数转化成一个==新的**Function**==
   - 这个函数接收一个==上下文对象**_context**==
   - 函数内部采用**swtich  & case**的方式将原本的**Generator**函数进行了拆分，拆分成多个**case**，每一个**case**对应一个**yield**
   - 这个函数根据上下文对象**_context.next**来决定执行某一**case**
   - 执行某一**case**时，会将**_context.next**修改成下一**case**的标识
2. **regeneratorRuntime.wrap**接收==新的**Function**==作为参数
   - **wrap**内部会创建一个==上下文对象**_context**==
3. **wrap**函数返回的是一个**==Iterator迭代器==** 
   - 我们需要调用迭代器的**next**方法， 调用**next**的时候会将传入的值保存在**_context.sent**上
4. 调用迭代器的**next**方法，会执行==新的**Function**==
5. 执行==新的**Function**==，将**_context.sent**值取出来作为上次**yield**的返回值
6. 最终执行完毕后**==Iterator迭代器==** 的**done**变为**true**，标识执行完成

### 五、async await的polyfill

使用[Babel](https://www.babeljs.cn/repl#?browsers=&build=&builtIns=false&corejs=3.21&spec=false&loose=false&code_lz=GYVwdgxgLglg9mABAKgE4FMCGATAFASkQG8AoRRCBAZykU0QF5EBPGdAG20QEYBuMitVoAjRizadEAJn7lKYGhTGsOXAMz8AvkA&debug=false&forceAllTransforms=false&modules=false&shippedProposals=false&circleciRepo=&evaluate=true&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=es2015%2Ces2016%2Ces2017%2Creact%2Ces2015-loose&prettier=false&targets=&version=7.13.10&externalPlugins=&assumptions=%7B%7D)转换下面这段**async await**代码

```js
async function read() {
const a = await 1
const b = await 2
const c = await 3
}
```

得到转换结果

```js
'use strict';

function asyncGeneratorStep(
  gen,
  resolve,
  reject,
  _next,
  _throw,
  key,
  arg
) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
      args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);
      function _next(value) {
        asyncGeneratorStep(
          gen,
          resolve,
          reject,
          _next,
          _throw,
          'next',
          value
        );
      }
      function _throw(err) {
        asyncGeneratorStep(
          gen,
          resolve,
          reject,
          _next,
          _throw,
          'throw',
          err
        );
      }
      _next(undefined);
    });
  };
}

function read() {
  return _read.apply(this, arguments);
}

function _read() {
  _read = _asyncToGenerator(
    /*#__PURE__*/ regeneratorRuntime.mark(function _callee() {
      var a, b, c;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch ((_context.prev = _context.next)) {
            case 0:
              _context.next = 2;
              return 1;

            case 2:
              a = _context.sent;
              _context.next = 5;
              return 2;

            case 5:
              b = _context.sent;
              _context.next = 8;
              return 3;

            case 8:
              c = _context.sent;

            case 9:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee);
    })
  );
  return _read.apply(this, arguments);
}
```

可以发现其实**async await**其实和**co+generator** 的逻辑是一致的

### 六、协程

关于**async await**和**generator**还有一个很重要的概念：**协程**，可以看看[这篇文章](https://www.cnblogs.com/pluslius/p/14958340.html)进行了解

==**协程（Coroutine）**是一种**比线程更加轻量级**的**并发处理方式**==

与线程不同的是，==协程并不依赖于操作系统的调度==，而是==由程序**自身控制**协程的**执行中断与恢复**==

==协程可以看作是一种特殊的函数==，==其可以在函数**执行过程中暂停**==，==并保存**函数的上下文**==，以便==下一次执行时可以**恢复现场继续执行**==

通过这种方式，协程可以像线程一样同时处理多个任务，但是不需要创建额外的线程，而是在一个线程内以轻量级的方式实现并发

