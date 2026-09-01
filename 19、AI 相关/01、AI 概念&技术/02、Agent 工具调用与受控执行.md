## Agent 工具调用与受控执行

> 逻辑主线：模型生成结构化产物，经过程序校验、工具执行、结果反馈与终止控制，逐步成为一个可观察、可停止的行动循环
>

### 一、从自然语言到结构化契约

#### 1.1、人能读懂，不代表程序能使用

假设用户问：

> 北京今天多少度

模型回答：

> 北京今天大约 28 摄氏度，天气比较暖和

这句话适合直接展示给人，但下游程序很难继续处理

如果还要计算体感温度、比较多个城市或者写入数据库，程序就必须先从句子里猜出三个信息：

- 城市是“北京”
- 温度是数字 `28`
- 单位是“摄氏度”

更适合程序使用的结果是：

```json
{
  "city": "北京",
  "temperature": 28,
  "unit": "摄氏度"
}
```

程序不再理解整句话，只需读取稳定字段，就可以继续判断、计算和调用其他模块

这里所谓的结构化，不只是把文本写成 **JSON**，而是同时满足三件事：

- 字段名称稳定，例如：始终使用 `temperature`
- 数据类型明确，例如：温度必须是数字
- 输出能够被机器直接解析

==自然语言适合表达，结构化数据适合进入程序==

#### 1.2、结构化输出是一份接口契约

如果模型今天返回 `temperature`，明天改成 `temp`，或者把数字 `28` 写成字符串 `"二十八度"`，下游程序仍然无法稳定工作

因此，模型和程序之间需要提前约定：

- 允许哪些字段
- 每个字段是什么类型
- 哪些字段必须存在

这份约定就是**结构化输出的契约**，它把“希望模型这样回答”变成“程序只接收这样的数据”

==但模型是概率系统，即使要求写得很明确，也可能偶尔偏离契约==，接下来的问题便是：**如何让这种偏离尽可能少，并在发生时被程序发现**

### 二、从可解析到可校验

#### 2.1、三层约束：从提示词到 Schema

让模型返回结构化结果，需要把约束逐步从「自然语言提醒」推进到机器可检查的「数据契约」

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/4245fe33-1aac-4bcc-ae68-3ce2b953c0aa.png" alt="4245fe33-1aac-4bcc-ae68-3ce2b953c0aa" style="zoom: 67%;" />

1. **提示词约束**

   - **约束落点**：依赖模型理解自然语言要求
   - **能够解决**：告诉模型需要哪些字段和输出形式
   - **不能保证**：结果一定是合法 **JSON**，也不能保证没有额外文字
   - **典型失败**：解释文字、代码围栏、字段遗漏或类型变化

例如，只在提示词里要求输出格式：

> 请只返回 JSON，不要添加解释，字段必须包含 city、temperature 和 unit

这种约束能够快速跑通，但模型仍可能返回：

````text
好的，这是你要的 JSON：
```json
{"city": "北京", "temperature": 28, "unit": "摄氏度"}
```
````

人依然能看懂，`json.loads()` 却会因为前后的说明文字和代码围栏而解析失败

2. **JSON Mode**

   - **约束落点**：模型生成阶段的 **JSON** 语法
   - **能够解决**：括号不闭合、前后夹杂解释文字等解析问题
   - **不能保证**：字段名称、字段类型和必填项符合业务契约
   - **典型失败**：结果是合法 **JSON**，但数据形状不符合程序预期

模型接口通常通过 `response_format` 一类参数打开这个能力：

```python
reply = call_model(
    messages=[{
        "role": "user",
        "content": "用 JSON 给出北京的天气，字段为 city、temperature",
    }],
    response_format={"type": "json_object"},
).content

print(reply)
```

例如，下面的结果能够正常解析，却仍然缺少程序期待的 `city`、`temperature` 和 `unit`：

```json
{
  "answer": "北京今天 28 度"
}
```

3. **Schema 约束**

   - **约束落点**：解析后数据的结构
   - **能够解决**：字段、类型、枚举和必填项约束
   - **不能保证**：数据符合业务规则，也不能证明事实真实
   - **工程作用**：把格式要求提升为机器可检查的接口契约

