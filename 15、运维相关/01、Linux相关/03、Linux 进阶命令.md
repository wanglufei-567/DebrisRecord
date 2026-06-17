## Linux 其他命令

### 一、查看文件或文件夹的读写权限信息

```bash
ls -l <directory-path>

# 返回信息示例
# drwxr-xr-x      1          root         root        23 Apr  9 06:44     assets
# 文件权限信息  文件链接数   文件的所有者    文件的所属组    文件的最后修改时间     文件的名称
```

- `<directory-path>`：要查看权限的文件夹的路径

这个命令会返回一个列表，显示文件夹中每个文件的详细信息，包括文件的权限、所有者、大小和修改时间

文件的权限被表示为一串字符，例如 `drwxr-xr-x`

> 在 **Linux** 系统中，文件和目录的权限信息通常由10个字符组成，例如 `drwxr-xr-x`
>
> 这10个字符可以分为四部分：
>
> - **文件类型**：第一个字符表示文件类型
>
>   - `d` 表示这是一个目录（`directory`）
>   - `-` 表示这是一个普通文件
>   - `l` 表示这是一个链接（`link`）
>
> - **所有者权限**：接下来的三个字符表示文件所有者（`owner`）的权限
>
>   - `r` 表示读取（`read`）权限
>
>   - `w` 表示写入（`write`）权限
>
>   - `x` 表示执行（`execute`）权限
>
>     例如，`rwx` 表示所有者有读取、写入和执行的权限
>
> - **组权限**：接下来的三个字符表示同一组（`group`）内的其他用户的权限
>
> - **其他用户权限**：最后三个字符表示其他所有用户的权限

所以，对于 `drwxr-xr-x`：

- `d` 表示这是一个目录
- `rwx` 表示所有者有读取、写入和执行的权限
- `r-x` 表示同一组内的其他用户有读取和执行的权限，但没有写入的权限
- `r-x` 表示其他所有用户有读取和执行的权限，但没有写入的权限

### 二、给某个用户添加文件权限

在 **Linux** 系统中，可以使用 `chmod` 命令或 `chown` 命令来修改文件或目录的权限:

- **使用 `chmod` 命令修改权限**：`chmod` 命令可以修改文件或目录的读取、写入和执行权限

  ```bash
  chmod u+w <file-path>
  ```

  - `u+w` 表示给文件的所有者添加写入权限

  - `<file-path>` 是想要修改权限的文件或目录的路径

    > 也可以使用数字来表示权限，例如 `chmod 644 <file-path>`
    >
    > - `6` 表示所有者的权限（`6` 等于 `4+2`，即读取和写入权限）
    > - `4` 表示组的权限和其他用户的权限（`4` 表示只有读取权限)

- **使用 `chown` 命令修改所有者**：如果想改变文件或目录的所有者，可以使用 `chown` 命令

  ```bash
  chown <username> <file-path>
  ```

  - `<username>` 表示新的所有者的用户名
  - `<file-path>` 表示想要修改所有者的文件或目录的路径

### 三、查看当前用户角色

在 **Linux** 系统中，可以使用以下命令来查看当前用户的角色：

- `whoami`：此命令会显示当前用户的用户名
- `id -un`：此命令也可以用来查看当前用户的用户名
- `who -H`：此命令可以列出当前所有的用户名、窗口列表、开启时间和目录层次

### 四、进程常驻

**「进程常驻」** 指的是让一个命令、脚本或服务在终端关闭、**SSH** 断开、用户退出登录后仍然继续运行

不同方式解决的问题不完全一样：

- **tmux**：让终端会话常驻，适合需要人工观察和交互的长任务
- `nohup`：让单个命令脱离当前终端继续运行，适合简单后台任务
- **systemd**：把程序作为系统服务托管，适合生产环境长期运行

#### 4.1、使用 tmux 保持终端会话

**tmux** 是终端复用工具，它会在终端和 **Shell** 之间加一层会话管理

命令运行在 **tmux session** 里，不直接依赖当前终端窗口，所以关闭终端或断开 **SSH** 后，任务仍然可以继续运行，之后可以重新连接回同一个终端现场

```bash
# 创建一个名为 dev 的 tmux 会话
tmux new -s dev

# 在 tmux 会话中临时退出，但不关闭里面正在运行的任务
# 快捷键：先按 Ctrl-b，再按 d

# 查看已有 tmux 会话
tmux ls

# 重新进入 dev 会话
tmux attach -t dev

# 关闭 dev 会话
tmux kill-session -t dev
```

**tmux** 适合临时跑一个长命令，需要回来继续看终端，任务仍然需要人工输入、观察日志或临时中断

它不适合替代真正的服务管理，如果进程崩溃，**tmux** 不会自动重启进程；服务器重启后，**tmux** 会话也不会自动恢复

#### 4.2、使用 nohup 让命令脱离终端

`nohup` 表示忽略挂断信号，`&` 表示把命令放到后台运行

```bash
# 让脚本脱离当前终端，并在后台运行
nohup node server.js &
```

这里的几个关键点：

- `nohup`：避免终端断开时进程收到挂断信号后退出
- `&`：把命令放到后台运行

`nohup` 适合简单的一次性后台任务，不适合复杂服务治理，例如自动重启、日志轮转、依赖管理和开机自启

#### 4.3、使用 systemd 托管系统服务

**systemd** 是现代 **Linux** 系统常用的服务管理器，适合把程序作为长期服务运行

==它能处理开机自启、失败重启、日志查看、服务启停和运行状态管理==

使用 **systemd** 托管服务时，通常先把服务定义写到 `/etc/systemd/system/app.service`

> `app.service` 是一个普通文本配置文件，也叫 **systemd unit file**；
>
> 文件名里的 `app` 是服务名，后面的 `systemctl start app.service` 就是按这个文件里的规则启动服务
>
> 配置文件目录：
>
> - `/etc/systemd/system`：通常放管理员自己创建或覆盖的服务配置
> - `/usr/lib/systemd/system` 或 `/lib/systemd/system`：通常放系统包安装时自带的服务配置
>
> 只要 **unit 文件**位于 **systemd** 会加载的目录中，`systemctl` 就可以通过服务名管理它
>
> 启动服务时通常写 `sudo systemctl start app.service`，不需要写完整文件路径

```ini
[Unit]
Description=App Service
After=network.target

[Service]
WorkingDirectory=/opt/app
ExecStart=/usr/bin/node /opt/app/server.js
Restart=always
RestartSec=5
User=app

[Install]
WantedBy=multi-user.target
```

这个配置文件负责告诉 **systemd** 几件事：

- `app.service`：服务名称，后面的 `systemctl start app.service` 操作的就是这个服务
- `WorkingDirectory`：服务启动时所在的工作目录
- `ExecStart`：真正要长期运行的命令
- `Restart=always`：进程退出后自动重启
- `User=app`：使用哪个系统用户运行服务

配置文件写好或修改后，再通过 `systemctl` 管理这个服务：

```bash
# 重新加载 systemd 配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start app.service

# 停止服务
sudo systemctl stop app.service

# 查看服务状态
sudo systemctl status app.service

# 设置开机自启
sudo systemctl enable app.service

# 查看服务日志
journalctl -u app.service -f
```

**systemd** 适合生产环境服务常驻，如果程序是长期对外提供能力的服务，优先考虑这种方式

#### 4.4、常见选择建议

| 场景 | 推荐方式 |
| --- | --- |
| 临时跑一个长命令，需要回来继续看终端 | **tmux** |
| 简单后台执行一个脚本，不需要交互 | `nohup ... &` |
| 生产服务长期运行、自动重启、开机自启 | **systemd** |
