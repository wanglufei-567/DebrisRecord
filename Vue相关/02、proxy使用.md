# 用Proxy仿写Vue
相比较与defineProperty，Proxy不用遍历对象中属性，还不用进行configurable、enumrable的配置
## Proxy用法
```javascript
 let o ={
            name:"张三",
            age:26
        }
        // Proxy会返回一个Proxy对象，主要用于从外部控制对对象内部的访问；
        // 实质上就是通过get()、set()监听对象内部属性的获取和修改，
        // 从外部获取或修改对象内部属性时，就会触发函数
        // 相比较与defineProperty，Proxy不用遍历对象中属性，还不用进行configurable、enumrable的配置
        let newObj = new Proxy(o,{
            get(target,key){
                console.log("get.....")
                return target[key];
            },
            set(target,key,newValue){
                console.log("set....")
                target[key] = newValue;
                return true;
            }
        })
        console.log(newObj.name);
        newObj.name = "李四";
        newObj.hobby = "打球"
```
运行结果：
![运行结果](https://img-blog.csdnimg.cn/20200602101847771.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L05EWURTRA==,size_16,color_FFFFFF,t_70)
html部分：
```javascript
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script src="kvue2.js" type="text/javascript"></script>
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
js部分：
```javascript
class Kvue extends EventTarget{
    constructor(options){
        super();
        this.$options = options;
        this.compile();
        this.observe(this.$options.data);

    }
    compile(){
        // 获取节点
        let el =document.querySelector(this.$options.el);
        // 渲染节点
        this.compileNode(el);
    }

    observe(data){
        let _this = this;
        this.$options.data = new Proxy(data,{
            get(target,key){
                console.log("get...")
                return target[key];  
            },
            set(target,key,newValue){
                console.log("set...")
                // 以data中的属性名为事件名创建一个新事件，并将newValue传参
                let event = new CustomEvent(key,{detail:newValue})
                // 每次data中对应属性的数据值改变时就会触发set()函数，相应的就派发事件，达到数据驱动视图的效果
                _this.dispatchEvent(event);
                target[key] = newValue;
                return true;
            }
        })
    }

    compileNode(el){
        // chilNodes获取的是制定节点下的所有子节点
        let childNodes = el.childNodes;
        childNodes.forEach(node => {
            if(node.nodeType==1){
                // nodetype为1是元素节点
                // 
                let attrs = node.attributes;
                
                [...attrs].forEach(attr=>{
                    // console.log(attr);
                    let attrName = attr.name;
                    let attrValue = attr.value;
                    if(attrName.indexOf("v-")===0){
                        // Array.indexOf()返回数组中指定元素的位置
                        attrName = attrName.substr(2);
                        // substr(start，length)截取从start位置开始的指定数目的字符
                        console.log(attrName);
                        if(attrName==="html"){
                            node.innerHTML = this.$options.data[attrValue];
                        }else if (attrName==="model"){
                            node.value = this.$options.data[attrValue];
                            node.addEventListener("input",e=>{
                                // console.log(e.target.value);
                                this.$options.data[attrValue] = e.target.value;
                            })
                        }
                    }
                })
                if(node.childNodes.length>0){
                    this.compileNode(node);
                }
            }
           else if(node.nodeType==3){
                // nodetype为3是文本节点
                // 获取文本节点的文本内容
                let textcontent = node.textContent;
                // 正则表达式匹配规则 匹配{{message}}
                let reg = /\{\{\s*(\S+)\s*\}\}/g;

                if(reg.test(textcontent)){
                    let $1 = RegExp.$1;
                    node.textContent=node.textContent.replace(reg,this.$options.data[$1]);
                    // 在这里绑定事件，$1就是data中的属性值
                    this.addEventListener($1,e=>{
                        // e.detail就是上面defineReact()中数据劫持里创建事件所传的newValue
                        console.log(e.detail);
                        let oldValue = this.$options.data[$1];
                        let reg = new RegExp(oldValue);
                        node.textContent = node.textContent.replace(reg,e.detail);
                    })
                }

            }
        });
    }
}

```
运行结果：
![运行结果](https://img-blog.csdnimg.cn/20200602102223897.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L05EWURTRA==,size_16,color_FFFFFF,t_70)