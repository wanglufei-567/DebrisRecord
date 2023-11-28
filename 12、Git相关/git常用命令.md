## git 常用命令

### 一、git config

`git`的配置共三个级别

- 仓库级别 local  <!--优先级最高 文件位置.git/config--> 
- 用户级别 global <!--优先级次之 文件位置~/.gitconfig-->
- 系统级别 system <!--优先级最低 文件位置/etc/gitconfig-->

```bash
git config --local -l  #查看仓库配置【必须要进入到具体的目录下】

git config --global -l #查看用户配置

git config --system -l #查看系统配置

git config #添加配置项目 

git config --global user.email “you@example.com”
git config --global user.name “Your Name”
```

### 二、commit message

`commit`信息需要加上如下`type`前缀

```bash
feat：新功能（feature）
fix：修补bug
docs：文档（documentation）
style： 格式（不影响代码运行的变动）
refactor：重构（即不是新增功能，也不是修改bug的代码变动）
test：增加测试
chore：构建过程或辅助工具的变动
```

根据`commitId`查找某次提交内容，通过`git show` 或者 `git log -p -1` 等（也可以用前八位进行搜索）

```shell
git show 124a9a0ee1d8f1e15e833aff432fbb3b02632105
git log -p -1 124a9a0ee1d8f1e15e833aff432fbb3b02632105
```

### 三、清除缓存

要清除已经被**Git**缓存记录但在`.gitignore`文件中的未跟踪文件，可以使用以下步骤：

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

这将会从**Git**缓存中删除指定的文件或文件夹，并将这个更改提交到版本控制系统中，从此以后，这些文件或文件夹将不再被**Git**跟踪，但仍然保留在工作目录中

请注意，如果这些文件或文件夹之前已经被提交到**Git**仓库，它们的历史记录仍然会存在于以前的提交中，这只是从当前或将来的提交中删除了它们

### 四、追踪关系

可以使用`git branch -vv`命令来查看本地分支与远程分支的追踪关系，这个命令会显示出所有本地分支，以及它们各自追踪的远程分

例如：

```bash
$ git branch -vv
* master fe69429 [origin/master: ahead 11, behind 4] Merge branch 'zhangyi-dev'
  zhangyi-dev 930cf95 [origin/zhangyi-dev] 解决冲突
```

这就表示`master`分支正在追踪`origin/master`分支，并且本地有11个提交还没有推送到服务器，而服务器上有4个提交还没有拉取到本地

可以通过以下三种方式来设置分支的追踪关系：

- 手动建立追踪关系：

```bash
git branch --set-upstream-to=<远程主机名>/<远程分支名> <本地分支名>
```

- push时建立追踪关系：

```bash
git push -u <远程主机名> <本地分支名>
```

加上-u参数，这样push时，本地指定分支就和远程主机的同名分支建立追踪关系1。

- 新建分支时建立跟踪关系：

```bash
git checkout -b <本地分支名> <远程主机名>/<远程分支名>
```

### 五、git diff

可以使用`git diff`命令，查看两个提交之间的代码更改，或者查看当前仓库和早期提交之间的更改

- 比较当前工作目录和暂存区的更改：

  ```bash
  git diff
  ```

- 比较暂存的更改和的最后一次提交的更改：

  ```bash
  git diff --cached
  ```

- 比较两个不同的提交：

  ```bash
  git diff <commit1> <commit2>
  ```

- 比较两个分支的差异：

  ```bash
  git diff branch1 branch2
  
  # 在这个命令中，`branch1`和`branch2`是想要比较的两个分支的名称
  # 这个命令会显示出`branch1`和`branch2`之间的所有文件的差异
  ```

- 如果只想比较特定文件夹的差异，可以在`git diff`命令后面添加文件夹的路径:

  ```bash
  git diff branch1 branch2 -- myfolder/
  
  # 多个目录可直接在--后面加上
  git diff release-5.9.0 release-6.0.0 -- packages/root/src/locale/en packages/root/src/locale/zh-CN
  ```

- 如果想将`diff`输出保存到名为`diff_output.txt`的文件中，可以使用以下命令：

  ```bash
  git diff > diff_output.txt
  # 这个命令会将`git diff`的输出保存到`diff_output.txt`文件中
  # 如果文件已经存在，这个命令会覆盖文件的内容，如果文件不存在，这个命令会创建一个新的文件
  
  git diff release-5.9.0 release-6.0.0 -- packages/root/src/locale/en packages/root/src/locale/zh-CN > diff_output.txt
  # 多个目录可直接在--后面加上
  ```

  - 如果不想覆盖文件的内容，而是想在文件的末尾添加新的内容，可以使用`>>`来代替`>

  ```bash
  git diff >> diff_output.txt
  # 这个命令会将`git diff`的输出添加到`diff_output.txt`文件的末尾
  ```

