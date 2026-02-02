# T19: AI MAP评估服务

> **优先级**: P0 (必须实现)
> **预估工时**: 2天
> **负责人**: 后端开发
> **状态**: ✅ DONE

---

## 一、任务描述

实现AI MAP评估服务，基于Fogg行为模型(B=MAP)检测用户生成的卡组质量，评估动机(Motivation)、能力(Ability)、提示(Prompt)三个维度。

---

## 二、验收标准

- [ ] 能评估卡组的MAP三维度得分
- [ ] 返回整体评估结果(Pass/Warning/Fail)
- [ ] 提供改进建议
- [ ] 响应时间<5秒
- [ ] 双模型备份
- [ ] 降级机制(返回默认Pass)

---

## 三、技术实现

### 3.1 MAP评估服务 `src/services/mapService.js`

```javascript
/**
 * AI MAP评估服务
 * 基于Fogg行为模型评估卡组质量
 */

const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const config = require('../config');

/**
 * 创建LLM客户端
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
      temperature: 0.3
    });
  } else {
    return new ChatOpenAI({
      openAIApiKey: config.ai.doubaoApiKey,
      modelName: 'doubao-pro-4k',
      configuration: {
        baseURL: 'https://ark.cn-beijing.volces.com/api/v3'
      },
      timeout: config.ai.timeout,
      temperature: 0.3
    });
  }
}

/**
 * 评估卡组
 * @param {Array} deck 卡组(3张卡)
 * @returns {Promise<Object>} 评估结果
 */
async function evaluateMAP(deck) {
  try {
    // 先进行本地规则检查
    const localResult = localEvaluate(deck);
    if (localResult.overall === 'Fail') {
      return localResult;
    }
    
    // 再进行AI评估
    const aiResult = await aiEvaluate(deck);
    return mergeResults(localResult, aiResult);
    
  } catch (error) {
    console.error('MAP评估失败，使用降级方案:', error);
    return getFallbackResult(deck);
  }
}

/**
 * 本地规则评估
 */
function localEvaluate(deck) {
  const issues = [];
  const scores = { motivation: 3, ability: 3, prompt: 3 };
  
  // 检查卡片数量
  if (!deck || deck.length === 0) {
    return {
      overall: 'Fail',
      scores: { motivation: 0, ability: 0, prompt: 0 },
      feedback: '卡组为空，请先添加行为',
      suggestions: ['返回工坊添加行为']
    };
  }
  
  // 检查保底卡
  const baseCard = deck.find(c => c.type === 'base');
  if (!baseCard) {
    issues.push('缺少保底卡');
    scores.ability -= 1;
  }
  
  // 检查行为时长
  deck.forEach(card => {
    if (card.seconds > 300) {
      issues.push(`"${card.name}"时间过长(${card.seconds}秒)`);
      scores.ability -= 1;
    }
    if (card.seconds < 5) {
      issues.push(`"${card.name}"时间过短`);
    }
  });
  
  // 检查锚点
  const cardsWithAnchor = deck.filter(c => c.anchor && c.anchor.trim());
  if (cardsWithAnchor.length < deck.length) {
    issues.push('部分卡片缺少锚点');
    scores.prompt -= 1;
  }
  
  // 检查难度梯度
  const difficulties = deck.map(c => c.difficulty || 1);
  if (difficulties.every(d => d >= 2)) {
    issues.push('所有卡片难度偏高');
    scores.ability -= 1;
  }
  
  // 计算整体评估
  const avgScore = (scores.motivation + scores.ability + scores.prompt) / 3;
  let overall = 'Pass';
  if (avgScore < 2) {
    overall = 'Fail';
  } else if (avgScore < 2.5 || issues.length > 2) {
    overall = 'Warning';
  }
  
  return {
    overall,
    scores,
    issues,
    feedback: issues.length > 0 ? issues.join('；') : '卡组看起来不错！',
    suggestions: generateSuggestions(issues)
  };
}

/**
 * AI评估
 */
async function aiEvaluate(deck) {
  const llm = createLLM('deepseek');
  
  const systemPrompt = `你是一个习惯养成专家，基于Fogg行为模型(B=MAP)评估微习惯卡组质量。

