# T20: AI对话服务

> **优先级**: P1 (应该实现)
> **预估工时**: 1天
> **负责人**: 后端开发
> **状态**: ✅ DONE

---

## 一、任务描述

实现AI对话服务，为游戏角色(Arc、MIA)生成个性化的对话内容，增强游戏的情感价值和沉浸感。

---

## 二、验收标准

- [ ] 能根据场景生成角色台词
- [ ] 台词符合角色性格设定
- [ ] 支持多种场景类型
- [ ] 响应时间<3秒
- [ ] 降级到预设台词
- [ ] 台词长度控制

---

## 三、技术实现

### 3.1 角色设定

| 角色 | 性格 | 说话风格 | 示例 |
|------|------|----------|------|
| **Arc** | 温和、智慧、有耐心 | 简洁、鼓励、不说教 | "你做到了最难的一步：开始。" |
| **MIA** | 活泼、热情、俏皮 | 活力、带emoji、口语化 | "裂变启动！把宏大计划拆成一步就行~" |
| **Rift** | 消极、阴沉、诱惑 | 合理化借口、看似关心 | "今天太累了，休息一下也没关系..." |

### 3.2 对话服务 `src/services/dialogueService.js`

```javascript
/**
 * AI对话生成服务
 */

const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const config = require('../config');

// 角色人设
const CHARACTER_PROMPTS = {
  arc: {
    name: 'Arc',
    personality: '温和智慧的导师',
    style: '说话简洁有力，善于鼓励，从不说教，相信用户的潜力',
    examples: [
      '只施放一次咒语，就够了。',
      '你做到了最难的一步：开始。',
      '微光不会因为休息而消失。'
    ]
  },
  mia: {
    name: 'MIA',
    personality: '活泼热情的小助手',
    style: '说话活力满满，喜欢用~和!，偶尔用emoji，口语化',
    examples: [
      '让我为你召唤一些灵感泡泡~',
      '裂变启动！把宏大计划拆成一步就行~',
      '哇！新咒语诞生了！'
    ]
  },
  rift: {
    name: 'Rift',
    personality: '消极的内心声音',
    style: '提供合理化的借口，看似关心实则阻碍，语气低沉',
    examples: [
      '今天太累了，算了吧...',
      '这点小事做了也没用...',
      '完美的时机还没到...'
    ]
  }
};

// 场景类型
const SCENE_TYPES = {
  welcome: '用户首次进入游戏',
  dayStart: '用户开始新的一天',
  encourage: '用户完成微行动后的鼓励',
  streak: '用户连续完成多天',
  rescue: '用户中断后回归',
  workshop: '用户进入行为工坊',
  day7: '用户完成7天周期'
};

/**
 * 创建LLM客户端
 */
function createLLM() {
  return new ChatOpenAI({
    openAIApiKey: config.ai.deepseekApiKey,
    modelName: 'deepseek-chat',
    configuration: {
      baseURL: 'https://api.deepseek.com'
    },
    timeout: 5000,
    temperature: 0.8
  });
}

/**
 * 生成角色对话
 * @param {string} character 角色 'arc' | 'mia' | 'rift'
 * @param {string} scene 场景类型
 * @param {Object} context 上下文
 * @returns {Promise<string>} 对话内容
 */
async function generateDialogue(character, scene, context = {}) {
  try {
    const result = await generateDialogueWithLLM(character, scene, context);
    return result;
  } catch (error) {
    console.error('AI对话生成失败，使用预设台词:', error);
    return getFallbackDialogue(character, scene);
  }
}

/**
 * 使用LLM生成对话
 */
async function generateDialogueWithLLM(character, scene, context) {
  const charConfig = CHARACTER_PROMPTS[character];
  if (!charConfig) {
    throw new Error(`Unknown character: ${character}`);
  }
  
  const llm = createLLM();
  
  const systemPrompt = `你是${charConfig.name}，${charConfig.personality}。

说话风格：${charConfig.style}

示例台词：
${charConfig.examples.map(e => `- "${e}"`).join('\n')}

要求：
1. 保持角色性格一致
2. 台词简短有力(不超过30字)
3. 不要使用"你好""请"等客套话
4. 直接输出台词内容，不要引号`;

  const sceneDesc = SCENE_TYPES[scene] || scene;
  const userPrompt = `场景：${sceneDesc}
${context.userName ? `用户名：${context.userName}` : ''}
${context.streak ? `连续天数：${context.streak}天` : ''}
${context.wish ? `当前愿望：${context.wish}` : ''}
${context.behavior ? `刚完成的行为：${context.behavior}` : ''}

