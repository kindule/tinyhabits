/**
 * day7/index.js - Day7 愿望城完成剧情页
 */

const state = require('../../utils/state.js');
const data = require('../../utils/data.js');
const { PAGES, redirectTo } = require('../../utils/page-mixin.js');

function findWishName(wishId) {
    const wish = data.WISHES.find(w => w.id === wishId);
    return wish ? wish.name : '愿望城';
}

Page({
    data: {
        currentWishName: '',
        streak: 0,
        spellCount: 0,

        // 动画控制
        showDialogue1: false,
        showDialogue2: false,
        showCity: false,
        cityPhase: 'wasteland', // 'wasteland' | 'village' | 'city'
        showGlow: false,
        showParticles: false,
        showAchievement: false,
        showButtons: false
    },

    onLoad() {
        this.initData();
        this.playAnimation();
    },

    initData() {
        const currentState = state.loadState();
        this.setData({
            currentWishName: findWishName(currentState.currentWish),
            streak: currentState.streak || 7,
            spellCount: currentState.spellBook ? currentState.spellBook.length : 3
        });
    },

    playAnimation() {
        // 动画时间线
        const timeline = [
            { delay: 300, action: () => this.setData({ showDialogue1: true }) },
            { delay: 1500, action: () => this.setData({ showDialogue2: true }) },
            { delay: 2500, action: () => this.setData({ showCity: true, cityPhase: 'wasteland' }) },
            { delay: 3000, action: () => this.setData({ cityPhase: 'village' }) },
            { delay: 3500, action: () => this.setData({ cityPhase: 'city' }) },
            { delay: 4000, action: () => this.setData({ showGlow: true }) },
            {
                delay: 4300, action: () => {
                    this.setData({ showParticles: true });
                    wx.vibrateShort({ type: 'heavy' });
                }
            },
            { delay: 5000, action: () => this.setData({ showAchievement: true }) },
            { delay: 5500, action: () => this.setData({ showButtons: true }) }
        ];

        timeline.forEach(({ delay, action }) => {
            setTimeout(action, delay);
        });
    },

    onSelectNewWish() {
        // 完成当前城市，开始新城市
        state.completeCity();
        redirectTo(PAGES.WISHES);
    },

    onContinueCurrent() {
        // 仅重置Day，继续当前愿望城
        state.updateState({
            day: 1,
            todayDone: false
        });

        redirectTo(PAGES.DAILY);
    }
});
