## JS原始数据类型之Symbol

### 一、Symbol是什么

**JavaScript** 的 **Symbol** 是一种**==原始数据类型==**，==**用于表示唯一的标识符**==。**Symbol**是在 **ES6（ECMAScript 2015）**中引入的，提供了一种==创建**完全唯一且不可变**的值==的方法；**Symbol** 的创建是通过调用==**全局 Symbol 函数**==来实现的，它会返回一个**==新的 Symbol 值==**

==**Symbol** 值是独一无二的==，这意味着它们==可以用作对象属性的键（属性名）==，这样可以==确保每个对象属性的键都是唯一的==，即使它们的名称相同。这使得 **Symbol** 成为一个非常有用的功能，特别是在开发库和框架时，需要确保在不同的代码段中==使用相同的属性名称时不会发生冲突==

<!--需要注意的是，Symbol 值不是字符串，尽管可以使用字符串作为参数来创建 Symbol，但是 Symbol 值本身是唯一且不可变的-->

```js
let var1 = Symbol('只是用来作为标识使用')
let var2 = Symbol('我也只是标识')
var1 === var2 // false

let var3 = Symbol.for('标识')
let var4 = Symbol.for('标识')
var3 === var4 // true

//Symbol构造函数原型上有个属性description可以用来拿到Symbol的标识
```

另外，**Symbol** 还具有**==内置的 Symbol 属性==**，它们提供了一种标准化的方法来定义对象的行为，如迭代器、原型、异步迭代器等。在 **JavaScript** 中，许多内置对象使用 **Symbol** 属性来实现这些功能，例如，迭代器的实现可以使用内置的 **Symbol.iterator** 属性

**Symbol**上的一些**==内置属性==**则是挂在**Symbol()**这个构造函数上的**==静态属性==**

```js
ƒ Symbol()
arguments: (...)
asyncIterator: Symbol(Symbol.asyncIterator)
caller: (...)
for: ƒ for()
hasInstance: Symbol(Symbol.hasInstance)
isConcatSpreadable: Symbol(Symbol.isConcatSpreadable)
iterator: Symbol(Symbol.iterator)
keyFor: ƒ keyFor()
length: 0
match: Symbol(Symbol.match)
matchAll: Symbol(Symbol.matchAll)
name: "Symbol"
prototype: Symbol
constructor: ƒ Symbol()
description: (...)
toString: ƒ toString()
valueOf: ƒ valueOf()
Symbol(Symbol.toPrimitive): ƒ [Symbol.toPrimitive]()
Symbol(Symbol.toStringTag): "Symbol"
get description: ƒ description()
__proto__: Object
replace: Symbol(Symbol.replace)
search: Symbol(Symbol.search)
species: Symbol(Symbol.species)
split: Symbol(Symbol.split)
toPrimitive: Symbol(Symbol.toPrimitive)
toStringTag: Symbol(Symbol.toStringTag)
unscopables: Symbol(Symbol.unscopables)
__proto__: ƒ ()
[[Scopes]]: Scopes[0]
```

**Symbol.hasInstance** 、**Symbol.iterator**这些都是，且这些属性值也是**Symbol**类型的数据

```js
typeof Symbol.hasInstance  // 'symbol'
Symbol.hasInstance.description // 'Symbol.hasInstance'
```

### 二、使用Symbol进行元编程

所谓的“元编程”就是改变**js**本身的功能，也就是可以使用一些内置的 **Symbol** 属性来**==定义对象的行为==**

例如 **Symbol.iterator** 和 **Symbol.asyncIterator**，这些属性用于定义**迭代器**和**异步迭代器**。可以**==通过在对象上定义这些属性来使其具有相应的行为==**，例如：

```js
const myIterable = {
  [Symbol.iterator]: function* () {
    yield 1;
    yield 2;
    yield 3;
  }
};

for (const value of myIterable) {
  console.log(value);
}
// 输出:
// 1
// 2
// 3
```

该代码定义了一个名为 **myIterable** 的对象，它具有 **Symbol.iterator** 属性，该属性定义了一个**生成器函数**，该函数可以生成一系列值

==使用 **for-of 循环**遍历该对象时==，**JavaScript** 引擎会==**自动查找**该对象的 **Symbol.iterator** 属性==，并使用它来返回一个**迭代器对象**，该对象将依次生成 **myIterable** 中定义的值

总之，**Symbol** 可以用于**==创建唯一的标识符==**，并用于**==定义对象的行为==**

