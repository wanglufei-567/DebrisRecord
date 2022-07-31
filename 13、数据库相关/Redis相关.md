## Redis笔记

### 一、前言

每一项技术的发展都是和大时代的背景息息相关，**==Redis==**的出现便是顺应了**Web**时代发展的需求，那在学习**Redis**的时候，了解下我们为什么需要这门技术还是很有必要的；

**Web1.0时代**

Web1.0的时代，**关系型数据库**受到了较为广泛的关注和应用，原因是因为那时候Web站点基本上访问和并发不高、交互也较少；数据访问量很有限，用一个高性能的单点服务器便可以解决大部分问题。

![image-20220727001146839](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220727001146839.png)

**Web2.0时代**

随着Web2.0的时代的到来，用户访问量大幅度提升，同时产生了大量的用户数据。加上后来的智能移动设备的普及，所有的互联网平台都面临了巨大的性能挑战。

性能的挑战主要分为两个方面：

- **CPU及内存压力**
- **IO压力**

![image-20220727001427045](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220727001427045.png)

在这一时代背景下，==**NoSQL**==(缓存数据库)应运而生，它同时具备了**高性能**、**可扩展性强**、**高可用**等优点，受到广泛开发人员和仓库管理人员的青睐。

下面👇看下**NoSQL**是如何在这两个挑战中应用的：

**CPU及内存压力**

**Web3.0**时代的主流系统架构是**分布式架构**，也叫**集群架构**；其主要结构一般为，客户端——>**负载均衡服务器**（反向代理服务器，一般是nginx）——>应用服务器集群（分布式部署）——>数据库，这样架构的目的是为了应对海量访问，但是解决访问量的同时也产生了一些新的问题，下面👇举一个具体🌰：

**session存储的问题**

**`session`**中存储了客户端的用户信息，因为负载均衡的存在，导致同一用户每次请求的服务器可能是集群中的任一服务器，所以集群中的服务器如何共享**`session`**便成了分布式架构的一个关键问题

解决方案：

1. 放到客户端存储cookie中，每次请求都会带着cookie到服务器中

   缺点：不安全

2. 放到文件服务器或数据库中

   缺点：IO效率问题

3. session复制，每台服务器中都存储相同的session

   缺点：数据冗余，浪费内存

4. NoSQL (缓存数据库)中缓存 <!--最优解-->

   优点：数据在内存中，读取速度快；数据结构简单

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220727001849738.png" alt="image-20220727001849738" style="zoom:80%;" />

**IO压力**

数据库中业务数据繁杂，io操作效率降低，可以通过数据库分表来提升性能，但是代价是破坏了一定的业务逻辑

解决方案：**频繁操作**的数据放进**缓存数据库**中，提高数据读取的**效率**

<!--IO 可以分为 网络IO 和 磁盘IO -->

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220727003348455.png" alt="image-20220727003348455" style="zoom:80%;" />

### 二、 NoSQL数据库

#### 2.1、概述

**NoSQL**(NoSQL = **Not Only SQL** )，意即“不仅仅是SQL”，泛指**非关系型的数据库**。**NoSQL** 不依赖业务逻辑方式存储，而以简单的`key-value`模式存储。因此大大的增加了数据库的扩展能力。

**NoSQL**具有以下特点

- 不遵循SQL标准
- 不支持ACID
- 远超于SQL的性能

**NoSQL适用场景**

- 对数据高并发的读写
- 海量数据的读写
- 对数据高可扩展性的

**NoSQL不适用场景**

- 需要事务支持
- 基于sql的结构化查询存储，处理复杂的关系

#### 2.2、Redis

**Redis**是目前最受欢迎的**NoSQL**数据库之一，**Redis**是一个使用ANSI C编写的开源、包含多种数据结构、支持网络、基于内存、可选持久性的键值对存储数据库，其具备如下特性：

- 基于内存运行，**性能高效**
- 支持分布式，理论上可以无限扩展
- `key-value`存储系统
- 开源的使用ANSI C语言编写、遵守BSD协议、支持网络、可基于内存亦可持久化的日志型、Key-Value数据库，并提供多种语言的API

相比于其他数据库类型，Redis具备的特点是：

- C/S通讯模型
- 单进程单线程模型
- 丰富的数据类型
- 操作具有原子性
- 持久化
- 高并发读写
- 支持lua脚本

<!--上面👆这段看看就好了-->

### 三、Redis

#### 3.1、概述

