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




