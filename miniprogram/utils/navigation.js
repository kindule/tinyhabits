const state = require('./state.js');

/**
 * 页面路径常量
 */
const PAGES = {
    ONBOARDING: '/pages/onboarding/index',
    ROLE: '/pages/role/index',
    WISHES: '/pages/wishes/index',
    WORKSHOP: '/pages/workshop/index',
    DAILY: '/pages/daily/index'
};

/**
 * 获取首页路径(根据状态决定)
 * @returns {string} 页面路径
 */
function getHomePage() {
    const currentState = state.loadState();

    // 新用户进入Onboarding
    if (!currentState.hasRole && !currentState.hasWishRank && !currentState.hasDeck) {
        return PAGES.ONBOARDING;
    }

    // 已有状态的用户，根据流程跳转
    if (!currentState.hasRole) {
        return PAGES.ROLE;
    }
    if (!currentState.hasWishRank) {
        return PAGES.WISHES;
    }
    if (!currentState.hasDeck) {
        return PAGES.WORKSHOP;
    }

    return PAGES.DAILY;
}

/**
 * 导航到指定页面(replace当前页)
 * @param {string} url 页面路径
 */
function redirectTo(url) {
    wx.redirectTo({ url });
}

/**
 * 导航到指定页面(保留当前页)
 * @param {string} url 页面路径
 */
function navigateTo(url) {
    wx.navigateTo({ url });
}

/**
 * 导航到首页(根据状态)
 */
function navigateToHome() {
    const homePage = getHomePage();
    redirectTo(homePage);
}

/**
 * 导航到下一个流程页面
 * @param {string} currentPage 当前页面
 */
function navigateToNext(currentPage) {
    const flowOrder = [
        PAGES.ONBOARDING,
        PAGES.ROLE,
        PAGES.WISHES,
        PAGES.WORKSHOP,
        PAGES.DAILY
    ];

    const currentIndex = flowOrder.indexOf(currentPage);
    if (currentIndex >= 0 && currentIndex < flowOrder.length - 1) {
        redirectTo(flowOrder[currentIndex + 1]);
    }
}

/**
 * 页面加载时的流程验证(在页面onLoad/onShow中调用)
 * @param {string} currentPage 当前页面路径
 * @returns {boolean} 是否需要重定向
 */
function validatePageAccess(currentPage) {
    // Onboarding page needs no validation
    if (currentPage === PAGES.ONBOARDING) {
        const currentState = state.loadState();
        // If user has role, they shouldn't see onboarding?
        // Let's allow revisiting onboarding via back, but if strictly validating:
        if (currentState.hasRole) {
            redirectTo(PAGES.ROLE); // Or navigate forward
            return true;
        }
        return false;
    }

    const currentState = state.loadState();

    // Daily页需要验证前置流程
    if (currentPage === PAGES.DAILY) {
        if (!currentState.hasRole) {
            redirectTo(PAGES.ROLE);
            return true;
        }
        if (!currentState.hasWishRank) {
            redirectTo(PAGES.WISHES);
            return true;
        }
        if (!currentState.hasDeck) {
            redirectTo(PAGES.WORKSHOP);
            return true;
        }
    }

    // Workshop页需要验证愿望排序
    if (currentPage === PAGES.WORKSHOP) {
        if (!currentState.hasRole) {
            redirectTo(PAGES.ROLE);
            return true;
        }
        if (!currentState.hasWishRank) {
            redirectTo(PAGES.WISHES);
            return true;
        }
        // Forward Guard
        if (currentState.hasDeck) {
            redirectTo(PAGES.DAILY);
            return true;
        }
    }

    // Wishes页需要验证角色创建
    if (currentPage === PAGES.WISHES) {
        if (!currentState.hasRole) {
            redirectTo(PAGES.ROLE);
            return true;
        }
        // Forward Guard
        if (currentState.hasWishRank) {
            redirectTo(PAGES.WORKSHOP);
            return true;
        }
    }

    // Role page
    if (currentPage === PAGES.ROLE) {
        // Forward Guard
        if (currentState.hasRole) {
            redirectTo(PAGES.WISHES);
            return true;
        }
    }

    return false;
}

module.exports = {
    PAGES,
    getHomePage,
    redirectTo,
    navigateTo,
    navigateToHome,
    navigateToNext,
    validatePageAccess
};