Redis是一个开源的`key-value`存储系统，它支持存储的`value`类型主要有五种：`string`(字符串)、`list`(链表)、`set(`集合)、`zset`(`sorted set` --有序集合)和`hash`（哈希类型）；这些数据类型都支持`push/pop`、`add/remove`及取交集并集和差集及更丰富的操作，而且这些操作都是原子性的；在此基础上，Redis支持各种不同方式的排序，为了保证效率，数据都是缓存在内存中，此外，Redis会周期性的把更新的数据写入磁盘或者把修改操作写入追加的记录文件，并且在此基础上实现了`master-slave`(主从)同步。

<!--概述，看看就好了-->

##### 3.1.1、应用场景

- **配合关系型数据库做高速缓存**

  -  高频次，热门访问的数据，降低数据库IO

  -  分布式架构，做session共享

-  **多样的数据结构存储持久化数据**

  ![image-20220730184301521](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220730184301521.png)

##### 3.1.2、安装与启动

Redis的安装与启动参考这几篇文章

[Redis 的下载与安装（macOS系统）](https://www.cnblogs.com/liyihua/p/14482412.html)

[在Mac上安装redis](https://cloud.tencent.com/developer/article/1606701)

- **启动redis服务**

  ```shell
  brew services start redis
  ```

- 关闭redis服务

  ```shell
  brew services stop redis
  ```

- 重启redis服务

  ```shell
  brew services restart redis
  ```

- 连接 Redis 客户端（Client）

  ```shell
  redis-cli -h 127.0.0.1 -p 6379
  ```

- 关闭 Redis 客户端

  ```shell
  redis-cli shutdown
  ```

##### 3.1.3、Redis相关知识

1. **端口6379从何而来？**

   **Merz**这个名字对应的九宫格键盘的数字

2. 默认16个数据库，类似数组下标从0开始，初始默认使用0号库

3. 统一密码管理，所有库同样密码

4. **Redis 执行效率为什么那么高**

   1. Redis 提供丰富的数据结构，可根据业务场景选择合适的操作对象

   2. **纯内存访问**

      <!--数据存放在内存中，内存的响应时间大约是 100 ns，所以即便 redis 有亿万级别的数据，访问起来也非常快-->

      <!--内存内的操作不是Redis的性能瓶颈，性能瓶颈主要在网络IO上，所以有了后面的IO多路复用-->

   3. **单线程操作**，避免了线程切换和竞态产生的消耗

      <!--注意，此处的单线程是指在接收客户端 IO 请求响应进行读写时是单线程操作；redis 本身是存在多线程使用场景的，比如：异步删除，持久化以及集群同步-->

   4. 高性能的 **IO 多路复用**模型

      <!--redis 采用 epoll 作为 IO 多路复用技术的实现，一个线程可以处理多个客户端连接，并通过事件监听和回调的机制，避免了 redis 一直轮询关注是否有事件产生，节省了性能的消耗-->

##### 3.1.4、什么是 IO 多路复用

> I/O 多路复用模型是利用select、poll、epoll可以同时监察多个流的 I/O 事件的能力，在空闲的时候，会把当前线程阻塞掉，当有一个或多个流有I/O事件时，就从**阻塞态**中唤醒，于是程序就会轮询一遍所有的流（epoll是只轮询那些真正发出了事件的流），依次顺序的处理就绪的流，这种做法就避免了大量的无用操作

这里“**多路**”指的是==**多个网络连接**==，“**复用**”指的是复用**同一个线程**。采用**多路 I/O 复用**技术可以让**单个线程**==高效==的处理多个连接请求（尽量减少**网络IO**的时间消耗）

关于IO多路复用参看下面👇这几篇文章

[IO多路复用原理&场景](https://www.cnblogs.com/zhangyjblogs/p/15862358.html)

[深入理解redis——Redis快的原因和IO多路复用深度解析](https://segmentfault.com/a/1190000041488709)

[Redis多路复用](http://gitbook.chenqiong.net/part3/1/3.html)

[Redis IO多路复用](https://www.modb.pro/db/104786)

### 3.2、Redis常用的五大数据类型

#### 3.2.1、Redis键（key）的常见操作命令

- `keys *`：查看当前库所有key 
- `exists key`：判断某个key是否存在
- `type key`： 查看对应key的value是什么类型
- `del key`：删除指定的key数据
- `unlink key`：根据value选择非阻塞删除
  - 仅将`keys`从`keyspace`元数据中删除，真正的删除会在后续异步操作
- `expire key [time]` ：为给定的key设置过期时间
- `ttl key`： 查看还有多少秒过期，-1表示永不过期，-2表示已过期

其他关于数据库的操作命令

- `select`：命令切换数据库
- `dbsize`：查看当前数据库的key的数量
- `flushdb`：清空当前库
- `flushall`：通杀全部库

#### 3.2.2、Redis值（value）— 字符串(String)

**String**是**Redis**最基本的类型。**String**类型是二进制安全的，意味着**Redis**的**string**可以包含任何数据（比如jpg图片或者序列化的对象）一个**Redis**中字符串**value**最多可以是512M

**常用命令：**

- `set  key value [EX seconds|PX milliseconds] [NX|XX]`：添加键值对
  - `NX`：当数据库中`key`不存在时，可以将`key-value`添加数据库
  - `XX`：当数据库中key存在时，可以将`key-value`添加数据库，与`NX`参数互斥
  - `EX`：`key`的超时秒数
  - `PX`：`key`的超时毫秒数，与`EX`互斥
- `get key`：查询对应键值
- `append key value`：将给定的`value`追加到原值的末尾
- `strlen key`：获得值的长度
- `setnx key value`：只有在 `key` 不存在时  设置 `key` 的值
- `ncr  key`：将 `key` 中储存的数字值增1，只能对数字值操作，如果为空，新增值为1

- `decr key`：将 `key` 中储存的数字值减1，只能对数字值操作，如果为空，新增值为-1

- `incrby / decrby key 步长`：将 `key` 中储存的数字值增减。自定义步长
- `mset key1 value1 key2 value2 .....` ：同时设置一个或多个 `key-value`对 
- `mget key1 key2 key3.....`：同时获取一个或多个 `value` 
- `msetnx key1 value1 key2 value2.....` ：同时设置一个或多个 `key-value` 对，当且仅当所有给定 `key` 都不存在
- `getrange key 起始位置 结束位置`：获得值的范围
- `setrange key 起始位置 value` ：用 `value`覆写`key`所储存的字符串值，从起始位置开始(**索引从0**开始)
- `setex  key  过期时间 value`：设置键值的同时，设置过期时间，单位秒。
- `getset key value`：以新换旧，设置了新值同时获得旧值。

#### 3.2.3、Redis值（value）— 列表(List)

**单键多值**

**Redis** 列表是简单的字符串列表，按照插入顺序排序。你可以添加一个元素到列表的头部（左边）或者尾部（右边），它的底层实际是个双向链表，对两端的操作性能很高，通过索引下标的操作中间的节点性能会较差。

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220730211151918.png" alt="image-20220730211151918"/>

**常用命令：**

- `push/rpush key value1 value2 value3 ....` ：从左边/右边插入一个或多个值

- `lpop/rpop  key` ：从左边/右边吐出一个值。值在键在，值光键亡

- `rpoplpush  key1 key2`：从`key1`列表右边吐出一个值，插到`key2`列表左边

- `lrange key start stop`：按照索引下标获得元素(从左到右)

  `lrange mylist 0 -1` ： 0左边第一个，-1右边第一个，（0-1表示获取所有）

- `lindex key index`：按照索引下标获得元素(从左到右)

- `llen key`：获得列表长度 

- `linsert key before value newvalue`：在`value`的后面插入`newvalue`插入值

- `lrem key n value`：从左边删除`n`个`value`(从左到右)

- `lset key index value`：将列表`key`下标为`index`的值替换成`value`

#### 3.2.4、Redis值（value）— 集合(Set)

**Redis set**对外提供的功能与**list**类似是一个列表的功能，特殊之处在于**set**是可以**自动排重**的，当你需要存储一个列表数据，又不希望出现重复数据时，**set**是一个很好的选择，并且**set**提供了判断某个成员是否在一个**set**集合内的重要接口，这个也是**list**所不能提供的。

**常用命令：**

- `sadd key value1 value2.....` ：将一个或多个 `member` 元素加入到集合 `key` 中，已经存在的 `member` 元素将被忽略
- `smembers key`：取出该集合的所有值
- `sismember key value` ：判断集合`key`是否为含有该`value`值，有1，没有0
- `scard key` ：返回该集合的元素个数
- `srem key value1 value2 ....` ：删除集合中的某个元素
- `spop key`：随机从该集合中吐出一个值
- `srandmember key n`：随机从该集合中取出n个值。不会从集合中删除 
- `smove source destination value`：把集合中一个值从一个集合移动到另一个集合
- `sinter key1 key2`：返回两个集合的交集元素。
- `sunion key1 key2`：返回两个集合的并集元素。
- `sdiff key1 key2`：返回两个集合的**差集**元素(`key1`中的，不包含`key2`中的)

#### 3.2.5、Redis值（value）— 哈希(Hash)

**Redis hash** 是一个键值对集合。

**Redis hash**是一个**string**类型的`field`和`value`的映射表，**hash**特别适合用于存储对象

举个🌰：

用户`ID`为查找的`key`，存储的`value`用户对象包含姓名，年龄，生日等信息，

如果用普通的`key/value`结构来存储，主要有以下2种存储方式：

- 方案一：

  ![image-20220730212326391](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220730212326391.png)

  - 每次修改用户的某个属性需要，先反序列化改好后再序列化回去。

  - 缺点：**开销较大**

- 方案二：

  ![image-20220730212446995](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220730212446995.png)

  - 用户ID数据冗余

如果用**Hash**结构来存储：

![image-20220730212542347](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220730212542347.png)

通过 **key(用户ID) + field(属性标签)** 就可以操作对应属性数据了，既**不需要重复存储数据**，**也不会带来序列化和并发修改控制的问题**

**常用命令：**

- `hset key field value`：给`key`集合中的 `field`键赋值`value`
- `hget key1 field`：从`key1`集合`field`取出 `value` 
- `hmset key1 field1 value1 field2 value2 ...` ：批量设置hash的值
- `hexists key1 field`：查看哈希表 `key` 中，给定域 `field` 是否存在。 
- `hkeys key`：列出该`hash`集合的所有`field`
- `hvals key`：列出该`hash`集合的所有`value`
- `hincrby key field increment`：为哈希表 `key` 中的域 `field` 的值加上增量 1  -1
- `hsetnx key field value`：将哈希表 `key` 中的域 `field` 的值设置为 `value` ，当且仅当域 `field` 不存在 

#### 3.2.6、Redis值（value）— 有序集合(Zset)

**Redis**有序集合**zset**与普通集合**set**非常相似，是一个**没有重复元素的字符串集合**。

不同之处是有序集合的每个成员都关联了一个**评分（score)**，**这个评分（score）**被用来按照从最低分到最高分的方式排序集合中的成员。集合的成员是唯一的，但是评分可以是重复了 。

因为元素是有序的, 所以也可以很快的根据评分**（score）**或者次序**（position**）来获取一个范围的元素。

访问有序集合的中间元素也是非常快的,因此你能够使用有序集合作为一个没有重复成员的智能列表。

**常用命令：**

- `zadd key score1 value1 score2 value2…`：将一个或多个 `member` 元素及其 `score` 值加入到有序集 `key` 当中
- `zrange key start stop [WITHSCORES]`  ：返回有序集 `key` 中，下标在`start` `stop`之间的元素，带`WITHSCORES`，可以让分数一起和值返回到结果集。
- `zrangebyscore key min max [withscores] [limit offset count]`：返回有序集 `key` 中，所有 `score` 值介于 `min` 和 `max` 之间(包括等于 `min` 或 `max` )的成员。有序集成员按 `score` 值递增(从小到大)次序排列。 
- `zrevrangebyscore key max min [withscores] [limit offset count]` ：同上，改为从大到小排列。 
- `zincrby key increment value`：为元素的`score`加上增量
- `zrem key value`：删除该集合下，指定值的元素
- `zcount key min max`：统计该集合，分数区间内的元素个数 
- `zrank key value`：返回该值在集合中的排名，从0开始

### 3.3、Redis的配置文件

**Redis**的配置文件默认位于`/usr/local/etc/redis.conf`

**配置说明**

##### 3.3.1、Units单位

配置大小单位,开头定义了一些基本的度量单位，只支持bytes，不支持bit（大小写不敏感）

```shell
# Note on units: when memory size is needed, it is possible to specify
# it in the usual form of 1k 5GB 4M and so forth:
#
# 1k => 1000 bytes
# 1kb => 1024 bytes
# 1m => 1000000 bytes
# 1mb => 1024*1024 bytes
# 1g => 1000000000 bytes
# 1gb => 1024*1024*1024 bytes
#
# units are case insensitive so 1GB 1Gb 1gB are all the same.
```

##### 3.3.2、INCLUDES包含

多实例的情况可以把公用的配置文件提取出来

```shell
# Include one or more other config files here.  This is useful if you
# have a standard template that goes to all Redis servers but also need
# to customize a few per-server settings.  Include files can include
# other files, so use this wisely.
#
# Notice option "include" won't be rewritten by command "CONFIG REWRITE"
# from admin or Redis Sentinel. Since Redis always uses the last processed
# line as value of a configuration directive, you'd better put includes
# at the beginning of this file to avoid overwriting config change at runtime.
#
# If instead you are interested in using includes to override configuration
# options, it is better to use include as the last line.
#
# include /path/to/local.conf
# include /path/to/other.conf
```

##### 3.3.3、NETWORK网络相关配置

- **bind**
  - 默认情况bind=127.0.0.1只能接受本机的访问请求
  - 不写的情况下，无限制接受任何ip地址的访问
  - 生产环境要写应用服务器的地址；服务器是需要远程访问的，所以需要将其注释掉
- **port**
  - 端口号，默认 6379
- **timeout**
  - 一个空闲的客户端维持多少秒会关闭，0表示关闭该功能。即永不关闭
- **Tcp-keepalive**
  - 对访问客户端的一种心跳检测，每个n秒检测一次
  - 单位为秒，如果设置为0，则不会进行Keepalive检测，建议设置成60 

<!--配置文件啥的，上网查吧，不记录了-->

### 3.4、Redis的发布订阅

Redis 发布订阅 (pub/sub) 是一种消息通信模式：发送者 (pub) 发送消息，订阅者 (sub) 接收消息

Redis 客户端可以订阅任意数量的频道

1、客户端可以订阅频道如下图

![image-20220731163421582](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731163421582.png)

2、当给这个频道发布消息后，消息就会发送给订阅的客户端

 ![image-20220731163430919](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731163430919.png)

 **发布订阅的命令：**

1.  打开一个客户端A订阅`channel1`
   - `SUBSCRIBE channel1`
2. 打开另一个客户端B，给`channel1`发布消息"hello"
   - `publish channel1 hello`
   - 返回的数字是订阅者数量
3. 客户端A中便可以收到信息"hello"

<!--注：发布的消息没有持久化-->

### 3.5、Redis事务操作

#### 3.5.1、Redis事务的定义

**Redis事务**是一个**单独**的**隔离操作**：事务中的所有命令都会**序列化**、**按顺序地**执行，事务在执行的过程中，**不会被其他客户端发送来的命令请求所打断**

==**Redis事务**的主要作用就是**串联多个命令**防止别的**命令插队**==

#### 3.5.2、Redis事务的三个命令Multi、Exec、discard

从输入**Multi**命令开始，输入的命令都会依次进入命令队列中，但不会执行

直到输入**Exec**后，**Redis**会将之前的命令队列中的命令依次执行

组队的过程中可以通过**discard**来放弃组队

![image-20220731181612797](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731181612797.png)

**示例1：组队成功，提交成功**

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731181805304.png" alt="image-20220731181805304" />



#### 3.5.3、事务的错误处理

**错误1:**组队中某个命令出现了报告错误，执行时整个的所有队列都会被取消

![image-20220731182123884](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731182123884.png)

**示例2：组队阶段报错，提交失败**

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731181840078.png" alt="image-20220731181840078" style="zoom:80%;" />

**错误2:**如果执行阶段某个命令报出了错误，则只有报错的命令不会被执行，而其他的命令都会执行，不会回滚

![image-20220731182248389](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731182248389.png)

**示例3：组队成功，提交有成功有失败情况**

![image-20220731181914241](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731181914241.png)

#### 3.5.4、事务冲突的问题

假设这样一个场景：有很多人拥有同一个账户,然后同时去参加双十一抢购

一个请求想给金额减8000

一个请求想给金额减5000

一个请求想给金额减1000

![image-20220731183554239](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731183554239.png)

这样势必会造成问题，账户中总共只有10000，不可能消费之后有负的余额

解决这种问题，一般有两种方案：

- **方案一：悲观锁**

![image-20220731183803475](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731183803475.png)

**悲观锁(Pessimistic Lock)**, 顾名思义，就是很悲观，每次去拿数据的时候都认为别人会修改，所以每次在拿数据的时候都会**上锁**，这样别人想拿这个数据就会**block**直到它拿到锁

**传统的关系型数据库里边就用到了很多这种锁机制**，比如**行锁**，**表锁**等，**读锁**，**写锁**等，都是在做操作之前先上锁

这种方案的缺点很明显就是：**效率低**

- **方案二：乐观锁**

![image-20220731183925105](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731183925105.png)

**乐观锁(Optimistic Lock),** 顾名思义，就是很乐观，每次去拿数据的时候都认为别人不会修改，所以不会上锁，但是在更新的时候会判断一下在此期间别人有没有去**更新**这个数据，可以使用**版本号**等机制。

**乐观锁适用于多读的应用类型，这样可以提高吞吐量**

**Redis**就是利用这种**check-and-set**机制实现事务的

#### 3.5.5、乐观锁在Redis中的使用

两个命令

-  `WATCH key [key ...]`
  - 在执行`multi`之前，先执行`watch key1 [key2]`,可以监视一个(或多个) `key` 
  - 如果在事务**执行之前这个(或这些) `key` 被其他命令所改动，那么事务将被打断**
-  `UNWATCH key [key ...]`
  - 取消 `WATCH` 命令对所有 `key` 的监视
  - 如果在执行 `WATCH` 命令之后，`EXEC` 命令或`DISCARD` 命令先被执行了的话，那么就不需要再执行`UNWATCH` 了

![image-20220731184640677](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731184640677.png)

#### 3.5.6、Redis事务三特性

- **单独的隔离操作** 

  事务中的所有命令都会**序列化**、按**顺序**地执行

  事务在执行的过程中，**不会被其他客户端发送来的命令请求所打断**。

- **没有隔离级别的概念** 

  队列中的命令没有提交之前都不会实际被执行，因为事务提交前任何指令都**不会被实际执行**

-  **不保证原子性** 

  **事务中如果有一条命令执行失败，其后的命令仍然会被执行，==没有回滚==**

### 3.6、Redis的持久化

**Redis**是一个内存数据库，所有的数据将保存在内存中，所以与传统的MySQL、Oracle、SqlServer等关系型数据库直接把数据保存到硬盘相比，**Redis**的读写效率非常高

但是保存在内存中也有一个很大的缺陷，一旦断电或者宕机，内存数据库中的内容将会全部**丢失**。为了弥补这一缺陷，**Redis**提供了**把内存数据持久化到硬盘文件**，以及**通过备份文件来恢复数据**的功能，即**==Redis持久化机制==**

**Redis**支持两种方式的持久化

- **RDB（Redis DataBase）快照**
- **AOF（Append Of File）**

#### 3.6.1、RDB（Redis DataBase）

**RDB**在指定的==**时间间隔**==内将**内存**中的**数据集快照写入磁盘**， 也就是**Snapshot快照**，它恢复时是将快照文件直接读到**内存**里

##### 3.6.1.1、**备份是如何执行的？**

**Redis**会单独创建（**fork**）一个**子进程**来进行持久化，会先将数据写入到 一个**临时文件**中，待持久化过程都结束了，**再用这个临时文件替换上次持久化好的文件**。

整个过程中，主进程是不进行任何IO操作的，这就确保了极高的性能 如果需要进行大规模数据的恢复，且对于数据恢复的完整性不是非常敏感，那RDB方式要比AOF方式更加的高效

**RDB**的缺点是最后一次持久化后的数据可能丢失

**FORK：**

-  **Fork**的作用是复制一个与当前进程一样的进程
  - 新进程的所有数据（变量、环境变量、程序计数器等） 数值都和原进程一致，但是是一个全新的进程，并**作为原进程的子进程**
- 在**Linux**程序中，**fork()**会产生一个和父进程完全相同的子进程，但子进程在此后多会exec系统调用，出于效率考虑，Linux中引入了“**写时复制技术**”
- **一般情况父进程和子进程会共用同一段物理内存**，只有进程空间的各段的内容要发生变化时，才会将父进程的内容复制一份给子进程

**RDB持久化流程：**

![image-20220731221705218](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731221705218.png)

##### 3.6.1.2、RDB的优劣势

**优势：**

- 适合大规模的数据恢复
- 对数据完整性和一致性要求不高更适合使用
- 节省磁盘空间
- 恢复速度快

**劣势：**

- Fork的时候，内存中的数据被克隆了一份，大致2倍的膨胀性需要考虑
- 虽然Redis在fork时使用了**写时拷贝技术**,但是如果数据庞大时还是比较消耗性能
- 在备份周期在一定间隔时间做一次备份，所以如果Redis意外down掉的话，就会丢失最后一次快照后的所有修改

![image-20220731222308185](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731222308185.png)

#### 3.6.2、AOF（Append Of File）

**AOF**以**日志**的形式来记录每个写操作（增量保存），将**Redis**执行过的所有写指令记录下来(**读操作不记录**)， **只许追加文件但不可以改写文件**，**redis**启动之初会读取该文件重新构建数据，换言之，**redis** 重启的话就根据日志文件的内容将写指令从前到后执行一次以完成数据的恢复工作

<!--AOF和RDB同时开启，系统默认取AOF的数据（数据不会存在丢失）-->

##### 3.6.2.1、 **AOF**持久化流程

（1）客户端的请求写命令会被append追加到AOF缓冲区内；

（2）AOF缓冲区根据AOF持久化策略[always,everysec,no]将操作sync同步到磁盘的AOF文件中；

（3）AOF文件大小超过重写策略或手动重写时，会对AOF文件rewrite重写，压缩AOF文件容量；

（4）Redis服务重启时，会重新load加载AOF文件中的写操作达到数据恢复的目的；

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731222638181.png" alt="image-20220731222638181" style="zoom:50%;" />

##### 3.6.2.2、AOF优劣势

**优势：**

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731222840233.png" alt="image-20220731222840233" style="zoom:50%;" />

- 备份机制更稳健，丢失数据概率更低
- 可读的日志文本，通过操作AOF稳健，可以处理误操作

**劣势：**

- 比起RDB占用更多的磁盘空间。
- 恢复备份速度要慢。
- 每次读写都同步的话，有一定的性能压力。
- 存在个别Bug，造成恢复不能

![image-20220731222956663](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731222956663.png)

#### 3.6.3、持久化总结

官方推荐两个都启用，如果对数据不敏感，可以选单独用RDB；不建议单独用 AOF，因为可能会出现Bug；

如果只是做纯内存缓存，可以都不用。

### 3.7、Redis主从复制

**Redis主从复制**是指**主机数据更新后**根据配置和策略， 自动**同步到备机**的**master/slaver**机制，**Master**以写为主，**Slave**以读为主。

![image-20220731223435222](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731223435222.png)

**Redis主从复制的作用：**

- **读写分离**，性能扩展
- **容灾快速恢复**

<!--主从复制主要有三种模式：一主二仆、薪火相传、反客为主；还有一种哨兵模式，这些以后用到了再补充，现在了解下就好了-->

### 3.8、Redis集群

**Redis 集群**实现了对**Redis**的水平扩容，即启动N个**redis**节点，将整个数据库分布存储在这N个节点中，每个节点存储总数据的1/N。

**Redis 集群**通过分区（**partition**）来提供一定程度的可用性（**availability**）： **即使集群中有一部分节点失效或者无法进行通讯， 集群也可以继续处理命令请求**

解决的问题：

- 容量不够，redis如何进行扩容？
- 并发写操作， redis如何分摊？

<!--暂时了解下，用到了再补充-->

### 3.9、 Redis应用问题解决

#### 3.9.1、 缓存穿透

**描述：**

**key**对应的数据在数据源并**不存在**，每次针对此**key**的请求从缓存获取不到，请求都会压到数据源，从而可能压垮数据源

比如用一个不存在的用户id获取用户信息，不论缓存还是数据库都没有，若黑客利用此漏洞进行攻击可能压垮数据库



<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731224704656.png" alt="image-20220731224704656" style="zoom:80%;" />

现象

- 应用服务器压力变大（访问量变多）
- redis命中率变低
- 一直查数据库，数据库压力变大

原因

- redis查询不到数据库
- 出现很多非正常URL访问

**解决方案：**

一个一定不存在缓存及查询不到的数据，由于缓存是不命中时被动写的，并且出于容错考虑，如果从存储层查不到数据则不写入缓存，这将导致这个不存在的数据每次请求都要到存储层去查询，失去了缓存的意义。

解决方案：

（1）  **对空值缓存：**如果一个查询返回的数据为空（不管是数据是否不存在），我们仍然把这个空结果（null）进行缓存，设置空结果的过期时间会很短，最长不超过五分钟

（2）  **设置可访问的名单（白名单）：**

使用bitmaps类型定义一个可以访问的名单，名单id作为bitmaps的偏移量，每次访问和bitmap里面的id进行比较，如果访问id不在bitmaps里面，进行拦截，不允许访问。

（3）  **采用布隆过滤器**：(布隆过滤器（Bloom Filter）是1970年由布隆提出的。它实际上是一个很长的二进制向量(位图)和一系列随机映射函数（哈希函数）。

布隆过滤器可以用于检索一个元素是否在一个集合中。它的优点是空间效率和查询时间都远远超过一般的算法，缺点是有一定的误识别率和删除困难。)

将所有可能存在的数据哈希到一个足够大的bitmaps中，一个一定不存在的数据会被 这个bitmaps拦截掉，从而避免了对底层存储系统的查询压力。

**（4）**  **进行实时监控：**当发现Redis的命中率开始急速降低，需要排查访问对象和访问的数据，和运维人员配合，可以设置黑名单限制服务

#### 3.9.2、缓存击穿

**描述：**

**某个key**对应的数据存在，但在**redis**中过期，此时若有**大量并发请求**过来，这些请求发现缓存过期一般都会从后端DB加载数据并回设到缓存，这个时候大并发的请求可能会瞬间把后端DB压垮

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731225522225.png" alt="image-20220731225522225" style="zoom:80%;" />

现象：

- 数据库访问压力瞬时增加
- redis正常运行
- redis中并没有大量的key过期

原因：

- redis中某个key过期了，但是有大量访问使用这个key

key可能会在某些时间点被超高并发地访问，是一种非常“热点”的数据。这个时候，需要考虑一个问题：缓存被“击穿”的问题。

**解决方案：**

- **预先设置热门数据**
  - 在redis高峰访问之前，把一些热门数据提前存入到redis里面，加大这些热门数据key的时长
- **实时调整**
  - 现场监控哪些数据热门，实时调整key的过期时长
- 使用锁：
  - 就是在缓存失效的时候（判断拿出来的值为空），不是立即去load db。
  - 先使用缓存工具的某些带成功操作返回值的操作（比如Redis的SETNX）去set一个mutex key
  - 当操作返回成功时，再进行load db的操作，并回设缓存,最后删除mutex key；
  - 当操作返回失败，证明有线程在load db，当前线程睡眠一段时间再重试整个get缓存的方法。

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731225014343.png" alt="image-20220731225014343" style="zoom:50%;" />

#### 3.9.3、缓存雪崩

**描述：**

key对应的数据存在，但在redis中过期，此时若有大量并发请求过来，这些请求发现缓存过期一般都会从后端DB加载数据并回设到缓存，这个时候大并发的请求可能会瞬间把后端DB压垮。

**缓存雪崩与缓存击穿的区别在于这里针对很多key缓存，前者则是某一个key**

正常访问

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731225454596.png" alt="image-20220731225454596" style="zoom:80%;" />

缓存失效瞬间

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20220731225552591.png" alt="image-20220731225552591" style="zoom:80%;" />

**现象：**

- 数据库压力变大，服务器崩溃

**原因：**

- 在极短时间内，大量的key集中过期

**解决方案：**

缓存失效时的雪崩效应对底层系统的冲击非常可怕！

解决方案：

**（1）**  **构建多级缓存架构：**nginx缓存 + redis缓存 +其他缓存（ehcache等）

**（2）**  **使用锁或队列：**

用加锁或者队列的方式保证来保证不会有大量的线程对数据库一次性进行读写，从而避免失效时大量的并发请求落到底层存储系统上。不适用高并发情况

**（3）**  **设置过期标志更新缓存：**

记录缓存数据是否过期（设置提前量），如果过期会触发通知另外的线程在后台去更新实际key的缓存。

**（4）**  **将缓存失效时间分散开：**

比如我们可以在原有的失效时间基础上增加一个随机值，比如1-5分钟随机，这样每一个缓存的过期时间的重复率就会降低，就很难引发集体失效的事件。

#### 3.9.4、分布式锁

**描述：**

随着业务发展的需要，原单体单机部署的系统被演化成分布式集群系统后，由于分布式系统多线程、多进程并且分布在不同机器上，这将使原单机部署情况下的并发控制锁策略失效，单纯的Java API并不能提供分布式锁的能力。为了解决这个问题就需要一种跨JVM的互斥机制来控制共享资源的访问，这就是分布式锁要解决的问题！

分布式锁主流的实现方案：

-  基于数据库实现分布式锁
- 基于缓存（Redis等）
- 基于Zookeeper

每一种分布式锁解决方案都有各自的优缺点：

- 性能：redis最高
- 可靠性：zookeeper最高

**解决方案：**使用**使用redis实现分布式锁**

### 四、总结



### 引用

[Redis专题：万字长文详解持久化原理](https://segmentfault.com/a/1190000039208726)


