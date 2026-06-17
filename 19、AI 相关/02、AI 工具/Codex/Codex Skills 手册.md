## **Codex** Skills 手册

### 一、Skills 总览

这份文档记录当前 **Codex** 可用 skills，以及它们各自适合解决什么问题、如何调用

> **Codex** 不是随机选择 skill，也不是把所有 skill 都加载一遍；核心逻辑是：根据用户请求的意图、任务阶段、风险类型和 skill 的触发描述，选择最小必要 skill
>
> ### 一、优先级规则
>
> 从高到低大致是：
>
> 1. 用户明确指定
>    例如：“使用 impeccable”“用 systematic-debugging”，就按指定 skill 走
> 2. 项目规则和当前指令
>    例如： AGENTS.md、当前这轮要求、文档格式要求，比 skill 的泛化流程优先
> 3. 必须触发的流程型 skill
>    例如：涉及 **OpenAI** / **Codex** 官方信息时用 openai-docs；创建 skill 时用 skill-creator；安装 skill 时用 skill-installer
> 4. 根据任务意图匹配 skill
>    看这个任务更像 **UI** 设计、浏览器验证、**GitHub** **PR**、**CI** 修复、图片生成、产品设计、广告创意，还是工程流程控制
> 5. 选择最小集合
>    能用一个更窄的 skill 解决，就不启用多个宽泛 skill

排列顺序：

- 系统内置 skills 在前
- 浏览器控制类 skills 分组相邻
- 插件类 skills 分组相邻
- 自己安装或创建的个人 skills 放在后面

| Skill                        | 来源                     | 核心用途                                   |
| ---------------------------- | ------------------------ | ------------------------------------------ |
| `imagegen`                   | 系统内置                 | 生成或编辑位图图片                         |
| `openai-docs`                | 系统内置                 | 查询 **OpenAI** / **Codex** 官方文档和最新模型信息 |
| `skill-installer`            | 系统内置                 | 安装 **Codex** skills                          |
| `skill-creator`              | 系统内置                 | 创建或更新 **Codex** skills                    |
| `plugin-creator`             | 系统内置                 | 创建本地 **Codex** plugin                      |
| `control-in-app-browser`     | **Browser** 插件             | 控制 **Codex** 内置浏览器                      |
| `control-chrome`             | **Chrome** 插件              | 控制用户本机 **Chrome**                        |
| `Product Design` skills      | **Product Design** 插件      | 产品设计、原型、审查、image-to-code        |
| `Creative Production` skills | **Creative Production** 插件 | 商业视觉、广告、场景、logo、moodboard      |
| `GitHub` skills              | **GitHub** 插件              | **PR**、issue、**CI**、发布工作流                  |
| `Superpowers`                | **Superpowers** 插件         | 工程工作流约束，例如计划、**TDD**、调试、验证  |
| `design-md-picker`           | 个人自定义               | 从本地设计参考库生成项目 `DESIGN.md`       |
| `impeccable`                 | 第三方安装               | 前端 **UI/UX** 设计、审查、实现和 polish       |

### 二、imagegen

**用途：**

`imagegen` 用于生成或编辑位图图片，例如照片、插画、纹理、sprite、mockup、透明背景素材

**怎么调用：**

```text
使用 imagegen，生成一张适合 AI Coding 工具官网 hero 的产品氛围图
```

```text
使用 imagegen，把这张图片改成更适合深色科技产品官网的视觉风格
```

**注意点：**

适合图片资产，不适合直接编辑 **SVG**、icon system、**HTML/CSS/canvas** 这类代码原生视觉

### 三、openai-docs

**用途：**

`openai-docs` 用于回答 **OpenAI** 产品、**API**、**Codex**、模型选择和模型升级相关问题

**怎么调用：**

```text
使用 openai-docs，查一下当前 OpenAI API 推荐用哪个模型做代码生成
```

