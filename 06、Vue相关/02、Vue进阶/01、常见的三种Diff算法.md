## 常见的三种Diff算法

### 一、为什么需要Diff算法

假设有下面这一对新旧vnode，需要完成子节点的更新

```js
 // 旧 vnode
 const oldVNode = {
   type: 'div',
   children: [
     {type: 'li', key: 'a', children: 'a'},
     {type: 'li', key: 'b', children: 'b'},
     {type: 'li', key: 'c', children: 'c'},
   ]
 }
 
 // 新vnode
 const newVNode = {
   type: 'div',
   children: [
     {type: 'li', key: 'a', children: 'a'},
     {type: 'li', key: 'b', children: 'b'},
     {type: 'li', key: 'd', children: 'd'},
     {type: 'li', key: 'e', children: 'e'},
   ]
 }
```

最简单直接的方式，卸载全部旧子节点，再挂载全部新的子节点。这么确实可以完成更新，但由于没有复用任何DOM元素，所以会产生**==巨大的性能开销==**

Diff算法就是用来减少这部分的性能开销，Diff算法通过==比较两组子节点的差异==，最大程度地复用DOM元素，减少DOM操作

### 二、简单Diff算法

#### 2.1、第一轮循环

```js
 // 旧 vnode
 const oldVNode = {
   type: 'div',
   children: [
     {type: 'li', key: 'a', children: 'a'},
     {type: 'li', key: 'b', children: 'b'},
     {type: 'li', key: 'c', children: 'c'},
   ]
 }
 
 // 新vnode
 const newVNode = {
   type: 'div',
   children: [
     {type: 'li', key: 'a', children: 'a'},
     {type: 'li', key: 'b', children: 'b'},
     {type: 'li', key: 'd', children: 'd'},
   ]
 }
```

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230610225420345.png" alt="image-20230610225420345" style="zoom:50%;" />

遍历新VNode，新VNode和老VNode按照索引，==一一进行比较==

- 如果 `key` 不同则==直接结束本轮循环==  
- 如果`key` 相同而 `type` 不同，则直接==创建新`fiber`节点==，标记老`fiber`为删除，==继续循环==
- 如果`key` 相同且 `type` 也相同，则直接==复用老节 `fiber` 节点==，==继续循环==
- 如果`newChildren` 或 `oldFiber` 遍历完，==结束本轮循环==

#### 2.2、第二轮循环

**Case1：新的多，旧的少**

```js
 // 旧 vnode
 const oldVNode = {
   type: 'div',
   children: [
     {type: 'li', key: 'a', children: 'a'},
     {type: 'li', key: 'b', children: 'b'},
   ]
 }
 
 // 新vnode
 const newVNode = {
   type: 'div',
   children: [
     {type: 'li', key: 'a', children: 'a'},
     {type: 'li', key: 'b', children: 'b'},
     {type: 'li', key: 'c', children: 'c'},
   ]
 }
```

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230610225508023.png" alt="image-20230610225508023" style="zoom:50%;" />

**Case2：旧的多，新的少**

```js
 // 旧 vnode
 const oldVNode = {
   type: 'div',
   children: [
     {type: 'li', key: 'a', children: 'a'},
     {type: 'li', key: 'b', children: 'b'},
     {type: 'li', key: 'c', children: 'c'},
   ]
 }
 
 // 新vnode
 const newVNode = {
   type: 'div',
   children: [
     {type: 'li', key: 'a', children: 'a'},
     {type: 'li', key: 'b', children: 'b'},
   ]
 }
```

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230610225538153.png" alt="image-20230610225538153" style="zoom:50%;" />

**第 2 轮循环**做的事：

- `newChildren` 遍历完而 `oldFiber` 还有，遍历剩下所有的 `oldFiber` 标记为删除，==diff 结束==
- `oldFiber` 遍历完了，而 `newChildren` 还有，将剩下的 `newChildren` 标记为插入，==diff 结束==
- `newChildren` 和 `oldFiber` 都没有完成，则==进行`节点移动`的逻辑==

