# TinyHabits 微习惯养成游戏 - 架构设计文档

> 版本: 1.0
> 更新日期: 2026-01-23
> 项目定位: 基于福格行为模型的习惯养成游戏化应用

---

## 目录

1. [系统概述](#1-系统概述)
2. [整体架构设计](#2-整体架构设计)
3. [前端架构 (微信小程序)](#3-前端架构-微信小程序)
4. [后端架构 (Node.js/Express)](#4-后端架构-nodejsexpress)
5. [数据模型设计](#5-数据模型设计)
6. [API 接口设计](#6-api-接口设计)
7. [认证授权机制](#7-认证授权机制)
8. [游戏化机制设计](#8-游戏化机制设计)
9. [技术栈选型](#9-技术栈选型)
10. [部署架构](#10-部署架构)
11. [扩展性设计](#11-扩展性设计)
12. [非功能性设计](#12-非功能性设计)

---

## 1. 系统概述

### 1.1 产品定位

TinyHabits 是一款**基于福格行为模型的习惯养成游戏化应用**，核心理念是将"方法论工具"升级为"可长期玩的成长型游戏"。

**产品目标:**
- 让用户**愿意玩** - 通过情绪价值、即时反馈、惊喜机制
- 让用户**被引导思考** - 愿望澄清、行为探索
- 让用户**自然形成行为** - 低摩擦、正反馈、成长感

### 1.2 核心概念映射

| 福格行为模型 | 游戏化表达 |
|------------|-----------|
| 愿望 (Aspiration) | 传说地图 / 愿望城 |
| 行为 (Behavior) | 魔法卡牌 / 咒语 |
| 能力 (Ability) | 法力值 |
| 提示 (Prompt) | 锚点触发 |
| 情绪奖励 (Celebration) | 进化动画 / 掉落物品 |

### 1.3 系统边界

```
+------------------------------------------------------------------+
|                        TinyHabits 系统边界                         |
|  +----------------+     +----------------+     +----------------+  |
|  |  微信小程序     |     |   后端服务      |     |   数据存储      |  |
|  |  (Frontend)    | <-> |   (Backend)    | <-> |   (MongoDB)    |  |
|  +----------------+     +----------------+     +----------------+  |
|          ^                      ^                                 |
|          |                      |                                 |
+----------|----------------------|--------------------------------+
           |                      |
    +------v------+        +------v------+
    | 微信开放平台  |        | 微信服务器   |
    | (用户入口)   |        | (登录认证)   |
    +-------------+        +-------------+
```

---

## 2. 整体架构设计

### 2.1 分层架构图

```mermaid
graph TB
    subgraph "表现层 (Presentation Layer)"
        MP[微信小程序]
        subgraph "页面模块"
            P1[首页 Dashboard]
            P2[习惯管理]
            P3[成就展示]
            P4[统计分析]
        end
    end

    subgraph "网关层 (Gateway Layer)"
        CORS[CORS 中间件]
        AUTH[JWT 认证中间件]
    end

    subgraph "应用层 (Application Layer)"
        subgraph "路由层"
            R1[/api/auth]
            R2[/api/wxauth]
            R3[/api/habits]
            R4[/api/stats]
        end
        subgraph "控制器层"
            C1[authController]
            C2[habitController]
            C3[statsController]
        end
    end

    subgraph "领域层 (Domain Layer)"
        M1[User Model]
        M2[Habit Model]
        M3[Achievement Logic]
        M4[Level System]
    end

    subgraph "基础设施层 (Infrastructure Layer)"
        DB[(MongoDB)]
        WX[微信API]
    end

    MP --> CORS
    CORS --> AUTH
    AUTH --> R1 & R2 & R3 & R4
    R1 & R2 --> C1
    R3 --> C2
    R4 --> C3
    C1 --> M1
    C2 --> M1 & M2
    C3 --> M1 & M2 & M3 & M4
    M1 & M2 --> DB
    C1 --> WX
```

### 2.2 核心能力矩阵

| 能力域 | 核心功能 | 技术实现 |
|-------|---------|---------|
| 用户管理 | 注册/登录/信息管理 | JWT + bcrypt + MongoDB |
| 习惯管理 | CRUD + 完成打卡 | RESTful API + Mongoose |
| 游戏化 | 积分/等级/成就/连续天数 | 业务逻辑计算 |
| 数据统计 | 历史记录/排行榜 | 聚合查询 |
| 微信集成 | 小程序登录/用户授权 | 微信开放平台 API |

### 2.3 请求处理流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant MP as 小程序
    participant GW as 网关层
    participant API as API服务
    participant DB as MongoDB
    participant WX as 微信服务器

    U->>MP: 操作触发

    alt 微信登录
        MP->>WX: wx.login() 获取 code
        WX-->>MP: 返回 code
        MP->>GW: POST /api/wxauth/login {code}
        GW->>API: 转发请求
        API->>WX: jscode2session 验证
        WX-->>API: 返回 openid + session_key
        API->>DB: 查询/创建用户
        DB-->>API: 用户数据
        API-->>GW: JWT Token
        GW-->>MP: 登录成功
    end

    alt 业务请求
        MP->>GW: 请求 + Bearer Token
        GW->>GW: JWT 验证
        GW->>API: 认证后请求
        API->>DB: 数据操作
        DB-->>API: 结果
        API-->>GW: 响应数据
        GW-->>MP: JSON Response
        MP->>U: UI 更新
    end
```

---

## 3. 前端架构 (微信小程序)

### 3.1 目录结构

```
miniprogram/
├── app.js                 # 全局逻辑与状态管理
├── app.json               # 全局配置 (页面路由/TabBar/窗口)
├── app.wxss               # 全局样式
├── project.config.json    # 项目配置
│
├── pages/                 # 页面目录
│   ├── index/             # 首页 (Dashboard)
│   │   ├── index.js       # 页面逻辑
│   │   ├── index.json     # 页面配置
│   │   ├── index.wxml     # 页面模板
│   │   └── index.wxss     # 页面样式
│   ├── habits/            # 习惯管理页
│   ├── achievements/      # 成就展示页
│   └── stats/             # 统计分析页
│
└── utils/                 # 工具函数
    ├── api.js             # API 请求封装
    ├── storage.js         # 本地存储封装
    ├── levels.js          # 等级系统逻辑
    ├── achievements.js    # 成就系统逻辑
    └── util.js            # 通用工具函数
```

### 3.2 全局状态管理

小程序采用 `App.globalData` 进行全局状态管理:

```mermaid
graph LR
    subgraph "globalData"
        UI[userInfo]
        API[apiUrl]
        GD[gameData]
    end

    subgraph "gameData 结构"
        S[score: 积分]
        ST[streak: 连续天数]
        BS[bestStreak: 最佳连续]
        L[level: 等级]
        H[habits: 习惯列表]
        TC[totalCompleted: 总完成数]
        LCD[lastCompletedDate]
        A[achievements: 成就列表]
    end

    GD --> S & ST & BS & L & H & TC & LCD & A
```

**状态持久化策略:**

```javascript
// 数据加载 (App.onLaunch)
loadGameData() {
  const data = wx.getStorageSync('gameData');
  if (data) {
    this.globalData.gameData = data;
    this.checkStreak();  // 校验连续天数
  }
}

// 数据保存 (变更时调用)
saveGameData() {
  wx.setStorageSync('gameData', this.globalData.gameData);
}
```

### 3.3 页面组件设计

```mermaid
graph TB
    subgraph "首页 (index)"
        D1[游戏数据展示]
        D2[习惯创建表单]
        D3[习惯列表]
        D4[庆祝动画组件]
        D5[掉落物品组件]
    end

    subgraph "习惯页 (habits)"
        H1[习惯详情卡片]
        H2[完成进度条]
    end

    subgraph "成就页 (achievements)"
        A1[成就网格]
        A2[解锁状态标识]
    end

    subgraph "统计页 (stats)"
        S1[数据概览]
        S2[历史记录]
        S3[排行榜]
    end
```

### 3.4 API 请求封装

```javascript
// utils/api.js 核心设计
const request = (options) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiUrl}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        'Authorization': wx.getStorageSync('token') || ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // 未授权处理
          wx.navigateTo({ url: '/pages/login/login' });
          reject(new Error('未授权'));
        } else {
          reject(new Error(res.data.message || '请求失败'));
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络错误', icon: 'none' });
        reject(err);
      }
    });
  });
};
```

### 3.5 TabBar 导航结构

```json
{
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#667eea",
    "list": [
      { "pagePath": "pages/index/index", "text": "首页" },
      { "pagePath": "pages/habits/habits", "text": "习惯" },
      { "pagePath": "pages/achievements/achievements", "text": "成就" },
      { "pagePath": "pages/stats/stats", "text": "统计" }
    ]
  }
}
```

---

## 4. 后端架构 (Node.js/Express)

### 4.1 目录结构

```
backend/
├── src/
│   ├── server.js              # 应用入口
│   ├── config/
│   │   └── database.js        # MongoDB 连接配置
│   ├── models/
│   │   ├── User.js            # 用户模型
│   │   └── Habit.js           # 习惯模型
│   ├── controllers/
│   │   ├── authController.js  # 认证控制器
│   │   ├── habitController.js # 习惯控制器
│   │   └── statsController.js # 统计控制器
│   ├── routes/
│   │   ├── auth.js            # 认证路由
│   │   ├── wxauth.js          # 微信认证路由
│   │   ├── habits.js          # 习惯路由
│   │   └── stats.js           # 统计路由
│   └── middleware/
│       └── auth.js            # JWT 认证中间件
├── .env                       # 环境变量
├── package.json
└── nodemon.json               # 开发热重载配置
```

### 4.2 中间件处理流程

```mermaid
graph LR
    REQ[请求] --> CORS[CORS 中间件]
    CORS --> JSON[JSON 解析]
    JSON --> LOG[请求日志]
    LOG --> ROUTE[路由匹配]

    subgraph "认证路由"
        ROUTE --> |/api/auth| AUTH_CTRL[authController]
        ROUTE --> |/api/wxauth| WX_CTRL[wxauthController]
    end

    subgraph "业务路由 (需认证)"
        ROUTE --> |/api/habits| JWT{JWT 验证}
        ROUTE --> |/api/stats| JWT
        JWT --> |通过| HABIT_CTRL[habitController]
        JWT --> |通过| STATS_CTRL[statsController]
        JWT --> |失败| ERR_401[401 Unauthorized]
    end

    AUTH_CTRL & WX_CTRL & HABIT_CTRL & STATS_CTRL --> RES[响应]
    ERR_401 --> RES
```

### 4.3 Express 服务器配置

```javascript
// server.js 核心配置
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

// 数据库连接
connectDB();

// CORS 配置 (支持微信小程序)
const corsOptions = {
  origin: function (origin, callback) {
    // 小程序请求可能没有 origin
    if (!origin || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(null, true); // 生产环境需配置白名单
    }
  },
  credentials: true
};
app.use(cors(corsOptions));

// 请求体解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由注册
app.use('/api/auth', require('./routes/auth'));
app.use('/api/wxauth', require('./routes/wxauth'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/stats', require('./routes/stats'));

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器错误'
  });
});
```

### 4.4 路由-控制器映射

| 路由模块 | 路径前缀 | 认证要求 | 控制器 |
|---------|---------|---------|--------|
| auth.js | /api/auth | 部分 | authController |
| wxauth.js | /api/wxauth | 无 | 内联处理 |
| habits.js | /api/habits | 全部 | habitController |
| stats.js | /api/stats | 全部 | statsController |

---

## 5. 数据模型设计

### 5.1 ER 关系图

```mermaid
erDiagram
    USER ||--o{ HABIT : owns

    USER {
        ObjectId _id PK
        String username
        String email UK
        String password
        String openid UK
        String nickname
        String avatar
        String sessionKey
        Object gameData
        Date createdAt
        Date updatedAt
    }

    HABIT {
        ObjectId _id PK
        ObjectId user FK
        String anchor
        String behavior
        String createdDate
        Number completedCount
        String lastCompleted
        Boolean isActive
        Array completionHistory
        Date createdAt
        Date updatedAt
    }
```

### 5.2 User 模型详细设计

```javascript
const userSchema = new mongoose.Schema({
  // === 传统认证字段 (可选) ===
  username: {
    type: String,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符']
  },
  email: {
    type: String,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, '邮箱格式无效']
  },
  password: {
    type: String,
    minlength: [6, '密码至少6个字符'],
    select: false  // 默认不返回密码
  },

  // === 微信认证字段 (主要) ===
  openid: {
    type: String,
    unique: true,
    sparse: true  // 允许 null 但唯一
  },
  nickname: {
    type: String,
    default: '微信用户'
  },
  avatar: {
    type: String,
    default: ''
  },
  sessionKey: {
    type: String,
    select: false  // 敏感字段不返回
  },

  // === 游戏数据 (嵌入式文档) ===
  gameData: {
    score: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    level: { type: String, default: '新手' },
    totalCompleted: { type: Number, default: 0 },
    lastCompletedDate: { type: String, default: null },
    achievements: [{ type: String }]  // 成就 ID 列表
  }
}, {
  timestamps: true  // 自动管理 createdAt/updatedAt
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 密码验证方法
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
```

### 5.3 Habit 模型详细设计

```javascript
const habitSchema = new mongoose.Schema({
  // 关联用户
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // 福格行为模型核心字段
  anchor: {
    type: String,
    required: [true, '请提供锚点'],
    trim: true,
    maxlength: [20, '锚点最多20个字符']
    // 例: "刷完牙后"、"起床后"
  },
  behavior: {
    type: String,
    required: [true, '请提供行为'],
    trim: true,
    maxlength: [30, '行为最多30个字符']
    // 例: "做2个深蹲"、"喝一杯水"
  },

  // 统计字段
  createdDate: {
    type: String,
    default: () => new Date().toLocaleDateString('zh-CN')
  },
  completedCount: {
    type: Number,
    default: 0
  },
  lastCompleted: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true  // 软删除标志
  },

  // 完成历史 (用于统计图表)
  completionHistory: [{
    date: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// 索引优化
habitSchema.index({ user: 1, isActive: 1 });      // 用户习惯列表查询
habitSchema.index({ user: 1, lastCompleted: 1 }); // 完成状态查询
```

### 5.4 数据流转图

```mermaid
graph TB
    subgraph "创建习惯"
        C1[用户输入 anchor + behavior]
        C2[创建 Habit 文档]
        C3[检查成就: first_habit / three_habits]
    end

    subgraph "完成习惯"
        D1[更新 Habit: completedCount++]
        D2[记录 completionHistory]
        D3[计算积分: 10 + streak * 2]
        D4[更新 User.gameData]
        D5[更新连续天数逻辑]
        D6[更新等级]
        D7[检查新成就]
    end

    C1 --> C2 --> C3
    D1 --> D2 --> D3 --> D4 --> D5 --> D6 --> D7
```

---

## 6. API 接口设计

### 6.1 接口总览

```mermaid
graph LR
    subgraph "认证 API"
        A1[POST /api/auth/register]
        A2[POST /api/auth/login]
        A3[GET /api/auth/me]
        A4[PUT /api/auth/gamedata]
    end

    subgraph "微信认证 API"
        W1[POST /api/wxauth/login]
        W2[PUT /api/wxauth/userinfo]
    end

    subgraph "习惯 API"
        H1[GET /api/habits]
        H2[POST /api/habits]
        H3[GET /api/habits/:id]
        H4[POST /api/habits/:id/complete]
        H5[DELETE /api/habits/:id]
    end

    subgraph "统计 API"
        S1[GET /api/stats]
        S2[GET /api/stats/achievements]
        S3[GET /api/stats/history]
        S4[GET /api/stats/leaderboard]
    end
```

### 6.2 接口详细规范

#### 6.2.1 认证接口

| 方法 | 路径 | 描述 | 认证 | 请求体 |
|-----|------|-----|------|-------|
| POST | /api/auth/register | 邮箱注册 | 无 | `{username, email, password}` |
| POST | /api/auth/login | 邮箱登录 | 无 | `{email, password}` |
| GET | /api/auth/me | 获取当前用户 | JWT | - |
| PUT | /api/auth/gamedata | 更新游戏数据 | JWT | `{gameData}` |
| POST | /api/wxauth/login | 微信登录 | 无 | `{code}` |
| PUT | /api/wxauth/userinfo | 更新用户信息 | JWT | `{nickname, avatar}` |

#### 6.2.2 习惯接口

| 方法 | 路径 | 描述 | 认证 | 请求体/参数 |
|-----|------|-----|------|------------|
| GET | /api/habits | 获取习惯列表 | JWT | - |
| POST | /api/habits | 创建习惯 | JWT | `{anchor, behavior}` |
| GET | /api/habits/:id | 获取单个习惯 | JWT | - |
| POST | /api/habits/:id/complete | 完成习惯 | JWT | - |
| DELETE | /api/habits/:id | 删除习惯 | JWT | - |

#### 6.2.3 统计接口

| 方法 | 路径 | 描述 | 认证 | 参数 |
|-----|------|-----|------|------|
| GET | /api/stats | 获取统计概览 | JWT | - |
| GET | /api/stats/achievements | 获取成就列表 | JWT | - |
| GET | /api/stats/history | 获取完成历史 | JWT | `?days=30` |
| GET | /api/stats/leaderboard | 获取排行榜 | JWT | - |

### 6.3 响应格式规范

**成功响应:**
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 具体数据
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "message": "错误描述"
}
```

### 6.4 完成习惯核心逻辑

```javascript
// habitController.completeHabit
exports.completeHabit = async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
  const today = new Date().toDateString();

  // 1. 幂等性检查: 今天是否已完成
  if (habit.lastCompleted === today) {
    return res.status(400).json({ success: false, message: '今天已完成' });
  }

  // 2. 更新习惯记录
  habit.completedCount += 1;
  habit.lastCompleted = today;
  habit.completionHistory.push({ date: today });
  await habit.save();

  // 3. 计算积分
  const user = await User.findById(req.user._id);
  const gameData = user.gameData;
  const points = 10 + gameData.streak * 2;  // 基础分 + 连续奖励
  gameData.score += points;
  gameData.totalCompleted += 1;

  // 4. 更新连续天数
  if (gameData.lastCompletedDate && gameData.lastCompletedDate !== today) {
    const lastDate = new Date(gameData.lastCompletedDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate.toDateString() === yesterday.toDateString()) {
      gameData.streak += 1;  // 连续
    } else {
      gameData.streak = 1;   // 断连重置
    }
  }
  gameData.lastCompletedDate = today;

  // 5. 更新最佳连续记录
  if (gameData.streak > gameData.bestStreak) {
    gameData.bestStreak = gameData.streak;
  }

  // 6. 更新等级
  const levels = [
    { threshold: 0, name: '新手' },
    { threshold: 50, name: '学徒' },
    { threshold: 150, name: '熟练者' },
    { threshold: 300, name: '专家' },
    { threshold: 500, name: '大师' },
    { threshold: 1000, name: '宗师' }
  ];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (gameData.score >= levels[i].threshold) {
      gameData.level = levels[i].name;
      break;
    }
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: '习惯完成!',
    data: { habit, points, gameData }
  });
};
```

---

## 7. 认证授权机制

### 7.1 双认证体系

系统支持两种认证方式，满足不同场景需求:

```mermaid
graph TB
    subgraph "认证方式一: 微信登录 (主要)"
        WX1[wx.login 获取 code]
        WX2[后端调用 jscode2session]
        WX3[获取 openid + session_key]
        WX4[创建/更新用户]
        WX5[生成 JWT Token]
    end

    subgraph "认证方式二: 邮箱密码 (备用)"
        EP1[用户输入 email + password]
        EP2[bcrypt 密码验证]
        EP3[生成 JWT Token]
    end

    WX1 --> WX2 --> WX3 --> WX4 --> WX5
    EP1 --> EP2 --> EP3

    WX5 --> JWT[JWT Token]
    EP3 --> JWT

    JWT --> AUTH[后续请求认证]
```

### 7.2 微信登录流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant MP as 小程序
    participant BE as 后端
    participant WX as 微信服务器

    U->>MP: 点击登录
    MP->>WX: wx.login()
    WX-->>MP: code (临时凭证)
    MP->>BE: POST /api/wxauth/login {code}
    BE->>WX: GET jscode2session?code=xxx
    WX-->>BE: {openid, session_key}

    alt 新用户
        BE->>BE: 创建 User (openid)
    else 老用户
        BE->>BE: 更新 session_key
    end

    BE->>BE: 生成 JWT (30天有效)
    BE-->>MP: {token, userInfo}
    MP->>MP: wx.setStorageSync('token', token)
    MP-->>U: 登录成功
```

### 7.3 JWT Token 设计

```javascript
// 生成 Token
exports.generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }  // 默认 30d
  );
};

// Token 验证中间件
exports.protect = async (req, res, next) => {
  let token;

  // 从 Header 获取 Token
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token 无效' });
  }
};
```

### 7.4 安全配置

| 安全项 | 实现方式 |
|-------|---------|
| 密码存储 | bcrypt (cost=10) 单向哈希 |
| Token 传输 | Bearer Token in Authorization Header |
| Token 有效期 | 30 天 (可配置) |
| 敏感字段保护 | Mongoose select: false |
| CORS | 白名单域名限制 |
| 请求体限制 | express.json() 默认 100kb |

---

## 8. 游戏化机制设计

### 8.1 核心游戏循环

```mermaid
graph LR
    A[创建习惯] --> B[每日完成]
    B --> C[获得积分]
    C --> D[等级提升]
    D --> E[解锁成就]
    E --> F[激励反馈]
    F --> B
```

### 8.2 积分系统

**计算公式:**
```
每次完成积分 = 基础分(10) + 连续天数 * 2
```

**示例:**
| 连续天数 | 单次积分 | 累计积分 |
|---------|---------|---------|
| Day 1 | 10 + 0*2 = 10 | 10 |
| Day 2 | 10 + 1*2 = 12 | 22 |
| Day 3 | 10 + 2*2 = 14 | 36 |
| Day 7 | 10 + 6*2 = 22 | 112 |
| Day 30 | 10 + 29*2 = 68 | 1170 |

### 8.3 等级系统

```mermaid
graph LR
    L1[新手<br/>0分] --> L2[学徒<br/>50分]
    L2 --> L3[熟练者<br/>150分]
    L3 --> L4[专家<br/>300分]
    L4 --> L5[大师<br/>500分]
    L5 --> L6[宗师<br/>1000分]
    L6 --> L7[传奇<br/>2000分]
```

**等级配置:**
```javascript
const levels = [
  { threshold: 0, name: '新手', icon: '🌱' },
  { threshold: 50, name: '学徒', icon: '🌿' },
  { threshold: 150, name: '熟练者', icon: '🍀' },
  { threshold: 300, name: '专家', icon: '🌳' },
  { threshold: 500, name: '大师', icon: '⭐' },
  { threshold: 1000, name: '宗师', icon: '👑' },
  { threshold: 2000, name: '传奇', icon: '💫' }
];
```

### 8.4 成就系统

```mermaid
graph TB
    subgraph "习惯创建成就"
        A1[破冰者: 创建1个习惯]
        A2[多面手: 创建3个习惯]
        A3[习惯大师: 创建5个习惯]
    end

    subgraph "完成次数成就"
        B1[首战告捷: 完成1次]
        B2[坚持不懈: 完成10次]
        B3[行动派: 完成50次]
        B4[超级执行者: 完成100次]
    end

    subgraph "连续天数成就"
        C1[三日之约: 连续3天]
        C2[一周达人: 连续7天]
        C3[月度冠军: 连续30天]
        C4[百日筑基: 连续100天]
    end

    subgraph "积分成就"
        D1[百分成就: 100分]
        D2[五百强者: 500分]
        D3[千分传奇: 1000分]
    end
```

**成就检查逻辑:**
```javascript
const checkAchievements = (user, habitCount) => {
  const checks = [
    { id: 'first_habit', condition: habitCount >= 1 },
    { id: 'three_habits', condition: habitCount >= 3 },
    { id: 'first_complete', condition: user.gameData.totalCompleted >= 1 },
    { id: 'ten_complete', condition: user.gameData.totalCompleted >= 10 },
    { id: 'streak_3', condition: user.gameData.streak >= 3 },
    { id: 'streak_7', condition: user.gameData.streak >= 7 },
    { id: 'streak_30', condition: user.gameData.streak >= 30 },
    { id: 'score_100', condition: user.gameData.score >= 100 },
    { id: 'score_500', condition: user.gameData.score >= 500 }
  ];

  return checks.filter(c =>
    c.condition && !user.gameData.achievements.includes(c.id)
  );
};
```

### 8.5 即时反馈机制

**庆祝动画触发:**
```javascript
// 完成习惯时
const celebrations = [
  '太棒了!继续保持!',
  '你做到了!',
  '很好!习惯正在养成!',
  '优秀!坚持就是胜利!'
];

showCelebrationMessage(points) {
  const randomMessage = celebrations[Math.floor(Math.random() * celebrations.length)];
  this.setData({
    showCelebration: true,
    celebrationText: `${randomMessage}\n+${points} 分`
  });

  // 2秒后自动隐藏
  setTimeout(() => this.setData({ showCelebration: false }), 2000);
}
```

**掉落物品收集:**
```javascript
const fallingItemsConfig = [
  { emoji: '⭐', points: 5, name: '星星' },
  { emoji: '💎', points: 10, name: '钻石' },
  { emoji: '🏆', points: 20, name: '奖杯' },
  { emoji: '💰', points: 25, name: '金币' }
];
```

---

## 9. 技术栈选型

### 9.1 技术全景图

```mermaid
graph TB
    subgraph "前端 (小程序)"
        MP_F[微信小程序框架]
        WXML[WXML 模板]
        WXSS[WXSS 样式]
        WX_API[wx.* API]
    end

    subgraph "后端"
        NODE[Node.js v18+]
        EXPRESS[Express.js v4.18]
        MONGOOSE[Mongoose v8.0]
    end

    subgraph "数据存储"
        MONGO[(MongoDB v6+)]
        WX_STORAGE[wx.storage 本地存储]
    end

    subgraph "认证与安全"
        JWT[jsonwebtoken v9]
        BCRYPT[bcryptjs v2.4]
    end

    subgraph "开发工具"
        NODEMON[nodemon v3]
        DOTENV[dotenv v16]
    end

    subgraph "外部服务"
        WX_SRV[微信开放平台]
    end
```

### 9.2 依赖清单

**后端 (backend/package.json):**

| 包名 | 版本 | 用途 |
|-----|-----|------|
| express | ^4.18.2 | Web 框架 |
| mongoose | ^8.0.3 | MongoDB ODM |
| bcryptjs | ^2.4.3 | 密码哈希 |
| jsonwebtoken | ^9.0.2 | JWT 认证 |
| dotenv | ^16.3.1 | 环境变量 |
| cors | ^2.8.5 | 跨域处理 |
| express-validator | ^7.0.1 | 请求校验 |
| axios | ^1.6.0 | HTTP 客户端 (微信 API) |
| nodemon | ^3.0.2 | 开发热重载 (dev) |

### 9.3 选型理由

| 技术 | 选型理由 |
|-----|---------|
| **微信小程序** | 目标用户主要在微信生态，无需下载安装，用完即走 |
| **Node.js** | JavaScript 全栈统一，异步 I/O 适合处理并发请求 |
| **Express** | 轻量灵活，生态成熟，中间件丰富 |
| **MongoDB** | 文档型数据库，Schema 灵活，适合快速迭代 |
| **Mongoose** | 提供 Schema 验证和中间件，简化数据操作 |
| **JWT** | 无状态认证，适合移动端，易于扩展 |

---

## 10. 部署架构

### 10.1 部署拓扑图

```mermaid
graph TB
    subgraph "用户端"
        U[用户手机]
        MP[微信小程序]
    end

    subgraph "微信云"
        WX_MP[小程序代码包]
        WX_CDN[静态资源 CDN]
    end

    subgraph "云服务器"
        subgraph "应用层"
            NGINX[Nginx 反向代理]
            PM2[PM2 进程管理]
            APP[Node.js 应用]
        end

        subgraph "数据层"
            MONGO[(MongoDB)]
        end
    end

    subgraph "微信开放平台"
        WX_API[登录认证 API]
    end

    U --> MP
    MP --> WX_MP
    MP --> NGINX
    NGINX --> PM2
    PM2 --> APP
    APP --> MONGO
    APP --> WX_API
```

### 10.2 环境配置

**开发环境 (.env.development):**
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tinyhabits_dev
JWT_SECRET=dev-secret-key
JWT_EXPIRE=30d
WX_APPID=your-dev-appid
WX_SECRET=your-dev-secret
```

**生产环境 (.env.production):**
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://user:pass@mongodb-host:27017/tinyhabits?authSource=admin
JWT_SECRET=<强随机密钥>
JWT_EXPIRE=30d
WX_APPID=your-prod-appid
WX_SECRET=your-prod-secret
```

### 10.3 启动命令

```bash
# 开发模式 (热重载)
npm run dev

# 生产模式
npm start

# 使用 PM2 (推荐)
pm2 start src/server.js --name tinyhabits-api
pm2 startup  # 开机自启
pm2 save
```

### 10.4 Nginx 配置示例

```nginx
server {
    listen 443 ssl http2;
    server_name api.tinyhabits.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://127.0.0.1:3000/health;
    }
}
```

### 10.5 健康检查

```bash
# 本地检查
curl http://localhost:3000/health

# 响应示例
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-23T00:00:00.000Z"
}
```

---

## 11. 扩展性设计

### 11.1 模块化扩展

```mermaid
graph TB
    subgraph "当前实现"
        M1[用户模块]
        M2[习惯模块]
        M3[成就模块]
        M4[统计模块]
    end

    subgraph "可扩展模块"
        E1[社交模块]
        E2[提醒模块]
        E3[主题模块]
        E4[导出模块]
    end

    M1 --> E1
    M2 --> E2
    M3 --> E3
    M4 --> E4
```

### 11.2 数据模型扩展

**习惯分类支持:**
```javascript
// 扩展 Habit Schema
habitSchema.add({
  category: {
    type: String,
    enum: ['健康', '学习', '工作', '生活', '其他'],
    default: '其他'
  },
  tags: [String],
  reminder: {
    enabled: Boolean,
    time: String  // "08:00"
  }
});
```

**社交功能支持:**
```javascript
// 扩展 User Schema
userSchema.add({
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  privacy: {
    showOnLeaderboard: { type: Boolean, default: true },
    showStreak: { type: Boolean, default: true }
  }
});
```

### 11.3 API 版本化

```javascript
// 路由版本化
app.use('/api/v1/auth', require('./routes/v1/auth'));
app.use('/api/v1/habits', require('./routes/v1/habits'));

// 未来版本
app.use('/api/v2/habits', require('./routes/v2/habits'));
```

### 11.4 缓存层扩展

```mermaid
graph LR
    CLIENT[客户端] --> API[API 服务]
    API --> REDIS[(Redis 缓存)]
    REDIS --> MONGO[(MongoDB)]

    subgraph "缓存策略"
        C1[用户游戏数据: 5分钟]
        C2[排行榜: 1小时]
        C3[成就定义: 24小时]
    end
```

---

## 12. 非功能性设计

### 12.1 性能设计

| 指标 | 目标 | 实现方式 |
|-----|-----|---------|
| API 响应时间 | < 200ms (P95) | 数据库索引优化 |
| 并发用户 | 1000 QPS | Node.js 集群模式 |
| 数据库查询 | < 50ms | 复合索引 + 查询优化 |

**索引策略:**
```javascript
// Habit 索引
habitSchema.index({ user: 1, isActive: 1 });
habitSchema.index({ user: 1, lastCompleted: 1 });

// User 索引 (openid 唯一索引自动创建)
```

### 12.2 可用性设计

```mermaid
graph TB
    subgraph "高可用架构"
        LB[负载均衡]
        N1[Node 实例 1]
        N2[Node 实例 2]
        N3[Node 实例 3]

        RS[(MongoDB 副本集)]
        M1[Primary]
        M2[Secondary]
        M3[Arbiter]
    end

    LB --> N1 & N2 & N3
    N1 & N2 & N3 --> RS
    M1 --- M2 --- M3
```

### 12.3 容错与降级

```javascript
// 数据库连接重试
const connectDB = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB Connected');
      return;
    } catch (error) {
      retries--;
      console.log(`连接失败，剩余重试次数: ${retries}`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  process.exit(1);
};

// 微信 API 降级
const wxLogin = async (code) => {
  try {
    const response = await axios.get(WX_URL, { timeout: 5000 });
    return response.data;
  } catch (error) {
    // 降级: 使用本地 Mock 或返回友好错误
    throw new Error('微信服务暂不可用，请稍后重试');
  }
};
```

### 12.4 日志与监控

**日志分级:**
```javascript
// 开发环境请求日志
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// 错误日志
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.stack}`);
  // 生产环境: 接入日志服务 (如 Sentry, ELK)
  res.status(err.status || 500).json({
    success: false,
    message: err.message
  });
});
```

