引入文件

```
//通过require来引入
require("./aModule"); //注意一定要有"./"，文件后缀可加可不加。
```

导出文件

通过module.exports 导出

```
module.exports = {
    a:"我是a的值",
    b(){
        console.log("我是导出的b函数");
    }
}
```

引入

```
let mymodule = require("bModule");
console.log(mymodule.a);
mymodule.b();
```

通过  exports来导出；exports是module.exports的引用

```
exports.fn = function(){
    console.log("我是fn函数");  
}


let myfn = require("bModule").fn;
myfn();
// 或者 通过解构赋值 
let { fn } = require("bModule");
fn();
```


