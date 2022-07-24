## Promise原理

### 前言

本文内容虽然已经前后整理过三次，但都是代码的形式，没有整理成笔记。所以每次时间一长，有些知识点记不太清了就得去看代码，这样难免有些耽误事，所以特意写在笔记中，方便以后温故知新。

### 1、理解Promise

什么是Promise?

 Promise是JS中进行异步编程的新的解决方案。<!--别的地方看的，记不住-->

具体点的说 <!--也是屁话-->

- 从语法上来说: Promise是一个构造函数
- 从功能上来说: promise对象用来封装一个异步操作并可以获取其结果

为什么要用Promise？<!--其实就是解决回调地狱的问题，不过回调地狱的问题有争议，有人认为不是问题-->

- 指定回调函数的方式更加灵活: 可以在请求发出甚至结束后指定回调函数
- 支持链式调用, 可以解决回调地狱问题

回调地狱的缺点

- 不便于阅读
- 不便于异常处理

### 2、Promise的几个关键问题

 <!--真的很关键，这个是要记住的，虽然我总忘-->

**1、如何改变promise的状态?**

- resolve(value): 如果当前是pendding就会变为resolved
- reject(reason): 如果当前是pendding就会变为rejected
- 抛出异常: 如果当前是pendding就会变为rejected

```js
const promise1 = new Promise((resolve, reject) => {
  resolve(123)
});
console.log(promise1) // Promise { <resolved> 123 }

const promise2 = new Promise((resolve, reject) => {
  reject(123)
});
console.log(promise2) // Promise { <rejected> 123 }

const promise3 = new Promise((resolve, reject) => {
  throw new Error(123)
});
console.log(promise3) // Promise { <rejected> Error: 123 }
```

**2、一个promise指定多个成功/失败回调函数, 都会调用吗?**

当promise改变为对应状态时都会调用，并且入参是相同的

```js
const promise = new Promise(res => {
  res({ a: 123 });
});

promise.then(result => {
  console.log('第一个回调', result); // 第一个回调 { a: 123 }
});

promise.then(result => {
  console.log('第二个回调', result); // 第二个回调 { a: 123 }
});
```

**3、改变promise状态和指定回调函数谁先谁后?**

- 都有可能, 正常情况下是先指定回调再改变状态, 但也可以先改状态再指定回调
- 如何先改状态再指定回调?
  - 在执行器中直接调用resolve()/reject()
  - 延迟更长时间才调用then()
-  什么时候才能得到数据?
  - 如果先指定的回调, 那当状态发生改变时, 回调函数就会调用, 得到数据
  - 如果先改变的状态, 那当指定回调时, 回调函数就会调用, 得到数据

**4、promise.then()返回的新promise的结果状态由什么决定?**

- 简单表达: 由then()指定的回调函数执行的结果决定 

  <!--回调的返回值决定，和.then()前的promise无关-->

- 详细表达:
  - 如果抛出异常, 新promise变为rejected, reason为抛出的异常

  - 如果返回的是非promise的任意值, 新promise变为resolved, value为返回的值
  - 如果返回的是另一个新promise, 此promise的结果就会成为新promise的结果

**5、promise异常传/穿透?**

-  当使用promise的then链式调用时, 可以在最后指定失败的回调
-  前面任何操作出了异常, 都会传到最后失败的回调中处理

```js
const promise = new Promise(res => {
  res({ a: 123 });
});

promise.then(result => {
  console.log('第一个then回调', result);
}).then(result => {
  console.log('第二个then回调', result);
  throw new Error('出错了')
}).then(result => {
  console.log('第二个then回调', result);
}).catch(err => {
  console.log('catch', err);
})

// 第一个then回调 { a: 123 }
// 第二个then回调 undefined
// catch Error: 出错了
```

**6、 如何中断promise链?**

- 当使用promise的then链式调用时, 在中间中断, 不再调用后面的回调函数
- 办法: 在回调函数中返回一个pendding状态的promise对象

### 3、实现Promise

#### 3.1 创建一个Promise类 

<!--其实也是构造函数-->

首先是promise的三个状态，`pending` `resolved` `rejected` 

