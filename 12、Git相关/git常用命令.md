## git config

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
