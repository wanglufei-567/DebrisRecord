## Node 进程与线程笔记（二）Child_process模块

### 一、Child_process模块简介

> **子进程 (Child Process)** 是进程中一个重要的概念。我们可以通过 Node.js 的 `child_process` 模块衍生出一个子进程，并且父子进程使用一个消息系统相互之间可以很容易地交流。
>
> `child_process` 模块使我们在一个运行良好的子进程内运行一些能够进入操作系统的命令。

在任何子进程中：

- 可以通过执行系统命令去访问控制操作系统

- 可以控制子进程的输入流，监听子进程的输出流

- 可以控制传给底层操作系统命令的参数

- 可以命令的输出做任何我们想做的事情

  比如，将一个命令的输出作为输入传递给另一个命令（就像我们在 Linux 中所做的那样），因为这么命令的输入和输出都可以使用Node流。

Node的`child_process`模块提供四种异步函数和三种同步函数的方式创建子进程：

> - child_process.spawn(command, args)
> - child_process.exec(command, options)
> - child_process.execFile(file, args[, callback])
> - child_process.fork(modulePath, args)
> - child_process.spawnSync(command, args)
> - child_process.execSync(command, options)
> - child_process.execFileSync(file, args[, callback])

**`spawn`、`exec`、`execFile`和`fork`之间的关系**

```javascript
exec 
  │
execFile         fork
  │               │     
  └─────spawn─────┘          用户层面
          │
----------│------------------------
          │
          │                  nodejs内部
          │                   
     spawn(位于lib/internal/child_process.js)
```

- 在用户层面，其它3个函数最终都是调用`child_process.spawn`
- `exec`调用了`execFile`，因此它们的性态应该是一样的（缓存了IO）

 <!--也就是说其他三种方法都是语法糖，其实都是spawn方法-->

### 二、Child_process模块具体使用

#### 2.1、`spawn`方法

`spawn` 函数在新的进程中启动一个命令，我们可以通过新的进程向命令传递任何参数

**语法：**

```js
child_process.spawn(command,[args],[options])F
```

**参数说明：**

- `command` :  要运行的命令 

- `args` : 字符串参数列表

- `options`: 

  - `shell`: 如果是 `true`，则在 shell 内运行 `command`  ,默认值为`false`
  - `cwd:` 子进程的当前工作目录 
  - `env`: 环境变量键值对，默认值：`process.env`  
  - `stdio` :  子进程的标准输入输出配置 ，默认值为`pipe`，下面👇重点说明
  - `detached`：配置子进程是否在父进程下独立运行，具体行为取决于平台，下面👇重点说明

==**options.stdio 参数说明**==

`options.stdio`用于配置父子进程之间的通信通道，`options.stdio`可以接受两种类型的值：**字符串或者数组**

- 当`options.stdio`的值是**字符串**时，它有以下几种取值
  - `pipe` ： 相当于`[“pipe”,“pipe”,“pipe”]`，子进程的`stdio`与父进程的`stdio`通过管道连接起来，
  - `ignore` ： 相当于`[“ignore”,“ignore”,“ignore”]`，子进程的stdio绑定到`/dev/null`，丢弃数据的输入输出
  - `inherit` ： 继承于父进程的相关`stdio`、即等同于`[process.stdin, process.stdout, process.stderr]`或者`[0,1,2]`，此时父子进程的stdio都是绑定到同一个地方

- 当`options.stdio`的值是**数组**的时候，前三个元素分别代表子进程的`stdin`、 `stdout` 、`stderr`

  如果数组的**元素大于3**，则会在父子进程之间建立**额外的通讯通道**，它们的值可以是下面的其中之一：

  - `pipe`：<!--额外的通讯通道--> 通过管道通讯

    - 管道的两端分别连接着父子进程，在父进程这边可以通过`child.stdio[n]（n=0、1、2）`或者`child.stdin`, `child.stdout`, `child.stderr`来引用管道的一端，而子进程则可以通过`process.stdin`, `process.stdout`, `process.stderr`来引用另外一端

  - `ipc`：<!--额外的通讯通道--> **通过`ipc channel`通道通讯**

    - 父子进程之间可以通过父进程中调用`child.send()`和子进程中调用`process.send()`进行通信

    - 父子进程可以通过`child.disconnect()`,`process.disconnect()`关闭`ipc`通道

    - 对应的方法调用会触发相应的事件`message`事件、`disconnect`事件

      <!--需要注意的是，ipc通道只支持send()的方式访问通道，另外，如果子进程不是node实例也不支持-->

  - `ignore`：绑定到`/dev/null`，即丢弃数据的输入输出

  - `Stream`对象：*额外的通讯通道* 通过nodejs中`Stream` 对象通讯，对象底层的文件描述符代表一个文件例如socket，tty、本地文件等。

  - 正整数：和`Stream`相似。

  - `null`和`undefined`：对于前3个元素，它们会被设为`pipe`，对于剩下的元素会被设置`ignore`

