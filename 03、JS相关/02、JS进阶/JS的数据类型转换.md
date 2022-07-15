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

JavaScript 不允许自定义运算符对对象的处理方式。与其他一些编程语言（Ruby，C++）不同，我们无法实现特殊的对象处理方法来处理加法（或其他运算）

在此类运算的情况下，对象会被自动转换为原始值，然后对这些原始值进行运算，并得到运算结果（也是一个原始值）

这是一个重要的限制：因为 `obj1 + obj2`（或者其他数学运算）的结果不能是另一个对象！

#### 2.1、转换规则

JavaScript 对象只能转换为`Number`和`String`类型的原始值；

- **数字转换**发生在**对象相减**或**应用数学函数**时
  - 例如，`Date` 对象可以相减，`date1 - date2` 的结果是两个日期之间的差值
- **字符串转换**通常发生在我们像 `alert(obj)` 这样输出一个对象和类似的上下文中

需要注意的是：JavaScript 对象**不会转换为布尔值**，所有的对象在布尔上下文（`context`）中均为 `true`

##### 2.1.1、hint

JavaScript 是如何决定将对象转换为那种原始值的？

对象的类型转换在各种情况下有三种变体，它们被称为 `hint`：

- `string`

  对象到字符串的转换，当我们对期望一个字符串的对象执行操作时，如 `alert`：

  ```js
  // 输出 
  alert(obj); 
  // 将对象作为属性键 
  anotherObj[obj] = 123;
  ```

- `number`

  对象到数字的转换，例如当我们进行数学运算时：

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

  例如，二元加法 `+` 可用于**字符串连接**，也可以用于**数字相加**。因此，当二元加法得到对象类型的参数时，它将依据 `default` `hint` 来对其进行转换。

  此外，如果对象被用于与字符串、数字或 `symbol` 进行 `==` 比较，这时到底应该进行哪种转换也不是很明确，因此使用 `default` `hint`

  ```js
  // 二元加法使用默认 hint
  let total = obj1 + obj2;
  
  // obj == number 使用默认 hint
  if (user == 1) { ... };
  ```

  像 `<` 和 `>` 这样的小于/大于比较运算符，也可以同时用于字符串和数字。不过，它们使用 `number` `hint`，而不是 `default`

**为了进行转换，JavaScript 尝试查找并调用三个对象方法：**

- 首先尝试调用 `obj[Symbol.toPrimitive](hint)` 

  - 带有 symbol 键 `Symbol.toPrimitive`（系统 symbol）的方法，如果这个方法存在的话

- 若没有 `obj[Symbol.toPrimitive](hint)` 

  - 如果 hint 是 `string` ，则尝试调用`obj.toString()` 或 `obj.valueOf()`

    - 先调用`obj.toString()` ，若没有`obj.toString()` 或者`obj.toString()` 的返回值不是基本类型，则继续调用 `obj.valueOf()`

  - 如果 hint 是 `number` 或 `default` 则尝试调用 `obj.valueOf()` 或 `obj.toString()`

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

如果没有 `Symbol.toPrimitive`，那么 JavaScript 将尝试寻找 `toString` 和 `valueOf` 方法：

- 对于 `string` `hint`：调用 `toString` 方法，如果它不存在，则调用 `valueOf` 方法（因此，对于字符串转换，优先调用 `toString`）。
- 对于其他 `hint`：调用 `valueOf` 方法，如果它不存在，则调用 `toString` 方法（因此，对于数学运算，优先调用 `valueOf` 方法）。

 `toString` 或 `valueOf` 必须返回一个原始值。如果 `toString` 或 `valueOf` 返回了一个对象，那么返回值会被忽略

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

#### 2.5、常见的类型转换场景