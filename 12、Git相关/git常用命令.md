## git 常用命令

### 一、git config

git的配置共三个级别

- 仓库级别 local  <!--优先级最高 文件位置.git/config--> 
- 用户级别 global <!--优先级次之 文件位置~/.gitconfig-->
- 系统级别 system <!--优先级最低 文件位置/etc/gitconfig-->

```
git config --local -l 查看仓库配置【必须要进入到具体的目录下】

git config --global -l 查看用户配置

git config --system -l 查看系统配置

git config 添加配置项目 

git config --global user.email “you@example.com”
git config --global user.name “Your Name”
```

### 二、commit message

commit信息需要加上如下type前缀

```js
feat：新功能（feature）
fix：修补bug
docs：文档（documentation）
style： 格式（不影响代码运行的变动）
refactor：重构（即不是新增功能，也不是修改bug的代码变动）
test：增加测试
chore：构建过程或辅助工具的变动
```

根据commitId查找某次提交内容，通过git show 或者 git log -p -1 等（也可以用前八位进行搜索）

```shell
git show 124a9a0ee1d8f1e15e833aff432fbb3b02632105
git log -p -1 124a9a0ee1d8f1e15e833aff432fbb3b02632105
```

### 三、清除缓存

要清除已经被Git缓存记录但在`.gitignore`文件中的未跟踪文件，可以使用以下步骤：

1. 清除缓存记录（Untrack）文件或文件夹：

   ```bash
   git rm -r --cached 文件名或文件夹名
   ```

   例如，如果要清除一个名为`example.txt`的文件的缓存记录，可以运行：

   ```bash
   git rm --cached example.txt
   ```

   如果要清除一个名为`folder`的文件夹的缓存记录，可以运行：

   ```bash
   git rm -r --cached folder
   ```

2. 提交更改：

   ```bash
   git commit -m "清除缓存记录"
   ```

这将会从Git缓存中删除指定的文件或文件夹，并将这个更改提交到版本控制系统中，从此以后，这些文件或文件夹将不再被Git跟踪，但仍然保留在工作目录中

请注意，如果这些文件或文件夹之前已经被提交到Git仓库，它们的历史记录仍然会存在于以前的提交中，这只是从当前或将来的提交中删除了它们