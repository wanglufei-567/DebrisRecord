## TCP协议学习笔记

#### 写在前面

主要是学习以下几篇博客的笔记

[TCP可靠性的体现：seq和ack机制](https://www.jianshu.com/p/4e917b933dc5 )

[TCP协议详解](https://www.jianshu.com/p/ef892323e68f)

### 一、TCP三次握手

所谓**三次握手**（**Three-Way Handshake**）即建立 **TCP** 连接，就是指建立一个 **TCP** 连接时，需要客户端和服务端总共发送3个包以确认连接的建立

在`socket`编程中，这一过程由客户端执行`connect`来触发，整个流程如下图所示：

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/webp)



1. **第一次握手**：**Client** 将标志位 **SYN** 置为 1，随机产生一个值 `seq=J` ，并将该数据包发送给 **Server**，**Client** 进入 **SYN_SENT** 状态，等待 **Server** 确认
2. **第二次握手**：**Server** 收到数据包后由标志位 **SYN=1** 知道 **Client** 请求建立连接，**Server** 将标志位 **SYN** 和 **ACK** 都置为 1，`ack=J+1`，随机产生一个值 `seq=K`，并将该数据包发送给 **Client** 以确认连接请求，**Server** 进入 **SYN_RCVD** 状态
3. **第三次握手**：**Client** 确认后，检查 `ack` 是否为 `J+1`，**ACK** 是否为 1，如果正确则将标志位 **ACK** 置为 1，`ack=K+1`，并将该数据包发送给 **Server**，**Server** 检查 `ack` 是否为 `K+1`，**ACK** 是否为 1，如果正确则连接建立成功，**Client** 和 **Server** 进入 **ESTABLISHED** 状态，完成三次握手，随后 **Client** 与 **Server** 之间可以开始传输数据了

简单来说，就是

1、建立连接时，客户端发送 **SYN** 包（`SYN=i`）到服务器，并进入到 **SYN-SEND** 状态，等待服务器确认

2、服务器收到 **SYN** 包，必须确认客户的 **SYN**（`ack=i+1`）,同时自己也发送一个 **SYN** 包（`SYN=k`）,即 **SYN+ACK** 包，此时服务器进入 **SYN-RECV** 状态

3、客户端收到服务器的 **SYN+ACK** 包，向服务器发送确认报 **ACK**（`ack=k+1`）,此包发送完毕，客户端和服务器进入 **ESTABLISHED** 状态，完成三次握手，客户端与服务器开始传送数据

------

**举个例子**：

假设 Alice 想给 Bob 打电话

1. **第一次握手**：
   - Alice 拨通 Bob 的电话，电话响铃（发送 SYN）
   - Bob 听到电话铃声（接收 SYN）
2. **第二次握手**：
   - Bob 接起电话并说：“喂，是 Alice 吗？”（发送 SYN-ACK）
   - Alice 听到 Bob 的声音（接收 SYN-ACK）
3. **第三次握手**：
   - Alice 回答：“是的，Bob，我是 Alice。”（发送 ACK）
   - Bob 听到 Alice 的回答，确认是 Alice（接收 ACK）

这样，电话连接建立，Alice 和 Bob 可以正常通话

### 二、TCP可靠性的体现：seq和ack机制

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/webp-20220517085330776" alt="img" style="zoom:50%;" />

**顺序号seq**：用来标识从TCP源端向TCP目的端发送的数据字节流，它表示在这个报文段中的第一个数据字节的顺序号

理解起来就是TCP用顺序号对每个字节进行计数。当建立一个新的连接时，顺序号字段包含由这个主机选择的该连接的初始顺序号 ISN （ Initial Sequence Number ），也就是说seq并不一定是从0开始的，所以刚在画TCP三次握手的时候，写的seq=x，即使还没有数据传输，seq包含了ISN后就成了一个随机数，并不是0

**确认号ack**：理解起来就一句话，所期望收到的下一个顺序号seq

TCP为应用层提供全双工服务，这意味数据能在两个方向上独立地进行传输，也就是说服务端和客户端都可能成为数据接收或者数据发送的一端

数据发送端在发送TCP报文时，计算在本次seq计数内，之前所有发送的报文中数据长度之和是多少，也就是计数记到哪里了，这就是seq。然后再计算之前所有收到的报文中收到的数据长度之和是多少，这就是ack

需要注意的是seq和ack是分开计数的

需要注意的是，SYN和FIN的TCP报文传输虽然没有数据，但是数据长度算1，ACK的传输，数据长度算0

数据接收端收到TCP报文后，将这次报文中的seq取出来，和自己最后一次发送的ack对比，如果一致，则代表数据没有丢失，理解起来就是这次的顺序号和上次自己期望的顺序号一致嘛。如果不一致就说明有丢包发生。其实就是TCP用0~对每个字节进行计数

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/webp-20220517085411003)

