/**
 * workshop/index.js - 行为工坊页
 */

const state = require('../../utils/state.js');
const data = require('../../utils/data.js');
const { createPage, PAGES, redirectTo } = require('../../utils/page-mixin.js');

function findWishName(wishId) {
  const wish = data.WISHES.find(w => w.id === wishId);
  return wish ? wish.name : '愿望';
}

function toMaterial(behavior, wishId, anchor = null, anchorEmoji = null) {
  return {
    id: behavior.id || 'mat_' + Date.now() + '_' + Math.random().toString(16).slice(2),
    name: behavior.name,
    desc: behavior.desc || '来自愿望的微行动',
    seconds: behavior.seconds || 60,
    difficulty: behavior.difficulty || 1,
    type: behavior.type || 'base',
    wish: wishId,
    anchor: anchor,
    anchorEmoji: anchorEmoji,
    createdAt: Date.now()
  };
}

Page(createPage(PAGES.WORKSHOP, {
  data: {
    wishId: null,
    wishName: '',

    // UI State
    dialogueText: '让我为你召唤一些灵感泡泡~',
    summoning: false,
    generating: false,

    // Data
    summonedBehaviors: [],
    selectedSummon: null,
    pendingBehavior: null, // Behavior waiting for anchor

    materialArea: [],
    selectedMaterials: [], // IDs of selected materials

    // Modals
    showAnchorModal: false,
    loadingAnchors: false,
    anchorOptions: [],

    showSplitModal: false,
    splitResults: [],

    showDeckPreview: false,
    generatedDeck: [],
    mapResult: null
  },

  computed: {
    canSplit() {
      return this.data.selectedMaterials.length === 1;
    },
    canMerge() {
      return this.data.selectedMaterials.length === 2;
    }
  },

  onShow() {
    const currentState = state.loadState();
    const wishId = currentState.currentWish;

    // Load existing materials if any? 
    // Usually start fresh or from state if persisted.
    // T09 desc says "loadState() ... if state.materialArea ...".
    // I'll stick to local state if not persisted, but maybe persist in state.js for better UX?
    // state.js has 'deck' but not 'materialArea'. I'll keep it local or add to state if needed.
    // For now, let's keep it in Page data, but if we navigate away and back?
    // Navigation guards prevent going back easily.

    this.setData({
      wishId,
      wishName: findWishName(wishId)
    });
  },

  // --- Summoning ---
  onSummonTap() {
    this.setData({ summoning: true, summonedBehaviors: [], selectedSummon: null });

    // Mock delay
    setTimeout(() => {
      const behaviors = data.getRandomBehaviors(this.data.wishId, 3);
      this.setData({
        summoning: false,
        summonedBehaviors: behaviors // Raw behaviors, converted when added
      });
      wx.vibrateShort({ type: 'medium' });
    }, 600);
  },

  onSummonedTap(e) {
    const id = e.currentTarget.dataset.id;
    const behavior = this.data.summonedBehaviors.find(b => b.id === id);

    this.setData({
      selectedSummon: id,
      pendingBehavior: behavior,
      showAnchorModal: true,
      loadingAnchors: true,
      anchorOptions: []
    });

    // Mock AI Anchor generation
    setTimeout(() => {
      this.setData({
        loadingAnchors: false,
        anchorOptions: [
          { text: '起床后', emoji: '🌅' },
          { text: '刷牙后', emoji: '🪥' },
          { text: '喝水时', emoji: '💧' },
          { text: '睡前', emoji: '🌙' }
        ]
      });
    }, 500);
  },

  // --- Anchor Modal ---
  closeAnchorModal() {
    this.setData({ showAnchorModal: false, selectedSummon: null });
  },

  onAnchorSelect(e) {
    const anchor = e.currentTarget.dataset.anchor;
    const behavior = this.data.pendingBehavior;
    const wishId = this.data.wishId;

    const newMaterial = toMaterial(behavior, wishId, anchor.text, anchor.emoji);

    this.setData({
      materialArea: [...this.data.materialArea, newMaterial],
      showAnchorModal: false,
      summonedBehaviors: [], // Clear summoned after picking one? Or keep?
      // UX: Usually pick one and others disappear or stay?
      // Let's clear to encourage re-summoning or focus.
      // T09 Design says "Summoned bubbles" stay in Crystal Area.
      // Let's clear for simplicity as per "onSummonTap" resets them.
      selectedSummon: null,
      dialogueText: '太棒了！继续召唤，或者试试裂变和合成~'
    });
  },

  // --- Material Area ---
  onMaterialTap(e) {
    const id = e.currentTarget.dataset.id;
    const { materialArea, selectedMaterials } = this.data;

    // Toggle selection in list
    const index = selectedMaterials.indexOf(id);
    let newSelected = [...selectedMaterials];

    if (index > -1) {
      newSelected.splice(index, 1);
    } else {
      if (newSelected.length >= 2) {
        // limit to 2 for merge
        wx.showToast({ title: '最多选择2个', icon: 'none' });
        return;
      }
      newSelected.push(id);
    }

    // Update local _selected prop for UI (optional, or use computed in wxml)
    const updatedArea = materialArea.map(m => ({
      ...m,
      _selected: newSelected.includes(m.id)
    }));

    this.setData({
      selectedMaterials: newSelected,
      materialArea: updatedArea,
      // Update canSplit/canMerge in wxml or use observers?
      // Miniprogram doesn't have Vue computed by default unless using behaviors.
      // I will manually set properties if needed, or wxml logic `{{selectedMaterials.length === 1}}`
    });

    // Update action buttons state (handled by wxml logic using selectedMaterials.length)
    // I'll calculate flags for convenience
    this.setData({
      canSplit: newSelected.length === 1,
      canMerge: newSelected.length === 2
    });
  },

  // --- Split ---
  onSplitTap() {
    if (this.data.selectedMaterials.length !== 1) return;
    const id = this.data.selectedMaterials[0];
    const target = this.data.materialArea.find(m => m.id === id);

    const results = data.getFissionResult(target.name).slice(0, 3).map((name, i) => ({
      ...toMaterial({ name, seconds: 30, difficulty: 1 }, this.data.wishId),
      id: 'fis_' + Date.now() + '_' + i
    }));

    this.setData({
      splitResults: results,
      showSplitModal: true
    });
  },

  onSplitResultTap(e) {
    const behavior = e.currentTarget.dataset.behavior;
    // Add split result to materials
    const newMaterial = { ...behavior, anchor: '裂变产生的', anchorEmoji: '⚡' };

    this.setData({
      materialArea: [...this.data.materialArea, newMaterial],
      showSplitModal: false,
      selectedMaterials: [], // Reset selection
      canSplit: false,
      canMerge: false,

      // Clear selection visuals
      materialArea: [...this.data.materialArea, newMaterial].map(m => ({ ...m, _selected: false }))
    });
    wx.showToast({ title: '已加入素材区', icon: 'none' });
  },

  closeSplitModal() {
    this.setData({ showSplitModal: false });
  },

  // --- Merge ---
  onMergeTap() {
    if (this.data.selectedMaterials.length !== 2) return;
    const [id1, id2] = this.data.selectedMaterials;
    const m1 = this.data.materialArea.find(m => m.id === id1);
    const m2 = this.data.materialArea.find(m => m.id === id2);

    const merged = data.synthesize(m1, m2);
    const newMaterial = toMaterial(merged, this.data.wishId, '组合技', '🔗');

    // Remove originals? Or keep?
    // Game design: usually consume materials.
    const newArea = this.data.materialArea.filter(m => m.id !== id1 && m.id !== id2);
    newArea.push(newMaterial);

    this.setData({
      materialArea: newArea.map(m => ({ ...m, _selected: false })),
      selectedMaterials: [],
      canSplit: false,
      canMerge: false,
      dialogueText: '哇！新的魔法诞生了！'
    });

    wx.vibrateShort({ type: 'heavy' });
  },

  // --- Generate Deck ---
  async onGenerateTap() {
    this.setData({ generating: true });

    // Mock Deck Gen
    await new Promise(r => setTimeout(r, 800));

    const deck = this.buildDeck(this.data.materialArea, this.data.wishId);

    this.setData({
      generating: false,
      generatedDeck: deck,
      showDeckPreview: true,
      mapResult: { overall: 'Pass' } // Mock result
    });
  },

  buildDeck(materials, wishId) {
    // Pick 3 diverse cards from materials + pool
    // Simple logic: take up to 3 from materials, fill with defaults if needed
    let chosen = materials.slice(0, 3);
    if (chosen.length < 3) {
      const pool = data.getBehaviorsByWish(wishId);
      while (chosen.length < 3) {
        const b = pool[Math.floor(Math.random() * pool.length)];
        chosen.push(toMaterial(b, wishId, '自动填充', '🤖'));
      }
    }

    // Assign types
    return chosen.map((c, i) => ({
      ...c,
      type: i === 0 ? 'base' : (i === 1 ? 'main' : 'bonus')
    }));
  },

  onConfirmDeck() {
    state.setDeck(this.data.generatedDeck);
    redirectTo(PAGES.DAILY);
  },

  stopProp() { }

}));
