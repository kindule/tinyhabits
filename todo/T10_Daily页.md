# T10: Daily每日卡片页

> **优先级**: P0 (必须实现)
> **预估工时**: 1.5天
> **负责人**: 前端开发
> **状态**: ✅ DONE

---

## 一、任务描述

实现每日微行动卡片页面，展示今日抽取的卡片，完成微行动后触发裂隙击碎反馈和Arc鼓励。

---

## 二、验收标准

- [ ] 展示今日卡片(锚点+行为+时长+难度)
- [ ] 按Day进度展示Arc/Rift对话
- [ ] "开始施放"→"完成"两步操作
- [ ] 裂隙宣言卡从底部滑入
- [ ] 点击"击碎"触发击碎动画
- [ ] Arc鼓励台词出现
- [ ] Day+1、积分更新、Streak更新
- [ ] 今日已完成时按钮置灰

---

## 三、页面设计

```
┌─────────────────────────────────────────────┐
│                                             │
│   Day 3 / 7    ━━━━━━━━━━○○○○               │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  🌟  "你做到了最难的一步:开始。"    │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │         ✨ 今日咒语 ✨               │   │
│   │                                     │   │
│   │     🪥 刷牙后 → 喝一杯水            │   │
│   │                                     │   │
│   │     ⏱️ 30秒     ★ 简单             │   │
│   │                                     │   │
│   │    [ 💰财富 ]  [ 保底卡 ]           │   │
│   │                                     │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │          [ 开始施放 ]               │   │
│   └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 四、技术实现

### 4.1 页面结构 `pages/daily/index.wxml`

```html
<view class="page daily-page">
  <!-- 进度条 -->
  <view class="progress-header">
    <text class="day-text">Day {{day}} / 7</text>
    <view class="day-dots">
      <view 
        wx:for="{{7}}" 
        wx:key="index"
        class="day-dot {{index < day ? 'filled' : ''}}"
      ></view>
    </view>
  </view>
  
  <!-- 对话区 -->
  <view class="dialogue-wrap">
    <dialogue-bubble 
      character="{{dialogue.character}}"
      text="{{dialogue.text}}"
      animate="{{true}}"
    />
  </view>
  
  <!-- 今日卡片 -->
  <view class="card-wrap">
    <main-card class="daily-card {{todayDone ? 'completed' : ''}}">
      <view class="card-header">
        <text class="card-title">✨ 今日咒语 ✨</text>
      </view>
      
      <view class="card-body">
        <text class="card-action">
          {{todayCard.anchorEmoji}} {{todayCard.anchor}} → {{todayCard.name}}
        </text>
      </view>
      
      <view class="card-footer">
        <view class="card-meta">
          <text class="meta-item">⏱️ {{todayCard.seconds}}秒</text>
          <text class="meta-item">{{'★'.repeat(todayCard.difficulty)}} {{difficultyText}}</text>
        </view>
        <view class="card-tags">
          <tag-pill text="{{currentWish}}" type="gold" />
          <tag-pill text="{{cardTypeText}}" />
        </view>
      </view>
    </main-card>
  </view>
  
  <!-- 连续天数 -->
  <view class="streak-info" wx:if="{{streak > 0}}">
    <text class="streak-text">🔥 连续 {{streak}} 天</text>
  </view>
  
  <!-- 救援提示 -->
  <view class="rescue-hint" wx:if="{{isRescue}}">
    <text>救援咒语已准备好,微光不会消失</text>
  </view>
  
  <!-- 底部按钮 -->
  <view class="footer safe-bottom">
    <primary-button 
      wx:if="{{!started && !todayDone}}"
      text="开始施放"
      bind:tap="onStartTap"
    />
    <primary-button 
      wx:elif="{{started && !todayDone}}"
      text="完成 ✨"
      bind:tap="onCompleteTap"
    />
    <view wx:else class="completed-hint">
      <text>✅ 今日已完成</text>
    </view>
  </view>
  
  <!-- 裂隙击碎浮层 -->
  <view class="rift-overlay {{showRift ? 'visible' : ''}}">
    <view class="rift-card {{riftAnimating ? 'shaking' : ''}} {{riftShattered ? 'shattered' : ''}}">
      <view class="rift-avatar"></view>
      <text class="rift-message">{{riftMessage}}</text>
      <button class="shatter-btn" bindtap="onShatterTap" wx:if="{{!riftShattered}}">
        击碎裂隙 💥
      </button>
    </view>
  </view>
  
  <!-- 完成庆祝浮层 -->
  <view class="celebration-overlay {{showCelebration ? 'visible' : ''}}">
    <view class="celebration-content">
      <dialogue-bubble 
        character="arc"
        text="{{encourageText}}"
        animate="{{true}}"
      />
      <view class="celebration-stats">
        <text class="stat-item">Day {{day}} 完成!</text>
        <text class="stat-item">+10 积分</text>
        <text class="stat-item">🔥 连续 {{streak}} 天</text>
      </view>
      <primary-button text="继续" bind:tap="onCelebrationClose" />
    </view>
  </view>
