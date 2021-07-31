# 用defineProperty仿写Vue

用difineProperty或Proxy实现数据劫持，实现数据驱动视图的目的

## difineProperty的用法

Objiect.defineProperty()可以在一个对象上定义一个新属性或者修改一个对象的现有属性并返回这个对象。默认情况下使用这种方法添加的属性值是不可修改的。
**difineProperty语法**：Objiect.defineProperty(obj,prop,descriptor)
 1. **obj** ：要在其上定义属性的对象；
 2. **prop** ：要定义或要修改属性的名称；
 3.  **descriptor** ：将被定义或修改的属性描述符；
对象目前存在的属性描述符有两种主要形式：**数据描述符**和**存取描述符**
数据描述符是一个包含属性值并说明这个属性值可读还是不可读的对象
存取描述符是一个包含该属性值的get和set方法的对象
一个完整的属性描述符必须是这两者之一，且不可两者都有
描述符可同时具有的键值：

|            | configurable | enumerable | value | writable | get  | set  |
| :--------: | :----------: | :--------: | :---: | :------: | :--: | :--: |
| 数据描述符 |      √       |     √      |   √   |    √     |  ×   |  ×   |
| 存取描述符 |      √       |     √      |   ×   |    ×     |  √   |  √   |

**configurable**:当且仅当该属性的configurable为true时，该属性描述符才能被改变，同时该属性也能从对应的对象上被删除，默认值为false
**enumerable**:当且仅当该属性的enumerable为true时，该属性才能出现在对象的枚举属性中，默认为false
**示例**
```javascript
        let o = {
            message: "123something"
        }
        // Obeject.defineProperty语法
        // Object.defineProperty(obj,prop,descriptor)
        // obj:要操作的对象；prop:要操作的属性;descriptor:属性描述符，包括get()、set()方法
        // 
        Object.defineProperty(o, "message", {
            // 可配置属性，为true时，o的message属性才能被删除
            configurable: true,
            // 可枚举属性，为true时，o的属性才能被枚举
            enumerable: true,
            get() {
                console.log("get.....")
                return "测试数据"
            },
            set(newValue) {
                console.log("set", newValue)
            }
        })
        console.log(o);
        console.log(o.message);
        o.message="1234"
        console.log(o);
```
![运行结果](https://img-blog.csdnimg.cn/20200601224439213.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L05EWURTRA==,size_16,color_FFFFFF,t_70)
对象属性的获取会触发get()方法、改变会触发set()方法
defineProperty()的使用就是这样，下面就是利用defineProperty()仿写Vue
html部分
```javascript
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script src="kvue1.js" type="text/javascript"></script>
</head>

<body>
    <div id="app">
        {{message}}
        <div v-html="htmlData"></div>
        <input v-model="modelData" /> {{modelData}}
    </div>
    <script>
        let kvue = new Kvue({
            el: "#app",
            data: {
                message: "测试数据",
                htmlData: "html数据",
                modelData: "绑定的数据"
            }
        })
        console.log(kvue.$options.data);
        // kvue.$options.data.message="123"
        
    </script>
</body>

</html>
```
js部分,这里用到了EvenTarget类来自定义事件，达到监听数据的目的，数据渲染的部分通过获取元素节点，将数据放进dom中
```javascript
// EventTarget类创建的对象可以接收事件并为他们提供监听器
class Kvue extends EventTarget {
    constructor(options) {
        super();
        this.$options = options;
        this.compile();
        this.observe(this.$options.data);

    }
    compile() {
        // 获取节点
        let el = document.querySelector(this.$options.el);
        // 渲染节点
        this.compileNode(el);
    }

    observe(data) {
        // 遍历data中的属性，进行数据劫持
        let keys = Object.keys(data);
        keys.forEach(key => {
            this.defineReact(data, key, data[key])
        })
    }

    defineReact(data, key, value) {
        // value = 123333;
        // console.log("1qw2",value===data[key])
        let _this = this;
        Object.defineProperty(data, key, {
            configurable: true,
            enumerable: true,
            get() {
                console.log("get...")
                // 这里也是个关键点，这里返回的是value
                // 而不是_this.options.data[key]
                // set方法中将新值给value以后，再获取数据的话返回的就是更新过的value
                // set方法中不能将新值直接给_this.options.data[key]，会引起死循环
                return value;
            },
            set(newValue) {
                console.log("set...")
                // 以data中的属性名为事件名创建一个新事件，并将newValue传参
                let event = new CustomEvent(key, {
                    detail: newValue
                })
                // 每次data中对应属性的数据值改变时就会触发set()函数，相应的就派发事件，达到数据驱动视图的效果
                _this.dispatchEvent(event);
                value = newValue;
            }

        })
    }

    compileNode(el) {
        // chilNodes获取的是制定节点下的所有子节点
        let childNodes = el.childNodes;
        childNodes.forEach(node => {
            if (node.nodeType == 1) {
                // nodetype为1是元素节点
                // 
                let attrs = node.attributes;

                [...attrs].forEach(attr => {
                    // console.log(attr);
                    let attrName = attr.name;
                    let attrValue = attr.value;
                    if (attrName.indexOf("v-") === 0) {
                        // Array.indexOf()返回数组中指定元素的位置
                        attrName = attrName.substr(2);
                        // substr(start，length)截取从start位置开始的指定数目的字符
                        console.log(attrName);
                        if (attrName === "html") {
                            node.innerHTML = this.$options.data[attrValue];
                        } else if (attrName === "model") {
                            node.value = this.$options.data[attrValue];
                            node.addEventListener("input", e => {
                                // 输入时触发了input事件
                                // console.log(e.target.value);
                                // 这里触发了set()方法，从而触发了二次渲染
                                this.$options.data[attrValue] = e.target.value;
                            })
                        }
                    }
                })


            } else if (node.nodeType == 3) {
                // nodetype为3是文本节点
                // 获取文本节点的文本内容
                let textcontent = node.textContent;
                // 正则表达式匹配规则 匹配{{message}}
                let reg = /\{\{\s*(\S+)\s*\}\}/g;

                if (reg.test(textcontent)) {
                    let $1 = RegExp.$1;
                    node.textContent = node.textContent.replace(reg, this.$options.data[$1]);
                    // 在这里给实例化对象绑定事件，$1就是data中的属性值
                    this.addEventListener($1, e => {
                        // e.detail就是上面defineReact()中数据劫持里创建事件所传的newValue
                        console.log(e.detail);
                        let oldValue = this.$options.data[$1];
                        console.log("oldvalue", oldValue)
                        let reg = new RegExp(oldValue);
                        node.textContent = node.textContent.replace(reg, e.detail);
                    })
                }

            }
        });
    }
}
```
运行结果：
![运行结果](https://img-blog.csdnimg.cn/20200601225902377.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L05EWURTRA==,size_16,color_FFFFFF,t_70)