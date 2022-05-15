## Date构造函数相关

### 前言

`Date`是Js中内置的构造函数，用来处理日期和时间

### 一、创建Date实例对象

#### 1.1、`new Date()` 

不带参数 —— 创建一个表示当前日期和时间的 `Date` 对象：

```js
const date = new Date()
// Sun May 15 2022 21:52:05 GMT+0800 (中国标准时间)
```

#### 1.2、`new Date(milliseconds)`

传入一个时间戳（表示自1970年1月1日00:00:00 UTC（the Unix epoch）以来的毫秒数）

```js
// 0 表示 01.01.1970 UTC+0
const date1 = new Date(0);

// 增加 24 小时，得到 02.01.1970 UTC+0
const date2 = new Date(24 * 3600 * 1000);
```

#### 1.3、`new Date(dateString)`

传入一个表示日期的字符串值。该字符串应该能被 [`Date.parse()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Date/parse) 正确方法识别

```js
const date = new Date("2022-01-01");
```

#### 1.4、`new Date(year, month, day, hours, minutes, seconds, milliseconds)`

传入年月日等信息。只有前两个参数是必须的

- `year` 必须是四位数：`2022` 是合法的，`22` 是不合法的
- `month` 计数从 `0`（一月）开始，到 `11`（十二月）结束
- `date` 是当月的具体某一天，如果缺失，则为默认值 `1`， 取值范围`1`到`31`
- 如果 `hours/minutes/seconds/ms` 缺失，则均为默认值 `0`，取值范围分别为 `0`到`23`、`0`到`59`、`0`到`59`、`0`到`999`

```js
new Date(2011, 0, 1, 0, 0, 0, 0); // 1 Jan 2011, 00:00:00
new Date(2011, 0, 1); // 时分秒等默认值为 0
```

#### 1.5、`Date()`

直接使用`Date()`会得到一个表示当前时间的字符串，与表示当前时间的`Date`对象实例调用`toString()`一样的效果

```js
Date();
// 'Sun May 15 2022 22:20:27 GMT+0800 (中国标准时间)'

const date = new Date();
date.toString();
// 'Sun May 15 2022 22:21:29 GMT+0800 (中国标准时间)'
```

### 二、Date上的静态方法

#### 2.1、`Date.now()`

`Date.now`方法返回当前时间距离时间零点（1970年1月1日 00:00:00 UTC）的毫秒数，相当于 Unix 时间戳乘以1000。与表示当前时间的`Date`对象实例调用`valueOf()`一样的效果

```js
Date.now()
// 1652624626315

const date = new Date();
date.valueOf();
// 1652624766333
```

#### 2.2、`Date.parse()`

`Date.parse`方法用来解析日期字符串，返回该时间距离时间零点（1970年1月1日 00:00:00）的毫秒数。

```js
Date.parse("2022-01-01");
// 1640995200000
```

### 三、Date实例对象的方法

Date的实例对象，有几十个自己的方法，除了valueOf和toString，可以分为以下三类。

```js
 to类：从Date对象返回一个字符串，表示指定的时间。
 get类：获取Date对象的日期和时间。
 set类：设置Date对象的日期和时间。
```

#### 5.1 `Date.prototype.valueOf()`

valueOf方法返回实例对象距离时间零点（1970年1月1日00:00:00 UTC）对应的毫秒数，该方法等同于getTime方法

```js
const date = new Date();
date.valueOf();
// 1652624766333
```

预期为数值的场合，Date实例会自动调用该方法，所以可以用下面的方法计算时间的间隔。

```js
 var start = new Date("2022-01-01");
 var end = new Date("2022-01-02");
 var dateReduce = end - start;
// 86400000
```

#### 5.2、 `to`类方法

##### 5.2.1、`Date.prototype.toString()`

toString方法返回一个完整的日期字符串

因为toString是默认的调用方法，所以如果直接读取Date实例，就相当于调用这个方法

```js
const date = new Date();
date.toString();
// 'Sun May 15 2022 22:21:29 GMT+0800 (中国标准时间)'
```

##### 5.2.2、`Date.prototype.toDateString()`

`toDateString`方法返回日期字符串（不含小时、分和秒）

```js
const date = new Date();
date.toDateString();
// 'Sun May 15 2022'
```

##### 5.2.2、`Date.prototype.toTimeString()`

`toTimeString`方法返回时间字符串（不含年月日）

```js
const date = new Date();
date.toTimeString();
// '22:44:32 GMT+0800 (中国标准时间)'
```

##### 5.2.2、`Date.prototype.toLocaleDateString()`

`toLocaleDateString`方法返回一个字符串，代表日期的当地写法（不含小时、分和秒）

```js
const date = new Date();
date.toLocaleDateString();
// '2022/5/15'
```

##### 5.2.2、`Date.prototype.toLocaleTimeString()`

`toLocaleTimeString`方法返回一个字符串，代表时间的当地写法（不含年月日）

```js
const date = new Date();
date.toLocaleTimeString();
// '22:44:32'
```

#### 5.3 get类方法

`Date`对象提供了一系列`get*`方法，用来获取实例对象某个方面的值

`getTime()`：返回实例距离1970年1月1日00:00:00的毫秒数，等同于valueOf方法

```js
const date = new Date();
date.getTime();
// 1652625872759
```

`getDate()`：返回实例对象对应每个月的几号，1 到 31

```js
const date = new Date();
date.getDate();
// 15
```

`getDay()`：返回星期几，0（星期天）到 6（星期六）

```js
const date = new Date();
date.getDay();
// 0
```

`getYear()`：返回距离1900的年数

```js
const date = new Date();
date.getYear();
// 122
```

`getFullYear()`：返回四位的年份

```js
const date = new Date();
date.getFullYear();
// 2022
```

`getMonth()`：返回月份，0（一月）到 11（十二月）

```js
const date = new Date();
date.getMonth();
// 4
```

`getHours()`：返回小时 0（0点）到 23（24点）

```js
const date = new Date();
date.getHours();
// 22
```

`getMinutes()`：返回分钟（0-59）

```js
const date = new Date();
date.getMinutes();
// 44
```

`getSeconds()`：返回秒（0-59）

```js
const date = new Date();
date.getSeconds();
// 32
```

`getMilliseconds()`：返回毫秒（0-999）

```js
const date = new Date();
date.getMilliseconds();
// 759
```

#### 5.4 set类方法

Date对象提供了一系列`set*`方法，用来设置实例对象的各个方面。

 `setDate(date)`：设置实例对象对应的每个月的几号（1-31），返回改变后毫秒时间戳

 `setYear(year)`: 设置距离1900年的年数

 `setFullYear(year [, month, date])`：设置四位年份

 `setHours(hour [, min, sec, ms])`：设置小时（0-23）

 `setMilliseconds()`：设置毫秒（0-999）

 `setMinutes(min [, sec, ms])`：设置分钟（0-59）

 `setMonth(month [, date])`：设置月份（0-11）

 `setSeconds(sec [, ms])`：设置秒（0-59）

 `setTime(milliseconds)`：设置毫秒时间戳

这些方法基本是跟`get*`方法一一对应的，但是没有`setDay`方法，因为星期几是计算出来的，而不是设置的。另外，需要注意的是，凡是涉及到设置月份，都是从`0`开始算的，即`0`是`1`月，`11`是`12`月。

`set*`方法的参数都会自动折算。以`setDate`为例，如果参数超过当月的最大天数，则向下一个月顺延，如果参数是负数，表示从上个月的最后一天开始减去的天数

```js
const date = new Date();
date.getDate();
// 15
date.setDate(33);
date.getDate();
// 2
```

`set类`方法和`get类`方法，可以结合使用，得到相对时间

```js
 var d = new Date();
 // 将日期向后推1000天
 d.setDate(d.getDate() + 1000);
 // 将时间设为6小时后
 d.setHours(d.getHours() + 6);
 // 将年份设为去年
 d.setFullYear(d.getFullYear() - 1);
```



