/**
 * 数据埋点工具
 */

// 配置
const config = {
    enabled: true,
    debug: false, // Set to true if you want logs in console
    batchSize: 10,
    flushInterval: 30000 // 30秒批量上报
};

// 事件队列
let eventQueue = [];
let flushTimer = null;

/**
 * 初始化埋点
 */
function init() {
    // 启动定时上报
    flushTimer = setInterval(flush, config.flushInterval);

    // 监听全局错误
    // Note: wx.onError might overlap with other error handlers if any
    wx.onError((error) => {
        trackError('js', error);
    });

    // 监听网络错误
    wx.onNetworkStatusChange((res) => {
        track('network_change', {
            is_connected: res.isConnected,
            network_type: res.networkType
        });
    });
}

/**
 * 跟踪事件
 * @param {string} eventName 事件名
 * @param {Object} properties 事件属性
 */
function track(eventName, properties = {}) {
    if (!config.enabled) return;

    const event = {
        event: eventName,
        properties: {
            ...properties,
            timestamp: Date.now(),
            session_id: getSessionId(),
            page: getCurrentPagePath()
        }
    };

    if (config.debug) {
        console.log('[Analytics]', eventName, properties);
    }

    eventQueue.push(event);

    // 达到批量大小则立即上报
    if (eventQueue.length >= config.batchSize) {
        flush();
    }
}

/**
 * 跟踪错误
 */
function trackError(type, error) {
    track(`error_${type}`, {
        message: error.message || String(error),
        stack: error.stack,
        type
    });
}

/**
 * 设置用户属性
 * @param {Object} properties 用户属性
 */
function setUserProperties(properties) {
    // 存储到本地
    try {
        const existing = wx.getStorageSync('user_properties') || {};
        wx.setStorageSync('user_properties', { ...existing, ...properties });
    } catch (e) {
        console.error('设置用户属性失败:', e);
    }

    // 上报
    track('user_profile', properties);
}

/**
 * 批量上报事件
 */
async function flush() {
    if (eventQueue.length === 0) return;

    const events = [...eventQueue];
    eventQueue = [];

    try {
        // 获取用户属性
        const userProps = wx.getStorageSync('user_properties') || {};

        // Using simple wx.request directly here to avoid circular dep with api.js if api.js uses analytics
        // But ideally we should use api.js if possible. For now, keep it simple specific for analytics.
        // Assuming API_BASE from global config or hardcoded for now, or use relative URL if we had a request helper that didn't dep on this.
        // Let's use the full URL logic or grab it from a constant if possible.
        // Since we are in utils, we can require api.js IF api.js doesn't require analytics.
        // Let's assume we can use the URL directly for safety.

        // IMPORTANT: Check API_BASE. In sync.js/api.js we used a constant.
        // Let's re-use the one from api.js if we can, or just hardcode/configurable.
        const { API_BASE } = require('./api.js');

        await wx.request({
            url: `${API_BASE}/api/analytics/events`,
            method: 'POST',
            data: {
                events,
                user: userProps,
                device: getDeviceInfo()
            },
            timeout: 5000
        });

    } catch (error) {
        // 上报失败，放回队列
        eventQueue = [...events, ...eventQueue];
        // Limit queue size to prevent memory leaks in worst case
        if (eventQueue.length > 100) {
            eventQueue = eventQueue.slice(0, 100);
        }
        console.error('埋点上报失败:', error);
    }
}

/**
 * 获取会话ID
 */
function getSessionId() {
    let sessionId = wx.getStorageSync('session_id');
    if (!sessionId) {
        sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        wx.setStorageSync('session_id', sessionId);
    }
    return sessionId;
}

/**
 * 获取当前页面路径
 */
function getCurrentPagePath() {
    const pages = getCurrentPages();
    if (pages.length > 0) {
        return pages[pages.length - 1].route;
    }
    return '';
}

/**
 * 获取设备信息
 */
function getDeviceInfo() {
    try {
        const systemInfo = wx.getSystemInfoSync();
        return {
            platform: systemInfo.platform,
            system: systemInfo.system,
            brand: systemInfo.brand,
            model: systemInfo.model,
            screenWidth: systemInfo.screenWidth,
            screenHeight: systemInfo.screenHeight,
            wechatVersion: systemInfo.version,
            sdkVersion: systemInfo.SDKVersion
        };
    } catch (e) {
        return {};
    }
}

/**
 * 页面访问跟踪
 */
function trackPageView(pagePath, pageTitle) {
    track('page_view', {
        page_path: pagePath,
        page_title: pageTitle
    });
}

/**
 * 页面离开跟踪
 */
function trackPageLeave(pagePath, stayDuration) {
    track('page_leave', {
        page_path: pagePath,
        stay_duration: stayDuration
    });
}

/**
 * 页面Mixin - 自动跟踪页面访问
 * Can be used to wrap page config
 */
function createTrackedPage(pagePath, pageConfig) {
    let enterTime = 0;

    const originalOnLoad = pageConfig.onLoad;
    const originalOnUnload = pageConfig.onUnload;
    const originalOnHide = pageConfig.onHide;
    const originalOnShow = pageConfig.onShow;

    pageConfig.onLoad = function (options) {
        if (originalOnLoad) {
            originalOnLoad.call(this, options);
        }
    };

    pageConfig.onShow = function () {
        enterTime = Date.now();
        trackPageView(pagePath, pageConfig.pageTitle || pagePath);
        if (originalOnShow) {
            originalOnShow.call(this);
        }
    };

    pageConfig.onUnload = function () {
        const stayDuration = Date.now() - enterTime;
        trackPageLeave(pagePath, stayDuration);
        if (originalOnUnload) {
            originalOnUnload.call(this);
        }
    };

    pageConfig.onHide = function () {
        const stayDuration = Date.now() - enterTime;
        trackPageLeave(pagePath, stayDuration);
        if (originalOnHide) {
            originalOnHide.call(this);
        }
    };

    return pageConfig;
}

module.exports = {
    init,
    track,
    trackError,
    setUserProperties,
    flush,
    trackPageView,
    trackPageLeave,
    createTrackedPage
};