```text
使用 openai-docs，解释 Codex CLI 和 Codex desktop 的使用差异
```

**注意点：**

这类问题有时效性，应该优先查官方文档；涉及 **Codex** 自身时，优先使用 **Codex manual helper**

### 四、skill-installer

**用途：**

`skill-installer` 用于安装 **Codex** skills，可以安装 curated skills，也可以从 **GitHub** 仓库安装第三方 skill

**怎么调用：**

```text
使用 skill-installer，安装这个 GitHub 仓库里的 skill
```

```text
使用 skill-installer，列出可安装的 curated skills
```

**注意点：**

安装后通常需要重启 **Codex** 才能稳定识别新 skills

### 五、skill-creator

**用途：**

`skill-creator` 用于创建或更新 **Codex** skill，适合把可复用工作流、领域知识或工具使用方式沉淀成 skill

**怎么调用：**

```text
使用 skill-creator，帮我创建一个用于选择 DESIGN.md 的本地 skill
```

```text
使用 skill-creator，检查这个 skill 的触发描述是否清晰
```

**注意点：**

skill 应该短、聚焦、可触发；不要把一次性项目说明写成长期 skill

### 六、plugin-creator

**用途：**

`plugin-creator` 用于创建本地 **Codex** plugin，适合需要把 skills、**MCP** servers、apps 或 marketplace metadata 打包到一起的场景

**怎么调用：**

```text
使用 plugin-creator，创建一个本地 Codex plugin，里面包含我的设计工作流 skills
```

**注意点：**

如果只是新增一个简单 skill，优先用 `skill-creator`；只有需要插件结构时再用 `plugin-creator`

### 七、**Browser** 插件 skill 集合

**Browser** 插件用于控制 **Codex** 内置浏览器，适合本地网页打开、点击、截图、响应式检查和前端验证

**常用 skills：**

| Skill | 什么时候用 |
|---|---|
| `control-in-app-browser` | 打开、导航、点击、输入、截图或验证 **Codex** 内置浏览器中的页面 |

**具体说明：**

- `control-in-app-browser`

  > **用途：**
  >
  > `control-in-app-browser` 用于控制 **Codex** 内置浏览器，适合打开、测试、点击、截图或验证本地网页
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 Browser 打开 localhost:3000，检查页面在桌面和移动端是否正常
  > ```
  >
  > ```text
  > 使用 Browser 截图当前页面，验证按钮和文本没有重叠
  > ```
  >
  > **注意点：**
  >
  > 本地前端改动后，优先用这个 skill 验证 `localhost`、`127.0.0.1`、`file://` 等目标

### 八、**Chrome** 插件 skill 集合

**Chrome** 插件用于控制用户本机 **Chrome**，适合需要真实登录态、cookies、扩展、已有标签页或远程 authenticated 页面的场景

**常用 skills：**

| Skill | 什么时候用 |
|---|---|
| `control-chrome` | 控制用户本机 **Chrome** 浏览器 |

**具体说明：**