可以使用 **Pydantic** 模型把“字段说明书”写成代码：

```python
from pydantic import BaseModel


class Weather(BaseModel):
    city: str
    temperature: int
    unit: str
```

支持 **Structured Outputs** 的模型接口可以直接使用这类结构定义约束输出，不支持时仍然可以把它用于应用侧校验

三层约束的递进关系可以记成：

```text
→ 提示词：告诉模型应该怎么写
→ JSON Mode：限制结果必须能被解析
→ Schema：限制解析后的数据必须长成约定形状
```

不同模型接口对这些能力的支持程度并不相同，但应用侧有一条不变的原则：==无论生成阶段的约束多强，都要独立校验收到的数据==

#### 2.2、能够解析，不等于能够相信

程序拿到模型输出后，需要逐层回答不同问题：

1. 能否解析：是不是合法 **JSON**
2. 结构是否正确：字段、类型、枚举是否符合 **Schema**
3. 业务是否允许：值是否满足当前系统规则
4. 事实是否可信：关键事实是否来自可靠数据源

下面这份数据能够通过 **JSON** 解析，也可能通过结构校验：

```json
{
  "city": "北京",
  "temperature": 280,
  "unit": "摄氏度"
}
```

它的格式完全正确，但 `280` 显然不应被天气业务直接接受

再例如，**Schema** 可以要求 `city` 必须是字符串，却无法证明天气数据确实来自气象服务，而不是模型根据常识猜出的答案

因此，**Schema** 解决的是“数据长什么样”，业务规则判断“系统是否接受它”，外部数据源才负责证明“这个事实是不是真的”

> ==**可解析不等于可接收，可接收不等于可信**==

#### 2.3、解析、校验、错误反馈与有限重试

当输出不符合契约时，程序不应该悄悄猜测或强行修补，可以把具体错误反馈给模型，让它重新生成

先用一个最小校验函数检查字段和类型：

```python
def validate(data):
    if "city" not in data or "temperature" not in data:
        raise ValueError("缺少必要字段")

    if not isinstance(data["temperature"], (int, float)):
        raise ValueError("温度必须是数字")

    return data
```

然后把解析、校验、错误反馈和有限重试收进 `ask_json()`：

```python
import json


def ask_json(prompt, max_retries=3):
    messages = [{"role": "user", "content": prompt}]

    for i in range(max_retries):
        reply = call_model(messages).content

        try:
            data = json.loads(reply)  # 1）解析
            validate(data)            # 2）校验
            return data               # 成功

        except (json.JSONDecodeError, ValueError) as e:
            print(f"第 {i + 1} 次失败：{e}，要求模型修正…")
            messages.append({"role": "assistant", "content": reply})
            messages.append({
                "role": "user",
                "content": f"刚才的输出有问题：{e}。请只返回修正后的合法 JSON，不要多余文字。",
            })

    raise RuntimeError("多次重试仍无法得到合法 JSON")
```

更换模型客户端时，**解析**、**校验**、**反馈**和**重试**的控制顺序不变

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/7f884421-8700-4951-a66e-0c9588d49030.png" alt="7f884421-8700-4951-a66e-0c9588d49030" style="zoom:67%;" />

这段流程的关键不在于“多问模型几次”，而在于**==责任分离==**：

- 模型生成候选结果
- 确定性程序负责解析和校验
- 校验失败时反馈具体错误，不是简单重复原问题
- 重试受最大次数限制，无法收敛就明确失败

实际系统还应记录原始输出、校验错误和尝试次数，以便排查模型为什么没有按契约收敛

#### 2.4、从数据契约到动作提案

- **Schema** 约束输出形状
- 校验器决定是否接收
- 数据源确认事实
- 权限系统决定动作是否允许

这四项责任不能互相替代

现在，程序已经能够稳定接收模型生成的数据，如果模型下一步输出的不只是天气结果，而是这样的对象：

```json
{
  "name": "get_weather",
  "arguments": {
    "city": "北京"
  }
}
```

它表达的就不再只是一个答案，而是“建议调用某个工具”的动作提案，这正是 **Tool Calling** 的起点

### 三、从结构化结果到 Tool Call

#### 3.1、模型提议动作，程序执行动作

