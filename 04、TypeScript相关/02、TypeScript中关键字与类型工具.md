## TypeScript 使用记录（二）关键字与类型工具

### 四、TS中的关键字

#### 4.1、`typeof`

TS 和 JS 里面都有 `typeof` 关键字，并且其二者的作用都差不多

差异是转化结果不一样：

- 在 TS 中，是转化成 **一个 TS 类型定义，也就是`type`**，**JS data -> TS type**
- 在 JS 中，是转化成 **一个字符串，表示未经计算的操作数的类型**，**JS data -> JS data**

而使用的地方决定了它是 TS 还是 JS 的 `typeof`

```typescript
// JS 对象
const JPeople = {
  name: "张大炮",
  age: 18,
};

// TS 类型 type
type TPeople = {
  name: string;
  age: number;
};

// TS 类型 interface
interface IPeople {
  name: string;
  age: number;
}

// 以下方式会被认为是 JS 的 typeof, 使用的是const语法
const JsKeyword1 = typeof JPeople; // const JsKeyword1 = "string"
const JsKeyword2 = typeof TPeople; // 错误，TPeople 不是数据，不能获取数据类型
const JsKeyword3 = typeof IPeople; // 错误，IPeople 不是数据，不能获取数据类型

// 以下方式会被认为是 TS 的 typeof，使用的是type语法
type TsType1 = typeof JPeople; // type TsType1 = {name: string; age: number}
type TsType2 = typeof TPeople; // 错误，TPeople 已经是 TS 类型了，不能再转化
type TsType3 = typeof IPeople; // 错误，IPeople 已经是 TS 类型了，不能再转化
```

在 TS 中，`typeof` 只能对**数据**进行转化，所以不能转化 `type` 和 `interface`，因为`enum`枚举类型其实是个`JS`对象，所以可以使用`typeof enum`，不过貌似没啥用，有用的是这种 `keyof typeof enum`

#### 4.2、`keyof`

`keyof` 的作用将一个 **类型** 映射为它 **所有成员名称的联合类型**

- `type` -> `type（联合类型）`
- `interface` -> `type（联合类型）`

```typescript
// 用 TS interface 描述对象
interface TsInterfaceObject {
  first: string;
  second: number;
}
/**
 * 将所描述对象中的所有 key 组合成一个联合类型
 * type NameUnionOfInterface = "first" | "second"
 */
type NameUnionOfInterface = keyof TsInterfaceObject;



// 用 TS type 描述对象
type TsTypeObject = {
  first: string;
  second: number;
};
/**
 * 将所描述对象中的所有 key 组合成一个联合类型
 * type NameUnionOfType = "first" | "second"
 */
type NameUnionOfTypeObj = keyof TsTypeObject;



// 用 Ts type 描述基本类型别名
type TsTypeAlias = string;
/**
 * 对一个非对象类型使用 keyof 后，会返回其 prototype 上所有 key 组合成的一个联合类型
 * type NameUnionOfTypeAlias = number | typeof Symbol.iterator | "toString" | "charAt" | ...
 */
type NameUnionOfTypeAlias = keyof TsTypeAlias;


class JsClass {
  private priData: number;
  private priFunc() {}

  public pubData: number;
  public pubFunc1() {}
  public pubFunc2() {}
}
/**
 * 其实也是返回 prototype 上所有 key（因为其实 private 私有部分实际是放在实例化对象中，而非原型）
 * type NameUnionOfClass = "pubData" | "pubFunc1" | "pubFunc2"
 */
type NameUnionOfClass = keyof JsClass;
```

#### 4.3、`typeof + keyof` 

三个知识点

- `typeof` 可以进行 **JS data -> TS type** 的转换
- `keyof` 可以进行 **TS type -> TS (union) type** 的转换
- `enum` 其实就是 **JS (object) data**

```typescript
// JS 对象
const JsObject = {
  first: "第一个",
  second: 222,
};

// TS 枚举
enum TS_ENUM {
  FIRST,
  SECOND,
}

type NameUnionOfObject = keyof typeof JsObject; // type NameUnionOfObject = "first" | "second"
type NameUnionOfEnum = keyof typeof TS_ENUM; // type NameUnionOfObject = "FIRST" | "SECOND"
```

