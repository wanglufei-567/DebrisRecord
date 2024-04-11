## k8s常用命令

- 替换容器中的镜像

  ```bash
  kubectl set image deployment/<deployment-name> <container-name>=<new-image>
  
  # eg.
  # kubectl set image deployment/guandata-web-deployment web=registry.cn-hangzhou.aliyuncs.com/guandata/guandata-web:xxx
  ```

  - `kubectl set image`：这是kubectl的一个子命令，用于更新资源的镜像。

  - `deployment/<deployment-name>`：这是你想要更新镜像的部署的名称

    - `deployment/`前缀表示这是一个部署资源

      > 在Kubernetes中，Deployment是一种资源对象，它描述了应用程序的运行方式（如使用哪个Docker镜像，端口号是多少等），以及如何更新和扩展应用程序。
      >
      > Deployment会管理Pod的生命周期，包括创建Pod，更新Pod的镜像，扩展Pod的数量，以及在Pod出现故障时重新创建Pod
      >
      > 如果你想查看当前有哪些Deployment，你可以使用以下的`kubectl`命令
      >
      > ```bash
      > kubectl get deployments
      > ```

  - `<container-name>=<new-image>`：要设置的新镜像

    - `<container-name>`是容器的名称
    - `<new-image>`是新镜像的地址和标签

- 重启pod

  ```bash
  kubectl delete pod <pod-name> 
  ```

- 应用配置文件

  ```bash
  kubectl apply -f xxx.yaml
  ```

  - `kubectl apply`：这是kubectl的一个子命令，用于应用配置文件，这个命令会根据配置文件中的定义创建或更新资源

  - `-f xxx.yaml`：这是你想要应用的配置文件

    - `-f`表示文件
    - `xxx.yaml`是文件的路径

    <!--如果配置文件中的Pod定义与当前运行的Pod有所不同，Kubernetes会尝试更新Pod以匹配配置文件，这可能会导致Pod重启，但这取决于具体的更改内容和Kubernetes的更新策略-->

- 获取pod运行状态信息

  ```bash
  kubectl get pod
  # or
  kubectl get pod <pod-name>
  ```

- 查看某个pod的详细状态信息

  ```shell
   kubectl describe pod <pod-name> 
  ```

- 进入某个pod中的某个容器

  ```bash
  kubectl exec -it <container-name> /bin/sh -c web
  ```

  - `kubectl exec`：这是kubectl的一个子命令，用于在Pod中执行命令
  - `-it`：这是两个参数的组合
    - `-i`表示**交互式**，意味着命令将与你的终端交互
    - `-t`表示**tty**，它会为命令分配一个伪终端，使得你可以像在本地一样使用终端
  - `<container-name>`：这是你想要在其中执行命令的Pod的名称
  - `/bin/sh`：这是你想要在Pod中运行的命令。在这个例子中，你正在启动一个shell
  - `-c web`：这是传递给`/bin/sh`的参数，表示你想要运行的容器的名称是`web`

- 重启pod某个容器中的nginx

  ```bash
  kubectl exec -it <pod-name> -c <container-name> -- nginx -s reload
  ```

  - `<pod-name>` 想要重启Nginx的Pod的名称

  - `<container-name>` 是运行Nginx的容器的名称

  - `nginx -s reload` 是在容器中执行的命令，用于重启Nginx

- 退出容器

  - 输入`exit`命令
  - 按下`Ctrl+D`
#### yaml文件