<!--常用的配置应该就只有，'pipe','inherit',再加上'ipc'-->

**==options.detached参数说明==**

> 在 Windows 上，将 `options.detached` 设置为 `true`，使得==**子进程在父进程退出后继续运行**==成为可能。子进程将拥有自己的控制台窗口。*一旦启用一个子进程，它将不能被禁用。*
>
> 在非 Windows 平台上，如果将 `options.detached` 设置为 `true`，那么子进程将成为新的session和group的leader者。请注意，==**子进程在父进程退出后可以继续运行，不管它们是否被分离**==。更多信息详见 `setsid(2)`。
>
> 默认情况下，父进程会等子进程被分离后才退出。为了防止父进程等待给定的 `child`，请使用 `child.unref()` 方法。这样做会导致父进程的事件循环不包括子进程的引用计数，这将允许父进程独立子进程退出，除非子进程和父进程之间建立了一个 IPC 信道。
>
> 当使用 `detached` 选项来启动一个长期运行的进程时，该进程不会在父进程退出后保持后台运行状态，除非它提供了一个不连接到父进程的 `stdio` 配置。如果该父进程的 `stdio` 被继承时，子进程会保持连接到控制终端。

<!--官网的这段描述很迷，讲的不清楚，有些地方不理解，不过暂且认为这个参数就是让子进程与父进程分离，有点类似于进程守护-->

文档描述不理解，还是看具体例子吧👇

首先开启一个子进程并设置`detached`为`true`(**如果不设置的话子进程在父进程结束后也会跟着结束**)

```js
const child_process = require("child_process");
child_process.spawn("ping", ["localhost"], {detached:true});
setTimeout(function() {console.log("hello");}, 3000);
```

此时`setTimeout`的回调可以得到执行，但是父进程会等待子进程退出，用`ctrl+c`结束父进程后子进程依然存活，并且被`init`进程收养。因为文档中说明：

> By default, the parent will wait for the detached child to exit. To prevent the parent from waiting for a given subprocess, use the subprocess.unref() method

默认情况下父进程会等待已经分离的子进程，可以调用`subprocess.unref()`来取消等待。于是按照要求加上相关代码

```JavaScript
"use strict";
const child_process = require("child_process");
const ping = child_process.spawn("ping", ["localhost"],{detached : true});
ping.unref();
setTimeout(function() {console.log("hello");}, 3000);
```

还是不行，父进程依然会等待子进程，再次查阅文档，原来还漏看了一句

> unless there is an established IPC channel between the child and parent.

如果父子进程之间建立了的ipc，父进程还是会等待。根据我们上面的总结，推论将`stdio`设置为`ignore`、描述符、`Stream`对象应该可以让父进程不再等待。

```javascript
"use strict";
const fd = require("fs").openSync("./node.log", "w+");
const writableStream = require("fs").createWriteStream("./node.log", {
	flags: "a",
	fd: fd
});
const child_process = require("child_process");
const ping = child_process.spawn("ping", ["localhost"], {
	detached: true,
	stdio: ["ignore", fd, writableStream]
});
ping.unref();
setTimeout(function() {
	console.log("hello");
}, 3000);
```

这次可以了，父进程在运行完自己的代码之后顺利退出，而子进程则继续在后台运行，同时被`init`进程收养

总结：要想让程序成为守护进程，必须要做到

- 子进程必须要和父进程分离，即设置`detached=true`
- 子进程要调用`unref()`
- 子进程的io不能跟父进程有联系

##### 2.1.1、父子进程间通信

举个🌰

```js
const { spawn } = require('child_process');
const child = spawn('pwd', {
  cwd: '/usr'
});
```

`pwd`是`shell`的命令，用于获取当前的目录，但上面的代码执行完控制台并没有任何的信息输出；