#### 4.4、`in`

关键字 `in` 是用来遍历**枚举类型**的, `in` 用于遍历目标类型的**公开属性名**，类似 `for .. in` 的机制。

```typescript
// TS 联合类型
type TsTypeUnion = "first" | "second";

// type TsTypeObject1 = { first: any, second: any }
type TsTypeObject1 = {
  [P in TsTypeUnion]: any;
};

// type TsTypeObject2 = { first: "first", second: "second" }
type TsTypeObject2 = {
  [P in TsTypeUnion]: P;
};
```

**`in` + `keyof` 使用**

- `keyof` 将 **描述对象的类型** 转化为 **枚举类型**
- `in` 对 **枚举类型** 进行遍历

```typescript
// TS 描述对象的类型
type TsTypeObject = {
  first: string;
  second: number;
};

// type TsTypeObjectNew1 = { first: any, second: any }
type TsTypeObjectNew1 = {
  [P in keyof TsTypeObject]: any;
};

// type TsTypeObjectNew2 = { first: string, second: number }
type TsTypeObjectNew2 = {
  [P in keyof TsTypeObject]: TsTypeObject[P];
};
```

**`in` + `keyof` + `typeof`  使用**

- `typeof` 将 **JS 对象** 转化为 **描述对象的类型**
- `keyof` 将 **描述对象的类型** 转化为 **枚举类型**
- `in` 对 **枚举类型** 进行遍历

```typescript
// JS 对象
const JsObject = {
  name: "张大炮",
  age: 18,
};

// type TsTypeObject1 = { name: any; age: any; }
type TsTypeObject1 = {
  [P in keyof typeof JsObject]: any;
};

/**
 * 等价于下面两种写法：
 * type TsTypeObject2 = { name: string; age: number; }
 * type TsTypeObject2 = typeof JsObject
 */
type TsTypeObject2 = {
  [P in keyof typeof JsObject]: typeof JsObject[P];
};
```

处理 TS 枚举：

```typescript
// 纯数字枚举
enum ENUM_NUMBER {
  FIRST,
  SECOND,
  THIRD,
}

enum ENUM_WHEREVER {
  FIRST = "第一个",
  SECOND = "第二个",
  THIRD = 333,
}

/**
 * 
    type TsType1 = {
      [x: number]: any;
      readonly FIRST: any;
      readonly SECOND: any;
      readonly THIRD: any;
    }
 */
type TsType1 = {
  [P in keyof typeof ENUM_NUMBER]: any;
};

/**
    type TsType2 = {
      [x: number]: string;
      readonly FIRST: ENUM_WHEREVER.FIRST;
      readonly SECOND: ENUM_WHEREVER.SECOND;
      readonly THIRD: ENUM_WHEREVER.THIRD;
    }
 */
type TsType2 = {
  [P in keyof typeof ENUM_WHEREVER]: typeof ENUM_WHEREVER[P];
};
```

#### 4.5、`extends`

在 TS 中，`extends` 大体分为三种使用场景：

- **类型继承**，类型 A 去继承类型 B（`interface` 可用 `extends` 继承，`type` 不可以）
- **定义泛型**，约束泛型必须是与目标类型“匹配的”
- **条件匹配**，判断类型 A 是否“匹配”类型 B

##### 4.5.1、类型继承

```typescript
interface IHuman {
  gender: "male" | "female";
  age: number;
}

interface IProgrammer {
  language: "java" | "php" | "javascript";
}

/**
 * interface 的继承
 * 可以同时继承多个 interface，它们之间用逗号分隔
 */
interface IWebDeveloper extends IProgrammer, IHuman {
  skill: "vue" | "react";
}

const Me: IWebDeveloper = {
  skill: "react",
  language: "javascript",
  age: 18,
  gender: "male",
};
```

##### 4.5.2、定义泛型