- `control-chrome`

  > **用途：**
  >
  > `control-chrome` 用于控制用户本机 **Chrome**，适合需要登录态、cookies、扩展、已有标签页或远程 authenticated 页面时
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 Chrome 打开这个需要登录的网站，并检查当前页面结构
  > ```
  >
  > ```text
  > 使用 Chrome 查看我已有标签页里的产品页面
  > ```
  >
  > **注意点：**
  >
  > 普通本地页面优先用 **Codex** 内置 **Browser**；只有需要真实 **Chrome** 环境时再用 **Chrome**

### 九、**Product Design** 插件 skill 集合

**Product Design** 插件用于产品设计工作流，覆盖需求上下文、用户研究、体验审查、视觉探索、原型、**URL**-to-code、image-to-code 和设计 **QA**

**常用 skills：**

| Skill | 什么时候用 |
|---|---|
| `product-design:index` | 不确定该用哪个 **Product Design** skill 时 |
| `product-design:get-context` | 设计、原型、image-to-code、redesign 前确认 brief |
| `product-design:user-context` | 保存或读取长期产品设计上下文 |
| `product-design:research` | 研究用户痛点、**UX** 摩擦、文档或开发者体验问题 |
| `product-design:audit` | 审查产品流程、页面、路径和可访问性问题 |
| `product-design:ideate` | 基于 brief 生成视觉方向、变体或概念探索 |
| `product-design:prototype` | 把想法、**URL**、图片、mockup、**Figma** 或代码做成原型 |
| `product-design:image-to-code` | 把截图、mockup 或参考图实现成响应式前端 |
| `product-design:url-to-code` | 把 live **URL** 克隆成可运行前端本地 app |
| `product-design:design-qa` | 对照源视觉目标检查实现还原度 |
| `product-design:share` | 分享可运行原型 |

**具体说明：**

- `product-design:index`

  > **用途：**
  >
  > `product-design:index` 用于进入 **Product Design** 插件的技能路由，适合不确定该用哪个 **Product Design** skill 时
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 Product Design，帮我判断这个页面应该走 audit、prototype 还是 image-to-code
  > ```
  >
  > **注意点：**
  >
  > 它更像 **Product Design** 的入口，不是具体执行某个设计任务的最终 skill

- `product-design:get-context`

  > **用途：**
  >
  > `get-context` 是 **Product Design** 的设计 brief gate，用于在 ideation、prototype、image-to-code、redesign 前确认产品、视觉和交互上下文
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 Product Design get-context，先确认这个 redesign 任务缺哪些信息
  > ```
  >
  > **注意点：**
  >
  > **Product Design** 的构建类任务通常应先经过它，避免在上下文不清楚时直接生成设计或代码
  >

- `product-design:user-context`

  > **用途：**
  >
  > `user-context` 用于保存或读取 **Product Design** 的长期上下文，例如产品 **URL**、**Figma**、截图、设计系统、品牌资产和偏好
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 Product Design user-context，记住这个项目的 Figma、Storybook 和设计系统入口
  > ```
  >
  > ```text
  > 使用 Product Design user-context，看看当前记住了哪些设计资料
  > ```
  >
  > **注意点：**
  >
  > 适合长期复用的产品设计资料；一次性上下文直接放在当前请求里即可

- `product-design:research`

  > **用途：**
  >
  > `research` 用于做快速、基于来源的 **UX** research，关注用户痛点、流程摩擦、onboarding、文档、开发者体验和支持问题
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 Product Design research，研究这个产品最近用户主要抱怨哪些 UX 问题
  > ```
  >
  > **注意点：**
  >
  > 研究当前产品和用户反馈通常需要联网核验，不能只靠模型记忆

- `product-design:audit`

  > **用途：**
  >
  > `audit` 用于审查产品流程、页面、路径、onboarding、checkout、settings 等体验，输出 **UX**、设计和可访问性问题
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 Product Design audit，审查这个 onboarding flow 的 UX 和可访问性问题
  > ```
  >
  > **注意点：**
  >
  > 它适合“发现问题”，不是直接实现新 **UI**；需要先基于截图或页面证据审查

- `product-design:ideate`

  > **用途：**
  >
  > `ideate` 用于基于已确认 brief 生成视觉方向、设计变体、remix 或概念探索
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 Product Design ideate，基于这个 brief 给我 3 个首页视觉方向
  > ```
  >
  > **注意点：**
  >
  > 通常应先经过 `get-context`；它适合探索方向，不适合直接作为最终实现

- `product-design:prototype`

  > **用途：**
  >
  > `prototype` 用于把想法、**URL**、图片、mockup、**Figma** 或已有代码转成可运行的 coded prototype
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 Product Design prototype，把这个想法做成一个可运行原型
  > ```
  >
  > **注意点：**
  >
  > 适合原型验证，不等于最终生产实现；仍需要后续工程化和验证

