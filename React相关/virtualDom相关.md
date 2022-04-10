#### 什么事Virtual Dom(虚拟Dom)

Virtual Dom 的核心是数据驱动视图，让开发人员专注于代码逻辑。Virtual Dom的出现是为了解决操作原生Dom时所面临的问题，1、使用Js操作原生Dom非常繁琐；2、频繁的操作Dom对性能是一种消耗。Virtual Dom的主要思想就是模拟原生Dom的树状结构，对原生Dom做了一层映射，通过改变Virtual Dom从而改变原生Dom，具体实现方式是，Virtual Dom中保存着映射Native Dom信息的节点数据，当需要更新视图的时候，先通过对节点数据的diff得到差异性结果，再一次性对Native Dom做批量更新操作，从而做到数据驱动视图，并且避免了频繁操作Native Dom，影响性能



VirtualDOM的设计是提升前端渲染性能的有效方案，也因此提供了以数据为驱动的前端框架工具的基础，将我们从DOM的繁琐操作中解放出来


