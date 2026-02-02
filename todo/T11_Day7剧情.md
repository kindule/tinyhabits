# T11: Day7剧情与愿望城完成

> **优先级**: P0 (必须实现)
> **预估工时**: 1天
> **负责人**: 前端开发
> **状态**: ✅ DONE

---

## 一、任务描述

实现Day7完成后的里程碑剧情页面，展示愿望城修复完成庆祝动画，引导用户选择下一座愿望城。

---

## 二、验收标准

- [ ] Arc导师剧情对话
- [ ] 愿望城进化动画(荒地→村庄→城市)
- [ ] 金色光芒粒子效果
- [ ] 统计数据展示(Streak、积分、咒语图鉴)
- [ ] "选择下一座愿望城"按钮
- [ ] "继续当前愿望城"按钮
- [ ] 选择后正确重置状态并跳转

---

## 三、页面设计

```
┌─────────────────────────────────────────────┐
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  🌟  "第一座愿望城修复完成。"       │   │
│   │  🌟  "微光会带你去下一座城。"       │   │
│   └─────────────────────────────────────┘   │
│                                             │
│                                             │
│            ┌─────────────┐                  │
│            │             │                  │
│            │  🏰 愿望城  │                  │
│            │ ✨ 修复完成 ✨│                 │
│            │             │                  │
│            └─────────────┘                  │
│                                             │
│           ✨✨✨ 金色光芒 ✨✨✨              │
│                                             │
│   ─────────── 本次成就 ───────────          │
│   🔥 连续7天  📊 +70分  📖 解锁5个咒语    │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │       [ 选择下一座愿望城 ]          │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │       [ 继续当前愿望城 ]            │   │
│   └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 四、技术实现

### 4.1 页面结构 `pages/day7/index.wxml`

```html
<view class="page day7-page">
  <!-- 对话区 -->
  <view class="dialogue-wrap">
    <dialogue-bubble 
      wx:if="{{showDialogue1}}"
      character="arc"
      text="第一座愿望城修复完成。"
      animate="{{true}}"
    />
    <dialogue-bubble 
      wx:if="{{showDialogue2}}"
      character="arc"
      text="微光会带你去下一座城。"
      animate="{{true}}"
    />
  </view>
  
  <!-- 愿望城动画区 -->
  <view class="city-animation {{showCity ? 'visible' : ''}}">
    <view class="city-container {{cityPhase}}">
      <!-- 城市轮廓 -->
      <view class="city-silhouette">
        <view class="building main-building"></view>
        <view class="building side-building left"></view>
        <view class="building side-building right"></view>
      </view>
      
      <!-- 金色光芒 -->
      <view class="golden-glow" wx:if="{{showGlow}}"></view>
      
      <!-- 粒子效果 -->
      <view class="particles" wx:if="{{showParticles}}">
        <view class="particle" wx:for="{{12}}" wx:key="index" style="--delay: {{index * 0.1}}s"></view>
      </view>
    </view>
    
    <text class="city-name">{{currentWish}}</text>
    <text class="city-status">✨ 修复完成 ✨</text>
  </view>
  
  <!-- 成就统计 -->
  <view class="achievement-section {{showAchievement ? 'visible' : ''}}">
    <text class="section-title">本次成就</text>
    <view class="achievement-list">
      <view class="achievement-item">
        <text class="achievement-icon">🔥</text>
        <text class="achievement-label">连续</text>
        <text class="achievement-value">{{bestStreak}}天</text>
      </view>
      <view class="achievement-item">
        <text class="achievement-icon">📊</text>
        <text class="achievement-label">积分</text>
        <text class="achievement-value">+70</text>
      </view>
      <view class="achievement-item">
        <text class="achievement-icon">📖</text>
        <text class="achievement-label">解锁</text>
        <text class="achievement-value">{{spellCount}}个咒语</text>
      </view>
    </view>
  </view>
  
  <!-- 底部按钮 -->
  <view class="footer safe-bottom {{showButtons ? 'visible' : ''}}">
    <primary-button 
      text="选择下一座愿望城"
      bind:tap="onSelectNewWish"
    />
    <button class="btn-secondary" bindtap="onContinueCurrent">
      继续当前愿望城
    </button>
  </view>
</view>
```

### 4.2 页面逻辑 `pages/day7/index.js`

```javascript
const { loadState, updateState } = require('../../utils/state.js');
const { PAGES, redirectTo } = require('../../utils/navigation.js');

Page({
  data: {
    currentWish: '',
    bestStreak: 0,
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
    const state = loadState();
    this.setData({
      currentWish: state.currentWish,
      bestStreak: state.bestStreak,
      spellCount: state.spellBook ? state.spellBook.length : 0
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
      { delay: 4300, action: () => {
        this.setData({ showParticles: true });
        wx.vibrateShort({ type: 'heavy' });
      }},
      { delay: 5000, action: () => this.setData({ showAchievement: true }) },
      { delay: 5500, action: () => this.setData({ showButtons: true }) }
    ];
    
    timeline.forEach(({ delay, action }) => {
      setTimeout(action, delay);
    });
  },
  
  onSelectNewWish() {
    // 重置状态，进入愿望选择
    const state = loadState();
    
    updateState({
      day: 1,
      todayDone: false,
      hasWishRank: false,
      hasDeck: false,
      deck: [],
      materialArea: []
      // 保留: roleTalent, spellBook, history, totalScore, bestStreak
    });
    
    redirectTo(PAGES.WISHES);
  },
  
  onContinueCurrent() {
    // 仅重置Day，继续当前愿望城
    updateState({
      day: 1,
      todayDone: false
    });
    
    redirectTo(PAGES.DAILY);
  }
});
```

### 4.3 页面样式 `pages/day7/index.wxss`

```css
.day7-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #1a1a2e 0%, #2B1B3D 50%, #F6C85F 100%);
  color: #FFFFFF;
}