这是因为子进程`child`有自己的`stdio`流（`stdin`、`stdout`、`stderr`），控制台的输出是与当前父进程的`stdio`绑定的，因此如果希望看到输出信息，可以通过将子进程的`stdout` 与当前进程的`stdout`之间建立连接来实现；

###### 2.1.1.1、创建**父子进程间通信**的三种方式

- `options.stdio`为默认值`'pipe'`时
  - 让子进程的 `stdio` 和父进程的 `stdio` 之间建立管道链接 `child.stdout.pipe(process.stdout)`
  - 事件监听子进程的`stdio`
- `options.stdio`为`'inherit'`时
  - 父子进程之间共用 `stdio`

**`options.stdio`为默认值`'pipe'`时**

`stdio`默认不配置的情况下，也就是`stdio`为默认值`'pipe'`的情况下，`spawn()` 出来的子进程对象（假设为 `child`）中会有 `child.stdin`、`child.stdout` 和 `child.stderr` 三个 `Stream` 对象；而子进程的 `stdin`、`stdout` 和 `stderr` 三个 `fd` 会通过管道会被重定向到这三个 `child.stdin`、`child.stdout` 和 `child.stderr`  `Stream` 对象上，所以只需要将`child.stdio`和`process.stdio`建立连接即可

<!--child 对象上还有个属性stdio，是个数组，child.stdio[0-2]分别对应着child.stdin、child.stdout 和 child.stderr-->

**方式1: 通过管道连接**

`child.stdio`与`process.stdio`都是`Stream`对象，因此可以使用`pipe`方法建立两个流的通道

```js
const { spawn } = require('child_process');

const child = spawn('pwd', {
  cwd: '/usr'
});

child.stdout.pipe(process.stdout);

// /usr
```

**方式2: 事件监听**

子进程的`stdio`流都是实现了`EventEmitter API`的，所以可以添加事件监听

```js
const { spawn } = require('child_process');
const child = spawn('pwd', {
  cwd: '/usr'
});


child.stdout.on('data', data => {
  console.log(`child stdout:${data}`);
});

// child stdout:/usr
```

**`options.stdio`为`'inherit'`时**

**方式3 ：父子进程之间共用 `stdio`**

通过设置`options.stdio`为`'inherit'`，使父子进程之间共用 同一个`stdio`，那么子进程中的输出就自动输出到父进程了

```js
const { spawn } = require('child_process');
const child = spawn('pwd', {
  stdio: 'inherit'
});
```

###### 2.1.1.2、ipc通道通信方式

`ipc`通道通信要求子进程需要为`node`实例

```js
// child.js
let str = '123';
console.log(str);

if(process.connected) {
  process.send({
    childrenData: 'child'
  });
  process.on('message', (m) => {
    console.log('child got message:', m);
    process.disconnect()
    console.log('process.connected:', process.connected)
  });
}
```

```js
// parent.js
const cp = require('child_process');
const child = cp.spawn('node', ['./child.js'], {
  stdio: ['inherit','inherit','inherit', 'ipc']
});
if(child.connected) {
  child.on('message', (data) => {
    console.log('parent got message:', data);
  });

  setTimeout(()=>{
    child.send({
      parentData: 'parent'
    });
  }, 1000)
}

child.on('exit', () => {
  console.log('child.connected', child.connected);
  console.log('child process exit');
  process.exit(0);
});

// 控制台输出
// 123
// parent got message: { childrenData: 'child' }
// child got message: { parentData: 'parent' }
// process.connected: false
// child process exit false
```

`ipc`通道打开后，父子进程便不会退出，因此需要调用`disconnect`方法关闭`ipc`通道，允许子进程正常退出而不会由于`ipc`通道的打开而持续运行，之后子进程上的属性`connected`会被置为`false`（一开始为`ture`）

##### 2.1.2、进程事件

`spawn`函数返回一个`ChildProcess` 的实例，该实例继承了`EventEmitter`，那么便可以在子进程实例上添加事件的回调函数

举个🌰

```js
const cp = require('child_process');

const child = cp.spawn('pwd', {
  cwd: '/usr',
});

child.on('error', chunk => {
  console.log('child error! ', chunk);
})

child.on('exit', (exitCode, signalCode) => {
  console.log('child exit! ', exitCode, ' ', signalCode);
});

child.on('close', (exitCode, signalCode) => {
  console.log('child close! ', exitCode, ' ', signalCode);
});
```

进程实例主要包含以下事件:

