## JavaScript设计模式与开发实践笔记

### 一、前言

#### 1.1 什么是设计模式

> 设计模式 Design Pattern 是一套被反复使用、多数人知晓的、经过分类编目的、代码设计经验的总结，使用设计模式是为了可重用代码、让代码更容易被他人理解并且保证代码可靠性。

#### **为什么要学习设计模式**：

好的程序具有以下四个特征

- 易维护
- 易拓展
- 易复用
- 灵活性好

怎么去理解这四个特征呢？以活字印刷为例：

- 易维护 ➡️ 当要修改文字的时候只需替换对应的字模即可，不需大改动
- 易拓展 ➡️ 新增文字只需另外刻字加入字模即可
- 易复用 ➡️ 字模可以在印刷不同的文章时复用
- 灵活性好 ➡️ 字模排版无论是横排还是竖排只需移动字模即可

学习设计模式的目的就是帮助我们写出易维护、以拓展、易复用、灵活性好的程序。

<!--设计模式的核心就是 解耦 将变化的逻辑和不变的逻辑封装隔离-->

<!--分辨设计模式的关键是应用场景而不是结构，许多设计模式的结构很相似，如何去分辨，是要去总结思考这个设计模式的应用场景，从而发现其中的不同之处-->

### 二、JavaScript的面向对象

#### 2.1、编译型语言与解释型语言

编程中的高级语言按照翻译成机器语言的方式可以分为***编译型语言***和***解释型语言***

C/C++、Pascal/Object Pascal（Delphi）等都是编译语言，这些语言在执行前需要一个专门的编译过程，将高级语言编译成机器语言

JavaScript、VBScript、PythonB等都是解释性语言，解释型语言编写的程序不需要编译。解释型语言在运行的时候才翻译，比如VB语言，在执行的时候，专门有一个解释器能够将VB语言翻译成机器语言，每个语句都是执行的时候才翻译。每执行一次就要翻译一次，效率比较低

Java比较特殊，它有一个==预编译==的过程，java是一种==编译型-解释型语言==，同时具备编译特性和解释特性。其实，确切的说java就是解释型语言，其所谓的编译过程只是将.java文件编程成平台无关的字节码.class文件，并不是向C一样编译成可执行的机器语言，Java中所谓的“编译”与传统的“编译”是不一样的

Java程序需要被统一编译成字节码文件——文件后缀是class，此种文件在java中又称为类文件。java类文件不能再计算机上直接执行，它需要被==java虚拟机翻译成本地的机器码后才能执行==，而java虚拟机的翻译过程则是解释性的。java字节码文件首先被加载到计算机内存中，然后读出一条指令，翻译一条指令，执行一条指令，该过程被称为java语言的解释执行，是由java虚拟机完成的。

#### 2.2、静态类型语言与动态类型语言

编程语言按照数据类型可以分为***静态类型语言***和***动态类型语言***

静态类型语言在编译时就已经确定了变量的类型，而动态类型语言的变量类型需要到程序运行时，待变量被赋予某个值之后才会有某种类型。

静态类型语言在编译的时候就可以发现类型不匹配的错误，其次编译器还可以针对这些信息进行一些优化工作，提高程序的执行效率。

动态类型的语言的优点是编写的代码量更少，更加简洁，注重于逻辑表达而不是类型

#### 2.3、鸭子类型

==鸭子类型==的定义：如果它走路像鸭子，叫起来像鸭子，那么它就是鸭子；

鸭子类型在JS中的解释场景，如果一个对象有`push`和`pop`方法，那么就可以把它当作是**栈**来使用

放在设计模式的解释场景就是，虽然JS中的设计模式的实现方式与传统的面向对象编程语言的实现方式不同，但只要核心思想是一样的，是为了解决同样的问题，那么JS中的设计模式就是该种设计模式。<!--分辨设计模式的关键是应用场景而不是结构-->

#### 2.4、JavaScript中的多态

多态的思想就是要将==做什么==和==谁去做==分离开来，同样的一件事情，不同的对象有不同的实现方式，==做什么==是不变的，==谁去做==是可变的。将具体的方法实现放到各个对象中去，并让每个对象负责自己的行为，这正是面向对象设计的优点。

JS中的多态不需要继承就可以直接实现，举个🌰，每个动物都会**发出叫声**，但实现方式不同，如果我们有一个方法 `makeSound(anima)`要调用每个动物的`sound`方法

在动态类型中由于类型检查的缘故，在`makeSound(anima:type)`中不能对`animal`实例只声明实例的类型，而是需要声明为所有动物实例的父类`Animal`类型(抽象类)，那这样每个动物实例`animal`都是要继承自这个抽象父类`Animal`

而在JS中，不需要继承也没必要去继承，因为JS中没有类型检查，只要我们传进去的对象有`sound`方法就可以了

正式因为JS的这些语言特性，导致了JS的设计模式在实现上有别于传统的面向对象语言

<!--其实JS是面向原型的语言，JS的继承也是通过原型链的形式模仿的-->

#### 2.5、AOP面向切面编程

AOP就是将可以复用的功能抽离出来，之后再通过“动态植入”的方式放进到每个模块中去，Node.js中的中间件就是采用了这种思想，还有React源码中的事件机制也是

### 二、14种设计模式

#### 2.1、单例模式

单例模式的定义：==保证一个类只有一个实例，并提供一个访问它的全局访问点==；

单例模式应用场景：有些对象我们往往只需要一个，比如线程池、全局缓存、全局对象等；

具体的场景：比如登陆对话窗，我们只需要一个，不论点击多少次探出的对话窗应该都是同一个；

<!--核心思想是确保只有一个实例，能够做到状态复用和内存复用，状态复用就是数据共享，内存复用就是不要去重复创建，不增加多余的操作开销-->

**JS中应用场景：**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=<device-width>, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <button id="login">点击登陆</button>
</body>
<script>
  /**
   * 创建单例的方法
   */
  const getSingle = function(fn){
    let result
    return function(...args) {
      return result || (result = fn(...args))
    }
  }
  /**
   * 具体的单例逻辑
   * 这里的单例指的是创建的div元素，只创建一次后面都是复用
   */
  const createLoginLayer = function(){
    console.log(Date.now())
    const div = document.createElement('div');
    div.innerHTML = '登陆对话框';
    div.style.display = 'none';
    document.body.appendChild(div);
    return div;
  }
  const createSingleLoginLayer = getSingle(createLoginLayer);

  document.querySelector('#login').onclick = function() {
    createSingleLoginLayer().style.display = 'block'
  }
</script>
</html>
```