到这里，模型已经能够稳定生成结构化数据，但它仍然只是在生成内容

用户问“北京今天天气怎么样”，模型可能根据已有知识编出答案，却无法自行访问实时天气接口

用户要求“把记录写入数据库”，模型也不能仅凭一段文字完成数据库写入

要让模型参与真实任务，程序需要把一组可用能力描述给它，例如：

- `get_weather` 可以查询天气
- 调用时必须提供 `city`
- `city` 必须是字符串

模型收到用户问题和工具说明后，可以返回一个结构化的动作提案：

```json
{
  "name": "get_weather",
  "arguments": {
    "city": "北京"
  }
}
```

这个结果的含义是“建议调用 `get_weather`，参数是北京”，不是“天气工具已经执行完成”

真正的函数调用仍然发生在应用程序中：==程序读取工具名和参数，找到对应函数，执行后再把结果返回给模型==

> ==**LLM 选择动作，Tool Call 表达动作，程序执行动作**==

#### 3.2、工具契约：name、description 与 parameters

模型并不认识代码中的 **Python** 函数，需要先收到一份机器可读的“工具说明书”

天气函数可以使用下面这份工具契约：

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "根据城市名查询当前天气情况",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名，如「北京」「上海」",
                    }
                },
                "required": ["city"],
            },
        },
    }
]
```

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/0485c8b2-0a97-4d18-bbb8-d385ede83eb1.png" alt="0485c8b2-0a97-4d18-bbb8-d385ede83eb1" style="zoom:67%;" />

这份契约包含三个核心部分：

- `name` 是工具的稳定标识，模型用它表达选择，程序用它定位执行函数
- `description` 告诉模型工具解决什么问题，是模型判断是否调用、在多个工具中如何选择的主要语义依据
- `parameters` 用 **Schema** 约束参数的字段、类型和必填项，使工具调用能够被程序解析和校验

名称和描述不能只写给开发者看，它们同时是模型的决策上下文，例如：

- `get_weather` 比 `func1` 更容易被正确选择

- “查询指定城市的当前天气，包括温度、天气状况和风力”也比“查天气”提供了更清楚的适用边界


#### 3.3、一次动作提案如何完成闭环

一次完整工具调用可以拆成五步：

1. 程序实现一个真实函数
2. 程序把工具说明书和用户问题一起传给模型
3. 模型决定是否调用工具，并返回工具名与参数
4. 程序解析 `tool_call`，执行真实函数
5. 程序把工具结果反馈给模型，模型生成最终回答

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/1280X1280.PNG" alt="1280X1280" style="zoom:67%;" />

天气工具的执行体只是一个普通函数：

```python
def get_weather(city: str) -> str:
    """根据城市名返回天气描述，真实项目中这里会调用天气 API"""
    fake_data = {
        "北京": "晴，28°C，东南风 3 级",
        "上海": "多云，31°C，东风 2 级",
        "成都": "阴，24°C，无风",
    }
    return fake_data.get(city, f"暂无 {city} 的天气数据")
```

第一次调用模型时，用户问题和工具说明书同时进入上下文：

```python
messages = [{"role": "user", "content": "北京今天天气怎么样？"}]

msg = call_model(messages, tools=tools, tool_choice="auto")
```

`tool_choice="auto"` 表示模型可以选择某个工具，也可以判断当前问题不需要工具而直接回答

当模型返回 `tool_calls` 时，程序解析参数并执行天气函数：

```python
import json


if msg.tool_calls:
    call = msg.tool_calls[0]
    func_name = call.function.name
    args = json.loads(call.function.arguments)

    result = get_weather(**args)
```

工具结果并不是新的用户消息，它要以 `tool` 角色写回上下文，并通过 `tool_call_id` 与前面的动作提案对应：

```python
messages = [
    {"role": "user", "content": "北京今天天气怎么样？"},
    msg,
    {
        "role": "tool",
        "tool_call_id": call.id,
        "content": result,
    },
]

final_msg = call_model(messages)