- `product-design:image-to-code`

  > **用途：**
  >
  > `image-to-code` 用于把截图、mockup、Image Gen 参考图实现成响应式前端
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 Product Design image-to-code，把这张截图实现成响应式页面
  > ```
  >
  > **注意点：**
  >
  > 先确认设计 brief；实现时要做视觉还原、响应式和文本溢出检查

- `product-design:url-to-code`

  > **用途：**
  >
  > `url-to-code` 用于把 live **URL** 克隆成可运行的前端本地 app
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 Product Design url-to-code，参考这个 URL 做一个本地可运行的前端克隆
  > ```
  >
  > **注意点：**
  >
  > 适合原型和视觉复刻；不要复制受保护资产、敏感内容或不该复用的品牌表达

- `product-design:design-qa`

  > **用途：**
  >
  > `design-qa` 用于在 **Product Design** 原型、**URL**-to-code 或 image-to-code 完成后，对照源视觉目标做 **QA**
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 Product Design design-qa，对比源截图和当前实现，找出还原偏差
  > ```
  >
  > **注意点：**
  >
  > 它不是泛 **UX** critique；泛审查应该用 `product-design:audit`

- `product-design:share`

  > **用途：**
  >
  > `share` 用于分享可运行原型，通常通过用户偏好的部署工具完成
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 Product Design share，把这个原型按我的部署工具分享出去
  > ```
  >
  > **注意点：**
  >
  > 分享前应先确认原型能运行，并完成基本视觉和交互检查


### 十、**Creative Production** 插件 skill 集合

**Creative Production** 插件用于商业创意生产，覆盖定位、moodboard、广告方向、场景、offer、logo、镜头变体和发布安全的视觉 polish

**常用 skills：**

| Skill | 什么时候用 |
|---|---|
| `creative-production:explore` | broad brief 下选择 Positioning、Mood boards、Scenes、Offers、Ads、Shots、Logos 等路径 |
| `creative-production:positioning-explorer` | 探索商业定位、受众、场景、增长目标和市场角度 |
| `creative-production:moodboard-explorer` | 生成 image-first mood boards 和视觉方向 |
| `creative-production:scene-explorer` | 把产品、服务或 offer 放进真实商业场景 |
| `creative-production:offer-explorer` | 围绕 offer 生成视觉方向和 coverage checks |
| `creative-production:ads-explorer` | 探索广告方向、image ad prompts 和 paid social ideas |
| `creative-production:shot-explorer` | 基于上传图片探索角度、裁剪、zoom 和产品 shot 变体 |
| `creative-production:logo-explorer` | 探索 identity、wordmark、lockup 和 logo review board |
| `creative-production:generative-polish` | 对已选业务视觉做发布安全的生成式打磨 |

**具体说明：**

- `creative-production:explore`

  > **用途：**
  >
  > `explore` 是 **Creative Production** 的入口，用于在 Positioning、Mood boards、Scenes、Offers、Ads、Shots、Logos、Assets 之间选择方向
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 Creative Production explore，为这个产品选择合适的创意探索路径
  > ```
  >
  > **注意点：**
  >
  > 适合 broad brief，不适合已经明确要某一种产物的任务

- `creative-production:positioning-explorer`

  > **用途：**
  >
  > `positioning-explorer` 用于探索商业定位，包括受众、使用场景、增长目标、proof 和市场角度
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 positioning-explorer，为这个 AI 工具探索 5 个商业定位方向
  > ```
  >
  > **注意点：**
  >
  > 适合在视觉生成前先定商业角度，避免视觉好看但卖点不清

