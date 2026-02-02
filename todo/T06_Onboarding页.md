# T06: Onboarding世界观开场页

> **优先级**: P0 (必须实现)
> **预估工时**: 0.5天
> **负责人**: 前端开发
> **状态**: ✅ DONE

---

## 一、任务描述

实现世界观开场页面，展示游戏背景故事和核心概念，引导用户开始游戏流程。

---

## 二、验收标准

- [ ] 场景背景渐变+装饰元素
- [ ] Arc导师对话框动画出现
- [ ] 世界观文案展示(3-5行)
- [ ] "开始修复"按钮点击后跳转Role页
- [ ] 页面加载时间<1秒
- [ ] 动效流畅60fps

---

## 三、页面设计

### 3.1 页面结构

```
┌─────────────────────────────────────────────┐
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │     场景背景(渐变+裂纹装饰)         │   │
│   │                                     │   │
│   │         🏰 愿望城轮廓               │   │
│   │                                     │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  🌟  "欢迎回来,微光法师..."         │   │
│   └─────────────────────────────────────┘   │
│                                             │
│         愿望大陆被裂隙之影侵蚀              │
│         你的微光,是修复的希望              │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │          [ 开始修复 ]               │   │
│   └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 四、技术实现

### 4.1 页面结构 `pages/onboarding/index.wxml`

```html
<view class="page onboarding-page">
  <!-- 场景区 -->
  <view class="scene-header">
    <view class="scene-bg"></view>
    <view class="city-silhouette"></view>
    <view class="rift-overlay"></view>
  </view>
  
  <!-- 对话区 -->
  <view class="dialogue-wrap">
    <dialogue-bubble 
      wx:if="{{showDialogue}}"
      character="arc"
      text="{{dialogueText}}"
      animate="{{true}}"
    />
  </view>
  
  <!-- 故事文案 -->
  <view class="story-wrap {{showStory ? 'visible' : ''}}">
    <text class="story-text">{{storyText}}</text>
  </view>
  
  <!-- 底部按钮 -->
  <view class="footer safe-bottom">
    <primary-button 
      wx:if="{{showButton}}"
      text="开始修复"
      bind:tap="onStartTap"
    />
  </view>
</view>
```

### 4.2 页面样式 `pages/onboarding/index.wxss`

```css
.onboarding-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--c-bg);
}

/* 场景区 */
.scene-header {
  height: 400rpx;
  position: relative;
  overflow: hidden;
}

.scene-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, 
    rgba(43, 27, 61, 0.3) 0%, 
    rgba(94, 200, 216, 0.26) 50%, 
    rgba(250, 251, 255, 1) 100%
  );
}

/* 城市轮廓(CSS绘制) */
.city-silhouette {
  position: absolute;
  bottom: 60rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 200rpx;
  height: 120rpx;
  background: 
    linear-gradient(135deg, #2B1B3D 0%, #5E4C7A 100%);
  border-radius: 20rpx 20rpx 0 0;
  opacity: 0.6;
}

.city-silhouette::before,
.city-silhouette::after {
  content: '';
  position: absolute;
  background: inherit;
  border-radius: 10rpx 10rpx 0 0;
}

.city-silhouette::before {
  width: 80rpx;
  height: 80rpx;
  left: -60rpx;
  bottom: 0;
}

.city-silhouette::after {
  width: 60rpx;
  height: 60rpx;
  right: -40rpx;
  bottom: 0;
}

/* 裂隙覆盖效果 */
.rift-overlay {
  position: absolute;
  inset: 0;
  background: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10rpx,
      rgba(43, 27, 61, 0.05) 10rpx,
      rgba(43, 27, 61, 0.05) 20rpx
    );
  animation: riftPulse 4s ease-in-out infinite;
}

@keyframes riftPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

/* 对话区 */
.dialogue-wrap {
  padding: var(--page-pad);
  min-height: 140rpx;
}

/* 故事文案 */
.story-wrap {
  padding: 0 var(--page-pad);
  text-align: center;
  opacity: 0;
  transform: translateY(20rpx);
  transition: all 400ms ease-out;
}

.story-wrap.visible {
  opacity: 1;
  transform: translateY(0);
}

.story-text {
  font-size: var(--font-body);
  color: var(--c-subtext);
  line-height: 1.8;
  white-space: pre-line;
}

/* 底部区 */
.footer {
  margin-top: auto;
  padding: var(--page-pad);
}
```

### 4.3 页面逻辑 `pages/onboarding/index.js`

```javascript
const { loadState } = require('../../utils/state.js');
const { PAGES, redirectTo } = require('../../utils/navigation.js');

Page({
  data: {
    showDialogue: false,
    showStory: false,
    showButton: false,
    dialogueText: '欢迎回来,微光法师。',
    storyText: '愿望大陆被裂隙之影侵蚀\n你的微光,是修复的希望'
  },
  
  onLoad() {
    // 检查是否已完成Onboarding
    const state = loadState();
    if (state.hasRole) {
      // 已有角色，跳转到正确的页面
      if (!state.hasWishRank) {
        redirectTo(PAGES.WISHES);
      } else if (!state.hasDeck) {
        redirectTo(PAGES.WORKSHOP);
      } else {
        redirectTo(PAGES.DAILY);
      }
      return;
    }
    
    // 播放进场动画序列
    this.playIntroSequence();
  },
  
  playIntroSequence() {
    // 动画序列
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
  
  onStartTap() {
    // 跳转到角色选择页
    redirectTo(PAGES.ROLE);
  }
});
```

### 4.4 页面配置 `pages/onboarding/index.json`

```json
{
  "usingComponents": {
    "dialogue-bubble": "/components/dialogue-bubble/index",
    "primary-button": "/components/primary-button/index"
  },
  "navigationBarTitleText": "",
  "navigationStyle": "custom"
}
```

---

## 五、动效规范

| 动效 | 时长 | 缓动 | 说明 |
|------|------|------|------|
| 对话出现 | 200ms | ease-out | 淡入+上移 |
| 故事文案 | 400ms | ease-out | 延迟800ms后出现 |
| 按钮出现 | 180ms | ease-out | 延迟1200ms后出现 |
| 裂隙脉动 | 4s | ease-in-out | 循环动画 |

---

## 六、测试要点

1. 首次进入页面显示完整动画序列
2. 点击"开始修复"正确跳转
3. 老用户(已有角色)直接跳转
4. 动效流畅无卡顿

---

## 七、交付物

- [x] `pages/onboarding/index.wxml`
- [x] `pages/onboarding/index.wxss`
- [x] `pages/onboarding/index.js`
- [x] `pages/onboarding/index.json`