- `exit`事件

  - `code` 子进程退出时的退出码
  - `signal` 子进程退出时的终止信号

  当子进程结束时触发 `exit` 事件。如果进程退出，`code` 会是进程的最终退出码，否则会是 `null`。如果进程是由于收到的信号而终止的，`signal` 会是信号的字符串名称，否则会是 `null`。这两个将总有一个是非空的

  <!--注意，当 exit 事件触发时，子进程的 stdio 流仍可能打开着-->

- `error`事件

  - `err` 错误对象

  每当出现以下情况时触发 `error` 事件：

  1. 该进程无法被衍生时；
  2. 该进程无法被杀死时；
  3. 向子进程发送信息失败时

- `close`事件

  - `code`  如果子进程退出自身，该值会是退出码
  - `signal` 子进程被终止时的信号

  当子进程的 stdio 流被关闭时触发 `close` 事件。这与 `exit` 事件不同，因为多个进程可能共享相同的 `stdio` 流

- `message`事件

  - `message` 一个已解析的 JSON 对象或原始值。
  - `sendHandle` 一个 [net.Socket](https://www.bookstack.cn/read/nodejs-api-doc-cn/net-class_net_Socket.md#) 或 [net.Server](https://www.bookstack.cn/read/nodejs-api-doc-cn/net-class_net_Server.md#) 对象，或是 `undefined`。

  当一个子进程使用 `process.send()` 发送信息时会触发 `'message'` 事件

- `disconnect`事件

  在父进程或子进程中调用 `ChildProcess.disconnect()` 后触发 `'disconnect'` 事件。在断开后它将不能再发送或接收信息，并且 `ChildProcess.connected` 属性会被设为 `false`

#### 2.2、`exec`方法与`execFile`方法

`child_process.exec`：产生一个`shell`客户端，然后使用`shell`来执行程序，当完成的时候传递给**回调函数**一个`stdout`和`stderr`

`child_process.execFile`：和`exec`相似，但是他不会马上产生一个`shell`

**exec方法**

**语法：**

```js
child_process.exec(command [, options] [, callback(error, stdout, stderr)])
```

**参数说明：**

- `cwd`：当前工作路径

- `env`：环境变量

- `encoding`：编码，默认是`utf8`

- `shell`：用来执行命令的shell，unix上默认是`/bin/sh`，windows上默认是`cmd.exe`

- `timeout`：默认是0

  <!--如果timeout大于0，那么，当子进程运行超过timeout毫秒，那么，就会给进程发送killSignal指定的信号（比如SIGTERM）-->

- `killSignal`：默认是`SIGTERM`

- `uid`：执行进程的uid

- `gid`：执行进程的gid

- `maxBuffer`： 标准输出、错误输出最大允许的数据量（单位为字节），如果超出的话，子进程就会被杀死，默认是200*1024（就是200k）

<!--如果运行没有出错，那么error为null。如果运行出错，那么，error.code就是退出代码（exist code），error.signal会被设置成终止进程的信号。（比如CTRL+C时发送的SIGINT)-->

举个🌰

```js
var exec = require('child_process').exec;

// 成功的例子
exec('ls -al', function(error, stdout, stderr){
    if(error) {
        console.error('error: ' + error);
        return;
    }
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + typeof stderr);
});

// 失败的例子
exec('ls hello.txt', function(error, stdout, stderr){
    if(error) {
        console.error('error: ' + error);
        return;
    }
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
});
```

上面的代码产生一个`shell`，然后使用这个`shell`执行命令，同时对产生的结果进行缓存。其中回调函数中的`error.code`属性表示子进程的`exit code`，`error.signal`表示结束这个进程的信号，任何非0的代码表示出现了错误。

**execFile方法**

**语法：**

```js
child_process.execFile(file[, args][, options][, callback])
```

其中`file`表示需要执行的文件。 `child_process.execFile()`和`.exec()`很相似，但是这个方法不会产生一个`shell`。指定的可执行文件会马上产生一个新的线程，因此其效率比`child_process.exec`高。

举个🌰

```js
const execFile = require('child_process').execFile; 
const child = execFile('node', ['--version'], (error, stdout, stderr) => { 
 if (error) { 
  throw error; 
 } 
 console.log(stdout); 
});
```

因为不会产生`shell`,一些`I/O redirection`和`file globbing`这些行为不支持

**`exec`与`execFile`两种方法的区别**

先来看看`exec`的源码

