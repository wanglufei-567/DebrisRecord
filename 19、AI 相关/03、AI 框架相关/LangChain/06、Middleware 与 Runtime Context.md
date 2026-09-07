## **Middleware 与 Runtime Context**

`createAgent()` 已经提供默认 **Agent Loop**，但应用仍然需要在模型调用和工具执行周围加入日志、权限、错误处理与资源限制

**Middleware** 是这些横切控制逻辑的扩展接口，**Runtime Context** 是每次调用传入的只读依赖与配置

```text
Messages + Runtime Context
  -> Middleware
  -> Model
  -> Middleware
  -> Tool
  -> Middleware
  -> Agent State
```

> ==**Middleware 控制怎样执行，Runtime Context 提供本次执行依据，二者都不是模型本身**==

### 一、**Middleware** 是什么

如果不使用 **Middleware**，日志、权限和错误处理很容易散落在每个 **Tool** 或业务入口中

**Middleware** 把这些逻辑放在 **Agent Loop** 的稳定边界上：

| 控制点 | 调用时机 | 常见用途 |
|---|---|---|
| `beforeAgent` | 每次 `agent.invoke()` 开始时执行一次 | 校验调用、初始化状态 |
| `beforeModel` | 每次调用模型前执行 | 检查消息、更新状态 |
| `afterModel` | 每次模型响应后执行 | 检查 **Tool Call**、记录结果 |
| `afterAgent` | 本次 **Agent Run** 正常结束后执行一次 | 汇总指标、清理资源 |
| `wrapModelCall` | 包裹每一次模型调用 | 计时、重试、缓存、模型切换 |
| `wrapToolCall` | 包裹每一次 **Tool** 调用 | 权限、计时、错误转换、结果处理 |

前四个属于节点式 **Hook**，在固定时间点执行

后两个属于包装式 **Hook**，通过是否调用 `handler(request)` 决定继续执行、短路或重试

### 二、`createMiddleware()`

#### 2.1、基本语法

```ts
import { createMiddleware } from "langchain";

const loggingMiddleware = createMiddleware({
  name: "LoggingMiddleware",
  beforeModel: (state) => {
    console.log(`messages: ${state.messages.length}`);
  },
  wrapToolCall: async (request, handler) => {
    console.log(`tool: ${request.toolCall.name}`);
    return handler(request);
  },
});
```

再交给 `createAgent()`：

```ts
const agent = createAgent({
  model,
  tools,
  middleware: [loggingMiddleware],
});
```

#### 2.2、主要输入与输出

节点式 **Hook** 通常接收：

```ts
(state, runtime) => void | Partial<State>
```

- `state` 是当前 **Agent State**，通常包含 `messages`
- `runtime` 提供当前调用的 `context`、取消信号、存储和流式写入器等运行信息
- 返回 `void` 表示不更新状态
- 返回部分状态表示交给 **State Reducer** 合并

包装式 **Hook** 通常接收：

```ts
(request, handler) => Result
```

- `request` 包含本次模型或 **Tool** 调用信息以及 `runtime`
- `handler(request)` 执行下一层 **Middleware** 或真正的模型、**Tool**
- 不调用 `handler` 就能短路本次执行
- 多次调用 `handler` 可以实现重试，但必须有明确上限

多个包装式 **Middleware** 按数组顺序嵌套，第一个是最外层

### 三、**Runtime Context**

#### 3.1、定义调用契约

```ts
import { z } from "zod";

const contextSchema = z.object({
  requestId: z.string(),
  userRole: z.enum(["member", "guest"]),
  allowedCollections: z.array(z.string()),
});

const agent = createAgent({
  model,
  tools,
  contextSchema,
});
```

`contextSchema` 负责定义和校验本次调用需要的上下文字段

调用时通过第二个参数传入：

```ts
const result = await agent.invoke(
  { messages },
  {
    context: {
      requestId: "request-123",
      userRole: "member",
      allowedCollections: ["technical-notes"],
    },
  },
);
```

必填字段缺失时，**TypeScript** 会在静态检查中提示；即使绕过类型检查，运行时仍会经过 **Schema** 校验

#### 3.2、在 **Middleware** 中读取

```ts
const policyMiddleware = createMiddleware({
  name: "PolicyMiddleware",
  contextSchema,
  wrapToolCall: async (request, handler) => {
    const { userRole } = request.runtime.context;

    if (userRole !== "member") {
      throw new Error("policy_denied");
    }

    return handler(request);
  },
});
```

策略判断发生在真正执行 **Tool** 之前，因此模型生成了合法参数也不代表调用一定会被允许

#### 3.3、在 **Tool** 中读取

```ts
import type { ToolRuntime } from "@langchain/core/tools";

const searchDocs = tool(
  async (
    { query },
    runtime: ToolRuntime<unknown, z.infer<typeof contextSchema>>,
  ) => {
    const allowedCollections = runtime.context.allowedCollections;
    return search(query, allowedCollections);
  },
  {
    name: "search_docs",
    description: "在允许的资料集中搜索",
    schema: z.object({ query: z.string() }),
  },
);
```

