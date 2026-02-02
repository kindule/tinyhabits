const GameState = require('../models/GameState');
const User = require('../models/User');

/**
 * 获取用户游戏状态
 * @param {string} openId 微信OpenID
 * @returns {Object} 游戏状态
 */
async function getGameState(openId) {
    const user = await User.findOne({ openId });
    if (!user) {
        throw new Error('User not found');
    }

    const state = await GameState.getOrCreate(user._id);
    return state;
}

/**
 * 更新游戏状态
 * @param {string} openId 微信OpenID
 * @param {Object} updates 更新内容
 * @returns {Object} 更新后的状态
 */
async function updateGameState(openId, updates) {
    const user = await User.findOne({ openId });
    if (!user) {
        throw new Error('User not found');
    }

    const state = await GameState.findOneAndUpdate(
        { userId: user._id },
        { $set: updates },
        { new: true, runValidators: true }
    );

    return state;
}

/**
 * 完成每日任务
 * @param {string} openId 微信OpenID
 * @param {string} cardName 卡片名称
 * @param {number} seconds 用时秒数
 * @returns {Object} 完成结果
 */
async function completeDaily(openId, cardName, seconds) {
    const user = await User.findOne({ openId });
    if (!user) {
        throw new Error('User not found');
    }

    const state = await GameState.findOne({ userId: user._id });
    if (!state) {
        throw new Error('Game state not found');
    }

    // 幂等性检查
    const today = new Date().toDateString();
    if (state.todayDone && state.lastDoneDate === today) {
        return { success: false, message: 'Already completed today' };
    }

    // 完成任务
    state.completeToday(cardName, seconds);
    await state.save();

    return {
        success: true,
        day: state.day,
        streak: state.streak,
        bestStreak: state.bestStreak,
        totalScore: state.totalScore,
        isDay7: state.day === 7
    };
}

/**
 * 重置周期
 * @param {string} openId 微信OpenID
 * @param {boolean} keepWish 是否保留当前愿望
 * @returns {Object} 重置后的状态
 */
async function resetCycle(openId, keepWish = true) {
    const user = await User.findOne({ openId });
    if (!user) {
        throw new Error('User not found');
    }

    const state = await GameState.findOne({ userId: user._id });
    if (!state) {
        throw new Error('Game state not found');
    }

    state.resetCycle(keepWish);
    await state.save();

    return state;
}

/**
 * 同步本地状态到服务器
 * @param {string} openId 微信OpenID
 * @param {Object} localState 本地状态
 * @returns {Object} 合并后的状态
 */
async function syncState(openId, localState) {
    const user = await User.findOrCreateByOpenId(openId);
    const serverState = await GameState.getOrCreate(user._id);

    // 合并策略: 本地状态优先,但保留服务器的某些累计数据
    const merged = {
        ...localState,
        bestStreak: Math.max(serverState.bestStreak, localState.bestStreak || 0),
        totalScore: Math.max(serverState.totalScore, localState.totalScore || 0),
        spellBook: [...new Set([...serverState.spellBook, ...(localState.spellBook || [])])]
    };

    // 更新服务器状态
    Object.assign(serverState, merged);
    await serverState.save();

    return serverState;
}

module.exports = {
    getGameState,
    updateGameState,
    completeDaily,
    resetCycle,
    syncState
};
