const {
    sequelize,
    User,
    GameState,
    DeckCard,
    HistoryRecord,
    WishRankResult,
    MaterialArea,
    SpellBook
} = require('../models');

// Include options for eager loading all associations
const FULL_INCLUDE = [
    { model: DeckCard, as: 'deck' },
    { model: HistoryRecord, as: 'history' },
    { model: WishRankResult, as: 'wishRankResult' },
    { model: MaterialArea, as: 'materialArea' },
    { model: SpellBook, as: 'spellBook' }
];

/**
 * 获取用户游戏状态
 * @param {string} openId 微信OpenID
 * @returns {Object} 游戏状态
 */
async function getGameState(openId) {
    const user = await User.findOne({ where: { openId } });
    if (!user) {
        throw new Error('User not found');
    }

    let state = await GameState.findOne({
        where: { userId: user.id },
        include: FULL_INCLUDE
    });

    if (!state) {
        state = await GameState.create({ userId: user.id });
        state.deck = [];
        state.history = [];
        state.wishRankResult = [];
        state.materialArea = [];
        state.spellBook = [];
    }

    return formatGameState(state);
}

/**
 * 更新游戏状态
 * @param {string} openId 微信OpenID
 * @param {Object} updates 更新内容
 * @returns {Object} 更新后的状态
 */
async function updateGameState(openId, updates) {
    const user = await User.findOne({ where: { openId } });
    if (!user) {
        throw new Error('User not found');
    }

    return sequelize.transaction(async (t) => {
        let state = await GameState.findOne({
            where: { userId: user.id },
            transaction: t
        });

        if (!state) {
            state = await GameState.create({ userId: user.id }, { transaction: t });
        }

        // Extract nested arrays from updates
        const { deck, history, wishRankResult, materialArea, spellBook, ...mainUpdates } = updates;

        // Update main fields
        if (Object.keys(mainUpdates).length > 0) {
            await state.update(mainUpdates, { transaction: t });
        }

        // Update deck cards
        if (deck !== undefined) {
            await DeckCard.destroy({ where: { gameStateId: state.id }, transaction: t });
            if (deck.length > 0) {
                await DeckCard.bulkCreate(
                    deck.map(card => ({
                        gameStateId: state.id,
                        cardId: card.id,
                        name: card.name,
                        desc: card.desc,
                        seconds: card.seconds,
                        difficulty: card.difficulty,
                        type: card.type,
                        anchor: card.anchor,
                        anchorEmoji: card.anchorEmoji,
                        wish: card.wish
                    })),
                    { transaction: t }
                );
            }
        }

        // Update history
        if (history !== undefined) {
            await HistoryRecord.destroy({ where: { gameStateId: state.id }, transaction: t });
            if (history.length > 0) {
                await HistoryRecord.bulkCreate(
                    history.map(h => ({
                        gameStateId: state.id,
                        date: h.date,
                        cardName: h.cardName,
                        seconds: h.seconds
                    })),
                    { transaction: t }
                );
            }
        }

        // Update wish rank results
        if (wishRankResult !== undefined) {
            await WishRankResult.destroy({ where: { gameStateId: state.id }, transaction: t });
            if (wishRankResult.length > 0) {
                await WishRankResult.bulkCreate(
                    wishRankResult.map(w => ({
                        gameStateId: state.id,
                        wishId: w.id,
                        name: w.name,
                        wins: w.wins,
                        rank: w.rank
                    })),
                    { transaction: t }
                );
            }
        }

        // Update material area
        if (materialArea !== undefined) {
            await MaterialArea.destroy({ where: { gameStateId: state.id }, transaction: t });
            if (materialArea.length > 0) {
                await MaterialArea.bulkCreate(
                    materialArea.map(m => ({
                        gameStateId: state.id,
                        materialId: m.id,
                        name: m.name,
                        seconds: m.seconds,
                        difficulty: m.difficulty,
                        category: m.category,
                        anchor: m.anchor,
                        anchorEmoji: m.anchorEmoji,
                        isMerged: m.isMerged,
                        sourceA: m.sourceA,
                        sourceB: m.sourceB
                    })),
                    { transaction: t }
                );
            }
        }

        // Update spell book
        if (spellBook !== undefined) {
            await SpellBook.destroy({ where: { gameStateId: state.id }, transaction: t });
            if (spellBook.length > 0) {
                await SpellBook.bulkCreate(
                    spellBook.map(spell => ({
                        gameStateId: state.id,
                        spellName: spell
                    })),
                    { transaction: t }
                );
            }
        }

        // Reload with associations
        const updatedState = await GameState.findOne({
            where: { id: state.id },
            include: FULL_INCLUDE,
            transaction: t
        });

        return formatGameState(updatedState);
    });
}

/**
 * 完成每日任务
 * @param {string} openId 微信OpenID
 * @param {string} cardName 卡片名称
 * @param {number} seconds 用时秒数
 * @returns {Object} 完成结果
 */