#### 2.3、第三轮循环

```js
 // 旧 vnode
 const oldVNode = {
   type: 'div',
   children: [
     {type: 'li', key: 'a', children: 'a'},
     {type: 'li', key: 'b', children: 'b'},
     {type: 'li', key: 'c', children: 'c'},
     {type: 'li', key: 'd', children: 'd'},
     {type: 'li', key: 'e', children: 'e'},
   ]
 }
 
 // 新vnode
 const newVNode = {
   type: 'div',
   children: [
     {type: 'li', key: 'a', children: 'a'},
     {type: 'li', key: 'c', children: 'c'},
     {type: 'li', key: 'e', children: 'e'},
     {type: 'li', key: 'b', children: 'b'},
     {type: 'li', key: 'g', children: 'g'},
     {type: 'li', key: 'd', children: 'd'},
   ]
 }
```

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230611120800755.png" alt="image-20230611120800755" style="zoom:70%;" />

<!--lasPldx表示最大索引，React中叫lastPlaceIndex，Vue中叫lastIndex-->

**第 3 轮循环**做的事：移动节点

**简单Diff算法**的核心逻辑是，拿新的一组子节点去旧的的一组子节点中寻找可复用的节点。如果找到了，则记录该节点的位置索引（被称为最大索引），整个更新过程中，如果下一个节点的索引小于最大索引，则说明该节点对应的真实DOM节点需要移动

#### 2.4、待改进的地方

**简单Diff算法**对于节点移动操作并不是最优的

假设新旧节点是这样的👇

```js
 // 旧 vnode
 const oldVNode = {
   type: 'div',
   children: [
     {type: 'li', key: 'a', children: 'a'},
     {type: 'li', key: 'b', children: 'b'},
     {type: 'li', key: 'c', children: 'c'},
     {type: 'li', key: 'd', children: 'd'},
     {type: 'li', key: 'e', children: 'e'},
     {type: 'li', key: 'f', children: 'f'},
   ]
 }
 
 // 新vnode
 const newVNode = {
   type: 'div',
   children: [
     {type: 'li', key: 'a', children: 'a'},
     {type: 'li', key: 'e', children: 'e'},
     {type: 'li', key: 'b', children: 'b'},
     {type: 'li', key: 'c', children: 'c},
     {type: 'li', key: 'g', children: 'g'},
     {type: 'li', key: 'd', children: 'd'},
   ]
 }
```

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230611120908259.png" alt="image-20230611120908259" style="zoom:70%;" />

当拿新的子节点去旧的子节点中寻找可复用的节点，但找到的旧节点（e ）的索引（index=4）比较大时，这个时候旧节点之前的可复用节点便都要移动（总共需要移动3次），这种场景下**简单Diff算法**便无法做到最小化DOM操作

### 三、双端Diff算法

#### 3.1、双端比较的原理

顾名思义，**双端Diff算法**是一种同时对新旧两组子节点的两个端点进行比较的算法。因此需要四个索引值，分别指向新旧两组子节点的端点（newStartIdx、newEndIdx、oldStartIdx、oldEndIdx）

```js
 // 旧 vnode
 const oldVNode = {
   type: 'div',
   children: [
     {type: 'li', key: 'a', children: 'a'},
     {type: 'li', key: 'b', children: 'b'},
     {type: 'li', key: 'c', children: 'c'},
     {type: 'li', key: 'd', children: 'd'},
   ]
 }
 
 // 新vnode
 const newVNode = {
   type: 'div',
   children: [
     {type: 'li', key: 'd', children: 'd'},
     {type: 'li', key: 'b', children: 'b'},
     {type: 'li', key: 'a', children: 'a'},
     {type: 'li', key: 'c', children: 'c},
   ]
 }
```

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230611152933228.png" alt="image-20230611152933228" style="zoom: 60%;" />