然后是Promise类构造函数中的三个属性，`status`表示promise实例的状态，`data`用来存储结果数据的（后面看代码就知道具体怎么用的），`callbacks`用来存放回调函数的

每个promise的实例的初始状态都是`pending`，所以构造函数中`status`初始值置为 `pending`

```js
const PENDING = 'pending';
const RESOLVED = 'resolved';
const REJECTED = 'rejected';

class MyPromise {
  constructor(executor) {
    const self = this;
    self.status = PENDING; // 每个Promise对象的初始状态都是'pending'
    self.data = undefined; // 给promise对象制定一个用于存储结果数据的属性
    self.callbacks = []; // 回调函数存储的队列，数据结构：{onResolved(){}, onRejected(){}}
}
```

#### 3.2 实现executor

`executor`的形式是这样的 `(resolve, reject) => {}` 默认接受两个参数 `resolve` `reject`

因此需要在构造函数中实现这两个参数

 `resolve` `reject`中使用的`setTimeout`模仿微任务，同时改变当前`promise`的状态 及 `data`数据存储

```js
  function resolve(value) {
    // 检查当前的promise的状态，非pending状态直接返回
      if (self.status !== PENDING) return;
    
      self.status = RESOLVED;
      self.data = value;
    
      if (self.callbacks.length > 0) {
        // 用setTimeout模仿，then()中的回调放进微任务队列
        setTimeout(() => {
          self.callbacks.forEach(element => {
            element.onResolved(value);
          });
        });
      }
    }

    function reject(reason) {
      // 检查当前的promise的状态，非pending状态直接返回
      if (self.status !== PENDING) return;
     
      self.status = REJECTED;
      self.data = reason;
      
      if (self.callbacks.length > 0) {
        // 用setTimeout模仿，then()中的回调放进微任务队列
        setTimeout(() => {
          self.callbacks.forEach(element => {
            element.onRejected(reason);
          });
        });
      }
    }

    // 这里执行executor，也就是我们初始化Promise的时候传进来的回调函数
    try {
      executor(resolve, reject);
    } catch (reason) {
      reject(reason);
    }
```

#### 3.3 实现then()

其实Promise的核心就是`then()`的实现

注意：`then()`方法最后返回的是个新的promise实例

```js
  /* Promise原型上的then()方法，用于指定成功和失败的回调，返回一个新的promise对象
  返回的promise对象的状态由onResolved/onRejected执行的结果决定
  */
  then(onResolved, onRejected) {
    const self = this;

    // 给指定的回调设置默认值
    onResolved = typeof onResolved === 'function' ? onResolved : value => value;

    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : reason => {
            throw reason;
          };

    return new MyPromise((resolve, reject) => {
      /* 执行指定的回调函数，并根据回调函数的执行结果改变返回出去的promise的状态和数据 */

      function handle(callback) {
        try {
          const result = callback(self.data);

          // 若回调的执行结果是promise对象，则用该执行结果的状态作为返回出去的promise的状态
          if (result instanceof MyPromise) {
            result.then(resolve, reject);
          } else {
            // 执行结果不是promise对象，则返回出去的promise就是resolved状态的，参数就是执行结果
            resolve(result);
          }
        } catch (reason) {
          // 执行错误异常，则返回出去的promise是rejected状态的，参数就是异常值
          reject(reason);
        }
      }

      if (self.status === RESOLVED) {
        // 若当前promise状态为resolved则立即异步执行成功的回调函数
        setTimeout(() => {
          handle(onResolved);
        });
      } else if (self.status === REJECTED) {
        // 若当前promise状态为rejected则立即异步执行失败的回调函数
        setTimeout(() => {
          handle(onRejected);
        });
      } else {
        // 若当前promise状态为pending则将成功和失败的回调放进callbacks队列中存储起来
        self.callbacks.push({
          onResolved(value) {
            handle(onResolved);
          },
          onRejected(reason) {
            handle(onRejected);
          }
        });
      }
    });
  }

```

整体代码不难，可能需要想一下的部分是

```js
if (result instanceof MyPromise) {
     result.then(resolve, reject);
    } 
```

这里的逻辑是，若是`then(result => {}, resson => {})`中的回调返回值是个promise实例（记做promise1）的话，那么`then(result => {}, resson => {})`本身返回的promise（记作promise2）实例的状态便和promise1保持一致；

