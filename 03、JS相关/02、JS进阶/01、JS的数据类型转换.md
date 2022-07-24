## JS中的隐式类型转换

### 前言

JavaScript 是一种**弱类型**语言，在进行算术运算或者逻辑运算时，运算符两边的数据可以是任意类型。比如，一个数字可以和字符串相加：

```js
1 + '1' // '11'
```

这其中的原理是，在程序运行过程中，**JavaScript引擎**会在运算之前会将数据进行**隐式类型转换**

### 一、JavaScript中的内置数据类型

以下是js中的8种内置数据类型：

- Number
- String
- Boolean
- Null
- Undefined
- Object
- Symbol (ES2015)
- BigInt (ESNext stage 4)

js的数据类型分为**基本类型**和**复合类型**两种，除了对象，其它都是基本类型

### 二、JavaScript 对象的类型转换

**JavaScript 不允许自定义运算符处理对象**，与其他一些编程语言（Ruby，C++）不同，我们无法针对对象实现**特殊的处理方法**来处理加法（或其他运算）；

所以在此类运算的情况下，对象会被自动转换为原始值，然后对这些原始值进行运算，并得到运算结果（也是一个原始值）；

这是一个重要的限制：因为 `obj1 + obj2`（或者其他数学运算）的结果不能是另一个对象

#### 2.1、转换规则

JavaScript 对象只能转换为`Number`和`String`类型的原始值；

- **数字转换**发生在**对象相减**或**应用数学函数**时
  - 例如，`Date` 对象可以相减，`date1 - date2` 的结果是两个日期之间的差值
- **字符串转换**通常发生在我们像 `alert(obj)` 这样输出一个对象和类似的上下文中

需要注意的是：JavaScript 对象**不会转换为布尔值**，所有的对象在布尔上下文（`context`）中均为 `true`

##### 2.1.1、hint

Javascript对象既然可以转换为`Number`和`String`类型的原始值，那么究竟是转换为`Number`类型还是`String`类型呢？

Javascript对象转换为原始值有以下三种情况（`hint`）：

<!--hint 直译是“暗示” 这里可以理解为 期望将对象转换的原始值类型，hint 是 "number"、"string" 、"default" 中的任意一个-->

- `string`

  **对象到字符串的转换**，**期望**将对象作为**字符串**进行操作时，如 `alert`：

  ```js
  // 输出 
  alert(obj); 
  // 将对象作为属性键 
  anotherObj[obj] = 123;
  ```

- `number`

  **对象到数字的转换**，**期望**将对象最为**数字**进行操作时：

  ```js
  // 显式转换
  let num = Number(obj);
  
  // 数学运算（除了二元加法）
  let n = +obj; // 一元加法
  let delta = date1 - date2;
  
  // 小于/大于的比较
  let greater = user1 > user2;
  ```

  大多数内建的数学函数也包括这种转换

- `default`

  在少数情况下发生，当运算符“**不确定**”期望值的类型时:

  例如：

  - 二元加法 `+` 可用于**字符串连接**，也可以用于**数字相加**。因此，当二元加法得到对象类型的参数时，它将依据 `default` `hint` 来对其进行转换

  - 如果对象被用于与字符串、数字或 `symbol` 进行 `==` 比较，这时到底应该进行哪种转换也不是很明确，因此使用 `default` `hint`
  
    ```js
    // 二元加法使用默认 hint
    let total = obj1 + obj2;
    
    // obj == number 使用默认 hint
  if (user == 1) { ... };
    ```
  
  **主要注意：**像 `<` 和 `>` 这样的小于/大于比较运算符，也可以同时用于字符串和数字。不过，它们使用 `number` `hint`，而不是 `default`

##### 2.1.2、类型转换方法

javaScript对象的类型转换主要有三个方法：`obj[Symbol.toPrimitive](hint)` 、`obj.toString()`、 `obj.valueOf()`

这三个方法的调用顺序如下：

- 首先尝试调用 `obj[Symbol.toPrimitive](hint)` 

  - 若对象有`obj[Symbol.toPrimitive](hint)` 这个方法的话，则直接使用这个方法完成类型转换