评估维度：
- Motivation(动机): 行为与用户愿望的关联度
- Ability(能力): 行为的简单程度，是否足够小
- Prompt(提示): 锚点是否明确且有效

评分规则(1-5分)：
- 5分: 优秀，完全符合要求
- 4分: 良好，基本符合
- 3分: 一般，有改进空间
- 2分: 较差，有明显问题
- 1分: 很差，需要重新设计

请分析卡组并给出评估，只返回JSON格式结果。`;

  const deckInfo = deck.map(card => ({
    name: card.name,
    type: card.type,
    seconds: card.seconds,
    difficulty: card.difficulty,
    anchor: card.anchor,
    wish: card.wish
  }));

  const userPrompt = `请评估以下卡组：

${JSON.stringify(deckInfo, null, 2)}

请返回JSON格式：
{
  "scores": {
    "motivation": <1-5>,
    "ability": <1-5>,
    "prompt": <1-5>
  },
  "overall": "<Pass|Warning|Fail>",
  "feedback": "<一句话总结>",
  "suggestions": ["<改进建议1>", "<改进建议2>"]
}`;

  try {
    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ]);
    
    const content = response.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return validateAIResult(JSON.parse(jsonMatch[0]));
    }
    
    throw new Error('无法解析AI响应');
  } catch (error) {
    console.warn('DeepSeek评估失败，尝试Doubao:', error.message);
    return await aiEvaluateBackup(deck);
  }
}

/**
 * 使用备用模型评估
 */
async function aiEvaluateBackup(deck) {
  const llm = createLLM('doubao');
  
  const prompt = `评估这个微习惯卡组的质量(基于Fogg模型B=MAP)：
${deck.map(c => `- ${c.name}(${c.seconds}秒, ${c.anchor || '无锚点'})`).join('\n')}

返回JSON: {"scores":{"motivation":3,"ability":3,"prompt":3},"overall":"Pass","feedback":"...","suggestions":[]}`;

  try {
    const response = await llm.invoke([new HumanMessage(prompt)]);
    const content = response.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return validateAIResult(JSON.parse(jsonMatch[0]));
    }
    throw new Error('无法解析响应');
  } catch (error) {
    console.error('备用模型也失败:', error);
    return null;
  }
}

/**
 * 验证AI结果格式
 */
function validateAIResult(result) {
  const defaults = {
    scores: { motivation: 3, ability: 3, prompt: 3 },
    overall: 'Pass',
    feedback: '',
    suggestions: []
  };
  
  if (!result) return defaults;
  
  return {
    scores: {
      motivation: Math.min(5, Math.max(1, result.scores?.motivation || 3)),
      ability: Math.min(5, Math.max(1, result.scores?.ability || 3)),
      prompt: Math.min(5, Math.max(1, result.scores?.prompt || 3))
    },
    overall: ['Pass', 'Warning', 'Fail'].includes(result.overall) ? result.overall : 'Pass',
    feedback: typeof result.feedback === 'string' ? result.feedback.slice(0, 100) : '',
    suggestions: Array.isArray(result.suggestions) ? result.suggestions.slice(0, 3) : []
  };
}

/**
 * 合并本地和AI评估结果
 */
function mergeResults(localResult, aiResult) {
  if (!aiResult) return localResult;
  
  // 取两者的较低分
  const mergedScores = {
    motivation: Math.min(localResult.scores.motivation, aiResult.scores.motivation),
    ability: Math.min(localResult.scores.ability, aiResult.scores.ability),
    prompt: Math.min(localResult.scores.prompt, aiResult.scores.prompt)
  };
  
  // 整体评估：如果任一为Fail则Fail，任一为Warning则Warning
  let overall = 'Pass';
  if (localResult.overall === 'Fail' || aiResult.overall === 'Fail') {
    overall = 'Fail';
  } else if (localResult.overall === 'Warning' || aiResult.overall === 'Warning') {
    overall = 'Warning';
  }
  
  return {
    overall,
    scores: mergedScores,
    feedback: aiResult.feedback || localResult.feedback,
    suggestions: [...new Set([...localResult.suggestions || [], ...aiResult.suggestions || []])].slice(0, 3),
    localIssues: localResult.issues
  };
}

/**
 * 生成改进建议
 */
function generateSuggestions(issues) {
  const suggestions = [];
  
  if (issues.some(i => i.includes('时间过长'))) {
    suggestions.push('尝试使用裂变功能把行为拆小');
  }
  if (issues.some(i => i.includes('锚点'))) {
    suggestions.push('为每个行为设置明确的触发时机');
  }
  if (issues.some(i => i.includes('难度'))) {
    suggestions.push('添加一个超简单的保底行为');
  }
  if (issues.some(i => i.includes('保底卡'))) {
    suggestions.push('确保有一张简单的保底卡');
  }
  
  return suggestions;
}

/**
 * 降级评估结果
 */
function getFallbackResult(deck) {
  return {
    overall: 'Pass',
    scores: { motivation: 3, ability: 3, prompt: 3 },
    feedback: '卡组已生成',
    suggestions: [],
    isFallback: true
  };
}

module.exports = {
  evaluateMAP,
  localEvaluate,
  getFallbackResult
};
```

