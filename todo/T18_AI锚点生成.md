# T18: AI锚点生成服务

> **优先级**: P0 (必须实现)
> **预估工时**: 2天
> **负责人**: 后端开发
> **状态**: ✅ DONE

---

## 一、任务描述

实现AI锚点生成服务，基于用户的行为和上下文，使用LLM生成个性化的"施放时机"建议。

---

## 二、验收标准

- [ ] 能根据行为生成3-5个锚点建议
- [ ] 锚点包含emoji和文本描述
- [ ] 响应时间<3秒
- [ ] 双模型备份(DeepSeek/Doubao)
- [ ] 降级机制(返回预设锚点)
- [ ] 日志和监控

---

## 三、技术实现

### 3.1 锚点服务 `src/services/anchorService.js`

```javascript
/**
 * AI锚点生成服务
 */

const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const config = require('../config');

// 预设锚点库(降级使用)
const DEFAULT_ANCHORS = [
  { emoji: '🌅', text: '起床后' },
  { emoji: '🪥', text: '刷牙后' },
  { emoji: '☀️', text: '午休后' },
  { emoji: '🌙', text: '睡前' },
  { emoji: '🍽️', text: '吃饭后' },
  { emoji: '💻', text: '开始工作前' },
  { emoji: '🚶', text: '回到家后' },
  { emoji: '📱', text: '放下手机时' }
];

// 按行为分类的锚点库
const CATEGORY_ANCHORS = {
  health: [
    { emoji: '🌅', text: '起床后' },
    { emoji: '🍳', text: '早餐后' },
    { emoji: '☀️', text: '午休后' },
    { emoji: '🌙', text: '睡前' }
  ],
  work: [
    { emoji: '💻', text: '开始工作前' },
    { emoji: '☕', text: '喝咖啡时' },
    { emoji: '🎯', text: '完成一项任务后' },
    { emoji: '🏠', text: '下班后' }
  ],
  learning: [
    { emoji: '📖', text: '打开书本时' },
    { emoji: '🎧', text: '戴上耳机时' },
    { emoji: '✏️', text: '拿起笔时' },
    { emoji: '📱', text: '打开App时' }
  ],
  emotion: [
    { emoji: '😮‍💨', text: '感到压力时' },
    { emoji: '😤', text: '感到烦躁时' },
    { emoji: '😴', text: '感到疲惫时' },
    { emoji: '🥰', text: '感到开心时' }
  ]
};

/**
 * 创建LLM客户端
 * @param {string} model 模型名称 'deepseek' | 'doubao'
 */
function createLLM(model = 'deepseek') {
  if (model === 'deepseek') {
    return new ChatOpenAI({
      openAIApiKey: config.ai.deepseekApiKey,
      modelName: 'deepseek-chat',
      configuration: {
        baseURL: 'https://api.deepseek.com'
      },
      timeout: config.ai.timeout,
      temperature: 0.7
    });
  } else {
    return new ChatOpenAI({
      openAIApiKey: config.ai.doubaoApiKey,
      modelName: 'doubao-pro-4k',
      configuration: {
        baseURL: 'https://ark.cn-beijing.volces.com/api/v3'
      },
      timeout: config.ai.timeout,
      temperature: 0.7
    });
  }
}

/**
 * 生成锚点建议
 * @param {Object} behavior 行为对象 { name, category }
 * @param {Object} context 上下文 { currentWish, roleTalent }
 * @returns {Promise<Array>} 锚点列表 [{ emoji, text }]
 */
async function generateAnchors(behavior, context = {}) {
  try {
    const result = await generateAnchorsWithLLM(behavior, context);
    return result;
  } catch (error) {
    console.error('AI锚点生成失败，使用降级方案:', error);
    return getFallbackAnchors(behavior.category);
  }
}

/**
 * 使用LLM生成锚点
 */
async function generateAnchorsWithLLM(behavior, context) {
  const llm = createLLM('deepseek');
  
  const systemPrompt = `你是一个习惯养成专家，帮助用户为微习惯设置"锚点"（触发时机）。
锚点是一个已有的习惯或场景，用户会在这个时机执行新行为。

好的锚点特点：
1. 具体且可识别（如"刷牙后"而非"早上"）
2. 每天都会发生
3. 与新行为有自然关联
4. 简短易记（4-6个字）

请根据用户的行为，生成4个合适的锚点建议。
每个锚点用一个emoji和简短文字描述。
只输出JSON数组，不要其他内容。`;

  const userPrompt = `用户要养成的行为：${behavior.name}
行为类别：${behavior.category || '通用'}
用户的愿望：${context.currentWish || '未知'}
用户风格：${context.roleTalent || '未知'}

请生成4个锚点建议，格式如：
[{"emoji": "🌅", "text": "起床后"}, ...]`;

  try {
    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ]);
    
    // 解析JSON
    const content = response.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const anchors = JSON.parse(jsonMatch[0]);
      return validateAnchors(anchors);
    }
    
    throw new Error('无法解析AI响应');
  } catch (error) {
    // 尝试备用模型
    console.warn('DeepSeek失败，尝试Doubao:', error.message);
    return await generateAnchorsWithBackup(behavior, context);
  }
}

/**
 * 使用备用模型生成锚点
 */
async function generateAnchorsWithBackup(behavior, context) {
  const llm = createLLM('doubao');
  
  const prompt = `为"${behavior.name}"这个微习惯生成4个触发时机建议。
