> 适用范围：微信小程序 MVP（不依赖外部 UI 库、不依赖 npm），用于 Claude Code 生成统一的“多邻国式轻量游戏化界面”实现代码。  
> 核心目标：好玩（强反馈）、耐看（低信息密度）、可坚持（温和引导 + 低摩擦）。

---

## 1. 目标与风格基线（必须遵守）

。请严格按以下 UI 标准实现一个“多邻国式轻量游戏化界面”的福格微习惯游戏 MVP。

### 1.1 视觉风格
- 2D 扁平卡通 + 轻魔法主题，圆角大、阴影轻、布局干净留白多  
- 强交互反馈：按压缩放、弹跳回弹、渐变高光、轻粒子/闪光（用纯 CSS/WXSS 动画模拟）  
- 颜色明亮但不刺眼，禁止荧光色、禁止高对比重阴影  
- 字体层级清晰，文案短，避免信息密度过高  
- 插画与 UI 融合：用渐变、几何图形、伪元素模拟“场景插画占位”，但必须统一

### 1.2 适配与开发约束
- 微信小程序，竖屏优先  
- 不使用外部 UI 库，不依赖 npm  
- 动效用 WXSS `@keyframes` + class 切换实现  
- 所有页面复用同一套组件样式类（集中写在 `app.wxss`）  
- 交互反馈必须可见：任何可点击元素都要有按压效果（缩放/亮度变化）

---

## 2. 全局设计令牌（Design Tokens：尺寸/圆角/间距/字体）

> 在 `app.wxss` 定义统一 CSS 变量（微信小程序支持 CSS 变量），并全局复用。  
> 命名规范：`--page-pad`、`--radius-card` 等。

### 2.1 尺寸与间距
- 页面内边距：`--page-pad: 20rpx`
- 卡片圆角：`--radius-card: 28rpx`
- 按钮圆角：`--radius-btn: 999rpx`
- 气泡圆角：`--radius-bubble: 999rpx`
- 元素间距（小）：`--gap-sm: 12rpx`
- 元素间距（中）：`--gap-md: 20rpx`
- 元素间距（大）：`--gap-lg: 32rpx`
- 卡片内边距：`--card-pad: 22rpx`
- 顶部场景插画高度：`--scene-h: 280rpx`
- 底部操作栏最小高度：`--footer-h: 140rpx`

### 2.2 字体与层级
- 标题（H1）：`--font-h1: 44rpx`（粗体）
- 标题（H2）：`--font-h2: 34rpx`（半粗）
- 正文：`--font-body: 28rpx`
- 辅助：`--font-sub: 24rpx`
- 标签/备注：`--font-cap: 22rpx`
- 行高：正文 `1.4`，标题 `1.2`

### 2.3 阴影与描边（轻量）
- 卡片阴影：`--shadow-card: 0 12rpx 30rpx rgba(0,0,0,0.06)`
- 按钮阴影：`--shadow-btn: 0 10rpx 24rpx rgba(0,0,0,0.08)`
- 描边：`--stroke-soft: 1rpx solid rgba(0,0,0,0.06)`

---

## 3. 颜色系统（Duolingo-like：清爽耐看）

> 在 `app.wxss` 定义颜色变量。禁止自行扩展到“霓虹/高饱和”。

### 3.1 基础色
- 背景奶白：`--c-bg: #FAFBFF`
- 主文本深蓝灰：`--c-text: #1F2A37`
- 次文本灰：`--c-subtext: rgba(31,42,55,0.65)`
- 线条/分割：`--c-line: rgba(31,42,55,0.10)`

### 3.2 魔法主题色（轻渐变）
- 微光金：`--c-gold: #F6C85F`
- 湖蓝：`--c-cyan: #5EC8D8`
- 柔紫：`--c-purple: #8A7DFF`

### 3.3 状态色（克制使用）
- 成功绿：`--c-ok: #2ECC71`（仅用于小提示/小图标）
- 警示橙：`--c-warn: #FFB020`（仅用于轻提示）
- 裂隙紫黑：`--c-rift: #2B1B3D`

### 3.4 推荐背景渐变（用于场景插画占位）
- 主页场景：`linear-gradient(180deg, rgba(94,200,216,0.26), rgba(250,251,255,1))`
- 工坊场景：`linear-gradient(180deg, rgba(138,125,255,0.22), rgba(250,251,255,1))`
- 每日场景：`linear-gradient(180deg, rgba(246,200,95,0.28), rgba(250,251,255,1))`

---

## 4. 组件规范（必须抽象成可复用 class）