请生成一句符合角色的台词：`;

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt)
  ]);
  
  // 清理响应
  let dialogue = response.content.trim();
  dialogue = dialogue.replace(/^["'「]|["'」]$/g, ''); // 移除引号
  dialogue = dialogue.slice(0, 50); // 限制长度
  
  return dialogue;
}

/**
 * 获取预设台词
 */
function getFallbackDialogue(character, scene) {
  const fallbacks = {
    arc: {
      welcome: '欢迎回来，微光法师。',
      dayStart: '只施放一次咒语，就够了。',
      encourage: '你做到了最难的一步：开始。',
      streak: '微光正在变得更亮。',
      rescue: '微光不会因为休息而消失。',
      workshop: '在这里探索你的行为魔法。',
      day7: '第一座愿望城修复完成。'
    },
    mia: {
      welcome: '嘿！准备好探险了吗~',
      dayStart: '新的一天，新的魔法！',
      encourage: '太棒了！你做到了~',
      streak: '连续火力全开！🔥',
      rescue: '欢迎回来！我们继续~',
      workshop: '让我为你召唤一些灵感泡泡~',
      day7: '哇！你太厉害了!'
    },
    rift: {
      default: '今天休息一下也没关系...'
    }
  };
  
  const charFallbacks = fallbacks[character] || fallbacks.arc;
  return charFallbacks[scene] || charFallbacks.default || charFallbacks.dayStart;
}

/**
 * 批量生成多条台词(用于预缓存)
 * @param {string} character 角色
 * @param {string} scene 场景
 * @param {number} count 数量
 * @returns {Promise<Array>} 台词列表
 */
async function generateMultipleDialogues(character, scene, count = 5) {
  const dialogues = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const dialogue = await generateDialogueWithLLM(character, scene, { variant: i });
      if (dialogue && !dialogues.includes(dialogue)) {
        dialogues.push(dialogue);
      }
    } catch (error) {
      console.error(`第${i + 1}条生成失败:`, error);
    }
  }
  
  // 如果生成不足，补充预设
  while (dialogues.length < count) {
    const fallback = getFallbackDialogue(character, scene);
    if (!dialogues.includes(fallback)) {
      dialogues.push(fallback);
    } else {
      break;
    }
  }
  
  return dialogues;
}

module.exports = {
  generateDialogue,
  generateMultipleDialogues,
  getFallbackDialogue,
  CHARACTER_PROMPTS,
  SCENE_TYPES
};
```

### 3.3 API路由补充

```javascript
// src/routes/ai.js 补充

const { generateDialogue } = require('../services/dialogueService');

/**
 * 生成角色对话
 * POST /api/ai/dialogue
 */
router.post('/dialogue', aiLimiter, async (req, res, next) => {
  try {
    const { character, scene, context } = req.body;
    
    if (!character || !scene) {
      return res.status(400).json({
        success: false,
        error: 'Character and scene are required'
      });
    }
    
    const dialogue = await generateDialogue(character, scene, context || {});
    
    res.json({
      success: true,
      dialogue,
      character,
      scene
    });
    
  } catch (error) {
    next(error);
  }
});
```

### 3.4 前端使用

```javascript
// utils/dialogue.js

const { request } = require('./api.js');
const { getAuthToken } = require('./sync.js');

// 本地台词缓存
const dialogueCache = {};

/**
 * 获取角色台词
 * @param {string} character 角色
 * @param {string} scene 场景
 * @param {Object} context 上下文
 * @returns {Promise<string>} 台词
 */
async function getDialogue(character, scene, context = {}) {
  // 优先使用缓存
  const cacheKey = `${character}_${scene}`;
  if (dialogueCache[cacheKey]) {
    const cached = dialogueCache[cacheKey];
    const dialogue = cached.shift();
    if (cached.length === 0) {
      delete dialogueCache[cacheKey];
    }
    return dialogue;
  }
  
  // 尝试AI生成
  try {
    const token = await getAuthToken();
    const response = await request({
      url: '/api/ai/dialogue',
      method: 'POST',
      header: { 'Authorization': `Bearer ${token}` },
      data: { character, scene, context },
      timeout: 5000
    });
    
    if (response.data.success) {
      return response.data.dialogue;
    }
  } catch (error) {
    console.warn('AI台词获取失败:', error);
  }
  
  // 降级到本地预设
  return getLocalDialogue(character, scene);
}

/**
 * 本地预设台词
 */
function getLocalDialogue(character, scene) {
  const dialogues = require('../data/dialogues.js');
  return dialogues[character]?.[scene] || dialogues[character]?.default || '...';
}

module.exports = {
  getDialogue,
  getLocalDialogue
};
```

---

## 四、场景类型

| 场景ID | 说明 | 使用时机 |
|--------|------|----------|
| `welcome` | 首次进入 | Onboarding页 |
| `dayStart` | 开始新一天 | Daily页加载 |
| `encourage` | 完成微行动 | 击碎裂隙后 |
| `streak` | 连续多天 | streak≥3 |
| `rescue` | 中断回归 | rescue模式 |
| `workshop` | 行为工坊 | Workshop页 |
| `day7` | 完成周期 | Day7页 |

---

## 五、测试要点

1. 各角色台词符合性格
2. 台词长度适中
3. 不同场景返回不同台词
4. AI失败时降级正常
5. 缓存机制工作正常

---

## 六、交付物

- [x] `src/services/dialogueService.js`
- [x] API路由
- [x] 前端封装
- [x] 预设台词库
