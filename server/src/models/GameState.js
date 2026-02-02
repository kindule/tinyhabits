const mongoose = require('mongoose');

// 卡片子文档
const cardSchema = new mongoose.Schema({
    id: String,
    name: String,
    desc: String,
    seconds: Number,
    difficulty: { type: Number, min: 1, max: 3 },
    type: { type: String, enum: ['base', 'main', 'bonus'] },
    anchor: String,
    anchorEmoji: String,
    wish: String,
    createdAt: Date
}, { _id: false });

// 历史记录子文档
const historySchema = new mongoose.Schema({
    date: String,
    cardName: String,
    seconds: Number
}, { _id: false });

// 愿望排序结果子文档
const wishRankSchema = new mongoose.Schema({
    id: String,
    name: String,
    wins: Number,
    rank: Number
}, { _id: false });

// 素材区行为子文档
const materialSchema = new mongoose.Schema({
    id: String,
    name: String,
    seconds: Number,
    difficulty: Number,
    category: String,
    anchor: String,
    anchorEmoji: String,
    isMerged: Boolean,
    sourceA: String,
    sourceB: String
}, { _id: false });

// 主游戏状态模型
const gameStateSchema = new mongoose.Schema({
    // 关联用户
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // ===== 流程状态 =====
    day: {
        type: Number,
        default: 1,
        min: 1,
        max: 7
    },
    hasRole: {
        type: Boolean,
        default: false
    },
    hasWishRank: {
        type: Boolean,
        default: false
    },
    hasDeck: {
        type: Boolean,
        default: false
    },
    todayDone: {
        type: Boolean,
        default: false
    },
    lastDoneDate: {
        type: String
    },

    // ===== 角色数据 =====
    roleTalent: {
        type: String,
        enum: ['fire', 'tide', 'mason', 'wind', null]
    },

    // ===== 愿望数据 =====
    wishRankResult: [wishRankSchema],
    currentWish: String,
    currentWishId: String,

    // ===== 卡组数据 =====
    deck: [cardSchema],
    materialArea: [materialSchema],

    // ===== 游戏数据 =====
    streak: {
        type: Number,
        default: 0,
        min: 0
    },
    bestStreak: {
        type: Number,
        default: 0,
        min: 0
    },
    totalScore: {
        type: Number,
        default: 0,
        min: 0
    },

    // ===== 收集数据 =====
    spellBook: [String],
    history: [historySchema],

    // ===== 元数据 =====
    version: {
        type: String,
        default: '1.0'
    }
}, {
    timestamps: true
});

// 索引
gameStateSchema.index({ updatedAt: -1 });

// 实例方法: 完成今日任务
gameStateSchema.methods.completeToday = function (cardName, seconds) {
    const today = new Date().toDateString();

    // 更新Streak
    if (this.lastDoneDate) {
        const lastDate = new Date(this.lastDoneDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate.toDateString() === yesterday.toDateString()) {
            this.streak += 1;
        } else if (lastDate.toDateString() !== today) {
            this.streak = 1;
        }
    } else {
        this.streak = 1;
    }

    // 更新最佳Streak
    if (this.streak > this.bestStreak) {
        this.bestStreak = this.streak;
    }

    // 更新Day
    if (this.day < 7) {
        this.day += 1;
    }

    // 标记完成
    this.todayDone = true;
    this.lastDoneDate = today;
    this.totalScore += 10;

    // 记录历史
    this.history.push({ date: today, cardName, seconds });
    if (this.history.length > 7) {
        this.history = this.history.slice(-7);
    }

    // 更新咒语图鉴
    if (cardName && !this.spellBook.includes(cardName)) {
        this.spellBook.push(cardName);
    }

    return this;
};

// 实例方法: 重置周期
gameStateSchema.methods.resetCycle = function (keepWish = true) {
    this.day = 1;
    this.todayDone = false;

    if (!keepWish) {
        this.hasWishRank = false;
        this.hasDeck = false;
        this.deck = [];
        this.materialArea = [];
        this.wishRankResult = [];
        this.currentWish = null;
        this.currentWishId = null;
    }

    return this;
};

// 静态方法: 获取或创建游戏状态
gameStateSchema.statics.getOrCreate = async function (userId) {
    let state = await this.findOne({ userId });

    if (!state) {
        state = await this.create({ userId });
    }

    return state;
};

module.exports = mongoose.model('GameState', gameStateSchema);