- `creative-production:moodboard-explorer`

  > **用途：**
  >
  > `moodboard-explorer` 用于生成 image-first mood boards，探索视觉领域、受众感受、campaign reference 和品牌方向
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 moodboard-explorer，为这个产品做 4 个视觉 mood board 方向
  > ```
  >
  > **注意点：**
  >
  > 适合定视觉气质，不适合直接产出最终广告或上线素材

- `creative-production:scene-explorer`

  > **用途：**
  >
  > `scene-explorer` 用于把产品、服务、场馆或 offer 放进真实商业场景中，探索 customer moment、retail、service、POS 等画面
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 scene-explorer，为这个服务设计 6 个真实使用场景
  > ```
  >
  > **注意点：**
  >
  > 适合产品入场景、服务瞬间和消费者决策语境

- `creative-production:offer-explorer`

  > **用途：**
  >
  > `offer-explorer` 用于围绕产品、服务、体验或 campaign offer 生成 prompt families、contact sheets 和 coverage checks
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 offer-explorer，为这个订阅产品探索 6 个 offer-led 视觉方向
  > ```
  >
  > **注意点：**
  >
  > 适合先明确“卖什么”和“为什么买”，再进入具体视觉生产

- `creative-production:ads-explorer`

  > **用途：**
  >
  > `ads-explorer` 用于探索广告方向、image ad prompts、paid social ideas 和 campaign review wall
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 ads-explorer，为这个产品生成一组 paid social 广告方向
  > ```
  >
  > **注意点：**
  >
  > 适合广告探索，不等同于最终可投放素材；最终产物还要做尺寸、文案和品牌校验

- `creative-production:shot-explorer`

  > **用途：**
  >
  > `shot-explorer` 用于基于上传图片探索相机角度、裁剪、zoom、macro detail 和产品 shot 变体
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 shot-explorer，基于这张产品图生成不同角度和 closeup 方案
  > ```
  >
  > **注意点：**
  >
  > 适合已有图像资产后的 shot variation，不适合从零定义品牌定位

- `creative-production:logo-explorer`

  > **用途：**
  >
  > `logo-explorer` 用于探索品牌 identity、wordmark、lockup 和 logo review board
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 logo-explorer，为这个新产品探索 5 个 logo 方向
  > ```
  >
  > **注意点：**
  >
  > 适合 identity concept，不等同于最终可商标注册或完整品牌系统

- `creative-production:generative-polish`

  > **用途：**
  >
  > `generative-polish` 用于对业务视觉做发布安全的生成式打磨，在保持文字、数据、logo、尺寸、安全区和文件名准确的前提下提升视觉质量
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 generative-polish，把这张社媒卡片做得更高级，但不要改文字、数据和 logo
  > ```
  >
  > **注意点：**
  >
  > 它适合 selected asset 的最终 polish，不适合早期方向探索；文字、图表、logo 和尺寸应由确定性工具控制

### 十一、**GitHub** 插件 skill 集合

**GitHub** 插件用于 **GitHub** 仓库、**PR**、issue、**CI**、review comments 和本地修改发布流程

**常用 skills：**

| Skill | 什么时候用 |
|---|---|
| `github:github` | **GitHub** 仓库、**PR**、issue 的定位、总结、triage 和上下文获取 |
| `github:gh-address-comments` | 处理 **PR** review comments、unresolved threads 和 requested changes |
| `github:gh-fix-ci` | 排查和修复 **GitHub** Actions 中失败的 **PR** checks |
| `github:yeet` | 确认范围、commit、push，并按需创建 draft **PR** |

**具体说明：**

- `github:github`

  > **用途：**
  >
  > `github` 用于 **GitHub** 仓库、**PR**、issue 的定位、总结、triage 和上下文获取
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 github，总结这个 PR 的主要改动和风险
  > ```
  >
  > ```text
  > 使用 github，帮我看这个 issue 现在卡在哪里
  > ```
  >
  > **注意点：**
  >
  > 适合先理解 **GitHub** 上下文；具体修 **CI**、处理 review、发布 **PR** 时用更专门的 **GitHub** skills

