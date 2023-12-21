## input相关

### 一、概述

**HTML**的`<input>`标签是开发中最为基础和常用的表单元素之一，它不仅提供了多种输入方式，还通过各种属性为开发者提供了丰富的控制选项

`<input>` 标签是用于在用户界面中创建可输入字段的元素，它通常是表单的一部分，允许用户==输入文本==、==选择选项==、==上传文件==等

`<input>` 元素最基本的形式如下：

```html
<input type="text" name="username" placeholder="Enter your username">
```

上述代码创建了一个文本输入框，用于输入用户名，并设置了占位符（`placeholder`）作为提示文字

### 二、 `<input>` 不同类型的应用场景

#### 2.1 文本输入框 (`type="text"`)

```html
<input type="text" name="username" placeholder="Enter your username">
```

用于接受单行文本输入，常见于用户注册、登录等场景

#### 2.2 密码输入框 (`type="password"`)

```html
<input type="password" name="password" placeholder="Enter your password">
```

隐藏用户输入的文本内容，适用于密码输入

#### 2.3 单选按钮 (`type="radio"`)

```html
<input type="radio" name="gender" value="male"> Male
<input type="radio" name="gender" value="female"> Female
```

用于选择一项，通常结合 `name` 属性以确保只能选择其中一项

#### 2.4 复选框 (`type="checkbox"`)

```html
<input type="checkbox" name="subscribe" checked> Subscribe to newsletter
```

允许用户选择多个选项，`checked` 属性表示默认选中状态

#### 2.5 文件上传 (`type="file"`)

```html
<input type="file" id="fileUpload" accept=".jpg, .jpeg, .png"/>
```

```js
const handleImageUpload = event => {
  // 获取文件
  const files = event.target.files;
  // 创建FormData对象
  const formData = new FormData();
  // 将文件内容追加到FormData上
  formData.append('myFile', files[0]，files[0].name);

  fetch('/saveImage', {
      method: 'POST',
      body: formData
  })
  .then(response => response.json())
  .then(data => {
      console.log(data.path);
  })
  .catch(error => {
      console.error(error);
  });
}

document.querySelector('#fileUpload').addEventListener('change', event => {
    handleImageUpload(event);
});
```

用于上传文件，通过表单提交时，文件内容将被包含在请求中

##### 2.5.1、`accept` 属性详解

在文件上传的 `<input>` 中，`accept` 属性用于限制用户能够选择的文件类型，它的值是一个包含一个或多个文件扩展名的字符串，用逗号分隔，在上面的例子中，用户只能选择带有 ".jpg"、".jpeg" 或 ".png" 扩展名的文件

- 指定具体文件类型

  ```html
  <input type="file" accept=".pdf, .doc, .docx" />
  ```

  在这个例子中，用户只能选择上传 ".pdf"、".doc" 或 ".docx" 类型的文件

- 指定文件类型组

  ```html
  <input type="file" accept="image/*" />
  ```

  通过使用通配符（*）可以指定某个文件类型的所有子类型，在这个例子中，用户可以选择上传任何图像文件

- 指定MIME类型

  ```html
  <input type="file" accept="image/jpeg, image/png" />
  ```

  除了文件扩展名外，`accept` 还支持指定 MIME 类型，这个例子中，用户只能上传 "image/jpeg" 或 "image/png" 类型的文件。

#### 2.6 数字输入框 (`type="number"`)

```html
<input type="number" name="quantity" min="1" max="10" step="1" value="1">
```

限制输入为数字，可设置最小值、最大值和步长

### 三、 `<input>` 常用属性

- `name` ：用于在提交表单时标识输入字段的名称，作为后台处理表单数据的关键
- `placeholder` ：提供在用户未输入内容时显示的占位符文本，用于给用户输入的提示 
- `value` ：设置输入字段的默认值，也可用于 JS 中动态设置或获取输入的值
- `disabled` ：禁用输入字段，使其不可编辑或不可选
- `required` ：要求用户在提交表单之前填写该字段，防止空值提交
- `readonly` ：将输入字段设置为只读，用户无法编辑，但可以查看内容
- `min`, `max`, `step` ：适用于 `type="number"` 的输入，分别用于设置最小值、最大值和步长
- `checked` ：适用于 `type="checkbox"` 和 `type="radio"`，表示默认选中状态

