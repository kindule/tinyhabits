/**
 * state.js - 游戏状态管理
 * 负责：状态读写、流程验证、日期检查
 */

const STORAGE_KEY = 'tinySpellsGameState';

// 默认初始状态
const DEFAULT_STATE = {
  day: 1,                    // 当前天数 1~7
  hasRole: false,            // 是否已选择天赋
  roleTalent: null,          // 天赋ID: spark/tide/mason/wind
  hasWishRank: false,        // 是否已完成愿望排序
  wishRankResult: [],        // 愿望排序结果
  currentWish: null,         // 当前核心愿望
  hasDeck: false,            // 是否已生成卡组
  deck: [],                  // 卡组（3张卡）
  todayDone: false,          // 今日是否已完成
  lastDoneDate: null,        // 最后完成日期
  lastOpenDate: null,        // 上次打开日期
  forceRescue: false,        // 是否强制救援卡
  history: [],               // 完成历史（最近7天）
  spellBook: [],             // 已解锁咒语图鉴
  citiesCompleted: 0         // 已修复的愿望城数量
};

/**
 * 加载状态
 * @returns {Object} 游戏状态
 */
function loadState() {
  try {
    const data = wx.getStorageSync(STORAGE_KEY);
    if (data) {
      // 合并默认值，确保新字段有默认值
      return { ...DEFAULT_STATE, ...data };
    }
    return { ...DEFAULT_STATE };
  } catch (e) {
    console.error('加载状态失败:', e);
    return { ...DEFAULT_STATE };
  }
}

/**
 * 保存状态
 * @param {Object} state 游戏状态
 */
function saveState(state) {
  try {
    wx.setStorageSync(STORAGE_KEY, state);
  } catch (e) {
    console.error('保存状态失败:', e);
  }
}

/**
 * 更新状态（部分更新）
 * @param {Object} updates 要更新的字段
 * @returns {Object} 更新后的完整状态
 */
function updateState(updates) {
  const state = loadState();
  const newState = { ...state, ...updates };
  saveState(newState);
  return newState;
}

/**
 * 重置状态（用于测试或重新开始）
 */
function resetState() {
  saveState({ ...DEFAULT_STATE });
}

/**
 * 获取今日日期字符串
 * @returns {string} YYYY-MM-DD格式
 */
function getTodayString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * 检查是否是新的一天
 * @param {Object} state 游戏状态
 * @returns {boolean} 是否是新的一天
 */
function isNewDay(state) {
  const today = getTodayString();
  return state.lastDoneDate !== today;
}

/**
 * 检查并重置每日状态
 * 如果是新的一天，重置todayDone
 * @returns {Object} 处理后的状态
 */
function checkDailyReset() {
  const state = loadState();
  const today = getTodayString();

  if (state.lastOpenDate && state.lastOpenDate !== today && state.todayDone === false) {
    state.forceRescue = true;
  }

  if (state.lastDoneDate && state.lastDoneDate !== today) {
    // 新的一天，检查是否连续
    const lastDate = new Date(state.lastDoneDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      // 断签超过1天，可以考虑惩罚机制（MVP暂不实现）
      console.log('断签天数:', diffDays);
    }

    // 重置今日完成状态
    state.todayDone = false;
  }

  state.lastOpenDate = today;
  saveState(state);
  return state;
}

/**
 * 验证流程，返回应该跳转的页面
 * @param {Object} state 游戏状态
 * @returns {string|null} 需要跳转的页面路径，null表示不需要跳转
 */
function validateFlow(state) {
  // 未完成角色选择 → 角色页
  if (!state.hasRole) {
    return '/pages/role/index';
  }
  // 未完成愿望排序 → 愿望页
  if (!state.hasWishRank) {
    return '/pages/wishes/index';
  }
  // 未生成卡组 → 工坊页
  if (!state.hasDeck) {
    return '/pages/workshop/index';
  }
  // 都完成了 → 每日页
  return '/pages/daily/index';
}

/**
 * 完成今日任务
 * @param {Object} cardInfo 完成的卡片信息
 * @returns {Object} 更新后的状态
 */
