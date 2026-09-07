## 条件路由、循环与 `Command`

> 适用版本：`@langchain/langgraph@1.4.13`、`zod@4.5.4`

前面的 **State** 与 **Reducer** 解决“数据如何更新”，条件路由、循环与 `Command` 解决“更新之后执行哪个 **Node**”

```text
Node 产生 State Update
  -> Graph Runtime 合并 State
  -> 固定 Edge、Router 或 Command 决定下一节点
  -> Runtime 调度目标 Node
  -> 到达 END 或没有待执行节点时结束
```

> ==**State** 保存当前事实，**Edge** 与 **Command** 表达控制权如何转移，**Graph Runtime** 负责实际调度==

### 一、三种控制方式

#### 1.1、固定 **Edge**

固定 **Edge** 在构建图时已经确定下一节点：

```ts
graph.addEdge("draft", "finalize");
```

每次执行完 `draft`，**Runtime** 都会调度 `finalize`，不读取 **State** 判断方向

适合顺序始终不变的流程，例如参数标准化后必然进入校验

#### 1.2、条件 **Edge**

条件 **Edge** 在源 **Node** 执行并完成 **State Update** 后调用 **Router**：

```ts
graph.addConditionalEdges("draft", routeAfterDraft, [
  "review",
  "finalize",
]);
```

**Router** 读取更新后的 **State**，返回下一节点名称或 `END`

适合只需要选择路径、不需要在路由时额外更新 **State** 的场景

#### 1.3、Command

`Command` 由 **Node** 返回，把本次 **State Update** 与下一跳放在同一个结果中：

```ts
return new Command({
  update: {
    status: "revising",
    revisionCount: state.revisionCount + 1,
  },
  goto: "revise",
});
```

适合“先根据业务判断写入结果，再立即把控制权交给特定节点”的场景

三者不是能力等级关系，而是三种不同表达方式：

| 控制方式 | 下一步由什么决定 | 能否同时更新 **State** |
|---|---|---|
| 固定 **Edge** | 图构建时的静态连接 | 否 |
| 条件 **Edge** | 独立 **Router** 的返回值 | **Router** 本身不能更新 |
| `Command` | 当前 **Node** 返回的 `goto` | 可以通过 `update` 更新 |

### 二、`addConditionalEdges()`

#### 2.1、作用与语法

`addConditionalEdges()` 为某个源 **Node** 注册运行时路由函数：

```ts
graph.addConditionalEdges(source, router, pathMap);
```

#### 2.2、入参与返回值

| 参数 | 类型 | 说明 |
|---|---|---|
| `source` | **Node** 名称 | 哪个 **Node** 执行完成后调用 **Router** |
| `router` | `ConditionalEdgeRouter` | 读取当前 **State** 并返回路由结果 |
| `pathMap` | 数组或映射，可选 | 声明或转换允许到达的目标 |

`addConditionalEdges()` 返回当前 `StateGraph` **Builder**，可以继续链式调用

下面两种写法都可以表达二选一分支

**Router** 直接返回节点名：

```ts
const route = (state: typeof State.State) =>
  state.needsReview ? "review" : "finalize";

graph.addConditionalEdges("draft", route, ["review", "finalize"]);
```

使用路径映射：

```ts
const route = (state: typeof State.State) =>
  state.needsReview ? "needs_review" : "ready";

graph.addConditionalEdges("draft", route, {
  needs_review: "review",
  ready: "finalize",
});
```

路径映射可以让业务判断结果与节点名称解耦

#### 2.3、**Router** 的入参与出参

可以使用 `ConditionalEdgeRouter` 约束 **Router**：

```ts
import type { ConditionalEdgeRouter } from "@langchain/langgraph";

const route: ConditionalEdgeRouter<
  typeof State,
  Record<string, unknown>,
  "review" | "finalize"
> = (state) => (state.needsReview ? "review" : "finalize");
```

- 入参 `state`：源 **Node** 的更新已经合并后的完整 **State**
- 返回单个节点名：调度一个目标 **Node**
- 返回多个节点名：在下一个 **Super-step** 中并行调度多个节点
- 返回 `END`：结束当前图执行

**Router** 应保持为纯路由函数，不执行外部副作用，也不返回 **State Update**

### 三、分支的运行机制