`ToolRuntime` 还可以提供当前 **State**、`toolCallId`、取消信号、持久存储与流式写入器

### 四、**Context**、**Messages** 与 **State**

| 对象 | 主要内容 | 模型是否自动看到 | 是否跨调用持久化 |
|---|---|---|---|
| **Messages** | 用户输入、模型响应、**Tool Message** | 是 | 只有应用再次传入或接入 **Checkpointer** 才能延续 |
| **Runtime Context** | 请求标识、角色、租户、依赖和本次策略配置 | 否 | 否，每次调用重新传入 |
| **Agent State** | 当前运行中的消息和自定义状态字段 | 取决于是否进入模型请求 | 接入 **Checkpointer** 后可以持久化 |

> ==**Runtime Context 不会自动写入消息，但也不是保密容器；一旦 Middleware 注入 Prompt，或 Tool 把字段写入结果，模型仍然能够看到**==

适合放入 **Runtime Context** 的是本次调用所需的依赖和策略输入，不应把原始密码或长期密钥直接注入模型链路

### 五、工具错误处理

`toolErrorMiddleware()` 可以把 **Tool** 抛出的可恢复异常转换为错误 `ToolMessage`：

```ts
import { toolErrorMiddleware } from "langchain";

const toolErrors = toolErrorMiddleware({
  onError: (_error, request) =>
    `Tool ${request.toolCall.name} 执行失败，请修正参数`,
});
```

转换后的结果会回填给模型，模型可以修改参数或选择其他路径

错误消息不应直接包含异常堆栈、数据库信息、内部路径或凭据

不可恢复的权限拒绝不宜转换为普通结果，否则模型可能继续尝试；更稳妥的做法是在策略 **Middleware** 中直接终止本次 **Agent Run**

### 六、工具调用限制

`toolCallLimitMiddleware()` 用于限制一次运行或整个 **Thread** 的工具调用数：

```ts
import { toolCallLimitMiddleware } from "langchain";

const toolLimit = toolCallLimitMiddleware({
  runLimit: 4,
  exitBehavior: "error",
});
```

主要参数：

| 参数 | 作用 |
|---|---|
| `toolName` | 只限制指定 **Tool**，省略时限制全部工具 |
| `runLimit` | 限制单次 `agent.invoke()` 中的调用数 |
| `threadLimit` | 限制同一 **Thread** 的累计调用数，需要 **Checkpointer** 保存状态 |
| `exitBehavior` | 超限后继续回填错误、立即抛错或直接结束 |

`runLimit` 统计的是 **Tool Call** 数量，不是模型调用次数，也不是图节点步数

结构化结果使用 **Tool Strategy** 时，最终结果 **Tool** 也可能占用调用额度，因此额度设计必须以真实消息轨迹为准

### 七、最小组合示例

```ts
const agent = createAgent({
  model,
  tools: [searchDocs],
  contextSchema,
  middleware: [
    loggingMiddleware,
    policyMiddleware,
    toolErrorMiddleware({
      onError: () => "tool_error: 工具执行失败",
    }),
    toolCallLimitMiddleware({
      runLimit: 4,
      exitBehavior: "error",
    }),
  ],
});

const result = await agent.invoke(
  { messages: [{ role: "user", content: "搜索 Tool Calling" }] },
  {
    context: {
      requestId: "request-123",
      userRole: "member",
      allowedCollections: ["technical-notes"],
    },
  },
);
```

控制流变为：

```text
应用传入 Messages 与 Runtime Context
  -> Middleware 校验并记录模型调用
  -> Model 生成 Tool Call
  -> Policy Middleware 决定是否允许
  -> Tool Error Middleware 处理可恢复异常
  -> Tool 执行并返回 ToolMessage
  -> Tool Call Limit 防止失控循环
  -> Agent 继续或结束
```

### 八、能力边界

- **Middleware** 是进程内扩展点，不自动形成身份认证、租户隔离或审计系统
- `contextSchema` 证明数据形状合法，不证明角色和权限来源可信
- 权限判断必须来自应用已经认证的身份，不能相信模型自行生成的角色字段
- **Tool Call Limit** 只能限制调用数量，不能判断结果是否正确或任务是否完成
- 日志只能提升可观测性，不能替代业务验收与安全审计

### 九、核心结论

- `createMiddleware()` 用稳定 **Hook** 扩展默认 **Agent Loop**，无需重写循环
- **Runtime Context** 是单次调用的只读依赖与策略输入，不是对话历史或持久状态
- `wrapToolCall` 是工具权限、错误和计时的关键控制点
- 可恢复工具错误可以转换为 `ToolMessage`，权限拒绝应直接终止
- 调用上限、超时和递归限制分别控制不同资源边界，不能相互替代

### 十、复习问题