.dialogue-wrap {
  padding: var(--page-pad);
  padding-top: 100rpx;
}

/* 城市动画区 */
.city-animation {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(40rpx);
  transition: all 500ms ease-out;
}

.city-animation.visible {
  opacity: 1;
  transform: translateY(0);
}

.city-container {
  position: relative;
  width: 300rpx;
  height: 200rpx;
}

/* 城市轮廓 */
.city-silhouette {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.building {
  background: linear-gradient(180deg, #8B7355, #5E4C7A);
  transition: all 500ms ease-out;
}

.main-building {
  width: 100rpx;
  height: 80rpx;
  border-radius: 10rpx 10rpx 0 0;
}

.side-building {
  width: 50rpx;
  height: 50rpx;
  border-radius: 6rpx 6rpx 0 0;
  position: absolute;
  bottom: 0;
}

.side-building.left {
  left: 20rpx;
}

.side-building.right {
  right: 20rpx;
}

/* 城市进化阶段 */
.city-container.wasteland .building {
  filter: grayscale(1) brightness(0.5);
}

.city-container.village .building {
  filter: grayscale(0.5) brightness(0.7);
}

.city-container.village .main-building {
  height: 100rpx;
}

.city-container.city .building {
  filter: none;
  background: linear-gradient(180deg, #F6C85F, #FFE5B4);
}

.city-container.city .main-building {
  height: 140rpx;
}

.city-container.city .side-building {
  height: 80rpx;
}

/* 金色光芒 */
.golden-glow {
  position: absolute;
  inset: -50rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(246, 200, 95, 0.6) 0%, transparent 70%);
  animation: glowPulse 2s ease-in-out infinite;
}

/* 粒子效果 */
.particles {
  position: absolute;
  inset: 0;
}

.particle {
  position: absolute;
  width: 10rpx;
  height: 10rpx;
  background: var(--c-gold);
  border-radius: 50%;
  animation: particleFloat 2s ease-out infinite;
  animation-delay: var(--delay);
}

.particle:nth-child(1) { left: 10%; top: 50%; }
.particle:nth-child(2) { left: 90%; top: 50%; }
.particle:nth-child(3) { left: 50%; top: 10%; }
.particle:nth-child(4) { left: 50%; top: 90%; }
.particle:nth-child(5) { left: 20%; top: 20%; }
.particle:nth-child(6) { left: 80%; top: 20%; }
.particle:nth-child(7) { left: 20%; top: 80%; }
.particle:nth-child(8) { left: 80%; top: 80%; }
.particle:nth-child(9) { left: 30%; top: 40%; }
.particle:nth-child(10) { left: 70%; top: 40%; }
.particle:nth-child(11) { left: 40%; top: 70%; }
.particle:nth-child(12) { left: 60%; top: 70%; }

@keyframes particleFloat {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-60rpx) scale(0);
    opacity: 0;
  }
}

.city-name {
  font-size: var(--font-h1);
  font-weight: var(--weight-bold);
  margin-top: var(--gap-xl);
}

.city-status {
  font-size: var(--font-body);
  color: var(--c-gold);
  margin-top: var(--gap-sm);
}

/* 成就区 */
.achievement-section {
  padding: var(--page-pad);
  opacity: 0;
  transform: translateY(20rpx);
  transition: all 400ms ease-out;
}

.achievement-section.visible {
  opacity: 1;
  transform: translateY(0);
}

.section-title {
  font-size: var(--font-sub);
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  display: block;
  margin-bottom: var(--gap-md);
}

.achievement-list {
  display: flex;
  justify-content: center;
  gap: var(--gap-xl);
}

.achievement-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gap-xs);
}

.achievement-icon {
  font-size: 48rpx;
}

.achievement-label {
  font-size: var(--font-cap);
  color: rgba(255, 255, 255, 0.6);
}

.achievement-value {
  font-size: var(--font-body);
  font-weight: var(--weight-medium);
}

/* 底部按钮 */
.footer {
  padding: var(--page-pad);
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);
  opacity: 0;
  transform: translateY(20rpx);
  transition: all 400ms ease-out;
}

.footer.visible {
  opacity: 1;
  transform: translateY(0);
}

.btn-secondary {
  background: transparent;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  color: #FFFFFF;
  border-radius: var(--radius-btn);
  height: 84rpx;
  font-size: var(--font-body);
}

.btn-secondary::after {
  border: none;
}
```

---

## 五、依赖任务

- **T04**: 状态管理
- **T10**: Daily页（触发跳转）

---

## 六、测试要点

1. 动画按时间线依次播放
2. 城市进化效果正确
3. 粒子和光效流畅
4. 选择下一座愿望城后正确重置
5. 继续当前愿望城后正确重置Day

---

## 七、交付物

- [x] `pages/day7/index.wxml`
- [x] `pages/day7/index.wxss`
- [x] `pages/day7/index.js`
- [x] `pages/day7/index.json`
