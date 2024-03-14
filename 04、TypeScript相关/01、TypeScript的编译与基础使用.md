## TypeScript 使用记录（一）编译与基础使用

### 一、编译配置

#### 1.1、安装 `TypeScript` 编译器

通过 `NPM` 安装 `TypeScript` 

```shell
npm i typescript
```

安装完成以后，我们可以通过命令 `tsc` 来调用编译器

```shell
# 可以将ts文件编译成js文件
tsc 
# 查看当前 tsc 编译器版本
tsc -v
# 指定编译文件输出目录
tsc --outDir ./dist XXX.ts
# 指定编译的代码版本目标
tsc --outDir ./dist --target ES6 XXX.ts
# 在监听模式下运行，当文件发生改变的时候自动编译
tsc --outDir ./dist --target ES6 --watch XXX.ts
```

#### 1.2、编译配置文件

```shell
# 生成tsconfig.json
tsc --init 
```

可以把编译的一些选项保存在一个指定的 `json` 文件中，默认情况下 `tsc` 命令运行的时候会自动去加载运行命令所在的目录下的 `tsconfig.json` 文件，配置文件格式如下

```json
{
	"compilerOptions": {
		"outDir": "./dist",
		"target": "ES2015",
    "watch": true,
	},
  // ** : 所有目录（包括子目录）
  // * : 所有文件，也可以指定类型 *.ts
  "include": ["./src/**/*"]
}
```

有了单独的配置文件，就可以直接运行`tsc`

### 二、搞不太清的基础类型

#### 2.1、null 和 undefined类型

因为在 `Null` 和 `Undefined` 这两种类型有且只有一个值，在标注一个变量为 `Null` 和 `Undefined` 类型，那就表示该变量不能修改了

```typescript
let a: null;
// ok
a = null;
// error
a = 1;
```

默认情况下 `null` 和 `undefined` 是所有类型的子类型。 就是说可以把 `null` 和 `undefined` 赋值给其它类型的变量

```typescript
let a: number;
// ok
a = null;
```

因为 `null` 和 `undefined` 都是其它类型的子类型，所以默认情况下会有一些隐藏的问题

```typescript
let a:number;
a = null;
// ok（实际运行是有问题的）
a.toFixed(1);
```

> 指定 `strictNullChecks` 配置为 `true`，可以有效的检测 `null` 或者 `undefined`，避免很多常见问题

```typescript
let a:number;
a = null;
// error
a.toFixed(1);
```

#### 2.2、枚举类型

枚举类型编译之后就是个`js`对象

```typescript
enum USER_ROLE {
    USER, // 默认从0开始
    ADMIN,
    MANAGER
}
// {0: "USER", 1: "ADMIN", 2: "MANAGER", USER: 0, ADMIN: 1, MANAGER: 2}

//可以枚举，也可以反举
USER_ROLE.USER === 0
USER_ROLE[0] === USER
```

```js
// 编译后的结果
(function (USER_ROLE) {
    USER_ROLE[USER_ROLE["USER"] = 0] = "USER";
    USER_ROLE[USER_ROLE["ADMIN"] = 1] = "ADMIN";
    USER_ROLE[USER_ROLE["MANAGER"] = 2] = "MANAGER";
})(USER_ROLE || (USER_ROLE = {}));
```

**注意事项：**

- `key` 不能是数字
- `value` 可以是数字，称为==数字类型枚举==，也可以是字符串，称为==字符串类型枚举==，但不能是其它值，默认为数字0
- 枚举值可以省略，如果省略，则：
  - 第一个枚举值默认为：0
  - 非第一个枚举值为上一个数字枚举值 + 1
- 枚举值为只读（常量），初始化后不可修改

**字符串类型枚举**

枚举类型的值，也可以是字符串类型

```typescript
enum URLS  {
  USER_REGISETER = '/user/register',
  USER_LOGIN = '/user/login',
  // 如果前一个枚举值类型为字符串，则后续枚举项必须手动赋值
  INDEX = 0
}
```

```js
// 编译后的结果
var URLS;
(function (URLS) {
    URLS["USER_REGISETER"] = "/user/register"; // 从这里可以看出字符串的枚举不能反举
    URLS["USER_LOGIN"] = "/user/login";
    URLS[URLS["INDEX"] = 0] = "INDEX";
})(URLS || (URLS = {}));
```

**注意**：

- 如果前一个枚举值类型为字符串，则后续枚举项必须手动赋值
- 字符串类型枚举不能反举

#### 2.3、Never类型

当一个函数永远不可能执行 `return` 的时候，返回的就是 `never` ；与 `void`不同，`void` 是执行了 `return`， 只是没有值，`never` 是不会执行 `return`，比如抛出错误，导致函数终止执行

```typescript
function fn(): never {
  	throw new Error('error');
}
```

#### 2.4、元组类型（Tuple Type）

元组类型是另外一种 `Array` 类型，当你明确知道数组包含多少个元素，并且每个位置元素的类型都明确知道的时候，就适合使用元组类型。

```typescript
type StringNumberPair = [string, number];
```

在这个例子中，`StringNumberPair` 就是 `string` 和 `number` 的元组类型。

### 三、说不清楚的高级类型

#### 3.1、联合类型

联合类型也可以称为**==多选类型==**，当我们希望==标注一个变量为多个类型之一==时可以选择联合类型标注，**或**的关系，在使用联合类型时，**没有赋值**只能访问联合类型中**共有的方法和属性**，赋值之后便只能访问对应类型的方法和属性

```ts
let name:string | number // 联合类型  
console.log(name!.toString()); // 公共方法
name = 10;
console.log(name!.toFixed(2)); // number方法
console.log(name!.toLowerCase()); // 字符串方法 这里会有错误提示
name = 'zf';
console.log(name!.toLowerCase()); // 字符串方法

// 这种情况不会报错
interface o1 {x: number, y: string};
interface o2 {z: number};

let o: o1 | o2 = {x:1, y:'12', z:12}
let o: o1 | o2 = {x:1, z:12}
```

> 这里的!表示此值非空

```ts
let ele: HTMLElement | null = document.getElementById('#app');
ele!.style.color = 'red'; // 断定ele元素一定有值
```

#### 3.2、 交叉类型

交叉类型也可以称为**==合并类型==**，可以==把多种类型合并到一起成为**一种新的类型**==，**<u>并且</u>** 的关系

对一个对象进行扩展：

```typescript
interface o1 {x: number, y: string};
interface o2 {z: number};

let o: o1 & o2 = Object.assign({}, {x:1,y:'2'}, {z: 100});
```

#### 3.3、 泛型

许多时候，标注的具体类型并不能确定，比如一个函数的参数类型

```typescript
function getVal(obj,key) {
  return obj[key]
}
// 上面的函数，我们想实现的是获取一个对象指定的 k 所对应的值，那么实际使用的时候，obj 的类型是 不确定的，自然 k 的取值范围也是不确定的，它需要我们在具体调用的时候才能确定，这个时候这种定义过程不确定类型的需求就可以通过泛型来解决

function getVal<T>(obj: T, k: keyof T) {
    return obj[k];
}

type Obj = {
  x: number;
  y: string; 
}
const obj = {
  x: 111,
  y: '长度'
}
getVal<Obj>(obj, x) // 111

```

其实理解泛型可以类比于函数传参，参数是未知的类型，但是我们又要使用这个未知类型，那就用个形参表示，就是上面的`K` 、 `T`这种，当我们使用的时候就传具体的类型进行，也就是实参
