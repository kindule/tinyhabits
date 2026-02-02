/**
 * 网络请求封装
 */

// Use local IP for development or production URL
// In real dev, we might use http://localhost:3002 but for MP we need actual IP or configured domain
// For now, we put a placeholder or localhost (which works in simulator if "Start local server" is handled by IDE, but usually requires IP)
const API_BASE = 'http://localhost:3002';

/**
 * 发起请求
 * @param {Object} options 请求选项
 * @returns {Promise} 响应
 */
function request(options) {
    return new Promise((resolve, reject) => {
        wx.request({
            ...options,
            url: options.url.startsWith('http') ? options.url : `${API_BASE}${options.url}`,
            timeout: options.timeout || 10000,
            success: (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(res);
                } else {
                    // Wrap error for easier handling
                    const error = new Error(`HTTP ${res.statusCode}`);
                    error.status = res.statusCode;
                    error.data = res.data;
                    reject(error);
                }
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
}

/**
 * 带重试的请求
 * @param {Object} options 请求选项
 * @param {number} retries 重试次数
 * @returns {Promise} 响应
 */
async function requestWithRetry(options, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await request(options);
        } catch (error) {
            if (i === retries - 1) throw error;
            // Exponential backoff or simple delay
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
}

module.exports = {
    request,
    requestWithRetry,
    API_BASE
};
