/**
 * onboarding/index.js - 世界观开场页
 */

const { createPage, PAGES, redirectTo } = require('../../utils/page-mixin.js');

Page(createPage(PAGES.ONBOARDING, {
  data: {
    showDialogue: false,
    showStory: false,
    showButton: false,
    dialogueText: '愿望大陆正在被裂隙侵蚀，我们需要你的微光。',
    storyText: '你要修复的，不是习惯，而是人生愿望城。\n每个愿望都是一座等待点亮的城市。\n你将成为微光法师，用微行动咒语击碎裂隙。\n每天只需做一件小事，就能看到世界变化。'
  },

  onLoad() {
    // Animation sequence handled in onReady or onLoad?
    // T06 says "playIntroSequence" in onLoad.
    // Since mixin wraps onLoad, we can just do it here.
    this.playIntroSequence();
  },

  playIntroSequence() {
    setTimeout(() => {
      this.setData({ showDialogue: true });
    }, 300);

    setTimeout(() => {
      this.setData({ showStory: true });
    }, 800);

    setTimeout(() => {
      this.setData({ showButton: true });
    }, 1200);
  },

  onStart() {
    redirectTo(PAGES.ROLE);
  }
}));