- guandata-web-controller.yaml

  - initContainers：插件容器的处理

    ```yaml
    # 单个配置
    initContainers:
      - name: plugin # 场景应用名称
        image: registry.cn-hangzhou.aliyuncs.com/guandata/plugin:0.0.1 # 场景应用镜像
        command: ["/bin/sh","-c","appId=`cat /tmp/app/id`; mkdir -p /app/${appId}; mv /tmp/app/build/app-manifest.json /app/${appId}.json; cp -r /tmp/app/build/* /app/${appId}/"]
        volumeMounts:
          - name: shared-apps
            mountPath: /app
    ```

    - `image`：插件的镜像

    - `command`：脚本命令

      - `/bin/sh -c`：运行shell命令

        - `/bin/sh`是shell的路径
        - `-c`选项允许你在命令行中直接输入要执行的命令

      - appId=`cat /tmp/app/id`：从文件`/tmp/app/id`中读取内容，并将这个内容赋值给变量`appId`

        - 文件`/tmp/app/id`是容器中的文件，在构建**Docker**镜像时创建的

          ```dockerfile
          # dockerfile 文件
          FROM registry.cn-hangzhou.aliyuncs.com/guandata/plugin-app-base:0.0.1
          
          COPY ./build /tmp/app/build
          
          # 把 appId 通过文件形式保存下来，在共享的时候可以读取
          RUN echo `cat /tmp/app/build/app-manifest.json | jq --raw-output .id` > /tmp/app/id
          ```

      - `mkdir -p /app/${appId}`：这个命令创建一个新的目录，路径为`/app/${appId}`

        - `${appId}`是变量`appId`的值
        - `-p`选项会确保如果父目录不存在，会先创建父目录。

      - `mv /tmp/app/build/app-manifest.json /app/${appId}.json`：将文件`/tmp/app/build/app-manifest.json`移动到新的位置，并重命名为`/app/${appId}.json`

      - `cp -r /tmp/app/build/* /app/${appId}/`：将`/tmp/app/build/`目录下的所有文件和目录复制到`/app/${appId}/`目录

        - `-r`选项表示递归复制，可以复制目录及其子目录下的所有文件。

    - `volumeMounts`：容器挂载存储卷的配置 <!--存储卷是用于容器数据持久化和共享的，存储卷中的内容不会随着容器重启而丢失-->

      - `name`: 这是卷的名称， Pod 中的定义的卷，真实的存储目录，是宿主机的存储位置
      - `mountPath`: 存储卷在容器内的挂载路径

      <!--在 plugin 容器中，存储卷 shared-apps 被挂载到了 /app 目录下；容器读写 /app 目录下的文件，实际上是在读写存储卷 shared-apps 中的文件，写进去的文件其他容器可以访问到-->

  - containers: 主工程镜像的处理

    ```yaml
    containers:
      - name: web
        image: registry.cn-hangzhou.aliyuncs.com/guandata/guandata-web:2.8.3
        command: ["/bin/sh","-c"]
        # 新增复制场景应用资源逻辑
        args:
          - "rm -f /etc/localtime; ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime; mkdir -p /guandata-web;mkdir -p /tmp/logs; cp -r /tmp/guandata-web/assets /guandata-web; rm -rf /tmp/guandata-web/conf/apps; mkdir -p /tmp/guandata-web/conf/apps; mkdir -p /tmp/guandata-web/assets/build-app; cp /apps/*.json /tmp/guandata-web/conf/apps/; cp -r /apps/* /tmp/guandata-web/assets/build-app/; cd /tmp/guandata-web/; node server.js"
        volumeMounts:
          - mountPath: /tmp/conf/
            name: config
          - mountPath: /guandata-web/
            name: guandata-web
          # 新增容器共享路径
          - mountPath: /apps
            name: shared-apps
    ```

    - `args`:脚本命令的参数

      - `rm -f /etc/localtime`：删除`/etc/localtime`文件

        - `-f`选项表示强制删除

      - `ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime`：创建一个指向`/usr/share/zoneinfo/Asia/Shanghai`的符号链接`/etc/localtime`，这实际上是将系统的时区设置为上海。

      - `mkdir -p /guandata-web; mkdir -p /tmp/logs`：创建两个目录`/guandata-web`和`/tmp/logs`

        - `-p`选项会确保如果父目录不存在，会先创建父目录

      - `cp -r /tmp/guandata-web/assets /guandata-web`：将`/tmp/guandata-web/assets`目录复制到`/guandata-web`目录

      - `rm -rf /tmp/guandata-web/conf/apps`：删除`/tmp/guandata-web/conf/apps`目录及其下所有文件，`-rf`选项表示递归删除并且强制删除

      - `mkdir -p /tmp/guandata-web/conf/apps; mkdir -p /tmp/guandata-web/assets/build-app`：创建两个目录`/tmp/guandata-web/conf/apps`和`/tmp/guandata-web/assets/build-app`

      - `cp /apps/*.json /tmp/guandata-web/conf/apps/`：将`/apps/`目录下的所有`.json`文件复制到`/tmp/guandata-web/conf/apps/`目录

      - `cp -r /apps/* /tmp/guandata-web/assets/build-app/`：将`/apps/`目录下的所有文件和目录复制到`/tmp/guandata-web/assets/build-app/`目录

        <!--这里的/apps是存储卷shared-apps的挂载路径，所以这里就是将插件容器复制进去的文件，再复制出去-->

      - `cd /tmp/guandata-web/`：切换当前工作目录到`/tmp/guandata-web/`

        <!-- /guandata-web/ 也是一个存储卷-->

      - `node server.js`：使用Node.js运行`server.js`文件

  