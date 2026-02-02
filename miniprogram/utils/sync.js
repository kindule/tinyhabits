/**
 * 数据同步管理器
 */

const { loadState, saveState } = require('./state.js');
const { request } = require('./api.js');

const SYNC_KEY = 'tinyhabits_sync_meta';
// API_BASE is handled in api.js

/**
 * 同步元数据
 */
function getSyncMeta() {
    try {
        return wx.getStorageSync(SYNC_KEY) || {
            lastSyncAt: null,
            dirty: false,
            pendingActions: []
        };
    } catch (e) {
        return { lastSyncAt: null, dirty: false, pendingActions: [] };
    }
}

function saveSyncMeta(meta) {
    try {
        wx.setStorageSync(SYNC_KEY, meta);
    } catch (e) {
        console.error('保存同步元数据失败:', e);
    }
}

/**
 * 标记数据为dirty(需要同步)
 */
function markDirty() {
    const meta = getSyncMeta();
    meta.dirty = true;
    saveSyncMeta(meta);
}

/**
 * 获取登录Token
 */
async function getAuthToken() {
    return new Promise((resolve, reject) => {
        // 检查缓存的Token
        const cached = wx.getStorageSync('auth_token');
        if (cached && cached.expiresAt > Date.now()) {
            resolve(cached.token);
            return;
        }

        // 微信登录获取code
        wx.login({
            success: async (res) => {
                if (res.code) {
                    try {
                        // code换token
                        const response = await request({
                            url: `/api/auth/wechat`,
                            method: 'POST',
                            data: { code: res.code }
                        });

                        const { token, expiresIn } = response.data;

                        // 缓存Token
                        wx.setStorageSync('auth_token', {
                            token,
                            expiresAt: Date.now() + (expiresIn - 60) * 1000
                        });

                        resolve(token);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error('获取code失败'));
                }
            },
            fail: reject
        });
    });
}

/**
 * 同步数据到服务器
 */
async function syncToServer() {
    const meta = getSyncMeta();

    // 未登录或无需同步
    if (!meta.dirty) {
        return { success: true, message: '无需同步' };
    }

    try {
        const token = await getAuthToken();
        const localState = loadState();

        const response = await request({
            url: `/api/users/sync`,
            method: 'POST',
            header: {
                'Authorization': `Bearer ${token}`
            },
            data: {
                state: localState,
                clientTime: new Date().toISOString()
            }
        });

        if (response.data.success) {
            // 合并服务器返回的状态
            const merged = mergeState(localState, response.data.state);
            saveState(merged);

            // 更新同步元数据
            meta.dirty = false;
            meta.lastSyncAt = new Date().toISOString();
            saveSyncMeta(meta);

            return { success: true, state: merged };
        }

        return { success: false, message: response.data.error };
    } catch (error) {
        console.error('同步失败:', error);
        return { success: false, error };
    }
}

/**
 * 从服务器拉取数据
 */
async function pullFromServer() {
    try {
        const token = await getAuthToken();

        const response = await request({
            url: `/api/users/state`,
            method: 'GET',
            header: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.data.success) {
            const localState = loadState();
            const merged = mergeState(localState, response.data.state);
            saveState(merged);

            return { success: true, state: merged };
        }

        return { success: false, message: response.data.error };
    } catch (error) {
        console.error('拉取失败:', error);
        return { success: false, error };
    }
}

/**
 * 合并状态(冲突解决)
 * @param {Object} local 本地状态
 * @param {Object} server 服务器状态
 * @returns {Object} 合并后的状态
 */
function mergeState(local, server) {
    if (!server) return local;
    if (!local) return server;

    // 基础字段: 以更新时间较新的为准
    const localTime = new Date(local.updatedAt || 0).getTime();
    const serverTime = new Date(server.updatedAt || 0).getTime();

    const base = localTime >= serverTime ? local : server;

    // 累计字段: 取最大值或并集
    return {
        ...base,
        bestStreak: Math.max(local.bestStreak || 0, server.bestStreak || 0),
        totalScore: Math.max(local.totalScore || 0, server.totalScore || 0),
        spellBook: [...new Set([
            ...(local.spellBook || []),
            ...(server.spellBook || [])
        ])],
        updatedAt: new Date().toISOString()
    };
}

/**
 * 监听网络状态变化
 */
function startNetworkListener() {
    wx.onNetworkStatusChange((res) => {
        if (res.isConnected) {
            // 网络恢复，触发同步
            syncToServer();
        }
    });
}

/**
 * 初始化同步(App onLaunch时调用)
 */
async function initSync() {
    // 启动网络监听
    startNetworkListener();

    // 检查网络状态
    wx.getNetworkType({
        success: async (res) => {
            if (res.networkType !== 'none') {
                // 有网络，尝试同步
                await pullFromServer();
            }
        }
    });
}

module.exports = {
    markDirty,
    syncToServer,
    pullFromServer,
    mergeState,
    initSync,
    getAuthToken
};
