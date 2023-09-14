## Docker笔记（一）Docker的基本使用

### 一、前言

![img](https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/bg2018020901.png)

#### **1.1、Docker是什么？**

**Docker**是一种**==容器==**化平台，用于**==封装==**应用程序和其依赖项，实现高度==可移植==、==一致性==和==高效==的应用部署；

**Docker**允许开发人员==将应用程序及其所有依赖项封装在一个独立的容器中==，这个容器包含了应用程序的代码、运行时环境、库和配置文件，以确保应用程序能够在不同的环境中一致运行

**Docker**的核心概念是**==容器==**，它是一个轻量级、可移植和自包含的单元，具有高度的隔离性

#### 1.2、Docker解决了什么问题？

软件开发最大的麻烦事之一，就是**环境配置**，我们可能经常会听到的一句话*“我本地是好的，你检查下你的环境”*

这就是环境不一致导致的问题，并且环境的配置耗时耗力，若是交付代码时能够将环境一起交付便可以解决这个问题，**Docker**就是用来做这件事的

**Docker**解决的问题：

1. **应用程序环境一致性**
   - 在传统的开发和部署过程中，应用程序可能在开发、测试和生产环境之间出现差异，导致了许多不稳定性和问题
   - **Docker**解决了这个问题，通过==容器化==，可以确保应用程序在不同环境中的一致性，从而减少了部署问题
2. **资源利用率**
   - 与传统虚拟机相比，**Docker**容器==更加轻量级==
   - 传统虚拟机需要运行完整的操作系统，而**Docker**容器共享主机操作系统的内核，因此更加高效。这意味着可以在同一台物理主机上运行更多的容器，提高了资源利用率
3. **快速部署和扩展**
   - **Docker**容器==可以快速启动和停止==，减少了应用程序的部署时间。此外，容器可以轻松地在多个主机之间迁移，实现了快速扩展和负载均衡

#### 1.3、什么是容器？

**Docker**之所以能够解决这些问题，全都是依靠于**Linux容器化技术**，**==容器==**是一种==轻量级==、==独立==且可==隔离==的应用程序==封装==技术

它将应用程序及其所有依赖项，包括代码、运行时环境、库和配置文件，打包在一个单独的可执行单元中。容器技术允许开发人员将应用程序与其运行环境隔离开来，使其能够在不同的计算环境中保持一致性和可移植性

区别于虚拟机虚拟一套完整的操作系统，容器仅仅只是封装了一套root文件系统

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/51rjfyrupq.jpeg" alt="img" style="zoom:60%;" />

<!--操作系统分为内核和用户空间，对于 Linux 而言，内核启动后，会挂载 root文件系统为其提供用户空间支持，容器创建的image就相当于是一个root文件系统-->

可以把容器看做是一个简易版的**Linux**环境（包括root用户权限、进程空间、用户空间和网络空间等）和运行在其中的应用程序

#### 1.4、如何理解物理机、虚拟机和容器

- 物理机：一栋独立地基<!--CPU、内存-->的别墅

  <img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/7000-20230911004348901.jpeg" alt="img" style="zoom:50%;" />

- 虚拟机：共享地基的楼房，一栋楼中有多套房子，独门独户，独立水电、燃气、宽带<!--操作系统-->

  <img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/7000-20230911004420047.jpeg" alt="img" style="zoom:50%;" />

- 容器：一套房子分割的小隔间，用同一个水电表、宽带账号<!--操作系统内核-->，但是有独立的家具设施<!--root文件系统-->

  <img src="https://ask.qcloudimg.com/http-save/developer-news/19dsmii41b.jpeg?imageView2/2/w/2560/h/7000" alt="img" style="zoom:50%;" />

### 二、Docker的核心概念



<img src="https://ask.qcloudimg.com/http-save/developer-news/m44n2ilxf.jpeg?imageView2/2/w/2560/h/7000" alt="img" style="zoom:50%;" />

**Docker**包括三个基本概念：**镜像**（**Image**）、**容器**（**Container**）、**仓库**（**Repository**）

