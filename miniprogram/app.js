const state = require('./utils/state.js');
const navigation = require('./utils/navigation.js');
const sync = require('./utils/sync.js');

App({
  onLaunch() {
    state.checkDailyReset();
    sync.initSync();
    this.checkUpdate();
  },

  onShow(options) {
    state.checkDailyReset();

    // 如果是从分享进入等场景，需要验证页面
    if (options.scene === 1007 || options.scene === 1008) {
      // 从分享进入，跳转到正确的首页
      const homePage = navigation.getHomePage();
      const pages = getCurrentPages();
      if (pages.length === 0) {
        navigation.redirectTo(homePage);
      }
    }
  },

  globalData: {
    version: '1.0.0-MVP',
    appName: '微光咒语'
  },

  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          console.log('发现新版本');
        }
      });
      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });
    }
  }
});
