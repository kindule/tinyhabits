# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 总原则
这是一个 **让福格行为模型从"方法论工具"升级为"可长期玩的成长型游戏"** 的微信小程序项目。

1. 严格按照 `docs/` 中的设计文档进行开发
2. 如果有疑问，先与用户沟通再进行编码
3. 关键设计文档阅读顺序：[世界观](docs/design/01_世界观与故事.md) → [玩法循环](docs/design/02_核心玩法循环.md) → [系统设计](docs/design/03_系统设计.md)

## Development Commands

### Backend (server/)
```bash
cd server && npm run dev     # Start with nodemon (auto-reload)
cd server && npm start       # Production mode
cd server && npm test        # Run Jest tests with coverage
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Prerequisites
- MySQL running on `localhost:3306` (or configure via environment variables)
- Configure `server/.env`:
  - `MYSQL_HOST` - MySQL host (default: localhost)
  - `MYSQL_PORT` - MySQL port (default: 3306)
  - `MYSQL_DATABASE` - Database name (default: tinyhabits)
  - `MYSQL_USER` - MySQL username
  - `MYSQL_PASSWORD` - MySQL password
  - `JWT_SECRET` - JWT signing key
  - `DEEPSEEK_API_KEY` - For AI anchor generation
  - `DOUBAO_API_KEY` - Fallback AI provider

## Architecture

### Project Structure
```
tinyhabits/
├── miniprogram/          # WeChat miniprogram frontend
│   ├── pages/            # Page components (onboarding, role, wishes, workshop, daily, day7)
│   ├── components/       # Reusable UI components (dialogue-bubble, main-card, etc.)
│   ├── utils/            # Core utilities
│   │   ├── state.js      # Game state management (local storage)
│   │   ├── navigation.js # Page flow control
│   │   ├── sync.js       # Backend sync
│   │   └── api.js        # HTTP request wrapper
│   └── data/             # Static content (wishes, behaviors, dialogues)
├── server/               # Node.js/Express backend
│   └── src/
│       ├── routes/       # API endpoints (ai, auth, users, analytics, health)
│       ├── services/     # Business logic (anchorService, mapService, dialogueService)
│       ├── models/       # Sequelize models (User, GameState, DeckCard, etc.)
│       └── config/       # App configuration
└── docs/                 # Design & requirements documentation
```

### Core Game Flow
The game follows a linear 7-day progression:
```
Onboarding → Role Selection → Wish Ranking → Behavior Workshop → Daily Card (×7) → City Complete
```

### State Management (miniprogram/utils/state.js)
All game state is stored locally via `wx.setStorageSync('tinySpellsGameState')`:
```javascript
{
  day: 1-7,              // Current progress
  hasRole: boolean,      // Role selection complete
  roleTalent: string,    // 'spark'|'tide'|'mason'|'wind'
  hasWishRank: boolean,  // Wish ranking complete
  currentWish: string,   // Selected core wish
  hasDeck: boolean,      // Deck generated
  deck: [],              // 3 cards (base/main/bonus)
  todayDone: boolean,    // Daily completion
  lastDoneDate: string,  // For streak calculation
  history: [],           // Last 7 days completion
  spellBook: []          // Unlocked spells collection
}
```

Key functions:
- `loadState()` / `saveState()` - Storage operations
- `checkDailyReset()` - Reset `todayDone` on new day
- `validateFlow()` - Returns page to redirect based on incomplete steps
- `completeToday()` - Record completion, update history
- `drawTodayCard()` - Card draw with probability based on streak

### Backend API Routes

| Route | Description |
|-------|-------------|
| `GET /api/health` | Health check |
| `POST /api/ai/anchors` | AI-generated anchor suggestions (rate limited: 10/min) |
| `POST /api/ai/map` | MAP model evaluation for deck |
| `POST /api/ai/dialogue` | Dynamic character dialogue generation |
| `POST /api/auth/*` | Authentication endpoints |
| `POST /api/analytics/*` | Event tracking |

### AI Services (LangChain)
Located in `server/src/services/`:
- **anchorService.js** - Generates context-aware behavior anchors ("刷牙后→")
- **mapService.js** - Evaluates cards against Fogg's MAP model (Motivation × Ability × Prompt)
- **dialogueService.js** - Generates NPC dialogue (Arc, MIA, Rift)

Fallback: If DeepSeek fails, switches to 豆包; if both fail, uses preset library.

## Game Design Reference

### Characters
| Character | Role | Style |
|-----------|------|-------|
| Arc (弧光导师) | Main guide | Warm, restrained |
| MIA (魔法师米娅) | Workshop assistant | Playful, exploratory |
| Rift (裂隙之影) | Resistance symbol | Tempting whispers (to be "shattered") |

### Card Types
- **保底卡 (Base)** - 30-60s, difficulty ★, always completable
- **主线卡 (Main)** - 2-5min, difficulty ★★, unlocked after 2-day streak (30% chance)
- **彩蛋卡 (Bonus)** - 10-30s, fun/novelty (10% chance)

### Key Design Principles
- **No punishment**: Missing a day doesn't penalize - offers "rescue spell" instead
- **Tiny actions**: Behaviors are split until they're "too small to refuse"
- **Emotional feedback**: "Shatter the rift" animation provides satisfaction, not just checkmarks

## Configuration

### server/src/config/index.js
```javascript
{
  port: 3000,
  mysql: {
    host: 'localhost',
    port: 3306,
    database: 'tinyhabits',
    username: 'root',
    password: '...'
  },
  jwt: { secret: '...', expiresIn: '7d' },
  ai: { deepseekApiKey, doubaoApiKey, timeout: 10000 },
  rateLimit: { windowMs: 60000, max: 100 }
}
```

### miniprogram API Base URL
Set in `miniprogram/utils/api.js` - ensure it matches backend port.
