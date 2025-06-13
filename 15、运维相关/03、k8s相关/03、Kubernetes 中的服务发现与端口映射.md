## **Kubernetes** 中的服务发现与端口映射

在微服务架构中，服务发现和端口映射是确保服务通信稳定、高效的基础能力。**Kubernetes** 提供了原生机制来支持这两个能力，本文将对其实现原理进行系统梳理。

### 一、服务发现

在 **Kubernetes** 中，每个 **Pod** 启动时都会分配一个独立的 **IP** 地址，但 **Pod** 生命周期较短，重启或重新调度后 **IP** 可能发生变化。为了屏蔽 **Pod** **IP** 的不稳定性，**Kubernetes** 提供了 **Service** 机制，作为访问一组 **Pod** 的稳定入口。

#### 1.1 **Service** 的作用

- 提供稳定的虚拟 **IP**（**ClusterIP**）和端口；
- 自动关联符合条件（**label** **selector**）的多个 **Pod**；
- 通过负载均衡策略，将流量分发到后端 **Pod**。

#### 1.2 请求路径概览

当客户端发起请求，完整的访问链路如下：

```
客户端 Pod → Service 虚拟 IP + 端口 → kube-proxy → 实际后端 Pod
```

#### 1.3 **kube-proxy** 的角色

**kube-proxy** 运行在每个节点上，它维护 **Service** 的虚拟 **IP** 和实际 **Pod** 的映射关系，负责将到达 **Service** **IP** 的流量转发到正确的 **Pod** 实例。**Kubernetes** 支持多种 **kube-proxy** 模式（如 **iptables**、**IPVS**），核心作用是维持这一转发关系。

### 二、端口映射机制

在 **Kubernetes** 中，通常不需要显式地将容器端口映射到宿主机。只需在 **Service** 中定义 `port` 和 `targetPort`：

- `port`：**Service** 对外暴露的端口；
- `targetPort`：**Pod** 内部容器监听的端口。

**Kubernetes** 会通过 **kube-proxy** 将外部访问的请求，自动转发到匹配 **Pod** 的对应端口上。

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

### 三、**Service** **IP** 的性质

**Service** 的 **IP** 地址不是宿主机的 **IP**，而是一个仅在集群内部可达的虚拟 **IP**（**ClusterIP**）。这个 **IP** 是由 **Kubernetes** 网络插件从集群内部的一个预定义网段中动态分配的，专用于 **Pod** 和 **Service** 之间的通信。

客户端 **Pod** 无需关心后端 **Pod** 的具体 **IP**，只需请求 **Service** 的虚拟 **IP** + **port**，**kube-proxy** 会完成目标 **Pod** 的选择与转发。

### 四、外部访问 **Service** 的方式

若需从宿主机或集群外访问服务，有两种常见 **Service** 类型：

#### 4.1 **NodePort**

- 在每个节点上开放一个高位端口（默认 30000–32767）；
- 通过 `<任意节点IP>:<NodePort>` 可访问服务；
- 示例：

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

**Kubernetes** 通过 **Service** + **kube-proxy** 的组合实现了高效、稳定的服务发现与端口转发机制。理解 **Service** 的核心职责和使用边界，对于构建稳定的微服务架构至关重要。正确划分 **Service**、清晰维护标签体系、合理设计端口映射，是保障系统可维护性和可扩展性的基础。