print(final_msg.content)
```

一次完整流程通常包含两次模型调用：第一次提出动作，第二次依据工具结果组织最终回答，中间的真实函数由程序执行

#### 3.4、多工具选择与工具注册表

真实系统往往会同时提供天气、股票等多个工具，模型会结合用户问题以及每个工具的 `name`、`description` 和 `parameters` 进行选择，也可以判断当前问题不需要工具

==工具越多，名称重叠和描述模糊造成的选择噪声越明显，因此工具集合不是越大越好，应尽量让每个工具职责单一、描述清晰、边界互斥==

模型返回的工具名仍然只是一个字符串，程序不能把任意名称直接映射成可执行代码，通常需要维护一个明确的工具注册表：

```python
TOOL_REGISTRY = {
    "get_weather": get_weather,
    "get_stock_price": get_stock_price,
}
```

只有注册表中的工具才允许进入后续校验与执行，未知工具必须拒绝

#### 3.5、一次 Tool Calling 还不是 Agent

天气查询在一次工具调用后就能回答，但很多任务不会只需要一个动作

例如，检查一个 **PR**，模型可能先读取差异，再根据差异决定是否运行测试

拿到测试结果后，它才能形成评审意见，并判断是否需要发布评论

单次工具调用只解决了一个动作闭环：

```text
模型提议动作
→ 程序执行工具
→ 工具结果返回模型
→ 模型生成回答
```

如果工具结果仍不足以完成任务，模型就要再次判断下一步，这意味着同一个闭环需要被放进循环

### 四、从单次调用到 Agent Loop

#### 4.1、工具结果必须进入下一轮决策

一次工具调用的控制流是预先确定的：模型选一个工具，程序执行一次，再让模型回答

但在多步任务中，下一步依赖上一步得到的结果：

- 天气工具返回“城市不存在”，模型可能需要修正城市名后重试
- 代码差异显示修改了数据库逻辑，模型可能决定继续运行集成测试
- 测试结果出现失败，模型可能需要读取失败日志，而不是直接给出评审结论

这时，程序不能预先写死每一个分支，而要在每次执行后把结果放回上下文，让模型重新决策

一个最小 **Agent Loop** 因此包含四个连续动作：

1. **感知**：读取用户目标和当前上下文
2. **决策**：模型判断是否调用工具，以及调用哪个工具
3. **行动**：程序执行工具并获得结果
4. **更新**：把工具结果追加到上下文，再进入下一轮

当模型不再返回 `tool_calls`，循环才把模型回答交给用户

#### 4.2、把单次调用放进循环

把第三节的五步流程包进循环，就能得到下面这个最小实现：

```python
import json


def run_agent(user_input: str, tools, tool_registry) -> str:
    messages = [{"role": "user", "content": user_input}]

    for _ in range(5):
        msg = call_model(messages, tools=tools, tool_choice="auto")
        messages.append(msg)

        if not msg.tool_calls:
            return msg.content

        for call in msg.tool_calls:
            fn = tool_registry[call.function.name]
            args = json.loads(call.function.arguments)
            result = fn(**args)

            messages.append({
                "role": "tool",
                "tool_call_id": call.id,
                "content": str(result),
            })

    return "循环次数超限"