- `github:gh-address-comments`

  > **用途：**
  >
  > `gh-address-comments` 用于处理 **PR** review comments，包括 unresolved threads、requested changes 和 inline comments
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 gh-address-comments，处理这个 PR 上还没解决的 review comments
  > ```
  >
  > **注意点：**
  >
  > 它会先读评论和上下文，再判断哪些建议真的需要改；不应该盲目照单全收

- `github:gh-fix-ci`

  > **用途：**
  >
  > `gh-fix-ci` 用于排查和修复 **GitHub** Actions 中失败的 **PR** checks
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 gh-fix-ci，排查这个 PR 的 failing checks
  > ```
  >
  > **注意点：**
  >
  > 应该先看 checks、job logs 和失败证据，再决定是否修改代码或配置

- `github:yeet`

  > **用途：**
  >
  > `yeet` 用于发布本地修改到 **GitHub**，包括确认范围、commit、push 和创建 draft **PR**
  >
  > **怎么调用：**
  >
  > ```text
  > 使用 yeet，把当前本地修改发布到 GitHub 并创建 draft PR
  > ```
  >
  > **注意点：**
  >
  > 发布前应该确认 diff 范围；用户只说“推送所有修改”时，不默认创建 **PR**，除非明确要求

### 十二、**Superpowers** 插件 skill 集合

**Superpowers** 是一组 **Agent** workflow skills，不是模型、不是运行时、也不是命令行工具；它让 **Codex** 在复杂开发任务中按更严格的工程流程工作

**常用 skills：**

| Skill | 什么时候用 |
|---|---|
| `superpowers:using-superpowers` | 每次开始任务时检查是否需要加载相关 skill |
| `superpowers:brainstorming` | 创意工作、功能设计、组件设计、行为修改前 |
| `superpowers:writing-plans` | 已有需求，需要拆成可执行计划时 |
| `superpowers:executing-plans` | 已经有计划，需要按检查点执行时 |
| `superpowers:test-driven-development` | 实现功能、修 bug、重构前，用测试先定义行为 |
| `superpowers:systematic-debugging` | 遇到 bug、测试失败或异常行为时，先系统排查根因 |
| `superpowers:verification-before-completion` | 声明完成、修复成功或测试通过前跑验证命令 |
| `superpowers:requesting-code-review` | 完成重要任务或合并前，需要独立审查时 |
| `superpowers:receiving-code-review` | 收到 review 意见后，先判断建议是否成立 |
| `superpowers:dispatching-parallel-agents` | 多个相互独立的任务可以并行处理时 |
| `superpowers:subagent-driven-development` | 执行计划中存在多个独立子任务时 |
| `superpowers:using-git-worktrees` | 需要隔离工作区或执行较大 feature work 时 |
| `superpowers:finishing-a-development-branch` | 实现完成、测试通过后，决定 merge、**PR** 或清理方式 |
| `superpowers:writing-skills` | 创建、修改或验证 **Codex** skill 时 |

**典型工作流：**

复杂功能开发：

```text
brainstorming -> writing-plans -> test-driven-development -> verification-before-completion -> requesting-code-review
```

bug 修复：

```text
systematic-debugging -> test-driven-development -> verification-before-completion
```

已有计划执行：

```text
executing-plans -> verification-before-completion -> finishing-a-development-branch
```

多任务并行：

```text
dispatching-parallel-agents -> subagent-driven-development -> 主 Agent 复核与整合
```

**怎么调用：**

一般不需要手动调用，**Codex** 会按任务判断是否触发

如果你想强制走某个流程，可以直接点名：

```text
使用 systematic-debugging，排查这个测试失败
```

```text
使用 writing-plans，先把这个功能拆成实现计划，不要直接改代码
```

```text
使用 test-driven-development，按 TDD 修这个 bug
```

```text
使用 verification-before-completion，确认这次修改是否真的完成
```

**注意点：**

