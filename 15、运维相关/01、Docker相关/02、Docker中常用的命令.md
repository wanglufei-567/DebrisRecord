## Docker笔记（二）Docker中常用的命令

### 一、管理镜像

- ==根据**Dockerfile**构建一个新的镜像==
  - `docker build -t <image_name> <Dockerfile_path>`
    - `-t` 选项用于指定镜像的名称和标签（tag）
    - `image-name` 为镜像指定的名称
    - `tag` 为镜像指定的标签，通常用于版本控制
    - `Dockerfile_path` 表示 **Dockerfile** 所在的当前目录 <!--默认找dockerfile这个文件-->

- `docker images`：==**列出所有本地镜像**==
- `docker commit <container_id> new_image_name`：==**通过已有容器构建一个新的镜像**==
- `docker pull <image_name>`：从**Docker Hub**或其他仓库中拉取镜像
- `docker push <image_name>`：将镜像推送到Docker Hub或其他仓库
- `docker rmi <image_id>`：删除本地镜像

### 二、创建和运行容器

- **==创建并运行一个带有标签（tag）的容器==**

  - `docker run -p 8080:80 --name my_container <image_name>:<tag> -d  `

    - `-p 8080:80`：将主机的8080端口映射到容器的80端口

    - `--name my_container`：为容器指定一个名称为`my_container`

       <!--没有指定名字就会生成一个随机名字-->

    - `image_name`：指定要使用的镜像

    - `tag`: 标签名称

    - ==`-d`：表示以后台模式运行容器==

      <!--`-d` 或 `--detach`: 这个选项告诉Docker在后台以守护进程方式运行容器，而不会将容器的标准输入（stdin）、标准输出（stdout）和标准错误（stderr）连接到终端-->

- ==**以交互模式启动容器，并进入容器的Shell**== <!--像ssh连接访问远端服务器-->

  - `docker run -it <image_name> /bin/bash`：
    - `-it`：这两个选项结合在一起，表示以交互模式运行容器
      -  `-i` 表示交互式（允许用户输入）
      -  `-t` 表示分配一个伪终端
    - `/bin/bash`：这是在容器内执行的命令，表示要进入容器的**Bash Shell**
    - 要退出容器的**Shell**并停止容器，可以输入 `exit` 命令，然后容器将终止

- `docker exec -it <container_id> /bin/bash`：进入正在运行的容器的Shell

- `docker attach <container_id>`：附加到正在运行的容器的标准输入、输出和错误流

- `docker start <container_id>`：启动已经创建的容器

- `docker stop <container_id>`：停止运行的容器

- `docker restart <container_id>`：重启容器

- `docker pause <container_id>`：暂停容器的所有进程

- `docker unpause <container_id>`：恢复暂停的容器

- `docker rm <container_id>`：删除一个或多个容器

- `docker ps`：==**列出运行中的容器**==

- `docker ps -a`：列出所有容器，包括停止的容器

- `docker ps  --filter "label=mytag"`：列出指定tag的容器

### 三、容器日志和信息

- `docker logs <container_id>`：查看容器的日志

- `docker inspect <container_id>`：查看容器的详细信息，包括配置和网络设置

### 四、容器数据卷

- `docker volume create <volume_name>`：创建一个数据卷
- `docker volume ls`：列出所有数据卷
- `docker volume rm <volume_name>`：删除一个数据卷

- `docker run -v <volume_name>:<container_path>`：将数据卷挂载到容器中，用于持久化数据

### 五、容器网络

- `docker network create <network_name>`：创建一个自定义网络
- `docker network ls`：列出所有网络
- `docker network rm <network_name>`：删除一个自定义网络
- `docker network inspect <network_name>`：查看网络的详细信息

### 六、其他常用命令

- ==**从容器复制文件到本地系统**==

  - `docker cp <container_id>:<source_path> <destination_path>`：

    - `<container_id>:<source_path>`：指定容器的指定文件目录 

      <!--container_id是容器id不是容器name-->

- `docker version`：查看Docker客户端和服务器的版本信息

- `docker info`：查看Docker系统的详细信息

- `docker login`：登录到Docker Hub或其他仓库

- `docker logout`：注销Docker Hub或其他仓库

- `docker search <search_term>`：搜索Docker Hub上的镜像

- `docker top <container_id>`：查看容器内运行的进程

- `docker stats <container_id>`：查看容器的资源使用情况