在双端Diff比较中，每一轮都分为四个步骤：

1. 比较oldStartIdx和newStartIdx看key是否相同；key不同，不可复用，此步骤什么都不做
2. 比较oldEndIdx和newEndIdx看key是否相同；key不同，不可复用，此步骤什么都不做
3. 比较oldStartIdx和newEndIdx看key是否相同；key不同，不可复用，此步骤什么都不做
4. 比较oldEndIdx和oldStartIdx看key是否相同；key相同，可以复用，此步骤先进行patch操作，再移动DOM节点，再更新索引值指向下一个位置

<!--由于在每一轮更新完成之后，紧接着都会更新四个索引中与当前更新轮次相关联的索引，所以循环执行的条件是：头部索引值要小于尾部索引值-->

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230611154039228.png" alt="image-20230611154039228" style="zoom:60%;" />

1. 比较oldStartIdx和newStartIdx看key是否相同；key不同，不可复用，此步骤什么都不做
2. 比较oldEndIdx和newEndIdx看key是否相同；key相同，可以复用，另外由于两者都处于尾部，因此不需要进行DOM操作，只需进行patch操作，再更新索引值即可

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230611160909648.png" alt="image-20230611160909648" style="zoom:60%;" />

1. 比较oldStartIdx和newStartIdx看key是否相同；key不同，不可复用，此步骤什么都不做
2. 比较oldEndIdx和newEndIdx看key是否相同；key不同，不可复用，此步骤什么都不做
3. 比较oldStartIdx和newEndIdx看key是否相同；key相同，可以复用，此步骤先进行patch操作，再移动DOM节点，再更新索引值指向下一个位置

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230611161139298.png" alt="image-20230611161139298" style="zoom:60%;" />

1. 比较oldStartIdx和newStartIdx看key是否相同；key相同，可以复用，两者都位于首部，不需要进行DOM操作，只需进行patch操作，再更新索引值即可

索引值更新之后，新旧子节点的头部索引值都大于尾部索引值了，所以diff结束，总共进行了两次DOM移动操作，若是使用简单Diff算法则需要进行三次DOM移动操作；

#### 3.2、双端比较的优势

简单Diff-2.4中的case👇，采用双端Diff的方式去进行diff

```js
 // 旧 vnode
 const oldVNode = {
   type: 'div',
   children: [
     {type: 'li', key: 'a', children: 'a'},
     {type: 'li', key: 'b', children: 'b'},
     {type: 'li', key: 'c', children: 'c'},
     {type: 'li', key: 'd', children: 'd'},
     {type: 'li', key: 'e', children: 'e'},
     {type: 'li', key: 'f', children: 'f'},
   ]
 }
 
 // 新vnode
 const newVNode = {
   type: 'div',
   children: [
     {type: 'li', key: 'a', children: 'a'},
     {type: 'li', key: 'e', children: 'e'},
     {type: 'li', key: 'b', children: 'b'},
     {type: 'li', key: 'c', children: 'c},
     {type: 'li', key: 'g', children: 'g'},
     {type: 'li', key: 'd', children: 'd'},
   ]
 }
```

<!--a节点比对时，可以直接复用并且都是位于首部，不需要移动，所以跳过直接看下一轮比对-->

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230611162026549.png" alt="image-20230611162026549" style="zoom:60%;" />

1. 比较oldStartIdx和newStartIdx看key是否相同；key不同，不可复用，此步骤什么都不做
2. 比较oldEndIdx和newEndIdx看key是否相同；key不同，不可复用，此步骤什么都不做
3. 比较oldStartIdx和newEndIdx看key是否相同；key不同，不可复用，此步骤什么都不做
4. 比较oldEndIdx和oldStartIdx看key是否相同；key不同，不可复用，此步骤什么都不做
5. 由于在四个步骤中都没有找到可复用的节点，所以这时需要拿新的子节点的首部，去旧的子节点中找可以复用的子节点，找到之后进行DOM移动操作，并将该旧子节点所处索引位置设为undefined