```text
draft Node
  -> 返回 { needsReview: true }
  -> Runtime 先合并 State Update
  -> 调用 routeAfterDraft(updatedState)
  -> Router 返回 "review"
  -> Runtime 调度 review Node
```

没有被选择的分支不会执行，也不会产生该分支的 **State Update**

条件 **Edge** 不是让框架自动理解业务语义，判断条件仍由应用程序编写；后续即使判断结果来自 **LLM**，**Runtime** 也只是按返回的路由目标调度

### 四、循环

#### 4.1、循环如何形成

只要后续 **Edge** 再次指向已经执行过的 **Node**，图中就形成循环：

```ts
graph
  .addConditionalEdges("review", routeAfterReview, ["revise", END])
  .addEdge("revise", "review");
```

典型执行过程：

```text
review
  -> 未满足条件 -> revise
  -> 固定 Edge  -> review
  -> 已满足条件 -> END
```

**LangGraph** 不会因为节点曾经执行过就禁止再次调度，是否继续由当前路由结果决定

#### 4.2、业务终止条件

循环必须拥有可解释的业务终止条件：

```ts
const routeAfterReview = (state: typeof State.State) => {
  if (state.revisionCount >= 1) {
    return END;
  }

  return "revise";
};
```

业务终止条件表达“任务何时完成”，例如：

- 已得到最终回答
- 没有新的 **Tool Call**
- 校验结果已经通过
- 达到业务允许的最大修订次数

### 五、`Command`

#### 5.1、语法、入参与出参

```ts
const command = new Command({
  update,
  goto,
});
```

| 参数 | 类型 | 说明 |
|---|---|---|
| `update` | **State Update** 或键值对数组，可选 | 按现有字段规则合并进 **State** |
| `goto` | 节点名、节点名数组或 `Send`，可选 | 指定下一批调度目标 |
| `resume` | 任意值，可选 | 用于恢复 `interrupt()`，不在这里展开 |
| `graph` | 图名称，可选 | 指定命令发送到当前图或父图，不在这里展开 |

构造结果是 `Command` 对象，**Graph Runtime** 识别后先应用 `update`，再调度 `goto`

```ts
const review: GraphNode<
  typeof State,
  Record<string, unknown>,
  "revise" | "finalize"
> = (state) => {
  const ready = state.revisionCount >= 1;

  return new Command({
    update: {
      status: ready ? "approved" : "revising",
    },
    goto: ready ? "finalize" : "revise",
  });
};
```

#### 5.2、`ends` 声明

返回 `Command` 的 **Node** 应通过 `addNode()` 的 `ends` 声明可能到达的目标：

```ts
graph.addNode("review", review, {
  ends: ["revise", "finalize"],
});
```

`ends` 让图结构和类型系统知道这个 **Node** 的动态出口，便于图校验、类型检查和可视化

节点的 `GraphNode` 类型参数也应约束相同目标集合，避免任意字符串进入 `goto`

#### 5.3、`Command` 与静态 **Edge** 可以同时生效

`Command.goto` 增加动态目标，不会自动取消该 **Node** 已配置的普通 **Edge**

```ts
graph
  .addNode("review", review, { ends: ["revise"] })
  .addEdge("review", "audit");
```

如果 `review` 返回 `goto: "revise"`，`revise` 与静态 **Edge** 指向的 `audit` 都可能被调度

因此使用 `Command` 接管下一跳时，通常不要再为同一个出口配置无意保留的普通 **Edge**

#### 5.4、错误目标的边界

正确做法是依靠 `GraphNode` 的目标类型和 `ends` 限制 `goto`

在 `@langchain/langgraph@1.4.13` 中，如果强行通过类型断言绕过这些约束，错误的 `Command.goto` 目标不一定产生运行时异常；可能只应用 `update`，随后因没有有效待执行节点而结束

因此不能把运行时异常当作错误目标的唯一防线，也不能为了省事把 `goto` 定义为任意字符串

### 六、`recursionLimit` 与 `GraphRecursionError`

#### 6.1、设置方式

`recursionLimit` 在调用图时通过配置对象传入：

```ts
const result = await graph.invoke(input, {
  recursionLimit: 10,
});
```

它是配置对象的顶层字段，不放进 `configurable`

`recursionLimit` 限制的是一次图运行允许推进的最大 **Super-step** 数量，不等于某一个 **Node** 的调用次数

#### 6.2、错误处理

当图尚未到达停止条件便超过限制时，**Runtime** 抛出 `GraphRecursionError`：

