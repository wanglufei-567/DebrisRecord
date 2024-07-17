## k8s常用命令

### 一、Pod相关

- **获取 Pod 运行状态信息**

  ```bash
  kubectl get pod
  # or
  kubectl get pod <pod-name>
  ```

- **查看某个 Pod 的详细状态信息**

  ```shell
   kubectl describe pod <pod-name> 
  ```

- **重启 pod**

  ```bash
  kubectl delete pod <pod-name> 
  ```

- **查看某个 Pod 的配置信息**

  ```bash
  kubectl get pod <pod-name> -o yaml
  # -o yaml 以 YAML 格式输出 Pod 的配置信息
  # -o json 以 JSON 格式输出 Pod 的配置信息
  ```

### 二、容器相关

- **进入某个 Pod 中的某个容器**

  ```bash
  kubectl exec -it <container-name> /bin/sh -c web
  ```

  - `kubectl exec`：这是 `kubectl` 的一个子命令，用于在 **Pod** 中执行命令

  - `-it`：这是两个参数的组合
    - `-i`表示**交互式**，意味着命令将与终端交互
    - `-t`表示**tty**，它会为命令分配一个伪终端，可以像在本地一样使用终端
    
  - `<container-name>`：这是要在其中执行命令的 **Pod** 名称

  - `/bin/sh`：要在 **Pod** 中运行的命令
    - 在这个例子中，表示正在启动一个 **shell**
    
  - `-c web`：这是传递给`/bin/sh`的参数，表示想要运行的容器的名称是 `web`

    <!--可以运行 kubectl describe pod <pod-name> 查看当前 pod 有哪些容器-->

- **退出容器**

  - 输入`exit`命令
  - 按下`Ctrl+D`

- **替换容器中的镜像**

  ```bash
  kubectl set image deployment/<deployment-name> <container-name>=<new-image>
  
  # eg.
  # kubectl set image deployment/guandata-web-deployment web=registry.cn-hangzhou.aliyuncs.com/guandata/guandata-web:xxx
  ```

  - `kubectl set image`：这是 `kubectl` 的一个子命令，用于更新资源的镜像

  - `deployment/<deployment-name>`：这是你想要更新镜像的部署的名称

    - `deployment/`前缀表示这是一个部署资源

      > 在 **Kubernetes** 中，**Deployment** 是一种资源对象，它描述了应用程序的运行方式（如使用哪个 **Docker** 镜像，端口号是多少等），以及如何更新和扩展应用程序
      >
      > **Deployment** 会管理 **Pod** 的生命周期，包括创建 **Pod**，更新 **Pod** 的镜像，扩展 **Pod** 的数量，以及在 **Pod** 出现故障时重新创建 **Pod**
      >
      > 如果想查看当前有哪些 **Deployment**，可以使用以下的`kubectl`命令
      >
      > ```bash
      > kubectl get deployments
      > ```

  - `<container-name>=<new-image>`：要设置的新镜像

    - `<container-name>`是容器的名称
    - `<new-image>`是新镜像的地址和标签

- 重启 **Pod** 某个容器中的 **Nginx**

  ```bash
  kubectl exec -it <pod-name> -c <container-name> -- nginx -s reload
  ```

  - `<pod-name>` 想要重启 **Nginx**  的 **Pod** 的名称

  - `<container-name>` 是运行 **Nginx** 的容器的名称

  - `nginx -s reload` 是在容器中执行的命令，用于重启 **Nginx**
### 三、配置文件相关

- **应用配置文件**

  ```bash
  kubectl apply -f xxx.yaml
  ```

  - `kubectl apply`：这是 `kubectl` 的一个子命令，用于应用配置文件，这个命令会根据配置文件中的定义创建或更新资源

  - `-f xxx.yaml`：这是你想要应用的配置文件

    - `-f`表示文件
    - `xxx.yaml`是文件的路径

    <!--如果配置文件中的Pod定义与当前运行的Pod有所不同，Kubernetes会尝试更新Pod以匹配配置文件，这可能会导致Pod重启，但这取决于具体的更改内容和Kubernetes的更新策略-->
