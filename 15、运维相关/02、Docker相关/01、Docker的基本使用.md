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

#### 2.1、三个基本概念

**Docker**包括三个基本概念：**镜像**（**Image**）、**容器**（**Container**）、**仓库**（**Repository**）

- **==镜像（Image==**）：一个特殊的文件系统

  - 操作系统分为**内核**和**用户空间**
    - 对于Linux而言，内核启动后，会挂载root文件系统为其提供用户空间支持
    - **Docker**镜像（Image），就相当于是一个==**root文件系统**==
  - **Docker**镜像是一个特殊的文件系统
    - 除了提供容器运行时所需的程序、库、资源、配置等文件外，还包含了一些为运行时准备的一些配置参数（如匿名卷、环境变量、用户等）
    -  镜像==不包含任何动态数据==，其内容在构建之后也不会被改变
  - 镜像构建时，会一层层构建，前一层是后一层的基础 <!--前一层是基础镜像-->每一层构建完就不会再发生改变，后一层上的任何改变只发生在自己这一层
- **==容器（Container）==**：镜像运行时的实体

  - **镜像**（**Image**）和**容器**（**Container**）的关系，就像是面向对象程序设计中的类和实例一样
    - 镜像是静态的定义，容器是镜像运行时的实体
    - 容器可以被创建、启动、停止、删除、暂停等
  - **容器存储层**的生存周期和容器一样
    - 容器消亡时，==**容器存储层**也随之消亡==，因此，任何保存于容器存储层的信息都会随容器删除而丢失。
  - 按照**Docker**最佳实践的要求，容器不应该向其存储层内写入任何数据 ，**容器存储层要保持无状态化**
    - 所有的文件写入操作，都应该使用**数据卷**（**Volume**）、或者**绑定宿主目录**，在这些位置的读写会跳过容器存储层，直接对宿主（或网络存储）发生读写，其性能和稳定性更高
  - ==数据卷的生存周期独立于容器==，容器消亡，数据卷不会消亡
    - 使用数据卷后，容器可以随意删除、重新run，数据却不会丢失

- **==仓库（Repository）==**：集中存放镜像文件的地方

  - 一个**Docker Registry**中可以包含多个仓库（**Repository**），每个仓库可以包含多个标签（Tag），每个标签对应一个镜像 <!--Docker Registry是个服务-->

    - 镜像仓库是Docker用来集中存放镜像文件的地方，==类似于代码仓库==
    - 通过`image:tag`的格式来指定具体是这个软件哪个版本的镜像，如果不给出标签，将以`latest`作为默认标签

  - **Docker Registry公开服务**和**私有Docker Registry**的概念：

    - **Docker Registry公开服务** 是开放给用户使用、允许用户管理镜像的**Registry**服务

       <!--例如Docker hub-->

    - 除了使用公开服务外，用户还可以在本地搭建**私有Docker Registry**

       - ==**Docker**官方提供了**Docker Registry**镜像，可以直接使用做为私有**Registry**服务==
       - 开源的**Docker Registry**镜像只提供了**Docker Registry API**的服务端实现，足以支持**Docker**命令，不影响使用，但不包含图形界面，以及镜像维护、用户管理、访问控制等高级

#### 2.2、其他重要概念

除了**镜像**（**Image**）、**容器**（**Container**）、**仓库**（**Repository**）这三个基本概念之外，**Docker**还有一些其他重要概念：

- ==**Dockerfile**：**Docker**镜像的"**构建指南**"==

  - **Dockerfile**是一个文本文件，用于==定义**Docker**镜像的构建过程==，它包含了一系列指令，每个指令都代表了在镜像中执行的操作

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

- ==**容器编排 (Container Orchestration)**==：

  - **容器编排**是一种**自动化和管理**容器的方法，通常用于大规模部署和维护容器化应用程序
    - 它包括自动化容器的部署、伸缩、负载均衡、服务发现、故障恢复等操作
  - 最流行的容器编排工具之一是**Kubernetes**，它提供了丰富的功能和强大的生态系统，用于管理容器集群
    - 通过**Kubernetes**，开发人员可以轻松地定义应用程序的架构，部署多个容器，确保高可用性和可伸缩性

