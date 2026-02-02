/**
 * role/index.js - 角色创建页
 */

const state = require('../../utils/state.js');
const data = require('../../utils/data.js');
const { createPage, PAGES, redirectTo } = require('../../utils/page-mixin.js');

Page(createPage(PAGES.ROLE, {
  data: {
    talents: data.TALENTS,
    selectedId: null,
    selectedTalent: null,
    dialogueText: '选择你的天赋，让微光与你同行。没有对错之分，只是...你更像哪一种?'
  },

  onShow() {
    // Current State Loading for Re-entry
    const currentState = state.loadState();
    if (currentState.roleTalent) {
      this.setData({
        selectedId: currentState.roleTalent,
        selectedTalent: data.TALENTS.find(t => t.id === currentState.roleTalent)
      });
    }
  },

  onTalentTap(e) {
    const id = e.currentTarget.dataset.id;
    const talent = data.TALENTS.find(t => t.id === id);
    this.setData({
      selectedId: id,
      selectedTalent: talent
    });
    // Vibrate
    wx.vibrateShort({ type: 'light' });
  },

  onConfirm() {
    const { selectedId } = this.data;
    if (!selectedId) {
      return;
    }
    state.setRole(selectedId);
    redirectTo(PAGES.WISHES);
  }
}));
