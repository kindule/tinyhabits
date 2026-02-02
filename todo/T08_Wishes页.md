# T08: Wishes愿望排序页

> **优先级**: P0 (必须实现)
> **预估工时**: 1.5天
> **负责人**: 前端开发
> **状态**: ✅ DONE

---

## 一、任务描述

实现愿望排序页面，包括两两对决游戏(7轮)和命运盘确认两个阶段，让用户澄清核心愿望。

---

## 二、验收标准

- [ ] 两两对决模式：7轮随机配对
- [ ] 每轮展示2张愿望卡，点击选择
- [ ] 选择后有弹跳反馈，自动进入下一轮
- [ ] 7轮后进入命运盘阶段
- [ ] 命运盘展示Top1核心愿望
- [ ] 支持点击替换核心愿望
- [ ] 确认后保存状态并跳转Workshop页

---

## 三、页面设计

### 3.1 阶段A：两两对决

```
┌─────────────────────────────────────────────┐
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  🌟  "如果只能靠近一个,你会选择...?"  │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ┌──────────┐          ┌──────────┐       │
│   │   🏥     │    VS    │   💰     │       │
│   │  健康    │          │  财富    │       │
│   │ 精力充沛  │          │ 财务自由  │       │
│   └──────────┘          └──────────┘       │
│                                             │
│            第 3/7 轮                        │
│                                             │
└─────────────────────────────────────────────┘
```

### 3.2 阶段B：命运盘

```
┌─────────────────────────────────────────────┐
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  🌟  "你的核心愿望是..."            │   │
│   └─────────────────────────────────────┘   │
│                                             │
│                 ┌─────────┐                 │
│                 │ 🏥 健康  │                 │
│                 │ (核心)  │                 │
│                 └─────────┘                 │
│                                             │
│         ┌─────┐         ┌─────┐            │
│         │💰财富│         │📚成长│            │
│         │(主线)│         │(主线)│            │
│         └─────┘         └─────┘            │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │          [ 确认愿望 ]               │   │
│   └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 四、技术实现

### 4.1 页面结构 `pages/wishes/index.wxml`

```html
<view class="page wishes-page">
  <!-- 阶段A: 两两对决 -->
  <view wx:if="{{phase === 'battle'}}" class="battle-phase">
    <!-- 对话区 -->
    <view class="dialogue-wrap">
      <dialogue-bubble 
        character="arc"
        text="如果只能靠近一个,你会选择...?"
        animate="{{true}}"
      />
    </view>
    
    <!-- 对决卡片 -->
    <view class="battle-cards">
      <main-card 
        class="battle-card {{animating ? 'animating' : ''}}"
        bind:tap="onWishTap"
        data-index="0"
      >
        <view class="wish-card-content">
          <text class="wish-icon">{{currentPair[0].icon}}</text>
          <text class="wish-name">{{currentPair[0].name}}</text>
          <text class="wish-desc">{{currentPair[0].desc}}</text>
        </view>
      </main-card>
      
      <view class="vs-badge">VS</view>
      
      <main-card 
        class="battle-card {{animating ? 'animating' : ''}}"
        bind:tap="onWishTap"
        data-index="1"
      >
        <view class="wish-card-content">
          <text class="wish-icon">{{currentPair[1].icon}}</text>
          <text class="wish-name">{{currentPair[1].name}}</text>
          <text class="wish-desc">{{currentPair[1].desc}}</text>
        </view>
      </main-card>
    </view>
    
    <!-- 进度 -->
    <view class="progress-wrap">
      <text class="progress-text">第 {{currentRound}}/7 轮</text>
      <view class="progress-bar">
        <view class="progress-fill" style="width: {{(currentRound / 7) * 100}}%"></view>
      </view>
    </view>
  </view>
  
  <!-- 阶段B: 命运盘 -->
  <view wx:if="{{phase === 'destiny'}}" class="destiny-phase">
    <view class="dialogue-wrap">
      <dialogue-bubble 
        character="arc"
        text="你的核心愿望是..."
        animate="{{true}}"
      />
    </view>
    
    <!-- 命运盘 -->
    <view class="destiny-wheel">
      <!-- 核心愿望 -->
      <view class="destiny-core">
        <main-card selected="{{true}}">
          <view class="wish-card-content core">
            <text class="wish-icon">{{coreWish.icon}}</text>
            <text class="wish-name">{{coreWish.name}}</text>
            <tag-pill text="核心愿望" type="gold" />
          </view>
        </main-card>
      </view>
      
      <!-- 主线愿望 -->
      <view class="destiny-main">
        <view 
          wx:for="{{mainWishes}}" 
          wx:key="id"
          class="main-wish-item"
          bindtap="onSwapCore"
          data-id="{{item.id}}"
        >
          <text class="wish-icon-sm">{{item.icon}}</text>
          <text class="wish-name-sm">{{item.name}}</text>
        </view>
      </view>
      
      <text class="hint-text">点击其他愿望可替换核心</text>
    </view>
    
    <!-- 确认按钮 -->
    <view class="footer safe-bottom">
      <primary-button 
        text="确认愿望,开始修复 {{coreWish.cityName}}"
        bind:tap="onConfirmTap"
      />
    </view>
  </view>
