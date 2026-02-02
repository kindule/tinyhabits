/**
 * 带同步的状态操作
 */

const { loadState, saveState } = require('./state.js');
const { markDirty, syncToServer } = require('./sync.js');

/**
 * 更新状态(自动标记dirty)
 * @param {Object} updates 更新内容
 * @returns {Object} 更新后的状态
 */
function updateStateWithSync(updates) {
    const state = loadState();
    const newState = {
        ...state,
        ...updates,
        updatedAt: new Date().toISOString()
    };

    saveState(newState);
    markDirty();

    // 尝试后台同步(不阻塞)
    setTimeout(() => {
        syncToServer().catch(console.error);
    }, 100);

    return newState;
}

module.exports = {
    updateStateWithSync
};
