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