- **镜像（Image）——一个特殊的文件系统**
  - 操作系统分为**内核**和**用户空间**。对于Linux而言，内核启动后，会挂载root文件系统为其提供用户空间支持。==而**Docker**镜像（Image），就相当于是一个**root文件系统**==
  - **Docker**镜像是一个特殊的文件系统，除了提供容器运行时所需的程序、库、资源、配置等文件外，还包含了一些为运行时准备的一些配置参数（如匿名卷、环境变量、用户等） ==镜像不包含任何动态数据，其内容在构建之后也不会被改变==
  - 镜像构建时，会一层层构建，前一层是后一层的基础 <!--前一层是基础镜像-->每一层构建完就不会再发生改变，后一层上的任何改变只发生在自己这一层
    - 比如，删除前一层文件的操作，实际不是真的删除前一层的文件，而是仅在当前层标记为该文件已删除。在最终容器运行的时候，虽然不会看到这个文件，但是实际上该文件会一直跟随镜像
    - 因此，在构建镜像的时候，需要额外小心，每一层尽量只包含该层需要添加的东西，任何额外的东西应该在该层构建结束前清理掉
  - 分层存储的特征还使得镜像的复用、定制变的更为容易。甚至可以用之前构建好的镜像作为基础层，然后进一步添加新的层，以定制自己所需的内容，构建新的镜像。

- **容器（Container）——镜像运行时的实体**
  - **镜像**（**Image**）和**容器**（**Container**）的关系，就像是面向对象程序设计中的类和实例一样，==镜像是静态的定义，容器是镜像运行时的实体==。容器可以被创建、启动、停止、删除、暂停等 
  - ==容器的实质是进程==，但与直接在宿主执行的进程不同，容器进程运行于属于自己的独立的命名空间
  - **容器存储层**的生存周期和容器一样，==容器消亡时，**容器存储层**也随之消亡==。因此，任何保存于容器存储层的信息都会随容器删除而丢失。
  - 按照Docker最佳实践的要求，==容器不应该向其存储层内写入任何数据 ，容器存储层要保持无状态化==
    - 所有的文件写入操作，都应该使用**数据卷**（**Volume**）、或者**绑定宿主目录**，在这些位置的读写会跳过容器存储层，直接对宿主（或网络存储）发生读写，其性能和稳定性更高
    - ==数据卷的生存周期独立于容器，容器消亡，数据卷不会消亡==。因此， 使用数据卷后，容器可以随意删除、重新run，数据却不会丢失

- **仓库（Repository）——集中存放镜像文件的地方**
  - 镜像构建完成后，可以很容易的在当前宿主上运行，但是， 如果需要在其它服务器上使用这个镜像，我们就需要一个集中的存储、分发镜像的服务，**Docker Registry**就是这样的服务

  - 一个**Docker Registry**中可以包含多个仓库（**Repository**），每个仓库可以包含多个标签（Tag），每个标签对应一个镜像。所以说：==镜像仓库是Docker用来集中存放镜像文件的地方类似于我们之前常用的代码仓库==

    - 通常，一个仓库会包含同一个软件不同版本的镜像，而标签就常用于对应该软件的各个版本 。我们可以通过`image:tag`的格式来指定具体是这个软件哪个版本的镜像，如果不给出标签，将以`latest`作为默认标签

  - **Docker Registry公开服务**和**私有Docker Registry**的概念：

    - **Docker Registry公开服务** 是开放给用户使用、允许用户管理镜像的**Registry**服务。一般这类公开服务允许用户免费上传、下载公开的镜像，并可能提供收费服务供用户管理私有镜像

       <!--例如Docker hub-->

    - 除了使用公开服务外，用户还可以在本地搭建**私有Docker Registry** 。==**Docker**官方提供了**Docker Registry**镜像，可以直接使用做为私有**Registry**服务==。开源的**Docker Registry**镜像只提供了**Docker Registry API**的服务端实现，足以支持**Docker**命令，不影响使用，但不包含图形界面，以及镜像维护、用户管理、访问控制等高级