**三个过程：**

A在发送某个TCP报文前，发现此时自己这边的seq计数已经到了x，那这次的报文中seq=x，也就是在一次seq计数内，该端之前所有发送的报文中数据长度之和为x。然后这次又在这个报文中携带了长度为100bit的数据。

B在收到这个报文后，拿到报文中的seq=x，又拿到了长度为100bit的数据，然后回包的时候ack=x+100。意思是告诉B你已经发了x+100位的数据了，下次发包的时候别忘了把seq改成x+100。

A收到B回的数据包后，拿到报文中的ack=x+100，然后和自己这边的计数着的seq一比对，如果一样，说明A发的B都收到了没问题，如果不一样，假如A一看自己这边的seq已经等于y了，也就是自己计数着的已经发送y位的数据了，可是听B的意思它才收到x+100位数据，丢包了呗。然后就是重发什么的是TCP的另外一些机制。

### 三、TCP四次挥手

所谓**四次挥手**（**Four-Way Wavehand**）即终止 **TCP** 连接，就是指断开一个 **TCP** 连接时，需要客户端和服务端总共发送4个包以确认连接的断开

在`socket`编程中，这一过程由客户端或服务端任一方执行`close`来触发，整个流程如下图所示：

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/webp-20220517085419323)

由于TCP连接时全双工的，因此，每个方向都必须要单独进行关闭，这一原则是当一方完成数据发送任务后，发送一个FIN来终止这一方向的连接，收到一个FIN只是意味着这一方向上没有数据流动了，即不会再收到数据了，但是在这个TCP连接上仍然能够发送数据，直到这一方向也发送了FIN

首先进行关闭的一方将执行主动关闭，而另一方则执行被动关闭，上图描述的即是如此

1. **第一次挥手**：Client发送一个FIN，用来关闭Client到Server的数据传送，Client进入FIN_WAIT_1状态
2. **第二次挥手**：Server收到FIN后，发送一个ACK给Client，确认序号为收到序号+1（与SYN相同，一个FIN占用一个序号），Server进入CLOSE_WAIT状态
3. **第三次挥手**：Server发送一个FIN，用来关闭Server到Client的数据传送，Server进入LAST_ACK状态
4. **第四次挥手**：Client收到FIN后，Client进入TIME_WAIT状态，接着发送一个ACK给Server，确认序号为收到序号+1，Server进入CLOSED状态，完成四次挥手

------

**举个例子**：

假设 Alice 和 Bob 正在通电话，现在他们想结束通话

1. **第一次挥手**：
   - Alice 说：“我这边说完了，可以挂电话了。”（发送 FIN）
   - Bob 听到 Alice 的话（接收 FIN）
2. **第二次挥手**：
   - Bob 回答：“好的，我知道了，但我这边还有话没说完。”（发送 ACK）
   - Alice 听到 Bob 的回答（接收 ACK）
3. **第三次挥手**：
   - Bob 说完他的内容后，说：“我这边也说完了，我们挂电话吧。”（发送 FIN）
   - Alice 听到 Bob 的话（接收 FIN）
4. **第四次挥手**：
   - Alice 回答：“好的，挂电话吧。”（发送 ACK）
   - Bob 听到 Alice 的回答（接收 ACK），然后挂断电话
   - Alice 等 Bob 确认挂断后，也挂断电话

通过这些步骤，Alice 和 Bob 安全地结束了通话