async function completeDaily(openId, cardName, seconds) {
    const user = await User.findOne({ where: { openId } });
    if (!user) {
        throw new Error('User not found');
    }

    return sequelize.transaction(async (t) => {
        const state = await GameState.findOne({
            where: { userId: user.id },
            transaction: t
        });

        if (!state) {
            throw new Error('Game state not found');
        }

        // 幂等性检查
        const today = new Date().toDateString();
        if (state.todayDone && state.lastDoneDate === today) {
            return { success: false, message: 'Already completed today' };
        }

        // 计算 streak
        let newStreak = 1;
        if (state.lastDoneDate) {
            const lastDate = new Date(state.lastDoneDate);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastDate.toDateString() === yesterday.toDateString()) {
                newStreak = state.streak + 1;
            } else if (lastDate.toDateString() === today) {
                newStreak = state.streak;
            }
        }

        // 更新游戏状态
        const newBestStreak = Math.max(state.bestStreak, newStreak);
        const newDay = Math.min(state.day + 1, 7);
        const newTotalScore = state.totalScore + 10;

        await state.update({
            streak: newStreak,
            bestStreak: newBestStreak,
            day: newDay,
            todayDone: true,
            lastDoneDate: today,
            totalScore: newTotalScore
        }, { transaction: t });

        // 添加历史记录
        await HistoryRecord.create({
            gameStateId: state.id,
            date: today,
            cardName,
            seconds
        }, { transaction: t });

        // 保留最近 7 条历史记录
        const historyCount = await HistoryRecord.count({
            where: { gameStateId: state.id },
            transaction: t
        });

        if (historyCount > 7) {
            const oldRecords = await HistoryRecord.findAll({
                where: { gameStateId: state.id },
                order: [['created_at', 'ASC']],
                limit: historyCount - 7,
                transaction: t
            });
            if (oldRecords.length > 0) {
                await HistoryRecord.destroy({
                    where: { id: oldRecords.map(r => r.id) },
                    transaction: t
                });
            }
        }

        // 添加到咒语图鉴（去重）
        if (cardName) {
            await SpellBook.findOrCreate({
                where: { gameStateId: state.id, spellName: cardName },
                defaults: { gameStateId: state.id, spellName: cardName },
                transaction: t
            });
        }

        return {
            success: true,
            day: newDay,
            streak: newStreak,
            bestStreak: newBestStreak,
            totalScore: newTotalScore,
            isDay7: newDay === 7
        };
    });
}

/**
 * 重置周期
 * @param {string} openId 微信OpenID
 * @param {boolean} keepWish 是否保留当前愿望
 * @returns {Object} 重置后的状态
 */
async function resetCycle(openId, keepWish = true) {
    const user = await User.findOne({ where: { openId } });
    if (!user) {
        throw new Error('User not found');
    }

    return sequelize.transaction(async (t) => {
        const state = await GameState.findOne({
            where: { userId: user.id },
            transaction: t
        });

        if (!state) {
            throw new Error('Game state not found');
        }

        const updates = {
            day: 1,
            todayDone: false
        };

        if (!keepWish) {
            updates.hasWishRank = false;
            updates.hasDeck = false;
            updates.currentWish = null;
            updates.currentWishId = null;

            // 清空关联数据
            await DeckCard.destroy({ where: { gameStateId: state.id }, transaction: t });
            await MaterialArea.destroy({ where: { gameStateId: state.id }, transaction: t });
            await WishRankResult.destroy({ where: { gameStateId: state.id }, transaction: t });
        }

        await state.update(updates, { transaction: t });

        // Reload with associations
        const updatedState = await GameState.findOne({
            where: { id: state.id },
            include: FULL_INCLUDE,
            transaction: t
        });

        return formatGameState(updatedState);
    });
}

/**
 * 同步本地状态到服务器
 * @param {string} openId 微信OpenID
 * @param {Object} localState 本地状态
 * @returns {Object} 合并后的状态
 */