这里的实现是这样的

```js
 return new MyPromise((resolve, reject) => {
   //
 }
 if (result instanceof MyPromise) {
     result.then(resolve, reject);
  } 

  // then()返回的新promise2对象，传入构造函数中的executor里面的resolve和reject两个方法直接给到 
  // promise1的.then()方法，那么promise1的.then()中执行resolve或者reject的时候，
  //promise2的状态也会相应改变，从而实现promise2和promise1保持一致
```

#### 3.4 实现 catch()

```js
/* 链式调用时的异常穿透，由于then()中，给onRejected设置了默认值，所以可以一路throw(reason)到catch()中，最后返回一个rejected状态的promise */
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }
 /* 链式调用时的异常穿透，打开方式，then(onResolved).then(onResolved).catch(onRejected),中间的
 then()没有传onRejected,因此使用的是onRejected的默认值，一路throw(reason) */
```

#### 3.5 实现Promise.resolve()

```js
  /* Promise构造函数上的静态属性，用于返回一个resolved状态的promise */
  static resolve(value) {
    return new MyPromise((resolve, reject) => {
      if (value instanceof MyPromise) {
        value.then(resolve, reject);
      } else {
        resolve(value);
      }
    });
  }
```

#### 3.6 实现Promise.reject()

```js
  /* Promise构造函数上的静态属性，用于返回一个resolved状态的promise */
  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason);
    });
  }
```

#### 3.7 实现Promise.all()

```js
  static all(promises) {
    const values = new Array(promises.length);
    let count = 0;

    return new MyPromise((resolve, reject) => {
      promises.forEach((item, key) => {
        MyPromise.resolve(item).then(
          value => {
            count += count;
            values[key] = value;
            // 全部执行完改变状态为resolved
            if (count === promises.length) {
              resolve(values);
            }
          },
          reason => {
            // 只要有一个promise调用失败回调了，返回出去的promise的状态就改变为rejected
            reject(reason);
          }
        );
      });
    });
  }
```

#### 3.8 实现Promise.race()

```js
  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach(item => {
        MyPromise.resolve(item).then(
          value => {
            // 遍历执行时有一个promise调用成功回调了，返回出去的promise的状态就改变为resolved
            resolve(value);
          },
          reason => {
            // 只要有一个promise调用失败回调了，返回出去的promise的状态就改变为rejected
            reject(reason);
          }
        );
      });
    });
  }
```

完整代码