### 3.2 前端集成

```javascript
// utils/api.js 补充

/**
 * 调用AI MAP评估
 * @param {Array} deck 卡组
 * @returns {Promise<Object>} 评估结果
 */
async function evaluateMAP(deck) {
  try {
    const token = await getAuthToken();
    
    const response = await requestWithRetry({
      url: `${API_BASE}/api/ai/map`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { deck },
      timeout: 15000 // MAP评估可能需要更长时间
    });
    
    if (response.data.success) {
      return response.data;
    }
    
    throw new Error(response.data.error);
  } catch (error) {
    console.error('MAP评估失败:', error);
    // 返回本地降级结果
    return localMAPEvaluate(deck);
  }
}

/**
 * 本地MAP评估(降级)
 */
function localMAPEvaluate(deck) {
  if (!deck || deck.length === 0) {
    return {
      overall: 'Warning',
      feedback: '卡组为空',
      scores: { motivation: 2, ability: 2, prompt: 2 }
    };
  }
  
  // 简单的本地检查
  const hasAnchor = deck.every(c => c.anchor);
  const hasEasyCard = deck.some(c => c.difficulty === 1 || c.seconds <= 60);
  const allShort = deck.every(c => c.seconds <= 300);
  
  if (hasAnchor && hasEasyCard && allShort) {
    return {
      overall: 'Pass',
      feedback: '卡组看起来不错！',
      scores: { motivation: 4, ability: 4, prompt: 4 }
    };
  }
  
  return {
    overall: 'Warning',
    feedback: '建议添加锚点并确保有简单的保底卡',
    scores: { motivation: 3, ability: 3, prompt: 3 }
  };
}
```

---

## 四、评估维度说明

| 维度 | 检查项 | 权重 |
|------|--------|------|
| **Motivation** | 行为与愿望关联度 | 30% |
| **Ability** | 行为简单程度、时长<5分钟、有保底卡 | 40% |
| **Prompt** | 锚点明确、具体可执行 | 30% |

### 4.1 评分标准

| 分数 | 含义 | 示例 |
|------|------|------|
| 5分 | 优秀 | 行为<30秒，锚点具体，与愿望高度相关 |
| 4分 | 良好 | 行为<2分钟，锚点清晰 |
| 3分 | 一般 | 行为<5分钟，有锚点 |
| 2分 | 较差 | 行为过长或缺少锚点 |
| 1分 | 很差 | 无法执行或完全不相关 |

### 4.2 整体评估

| 结果 | 条件 | 用户提示 |
|------|------|---------|
| **Pass** | 平均分≥3.5 | ✅ 卡组检查通过 |
| **Warning** | 平均分2-3.5 | ⚠️ 有些建议 |
| **Fail** | 平均分<2 | ❌ 需要调整 |

---

## 五、测试要点

1. 空卡组返回Fail
2. 正常卡组返回Pass
3. 问题卡组返回Warning/Fail和建议
4. AI超时降级正常
5. 评分在合理范围内

---

## 六、交付物

- [x] `src/services/mapService.js`
- [x] 前端API封装
- [x] 单元测试