</view>
```

### 4.2 页面逻辑 `pages/wishes/index.js`

```javascript
const { WISHES } = require('../../data/wishes.js');
const { generateMatchups, processChoice, generateRanking } = require('../../utils/wish-sort.js');
const { updateState } = require('../../utils/state.js');
const { PAGES, redirectTo } = require('../../utils/navigation.js');

Page({
  data: {
    phase: 'battle',  // 'battle' | 'destiny'
    currentRound: 1,
    currentPair: [],
    matchups: [],
    results: {},      // { wishId: { wins: number } }
    animating: false,
    
    // 命运盘数据
    coreWish: null,
    mainWishes: [],
    laterWishes: [],
    rankResult: []
  },
  
  onLoad() {
    this.initBattle();
  },
  
  initBattle() {
    const matchups = generateMatchups(WISHES, 7);
    this.setData({
      matchups,
      currentPair: matchups[0],
      currentRound: 1,
      results: {}
    });
  },
  
  onWishTap(e) {
    if (this.data.animating) return;
    
    const { index } = e.currentTarget.dataset;
    const winner = this.data.currentPair[index];
    const loser = this.data.currentPair[1 - index];
    
    // 记录选择结果
    const results = { ...this.data.results };
    if (!results[winner.id]) {
      results[winner.id] = { id: winner.id, name: winner.name, wins: 0 };
    }
    results[winner.id].wins += 1;
    
    // 确保失败者也在结果中
    if (!results[loser.id]) {
      results[loser.id] = { id: loser.id, name: loser.name, wins: 0 };
    }
    
    this.setData({ results, animating: true });
    
    // 震动反馈
    wx.vibrateShort({ type: 'light' });
    
    // 延迟进入下一轮
    setTimeout(() => {
      this.nextRound();
    }, 300);
  },
  
  nextRound() {
    const nextRound = this.data.currentRound + 1;
    
    if (nextRound > 7) {
      // 进入命运盘阶段
      this.enterDestinyPhase();
    } else {
      this.setData({
        currentRound: nextRound,
        currentPair: this.data.matchups[nextRound - 1],
        animating: false
      });
    }
  },
  
  enterDestinyPhase() {
    const ranking = generateRanking(this.data.results, WISHES);
    
    // 分配到三圈
    const coreWish = WISHES.find(w => w.id === ranking[0]?.id);
    const mainWishes = ranking.slice(1, 3).map(r => WISHES.find(w => w.id === r.id));
    const laterWishes = ranking.slice(3).map(r => WISHES.find(w => w.id === r.id));
    
    this.setData({
      phase: 'destiny',
      rankResult: ranking,
      coreWish,
      mainWishes,
      laterWishes,
      animating: false
    });
  },
  
  onSwapCore(e) {
    const { id } = e.currentTarget.dataset;
    const newCore = [...this.data.mainWishes, ...this.data.laterWishes].find(w => w.id === id);
    const oldCore = this.data.coreWish;
    
    if (newCore) {
      // 交换
      let mainWishes = this.data.mainWishes.filter(w => w.id !== id);
      let laterWishes = this.data.laterWishes.filter(w => w.id !== id);
      
      // 旧核心放回主线
      mainWishes.push(oldCore);
      
      this.setData({
        coreWish: newCore,
        mainWishes,
        laterWishes
      });
      
      wx.vibrateShort({ type: 'light' });
    }
  },
  
  onConfirmTap() {
    const { coreWish, rankResult } = this.data;
    
    // 保存状态
    updateState({
      hasWishRank: true,
      wishRankResult: rankResult,
      currentWish: coreWish.name,
      currentWishId: coreWish.id
    });
    
    // 跳转到行为工坊
    redirectTo(PAGES.WORKSHOP);
  }
});
```

---

## 五、依赖任务

- **T12**: 愿望排序核心逻辑（`utils/wish-sort.js`）
- **T21**: 愿望库数据（`data/wishes.js`）

---

## 六、测试要点

1. 7轮对决完整进行
2. 每轮选择有反馈动画
3. 命运盘正确展示排序结果
4. 点击替换核心功能正常
5. 确认后状态正确保存

---

## 七、交付物

- [x] `pages/wishes/index.wxml`
- [x] `pages/wishes/index.wxss`
- [x] `pages/wishes/index.js`
- [x] `pages/wishes/index.json`
