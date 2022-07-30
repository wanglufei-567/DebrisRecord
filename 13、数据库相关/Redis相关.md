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

[Redis 的下载与安装（macOS系统](https://www.cnblogs.com/liyihua/p/14482412.html)

[在Mac上安装redis](https://cloud.tencent.com/developer/article/1606701)

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
- `zrank key value`：返回该值在集合中的排名，从0开始。