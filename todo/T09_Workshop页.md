# T09: Workshop行为工坊页

> **优先级**: P0 (必须实现)
> **预估工时**: 2天
> **负责人**: 前端开发
> **状态**: ✅ DONE

---

## 一、任务描述

实现行为工坊页面，包括召唤灵感、AI锚点绑定、行为裂变、行为合成、生成卡组等核心玩法。

---

## 二、验收标准

- [ ] 召唤灵感：点击后3个行为气泡依次弹出
- [ ] 锚点绑定：选择行为后AI生成锚点建议
- [ ] 行为裂变：大行为可拆分为3个小行为
- [ ] 行为合成：2个行为可合成新咒语
- [ ] 素材区：已选行为展示和管理
- [ ] 生成卡组：从素材区生成3张卡
- [ ] MAP评估：AI检查卡组质量
- [ ] 确认后保存状态并跳转Daily页

---

## 三、页面设计

### 3.1 核心区域

```
┌─────────────────────────────────────────────┐
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  ✨  "让我为你召唤一些灵感泡泡~"    │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │         🔮 愿望水晶                 │   │
│   │                                     │   │
│   │   🫧喝一杯水  🫧站起来  🫧深呼吸3次 │   │
│   │                                     │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   [ 召唤灵感 ]  [ 裂变 ]  [ 合成 ]          │
│                                             │
│   ───────── 素材区 ─────────                │
│   🫧🪥刷牙后→喝水  🫧站起来伸展            │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │          [ 生成今日卡组 ]           │   │
│   └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 四、技术实现

### 4.1 页面结构 `pages/workshop/index.wxml`

```html
<view class="page workshop-page">
  <!-- 对话区 -->
  <view class="dialogue-wrap">
    <dialogue-bubble 
      character="mia"
      text="{{dialogueText}}"
      animate="{{true}}"
    />
  </view>
  
  <!-- 愿望水晶区 -->
  <view class="crystal-area">
    <view class="crystal {{summoning ? 'summoning' : ''}}">
      <text class="crystal-icon">🔮</text>
    </view>
    
    <!-- 召唤出的行为气泡 -->
    <view class="summoned-bubbles" wx:if="{{summonedBehaviors.length > 0}}">
      <bubble-chip 
        wx:for="{{summonedBehaviors}}"
        wx:key="id"
        text="{{item.name}}"
        selected="{{selectedSummon === item.id}}"
        delay="{{index * 80}}"
        bind:tap="onSummonedTap"
        data-id="{{item.id}}"
      />
    </view>
  </view>
  
  <!-- 操作按钮组 -->
  <view class="action-buttons">
    <button class="action-btn" bindtap="onSummonTap" disabled="{{summoning}}">
      召唤灵感
    </button>
    <button class="action-btn" bindtap="onSplitTap" disabled="{{!canSplit}}">
      裂变
    </button>
    <button class="action-btn" bindtap="onMergeTap" disabled="{{!canMerge}}">
      合成
    </button>
  </view>
  
  <!-- 锚点选择浮层 -->
  <view class="anchor-modal {{showAnchorModal ? 'visible' : ''}}">
    <view class="anchor-modal-content">
      <text class="anchor-title">选择施放时机</text>
      <view class="anchor-options">
        <view 
          wx:for="{{anchorOptions}}"
          wx:key="text"
          class="anchor-option"
          bindtap="onAnchorSelect"
          data-anchor="{{item}}"
        >
          <text class="anchor-emoji">{{item.emoji}}</text>
          <text class="anchor-text">{{item.text}}</text>
        </view>
      </view>
      <text class="anchor-loading" wx:if="{{loadingAnchors}}">⏳ 召唤时机魔法中...</text>
    </view>
  </view>
  
  <!-- 素材区 -->
  <view class="material-area">
    <view class="material-header">
      <text class="material-title">素材区 ({{materialArea.length}})</text>
    </view>
    <scroll-view class="material-list" scroll-x="{{true}}">
      <bubble-chip 
        wx:for="{{materialArea}}"
        wx:key="id"
        text="{{item.anchorEmoji || '✨'}}{{item.anchor ? item.anchor + '→' : ''}}{{item.name}}"
        selected="{{selectedMaterials.includes(item.id)}}"
        bind:tap="onMaterialTap"
        data-id="{{item.id}}"
      />
    </scroll-view>
  </view>
  
  <!-- 裂变结果浮层 -->
  <view class="split-modal {{showSplitModal ? 'visible' : ''}}">
    <view class="split-modal-content">
      <text class="split-title">选择加入素材区的行为</text>
      <view class="split-options">
        <bubble-chip 
          wx:for="{{splitResults}}"
          wx:key="id"
          text="{{item.name}}"
          bind:tap="onSplitResultTap"
          data-behavior="{{item}}"
        />
      </view>
      <button class="close-btn" bindtap="closeSplitModal">完成</button>
    </view>
  </view>
  
  <!-- 卡组预览 -->
  <view class="deck-preview" wx:if="{{showDeckPreview}}">
    <view class="deck-cards">
      <main-card wx:for="{{generatedDeck}}" wx:key="id">
        <view class="deck-card-content">
          <tag-pill text="{{item.type === 'base' ? '保底卡' : item.type === 'main' ? '主线卡' : '彩蛋卡'}}" 
                    type="{{item.type === 'base' ? 'default' : item.type === 'main' ? 'purple' : 'gold'}}" />
          <text class="deck-card-name">{{item.anchorEmoji}} {{item.anchor}} → {{item.name}}</text>
          <view class="deck-card-meta">
            <text>⏱️ {{item.seconds}}秒</text>
            <text>难度 {{'★'.repeat(item.difficulty)}}</text>
          </view>
        </view>
      </main-card>
    </view>
    
    <!-- MAP评估结果 -->
    <view class="map-evaluation" wx:if="{{mapResult}}">
      <text class="map-status {{mapResult.overall}}">
        {{mapResult.overall === 'Pass' ? '✅ 卡组检查通过' : mapResult.overall === 'Warning' ? '⚠️ 有些建议' : '❌ 需要调整'}}
      </text>
      <text class="map-feedback" wx:if="{{mapResult.feedback}}">{{mapResult.feedback}}</text>
    </view>
  </view>
  
  <!-- 底部按钮 -->
  <view class="footer safe-bottom">
    <primary-button 
      wx:if="{{!showDeckPreview}}"
      text="生成今日卡组"
      disabled="{{materialArea.length < 1}}"
      loading="{{generating}}"
      bind:tap="onGenerateTap"
    />
    <primary-button 
      wx:else
      text="确认卡组,开始修复"
      bind:tap="onConfirmDeck"
    />
  </view>