<!--b、c节点比对时，可以直接复用并且都是位于首部，不需要移动，所以跳过直接看下一轮比对-->

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230611162750151.png" alt="image-20230611162750151" style="zoom:60%;" />

1. 比较oldStartIdx和newStartIdx看key是否相同；key不同，不可复用，此步骤什么都不做
2. 比较oldEndIdx和newEndIdx看key是否相同；key不同，不可复用，此步骤什么都不做
3. 比较oldStartIdx和newEndIdx看key是否相同；key相同，可以复用，此步骤先进行patch操作，再移动DOM节点，再更新索引值指向下一个位置

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230611163016303.png" alt="image-20230611163016303" style="zoom:60%;" />

1. 比较oldStartIdx和newStartIdx看key是否相同；key不同，不可复用，此步骤什么都不做
2. 比较oldEndIdx和newEndIdx看key是否相同；key不同，不可复用，此步骤什么都不做
3. 比较oldStartIdx和newEndIdx看key是否相同；key不同，不可复用，此步骤什么都不做
4. 比较oldEndIdx和oldStartIdx看key是否相同；key不同，不可复用，此步骤什么都不做
5. 由于在四个步骤中都没有找到可复用的节点，并且拿新的子节点的首部，去旧的子节点中找可以复用的子节点也没有找到，则说明此节点是新节点，直接挂载即可

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230611163244168.png" alt="image-20230611163244168" style="zoom:60%;" />

由于新子节点的尾部索引已经大于头部索引，所以此时diff结束，将剩余的旧子节点卸载即可

在这个case中，相比较于简单Diff的三次DOM移动操作，双端Diff只需要两次DOM移动操作即可

### 四、快速Diff算法

快速Diff算法在实测中性能最优。快速Diff算法会先处理新旧两组子节点中相同的首部和尾部子节点，当首部和尾部子节点全部处理完毕后，剩余的子节点无法简单通过挂载新节点或者卸载旧子节点来完成更新，则需要根据节点的索引关系，构造出一个**==最长递增子序列==**，该最长递增子序列所指向的节点即为==**不需要移动的节点**==

#### 4.1、common sequence的处理

##### 4.1.1、首部比对

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/diff-1.633a1a31.png)

==从头部开始进行对比，**遇到不同的就结束**==

<!--i是头部索引，e1、e2是尾部索引，循环执行的条件是：头部索引值要小于尾部索引值-->

比对结束之后可能存在两种情况：

1. 旧的比较多

   新的子节点：(a b) c

   旧的子节点：(a b)

   当 i > e2 说明新的比对完成了，但是旧的还有剩余，也就是说i 到 e1之间的内容就是要删除的

   <img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/diff-5.92c37bd1.png" alt="img" style="zoom: 33%;" />

2. 新的比较多

   新的子节点：(a b)

   旧的子节点：(a b) c

   当i > e1 说明旧的全部比对完成，但是新的还有剩余，也就是说i 到 e2之间的内容就是要新增的

   <img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/diff-3.747209db.png" alt="img" style="zoom:33%;" />

##### 4.1.2、尾部比对

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/diff-2.d3e4a7df.png)

==从尾部开始进行对比，**遇到不同的就结束**==

比对结束之后可能存在两种情况：

1. 旧的比较多

   旧的子节点：d e (a b c)

   新的子节点：       (a b c)

   当i > e2 说明新的全部比对完成，但是旧的还有剩余

   也就是说i 到 e1之间的内容就是要删除的

   <img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/diff-6.58f193d3.png" alt="img" style="zoom:33%;" />

2. 新的比较多

   旧的子节点：   (a b)

   新的子节点：c (a b)

   当 i > e1，说明旧的全部比对完成，但是新的还有剩余

   也就是说i 到 e2之间的内容是要新增的

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/diff-4.07076735.png" alt="img" style="zoom:33%;" />

