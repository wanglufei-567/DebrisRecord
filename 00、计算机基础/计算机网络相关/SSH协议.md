这里只是学习笔记，这篇文章写的比较详细[深入了解SSH](https://blog.haojunyu.com/post/deep_ssh)

### 前言

**SSH**(安全外壳协议)安全外壳协议,是一种***加密的***网络传输***协议***，可在不安全的网络中网络服务提供安全的传输环境。它通过在网络中创建安全隧道来实现 SSH 客户端和服务器之间的连接。SSH同HTTPS一样是一种协议，整个通信过程都是加密的。

### 原理介绍

#### 对称加密

对称加密就是加密或解密使用的是同一个秘钥。

![](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/20220517084842.png)

对称加密的优点是加解密效率高，速度快。缺点是秘钥的管理和分发比较困难，不安全。

#### 非对称加密

非对称加密需要一对秘钥来进行加密和解密，公开的秘钥叫公钥，私有的秘钥叫私钥。注意公钥加密的信息**只有**私钥才能解开（加密过程），私钥加密的信息**只有**公钥才能解开（验签过程）。

![ssh_asymmetric](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/ssh_asymmetric.png)

非对称加密的优点是安全性更高，秘钥管理比较方便，每个服务器只要维护一对公私钥即可。缺点是加解密耗时长，速度慢。

#### 登陆流程

1. 版本号协商阶段
2. 密钥和算法协商阶段
   服务端和客户端分别发送算法协商报文给对方，报文中包含自己支持的公钥算法列表、加密算法列表、消息验证码算法列表、压缩算法列表等。服务端和客户端根据对方和自己支持的算法得出最终使用的算法。服务端和客户端利用 DH 交换算法、主机密钥对等参数，生成会话密钥和会话 ID。
3. 认证阶段( publickey > gssapi-keyex > gssapi-with-mic > password )
4. 会话请求阶段
5. 会话交互阶段

#### 密码登陆

密码登陆的认证流程如下：

1. 客户端使用密钥和算法协商阶段生成的会话密钥加密账号、认证方法、口令，将结果发送给服务器。
2. 服务端使用获得的会话密钥解密报文，得到账号和口令。
3. 服务端对这个账号和口令进行判断，如果失败，向客户端发送认证失败报文，其中包含了可以再次认证的方法列表。
4. 客户端从认证方法列表中选择一种方法进行再次认证。
5. 这个过程反复进行，直到认证成功或者认证次数达到上限，服务端关闭本次TCP连接。

#### 秘钥登陆

秘钥登陆的认证流程如下：

1. 客户端使用密钥和算法协商阶段生成的会话密钥加密账号、认证方法、id_rsa.pub，将结果发送给服务端。
2. 服务端使用会话密钥解密报文，得到账号、id_rsa.pub。服务端在 `$HOME/.ssh/authorized_keys` 中找对应的公钥，如果没有找到，发送失败消息给客户端，如果找到，比较客户发送过来的这个公钥和找到的公钥，如果内容相同，服务端生成一个随机的字符串，简称“质询”，然后使用找到的公钥加密这个质询，然后使用会话密钥再次加密。
3. 服务端把这个双重加密的数据发送给客户端
4. 客户端使用会话密钥解密报文，然后使用 id_rsa 再次解密数据，得到质询。
5. 客户端使用会话密钥加密质询，发送给服务端。
6. 服务端使用会话密钥解密报文，得到质询，判断是不是自己生成的那个质询，如果不相同，发送失败消息给客户端，如果相同，认证通过。





写在后面，就目前的了解，我认为SSH协议和HTTPS协议在建立网络会话这里的流程是一致的，都是先协商协议版本和加密算法的类型，之后就是非对称加密和对称加密，整个通话过程都是采用对称加密的方式进行数据交换。当然以上的认知肯定是片面的，这两种协议必然是在某一些细节处是不一样的，现在知道就有HTTPS有CA证书认证环节。网络相关的知识的深入学习任重道远，当下先囫囵吞枣的学下，后面再有针对性的系统学习下，学到什么程度呢？有个不错的标准，就是计算机考研的专业课的程度