```ts
import { GraphRecursionError } from "@langchain/langgraph";

try {
  await graph.invoke(input, { recursionLimit: 3 });
} catch (error) {
  if (error instanceof GraphRecursionError) {
    console.error("Graph 未能在执行上限内结束");
  }
}
```

#### 6.3、两类终止机制的责任

```text
业务终止条件
  -> 定义任务在什么状态下正常完成

recursionLimit
  -> 在业务条件失效时阻止 Graph 无限运行
```

`recursionLimit` 是 **Runtime** 安全边界，不是业务流程设计；仅靠它结束循环，得到的是失败而不是正常结果

### 七、最小示例

下面的图同时包含条件分支、有限循环与 `Command`：

```ts
import {
  Command,
  type ConditionalEdgeRouter,
  END,
  type GraphNode,
  ReducedValue,
  START,
  StateGraph,
  StateSchema,
} from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  needsReview: z.boolean(),
  revisionCount: z.number().default(0),
  status: z.string().default("received"),
  trace: new ReducedValue(z.array(z.string()).default(() => []), {
    reducer: (current, update) => [...current, ...update],
  }),
});

const draft: GraphNode<typeof State> = () => ({
  status: "drafted",
  trace: ["draft"],
});

const routeAfterDraft: ConditionalEdgeRouter<
  typeof State,
  Record<string, unknown>,
  "review" | "finalize"
> = (state) => (state.needsReview ? "review" : "finalize");

const review: GraphNode<
  typeof State,
  Record<string, unknown>,
  "revise" | "finalize"
> = (state) => {
  const ready = state.revisionCount >= 1;

  // Command 将本次状态更新和下一跳组合在一起
  return new Command({
    update: {
      status: ready ? "approved" : "revising",
      revisionCount: ready
        ? state.revisionCount
        : state.revisionCount + 1,
      trace: ["review"],
    },
    goto: ready ? "finalize" : "revise",
  });
};

const revise: GraphNode<typeof State> = () => ({
  trace: ["revise"],
});

const finalize: GraphNode<typeof State> = () => ({
  status: "done",
  trace: ["finalize"],
});

const graph = new StateGraph(State)
  .addNode("draft", draft)
  .addNode("review", review, {
    ends: ["revise", "finalize"],
  })
  .addNode("revise", revise)
  .addNode("finalize", finalize)
  .addEdge(START, "draft")
  .addConditionalEdges("draft", routeAfterDraft, [
    "review",
    "finalize",
  ])
  // revise 完成后重新进入 review，形成循环
  .addEdge("revise", "review")
  .addEdge("finalize", END)
  .compile();

const result = await graph.invoke(
  { needsReview: true },
  { recursionLimit: 10 },
);

console.log(result.status);
// "done"

console.log(result.revisionCount);
// 1

console.log(result.trace);
// ["draft", "review", "revise", "review", "finalize"]
```

如果输入 `{ needsReview: false }`，实际路径则是：

```text
draft -> finalize -> END
```

### 八、关键边界与常见误区

- 条件 **Edge** 在源 **Node** 的更新合并后执行，读取的是更新后的 **State**
- **Router** 负责选择目标，不负责修改 **State** 或执行副作用
- `Command` 适合同时更新 **State** 和选择目标，不代表它比条件 **Edge** 更高级
- `Command.goto` 不会自动取消当前 **Node** 的静态 **Edge**
- `ends` 与 `GraphNode` 的目标类型是动态路由的重要约束
- 循环是 **Edge** 再次指向已执行 **Node** 的结果，不是独立的循环对象
- 业务终止条件负责正常完成，`recursionLimit` 只负责阻止失控运行
- `recursionLimit` 统计 **Super-step**，不是单个 **Node** 的循环次数
- `GraphRecursionError` 表示图没有在限制内结束，不是正常业务结果
- 条件判断由应用或 **LLM** 产生，**LangGraph** 只执行明确的路由结果

### 九、核心结论

- 固定 **Edge** 表达静态顺序，条件 **Edge** 根据 **State** 选择路径
- `addConditionalEdges()` 把源 **Node**、**Router** 和允许目标关联起来
- `Command({ update, goto })` 让一个 **Node** 同时提交更新与下一跳
- 循环由回边形成，必须设计业务终止条件
- `recursionLimit` 是防止失控的 **Runtime** 上限，不替代业务判断
- **Graph Runtime** 接管调度，但所有业务条件与目标范围仍由应用定义

