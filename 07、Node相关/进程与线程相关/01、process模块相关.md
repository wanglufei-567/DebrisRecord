## Node 进程与线程笔记（一）process模块

### 一、process模块简介

`process`对象是 Node 的一个全局对象，提供当前 Node 进程的信息，不需要使用`require()`加载即可使用。

`process`模块主要做两方面的事情

- 获取进程信息
  - 资源使用
  - 运行环境
  - 运行状态
- 执行进程操作
  - 监听事件
  - 调度任务
  - 发出警告

详细的讲解内容可以看👇这篇文章

[Node.js process 模块解读](https://juejin.cn/post/6844903614784225287)

### 二、process模块中常用的属性与方法

下面👇是`process`模块常用的属性和方法

- `process.env`：环境变量，例如通过 `process.env.NODE_ENV` 获取不同环境项目配置信息
- `process.nextTick`：这个在谈及 `EventLoop` 时经常为会提到
- `process.pid`：获取当前进程id
- `process.ppid`：当前进程对应的父进程
- `process.cwd()`：获取当前进程工作目录，
- `process.platform`：获取当前进程运行的操作系统平台
- `process.uptime()`：当前进程已运行时间，例如：pm2 守护进程的 uptime 值
- 进程事件： `process.on(‘uncaughtException’,cb)` 捕获异常信息、 `process.on(‘exit’,cb）`进程推出监听
- 三个标准流： `process.stdout` 标准输出、 `process.stdin` 标准输入、 `process.stderr` 标准错误输出
- `process.title` 指定进程名称，有的时候需要给进程指定一个名称

### 

### 参考文章

[Node.js process 模块解读](https://juejin.cn/post/6844903614784225287)

[深入理解Node.js 进程与线程](https://mp.weixin.qq.com/s/fkrHHMwx75NLhvv4P3rk-w)