```

这段代码第一次把“模型决策 → 工具执行 → 结果反馈”变成了可重复的运行过程

其中 `messages` 不只是聊天记录，它还是循环的工作上下文：模型之前提出过什么动作、工具返回过什么结果，都通过它进入下一轮决策

`range(5)` 已经带有最初级的轮次限制，但它只是防止示例无限运行的上限，超时、异常、错误反馈和明确停止条件仍未建立

#### 4.3、这个循环建立在顺风顺水的假设上

最小循环能够跑通，是因为它暂时假设：

- 模型返回的工具名称一定存在
- `arguments` 一定是合法 **JSON**
- 参数一定符合工具要求
- 工具一定会及时返回
- 工具不会抛出异常
- 模型会在有限轮次内主动结束

这些假设在演示中可能成立，却不会在真实运行中始终成立

现在已经有了一个具体的循环对象，下一步不再是抽象地讨论“系统要安全”，而是逐一观察这个循环会在哪里翻车，再在对应位置加固

### 五、从能够运行到受控结束

#### 5.1、最小循环的三种失控方式

把第四节的 `run_agent()` 交给真实用户，它首先会遇到三类故障：

- **死循环**：模型反复调用 `get_weather`，始终不给最终回答
  - 如果没有步数上限，循环会持续消耗模型调用费用，也不会向用户返回结果，第四节临时写死的五轮只是粗略止损，还不是完整停止策略

- **卡死**：天气工具访问外部服务，对方一直不响应，程序就停在 `result = fn(**args)`，后续模型决策和最终回答都不会发生

- **崩溃**：工具可能因为城市不存在、数据解析失败或非法运算而抛出异常

如果异常没有被接住，`run_agent()` 会直接退出，用户只能看到错误堆栈

这三个问题分别打破了“模型会结束”“工具会返回”“工具会成功”的假设

==**Demo** 只证明正常路径能够跑通，**受控循环还要规定异常路径如何结束**==

#### 5.2、三类失控，对应四个控制点

对应前面的故障，循环需要四道基础护栏：

- **最大步数** `max_steps`：限制模型最多决策多少轮，处理死循环
- **工具超时** `timeout`：限制一次工具最多等待多久，处理卡死
- **错误处理** `try/except`：接住工具异常并转成可观察结果，处理崩溃
- **停止条件**：明确成功、超限和连续失败分别如何结束，让循环能够收尾

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/1280X1280%20(1).PNG" alt="1280X1280 (1)" style="zoom:67%;" />

进入下一轮前检查步数，等待工具时检查时间，工具失败时转换错误，每轮决策后判断是否终止

#### 5.3、护栏一：最大步数，先让循环一定能停

第一步是把轮次上限提取成明确配置：

```python
MAX_STEPS = 5

for step in range(MAX_STEPS):
    msg = call_model(messages, tools=tools)

    if not msg.tool_calls:
        return msg.content

    # 执行工具并把结果写回 messages

return "任务较复杂，我没能在限定步数内完成"
```

循环中途返回最终回答，表示任务正常完成

跑满 `MAX_STEPS` 仍在调用工具，则进入失败终态

最大步数没有让模型变得更聪明，它只是给最坏情况设置损失上限：无论模型如何重复，系统都能在有限轮次后把控制权交还给用户

#### 5.4、护栏二：工具超时，限制单次执行的等待时间

限制循环轮次仍然解决不了工具卡在某一步的问题，因为只要 `fn(**args)` 不返回，循环就没有机会进入下一轮

如果工具通过 **HTTP** 客户端访问外部服务，应优先使用客户端原生超时：

```python
import requests


