## fs模块

- fs是文件操作模块，所有文件操作都是有同步和异步之分，特点是同步会加上 "Sync" 如：异步读取文件  "readFile"，同步读取文件 "readFileSync"；

  文件操作

  - 文件读取：

    - 异步读取

    ```js
    let fs = require("fs");
    fs.readFile("1.txt",(err,data)=>{
        if(err){
            return console.log(err);
        }
        console.log(data.toString());
    })
    ```

    - 同步读取文件

    ```js
    let fs = require("fs");
    let res = fs.readFileSync("1.txt");
    console.log(res.toString());
    ```

  - 文件写入：

    ```js
    let fs = require("fs");
    //flag配置  "a":追加写入，"w":写入，"r":读取
    fs.writeFile("2.txt","我是要写入的内容",{flag:"w"},err=>{
        if(err){
            return console.log(err);
        }
        console.log("写入成功");   
    })
    ```

  - 文件删除

    ```js
    fs.unlink("2.txt",err=>{
        if(err){
            return console.log(err);
        }
        console.log("删除成功");
    })
    ```

  - 复制文件

    - 先读取文件再写入文件

    ```js
    function mycopy(src,dest){
       fs.writeFileSync(dest,fs.readFileSync(src));
    }
    mycopy("1.txt","4.txt");
    ```

  - 修改文件名，目录也可以通过rename来操作

    ```js
    fs.rename("1.txt","5.txt",function (err) {
        if(err){
            console.log(err);
        }else{
            console.log("修改成功");
        }
    });
    ```

  - 判断文件是否存在

    ```js
    fs.exists("4.txt",function (exists) {
        console.log(exists);
    })
    ```

### 