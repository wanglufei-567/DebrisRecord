## CommonJS相关

### 一、基本使用

导出文件

```js
// 通过module.exports 导出
module.exports = {
    a:"我是a的值",
    b(){
        console.log("我是导出的b函数");
    }
}

// 或者通过exports来导出
// exports是module.exports的引用
exports.fn = function(){
    console.log("我是fn函数");  
}
```

引入文件

```js
// 通过require来引入
require("./aModule"); //注意一定要有"./"，文件后缀可加可不加

// 通过变量接收引入的内容
let mymodule = require("bModule");
console.log(mymodule.a);
mymodule.b();


// require("bModule")方法执行的结果就是module.exports的值
let myfn = require("bModule").fn;
myfn();
// 或者 通过解构赋值 
let { fn } = require("bModule");
fn();
```

### 二、CommonJS的原理









[`delete require.cache[__filename\]`是用于清除Node.js中的模块缓存的语句。](https://blog.csdn.net/wang1006008051/article/details/111240112)[1](https://blog.csdn.net/wang1006008051/article/details/111240112)[2](https://stackoverflow.com/questions/23685930/clearing-require-cache)[3](https://juejin.cn/post/7036744678749765640)

[在Node.js中，当您使用require()函数加载模块时，Node.js会将模块缓存起来，以便下次使用时可以更快地加载。但是，有时您可能需要清除缓存并重新加载模块。这就是使用`delete require.cache[__filename\]`的情况。](https://blog.csdn.net/wang1006008051/article/details/111240112)[1](https://blog.csdn.net/wang1006008051/article/details/111240112)

[其中，__filename是Node.js中的全局变量，表示当前模块的文件名。](https://juejin.cn/post/7036744678749765640)[3](https://juejin.cn/post/7036744678749765640)

