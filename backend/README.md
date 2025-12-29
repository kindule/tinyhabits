# 微习惯养成游戏 - 后端 API

基于 Node.js + Express + MongoDB 的 RESTful API 服务。

## 功能特性

- 🔐 用户注册和登录（JWT 认证）
- 📝 习惯 CRUD 管理
- ✅ 习惯完成跟踪
- 🏆 成就系统
- 📊 统计数据
- 🔥 连续天数计算
- 🎮 游戏化数据（分数、等级）

## 技术栈

- Node.js & Express
- MongoDB & Mongoose
- JWT 认证
- bcryptjs 密码加密

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tinyhabits
JWT_SECRET=your_secure_random_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. 启动 MongoDB

确保 MongoDB 已安装并运行：

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# 或使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. 运行服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器将运行在 `http://localhost:3000`

## API 文档

### 认证 API

#### 注册
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

#### 登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

#### 获取当前用户信息
```
GET /api/auth/me
Authorization: Bearer <token>
```

#### 更新游戏数据
```
PUT /api/auth/gamedata
Authorization: Bearer <token>
Content-Type: application/json

{
  "gameData": {
    "score": 100,
    "streak": 5,
    "level": "学徒"
  }
}
```

### 习惯管理 API

#### 获取所有习惯
```
GET /api/habits
Authorization: Bearer <token>
```

#### 创建习惯
```
POST /api/habits
Authorization: Bearer <token>
Content-Type: application/json

{
  "anchor": "刷完牙",
  "behavior": "做2个深蹲"
}
```

#### 获取单个习惯
```
GET /api/habits/:id
Authorization: Bearer <token>
```

#### 完成习惯
```
POST /api/habits/:id/complete
Authorization: Bearer <token>
```

#### 删除习惯
```
DELETE /api/habits/:id
Authorization: Bearer <token>
```

### 统计 API

#### 获取统计数据
```
GET /api/stats
Authorization: Bearer <token>
```

#### 获取成就列表
```
GET /api/stats/achievements
Authorization: Bearer <token>
```

#### 获取完成历史
```
GET /api/stats/history?days=30
Authorization: Bearer <token>
```

#### 获取排行榜
```
GET /api/stats/leaderboard
Authorization: Bearer <token>
```

### 健康检查
```
GET /health
```

## 数据模型

### User（用户）

```javascript
{
  username: String,      // 用户名（唯一）
  email: String,        // 邮箱（唯一）
  password: String,     // 加密密码
  gameData: {
    score: Number,           // 总分
    streak: Number,          // 当前连续天数
    bestStreak: Number,      // 最佳连续天数
    level: String,           // 等级
    totalCompleted: Number,  // 累计完成次数
    lastCompletedDate: String,
    achievements: [String]   // 已解锁成就
  },
  createdAt: Date
}
```

### Habit（习惯）

```javascript
{
  user: ObjectId,           // 用户ID（外键）
  anchor: String,          // 锚点（触发条件）
  behavior: String,        // 行为（要做的事）
  createdDate: String,     // 创建日期
  completedCount: Number,  // 完成次数
  lastCompleted: String,   // 最后完成日期
  isActive: Boolean,       // 是否激活
  completionHistory: [{    // 完成历史
    date: String,
    timestamp: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 成就系统

| ID | 图标 | 名称 | 描述 |
|---|---|---|---|
| first_habit | 🌱 | 破冰者 | 创建第一个习惯 |
| three_habits | 🎯 | 多面手 | 创建3个习惯 |
| first_complete | ✨ | 首战告捷 | 完成第一个习惯 |
| ten_complete | 💪 | 坚持不懈 | 累计完成10次 |
| streak_3 | 🔥 | 三日之约 | 连续3天 |
| streak_7 | ⭐ | 一周达人 | 连续7天 |
| streak_30 | 👑 | 月度冠军 | 连续30天 |
| score_100 | 🏅 | 百分成就 | 总分达到100 |
| score_500 | 💎 | 五百强者 | 总分达到500 |

## 等级系统

| 分数阈值 | 等级名称 |
|---------|---------|
| 0 | 新手 |
| 50 | 学徒 |
| 150 | 熟练者 |
| 300 | 专家 |
| 500 | 大师 |
| 1000 | 宗师 |

## 分数计算规则

每完成一个习惯的分数：
```
基础分数 = 10
连续奖励 = 连续天数 × 2
总分 = 基础分数 + 连续奖励
```

## 项目结构

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # 数据库连接配置
│   ├── models/
│   │   ├── User.js              # 用户模型
│   │   └── Habit.js             # 习惯模型
│   ├── controllers/
│   │   ├── authController.js    # 认证控制器
│   │   ├── habitController.js   # 习惯控制器
│   │   └── statsController.js   # 统计控制器
│   ├── routes/
│   │   ├── auth.js              # 认证路由
│   │   ├── habits.js            # 习惯路由
│   │   └── stats.js             # 统计路由
│   ├── middleware/
│   │   └── auth.js              # JWT 认证中间件
│   └── server.js                # 主服务器文件
├── .env.example                 # 环境变量模板
├── .gitignore
├── package.json
└── README.md
```

## 开发建议

1. **安全性**
   - 生产环境务必修改 `JWT_SECRET`
   - 使用 HTTPS
   - 限制 CORS 来源

2. **性能优化**
   - 为常用查询添加数据库索引
   - 实现数据缓存（Redis）
   - 使用分页加载

3. **功能扩展**
   - 添加社交功能（好友、分享）
   - 实现通知提醒
   - 数据导出/导入
   - 多语言支持

## 许可证

MIT