```javascript
function normalizeExecArgs(command, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }

  // Make a shallow copy so we don't clobber the user's options object.
  options = Object.assign({}, options);
  //如果指定了shell，则把它传递下去，否则将它设为true
  options.shell = typeof options.shell === 'string' ? options.shell : true;

  return {
    file: command,
    options: options,
    callback: callback
  };
}

exports.exec = function(command /*, options, callback*/) {
  var opts = normalizeExecArgs.apply(null, arguments);
  //其实就是简单调用execFIle
  return exports.execFile(opts.file,
                          opts.options,
                          opts.callback);
};
```

原来就是调用`execFile`，那么无需多言直接看`execFile`就可以了，值得一提的是文档中说`exec`会开启一个shell来执行命令，在代码中的体现是把`options.shell`设置为`true`，后续的函数根据这个来属性来决定是否开启一个shell执行命令。

再来看看`exec`的源码的关键部分

```JavaScript
exports.execFile = function(file /*, args, options, callback*/) {
 //......	
 //直接调用spawn，但是传入了一些选项
  var child = spawn(file, args, {
    cwd: options.cwd,
    env: options.env,
    gid: options.gid,
    uid: options.uid,
    shell: options.shell,
    windowsHide: !!options.windowsHide,
    windowsVerbatimArguments: !!options.windowsVerbatimArguments
  });

  //......
  //调用完spawn之后会缓存子进程的stdout和stderr
  if (child.stdout) {
    if (encoding)
      child.stdout.setEncoding(encoding);//如果不是buffer类型，则是指编码

    child.stdout.on('data', function onChildStdout(chunk) {
    	//如果是buffer类型，则加上收到的字节数，否则，加上收到的字符串
      stdoutLen += encoding ? Buffer.byteLength(chunk, encoding) : chunk.length;

      if (stdoutLen > options.maxBuffer) {//判断是否超出内部的buffer，如果你的子进程的输出很大，请注意调整这个参数
        ex = new errors.RangeError('ERR_CHILD_PROCESS_STDIO_MAXBUFFER',
                                   'stdout');
        kill();
      } else if (encoding) {
        _stdout += chunk;//缓存字符串
      } else {
        _stdout.push(chunk);//缓存buffer
      }
    });
  }
  //......
  //监听子进程io流的关闭和子进程的错误，用户提供的callback会在这里被调用
  //上面被缓存的输出会当做参数传递过去
  child.addListener('close', exithandler);
  child.addListener('error', errorhandler);

  return child;
};
```

从上述代码可以清晰看到`execFile`就是调用了`spawn`并且将子进程的输出**缓存起来然后通过回调一次过返回给用户**。

`spawn`中是通过监听stdio上面的事件来获取子进程的输出（并且输出还不是一次返回），这有些繁琐。 **`execFile`对其适当地封装使之变成了我们熟悉的回调方式，这应该就是`execFile`的优点**。

 值得注意的是里面作为缓存的buffer是有默认大小的（默认为200 x 1024个字节），在项目中曾经试过因为子进程的输出太大导致抛出异常，因此`execFile`适合子进程的输出不是太大的情况，或者修改`maxBuffer`提供更大的缓存空间。

**在windows平台上执行.bat和.cmd：**

`child_process.exec`和`child_process.execFile`的不同之处可能随着平台不同而有差异。

在Unit/Linux/OSX平台上`execFile`更加高效，因为他不会产生`shell`。

在windows上，`.bat/.cmd`在没有终端的情况下是无法执行的，因此就无法使`用execFile`（`child_process.spawn`也无法使用）。

在window上，`.bat/.cmd`可以使用`spawn`方法，同时指定一个`shell`选项；或者使用`child_process.exec`或者通过产生一个`cmd.exe`同时把`.bat/.cmd`文件传递给它作为参数（`child_process.exec`就是这么做的）。

```js
const spawn = require('child_process').spawn; 
const bat = spawn('cmd.exe', ['/c', 'my.bat']);//使用shell方法指定一个shell选项 
bat.stdout.on('data', (data) => { 
 console.log(data); 
}); 
bat.stderr.on('data', (data) => { 
 console.log(data); 
}); 
 
bat.on('exit', (code) => { 
 console.log(`Child exited with code $[code]`); 
}); 
```

或者也可以使用如下的方式：

```js
const exec = require('child_process').exec;//产生exec，同时传入.bat文件 
exec('my.bat', (err, stdout, stderr) => { 
 if (err) { 
  console.error(err); 
  return; 
 } 
 console.log(stdout); 
}); 
```