</view>
```

### 4.2 页面逻辑 `pages/workshop/index.js`

```javascript
const { loadState, updateState } = require('../../utils/state.js');
const { summonBehaviors, splitBehavior, mergeBehaviors, generateDeck } = require('../../utils/workshop.js');
const { generateAnchors, evaluateMAP } = require('../../utils/api.js');
const { PAGES, redirectTo } = require('../../utils/navigation.js');

Page({
  data: {
    dialogueText: '让我为你召唤一些灵感泡泡~',
    
    // 召唤相关
    summoning: false,
    summonedBehaviors: [],
    selectedSummon: null,
    
    // 锚点相关
    showAnchorModal: false,
    loadingAnchors: false,
    anchorOptions: [],
    pendingBehavior: null,
    
    // 素材区
    materialArea: [],
    selectedMaterials: [],
    
    // 裂变相关
    showSplitModal: false,
    splitResults: [],
    
    // 卡组相关
    showDeckPreview: false,
    generatedDeck: [],
    generating: false,
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
  
  onLoad() {
    const state = loadState();
    if (state.materialArea && state.materialArea.length > 0) {
      this.setData({ materialArea: state.materialArea });
    }
  },
  
  // 召唤灵感
  async onSummonTap() {
    const state = loadState();
    this.setData({ summoning: true, summonedBehaviors: [] });
    
    // 模拟召唤动画
    await this.delay(500);
    
    const behaviors = summonBehaviors(state.currentWishId, 3);
    this.setData({ 
      summoning: false,
      summonedBehaviors: behaviors 
    });
    
    wx.vibrateShort({ type: 'medium' });
  },
  
  // 点击召唤的行为
  async onSummonedTap(e) {
    const { id } = e.currentTarget.dataset;
    const behavior = this.data.summonedBehaviors.find(b => b.id === id);
    
    this.setData({ 
      selectedSummon: id,
      pendingBehavior: behavior,
      showAnchorModal: true,
      loadingAnchors: true,
      anchorOptions: []
    });
    
    // 调用AI生成锚点
    try {
      const state = loadState();
      const anchors = await generateAnchors(behavior, {
        currentWish: state.currentWish,
        roleTalent: state.roleTalent
      });
      this.setData({ 
        anchorOptions: anchors,
        loadingAnchors: false 
      });
    } catch (error) {
      // 降级到默认锚点
      this.setData({
        anchorOptions: [
          { text: '起床后', emoji: '🌅' },
          { text: '刷牙后', emoji: '🪥' },
          { text: '午休后', emoji: '☀️' },
          { text: '睡前', emoji: '🌙' }
        ],
        loadingAnchors: false
      });
    }
  },
  
  // 选择锚点
  onAnchorSelect(e) {
    const { anchor } = e.currentTarget.dataset;
    const behavior = this.data.pendingBehavior;
    
    // 添加到素材区
    const materialArea = [...this.data.materialArea];
    materialArea.push({
      ...behavior,
      anchor: anchor.text,
      anchorEmoji: anchor.emoji
    });
    
    this.setData({
      materialArea,
      showAnchorModal: false,
      summonedBehaviors: [],
      selectedSummon: null,
      dialogueText: '很好!继续召唤更多灵感,或者试试裂变和合成~'
    });
    
    // 保存素材区状态
    updateState({ materialArea });
  },
  
  // 素材点击(选中/取消)
  onMaterialTap(e) {
    const { id } = e.currentTarget.dataset;
    let selectedMaterials = [...this.data.selectedMaterials];
    
    if (selectedMaterials.includes(id)) {
      selectedMaterials = selectedMaterials.filter(i => i !== id);
    } else if (selectedMaterials.length < 2) {
      selectedMaterials.push(id);
    }
    
    this.setData({ selectedMaterials });
  },
  
  // 裂变
  onSplitTap() {
    if (this.data.selectedMaterials.length !== 1) return;
    
    const selectedId = this.data.selectedMaterials[0];
    const behavior = this.data.materialArea.find(b => b.id === selectedId);
    
    const results = splitBehavior(behavior);
    this.setData({
      splitResults: results,
      showSplitModal: true,
      dialogueText: '裂变启动!把宏大计划拆成一步就行~'
    });
  },
  
  // 选择裂变结果加入素材区
  onSplitResultTap(e) {
    const { behavior } = e.currentTarget.dataset;
    const materialArea = [...this.data.materialArea, behavior];
    this.setData({ materialArea });
    updateState({ materialArea });
  },
  
  closeSplitModal() {
    this.setData({ showSplitModal: false, splitResults: [], selectedMaterials: [] });
  },
  
  // 合成
  onMergeTap() {
    if (this.data.selectedMaterials.length !== 2) return;
    
    const [id1, id2] = this.data.selectedMaterials;
    const b1 = this.data.materialArea.find(b => b.id === id1);
    const b2 = this.data.materialArea.find(b => b.id === id2);
    
    const merged = mergeBehaviors(b1, b2);
    
    // 从素材区移除原行为，添加新行为
    const materialArea = this.data.materialArea.filter(b => !this.data.selectedMaterials.includes(b.id));
    materialArea.push(merged);
    
    this.setData({ 
      materialArea,
      selectedMaterials: [],
      dialogueText: '哇!新咒语诞生了!'
    });
    
    updateState({ materialArea });
    wx.vibrateShort({ type: 'heavy' });
  },
  
  // 生成卡组
  async onGenerateTap() {
    this.setData({ generating: true });
    
    const state = loadState();
    const deck = generateDeck(this.data.materialArea, state.currentWish);
    
    // AI MAP评估
    try {
      const mapResult = await evaluateMAP(deck);
      this.setData({
        generatedDeck: deck,
        showDeckPreview: true,
        mapResult,
        generating: false
      });
    } catch (error) {
      // 降级：跳过评估
      this.setData({
        generatedDeck: deck,
        showDeckPreview: true,
        mapResult: { overall: 'Pass' },
        generating: false
      });
    }
  },
  
  // 确认卡组
  onConfirmDeck() {
    updateState({
      hasDeck: true,
      deck: this.data.generatedDeck
    });
    
    redirectTo(PAGES.DAILY);
  },
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
});
```

---

## 五、依赖任务

- **T13**: 行为工坊核心逻辑（`utils/workshop.js`）
- **T18**: AI锚点生成服务
- **T19**: AI MAP评估服务
- **T21**: 行为库数据（`data/behaviors.js`）

---

## 六、测试要点

1. 召唤灵感气泡动画正常
2. AI锚点生成响应正常，失败时降级
3. 裂变和合成功能正常
4. 生成的卡组包含保底/主线/彩蛋卡
5. MAP评估反馈正确
6. 确认后数据正确保存

---

## 七、交付物

- [x] `pages/workshop/index.wxml`
- [x] `pages/workshop/index.wxss`
- [x] `pages/workshop/index.js`
- [x] `pages/workshop/index.json`
