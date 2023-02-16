**查看 brew.git 当前源**

```
cd "$(brew --repo)" && git remote -v

git remote // 列出指定的每一个远程服务器的简写
git remote -v // 显示远程仓库使用的 Git 保存的简写与其对应的 URL
```

**查看brew当前已经安装的包**

```
brew list 
```

**安装包**

```
brew install [包名]

//安装git
brew install git
```

**更新包**

```
// 查询可更新的包
brew outdated

//更新所有
brew upgrade

//更新指定包
brew upgrade [包名]
```

**卸载包**

```
brew uninstall [包名]

//例：卸载git
brew uninstall git
```

**清理旧版本**

```
//清理所有包的旧版本
brew cleanup 

//清理指定包的旧版本
brew cleanup [包名]

//查看可清理的旧版本包，不执行实际操作
brew cleanup -n 
```