async function syncState(openId, localState) {
    const user = await User.findOrCreateByOpenId(openId);

    return sequelize.transaction(async (t) => {
        let serverState = await GameState.findOne({
            where: { userId: user.id },
            include: FULL_INCLUDE,
            transaction: t
        });

        if (!serverState) {
            serverState = await GameState.create({ userId: user.id }, { transaction: t });
        }

        // 获取服务器端的 spellBook
        const serverSpellBook = serverState.spellBook
            ? serverState.spellBook.map(s => s.spellName)
            : [];
        const localSpellBook = localState.spellBook || [];

        // 合并策略: 本地状态优先,但保留服务器的某些累计数据
        const merged = {
            ...localState,
            bestStreak: Math.max(serverState.bestStreak || 0, localState.bestStreak || 0),
            totalScore: Math.max(serverState.totalScore || 0, localState.totalScore || 0)
        };

        // 合并 spellBook (去重)
        const mergedSpellBook = [...new Set([...serverSpellBook, ...localSpellBook])];

        // 更新主状态
        const { deck, history, wishRankResult, materialArea, spellBook, ...mainFields } = merged;
        await serverState.update(mainFields, { transaction: t });

        // 更新 deck
        if (localState.deck !== undefined) {
            await DeckCard.destroy({ where: { gameStateId: serverState.id }, transaction: t });
            if (localState.deck && localState.deck.length > 0) {
                await DeckCard.bulkCreate(
                    localState.deck.map(card => ({
                        gameStateId: serverState.id,
                        cardId: card.id,
                        name: card.name,
                        desc: card.desc,
                        seconds: card.seconds,
                        difficulty: card.difficulty,
                        type: card.type,
                        anchor: card.anchor,
                        anchorEmoji: card.anchorEmoji,
                        wish: card.wish
                    })),
                    { transaction: t }
                );
            }
        }

        // 更新 history
        if (localState.history !== undefined) {
            await HistoryRecord.destroy({ where: { gameStateId: serverState.id }, transaction: t });
            if (localState.history && localState.history.length > 0) {
                await HistoryRecord.bulkCreate(
                    localState.history.map(h => ({
                        gameStateId: serverState.id,
                        date: h.date,
                        cardName: h.cardName,
                        seconds: h.seconds
                    })),
                    { transaction: t }
                );
            }
        }

        // 更新 wishRankResult
        if (localState.wishRankResult !== undefined) {
            await WishRankResult.destroy({ where: { gameStateId: serverState.id }, transaction: t });
            if (localState.wishRankResult && localState.wishRankResult.length > 0) {
                await WishRankResult.bulkCreate(
                    localState.wishRankResult.map(w => ({
                        gameStateId: serverState.id,
                        wishId: w.id,
                        name: w.name,
                        wins: w.wins,
                        rank: w.rank
                    })),
                    { transaction: t }
                );
            }
        }

        // 更新 materialArea
        if (localState.materialArea !== undefined) {
            await MaterialArea.destroy({ where: { gameStateId: serverState.id }, transaction: t });
            if (localState.materialArea && localState.materialArea.length > 0) {
                await MaterialArea.bulkCreate(
                    localState.materialArea.map(m => ({
                        gameStateId: serverState.id,
                        materialId: m.id,
                        name: m.name,
                        seconds: m.seconds,
                        difficulty: m.difficulty,
                        category: m.category,
                        anchor: m.anchor,
                        anchorEmoji: m.anchorEmoji,
                        isMerged: m.isMerged,
                        sourceA: m.sourceA,
                        sourceB: m.sourceB
                    })),
                    { transaction: t }
                );
            }
        }

        // 更新合并后的 spellBook
        await SpellBook.destroy({ where: { gameStateId: serverState.id }, transaction: t });
        if (mergedSpellBook.length > 0) {
            await SpellBook.bulkCreate(
                mergedSpellBook.map(spell => ({
                    gameStateId: serverState.id,
                    spellName: spell
                })),
                { transaction: t }
            );
        }

        // Reload with associations
        const finalState = await GameState.findOne({
            where: { id: serverState.id },
            include: FULL_INCLUDE,
            transaction: t
        });

        return formatGameState(finalState);
    });
}

/**
 * 格式化游戏状态为 API 响应格式
 * 将 Sequelize 模型转换为与原 Mongoose 格式兼容的对象
 */
function formatGameState(state) {
    if (!state) return null;

    const plain = state.get({ plain: true });

    return {
        _id: plain.id,
        userId: plain.userId,
        day: plain.day,
        hasRole: plain.hasRole,
        hasWishRank: plain.hasWishRank,
        hasDeck: plain.hasDeck,
        todayDone: plain.todayDone,
        lastDoneDate: plain.lastDoneDate,
        roleTalent: plain.roleTalent,
        currentWish: plain.currentWish,
        currentWishId: plain.currentWishId,
        streak: plain.streak,
        bestStreak: plain.bestStreak,
        totalScore: plain.totalScore,
        version: plain.version,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
        // 格式化关联数据
        deck: (plain.deck || []).map(card => ({
            id: card.cardId,
            name: card.name,
            desc: card.desc,
            seconds: card.seconds,
            difficulty: card.difficulty,
            type: card.type,
            anchor: card.anchor,
            anchorEmoji: card.anchorEmoji,
            wish: card.wish,
            createdAt: card.createdAt
        })),
        history: (plain.history || []).map(h => ({
            date: h.date,
            cardName: h.cardName,
            seconds: h.seconds
        })),
        wishRankResult: (plain.wishRankResult || []).map(w => ({
            id: w.wishId,
            name: w.name,
            wins: w.wins,
            rank: w.rank
        })),
        materialArea: (plain.materialArea || []).map(m => ({
            id: m.materialId,
            name: m.name,
            seconds: m.seconds,
            difficulty: m.difficulty,
            category: m.category,
            anchor: m.anchor,
            anchorEmoji: m.anchorEmoji,
            isMerged: m.isMerged,
            sourceA: m.sourceA,
            sourceB: m.sourceB
        })),
        spellBook: (plain.spellBook || []).map(s => s.spellName)
    };
}

module.exports = {
    getGameState,
    updateGameState,
    completeDaily,
    resetCycle,
    syncState
};