#### 2.3、`fork`方法

`child_process.fork`：**==产生一个新的Node.js进程，同时执行一个特定的模块来产生IPC通道，进而在父进程和子进程之间传输数据==**

<!--应该是最常用的方法-->

**语法：**

```js
child_process.fork(modulePath[, args][, options])
```

**参数说明：**

- `execPath`： 用来创建子进程的可执行文件，默认是`/usr/local/bin/node`。也就是说，你可通过`execPath`来指定具体的node可执行文件路径。（比如多个node版本）
- `execArgv`： 传给可执行文件的字符串参数列表。默认是`process.execArgv`，跟父进程保持一致
- `silent`： 默认是`false`，即子进程的`stdio`从父进程继承。如果是`true`，则直接`pipe`向子进程的`child.stdin`、`child.stdout`等
- `stdio`： 如果声明了`stdio`，则会覆盖`silent`选项的设置

`fork`方法是`child_process.spawn`的一种特殊用法，用于产生一个Node.js的子进程，和`spawn`一样返回一个`ChildProcess`对象。返回的`ChildProcess`会有一个**内置的传输通道**(`ipc`通道)用于在子进程和父进程之间传输数据(用ChildProcess的`send`方法完成)

产生的Node.js进程和父进程之间是独立的，除了他们之间的`ipc`传输通道以外。每一个进程有独立的内存，有自己独立的V8引擎。由于产生一个子进程需要其他额外的资源分配，==**因此产生大量的子进程不被提倡**==。

默认情况下，`child_process.fork`会使用父进程的`process.execPath`来产生一个Node.js实例，`options`中的`execPath`允许指定一个新的路径。通过指定`execPath`产生的新的进程和父进程之间通过文件描述符(子进程的环境变量`NODE_CHANNEL_FD`)来通信。这个文件描述符上的`input/output`应该是一个JSON对象。

和POSIX系统调用`fork`不一样的是，`child_process.fork`不会克隆当前的进程

**举个🌰**

```js
// parent.js
var child_process = require('child_process');

var child = child_process.fork('./child.js');

child.on('message', function(m){
    console.log('message from child: ' + JSON.stringify(m));
});

child.send({from: 'parent'});
```

```js
// child.js
process.on('message', function(m){
    console.log('message from parent: ' + JSON.stringify(m));
});

process.send({from: 'child'});
```

**打印结果**

```
message from child: {"from":"child"}
message from parent: {"from":"parent"}
```

### 三、总结

子进程 (`Child Process`) 是进程中一个重要的概念。我们可以通过 Node.js 的 `child_process` 模块衍生出一个子进程，并且父子进程使用一个消息系统相互之间可以很容易地交流。

`child_process` 模块使我们在一个运行良好的子进程内运行一些能够进入操作系统的命令。

父进程可以控制子进程的输入流，并且监听它的输出流。也可以控制传递给潜在的操作系统命令的参数，我们可以通过那个命令的输出做我们想做的事情。比如：可以将一个命令的输出作为另一个的输入，因为哪些命令的输入和输出都是使用流的形式呈现给我们。

Node.js 的 child_process 内置模块提供了几种创建子进程的四种方式：

- `child_process.spawn()`：适用于返回大量数据，例如图像处理，二进制数据处理
- `child_process.exec()`：适用于小量数据，maxBuffer 默认值为 200 * 1024 超出这个默认值将会导致程序崩溃，数据量过大可采用 spawn
- `child_process.execFile()`：类似 `child_process.exec()`，区别是不能通过 shell 来执行，不支持像 I/O 重定向和文件查找这样的行为
- `child_process.fork()`：衍生新的进程，进程之间是相互独立的，每个进程都有自己的 V8 实例、内存，系统资源是有限的，不建议衍生太多的子进程出来，通常根据系统 CPU 核心数设置

### 参考文章

[Node Guidebook 子进程](https://tsejx.github.io/node-guidebook/system/process/child-process/)

[请务必给 child_process 加上 on('data') 处理](https://developer.aliyun.com/article/771840)

[Nodejs进阶：如何玩转子进程（child_process）](https://developer.aliyun.com/article/66084#slide-7)

[child_process和IPC探究](https://cnodejs.org/topic/5aa0e25a19b2e3db18959bee)

[详解从Node.js的child_process模块来学习父子进程之间的通信](https://m.yisu.com/zixun/191642.html)