- ==**Docker Compose**==:

  - **Docker Compose**是用于定义和运行多个容器的工具，通常用于本地开发和测试环境，它通过一个YAML文件来描述应用程序的各个组件，包括容器映像、环境变量、网络设置等

  - 使用`docker-compose up`命令，您可以轻松地启动整个应用程序堆栈。这使得开发人员可以在本地模拟多容器应用程序的部署，以便更轻松地开发和测试

    以下是一个简单的**Docker Compose**示例：

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

- ==**Docker Volume**==:

  - **Docker Volume**是用于==持久化数据==的机制，允许容器在生命周期内维护数据状态
    - 默认情况下，容器中的文件系统是==临时的==，当容器停止或删除时，所有数据都==会丢失==
    - **Docker Volume**允许将数据挂载到==主机文件系统==或其他容器中，以便数据可以在容器之间共享或在容器重启后保留
  - 使用**Docker Volume**，可以将持久化存储附加到容器，例如数据库文件、配置文件、日志文件等，创建和管理**Docker Volume**的命令包括：
    - `docker volume create`创建新卷
    - `docker volume ls`列出卷
    - `docker volume rm`删除卷

  例如，要将一个卷挂载到容器的`/data`目录，可以使用以下方式：

  ```bash
  docker run -v my_volume:/data my_image
  ```

  这将创建名为`my_volume`的卷，并将其挂载到容器的`/data`目录，使数据持久化

- ==**Docker镜像的存储位置**==:

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

- ==**Docker 镜像命名规则 **== <!--居然还有这个规则，怪不得私有仓库的镜像名字都要带上域名-->

  ```bash
  <registry>/<namespace>/<repository>:<tag>
  ```

  - **registry**：存储**Docker**镜像的仓库的地址
    - **Docker Hub**的地址就是`docker.io`
    - 阿里云的地址是`registry.cn-hangzhou.aliyuncs.com`
  - **namespace**：仓库中的命名空间，通常用于组织或用户的名称
    - **在Docker Hub**上，`library`就是一个命名空间，它包含了所有官方镜像
  - **repository**：镜像的名称，例如：`ubuntu`、`nginx`、`redis`等
  - **tag**：镜像的版本标签，例如：`latest`、`1.0`、`1.1`等

  所以，一个完整的**Docker**镜像名称可能看起来像这样：`docker.io/library/ubuntu:latest`；这表示从**Docker Hub**（docker.io）的library命名空间下载名为ubuntu的镜像，版本标签为latest

### 三、Docker的登陆与登出

**Docker**的登陆与登出命令为`docker login`和`docker logout`，这两个命令是==用于管理**Docker**注册表的认证信息==

- `docker login`：用于登录到一个**Docker**镜像仓库

  使用方式：

  ```bash
  docker login <registry> --username your_username --password your_password
  ```

  - `registry`：镜像仓库地址；如果未指定镜像仓库地址，默认为官方仓库**Docker Hub**

  - 登录成功后，==**Docker**会将你的认证信息存储在`~/.docker/config.json`文件中的`auths`属性中==

    > 像这样：
    >
    > ```json
    > {
    > 	"auths": {
    > 		"registry.cn-hangzhou.aliyuncs.com": {
    >       "auth": "Z3VhbmRhdGE6J0ohbkNoZW5nJw=="
    >     }
    > 	},
    > 	"credsStore": "desktop",
    > 	"currentContext": "desktop-linux",
    > 	"plugins": {
    > 		"-x-cli-hints": {
    > 			"enabled": "true"
    > 		}
    > 	}
    > }
    > ```
    >
    > 请注意，虽然在.docker/config.json文件中存储base64编码的凭据是可能的，但使用凭据存储库来存储这些信息通常更安全
    >
    > 如果你不希望Docker将你的认证信息存储在系统的凭据存储库中，你可以在.docker/config.json文件中直接提供这些信息
    >
    > 但是，请注意，这样做可能会增加你的凭据被泄露的风险

    <!--私有仓库的镜像名字前缀都会带上仓库域名，后续在进行私有仓库的推送时就是通过这个域名找到登陆认证信息完成推送操作-->

- `docker logout`：用于退出已登录的 **Docker** 镜像仓库

  - 这个命令会删除存储在`~/.docker/config.json`文件中的认证信息
