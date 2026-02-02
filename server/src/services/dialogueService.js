/**
 * AI对话生成服务
 */

const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const config = require('../config');

// 对话缓存 (简单内存缓存, key: character_scene_context)
// 注意: 生产环境应使用Redis
const dialogueCache = new Map();

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
    const apiKey = config.ai.deepseekApiKey || config.ai.doubaoApiKey;
    if (!apiKey) return null;

    return new ChatOpenAI({
        openAIApiKey: apiKey,
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
        const llm = createLLM();
        if (!llm) {
            return getFallbackDialogue(character, scene);
        }

        const result = await generateDialogueWithLLM(llm, character, scene, context);
        return result;
    } catch (error) {
        console.error('AI对话生成失败，使用预设台词:', error);
        return getFallbackDialogue(character, scene);
    }
}

/**
 * 使用LLM生成对话
 */
async function generateDialogueWithLLM(llm, character, scene, context) {
    const charConfig = CHARACTER_PROMPTS[character];
    if (!charConfig) {
        throw new Error(`Unknown character: ${character}`);
    }

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
            day7: '第一座愿望城修复完成。',
            default: '相信微小的力量。'
        },
        mia: {
            welcome: '嘿！准备好探险了吗~',
            dayStart: '新的一天，新的魔法！',
            encourage: '太棒了！你做到了~',
            streak: '连续火力全开！🔥',
            rescue: '欢迎回来！我们继续~',
            workshop: '让我为你召唤一些灵感泡泡~',
            day7: '哇！你太厉害了!',
            default: '一起加油吧！'
        },
        rift: {
            default: '今天休息一下也没关系...',
            welcome: '又来了...真有必要吗？',
            dayStart: '再睡一会吧...'
        }
    };

    const charFallbacks = fallbacks[character] || fallbacks.arc;
    return charFallbacks[scene] || charFallbacks.default || '...';
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
    const llm = createLLM();

    if (!llm) {
        const fallback = getFallbackDialogue(character, scene);
        return [fallback];
    }

    // Limited parallel execution to avoid rate limits
    for (let i = 0; i < count; i++) {
        try {
            const dialogue = await generateDialogueWithLLM(llm, character, scene, { variant: i });
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