</view>
```

### 4.2 页面逻辑 `pages/daily/index.js`

```javascript
const { loadState, updateState } = require('../../utils/state.js');
const { drawTodayCard, getRescueCard } = require('../../utils/card-draw.js');
const { updateStreak, checkStreakStatus } = require('../../utils/streak.js');
const { getDayDialogue, getEncourageText, getRiftMessage } = require('../../data/dialogues.js');
const { PAGES, redirectTo } = require('../../utils/navigation.js');
const { isToday, getTodayString } = require('../../utils/date.js');

Page({
  data: {
    day: 1,
    todayCard: null,
    currentWish: '',
    streak: 0,
    todayDone: false,
    started: false,
    isRescue: false,
    
    dialogue: { character: 'arc', text: '' },
    
    // 裂隙相关
    showRift: false,
    riftMessage: '',
    riftAnimating: false,
    riftShattered: false,
    
    // 庆祝相关
    showCelebration: false,
    encourageText: ''
  },
  
  onLoad() {
    this.initDaily();
  },
  
  onShow() {
    // 每次显示时刷新状态
    this.refreshState();
  },
  
  initDaily() {
    const state = loadState();
    
    // 检查今日是否已完成
    const todayDone = state.todayDone && isToday(state.lastDoneDate);
    
    // 检查Streak状态(是否需要救援卡)
    const streakStatus = checkStreakStatus();
    const isRescue = streakStatus.status === 'broken';
    
    // 抽取今日卡片
    let todayCard;
    if (isRescue) {
      todayCard = getRescueCard(state.deck);
    } else {
      todayCard = drawTodayCard(state.deck, state.streak);
    }
    
    // 获取Day对话
    const dialogue = getDayDialogue(state.day);
    
    this.setData({
      day: state.day,
      todayCard,
      currentWish: state.currentWish,
      streak: state.streak,
      todayDone,
      isRescue,
      dialogue,
      difficultyText: this.getDifficultyText(todayCard.difficulty),
      cardTypeText: this.getCardTypeText(todayCard.type)
    });
  },
  
  refreshState() {
    const state = loadState();
    const todayDone = state.todayDone && isToday(state.lastDoneDate);
    this.setData({ todayDone, streak: state.streak, day: state.day });
  },
  
  getDifficultyText(difficulty) {
    return ['简单', '中等', '挑战'][difficulty - 1] || '简单';
  },
  
  getCardTypeText(type) {
    return { base: '保底卡', main: '主线卡', bonus: '彩蛋卡' }[type] || '保底卡';
  },
  
  onStartTap() {
    this.setData({ started: true });
    wx.vibrateShort({ type: 'light' });
  },
  
  onCompleteTap() {
    // 显示裂隙宣言
    const riftMessage = getRiftMessage();
    this.setData({
      showRift: true,
      riftMessage
    });
  },
  
  onShatterTap() {
    // 触发击碎动画
    this.setData({ riftAnimating: true });
    wx.vibrateShort({ type: 'heavy' });
    
    setTimeout(() => {
      this.setData({ riftShattered: true });
      
      setTimeout(() => {
        this.completeHabit();
      }, 300);
    }, 400);
  },
  
  completeHabit() {
    const state = loadState();
    
    // 更新Streak
    updateStreak(state);
    
    // 更新Day进度
    const isDay7 = state.day >= 7;
    if (!isDay7) {
      state.day += 1;
    }
    
    // 更新完成状态
    state.todayDone = true;
    state.lastDoneDate = getTodayString();
    state.totalScore += 10;
    
    // 记录历史
    state.history = state.history || [];
    state.history.push({
      date: getTodayString(),
      cardName: this.data.todayCard.name,
      seconds: this.data.todayCard.seconds
    });
    if (state.history.length > 7) {
      state.history = state.history.slice(-7);
    }
    
    // 更新咒语图鉴
    if (!state.spellBook.includes(this.data.todayCard.name)) {
      state.spellBook.push(this.data.todayCard.name);
    }
    
    updateState(state);
    
    // 获取鼓励台词
    const encourageText = getEncourageText(state.day);
    
    // 显示庆祝
    this.setData({
      showRift: false,
      showCelebration: true,
      encourageText,
      streak: state.streak,
      day: state.day
    });
    
    // 如果是Day 7，跳转到Day7剧情页
    if (isDay7) {
      setTimeout(() => {
        redirectTo('/pages/day7/index');
      }, 2000);
    }
  },
  
  onCelebrationClose() {
    this.setData({
      showCelebration: false,
      todayDone: true,
      started: false
    });
  }
});
```

### 4.3 页面样式 `pages/daily/index.wxss`

```css
.daily-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--gradient-daily);
}

