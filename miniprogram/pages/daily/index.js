/**
 * daily/index.js - 每日微行动
 */

const state = require('../../utils/state.js');
const data = require('../../utils/data.js');
const { createPage, PAGES, redirectTo } = require('../../utils/page-mixin.js');

function findWishName(wishId) {
  const wish = data.WISHES.find(w => w.id === wishId);
  return wish ? wish.name : '愿望';
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}秒`;
  return `${Math.ceil(seconds / 60)}分钟`;
}

function normalizeCard(card) {
  const difficulty = card.difficulty || 1;
  return {
    ...card,
    difficulty,
    difficultyStars: '★'.repeat(difficulty),
    durationText: formatDuration(card.seconds || 60)
  };
}

Page(createPage(PAGES.DAILY, {
  data: {
    day: 1,
    card: null,
    currentWishName: '',
    streak: 0,
    isRescue: false,
    todayDone: false,

    // UI State
    stage: 'ready', // ready, casting, rift, encourage, completed
    speaker: { id: 'arc', name: 'Arc', text: '' },

    // Animation States
    isShattering: false,
    isBright: false,
    showCityComplete: false,
    riftDeclaration: ''
  },

  onShow() {
    const currentState = state.checkDailyReset();

    // If completed today, show completion state
    if (currentState.todayDone) {
      this.setData({
        stage: 'completed',
        day: currentState.day,
        streak: currentState.streak,
        todayDone: true
      });
      // We still need card info for display if desired?
      // Usually show "Come back tomorrow".
      // Or show the card that was done.
      // History has it? state.history.
    }

    this.initDaily(currentState);
  },

  initDaily(currentState) {
    const day = currentState.day;
    const today = state.getTodayString();
    const dialogue = data.getDayDialogue(day);

    // Check Rescue
    let isRescue = false;
    if (currentState.forceRescue) {
      isRescue = true;
    } else if (currentState.lastDoneDate) {
      const last = new Date(currentState.lastDoneDate);
      const now = new Date(today);
      const diff = (now - last) / (1000 * 3600 * 24);
      if (diff > 1 && !currentState.todayDone) isRescue = true;
    }

    // Draw Card
    // If already drawn today? 
    // Simplified: Just draw fresh or deterministic based on seed if implemented.
    // state.js `drawTodayCard` handles random.
    // If we want to persist the SAME card for the day, we need to store it in state.
    // Current state.js doesn't seem to persist "todaysCard" specifically, just history.
    // But `checkDailyReset` resets things.
    // Let's assume drawTodayCard is stable enough or we redraw.
    const card = normalizeCard(isRescue ? data.getRandomRescueCard() : state.drawTodayCard(currentState));

    // Logic for speaker text based on completion
    let text = dialogue.arc;
    if (currentState.todayDone) text = "做得好，明天见。";

    this.setData({
      day,
      streak: currentState.streak,
      isRescue,
      card,
      currentWishName: findWishName(currentState.currentWish),
      speaker: { id: 'arc', text },
      todayDone: currentState.todayDone,
      stage: currentState.todayDone ? 'completed' : 'ready'
    });
  },

  onStart() {
    this.setData({
      stage: 'casting',
      speaker: { id: 'arc', text: '去吧，只要完成这最小的一步。' }
    });
  },

  onComplete() {
    const dayDialogue = data.getDayDialogue(this.data.day);
    this.setData({
      stage: 'rift',
      riftDeclaration: data.getRandomRiftDeclaration(),
      speaker: { id: 'rift', text: dayDialogue.rift || '...' }
    });
  },

  onShatter() {
    this.setData({ isShattering: true });
    wx.vibrateShort({ type: 'heavy' });

    // Animation Delay
    setTimeout(() => {
      this.completeLogic();
    }, 600);
  },

  completeLogic() {
    const card = this.data.card;
    const updatedState = state.completeToday(card);
    const encouragement = data.getRandomEncouragement();

    // Check if city completed (Day 7)
    // updatedState.day is incremented if not day 7 logic...
    // My state.js completeToday increments day.
    // If day was 7, it might wrap or stay 7.
    // Let's rely on previous day to know if we finished city.
    const prevDay = this.data.day;
    const showCityComplete = prevDay >= 7;

    this.setData({
      stage: 'encourage',
      isShattering: false,
      isBright: true, // Flash
      speaker: { id: 'arc', text: encouragement },
      streak: updatedState.streak,
      showCityComplete,
      todayDone: true
    });

    // Remove flash calc
    setTimeout(() => {
      this.setData({ isBright: false });
    }, 500);
  },

  onFinish() {
    this.setData({ stage: 'completed' });
  },

  onNextCity() {
    state.completeCity();
    redirectTo(PAGES.WISHES);
  }
}));