- 若没有 `obj[Symbol.toPrimitive](hint)` ，则根据`hint`类型调用`obj.toString()` 或 `obj.valueOf()`

  - 如果 `hint` 是 `string` 

    - 先调用`obj.toString()` ，若没有`obj.toString()` 或者`obj.toString()` 的返回值不是基本类型，则继续调用 `obj.valueOf()`

  - 如果 `hint` 是 `number` 或 `default` 

    - 先调用`obj.valueOf()` ，若没有`obj.valueOf()` 或者`obj.valueOf()` 的返回值不是基本类型，则继续调用 `obj.toString()`

    <!--如果同时没有valueOf和toString方法，或者返回的都不是基本类型，那么直接抛出TypeError异常-->

#### 2.2、Symbol.toPrimitive

`Symbol.toPrimitive` 是一个内置的 Symbol 值，它是作为对象的函数值属性存在的，当一个对象转换为对应的原始值时，会调用此函数。

在 `Symbol.toPrimitive` 属性 (用作函数值) 的帮助下，一个对象可被转换为原始值。该函数被调用时，会被传递一个字符串参数 `hint` ，表示要转换到的原始值的预期类型。 `hint` 参数的取值是 `"number"`、`"string"` 和 `"default"` 中的任意一个

```js
obj[Symbol.toPrimitive] = function(hint) {
  // 这里是将此对象转换为原始值的代码
  // 它必须返回一个原始值
  // hint = "string"、"number" 或 "default" 中的一个
}
```

如果 `Symbol.toPrimitive` 方法存在，则它会被用于所有 `hint`，无需更多其他方法

例如，这里 `user` 对象实现了它：

```javascript
let user = {
  name: "John",
  money: 1000,

  [Symbol.toPrimitive](hint) {
    alert(`hint: ${hint}`);
    return hint == "string" ? `{name: "${this.name}"}` : this.money;
  }
};

// 转换演示：
alert(user); // hint: string -> {name: "John"}
alert(+user); // hint: number -> 1000
alert(user + 500); // hint: default -> 1500
```

从代码中我们可以看到，根据转换的不同，`user` 变成一个自描述字符串或者一个金额

`user[Symbol.toPrimitive]` 方法处理了所有的转换情况

#### 2.3、toString和valueOf

如果没有 `Symbol.toPrimitive`，那么 JavaScript 将尝试调用 `toString()` 或 `valueOf()`：

- 对于 `string` `hint`：先调用`toString()` 方法，若`toString()`不存在，则调用`valueOf()` 方法
- 对于其他 `hint`：调用`valueOf()`  方法，如果它不存在，则调用`toString()`  方法

<!-- `toString` 或 `valueOf` 必须返回一个原始值。如果 `toString` 或 `valueOf` 返回了一个对象，那么返回值会被忽略-->

```js
let user = {
  name: "John",
  money: 1000,

  // 对于 hint="string"
  toString() {
    return `{name: "${this.name}"}`;
  },

  // 对于 hint="number" 或 "default"
  valueOf() {
    return this.money;
  }

};

alert(user); // toString -> {name: "John"}
alert(+user); // valueOf -> 1000
alert(user + 500); // valueOf -> 1500
```

#### 2.4、常见的Javascript对象的类型转换

| 对象     | valueOf() | toString()             | Symbol.toPrimitive的hint |
| -------- | --------- | ---------------------- | ------------------------ |
| Object   | 原值      | "[object Object]"      | Number                   |
| Function | 原值      | "function xyz() {...}" | Number                   |
| Array    | 原值      | "x,y,z"                | Number                   |
| Date     | 数字      | "Sat May 22 2021..."   | String                   |

数组的toString()可以等效为`join(",")`，遇到`null,` `undefined`都被忽略，遇到symbol直接报错

### 三、常见的Javascript对象类型转换场景

一些特殊值转为数字的例子，下面会用到

```js
Number("0") === 0;
Number("") === 0;
Number("   ") === 0;
Number("\n") === 0;
Number("\t") === 0;
Number(null) === 0;
Number(false) === 0;

Number(true) === 1;

Number(undefined); // NaN
Number("x"); // NaN
```