def get_weather(city):
    response = requests.get(
        "<weather-api-url>",
        params={"city": city},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()
```

对于没有原生超时参数的普通函数，即使用线程池限制 `future.result()` 的等待时间，也只能让等待方收到超时异常，不能停止底层线程；

退出线程池上下文时还可能继续等待线程结束，因此不能据此承诺 **Agent** 已经取回控制权

需要硬终止时，应使用支持取消的客户端、独立进程、容器或远程执行器，并由受控执行层确认执行是否已经停止

#### 5.5、护栏三：把工具错误变成下一轮能够观察的结果

工具抛出异常时，只把错误打印到控制台并重新抛出，仍然会让整个任务崩溃

更有用的处理方式，是把可纠正的错误转成 `tool` 消息，放回模型上下文；`to_safe_error()` 负责过滤内部路径、密钥和堆栈等敏感信息：

```python
try:
    result = run_tool(fn, args, timeout_seconds=10)
except Exception as error:
    safe_error = to_safe_error(error)
    result = (
        f"工具执行出错：{safe_error}。"
        "请修正参数、换一种方式，或告诉用户无法完成。"
    )

messages.append({
    "role": "tool",
    "tool_call_id": call.id,
    "content": str(result),
})
```

这样，工具失败不再是宿主程序的终点，而是下一轮决策能够看到的 **Observation**

原始异常应写入内部日志，返回给模型的只能是经过脱敏的纠错信息

模型看到“城市不存在”后可以修正城市名，看到“缺少参数”后可以补充参数

这与结构化输出阶段“校验失败 → 反馈具体错误 → 有限重试”是同一种控制模式

但错误反馈不等于所有错误都允许重试：权限拒绝、策略禁止和副作用状态不明时，应停止执行，而不是让模型换一种说法绕过限制

#### 5.6、护栏四：定义什么时候算完成，什么时候应该止损

前三道护栏分别处理轮次、等待和异常，最后还需要回答：Agent 怎么知道自己做完了

最小实现使用一个主信号和两条兜底：

- 主信号：模型本轮不再返回 `tool_calls`，表示它认为已有足够信息，可以给出最终回答
- 兜底一：跑满 `MAX_STEPS` 仍在调用工具，强制结束
- 兜底二：工具连续失败达到上限，提前止损

简单任务可以使用“没有 `tool_calls`”作为完成信号

更复杂的系统可以提供显式的 `finish(answer)` 工具或状态机终态，避免只依赖模型是否继续调用工具

一个完整循环至少要区分成功、失败、等待人工和用户取消，不能只有“继续运行”这一种状态

#### 5.7、四道护栏如何进入同一个循环

前面每一道护栏只修改了一个局部位置，现在把它们重新放回第四节的 `run_agent()`：

<img src="https://raw.githubusercontent.com/wanglufei561/picture_repo/master/assets/e70bdea5-1146-40ba-a472-119b5975023f.png" alt="e70bdea5-1146-40ba-a472-119b5975023f" style="zoom:67%;" />

下面使用控制逻辑伪代码组装完整循环，假设执行层提供 `run_tool()` 和 `to_safe_error()`

前者保证在规定时间内返回结果或抛出 `ToolTimeoutError`，后者负责生成可反馈给模型的脱敏错误：

```python
import json


MAX_STEPS = 5
TIMEOUT_SECONDS = 10


def run_agent(user_input, tools, tool_registry):
    messages = [{"role": "user", "content": user_input}]
    consecutive_errors = 0

    for step in range(MAX_STEPS):
        msg = call_model(messages, tools=tools)
        messages.append(msg)

        if not msg.tool_calls:
            return msg.content

        for call in msg.tool_calls:
            try:
                args = json.loads(call.function.arguments)
                fn = tool_registry.get(call.function.name)

                if fn is None:
                    raise ValueError(f"未知工具：{call.function.name}")

                result = run_tool(
                    fn,
                    args,
                    timeout_seconds=TIMEOUT_SECONDS,
                )
                observation = {
                    "status": "success",
                    "content": str(result),
                }
                consecutive_errors = 0

            except ToolTimeoutError:
                observation = {
                    "status": "timeout",
                    "message": "工具未在 10 秒内完成",
                }
                consecutive_errors += 1

            except (json.JSONDecodeError, ValueError) as error:
                observation = {
                    "status": "error",
                    "message": to_safe_error(error),
                }
                consecutive_errors += 1

            except Exception as error:
                observation = {
                    "status": "error",
                    "message": to_safe_error(error),
                }
                consecutive_errors += 1

            messages.append({
                "role": "tool",
                "tool_call_id": call.id,
                "content": json.dumps(observation, ensure_ascii=False),
            })

        if consecutive_errors >= 3:
            return "多个工具连续失败，我暂时无法完成这个任务"

    return "任务较复杂，我没能在限定步数内完成，请把问题拆小一点"
```

这段伪代码实现了成功、步数超限和连续错误三类终态，尚未实现错误分类策略、权限、幂等、人工等待、用户取消、状态持久化和恢复

> ==**工具让模型行动，循环让模型继续，护栏让系统停止**==

### 六、最终模型：提议、执行、观察与终止

本文讨论的不是模型能不能调用工具，而是动作提案如何经过校验、执行、观察和终止控制，成为一个受控行动循环

整篇内容最终收束成一条控制链：

```text
用户目标
→ Agent 组装上下文
→ LLM 返回结构化结果或 Tool Call
→ 程序校验并执行已注册 Tool
→ Observation 写回上下文
→ Agent 继续决策或进入终态

Guardrails 贯穿循环：限制步数、等待、错误与终止路径
```

其中：

- **LLM** 生成候选结果并提议动作
- **Agent** 维护上下文并推进任务
- 程序校验契约并控制工具执行
- **Tool** 真正读取或改变环境
- **Guardrails** 限制循环、错误与终止路径

> ==**提议不等于执行，可运行不等于可交付**==