- **Hook** 与 **Middleware** 是什么关系，为什么不能完全视为同一个概念
- 节点式 **Hook** 与包装式 **Hook** 的执行方式有什么区别
- 为什么 `wrapModelCall` 和 `wrapToolCall` 可以理解为洋葱模型
- **Middleware** 更接近责任链、装饰器和横切关注点，还是依赖倒置，分别描述了什么
- **Runtime Context** 中哪些信息由框架提供，哪些信息由应用传入
- **Runtime Context**、**Messages** 与 **Agent State** 在可见性和生命周期上有什么区别
- 为什么 **Runtime Context** 默认不进入模型消息，却仍然不能被当作绝对保密容器
- 为什么可恢复的 **Tool** 错误适合转换为 `ToolMessage`，权限拒绝却通常应该终止运行
- `runLimit`、`recursionLimit` 与超时分别限制什么
- 多个包装式 **Middleware** 组合时，执行顺序为什么会影响权限、重试和错误处理

### 十一、参考资料

- **[LangChain JavaScript Custom Middleware](https://docs.langchain.com/oss/javascript/langchain/middleware/custom)**
- **[LangChain JavaScript Runtime](https://docs.langchain.com/oss/javascript/langchain/runtime)**
- **[LangChain JavaScript Built-in Middleware](https://docs.langchain.com/oss/javascript/langchain/middleware/built-in)**

### 十二、复习参考答案

#### 1. **Hook** 与 **Middleware** 的关系

- **Hook** 是执行流程中的具体介入点，例如 `beforeModel` 或 `wrapToolCall`
- **Middleware** 是利用一个或多个 **Hook** 实现日志、权限、错误处理等横切能力的组件

前者描述“在哪里介入”，后者描述“用这些介入点封装什么能力”，因此不能完全视为同一个概念

#### 2. 节点式与包装式 **Hook**

- 节点式 **Hook**
  - 在 `beforeAgent`、`beforeModel`、`afterModel` 等固定时间点执行
  - 通常读取 **State**，并选择是否返回部分状态更新

- 包装式 **Hook**
  - 包裹一次模型或工具调用
  - 通过是否调用、何时调用以及调用几次 `handler(request)`，实现继续、短路、替换或有限重试

#### 3. 为什么包装式 **Hook** 是洋葱模型

多个包装式 **Middleware** 会按数组顺序逐层进入，调用 `handler(request)` 才会进入下一层或真正的模型、工具；调用完成后，结果再按相反方向逐层返回

因此每一层都能在调用前和调用后执行逻辑，形成典型的“外层进入、内层执行、反向退出”结构

#### 4. 几种传统设计概念分别描述什么

- 责任链
  - 描述请求如何依次经过多个 **Middleware**，每层可以继续传递或终止

- 装饰器
  - 描述 `wrapModelCall`、`wrapToolCall` 如何在不改写目标实现的情况下增加前后逻辑

- 横切关注点
  - 描述日志、权限、计时和错误处理为何适合从业务 **Tool** 中抽离

- 依赖倒置或依赖注入
  - 描述应用如何通过 **Runtime Context** 向下层提供策略和依赖，不是 **Middleware** 执行顺序本身

所以 **Middleware** 的运行机制更接近责任链和装饰器，解决的是横切关注点；依赖倒置描述的是另一条依赖组织关系

#### 5. **Runtime Context** 信息来自哪里

- 应用传入
  - `requestId`、已认证角色、租户、允许的数据集以及本轮策略配置等 `context` 字段

- 框架提供
  - 当前 **State**、`toolCallId`、取消信号、存储接口和流式写入器等运行设施

`contextSchema` 只能校验应用传入数据的形状，不能证明角色和权限来源可信

#### 6. **Runtime Context**、**Messages** 与 **Agent State**

- **Messages** 是会进入模型上下文的消息序列，默认只属于当前调用，除非应用再次传入或由 **Checkpointer** 保存

- **Runtime Context** 是应用为本次调用提供的只读依赖和策略输入，默认不进入模型，也不会自动跨调用恢复

- **Agent State** 是运行中持续更新的数据集合，包含 **Messages** 和自定义状态字段，接入 **Checkpointer** 后可以持久化

#### 7. **Runtime Context** 为什么不是保密容器

**Runtime Context** 只是不自动进入模型消息，并不阻止 **Middleware** 把它注入 **Prompt**，也不阻止 **Tool** 把相关字段写入返回值、日志或事件

因此不应把原始密码和长期密钥直接放入这条运行链路

#### 8. 可恢复错误与权限拒绝的处理差异

可恢复的 **Tool** 错误可以转换为 `ToolMessage`，让模型根据失败原因修正参数或选择其他工具

权限拒绝代表当前动作不被允许，不应交给模型协商或反复尝试，通常应直接终止本次 **Agent Run**

#### 9. 三种资源限制分别控制什么

- `runLimit`：限制单次 `agent.invoke()` 中的 **Tool Call** 数量

- `recursionLimit`：限制 **Agent Graph** 的运行步骤数

- 超时：限制模型、工具或整个运行可以占用的时间

三者控制的资源维度不同，不能相互替代

#### 10. 包装式 **Middleware** 的顺序为什么重要

多个包装式 **Middleware** 会相互嵌套，数组靠前的组件位于更外层，因此顺序会决定谁先检查请求、谁能看到异常、日志记录一次还是每次重试都记录，以及重试是否重新经过权限判断

权限、重试、错误转换和日志的先后关系不同，最终执行语义也会不同