### 12.5 安全设计

| 安全措施 | 实现 |
|---------|-----|
| XSS 防护 | 输入校验 + 输出转义 |
| SQL 注入 | Mongoose 参数化查询 |
| CSRF | 无状态 JWT (无需) |
| 敏感信息 | 环境变量 + select: false |
| 速率限制 | express-rate-limit (建议) |
| HTTPS | Nginx SSL 终结 |

**建议添加速率限制:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 每个 IP 100 次请求
});

app.use('/api/', limiter);
```

---

## 附录

### A. 项目文件结构总览

```
tinyhabits/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── server.js           # Express 应用入口
│   │   ├── config/
│   │   │   └── database.js     # MongoDB 连接
│   │   ├── models/
│   │   │   ├── User.js         # 用户模型
│   │   │   └── Habit.js        # 习惯模型
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── habitController.js
│   │   │   └── statsController.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── wxauth.js
│   │   │   ├── habits.js
│   │   │   └── stats.js
│   │   └── middleware/
│   │       └── auth.js         # JWT 中间件
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── miniprogram/                # 微信小程序
│   ├── app.js                  # 全局逻辑
│   ├── app.json                # 全局配置
│   ├── app.wxss                # 全局样式
│   ├── pages/
│   │   ├── index/              # 首页
│   │   ├── habits/             # 习惯页
│   │   ├── achievements/       # 成就页
│   │   └── stats/              # 统计页
│   └── utils/
│       ├── api.js              # API 封装
│       ├── storage.js          # 存储封装
│       ├── levels.js           # 等级逻辑
│       ├── achievements.js     # 成就逻辑
│       └── util.js             # 工具函数
│
├── docs/                       # 文档
│   ├── design/                 # 设计文档
│   ├── api/                    # API 文档
│   └── architecture.md         # 本文档
│
├── CLAUDE.md                   # 开发指南
└── package.json                # 项目脚本
```

### B. 快速启动指南

```bash
# 1. 启动 MongoDB
mongod --dbpath /data/db

# 2. 配置环境变量
cd backend
cp .env.example .env
# 编辑 .env 填入实际配置

# 3. 安装依赖
npm install

# 4. 启动后端服务
npm run dev

# 5. 健康检查
curl http://localhost:3000/health

# 6. 使用微信开发者工具打开 miniprogram/ 目录
```

### C. 关键配置项

| 配置项 | 说明 | 默认值 |
|-------|-----|-------|
| PORT | 服务端口 | 3000 |
| MONGODB_URI | 数据库连接 | mongodb://localhost:27017/tinyhabits |
| JWT_SECRET | JWT 密钥 | 必须设置 |
| JWT_EXPIRE | Token 有效期 | 30d |
| WX_APPID | 小程序 AppID | 必须设置 |
| WX_SECRET | 小程序 Secret | 必须设置 |

---

*文档结束*