#### 3.1、二元加法 `+` 

二元加法 `+` 可用于字符串（连接），也可以用于数字（相加）。因此，当使用二元加法运算JavaScript对象时，将依据 `"default"` `hint` 来对其进行转换

```js
let user = {
  name: "John",
  money: 1000,

  [Symbol.toPrimitive](hint) {
    alert(`hint: ${hint}`);
    return hint == "string" ? `{name: "${this.name}"}` : this.money;
  }
};

alert(user + 500); // hint: default -> 1500
```

若没有`Symbol.toPrimitive`，则先调用`valueOf()`

```javascript
let user = {
  name: "John",
  money: 1000,

  // 对于 hint="string"
  toString() {
    return `{name: "${this.name}"}`;
  },

  // 对于 hint="number" 或 "default"
  valueOf() {
    return this.money;
  }

};
alert(user + 500); // hint: default valueOf -> 1500
```

二元加法运算JavaScript对象时的类型转换就是上面👆这两种处理方式，下面👇看下二元加法的一些具体使用场景

- **字符串 + 任意值** 

  这种场景会被处理成**字符串的拼接**，其中任意值若是JavaScript对象的话，JavaScript对象会先进行类型转换，转换为**基础类型值**（hint为default），之后该**基础类型值**再完成`String`类型的转换

  <!--注意：若对象转换为String类型的基础类型值，则也遵循这个规则，即这种场景下 Obj + 11 (其中Obj会被转换为String)，11会被转换为'11'，再完成字符串的拼接-->

  ```js
  let user = {
    name: "John",
    money: '1000',
  
    // 对于 hint="string"
    toString() {
      return `{name: "${this.name}"}`;
    },
  
    // 对于 hint="number" 或 "default"
    valueOf() {
      return this.money;
    }
  
  };
  
  '1' + user // hint: default valueOf -> '1' + 1000  -> '1' + '1000' ->  '10001'
  // user 先转换为基本类型 得到 1000
  // 1000 + '1'运算时，Number类型的1000转换为String类型的'1000'
  ```

- ##### 非字符串 + 非字符串

  这种场景会被处理为数字的**加法运算**，其中任意值若是JavaScript对象的话，JavaScript对象会先进行类型转换，转换为**基础类型值**（hint为default），之后该**基础类型值**再完成`Number`类型的转换

  ```js
  let user = {
    name: "John",
    money: true,
  
    // 对于 hint="string"
    toString() {
      return `{name: "${this.name}"}`;
    },
  
    // 对于 hint="number" 或 "default"
    valueOf() {
      return this.money;
    }
  
  };
  
  1 + user // hint: default valueOf -> true + 1 -> 1 + 1 ->  2
  // user 先转换为基本类型 得到 true
  // 1 + true 运算时，Boolean类型的true转换为Number类型的1
  ```

以上就是二元加法 `+` 中涉及到的类型转换规则，是不是很简单，那么看下下面👇这个题目

```js
[] + {}
```

首先，`[]` 和`{}`都是JavaScript对象，因此需要先转换为原始类型，因为是二元加法 `+`，所以`hint`时`default`

首先调用`valueOf()`方法，但是`[].valueOf()`和`({}).valueOf()`得到的都是原值（还是`[]` 和`{}`）不是原始值;

所以接着调用`toString()`方法

```js
[].toString() === ""; // [].toString() 相当于[].join(',')
{}.toString() === "[object Object]";

[] + {} === "[object Object]";
```

#### 3.2、二元减法`-`、二元乘法`*`、一元运算 `+` `-`

二元减法`-`、二元乘法`*`、一元运算 `+` `-`的运算都是数字的运算符，因此，当使用这些运算符运算JavaScript对象时，将依据 `"number"` `hint` 来对其进行转换

```js
let obj = {
  toString() {
    return "2";
  }
};

alert(obj * 2); // 4
// 乘法 obj * 2 首先将对象转换为原始值（字符串 “2”）。
// 之后 "2" * 2 变为 2 * 2（字符串被转换为数字）。
```

