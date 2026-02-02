const { validatePageAccess, PAGES } = require('./navigation.js');

/**
 * 创建带有流程验证的页面配置
 * @param {string} pagePath 当前页面路径
 * @param {Object} pageConfig 页面配置对象
 * @returns {Object} 增强后的页面配置
 */
function createPage(pagePath, pageConfig) {
    const originalOnLoad = pageConfig.onLoad;
    const originalOnShow = pageConfig.onShow; // Also hook onShow

    pageConfig.onLoad = function (options) {
        // 先验证页面访问权限
        const needRedirect = validatePageAccess(pagePath);
        if (needRedirect) {
            return; // 已重定向，不执行后续逻辑
        }

        // 调用原始onLoad
        if (originalOnLoad) {
            originalOnLoad.call(this, options);
        }
    };

    pageConfig.onShow = function () {
        // 验证页面访问权限 (Handle back navigation or app switch)
        const needRedirect = validatePageAccess(pagePath);
        if (needRedirect) {
            return;
        }

        // 调用原始onShow
        if (originalOnShow) {
            originalOnShow.call(this);
        }
    };

    return pageConfig;
}

module.exports = {
    createPage,
    PAGES
};
