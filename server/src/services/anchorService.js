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
            openAIApiKey: config.ai.deepseekApiKey || 'dummy_key',
            modelName: 'deepseek-chat',
            configuration: {
                baseURL: 'https://api.deepseek.com'
            },
            timeout: config.ai.timeout,
            temperature: 0.7
        });
    } else {
        return new ChatOpenAI({
            openAIApiKey: config.ai.doubaoApiKey || 'dummy_key',
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
        // Check if API key is present, if not, skip LLM call
        if (!config.ai.deepseekApiKey && !config.ai.doubaoApiKey) {
            console.log('No API keys found, using fallback anchors.');
            return getFallbackAnchors(behavior.category);
        }
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
        // Try to find JSON array in content
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
