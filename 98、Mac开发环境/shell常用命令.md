## 常用的 shell 命令

### 一、什么是shell

> Shell 是 Linux 系统中的命令解释器，它是连接用户和 Linux 内核的桥梁
>
> 用户在终端中输入的命令首先被 Shell 解析，然后传递给操作系统执行
>
> 常见的 Shell 包括 Bash（Bourne Again Shell）、Zsh、Fish 等

### 二、常用命令

#### 查看端口占用的进程信息

```shell
lsof -i:端口号

# lsof -i:8000
COMMAND   PID USER   FD   TYPE   DEVICE SIZE/OFF NODE NAME
nodejs  26993 root   10u  IPv4 37999514      0t0  TCP *:8000 (LISTEN)
```

#### **netstat -tunlp** 用于显示 tcp，udp 的端口和进程等相关情况

```shell
netstat -tunlp | grep 端口号
```

#### 查看tcp端口占用情况

```shell
netstat -anvp tcp
```

**查看进程状态**

```shell
top -pid pid
```

**查看子进程**

```shell
pstree -p pid
```

**查看线程**

```shell
ps -M pid
```

#### kill杀掉端口

```shell
kill -9 PID
```

**查看 IP**

```shell
ifconfig
```