### 十、复习问题

- 固定 **Edge**、条件 **Edge** 和 `Command` 分别适合什么场景
- `addConditionalEdges()` 的三个参数分别是什么
- **Router** 读取的是源 **Node** 更新前还是更新后的 **State**
- **Router** 可以返回哪些类型的路由结果
- 为什么 **Router** 不应该同时负责修改 **State**
- `Command` 的 `update` 与 `goto` 分别做什么
- 返回 `Command` 的 **Node** 为什么还要声明 `ends`
- `Command.goto` 与当前 **Node** 的静态 **Edge** 是替换关系吗
- **LangGraph** 中的循环是如何形成的
- 业务终止条件与 `recursionLimit` 的责任有什么区别
- `recursionLimit` 限制的是 **Node** 次数还是 **Super-step** 数量
- `GraphRecursionError` 表示什么

### 十一、参考资料

- **[LangGraph Graph API](https://docs.langchain.com/oss/javascript/langgraph/graph-api)**
- **[Use the Graph API](https://docs.langchain.com/oss/javascript/langgraph/use-graph-api)**
- **[Graph Recursion Limit](https://docs.langchain.com/oss/javascript/langgraph/errors/GRAPH_RECURSION_LIMIT)**

### 十二、复习参考答案

#### 1. 三种控制方式的适用场景

- 固定 **Edge** 适合下一节点永远不变的确定性顺序
- 条件 **Edge** 适合只读取 **State** 并选择路径的独立路由逻辑
- `Command` 适合 **Node** 需要同时返回 **State Update** 和下一跳的场景

#### 2. `addConditionalEdges()` 的参数

- `source` 指定在哪个源 **Node** 完成后进行路由
- `router` 读取完整 **State** 并返回路由结果
- `pathMap` 可选，用于声明允许目标，或把业务路由值映射为节点名称

#### 3. **Router** 读取的 **State**

**Runtime** 会先合并源 **Node** 返回的 **State Update**，再调用 **Router**，因此 **Router** 读取的是更新后的完整 **State**

#### 4. **Router** 的返回值

它可以返回单个节点名、多个节点名、`END`，还可以在动态并行场景返回 `Send`；返回多个目标时，目标会进入下一 **Super-step**

#### 5. **Router** 为什么不修改 **State**

**Router** 的职责是把当前状态映射为下一目标，它的返回协议是路由结果而不是 **State Update**

保持纯路由还能让分支判断更容易独立测试，状态变化的来源也更容易追踪

#### 6. `Command.update` 与 `Command.goto`

- `update` 按各字段已有的覆盖或 **Reducer** 规则写入 **State**
- `goto` 指定更新完成后由 **Runtime** 调度的目标节点

#### 7. `ends` 的作用

`ends` 声明这个 **Node** 通过 `Command` 可能到达哪些目标，使图构建器、类型系统和可视化能够识别动态出口

还应通过 `GraphNode` 的目标类型约束 `goto`，不能只依赖运行时处理错误字符串

#### 8. `Command.goto` 与静态 **Edge** 的关系

不是替换关系，`Command.goto` 增加动态目标，已经定义的静态 **Edge** 仍会生效

如果不希望并行调度额外目标，应删除该 **Node** 不需要的静态出口

#### 9. 循环如何形成

当 **Edge** 或 `Command.goto` 把控制权再次交给已经执行过的 **Node**，图中便形成循环

**Runtime** 会持续按当前 **State** 执行这些转移，直到路由到 `END`、没有待执行节点或触发执行上限

#### 10. 两类终止机制的区别

- 业务终止条件定义任务何时正常完成，应当直接体现在路由判断中
- `recursionLimit` 是业务终止条件失效后的 **Runtime** 保险丝，只负责阻止无限运行

#### 11. `recursionLimit` 的计数单位

它限制一次图运行能够推进的 **Super-step** 数量，不是某个 **Node** 的单独调用次数

并行执行的多个 **Node** 可以属于同一个 **Super-step**

#### 12. `GraphRecursionError`

它表示图在达到 `recursionLimit` 前仍未命中停止条件，通常意味着存在无限循环、终止判断错误，或者当前上限不足以容纳这条合法复杂路径

捕获该错误只能处理失败，不能把它等同于正常完成