#### 4.2、unknown sequence的处理

`common sequence`的处理完之后，便可以处理`unknown sequence`的部分

![img](http://www.zhufengpeixun.com/jg-vue/assets/img/diff-8.03470ece.png)

1. 首先循环遍历旧的子节点中剩下的部分，进行比对
    * 若遍历到的旧子节点，在新的子节点中找不到相同key的，则直接unmount
    * 若是能找到则进行patch
 2. 再遍历新的子节点中剩下的部分
     * 将能旧的子节点中能复用的部分，按照新的子节点的位置重新“排列”并插入

其实到这里diff比对就已经完成了，但是上面👆处理unknown sequence的部分，其实是有优化的部分；

现在处理旧的子节点的方式是，若旧子节点可以复用则找到锚点进行插入，但是这种操作是一个一个子节点的进行插入的，那这种情况：

- a b [c d e] f g
- a b [e c d h] f g

c和d的相对顺序没有改变，其实可以直接将c和d==视为一个整体不用移动==，直接移动e就好了，若是分开依次进行插入的话未免有些==浪费性能==

所以**Vue3**对于这种情况进行了优化，优化的方法就是**==最长递增子序列==**

#### 4.3、最长递增子序列

==什么是最长递增子序列？==就是求一个数组中，最长连续上升的部分，如下图所示：

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/68747470733a2f2f696d672e616c6963646e2e636f6d2f696d6765787472612f69342f4f31434e30315641454563673235776a43736a7351416a5f2121363030303030303030373539312d322d7470732d3930302d3331302e706e67.png)

图中可以看到，虽然 `3, 7, 22` 也是上升的，但因为 `22` 之后接不下去了，所以其长度是有 3，与 `3, 7, 8, 9, 11, 12` 比起来，肯定不是最长的，因此找起来并不太容易

==在具体 DOM diff 场景中，为了保证尽可能移动较少的 DOM，我们需要 **保持最长上升子序** 不动，只移动其他元素==

为什么呢？因为最长上升子序列本身就相对有序，只要其他元素移动完了，答案也就出来了

还是这个例子，假设旧的一组子节点就是这样一个递增顺序：

<!--数字对应的是子节点的索引值-->

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/68747470733a2f2f696d672e616c6963646e2e636f6d2f696d6765787472612f69322f4f31434e303151483546386a323368784356636e5967785f2121363030303030303030373238382d322d7470732d3931302d3134302e706e67.png)

如果保持最长上升子序不变，只需要移动三次即可生成新的一组子节点

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/68747470733a2f2f696d672e616c6963646e2e636f6d2f696d6765787472612f69322f4f31434e30316d39453937763146763169554a325a516d5f2121363030303030303030303534382d322d7470732d3933342d3134362e706e67.png)

其他任何移动方式都不会小于三步，**因为已经最大程度保持已经有序的部分不动了**。

Vue3中获取==**最长递增子序列**==的采用的算法是==**贪心算法**== + ==**二分查找法**==

> 关于获取==**最长递增子序列**==的算法其实很难以理解，可以看看这篇文章[**精读《DOM diff 最长上升子序列》**](https://github.com/ascoders/weekly/blob/master/%E5%89%8D%E6%B2%BF%E6%8A%80%E6%9C%AF/192.%E7%B2%BE%E8%AF%BB%E3%80%8ADOM%20diff%20%E6%9C%80%E9%95%BF%E4%B8%8A%E5%8D%87%E5%AD%90%E5%BA%8F%E5%88%97%E3%80%8B.md)，虽然没有算法的数学推导过程，但也是有助于理解这个算法的

### 参考文章

[Vue.js设计与实现 霍春阳著](https://weread.qq.com/web/bookDetail/c5c32170813ab7177g0181ae)

