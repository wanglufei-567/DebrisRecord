## TCP协议学习笔记

#### 写在前面

主要是学习以下几篇博客的笔记

[TCP可靠性的体现：seq和ack机制](https://www.jianshu.com/p/4e917b933dc5 )

[TCP协议详解](https://www.jianshu.com/p/ef892323e68f)

### TCP三次握手

所谓**三次握手**（Three-Way Handshake）即建立TCP连接，就是指建立一个TCP连接时，需要客户端和服务端总共发送3个包以确认连接的建立。在`socket`编程中，这一过程由客户端执行`connect`来触发，整个流程如下图所示：

![img](https://upload-images.jianshu.io/upload_images/2964446-aa923712d5218eeb.png?imageMogr2/auto-orient/strip|imageView2/2/w/517/format/webp)

（1）第一次握手：Client将标志位SYN置为1，随机产生一个值seq=J，并将该数据包发送给Server，Client进入SYN_SENT状态，等待Server确认。

（2）第二次握手：Server收到数据包后由标志位SYN=1知道Client请求建立连接，Server将标志位SYN和ACK都置为1，ack=J+1，随机产生一个值seq=K，并将该数据包发送给Client以确认连接请求，Server进入SYN_RCVD状态。

（3）第三次握手：Client收到确认后，检查ack是否为J+1，ACK是否为1，如果正确则将标志位ACK置为1，ack=K+1，并将该数据包发送给Server，Server检查ack是否为K+1，ACK是否为1，如果正确则连接建立成功，Client和Server进入ESTABLISHED状态，完成三次握手，随后Client与Server之间可以开始传输数据了。

简单来说，就是

1、建立连接时，客户端发送SYN包（SYN=i）到服务器，并进入到SYN-SEND状态，等待服务器确认

2、服务器收到SYN包，必须确认客户的SYN（ack=i+1）,同时自己也发送一个SYN包（SYN=k）,即SYN+ACK包，此时服务器进入SYN-RECV状态

3、客户端收到服务器的SYN+ACK包，向服务器发送确认报ACK（ack=k+1）,此包发送完毕，客户端和服务器进入ESTABLISHED状态，完成三次握手，客户端与服务器开始传送数据。

------

### TCP可靠性的体现：seq和ack机制

<img src="https://upload-images.jianshu.io/upload_images/26124984-e76180b4b38df155.png?imageMogr2/auto-orient/strip|imageView2/2/w/958/format/webp" alt="img" style="zoom:50%;" />

**顺序号seq**：用来标识从TCP源端向TCP目的端发送的数据字节流，它表示在这个报文段中的第一个数据字节的顺序号。

理解起来就是TCP用顺序号对每个字节进行计数。当建立一个新的连接时，顺序号字段包含由这个主机选择的该连接的初始顺序号 ISN （ Initial Sequence Number ），也就是说seq并不一定是从0开始的，所以刚在画TCP三次握手的时候，写的seq=x，即使还没有数据传输，seq包含了ISN后就成了一个随机数，并不是0。

**确认号ack**：理解起来就一句话，所期望收到的下一个顺序号seq。

TCP为应用层提供全双工服务，这意味数据能在两个方向上独立地进行传输，也就是说服务端和客户端都可能成为数据接收或者数据发送的一端。

数据发送端在发送TCP报文时，计算在本次seq计数内，之前所有发送的报文中数据长度之和是多少，也就是计数记到哪里了，这就是seq。然后再计算之前所有收到的报文中收到的数据长度之和是多少，这就是ack。

需要注意的是seq和ack是分开计数的。

需要注意的是，SYN和FIN的TCP报文传输虽然没有数据，但是数据长度算1，ACK的传输，数据长度算0。

数据接收端收到TCP报文后，将这次报文中的seq取出来，和自己最后一次发送的ack对比，如果一致，则代表数据没有丢失，理解起来就是这次的顺序号和上次自己期望的顺序号一致嘛。如果不一致就说明有丢包发生。其实就是TCP用0~对每个字节进行计数

![img](https://upload-images.jianshu.io/upload_images/26124984-42319b49c7e9517f.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

**三个过程：**

A在发送某个TCP报文前，发现此时自己这边的seq计数已经到了x，那这次的报文中seq=x，也就是在一次seq计数内，该端之前所有发送的报文中数据长度之和为x。然后这次又在这个报文中携带了长度为100bit的数据。

B在收到这个报文后，拿到报文中的seq=x，又拿到了长度为100bit的数据，然后回包的时候ack=x+100。意思是告诉B你已经发了x+100位的数据了，下次发包的时候别忘了把seq改成x+100。

A收到B回的数据包后，拿到报文中的ack=x+100，然后和自己这边的计数着的seq一比对，如果一样，说明A发的B都收到了没问题，如果不一样，假如A一看自己这边的seq已经等于y了，也就是自己计数着的已经发送y位的数据了，可是听B的意思它才收到x+100位数据，丢包了呗。然后就是重发什么的是TCP的另外一些机制。