```typescript
enum GENDER {
  MALE,
  FEMALE,
}
// 约束范型 G 必须是 GENDER 的子类
interface IHuman<G extends GENDER> {
  gender: G;
  age: number;
}

enum LANGUAGE {
  JAVA,
  PHP,
  JAVASCRIPT,
}
// 约束范型 L 的类型并且定义默认值
interface IProgrammer<L extends LANGUAGE = LANGUAGE.JAVASCRIPT> {
  language: L;
}

interface IWebDeveloper extends IProgrammer, IHuman<GENDER.MALE> {
  skill: "vue" | "react";
}

const Me: IWebDeveloper = {
  skill: "react",
  language: "javascript",
  age: 18,
  gender: "male",
};
```

##### 4.5.3、条件类型实现

条件类型实现的形式看起来类似于JS中的三目运算符，如果`extends`左侧的类型可以赋值给`extends`右侧的类型，则返回`TrueType`,否则返回`FalseType`

```typescript
SomeType extends OtherType ? TrueType : FalseType;
```

注意：这里的`extends`不是继承的意思，而是指`SomeType`类型能否赋值给`OtherType`

```typescript
type Bool = 'a' extends 'a' | 'b' ? 'yes' : 'no'; // Bool => 'yes'

// 'a' | 'b' 类型的值不能赋值给 'a'类型
type Bool = 'a' | 'b' extends 'a' ? 'yes' : 'no'; // Bool => 'no'
```

```typescript
type Human = {
    name: string;
  }
type Duck = {
    name: string;
  }
// 因为Human 和 Duck的类型一致，也就是说Duck类型的值可以赋值给Human类型的变量
type Bool = Man extends Human ? 'yes' : 'no'; // Bool => 'yes'
```

给`Human`类型加上`gender`属性就不一样了

```typescript
type Human = {
    name: string;
    speak: boolean
  }
type Duck= {
    name: string;
  }
// 因为Human类型多了一个gender类型，也就是说Duck类型的值不能够可以赋值给Human类型的变量
type Bool = Duck extends Human ? 'yes' : 'no'; // Bool => 'no'
```

```typescript
// 为什么说Duck类型的值不能够可以赋值给Human类型的变量，这里涉及到TS的兼容性，Duck类型的值能否赋值给Human类型，主要看Human类型中的所有属性能否在Duck类型的值中找到，找不到到就不可以赋值，找得到就可以赋值，至于Duck类型中有没有多余的属性就不重要了，所以下面这种就是可以赋值的
type Human = {
    name: string;
  }
type Duck= {
    name: string;
    speak: false，
  }
type Bool = Duck extends Human ? 'yes' : 'no'; // Bool => 'yes'
```

自定义类型

```typescript
// 判断范型 T 是否匹配于 number
type OnlyWantNumber<T> = T extends number ? any : never;

type Type1 = OnlyWantNumber<number>; // type Type1 = any
type Type2 = OnlyWantNumber<string>; // type Type2 = never
```

当`SomeType`是<u>***泛型类型且传入该泛型参数的是联合类型***</u>，会有些特殊

如果 `extends` 左侧的类型为<u>***泛型类型且传入该泛型参数的是联合类型***</u>，那么整个表达式会被拆解，就像数学中的分解因式子一样，使用分配律计算最终的结果。分配律是指，***<u>将联合类型的联合项拆成单项</u>***，分别代入条件类型，然后将每个单项代入得到的结果再联合起来，得到最终的判断结果。

```typescript
// 这个是数学中的分解因式子
(a + b) * c => ac + bc
```

```typescript
type P<T> = T extends 'x' ? 'yes' : 'no';
type Boola = P<'x' | 'y'> // Bool => 'yes' | 'no'
// 上面这种写法等价于
type Boolb = ('x' extends 'x' ? 'yes' : 'no') | ('y' extends 'x' ? 'yes' : 'no')
            = 'yes' | 'no'

// 有点蛇皮的，和下面这种情况不一样,区别就是看extends左侧是否是泛型
type Boolc = 'a' | 'b' extends 'a' ? 'yes' : 'no'; // Bool => 'no'
```

自定义类型