#### 3.3、宽松相等 `==`

相对于全等`===`都需要对类型进行判断，当类型不一致时，宽松相等`==`会触发隐式转换。

具体类型转换规则如下：

- **数字 == 字符串**，字符串转换成数字再进行比较

  ```javascript
  "2" == 2  // true
  
  // [].toString() => "" => Number("") => 0
  [] == 0 // true
  
  [1] == 1 // true
  
  // [1,2].toString() => "1,2" => Number("1,2") => NaN
  [1,2] != 1 // true
  ```

- **布尔值 == 非布尔值**，布尔值先转换成数字，再按数字规则操作

  ```javascript
  // [] => "" => Number("") => 0
  // false => 0
  [] == false // true
  
  // [1] => "1" => 1
  // true => 1
  [1] == true // true
  
  // [1,2] => "1,2" => NaN
  // true => 1
  [1,2] != true // false
  
  "0" == false // true
  
  "" == false // true
  ```

- **对象 == 对象**，类型一致则不做转换

  ```javascript
  {} != {} // true
  [] != {} // true
  [] != [] // true
  ```

  很容易理解，对象不是同一个，自然不会相等

- **对象 == 基本值**，对象会先转换为基本类型，`hint`为`default`

  ```javascript
  "[object Object]" == {} //  true
  [] == "" // true
  [1] == "1" // true
  [1,2] == "1,2" // true
  ```

- ##### null、undefined、symbol

  null、undefined与任何非自身的值对比结果都是false，但是`null == undefined` 是一个特例。

  ```javascript
  null == null // true
  
  undefined == undefined // true
  
  null == undefined // true
  
  null != 0 // true
  
  null != false // true
  
  undefined != 0 // true
  
  undefined != false // true
  
  Symbol('x') != Symbol('x') // true
  ```

#### 3.4、对比 `< >`

对比不像相等，可以严格相等（`===`）防止类型转换，对比**一定**会发生**隐式类型转换**

- **对象对比**，对象会先转换为基本类型，`hint`为`default`

  ```javascript
  [] < [] // false
  
  // '' <= '[object Object]' => true
  [] <= {} // true
  
  {} < {} // false
  
  // '[object Object]' <= '[object Object]' => true
  {} <= {} // true
  ```

- **任何一边出现非字符串的值，则一律转换成数字做对比**

  ```javascript
  // ["06"] => "06" => 6
  ["06"] < 2   // false 
  
  ["06"] < "2" // true
  ["06"] > 2   // true
  
  5 > null     // true
  -1 < null    // true
  0 <= null    // true
  
  0 <= false   // true
  0 < false    // false
  
  // undefined => Number(...) => NaN
  5 > undefined // false
  ```

### 三、Boolean类型数据的隐式转换

布尔值的隐式转换通常发生在以下几个场景中：

- if(...)
- for(;...;)
- while(...)
- do while(...)
- ... ? :
- ||
- &&

Boolean类型数据的隐式转换，除了以下几个值会被转换为`false`，其他都会被转换为`true`

- undefined
- null
- false
- +0
- -0
- NaN
- ""

### 四、总结

对象到原始值的转换，是由许多期望以原始值作为值的内建函数和运算符自动调用的。

这里有三种类型（hint）：

- `"string"`（对于 `alert` 和其他需要字符串的操作）
- `"number"`（对于数学运算）
- `"default"`（少数运算符，通常对象以和 `"number"` 相同的方式实现 `"default"` 转换）

规范明确描述了哪个运算符使用哪个 hint。

转换算法是：

1. 调用 `obj[Symbol.toPrimitive](hint)` 如果这个方法存在，
2. 否则，如果 `hint` 是`"string"`
   - 尝试调用 `obj.toString()` 或 `obj.valueOf()`，无论哪个存在。
3. 否则，如果 `hint` 是`"number"`或者`"default"`
   - 尝试调用 `obj.valueOf()` 或 `obj.toString()`，无论哪个存在。

所有这些方法都必须返回一个原始值才能工作


