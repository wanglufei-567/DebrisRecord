### FormData 对象

表单数据以键值对的形式向服务器发送，这是由浏览器自动完成的。但是有时候，我们需要自己通过 js 来完成，构造一个表单并发送给服务器。这就需要用到 formData 对象

formData 是一个构造函数，用来生成表单的实例

```html
<form id="myForm" name="myForm">
  <div>
    <label for="username">用户名：</label>
    <input type="text" id="username" name="username">
  </div>
  <div>
    <label for="useracc">账号：</label>
    <input type="text" id="useracc" name="useracc">
  </div>
  <div>
    <label for="userfile">上传文件：</label>
    <input type="file" id="userfile" name="userfile">
  </div>
<input type="submit" value="Submit!">
</form>

```

可以利用 FormData 来处理上面的表单

```js
var myForm = document.getElementById('myForm')
var formData = new FormData(myForm)

formData.set('username','xxx')
formData.get('username') // xxx

for(let k of formData.keys()){
  console.log(k)
}
//"username"
//"useracc"
//"userfile"

```



FormData提供以下方法

- FormData.get(key)：获取指定键名对应的键值，参数为键名。如果有多个同名的键值对，则返回第一个键值对的键值。
- FormData.getAll(key)：返回一个数组，表示指定键名对应的所有键值。如果有多个同名的键值对，数组会包含所有的键值。
- FormData.set(key, value)：设置指定键名的键值，参数为键名。如果键名不存在，会添加这个键值对，否则会更新指定键名的键值。如果第二个参数是文件，还可以使用第三个参数，表示文件名。
- FormData.delete(key)：删除一个键值对，参数为键名。
- FormData.append(key, value)：添加一个键值对。如果键名重复，则会生成两个相同键名的键值对。如果第二个参数是文件，还可以使用第三个参数，表示文件名。
- FormData.has(key)：返回一个布尔值，表示是否具有该键名的键值对。
- FormData.keys()：返回一个遍历器对象，用于for...of循环遍历所有的键名。
- FormData.values()：返回一个遍历器对象，用于for...of循环遍历所有的键值。
- FormData.entries()：返回一个遍历器对象，用于for...of循环遍历所有的键值对。如果直接用for...of循环遍历 FormData 实例，默认就会调用这个方法。



```js
var myForm = document.getElementById('myForm')
var formData = new FormData(myForm)
formData.set('username','xxx')
formData.append('username','yyy')
console.log(formData.getAll('username')) //["xxx", "yyy"]

formData.append('userpic[]', myFileInput.files[0], 'user1.jpg');
formData.append('userpic[]', myFileInput.files[1], 'user2.jpg');

```



下面是遍历器的例子

```js
var formData = new FormData();
formData.append('key1', 'value1');
formData.append('key2', 'value2');

for (var key of formData.keys()) {
  console.log(key);
}
// "key1"
// "key2"

for (var value of formData.values()) {
  console.log(value);
}
// "value1"
// "value2"

for (var pair of formData.entries()) {
  console.log(pair[0] + ': ' + pair[1]);
}
// key1: value1
// key2: value2

// 等同于遍历 formData.entries()
for (var pair of formData) {
  console.log(pair[0] + ': ' + pair[1]);
}
// key1: value1
// key2: value2

```