```typescript
type Subtraction<T, U> = T extends U ? never : T; // 找差集
type Intersection<T, U> = T extends U ? T : never; // 找交集

type Type1 = "a" | "b" | "c";
type Type2 = "a" | "b";

/**
 * 下面三个 type 结果一样
 */
type Sub1 = Subtraction<Type1, Type2>;
type Sub2 =
  | ("a" extends Type2 ? never : "a")
  | ("b" extends Type2 ? never : "b")
  | ("c" extends Type2 ? never : "c");
type Sub3 = "c";

/**
 * 下面三个 type 结果一样
 */
type Int1 = Intersection<Type1, Type2>;
type Int2 =
  | ("a" extends Type2 ? "a" : never)
  | ("b" extends Type2 ? "b" : never)
  | ("c" extends Type2 ? "c" : never);
type Int3 = "a" | "b";
```

**`extends` + `in` + `keyof` 使用**

```typescript
type IObject = {
  a: string;
  b: number;
  c: boolean;
};

/**
 * 判断对象中 value 的类型，如果原类型是 string 则返回 string，否则返回 number
 * type TsType = { a: string; b: number; c: number; }
 */
type TsType = {
  [P in keyof IObject]: IObject[P] extends string ? string : number;
};
```

#### 4.6、 `is`

`is` 关键字用于TS的类型谓词中，是实现TS类型保护的一种方式。<!--类型谓词是啥我也不知道-->

> 我们通常在 JavaScript 中通过判断来处理一些逻辑，在 TypeScript 中这种条件语句块还有另外一 个特性:根据判断逻辑的结果，缩小类型范围(有点类似断言)，这种特性称为 类型保护 ，触发条件:
>
> 逻辑条件语句块:if、else、elseif 
>
> 特定的一些关键字:typeof、instanceof、in......
>
> 理解关键词缩小类型范围就好了

```typescript
/**
 * 此函数用于判断参数 value 是不是 string 类型
 * 
 * 由于返回类型声明了类型谓词，可以帮助TS在代码分支中进行类型保护（默认返回 boolean 类型是没办法做到的）
 **/
function isString(value: any): value is string {
    return typeof value === 'string';
}

function doSometing(value: string | number) {
    if (isString(value)) {
        // TS 可以识别这个分支中 value 是 string 类型的参数（这就叫类型保护）
    } else {
        // TS 可以识别这个分支中 value 是 number 类型的参数
    }
}
```

这样做的好处是：实现了代码复用，实现了更好的语义化。

其实，TS 代码中 `Array.isArray` 便是使用了这样的声明。

```typescript
interface ArrayConstructor {
    // ...
    isArray(arg: any): arg is Array<any>;
}
```

#### 4.7、`infer`

> 没用过，记录笔记顺便记上的，后面有机会使用的话可以直接来这看

