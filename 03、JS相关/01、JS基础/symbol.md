`Symbol`是一种类似于字符串的数据类型，用来表示独一无二的值

```
let var1 = Symbol('只是用来作为标识使用')
let var2 = Symbol('我也只是标识')
var1 === var2 // false

let var3 = Symbol.for('标识')
let var4 = Symbol.for('标识')
var3 === var4 // true

Symbol构造函数原型上有个属性description可以用来拿到Symbol的标识
```

至于Symbol上的一些内置属性则是挂在Symbol()这个构造函数上的静态属性

```
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

Symbol.hasInstance 、Symbol.iterator这些都是，且这些属性值也是Symbol类型的数据

```
typeof Symbol.hasInstance  // 'symbol'
Symbol.hasInstance.description // 'Symbol.hasInstance'
```

所以其他数据例如Array()上的Symbol.isConcatSpreadable其实就是个Symbol类型的属性名，相当于Symbol("Symbol.isConcatSpreadable")





### Iterator

**遍历器（Iterator）**就是一种机制。它是一种接口，为各种不同的数据结构提供统一的访问机制。任何数据结构只要部署Iterator 接口（在js中就是对象的一个属性），就可以完成遍历操作；

ES6创造了一种新的遍历命令for...of循环，Iterator接口主要供for...of；

原生具备iterator接口的数据(可用for of遍历) 

a) Array 

b) Arguments 

c) Set 

d) Map 

e) String 

f) TypedArray 

g) NodeList 

**工作原理**

a) 创建一个指针对象，指向当前数据结构的起始位置

b) 第一次调用对象的next方法，指针自动指向数据结构的第一个成员

c) 接下来不断调用next方法，指针一直往后移动，直到指向最后一个成员

d) 每调用next方法返回一个包含value和done