> 目标：所有页面复用同一套组件 class，避免重复写样式。  
> 必须在 `app.wxss` 定义以下组件 class。

### 4.1 PageShell（页面骨架）
**结构建议（每页统一）**
- `.page`：根容器
- `.sceneHeader`：顶部场景插画占位区
- `.dialogueWrap`：角色对话区域（固定在场景下方）
- `.content`：核心交互区域
- `.footer`：底部按钮区（固定/粘底）

**样式要求**
- 背景：`--c-bg`
- 页面 padding：`--page-pad`
- 底部 `footer` 必须留安全区（`padding-bottom: env(safe-area-inset-bottom)`）

---

### 4.2 DialogueBubble（角色对话框｜强一致性）
每页顶部必须有一个“角色对话框”，像多邻国教练提示。

**构成**
- 左侧：头像占位（圆形 84rpx）
- 右侧：对话卡片（圆角、浅底色、1~2行文案）

**尺寸**
- 头像：84rpx × 84rpx
- 对话框圆角：24rpx
- 对话框 padding：16rpx 18rpx

**颜色**
- 对话框底色：`rgba(255,255,255,0.86)`
- 描边：`--stroke-soft`

**动效**
- 对话出现：`opacity 0→1` + `translateY 10→0`（200ms）
- Arc 头像呼吸：`glowPulse`（3.5s 无限循环）

---

### 4.3 MainCard（核心卡片）
用于：愿望卡、每日咒语卡、结果卡等。

**要求**
- 圆角：`--radius-card`
- 阴影：`--shadow-card`
- 描边：`--stroke-soft`
- padding：`--card-pad`
- 可点击：按压缩放 + 回弹

**按压反馈**
- 按下：`scale(0.98)`（120ms）
- 释放：回到 `scale(1.0)`（180ms，ease-out）

---

### 4.4 PrimaryButton（主按钮｜必须“爽”）
**尺寸**
- 高度：96rpx
- 圆角：`--radius-btn`
- 宽度：100%

**样式**
- 背景：金色渐变  
  `linear-gradient(90deg, rgba(246,200,95,1), rgba(94,200,216,1))`
- 阴影：`--shadow-btn`
- 文本：建议深色 `--c-text` 或白色（需确保对比）

**动效**
- 按下：`scale(0.96)`（100ms）+ 阴影变浅
- 点击成功：`shimmer` 光带扫过（200ms）

---

### 4.5 SecondaryButton（次按钮）
用于：返回、跳过、召唤灵感、裂变、合成等。
- 高度：84rpx
- 圆角：`--radius-btn`
- 背景：白色
- 描边：`--stroke-soft`
- 文本：`--c-text`
- 按压：`scale(0.98)`（120ms）

---

### 4.6 BubbleChip（行为气泡｜果冻泡泡）
用于：工坊“行为气泡”
- 圆角：`--radius-bubble`
- padding：16rpx 18rpx
- 背景：`rgba(94,200,216,0.18)`
- 高光：伪元素 `::after`（半透明白渐变）
- 点击：`bubblePop`（scale 1.05→1.0，180ms）

---

### 4.7 TagPill（标签：时长/难度）
- 高度：44rpx
- padding：0 14rpx
- 圆角：999rpx
- 背景：`rgba(31,42,55,0.06)` 或 `rgba(138,125,255,0.12)`
- 文本：`--font-cap`

---

## 5. 页面布局标准（MVP五页必须一致）

> 统一布局规则：顶部场景 + 对话框 + 核心卡片/交互 + 底部按钮（粘底）。

### 5.1 Onboarding 开场页
- `sceneHeader`：愿望城 + 裂隙占位（渐变背景 + 右上角裂纹伪元素）
- `content`：H1 + 2行以内副标题
- `footer`：PrimaryButton「开始修复」

**动效**
- 背景渐变缓慢流动（4s循环）
- Arc 头像呼吸

---

### 5.2 Role 角色创建页
- `dialogueWrap`：Arc 台词
- `content`：四张天赋卡（2×2 网格）
- `footer`：PrimaryButton「确认天赋」

**卡片状态**
- 选中态：边框高亮（微光金）+ 小弹跳（120ms）
- 未选态：普通白卡

---

### 5.3 Wishes 愿望排序页（两两对决 → 命运盘）
**阶段A：两两对决**
- 顶部：Arc/MIA 对话框
- 中部：两张愿望卡左右并列（间距 `--gap-md`）
- 底部：PrimaryButton「选择」或点击卡片选择（必须有反馈）

**阶段B：命运盘**
- 中部：三圈命运盘（用三层圆形容器模拟即可）
- 交互：至少支持点击替换“核心愿望”（真拖拽可选）
- 底部：PrimaryButton「确认核心愿望」

