/**
 * wishes/index.js - 愿望排序页
 */

const state = require('../../utils/state.js');
const data = require('../../utils/data.js');
const { createPage, PAGES } = require('../../utils/page-mixin.js');

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

Page(createPage(PAGES.WISHES, {
  data: {
    stage: 'duel',
    wishes: data.WISHES,
    roundIndex: 0,
    totalRounds: 7,
    leftWish: {},
    rightWish: {},
    selectedId: null,
    scores: {},
    rankedWishes: [],
    coreWish: {},
    mainWishes: [],
    laterWishes: [],
    btnShimmer: false
  },

  onShow() {
    // Check if we need to init duel?
    // If returning from background, we might want to keep state?
    // But this page is usually visited once per "City".
    // If simply revisiting, maybe we shouldn't reset?
    // But logic says initDuel().
    // We should check if we already have data?
    // The previous implementation blindly called initDuel if validation passed.
    // Let's keep it simple and just init if stage is duel?
    // Actually, onShow runs every time. If we rotate screen or switch app.
    // We shouldn't reset progress.
    // But standard MP behavior: page stays in memory unless redirected.
    // Converting to mixin: onShow is hooked.
    // If I keep initDuel here, it resets on every show.
    // Previous code:
    /*
    onShow() {
        ... validation ...
        this.initDuel();
    }
    */
    // So it DID reset on every show.
    // I'll keep it consistent.
    this.initDuel();
  },

  initDuel() {
    const scores = {};
    data.WISHES.forEach(w => {
      scores[w.id] = 0;
    });
    const pair = this.getRandomPair();
    this.setData({
      stage: 'duel',
      roundIndex: 0,
      scores,
      leftWish: pair[0],
      rightWish: pair[1],
      selectedId: null
    });
  },

  getRandomPair() {
    const shuffled = shuffle(data.WISHES);
    return [shuffled[0], shuffled[1]];
  },

  onSelectWish(e) {
    const id = e.currentTarget.dataset.id;
    const { scores, roundIndex, totalRounds } = this.data;

    scores[id] = (scores[id] || 0) + 1;

    this.setData({ selectedId: id, scores });

    setTimeout(() => {
      if (roundIndex + 1 >= totalRounds) {
        this.finishDuel();
      } else {
        const pair = this.getRandomPair();
        this.setData({
          roundIndex: roundIndex + 1,
          leftWish: pair[0],
          rightWish: pair[1],
          selectedId: null
        });
      }
    }, 220);
  },

  finishDuel() {
    const { scores } = this.data;
    const ranked = [...data.WISHES].sort((a, b) => {
      if (scores[b.id] !== scores[a.id]) {
        return scores[b.id] - scores[a.id];
      }
      return Math.random() - 0.5;
    });

    const coreWish = ranked[0];
    const mainWishes = ranked.slice(1, 3);
    const laterWishes = ranked.slice(3);

    this.setData({
      stage: 'destiny',
      rankedWishes: ranked,
      coreWish,
      mainWishes,
      laterWishes
    });
  },

  onSwapCore(e) {
    const id = e.currentTarget.dataset.id;
    const { coreWish, mainWishes, laterWishes, rankedWishes } = this.data;
    if (coreWish.id === id) {
      return;
    }

    let newCore = coreWish;
    let fromList = null;
    let fromIndex = -1;

    mainWishes.forEach((wish, index) => {
      if (wish.id === id) {
        newCore = wish;
        fromList = 'main';
        fromIndex = index;
      }
    });

    laterWishes.forEach((wish, index) => {
      if (wish.id === id) {
        newCore = wish;
        fromList = 'later';
        fromIndex = index;
      }
    });

    if (!fromList) {
      return;
    }

    if (fromList === 'main') {
      const nextMain = [...mainWishes];
      nextMain[fromIndex] = coreWish;
      this.setData({ coreWish: newCore, mainWishes: nextMain });
    }

    if (fromList === 'later') {
      const nextLater = [...laterWishes];
      nextLater[fromIndex] = coreWish;
      this.setData({ coreWish: newCore, laterWishes: nextLater });
    }

    const nextRanked = rankedWishes.map(wish => {
      if (wish.id === coreWish.id) return newCore;
      if (wish.id === newCore.id) return coreWish;
      return wish;
    });

    this.setData({ rankedWishes: nextRanked });
  },

  onConfirm() {
    const { rankedWishes, coreWish } = this.data;
    this.triggerShimmer();
    const rankIds = rankedWishes.map(w => w.id);
    state.setWishRank(rankIds, coreWish.id);
    wx.redirectTo({ url: '/pages/workshop/index' });
  },

  triggerShimmer() {
    this.setData({ btnShimmer: true });
    setTimeout(() => {
      this.setData({ btnShimmer: false });
    }, 220);
  }
}));