`infer` 最早出现在此 [PR](https://github.com/Microsoft/TypeScript/pull/21496) 中，表示在 `extends` 条件语句中待推断的类型变量。

简单示例如下：

```ts
type ParamType<T> = T extends (...args: infer P) => any ? P : T;
```

在这个条件语句 `T extends (...args: infer P) => any ? P : T` 中，`infer P` 表示待推断的函数参数。

整句表示为：如果 `T` 能赋值给 `(...args: infer P) => any`，则结果是 `(...args: infer P) => any` 类型中的参数 `P`，否则返回为 `T`。

```ts
interface User {
  name: string;
  age: number;
}

type Func = (user: User) => void;

type Param = ParamType<Func>; // Param = User
type AA = ParamType<string>; // string
```

### 5、TS中的内置类型

#### 5.1、`Required<T>` 

将所有属性类型转为必选属性类型

**源码实现**：把问号减去

```typescript
type Required<T> = {
  [k in keyof T]-? : T[k]
}
```

**用法示例**：本来User 的属性类型都是可选的，现在变成必选了

```typescript
type User = {
    name?: string
    password?: string
    id?: number
}

let reqUser: Required<User> = {
    name: "Tom",
    password: "123456",
    id: 1
}
```

#### 5.2、`Partial<T>`

将所有类型转为可选类型

**源码实现**：把问号加上

```typescript
type Partial<T> = {
    [k in keyof T]?: T[k]
}
```

**用法示例**：

```typescript
type User = {
    name: string
    password: string
    id: number
}
let user: Partial<User> = {} ;//属性类型为可选，所以不写也不会报错
```

#### 5.3、`Readony<T>`

将所有属性类型转为只读属性选项类

**源码实现**：在属性key 前面加readonly 关键词

```typescript
type Readonly<T> = {
    readonly [P in keyof T]: T[P];
};
```

**用法示例**：

```typescript
type User = {
    name: string
}

let readOnlyUser: Readonly<User> = {
  name: "12345"
}
readOnlyUser.name = "mike" ;//报错，无法赋值，只读属性，只能初始化赋值
```

#### 5.4、`Pick<T, K>`

从 T 中筛选出 K 

**源码实现**：

```typescript
type Pick<T, K extends keyof T> = {
    [P in K] :T[P]
};
```

**用法示例**：

```typescript
type Direction  = {
  "LEFT": string,
  'TOP': string,
  "RIGHT": string,
  "BOTTOM": string
}
type ResDirection = Pick<Direction, "LEFT" | "TOP">

let newDirection: ResDirection = {
   LEFT: "left",
   TOP: "top"
}
//newDirection 结果是： { "LEFT": string, "TOP": string}
```

#### 5.5、`Record<T, K>`

将K中所有属性值转化为T类型

**源码实现**：

```typescript
type Record<K extends keyof any, T> = {
    [P in K]: T;
};
```

```typescript
tpe KEY =  keyof any // string | number | symbol
```

**用法示例**：

```typescript
type TestType= Record<'get' | 'post', {'url': string, 'type': string}>
//结果：
{
   'get': {'url': string, 'type': string},
   'post': {'url': string, 'type': string}
}
```

#### 5.6、`Exclude<T, U>`

用于从类型T中去除不在U类型中的成员（T中有，U中没有），取差值

**源码实现**：

```typescript
type Exclude<T, U> = T extends U ? never: T
```

**用法示例**：

```typescript
//示例一：
type result = Exclude<"a" | "b" | "c" | "d", "a" | "c" | "f"> ;
// 结果: "b" | "d"
// 在这个例子中，因为用到了Exclude这个条件类型，会尝试寻找在T类型中有但在U类型中没有的成员，最后将获取到的Union类型 "b" | "d"

//示例二：
type TestType =  {name: string} | {name: string, age: number} | "a" | "c" | "d"
type result = Exclude<TestType, {name: string} | "c"> ;
//结果: "a" | "d"
// 在这个例子中 {name: string, age: number} extends {name: string} ? true : false 结果是true
// 所以{name: string, age: number}也被去除掉了，为啥是true，是因为TS的蛇皮兼容性，A extends B 就看B里面的所有属性能否在A中找到
```

![Exclude](https://kothing.github.io/assets/public/Exclude.png)

#### 5.7、`Extract<T, U>`

Exclude 的反操作，（取 T U 两者的交集属性）

**源码实现**：条件类型实现

```typescript
type Extract<T, U> = T extends U ? T: never
```

**用法示例**：

```typescript
type result = Extract<"a" | "b" | "c" | "d", "a" | "c" | "f"> ;
结果："a" | "c"
```

![Exclude](https://kothing.github.io/assets/public/Extract.png)

#### 5.8、`Omit<T, K>`

从类型 T 中 除去指定属性类型 K

**源码实现**：利用`pick` + `Exclude` 结合实现

```typescript
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>
```

在上面的`Omit`实现中，我们用到了`Exclude`这个条件类型，`Exclude`的效果就是寻找在`keyof T`中有，但在`K`类型中没有的成员，这样就将剩余的类型过滤了出来，再去应用`Pick`，就获得了我们的`Omit`实现。

**用法示例**：

```typescript
interface TestOmit {
  a: string;
  b: numer;
  c: boolean;
}
type result = Omit<TestOmit, 'a'> // 结果：result = {b: number; c: boolean}
type result= Omit<{id: number, name: string, age: number}, "age" | "name">; 
// 结果：result = {id: number}
```

#### 5.9、`NonNullable<T>`

从 T 中剔除 null，underfined 类型

**源码实现**：

```typescript
type NonNullable<T> = T extends null | undefined ? never : T
```

**用法示例**：

```typescript
type T0 = NonNullable<string | number | undefined>;
// 结果
type T0 = string | number
```

#### 5.10、`Parameters<T>`

获取函数参数类型

**源码实现**：

```typescript
type Parameters<T extends (...args:any) => any> = 
    T extends (...args: infer P) => any ? P : never
```

在这个条件语句 `T extends (...args: infer P) => any ? P : never` 中，`infer P` 表示待推断的函数参数;

整句表示为：如果 `T` 能赋值给 `(...args: infer P) => any`，则结果是 `(...args: infer P) => any` 类型中的参数 `P`，否则返回为 `never`

**用法示例**：

```typescript
interface User {
  name: string;
  age: number;
}
type Func = (user: User, name: string) => void;
type Param = Parameters<Func>; // Param = [User, string]
```

#### 5.11、`ReturnType<T>`

获取函数返回值类型

**源码实现**：

```typescript
type ReturnType<T extends (...args: any) => any> = 
    T extends (...args: any)=>infer P ? P: never
```

相比于上面的例子`ReturnType<T>` 只是将 `infer P` 从参数位置移动到返回值位置，因此此时 `P` 即是表示待推断的返回值类型

**用法示例**：

```typescript
interface User {
  name: string;
  age: number;
}

type Func = () => User;
type Test = ReturnType<Func>; // Test = User
```

#### 5.12、`ConstructorParamters<T>`

获取构造函数的参数类型

**源码实现**：

```typescript
type ConstructorParamters<T extends new (...args:any) => any> = 
    T extends new (...args: infer P) => any ? P: never
```

**用法示例**：

```typescript
class Y {
   constructor(name: string, age: number){}
 }
 type resType = ConstructorParamters<typeof Y> //[string, number]

```

#### 5.12、`InstanceType<T>`

获取构造函数类型的实例类型(获取一个类的返回类型)

**源码实现**：

```typescript
type InstanceType<T extends new (...args: any) => any> = 
  T extends new (...args: any) => infer R ? R : any;
```

**用法示例**：

```typescript
class Y{
    ID: number | undefined
    GET(){}
    constructor(name: string, age: number){}
}
type resType= InstanceType<typeof Y>
let obj: resType= {
    ID: 1,
    GET(){}
}
```

### 6、TS中的骚套路

#### 6.1、类型推导

每次都显式标注类型会比较麻烦，<u>TypeScript</u> 提供了一种更加方便的特性：**类型推导**；<u>TypeScript</u> 编译器会根据当前上下文自动的推导出对应的类型标注，这个过程发生在：

- 初始化变量
- 设置函数默认参数值
- 返回函数值

```typescript
// 自动推断 x 为 number
let x = 1;
// 不能将类型“"a"”分配给类型“number”
x = 'a';

// 函数参数类型、函数返回值会根据对应的默认值和返回值进行自动推断
function fn(a = 1) {return a * a}
```

#### 6.2、类型断言

有的时候，我们可能标注一个更加精确的类型（缩小类型标注范围），比如：

```typescript
let img = document.querySelector('#img');
```

我们可以看到 <u>img</u> 的类型为 <u>Element</u>，而 <u>Element</u> 类型其实只是元素类型的通用类型，如果我们去访问 <u>src</u> 这个属性是有问题的，我们需要把它的类型标注得更为精确：<u>HTMLImageElement</u> 类型，这个时候，我们就可以使用类型断言，它类似于一种 类型转换：

```typescript
let img = <HTMLImageElement>document.querySelector('#img');
```

或者

```typescript
let img = document.querySelector('#img') as HTMLImageElement;
```

> 注意：断言只是一种预判，并不会数据本身产生实际的作用，即：类似转换，但并非真的转换了

#### 6.3、函数重载

有的时候，同一个函数会接收不同类型的参数返回不同类型的返回值，我们可以使用函数重载来实现，通过下面的例子来体会一下函数重载

```typescript
function showOrHide(ele: HTMLElement, attr: string, value: 'block'|'none'|number) {}

let div = document.querySelector('div');

if (div) {
  showOrHide( div, 'display', 'none' );
  showOrHide( div, 'opacity', 1 );

  showOrHide( div, 'display', 1 ); // 这里是有问题的，但是没有错误提示
}
	// 虽然通过联合类型能够处理同时接收不同类型的参数，但是多个参数之间是一种组合的模式，我们需要的应该是一种对应的关系
```

函数重载可以解决上面的问题

```typescript
function showOrHide(ele: HTMLElement, attr: 'display', value: 'block'|'none');
function showOrHide(ele: HTMLElement, attr: 'opacity', value: number);
function showOrHide(ele: HTMLElement, attr: string, value: any) {
  ele.style[attr] = value;
}

let div = document.querySelector('div');

if (div) {
  showOrHide( div, 'display', 'none' );
  showOrHide( div, 'opacity', 1 );
 
  showOrHide( div, 'display', 1 ); // 这里会有错误提示
}
```

重载函数类型只需要定义结构，不需要实体，类似接口

#### 6.4、类型兼容性

##### 6.4.1 基本类型兼容

TS中的类型兼容很容易让人摸不着头脑，先看下面这个例子

```typescript
type Human = {
    name: string;
  }
type Duck = {
    name: string;
  }

const human: Human = {
  name: '名字'
}

// 这里不会报错，因为Human类型和Duck类型一致嘛
const duck: Duck = human
```

上面这个例子还是比较容易理解的，类型一致可以互相赋值；但下面这个例子就有点反直觉了

```typescript
type Human = {
    name: string;
    speak: boolean;
  }
type Duck = {
    name: string;
  }

const human: Human = {
  name: '名字',
  speak: true
}

// 这里不会有错误提示
const duck:Duck = human
```

按照直觉，这里的`Human`类型就不能够赋值给`Duck`类型了，因为`Duck`类型中没有`speak`属性;但是这里却没有错误提示，这是因为`TS`中的类型兼容;

`TS`中的类型兼容是这样的，如果`x`要兼容`y`，那么`y`至少具有与`x`相同的属性，所以

```typescript
const duck:Duck = human
```

这里检查`human`是否能赋值给`duck`时，编译器检查`duck`中的每个属性，看是否能在`human`中也找到对应属性。 在这个例子中，`human`必须包含名字是`name`的`string`类型成员。`human`满足条件，因此赋值正确;

所以兼容就是如果`y`有`x`类型中所有的属性，那么便可以说`x`兼容`y`,<!--这种说法其实很反直觉的-->

注意：下面这种直接赋值的形式是会报错的

```typescript
type Duck = {
    name: string;
  }

// 直接赋值就不行，找个变量存下接可以赋值，很蛇皮
const duck:Duck = {
  name: '名字',
  speak: true
}
```

##### 6.4.2 函数兼容

相对来讲，在比较原始类型和对象类型的时候是比较容易理解的，函数的兼容更加蛇皮，看下面的例子

```typescript
let x = (a: number) => 0;
let y = (b: number, s: string) => 0;

y = x; // OK
x = y; // Error
```

要查看`x`是否能赋值给`y`，首先看它们的参数列表。 `x`的每个参数必须能在`y`里找到对应类型的参数。 注意的是参数的名字相同与否无所谓，只看它们的类型。 这里，`x`的每个参数在`y`中都能找到对应的参数，所以允许赋值。

第二个赋值错误，因为`y`有个必需的第二个参数，但是`x`并没有，所以不允许赋值。

你可能会疑惑为什么允许`忽略`参数，像例子`y = x`中那样。 原因是忽略额外的参数在JavaScript里是很常见的。

<!--更加蛇皮的是，入参的兼容和返回值的兼容反过来的，返回值的兼容倒是和上面的基本类型兼容一致-->

```typescript
let x = () => ({name: 'Alice'});
let y = () => ({name: 'Alice', location: 'Seattle'});

x = y; // OK
y = x; // Error, because x() lacks a location property
```

`TS`要求源函数的返回值类型必须是目标函数返回值类型的子类型