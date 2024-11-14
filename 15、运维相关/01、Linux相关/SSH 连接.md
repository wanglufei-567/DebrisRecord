## SSH 连接

### 一、创建秘钥与公钥

如果用户目录下没有`.ssh`目录，则需要新建一个

```powershell
cd ~/.ssh
ssh-keygen -t rsa -f id_rsa_my
ssh-keygen -t rsa -f id_rsa_company
```

一路回车即可

上面`ssh-keygen` 命令参数：

- -t: 指定生成`rsa` 类型秘钥
- -f: 指定生成秘钥的名字，可以不指定该参数，默认就会生成2个文件：私钥`id_rsa`，公钥`id_rsa.pub`。由于需要生成两对私钥公钥，因此需要指定`-f`，否则生成两次后，私钥公钥会覆盖

上面的命令调用完后会生成四个文件：

- `id_rsa_my`
- `id_rsa_my.pub`
- `id_rsa_company`
- `id_rsa_company.pub`

### 二、创建config

在`.ssh`目录下创建`config` 文件，`SSH` 通过这个文件才知道哪个私钥去对应哪个公钥

```bash
touch config
```

`config`文件内容：

```perl
# my
Host my
HostName github.com
IdentityFile ~/.ssh/id_rsa_my

# company
Host test7
User root
HostName 52.131.227.208
IdentityFile ~/.ssh/id_rsa_test_company
```

`config`文件部分参数含义，仅做记录

```bash
# Host: 主机别名
# HostName: 托管平台域名地址，如github.com
# IdentityFile: 该Host私钥文件
# User: 托管平台用户名
# Port: 端口号，可不填（如果不是默认22号端口则需要指定）
# PreferredAuthentications publickey
```

### 三、创建 SSH 连接

在命令行中输入以下命令以测试连接：

```bash
ssh user@hostname_or_ip
```

- **user**：你要登录的用户名
- **hostname_or_ip**：服务器的主机名或 IP 地址

如果是第一次连接到这个主机，会被询问是否要接受服务器的指纹，输入 `yes` 然后按下回车即可

如果成功登录到远程主机，**SSH** 连接就没有问题，可以在远程主机上运行一些命令来确认连接的稳定性，例如：

```bash
uname -a  # 显示操作系统信息
whoami    # 显示当前登录用户
```