`Superpowers` 是对 **Codex** 默认工程习惯的增强，不是替代 **Codex**

项目级规则仍然优先遵守 `AGENTS.md`

任务越复杂、风险越高、越需要验证，显式使用 **Superpowers** 越有价值

### 十三、design-md-picker

**用途：**

`design-md-picker` 用来为项目建立 **UI** 设计方向

它会从本地 `awesome-design-md` 参考库中挑选合适的 `DESIGN.md` 样本，再结合当前项目生成自己的 `DESIGN.md`

**适合什么时候用：**

- 新项目还没有 `DESIGN.md`
- 当前项目 **UI** 风格不统一，需要先定设计语言
- 想参考 **Linear**、**Vercel**、**Stripe**、**Cursor**、**Notion** 等产品气质
- 想让 **Codex** 在写 **UI** 代码前先明确颜色、字体、组件、布局和文案规则

**怎么调用：**

```text
使用 design-md-picker，参考本地 awesome-design-md，为当前项目生成一个 DESIGN.md
```

```text
使用 design-md-picker，在本地 awesome-design-md 中为这个项目推荐 3 个设计参考，只比较，不写文件
```

**注意点：**

本地参考库路径是：

```text
/Users/wangdong/workData/awesome-design-md/design-md
```

`awesome-design-md` 是参考库，不是 skill

不要原样复制第三方品牌的 `DESIGN.md`；应该抽象成当前项目自己的设计规则

### 十四、impeccable

**用途：**

`impeccable` 用来把前端 **UI** 做得更完整、更稳定、更接近生产级

它适合参与页面设计、组件设计、视觉审查、响应式检查、可访问性检查和最终 polish

**适合什么时候用：**

- 需要设计或重做一个页面
- 需要先做 **UX/UI** 方案，再进入实现
- 当前 **UI** 看起来粗糙、模板化、**AI** 味重
- 需要优化布局、间距、字体、颜色、动效或视觉层级
- 需要检查响应式、可访问性、文本溢出、空状态、错误状态

**怎么调用：**

```text
使用 impeccable shape 新的 onboarding flow，先给 UX/UI 方案，不要直接写代码
```

```text
使用 impeccable craft 当前首页，从信息架构到实现一起完成
```

```text
使用 impeccable critique 当前 landing page，指出视觉和体验问题
```

```text
使用 impeccable audit 设置页，重点检查响应式、可访问性和信息层级
```

```text
使用 impeccable polish 当前 dashboard 页面
```

**常用命令：**

| 命令 | 什么时候用 |
|---|---|
| `init` | 项目缺少产品和设计上下文时 |
| `document` | 想从已有代码反推 `DESIGN.md` 时 |
| `shape` | 想先做 **UX/UI** 方案时 |
| `craft` | 想从方案到实现完整推进时 |
| `critique` | 想审查体验和视觉问题时 |
| `audit` | 想检查响应式、可访问性、性能和技术质量时 |
| `polish` | 想做上线前打磨时 |
| `harden` | 想补齐错误态、空状态、i18n、文本溢出等边界时 |
| `layout` | 想修布局、间距和视觉层级时 |
| `typeset` | 想修字体、字号、行高和排版层级时 |
| `colorize` | 界面过于单调，想加入策略性颜色时 |
| `quieter` | 界面太吵、太重、动效过强时 |
| `bolder` | 界面太安全、太平、太模板化时 |

**注意点：**

`impeccable` 很依赖项目上下文

使用前最好让 **Codex** 读取当前项目的 `PRODUCT.md`、`DESIGN.md`、现有 CSS / tokens / theme，以及代表性页面或组件

如果项目没有 `DESIGN.md`，可以先用 `design-md-picker` 生成设计方向，也可以用 `impeccable document` 从已有代码反推

如果项目已经有成熟设计系统，`impeccable` 应该服从现有 tokens、组件边界和业务语境