每个建议用emoji+简短文字，如：🌅起床后
只输出JSON数组：[{"emoji":"..","text":".."},...]`;

  try {
    const response = await llm.invoke([new HumanMessage(prompt)]);
    const content = response.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return validateAnchors(JSON.parse(jsonMatch[0]));
    }
    throw new Error('无法解析响应');
  } catch (error) {
    console.error('备用模型也失败:', error);
    return getFallbackAnchors(behavior.category);
  }
}

/**
 * 验证锚点格式
 */
function validateAnchors(anchors) {
  if (!Array.isArray(anchors)) return DEFAULT_ANCHORS;
  
  return anchors
    .filter(a => a && typeof a.emoji === 'string' && typeof a.text === 'string')
    .map(a => ({
      emoji: a.emoji.slice(0, 2),
      text: a.text.slice(0, 10)
    }))
    .slice(0, 5);
}

/**
 * 获取降级锚点
 */
function getFallbackAnchors(category) {
  return CATEGORY_ANCHORS[category] || DEFAULT_ANCHORS.slice(0, 4);
}

module.exports = {
  generateAnchors,
  getFallbackAnchors,
  DEFAULT_ANCHORS,
  CATEGORY_ANCHORS
};
```

### 3.2 API路由 `src/routes/ai.js`

```javascript
const express = require('express');
const { generateAnchors } = require('../services/anchorService');
const { evaluateMAP } = require('../services/mapService');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// AI接口限流
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 最多10次
  message: { success: false, error: 'Too many requests' }
});

/**
 * 生成锚点建议
 * POST /api/ai/anchors
 */
router.post('/anchors', aiLimiter, async (req, res, next) => {
  try {
    const { behavior, context } = req.body;
    
    if (!behavior || !behavior.name) {
      return res.status(400).json({
        success: false,
        error: 'Behavior name is required'
      });
    }
    
    const anchors = await generateAnchors(behavior, context || {});
    
    res.json({
      success: true,
      anchors,
      source: 'ai'
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * MAP评估
 * POST /api/ai/map
 */
router.post('/map', aiLimiter, async (req, res, next) => {
  try {
    const { deck } = req.body;
    
    if (!deck || !Array.isArray(deck)) {
      return res.status(400).json({
        success: false,
        error: 'Deck array is required'
      });
    }
    
    const result = await evaluateMAP(deck);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### 3.3 前端调用 `utils/api.js` 补充

```javascript
const { API_BASE, requestWithRetry } = require('./api.js');
const { getAuthToken } = require('./sync.js');

/**
 * 调用AI锚点生成
 * @param {Object} behavior 行为对象
 * @param {Object} context 上下文
 * @returns {Promise<Array>} 锚点列表
 */
async function generateAnchors(behavior, context = {}) {
  try {
    const token = await getAuthToken();
    
    const response = await requestWithRetry({
      url: `${API_BASE}/api/ai/anchors`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { behavior, context },
      timeout: 10000
    });
    
    if (response.data.success) {
      return response.data.anchors;
    }
    
    throw new Error(response.data.error);
  } catch (error) {
    console.error('锚点生成失败:', error);
    // 返回本地降级锚点
    return getLocalFallbackAnchors(behavior.category);
  }
}

/**
 * 本地降级锚点
 */
function getLocalFallbackAnchors(category) {
  const fallbacks = {
    health: [
      { emoji: '🌅', text: '起床后' },
      { emoji: '🪥', text: '刷牙后' },
      { emoji: '🌙', text: '睡前' },
      { emoji: '🍽️', text: '吃饭后' }
    ],
    default: [
      { emoji: '🌅', text: '起床后' },
      { emoji: '☀️', text: '午休后' },
      { emoji: '🌙', text: '睡前' },
      { emoji: '📱', text: '放下手机时' }
    ]
  };
  
  return fallbacks[category] || fallbacks.default;
}

module.exports = {
  generateAnchors,
  getLocalFallbackAnchors
};
```

---

## 四、Prompt工程

### 4.1 系统提示词

```
你是一个习惯养成专家，帮助用户为微习惯设置"锚点"（触发时机）。
锚点是一个已有的习惯或场景，用户会在这个时机执行新行为。

好的锚点特点：
1. 具体且可识别（如"刷牙后"而非"早上"）
2. 每天都会发生
3. 与新行为有自然关联
4. 简短易记（4-6个字）

请根据用户的行为，生成4个合适的锚点建议。
每个锚点用一个emoji和简短文字描述。
只输出JSON数组，不要其他内容。
```

### 4.2 用户提示词模板

```
用户要养成的行为：{behavior_name}
行为类别：{category}
用户的愿望：{current_wish}
用户风格：{role_talent}

请生成4个锚点建议，格式如：
[{"emoji": "🌅", "text": "起床后"}, ...]
```

---

## 五、测试要点

1. 正常情况下返回4个锚点
2. AI超时时返回降级锚点
3. 响应格式正确
4. 限流正常工作
5. 双模型切换正常

---

## 六、交付物

- [x] `src/services/anchorService.js`
- [x] `src/routes/ai.js`
- [x] 前端API封装
- [x] 单元测试
