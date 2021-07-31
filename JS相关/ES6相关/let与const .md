```
for(var i = 0; i < 10; i++){
  // for()这一步是同步的，并且重复给i赋值,导致下面的异步代码最后打印的是10
  setTimeout(() => {
    console.log('i', i)
  });
}

for(let i = 0; i < 10; i++){
  // 使用let的话，{.....}这个块作用域中的i是唯一且不会变的，所以打印值是1、2、3......
  setTimeout(() => {
    console.log('i', i)
  });
}
```

<img src="/Users/didi/Documents/assets/执行上下文.jpg" alt="执行上下文" style="zoom:20%;" />