function completeToday(cardInfo) {
  const state = loadState();
  const today = getTodayString();

  // 记录历史
  const historyEntry = {
    date: today,
    day: state.day,
    cardName: cardInfo.name,
    seconds: cardInfo.seconds,
    wish: state.currentWish
  };

  // 更新历史（保留最近7条）
  state.history = [historyEntry, ...state.history].slice(0, 7);

  // 添加到咒语图鉴
  if (!state.spellBook.find(s => s.id === cardInfo.id)) {
    state.spellBook.push({
      id: cardInfo.id,
      name: cardInfo.name,
      unlockedAt: today
    });
  }

  // 更新状态
  state.todayDone = true;
  state.lastDoneDate = today;
  state.forceRescue = false;
  state.day = Math.min(state.day + 1, 7);

  saveState(state);
  return state;
}

/**
 * 完成愿望城（Day7完成后调用）
 * @returns {Object} 更新后的状态
 */
function completeCity() {
  const state = loadState();

  state.citiesCompleted += 1;
  state.day = 1;
  state.hasWishRank = false;
  state.hasDeck = false;
  state.currentWish = null;
  state.deck = [];
  state.todayDone = false;
  state.forceRescue = false;
  // 保留：hasRole, roleTalent, spellBook, history

  saveState(state);
  return state;
}

/**
 * 设置角色天赋
 * @param {string} talentId 天赋ID
 * @returns {Object} 更新后的状态
 */
function setRole(talentId) {
  return updateState({
    hasRole: true,
    roleTalent: talentId
  });
}

/**
 * 设置愿望排序结果
 * @param {Array} rankResult 排序结果
 * @param {string} coreWish 核心愿望ID
 * @returns {Object} 更新后的状态
 */
function setWishRank(rankResult, coreWish) {
  return updateState({
    hasWishRank: true,
    wishRankResult: rankResult,
    currentWish: coreWish
  });
}

/**
 * 设置卡组
 * @param {Array} deck 卡组（3张卡）
 * @returns {Object} 更新后的状态
 */
function setDeck(deck) {
  return updateState({
    hasDeck: true,
    deck: deck
  });
}

/**
 * 抽取今日卡片
 * @param {Object} state 游戏状态
 * @returns {Object} 今日卡片
 */
function drawTodayCard(state) {
  const { deck, history, roleTalent } = state;

  if (!deck || deck.length === 0) {
    // 没有卡组，返回救援卡
    const data = require('./data.js');
    return data.getRandomRescueCard();
  }

  // 计算连续完成天数
  const consecutiveDays = history.filter((h, i) => {
    if (i === 0) return true;
    const prevDate = new Date(history[i - 1].date);
    const currDate = new Date(h.date);
    const diff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
    return diff === 1;
  }).length;

  // 基础概率
  let mainProb = 0;
  let bonusProb = 0.1; // 10%彩蛋卡

  // 连续2天以上，主线卡概率30%
  if (consecutiveDays >= 2) {
    mainProb = 0.3;
  }

  // 天赋加成
  if (roleTalent === 'spark') {
    bonusProb += 0.1; // 火花型：彩蛋+10%
  }

  // 抽卡
  const rand = Math.random();
  let cardType = 'base';

  if (rand < bonusProb) {
    cardType = 'bonus';
  } else if (rand < bonusProb + mainProb) {
    cardType = 'main';
  }

  // 从卡组中找对应类型的卡
  let card = deck.find(c => c.type === cardType);
  if (!card) {
    // 找不到对应类型，默认返回保底卡
    card = deck.find(c => c.type === 'base') || deck[0];
  }

  // 风行型天赋：时间减少10秒
  if (roleTalent === 'wind' && card) {
    card = { ...card, seconds: Math.max(10, card.seconds - 10) };
  }

  return card;
}

// 导出模块
module.exports = {
  loadState,
  saveState,
  updateState,
  resetState,
  getTodayString,
  isNewDay,
  checkDailyReset,
  validateFlow,
  completeToday,
  completeCity,
  setRole,
  setWishRank,
  setDeck,
  drawTodayCard,
  DEFAULT_STATE
};