除了**镜像**（**Image**）、**容器**（**Container**）、**仓库**（**Repository**）这三个基本概念之外，**Docker**还有一些其他重要概念：

- **Dockerfile**：**Docker**镜像的"**构建指南**"

  - **Dockerfile**是一个文本文件，用于==定义**Docker**镜像的构建过程==，它包含了一系列指令，==每个指令都代表了在镜像中执行的操作==

  - 通过**Dockerfile**，可以定义镜像的基础操作系统、安装软件包、添加文件、设置环境变量等

  - 构建**Docker**镜像的典型工作流程包括编写Dockerfile，然后使用`docker build`命令来生成镜像

    以下是一个简单的**Dockerfile**示例：

  ```dockerfile
  # 使用官方的Ubuntu 20.04基础镜像
  FROM ubuntu:20.04
  
  # 安装一个简单的Web服务器
  RUN apt-get update && apt-get install -y apache2
  
  # 启动Web服务器
  CMD ["apache2ctl", "-D", "FOREGROUND"]
  ```

- **容器编排 (Container Orchestration)**：

  - **容器编排**是一种**自动化和管理**容器的方法，通常用于大规模部署和维护容器化应用程序。它包括自动化容器的部署、伸缩、负载均衡、服务发现、故障恢复等操作
  - 最流行的容器编排工具之一是**Kubernetes**，它提供了丰富的功能和强大的生态系统，用于管理容器集群。通过**Kubernetes**，开发人员可以轻松地定义应用程序的架构，部署多个容器，确保高可用性和可伸缩性

- **Docker Compose**:

  - **Docker Compose**是用于定义和运行多个容器的工具，通常用于本地开发和测试环境，它通过一个YAML文件来描述应用程序的各个组件，包括容器映像、环境变量、网络设置等

  - 使用`docker-compose up`命令，您可以轻松地启动整个应用程序堆栈。这使得开发人员可以在本地模拟多容器应用程序的部署，以便更轻松地开发和测试

    以下是一个简单的Docker Compose示例：

  ```yaml
  version: '3'
  services:
    web:
      image: nginx:latest
      ports:
        - "80:80"
    app:
      image: myapp:latest
  ```

  在此示例中，我们定义了一个Web服务器容器和一个自定义应用程序容器，并将它们组合在一起

- **Docker Volume**:

  - ==**Docker Volume**是用于持久化数据的机制，允许容器在生命周期内维护数据状态==。默认情况下，容器中的文件系统是==临时的==，==当容器停止或删除时，所有数据都会丢失==，**Docker Volume**允许您将数据挂载到主机文件系统或其他容器中，以便数据可以在容器之间共享或在容器重启后保留
  - 使用**Docker Volume**，可以将持久化存储附加到容器，例如数据库文件、配置文件、日志文件等，创建和管理**Docker Volume**的命令包括`docker volume create`（创建新卷）、`docker volume ls`（列出卷）和`docker volume rm`（删除卷）等

  例如，要将一个卷挂载到容器的`/data`目录，可以使用以下方式：

  ```bash
  docker run -v my_volume:/data my_image
  ```
  
这将创建名为`my_volume`的卷，并将其挂载到容器的`/data`目录，使数据持久化
  
- **Docker镜像的存储位置**

  - **Docker** 镜像默认存储在 **Docker** ==守护程序的数据目录==中，具体位置取决于使用的操作系统

  - **macOS** 和 **Windows**系统下**Docker** 镜像存储在**==虚拟机内部==**，而不是直接存储在操作系统的文件系统中，因为 **Docker** 在这些操作系统上运行时使用了虚拟化技术

  - ==**导出 Docker 镜像：**==

    - 可以使用 `docker save` 命令将一个或多个镜像==打包成一个 `tar` 归档文件==，然后可以将这个 `tar` 文件复制到其他地方，例如另一台机器上，以便导入镜像

    ```bash
    docker save -o <output_file_name>.tar <image_name>
    ```

    - `-o`：表示`output`（输出）
    - `<output_file_name>.tar`：指定导出的 `tar` 文件的文件名和路径
    - `<image_name>`：要导出的 **Docker** 镜像的名称

  - **==导入Docker镜像：==**

    - 使用 `docker load` 命令在另一台机器上导入镜像

    ```bash
    docker load -i <input_file_name>.tar
    ```

    - `-i`: 表示`input`（输入）
    - `<input_file_name>.tar`：要导入的 tar 文件的文件名和路径

