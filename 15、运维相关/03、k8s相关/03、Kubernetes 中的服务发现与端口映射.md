## **Kubernetes** 中的服务发现与端口映射

### 一、前言

**「服务发现」**和**「端口映射」**是网络和分布式系统中的常见的技术：

- **服务发现**
  - 在微服务架构中，服务发现是一种机制，用于自动检测网络中的设备和服务

  - 这种机制允许设备和服务在没有手动配置的情况下找到彼此，从而简化了网络的配置和管理

- **端口映射**
  - 端口映射（也称为端口转发）是一种网络地址转换技术
  - 它允许外部网络（如互联网）通过特定的端口访问内部网络中的特定设备或服务
  - 这种技术常用于路由器和防火墙，以允许内部网络中的服务可以被外部网络访问


在 **Kubernetes** 中，**「服务发现」** 和 **「端口映射」**是其核心功能，用于支持在集群内部的服务间进行通信

### 二、服务发现

在 **Kubernetes** 中，每个 **Pod** 在启动时都会被分配一个独立的 **IP** 地址，这个 **IP** 地址是 **Pod** 的网络标识，用于在集群内部进行通信

这种设计使得每个 **Pod** 都可以像一个独立的主机一样运行，大大提高了 **Kubernetes** 的灵活性和可扩展性

- **Pod** 的生命周期通常较短，它可能会因为各种原因（如节点故障、资源调度、更新部署等）被重启或重新调度
  - **Pod** 的 **IP** 地址是在创建时动态分配的，而不是固定不变的
  - 这种 **IP** 地址的不稳定性可能会给服务间的通信带来问题

- **Kubernetes** 提供了 **Service** 机制来解决这个问题
  - **Service** 是一种抽象，它提供了一个稳定的虚拟 **IP** 地址和端口，用作访问一组具有相同标签的 **Pod** 的入口
    - 具有相同标签的 **Pod** 通常也应该提供相同的功能
  - 这个虚拟 **IP** 地址（也称为 **ClusterIP**）是稳定不变的，即使后端的 **Pod** 重启或重新调度，**Service** 的 **IP** 地址和端口都不会改变
  - 这样，其他服务就可以通过 **Service** 的 **IP** 地址和端口稳定地访问后端的 **Pod**，而无需关心 **Pod** 的 **IP** 地址是否发生变化

#### 2.1 **Service** 的作用

- 提供稳定的虚拟 **IP**（**ClusterIP**）和端口
- 自动关联符合条件（**label** **selector**）的多个 **Pod**
- 通过负载均衡策略，将流量分发到后端 **Pod**

#### 2.2 请求路径概览

当客户端发起请求，完整的访问链路如下：

```
客户端 Pod → Service 虚拟 IP + 端口 → kube-proxy → 实际后端 Pod
```

#### 2.3 **Service** **IP** 的性质

**Service** 的 **IP** 地址不是宿主机的 **IP**，而是一个仅在集群内部可达的虚拟 **IP**（**ClusterIP**）

这个 **IP** 是由 **Kubernetes** 网络插件从集群内部的一个预定义网段中动态分配的，专用于 **Pod** 和 **Service** 之间的通信

客户端 **Pod** 无需关心后端 **Pod** 的具体 **IP**，只需请求 **Service** 的虚拟 **IP** + **port**，**kube-proxy** 会完成目标 **Pod** 的选择与转发

#### 2.4 **kube-proxy** 的角色

**kube-proxy** 运行在每个节点上，它维护 **Service** 的虚拟 **IP** 和实际 **Pod** 的映射关系，负责将到达 **Service** **IP** 的流量转发到正确的 **Pod** 实例

**Kubernetes** 支持多种 **kube-proxy** 模式（如 **iptables**、**IPVS**），核心作用是维持这一转发关系

### 三、端口映射机制

在 **Kubernetes** 中，通常不需要显式地将容器端口映射到宿主机

只需在 **Service** 中定义 `port` 和 `targetPort`：

- `port`：**Service** 对外暴露的端口；
- `targetPort`：**Pod** 内部容器监听的端口。

**Kubernetes** 会通过 **kube-proxy** 将外部访问的请求，自动转发到匹配 **Pod** 的对应端口上

**示例：**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: my-app
  ports:
    - port: 80         # 访问 Service 的端口
      targetPort: 8080 # 容器内部监听的端口
```

如果匹配到以下 **Pod**：

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: my-app
spec:
  containers:
    - name: app
      image: app:latest
      ports:
        - containerPort: 8080
```

则请求 `Service:80` 会被转发到后端所有 `8080` 的容器端口上，通常以轮询方式负载均衡。

### 四、外部访问 **Service** 的方式

若需从宿主机或集群外访问服务，有两种常见 **Service** 类型：

#### 4.1 **NodePort**

- 在每个节点上开放一个高位端口（默认 30000–32767）；
- 通过 `<任意节点IP>:<NodePort>` 可访问服务；

示例：

```yaml
type: NodePort
ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080
```

#### 4.2 **LoadBalancer**

- 依赖云厂商负载均衡服务；
- 为 **Service** 自动分配一个公网 **IP**；
- 更适用于生产环境的外部访问。

### 五、**Service** 的端口映射限制与设计原则

#### 5.1 一个 **Service** 可以有多个端口

**Service** 支持定义多个 `port` → `targetPort` 对的映射：

```yaml
ports:
  - name: http
    port: 80
    targetPort: 8080
  - name: metrics
    port: 9110
    targetPort: 9110
```

但注意：这些端口必须映射到同一组 **Pod** 的内部端口，**Service** 不能根据不同端口将请求路由到不同 **Pod**

#### 5.2 一个 **Service** 只能绑定一组标签匹配的 **Pod**

**Service** 的 `selector` 是一组 `key=value` 形式的标签匹配规则，不能同时匹配多组标签不同的 **Pod**

例如，以下写法**不被支持**：

```yaml
# 错误用法：希望一个 Service 匹配 app=a 和 app=b 的 Pod
selector:
  app: [a, b]  ❌ 不支持
```

**正确做法：**

为不同的后端功能分别创建独立的 **Service**：

```yaml
# Service A
selector:
  app: a

# Service B
selector:
  app: b
```

> 每个 **Service** 应只对应一组功能一致的 **Pod**，避免混用

### 六、设计建议与最佳实践

- 所有挂载在同一个 **Service** 下的 **Pod**，必须提供语义一致的服务（例如 **API** 接口一致、行为一致）；
- 不要试图通过多个端口在同一个 **Service** 中混合暴露不同服务逻辑；
- 若需聚合多个后端服务，请在上层使用 **Ingress**、**API** **Gateway**、或 **Service** **Mesh** 等统一管理；
- 使用明确、可控的标签命名体系，确保 **Service** 的 **selector** 精确有效。

### 总结

**Kubernetes** 通过 **Service** + **kube-proxy** 的组合实现了高效、稳定的服务发现与端口转发机制

理解 **Service** 的核心职责和使用边界，对于构建稳定的微服务架构至关重要

正确划分 **Service**、清晰维护标签体系、合理设计端口映射，是保障系统可维护性和可扩展性的基础