```js
const PENDING = 'pending';
const RESOLVED = 'resolved';
const REJECTED = 'rejected';

class MyPromise {
  constructor(executor) {
    const self = this;
    self.status = PENDING; // 每个Promise对象的初始状态都是'pending'
    self.data = undefined; // 给promise对象制定一个用于存储结果数据的属性
    self.callbacks = []; // 回调函数存储的队列，数据结构：{onResolved(){}, onRejected(){}}

    function resolve(value) {
      if (self.status !== PENDING) return;

      self.status = RESOLVED;
      self.data = value;
      if (self.callbacks.length > 0) {
        // 用setTimeout模仿，then()中的回调放进微任务队列
        setTimeout(() => {
          self.callbacks.forEach(element => {
            element.onResolved(value);
          });
        });
      }
    }

    function reject(reason) {
      if (self.status !== PENDING) return;

      self.status = REJECTED;
      self.data = reason;
      if (self.callbacks.length > 0) {
        // 用setTimeout模仿，then()中的回调放进微任务队列
        setTimeout(() => {
          self.callbacks.forEach(element => {
            element.onRejected(reason);
          });
        });
      }
    }

    try {
      executor(resolve, reject);
    } catch (reason) {
      reject(reason);
    }
  }

  /* Promise原型上的then()方法，用于指定成功和失败的回调，返回一个新的promise对象
  返回的promise对象的状态由onResolved/onRejected执行的结果决定
  */
  then(onResolved, onRejected) {
    const self = this;

    // 给指定的回调设置默认值
    onResolved = typeof onResolved === 'function' ? onResolved : value => value;

    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : reason => {
            throw reason;
          };

    return new MyPromise((resolve, reject) => {
      /* 执行指定的回调函数，并根据回调函数的执行结果改变返回出去的promise的状态和数据 */

      function handle(callback) {
        try {
          const result = callback(self.data);

          // 若回调的执行结果是promise对象，则用该执行结果的状态作为返回出去的promise的状态
          if (result instanceof MyPromise) {
            result.then(resolve, reject);
          } else {
            // 执行结果不是promise对象，则返回出去的promise就是resolved状态的，参数就是执行结果
            resolve(result);
          }
        } catch (reason) {
          // 执行错误异常，则返回出去的promise是rejected状态的，参数就是异常值
          reject(reason);
        }
      }

      if (self.status === RESOLVED) {
        // 若当前promise状态为resolved则立即异步执行成功的回调函数
        setTimeout(() => {
          handle(onResolved);
        });
      } else if (self.status === REJECTED) {
        // 若当前promise状态为rejected则立即异步执行失败的回调函数
        setTimeout(() => {
          handle(onRejected);
        });
      } else {
        // 若当前promise状态为pending则将成功和失败的回调放进callbacks队列中存储起来
        self.callbacks.push({
          onResolved(value) {
            handle(onResolved);
          },
          onRejected(reason) {
            handle(onRejected);
          }
        });
      }
    });
  }

  /* 链式调用时的异常穿透，由于then()中，给onRejected设置了默认值，所以可以一路throw(reason)到catch()中，最后返回一个rejected状态的promise */
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  /* 自定义实现一个finally方法，无论失败还是成功都会调用 */
  finally(callback){
    return this.then(callback, callback);
  }

  /* Promise构造函数上的静态属性，用于返回一个resolved状态的promise */
  static resolve(value) {
    return new MyPromise((resolve, reject) => {
      if (value instanceof MyPromise) {
        value.then(resolve, reject);
      } else {
        resolve(value);
      }
    });
  }

  /* Promise构造函数上的静态属性，用于返回一个resolved状态的promise */
  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason);
    });
  }

  static all(promises) {
    const values = new Array(promises.length);
    let count = 0;

    return new MyPromise((resolve, reject) => {
      promises.forEach((item, key) => {
        MyPromise.resolve(item).then(
          value => {
            count += count;
            values[key] = value;
            // 全部执行完改变状态为resolved
            if (count === promises.length) {
              resolve(values);
            }
          },
          reason => {
            // 只要有一个promise调用失败回调了，返回出去的promise的状态就改变为rejected
            reject(reason);
          }
        );
      });
    });
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach(item => {
        MyPromise.resolve(item).then(
          value => {
            // 遍历执行时有一个promise调用成功回调了，返回出去的promise的状态就改变为resolved
            resolve(value);
          },
          reason => {
            // 只要有一个promise调用失败回调了，返回出去的promise的状态就改变为rejected
            reject(reason);
          }
        );
      });
    });
  }
}

module.exports = MyPromise;

```

### 4、async 和await

**async 函数**

函数的返回值为promise对象，promise对象的结果由async函数执行的返回值决定

**await 表达式**
await右侧的表达式一般为promise对象, 但也可以是其它的值；如果表达式是promise对象, await返回的是promise成功的值；如果表达式是其它值, 直接将此值作为await的返回值

**注意:**
await必须写在async函数中, 但async函数中可以没有await，

如果await的promise失败了, 就会抛出异常, 需要通过try...catch来捕获处理

### 5、JS异步之宏队列与微队列

![宏队列与微队列](http://vipkshttp1.wiz.cn/ks/share/resources/49c30824-dcdf-4bd0-af2a-708f490b44a1/92b8cbfb-a474-4859-943b-6048e9dc66f6/index_files/60b9ff398449db2dcfef9197e2187ae6.png)

1. **宏列队**: 用来保存待执行的宏任务(回调), 比如: 定时器回调/DOM事件回调/ajax回调

2. **微列队**: 用来保存待执行的微任务(回调), 比如: promise的回调/MutationObserver的回调

3. JS执行时会区别这2个队列

  JS引擎首先必须先执行所有的初始化同步任务代码，

  每次准备取出第一个宏任务执行前, 都要将所有的微任务一个一个取出来执行