### 三、Docker中常用的命令

以下是一些常用的**Docker**命令，用于管理容器和镜像：

1. **管理镜像**：

   - ==`docker build -t <image_name> <Dockerfile_path>`：根据**Dockerfile**构建一个新的镜像==
     - `-t` 选项用于指定镜像的名称和标签（tag）
     - `image-name` 为镜像指定的名称
     - `tag` 为镜像指定的标签，通常用于版本控制
     - `Dockerfile_path` 表示 **Dockerfile** 所在的当前目录
   - ==`docker images`：列出所有本地镜像==
   - `docker pull <image_name>`：从**Docker Hub**或其他仓库中拉取镜像
   - `docker push <image_name>`：将镜像推送到Docker Hub或其他仓库
   - `docker rmi <image_id>`：删除本地镜像

2. **创建和运行容器**：

   - ==`docker run <image_name>`：基于指定的镜像创建并启动一个容器==

   - `docker run -d <image_name>`：在后台模式下运行容器

     - ==`-d`：表示以后台模式运行容器==

       <!--`-d` 或 `--detach`: 这个选项告诉Docker在后台以守护进程方式运行容器，而不会将容器的标准输入（stdin）、标准输出（stdout）和标准错误（stderr）连接到终端-->

   - `docker run -d -p 8080:80 --name my_container <image_name>:<tag>`：创建并运行一个带有标签（tag）的容器

     - `-p 8080:80`：将主机的8080端口映射到容器的80端口
     - `--name my_container`：为容器指定一个名称为`my_container`
     - `image_name`：指定要使用的镜像
     - `tag`: 标签名称

   - ==`docker run -it <image_name> /bin/bash`：以交互模式启动容器，并进入容器的Shell== <!--像ssh连接访问远端服务器-->

     - `-it`：这两个选项结合在一起，表示以交互模式运行容器
       -  `-i` 表示交互式（允许用户输入）
       - `-t` 表示分配一个伪终端
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

   - `docker ps`：列出运行中的容器

   - `docker ps -a`：列出所有容器，包括停止的容器

3. **容器日志和信息**：
   - `docker logs <container_id>`：查看容器的日志
   - `docker inspect <container_id>`：查看容器的详细信息，包括配置和网络设置

4. **容器数据卷**：
   - `docker volume create <volume_name>`：创建一个数据卷
   - `docker volume ls`：列出所有数据卷
   - `docker volume rm <volume_name>`：删除一个数据卷
   - `docker run -v <volume_name>:<container_path>`：将数据卷挂载到容器中，用于持久化数据

5. **容器网络**：
   - `docker network create <network_name>`：创建一个自定义网络
   - `docker network ls`：列出所有网络
   - `docker network rm <network_name>`：删除一个自定义网络
   - `docker network inspect <network_name>`：查看网络的详细信息

6. **其他常用命令**：
   - `docker version`：查看Docker客户端和服务器的版本信息
   - `docker info`：查看Docker系统的详细信息
   - `docker login`：登录到Docker Hub或其他仓库
   - `docker logout`：注销Docker Hub或其他仓库
   - `docker search <search_term>`：搜索Docker Hub上的镜像
   - `docker cp <container_id>:<source_path> <destination_path>`：从容器复制文件到本地系统
   - `docker top <container_id>`：查看容器内运行的进程
   - `docker stats <container_id>`：查看容器的资源使用情况