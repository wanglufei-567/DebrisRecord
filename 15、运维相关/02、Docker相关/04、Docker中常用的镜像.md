## Docker笔记（三）Docker中常用的镜像

### 一、Nginx

Nginx是一款高性能、轻量级的开源**Web服务器**和**反向代理服务器**，以其出色的性能、模块化架构和灵活的配置而著名，适用于提供静态文件、负载均衡、缓存以及安全的SSL/TLS加密等多种Web服务和代理需求

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/image-20230914090352281.png" alt="image-20230914090352281" style="zoom:50%;" />

- **运行nginx镜像并指定要托管的静态文件目录：**

  ```bash
docker run --name some-nginx -v /some/content:/usr/share/nginx/html:ro -d nginx
  ```
  
  - `-v /some/content:/usr/share/nginx/html:ro`：这是一个用于挂载卷（**Volume**）的选项，它允许==将本地文件或目录与容器内的目录进行关联==

    具体来说：

    - `/some/content` 是本地主机上的一个目录路径，这个目录的内容将会与容器内的某个路径关联
  
    - `:/usr/share/nginx/html` 指定容器内的目标路径，==这里是Nginx默认的静态文件目录==，用于存放网页内容
  
    - `:ro` 是一个可选项，表示将卷挂载为只读（read-only）模式，即容器可以读取这些文件，但不能写入或修改它们
  
      <!-- :rw是读写权限 :ro是只读权限 -->
  
- **配置文件的操作**

  - 复制容器中的配置文件到本地

    ```bash
    docker run --name tmp-nginx-container -d nginx
    docker cp tmp-nginx-container:/etc/nginx/nginx.conf /host/path/nginx.conf
    docker rm -f tmp-nginx-container
    ```

    - `tmp-nginx-container:/etc/nginx/nginx.conf`：容器中存放配置文件的目录
    - `/host/path/nginx.conf`：本地存放配置文件的目录

  - 指定本地主机的文件作为配置文件

    ```bash
    docker run --name my-custom-nginx-container \
     -v /host/path/nginx.conf:/etc/nginx/nginx.conf:ro \
     -d nginx
    ```







> 多个文件进行关联
>
> ```
> docker run --name wd-nginx-usage \
>  -p 8088:80 \
>  -e PREFIX=WD \
>  -v /Users/guandata/temporary/nginx-files/config/nginx.conf:/etc/nginx/nginx.conf:rw \
>  -v /Users/guandata/temporary/nginx-files/nginx-assets:/usr/share/nginx/html:rw \
>  -d nginx
> ```