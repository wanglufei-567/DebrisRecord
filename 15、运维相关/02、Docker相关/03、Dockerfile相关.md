## Docker笔记（二）Dockerfile相关

### 一、什么是Dockerfile?

**Dockerfile** 是是一个用于定义「 **Docker 镜像**」构建过程的文本文件

它包含了一系列的指令，每一条指令都会在镜像中执行相应的操作，比如：基础镜像的选择、安装依赖、复制文件、设置工作目录、暴露端口、环境变量的配置等等

简单来说，**Dockerfile** 就像是一个**“配方”**，告诉 **Docker** 如何一步步构建出你需要的运行环境，

通过 **Dockerfile** 构建出来的镜像可以保证在不同的机器上有一致的运行环境，无需担心不同环境的兼容性问题，非常适合应用的打包、部署和分发

### 二、Dockerfile的基本结构

以下是一个示例 **Dockerfile**，用于构建一个基于 **Node.js** 的简单 **web** 应用程序的容器镜像：

```dockerfile
# 使用 Node.js 14 作为基础镜像
FROM node:14

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json 到容器
COPY package*.json ./

# 安装应用程序依赖
RUN npm install

# 复制应用程序源代码到容器
COPY . .

# 暴露端口
EXPOSE 3000

#设置容器运行时的用户
USER www-data

#创建挂载点，用于持久化存储
VOLUME /data

# 定义启动命令
CMD ["node", "app.js"]
```

一个基本的 **Dockerfile** 包含以下几个关键元素：

- `FROM`：==指定基础镜像==，即构建镜像的起点
- `RUN`：运行命令，用于安装软件包和执行其他构建任务
- `COPY` 和 `ADD`：==将本地文件复制到容器中==
- `WORKDIR`：设置容器内的工作目录
- `ENV`：设置环境变量
- `EXPOSE`：声明容器将监听的端口
- `CMD` 和 `ENTRYPOINT`：指定容器启动时要执行的命令
- `USER`：设置容器运行时的用户
- `VOLUME`：创建挂载点，用于持久化存储
- `ARG`：定义构建时的参数，可用于在构建过程中传递变量
- `LABEL`：为镜像添加元数据标签

### 三、Dockerfile使用技巧

#### 3.1、使用 alpine 镜像

**Docker** 容器内跑的是 **Linux** 系统，各种镜像的 **Dockerfile** 都会继承 **Linux** 镜像作为基础镜像

而**Linux**又分为**发行版**和**Alpine版本**：

- **Linux** 发行版通常包含更多功能和广泛的软件包支持，适用于多种用途
- **Alpine Linux** 更小巧、适合容器和嵌入式领域，重点是轻量级和安全

对于**Docker**构建镜像来说，只需要更轻量的**Alpine**版本即可，这样构建出来的镜像也会小很多

```dockerfile
# 使用 Node.js 18 作为基础镜像
FROM node:18

# node:18-alpine3.14 是使用 18 版本的 node 镜像，它底层使用 alpine 3.14 的基础镜像。
FROM node:18-alpine3.14
```

#### 3.2、使用多段构建

**Dockerfile** 的**多阶段构建**（**Multi-Stage Build**）是一种在单个 **Dockerfile** 中定义多个构建阶段的技术，用于==精简最终容器镜像的大小==，多阶段构建可以帮助==移除构建过程中不必要的文件和依赖项==，从而减小最终镜像的体积

以下是使用多阶段构建的示例：

```dockerfile
# 阶段 1：构建阶段
FROM node:18-alpine3.14 as build-stage

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

RUN npm run build

# 阶段 2：最终镜像 production stage
FROM node:18-alpine3.14 as production-stage

COPY --from=build-stage /app/dist /app
COPY --from=build-stage /app/package.json /app/package.json

WORKDIR /app

RUN npm install --production

EXPOSE 3000

CMD ["node", "/app/main.js"]

```

在上面的示例中，

- 第一个阶段那里通过**FROM** 后面添加一个 `as` 来指定当前构建阶段的名字，
- 在第二个阶段通过 **COPY --from=xxx** 可以从上个阶段复制文件过来，然后 `npm install` 的时候添加 `--production`，这样只会安装 `dependencies` 的依赖

`docker build` 之后，只会留下最后一个阶段的镜像，最终构建出来的镜像里是没有源码的，有的只是 `dist` 的文件和运行时依赖

多阶段构建的优点包括：

- 减小最终容器镜像的大小，减少网络传输和存储成本。
- 提高容器的安全性，因为不包含构建工具和不必要的文件。
- 简化部署流程，只需要一个最终镜像即可。

要使用多阶段构建，只需在 **Dockerfile** 中定义多个 `FROM` 指令，每个 `FROM` 都会启动一个新的构建阶段，可以在不同的阶段中执行不同的操作，还可以使用 `COPY --from=<阶段名称>` 指定从其他阶段复制文件到当前阶段