**动效**
- 选择卡片：`cardBounce` + `sparkleFlash`
- 阶段切换：淡出/淡入（180ms）

---

### 5.4 Workshop 行为工坊页
- 顶部：MIA 对话框
- 中部：愿望水晶（发光圆） + 行为气泡区（横向流/换行）
- 底部：三个 SecondaryButton（召唤/裂变/合成）+ PrimaryButton「生成今日卡组」

**工坊动效**
- 召唤：3个 Bubble 依次弹出（stagger 80ms）
- 裂变：一个 Bubble 替换为3个（列表替换 + 动画）
- 合成：两个 Bubble 消失 + 新卡闪光出现

---

### 5.5 Daily 每日一张微行动卡页
- 顶部：Arc 或 Rift 对话框
- 中部：今日咒语卡（大 MainCard）+ TagPill（时长/难度）
- 底部：PrimaryButton「开始施放/完成」
- 完成后：弹出“裂隙宣言卡” + SecondaryButton「击碎裂隙」

**完成动效（必须三段式）**
1) 完成：裂隙卡从底部滑入（200ms）
2) 击碎：裂隙卡抖动→碎片散开（220ms）
3) 背景变亮一点点（渐变切换或滤镜）
4) Arc 星尘闪一下（200ms）

---

## 6. 动效参数表（统一时序）

### 6.1 基础过渡
- 淡入淡出：180ms
- 卡片弹跳：180ms
- 按压缩放：100~120ms
- 回弹：160~220ms（ease-out）

### 6.2 关键动效（必须实现）
- 对话出现：`opacity 0→1` + `translateY 10→0`（200ms）
- 卡片选中：`scale 1→1.03→1`（180ms）
- 气泡出现：`scale 0.8→1`（160ms）
- 裂隙击碎：`riftShake 120ms` + `riftExplode 220ms`
- 闪光扫过：`shimmer 200ms`
- 光晕呼吸：`glowPulse 3.5s infinite`

---

## 7. 插画/图标占位规范（MVP无美术也要像游戏）

### 7.1 角色头像占位
- Arc：金色渐变圆 + 两个白色眼睛点（呼吸发光）
- MIA：青蓝渐变圆 + 星形贴片（可用伪元素）
- Rift：紫黑渐变圆 + 两个紫色眼睛点（出现时抖动）

### 7.2 场景占位
- Onboarding：顶部渐变 + 右上角裂纹线条（伪元素）
- Workshop：中心水晶发光圆（`glowPulse`）
- Daily：愿望城光晕圆 + 角落雾团（低透明）

---

## 8. 交互反馈规则（必须让用户“感觉在玩”）

### 8.1 点击反馈（全局强制）
- 所有可点击元素必须有按压缩放（按钮/卡片/气泡）
- 禁止“点击无反馈”的交互

### 8.2 成功反馈（全局）
- 生成卡组：弹出轻 toast 卡片 + `sparkleFlash`
- 完成今日卡：必须出现“裂隙→击碎→背景变亮”的三段式反馈

### 8.3 失败/未完成（温和）
- 不使用红色惩罚，不出现羞辱语气
- 仅提示“救援咒语已准备好”，仍使用 PrimaryButton 让用户轻松继续

---

## 9. UI验收标准（Claude Code 输出必须满足）

1) **一致性**：五个页面都使用统一 PageShell、DialogueBubble、MainCard、PrimaryButton  
2) **强反馈**：任何主要按钮点击都有缩放反馈  
3) **关键爽点可见**：Daily 的击碎裂隙动画必须存在  
4) **可读性**：每页文字不超过屏幕的 30%，以卡片+图形表达为主  
5) **像多邻国**：圆角大、颜色清爽、动效轻快、角色陪伴感明显  
6) **无外部依赖**：不引用外部 UI 库/图片资源也能呈现“游戏感”

---

## 10. Claude Code 实现指令（必须照做）

请你在生成小程序代码时：

- 在 `app.wxss` 定义上述 token 变量与全局 class  
- 每个页面结构固定为：`page → sceneHeader → dialogueWrap → content → footer`  
- 所有按钮和卡片统一复用 class（不要重复写样式）  
- 动效通过 class 切换触发（如 `isPressed`, `isAnimating`, `isShatter`）  
- 所有 `@keyframes` 集中写在 `app.wxss`  
- 页面 JS 只负责切换状态，不把 UI 动画逻辑写死在 JS 里（只切 class）

> 请直接生成完整可运行代码，不要只输出建议。