/* 进度条 */
.progress-header {
  padding: var(--page-pad);
  padding-top: 100rpx;
  display: flex;
  align-items: center;
  gap: var(--gap-md);
}

.day-text {
  font-size: var(--font-h2);
  font-weight: var(--weight-bold);
  color: var(--c-text);
}

.day-dots {
  display: flex;
  gap: var(--gap-sm);
}

.day-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: rgba(31, 42, 55, 0.1);
  transition: all 200ms ease-out;
}

.day-dot.filled {
  background: var(--c-gold);
  box-shadow: 0 0 10rpx rgba(246, 200, 95, 0.5);
}

/* 卡片区 */
.card-wrap {
  padding: var(--page-pad);
  flex: 1;
}

.daily-card.completed {
  opacity: 0.7;
}

.card-header {
  text-align: center;
  margin-bottom: var(--gap-lg);
}

.card-title {
  font-size: var(--font-h2);
  color: var(--c-gold);
}

.card-body {
  text-align: center;
  padding: var(--gap-xl) 0;
}

.card-action {
  font-size: 36rpx;
  font-weight: var(--weight-medium);
  color: var(--c-text);
  line-height: 1.5;
}

.card-footer {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
}

.card-meta {
  display: flex;
  justify-content: center;
  gap: var(--gap-lg);
}

.meta-item {
  font-size: var(--font-sub);
  color: var(--c-subtext);
}

.card-tags {
  display: flex;
  justify-content: center;
  gap: var(--gap-sm);
}

/* 连续天数 */
.streak-info {
  text-align: center;
  padding: var(--gap-md);
}

.streak-text {
  font-size: var(--font-body);
  color: var(--c-gold);
  font-weight: var(--weight-medium);
}

/* 裂隙浮层 */
.rift-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 300ms ease-out;
  z-index: 100;
}

.rift-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}

.rift-card {
  background: var(--c-rift-light);
  border-radius: var(--radius-card);
  padding: var(--gap-xl);
  margin: var(--page-pad);
  text-align: center;
  animation: slideUp 300ms ease-out;
}

.rift-card.shaking {
  animation: riftShake 400ms ease-in-out;
}

.rift-card.shattered {
  animation: riftExplode 300ms ease-out forwards;
}

.rift-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #2B1B3D, #5E4C7A);
  margin: 0 auto var(--gap-lg);
}

.rift-message {
  font-size: var(--font-body);
  color: #FFFFFF;
  opacity: 0.9;
  display: block;
  margin-bottom: var(--gap-xl);
}

.shatter-btn {
  background: linear-gradient(90deg, #FF6B4A, #FFB020);
  color: #FFFFFF;
  border: none;
  border-radius: var(--radius-btn);
  padding: var(--gap-md) var(--gap-xl);
  font-size: var(--font-body);
  font-weight: var(--weight-medium);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes riftShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10rpx) rotate(-2deg); }
  75% { transform: translateX(10rpx) rotate(2deg); }
}

@keyframes riftExplode {
  to {
    opacity: 0;
    transform: scale(1.5);
    filter: blur(20rpx);
  }
}

/* 庆祝浮层 */
.celebration-overlay {
  position: fixed;
  inset: 0;
  background: rgba(250, 251, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 300ms ease-out;
  z-index: 100;
}

.celebration-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}

.celebration-content {
  padding: var(--page-pad);
  text-align: center;
}

.celebration-stats {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  margin: var(--gap-xl) 0;
}

.stat-item {
  font-size: var(--font-body);
  color: var(--c-text);
}

.completed-hint {
  text-align: center;
  padding: var(--gap-lg);
}

.completed-hint text {
  font-size: var(--font-body);
  color: var(--c-success);
}
```

---

## 五、依赖任务

- **T14**: 完成反馈与裂隙击碎系统
- **T04**: 状态管理
- **T21**: 台词库数据

---

## 六、测试要点

1. 卡片正确展示锚点和行为
2. 按Day进度显示正确的对话
3. 裂隙击碎动画流畅
4. 完成后状态正确更新
5. 今日已完成时不可重复操作
6. Day 7时跳转到Day7剧情页

---

## 七、交付物

- [x] `pages/daily/index.wxml`
- [x] `pages/daily/index.wxss`
- [x] `pages/daily/index.js`
- [x] `pages/daily/index.json`
