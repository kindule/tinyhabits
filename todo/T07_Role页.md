# T07: Role角色创建页

> **优先级**: P0 (必须实现)
> **预估工时**: 0.5天
> **负责人**: 前端开发
> **状态**: ✅ DONE

---

## 一、任务描述

实现角色创建页面，让用户选择4种天赋之一(火花型/潮汐型/石匠型/风行型)，保存选择并进入下一步。

---

## 二、验收标准

- [ ] 4张天赋卡片2×2网格布局
- [ ] 卡片点击有选中态(金色边框+弹跳动画)
- [ ] 只能单选，切换时取消之前选中
- [ ] Arc对话框引导文案
- [ ] 选择后"确认天赋"按钮可点击
- [ ] 确认后保存状态并跳转Wishes页

---

## 三、页面设计

### 3.1 天赋卡片数据

| 天赋 | ID | 关键词 | 描述 |
|------|-----|--------|------|
| 🔥 火花型 | fire | 快/短/爆发 | 喜欢快速行动，短平快的小任务 |
| 🌊 潮汐型 | tide | 流/顺/自然 | 喜欢顺其自然，随心情变化的节奏 |
| 🪨 石匠型 | mason | 稳/固/持续 | 喜欢稳定节奏，每天固定的习惯 |
| 🍃 风行型 | wind | 变/探/多样 | 喜欢灵活多变，探索不同可能性 |

### 3.2 页面结构

```
┌─────────────────────────────────────────────┐
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  🌟  "了解一下你的天赋..."          │   │
│   │  🌟  "没有对错之分,只是...你更像?"  │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ┌────────────────┐  ┌────────────────┐   │
│   │      🔥        │  │      🌊        │   │
│   │    火花型      │  │    潮汐型      │   │
│   │  快速行动      │  │  顺其自然      │   │
│   └────────────────┘  └────────────────┘   │
│                                             │
│   ┌────────────────┐  ┌────────────────┐   │
│   │      🪨        │  │      🍃        │   │
│   │    石匠型      │  │    风行型      │   │
│   │  稳定节奏      │  │  灵活多变      │   │
│   └────────────────┘  └────────────────┘   │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │          [ 确认天赋 ]               │   │
│   └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 四、技术实现

### 4.1 数据定义 `data/talents.js`

```javascript
const TALENTS = [
  {
    id: 'fire',
    name: '火花型',
    icon: '🔥',
    keyword: '快速行动',
    desc: '喜欢快速行动,短平快的小任务',
    color: '#FF6B4A'
  },
  {
    id: 'tide',
    name: '潮汐型',
    icon: '🌊',
    keyword: '顺其自然',
    desc: '喜欢顺其自然,随心情变化的节奏',
    color: '#5EC8D8'
  },
  {
    id: 'mason',
    name: '石匠型',
    icon: '🪨',
    keyword: '稳定节奏',
    desc: '喜欢稳定节奏,每天固定的习惯',
    color: '#8B7355'
  },
  {
    id: 'wind',
    name: '风行型',
    icon: '🍃',
    keyword: '灵活多变',
    desc: '喜欢灵活多变,探索不同可能性',
    color: '#7AC74C'
  }
];

module.exports = { TALENTS };
```

### 4.2 页面结构 `pages/role/index.wxml`

```html
<view class="page role-page">
  <!-- 对话区 -->
  <view class="dialogue-wrap">
    <dialogue-bubble 
      character="arc"
      text="{{dialogueText}}"
      animate="{{true}}"
    />
  </view>
  
  <!-- 天赋卡片网格 -->
  <view class="talent-grid">
    <main-card 
      wx:for="{{talents}}" 
      wx:key="id"
      selected="{{selectedId === item.id}}"
      bind:tap="onTalentTap"
      data-id="{{item.id}}"
    >
      <view class="talent-card-content">
        <text class="talent-icon">{{item.icon}}</text>
        <text class="talent-name">{{item.name}}</text>
        <text class="talent-keyword">{{item.keyword}}</text>
      </view>
    </main-card>
  </view>
  
  <!-- 已选择提示 -->
  <view class="selected-hint {{selectedId ? 'visible' : ''}}">
    <text>{{selectedTalent ? selectedTalent.name + '的微光法师' : ''}}</text>
  </view>
  
  <!-- 底部按钮 -->
  <view class="footer safe-bottom">
    <primary-button 
      text="确认天赋"
      disabled="{{!selectedId}}"
      bind:tap="onConfirmTap"
    />
  </view>
</view>
```

### 4.3 页面样式 `pages/role/index.wxss`

```css
.role-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--gradient-home);
}

.dialogue-wrap {
  padding: var(--page-pad);
  padding-top: 100rpx;
}

/* 天赋卡片网格 */
.talent-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--gap-lg);
  padding: var(--page-pad);
  flex: 1;
}

.talent-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--gap-lg) 0;
}

.talent-icon {
  font-size: 64rpx;
  margin-bottom: var(--gap-md);
}

.talent-name {
  font-size: var(--font-h2);
  font-weight: var(--weight-bold);
  color: var(--c-text);
  margin-bottom: var(--gap-sm);
}

.talent-keyword {
  font-size: var(--font-sub);
  color: var(--c-subtext);
}

/* 选中提示 */
.selected-hint {
  text-align: center;
  padding: var(--gap-md);
  opacity: 0;
  transform: translateY(10rpx);
  transition: all 200ms ease-out;
}

.selected-hint.visible {
  opacity: 1;
  transform: translateY(0);
}

.selected-hint text {
  font-size: var(--font-body);
  color: var(--c-gold);
  font-weight: var(--weight-medium);
}

.footer {
  padding: var(--page-pad);
}
```

### 4.4 页面逻辑 `pages/role/index.js`

```javascript
const { TALENTS } = require('../../data/talents.js');
const { loadState, updateState } = require('../../utils/state.js');
const { PAGES, redirectTo } = require('../../utils/navigation.js');

Page({
  data: {
    talents: TALENTS,
    selectedId: null,
    selectedTalent: null,
    dialogueText: '在成为微光法师之前,先了解一下你的天赋。没有对错之分,只是...你更像哪一种?'
  },
  
  onLoad() {
    // 检查是否已选择天赋
    const state = loadState();
    if (state.hasRole && state.roleTalent) {
      this.setData({
        selectedId: state.roleTalent,
        selectedTalent: TALENTS.find(t => t.id === state.roleTalent)
      });
    }
  },
  
  onTalentTap(e) {
    const { id } = e.currentTarget.dataset;
    const talent = TALENTS.find(t => t.id === id);
    
    this.setData({
      selectedId: id,
      selectedTalent: talent
    });
    
    // 触发短震动反馈
    wx.vibrateShort({ type: 'light' });
  },
  
  onConfirmTap() {
    if (!this.data.selectedId) return;
    
    // 保存状态
    updateState({
      hasRole: true,
      roleTalent: this.data.selectedId
    });
    
    // 跳转到愿望排序页
    redirectTo(PAGES.WISHES);
  }
});
```

---

## 五、测试要点

1. 4张卡片正确展示
2. 点击卡片有选中效果
3. 切换选择时前一个取消选中
4. 未选择时按钮置灰不可点击
5. 确认后状态正确保存
6. 跳转到Wishes页成功

---

## 六、交付物

- [x] `data/talents.js` - 天赋数据
- [x] `pages/role/index.wxml`
- [x] `pages/role/index.wxss`
- [x] `pages/role/index.js`
- [x] `pages/role/index.json`
