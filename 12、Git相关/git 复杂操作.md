## git 复杂操作

### 一、合并commit

描述：将开发分支上的所有 `commit` 合并成一个 `commit` 并 `rebase` 到 `master` 上

**方式 1**：

命令：

```shell
git checkout your-feature-branch
git reset --soft master
git commit -m "Combine all commits"
git rebase master
```

解释：

- `git reset --soft master`：
  - 这条命令将当前分支的所有提交重置到 `master` 分支的状态，但保留工作目录和暂存区的更改
  - `--soft` 选项意味着重置只会移动当前分支的指针（**HEAD**），而不会改变工作目录和暂存区的内容

------

**方式 2**：

假设开发分支是基于 `master` 分支新建的，且包含多次 `merge` 和中间有其他 `commits`，可以通过交互式 `rebase` 和 `squash` 操作来简化冲突处理

详细步骤如下：

假设提交历史如下：

```mathematica
A - B - C - D - E - F - G - H - I (master)
     \         \       \     \       \
      M1        M2      M3    M4      M5
       \         \       \     \       \
        X1 - X2 - Y1 - Y2 - Z1 - Z2 - Z3 (your-feature-branch)
```

其中 `M1`, `M2`, `M3`, `M4`, `M5` 是 `merge` 提交，中间有其他开发分支的提交 `X1`, `X2`, `Y1`, `Y2`, `Z1`, `Z2`, `Z3`

**步骤 1：创建临时分支备份当前状态**

在进行任何操作之前，先创建一个临时分支备份当前状态：

```shell
git checkout -b backup-branch
```

**步骤 2：交互式 rebase 到最早的合并提交之前**

找到最早的合并提交之前的提交哈希，例如 `A`

进行交互式 `rebase`：

```shell
git checkout your-feature-branch
git rebase -i A
```

**步骤 3：在交互式 rebase 编辑器中 squash 提交**

在编辑器中，将除了第一个 `pick` 以外的所有 `pick` 改为 `squash` 或 `s`

例如：

```sql
pick X1 Initial commit on feature branch
squash X2 Second commit on feature branch
squash Y1 First commit after first merge
squash Y2 Second commit after first merge
squash Z1 First commit after second merge
squash Z2 Second commit after second merge
squash Z3 Third commit after second merge
```

保存并退出编辑器

**Git** 会开始 `rebase` 操作并合并所有提交，可能需要编辑合并后的提交消息

**步骤 4：处理冲突并继续 rebase**

如果在 `rebase` 过程中发生冲突，解决冲突并继续 `rebase`：

```shell
# 解决冲突后
git add <resolved-files>
git rebase --continue
```

**步骤 5：基于 master 进行 rebase**

现在开发分支上只有一个新的提交，可以基于最新的 `master` 分支进行 `rebase`：

```shell
git rebase master
```

如果再次遇到冲突，解决冲突并继续：

```shell
# 解决冲突后
git add <resolved-files>
git rebase --continue
```

**步骤 6：确认并清理临时分支**

确认开发分支 `rebase` 成功并且工作正常后，可以删除临时备份分支：

```shell
git branch -d backup-branch
```

### 