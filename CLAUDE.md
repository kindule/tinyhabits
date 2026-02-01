# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 总原则
这是一个 **让福格行为模型从“方法论工具”升级为“可长期玩的成长型游戏”**。

1. 严格按照 `docs/` 中的说明文档进行游戏设计
2. 如果有疑问，则先与我沟通再进行编码

## Development Commands

### Setup and Environment
```bash
npm run setup          # Run dev.sh setup script (checks MongoDB, creates .env, installs deps)
```

### Backend Development
```bash
npm run dev            # Start backend with nodemon auto-reload
npm run backend        # Alias for dev
npm run backend:debug  # Start with Node.js debugger on port 9229
npm start              # Production mode (no auto-reload)
```

### Prerequisites
- MongoDB must be running on `localhost:27017`
- Configure `backend/.env` with `WX_APPID`, `WX_SECRET`, and `JWT_SECRET`
- Default backend port: 3000 (configurable via `PORT` env var)

### Health Check
```bash
curl http://localhost:3000/health
```

## Architecture

### Project Structure
This is a **WeChat miniprogram** (���) with a Node.js backend:

- `miniprogram/` - WeChat miniprogram frontend (WXML/WXSS/JS)
- `backend/` - Express.js REST API with MongoDB

### Authentication
The system supports **dual authentication**:

1. **WeChat OpenID** (primary for miniprogram)
   - Route: `POST /api/wxauth/login`
   - Exchanges `wx.login()` code for `openid`
   - Creates/updates User with `openid`, `sessionKey`, `nickname`, `avatar`

2. **Email/Password** (fallback/testing)
   - Routes: `POST /api/auth/register`, `POST /api/auth/login`
   - Uses bcryptjs password hashing
   - Requires `username`, `email`, `password`

Both methods return JWT tokens (30-day expiry) used in `Authorization: Bearer <token>` headers.

### CORS Configuration
Backend explicitly allows WeChat miniprogram requests (which may have no `origin` header):
- Located in `backend/src/server.js:14-24`
- Allows requests without origin or from localhost
- Production deployments should restrict to specific domains

### API Base URL
Miniprogram API base URL is configured in `miniprogram/app.js:5`:
```javascript
apiUrl: 'http://localhost:8008/api'
```
**Note:** Current code shows port 8008, but backend defaults to 3000. Verify/update before testing.

## Data Models

### User (`backend/src/models/User.js`)
```javascript
{
  // Traditional auth (optional)
  username: String,
  email: String,
  password: String,  // bcrypt hashed, select: false

  // WeChat auth (primary)
  openid: String,     // unique, sparse index
  nickname: String,   // default: '��(7'
  avatar: String,
  sessionKey: String, // select: false

  // Game data
  gameData: {
    score: Number,           // Total points
    streak: Number,          // Current consecutive days
    bestStreak: Number,      // Highest streak achieved
    level: String,           // '�K', 'f�', etc.
    totalCompleted: Number,  // Lifetime habit completions
    lastCompletedDate: String,
    achievements: [String]   // Achievement IDs
  }
}
```

### Habit (`backend/src/models/Habit.js`)
```javascript
{
  user: ObjectId,              // ref: 'User'
  anchor: String,              // Trigger (e.g., "7�Y")
  behavior: String,            // Action (e.g., "Z2*�r")
  createdDate: String,         // Local date string
  completedCount: Number,
  lastCompleted: String,       // Last completion date
  isActive: Boolean,
  completionHistory: [{
    date: String,
    timestamp: Date
  }]
}
```

**Indexes:**
- `{ user: 1, isActive: 1 }`
- `{ user: 1, lastCompleted: 1 }`

## Game Mechanics

### Scoring Formula
When a habit is completed:
```javascript
baseScore = 10
streakBonus = streak � 2
totalPoints = baseScore + streakBonus
```

### Level System
| Score Threshold | Level Name |
|----------------|-----------|
| 0              | �K       |
| 50             | f�       |
| 150            | ��     |
| 300            | �       |
| 500            | '       |
| 1000           | �       |

### Achievements
Defined in backend (see `backend/README.md:238-247`):
- `first_habit` - Create first habit
- `three_habits` - Create 3 habits
- `first_complete` - First completion
- `ten_complete` - 10 total completions
- `streak_3`, `streak_7`, `streak_30` - Consecutive day milestones
- `score_100`, `score_500` - Point milestones

Achievements are stored as string IDs in `user.gameData.achievements`.

### Streak Logic
- Streak increments when completing a habit on a new day
- Resets to 0 if more than 1 day gap since last completion
- Checked in `miniprogram/app.js:54-68` and backend controllers

## API Routes

All routes require JWT authentication (via `backend/src/middleware/auth.js`) except login/register.

### Habits
- `GET /api/habits` - List user's habits
- `POST /api/habits` - Create habit (body: `{ anchor, behavior }`)
- `GET /api/habits/:id` - Get single habit
- `POST /api/habits/:id/complete` - Mark habit as completed (updates score, streak, achievements)
- `DELETE /api/habits/:id` - Soft delete (sets `isActive: false`)

### Stats
- `GET /api/stats` - Overall statistics
- `GET /api/stats/achievements` - List achievements with unlock status
- `GET /api/stats/history?days=30` - Completion history
- `GET /api/stats/leaderboard` - Top users by score

### Auth
- `POST /api/auth/register` - Email/password signup
- `POST /api/auth/login` - Email/password login
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/gamedata` - Update game data

### WeChat Auth
- `POST /api/wxauth/login` - Exchange WeChat code for JWT (body: `{ code }`)
- `PUT /api/wxauth/userinfo` - Update nickname/avatar

## WeChat Miniprogram Structure

### Pages
- `pages/index/index` - Dashboard/home
- `pages/habits/habits` - Habit list and management
- `pages/achievements/achievements` - Achievement gallery
- `pages/stats/stats` - Statistics and charts

### Utils
- `utils/api.js` - API request wrapper (uses `wx.request`)
- `utils/storage.js` - Local storage helpers
- `utils/levels.js` - Level calculation logic
- `utils/achievements.js` - Achievement unlock logic
- `utils/util.js` - General utilities

### Global State
Managed in `miniprogram/app.js` via `globalData`:
- `userInfo` - Cached user profile
- `apiUrl` - Backend base URL
- `gameData` - Synced game state (score, streak, level, habits, achievements)

Methods:
- `loadGameData()` - Load from `wx.getStorageSync`
- `saveGameData()` - Save to `wx.setStorageSync`
- `checkStreak()` - Validate/reset streak on app launch
