/**
 * data.js - 游戏数据库
 * 包含：愿望库、行为库、裂变规则、台词池、天赋定义
 */

// ==================== 愿望库 ====================
// 12张默认愿望卡，用于两两对决和命运盘
const WISHES = [
  {
    id: 'health',
    name: '健康',
    icon: '💪',
    color: '#2ECC71',
    desc: '拥有充沛的精力和健康的身体'
  },
  {
    id: 'energy',
    name: '精力',
    icon: '⚡',
    color: '#F39C12',
    desc: '每天都充满活力，精神饱满'
  },
  {
    id: 'wealth',
    name: '财富',
    icon: '💰',
    color: '#F1C40F',
    desc: '实现财务自由，生活无忧'
  },
  {
    id: 'family',
    name: '家庭',
    icon: '🏠',
    color: '#E74C3C',
    desc: '家庭和睦，亲情温暖'
  },
  {
    id: 'growth',
    name: '成长',
    icon: '🌱',
    color: '#27AE60',
    desc: '不断学习进步，成为更好的自己'
  },
  {
    id: 'influence',
    name: '影响力',
    icon: '🌟',
    color: '#9B59B6',
    desc: '能够影响和帮助更多的人'
  },
  {
    id: 'freedom',
    name: '自由',
    icon: '🦋',
    color: '#3498DB',
    desc: '自由支配时间，做想做的事'
  },
  {
    id: 'relationship',
    name: '关系',
    icon: '💝',
    color: '#E91E63',
    desc: '拥有深厚真挚的人际关系'
  },
  {
    id: 'focus',
    name: '专注',
    icon: '🎯',
    color: '#00BCD4',
    desc: '心无旁骛，高效完成目标'
  },
  {
    id: 'discipline',
    name: '自律',
    icon: '🔥',
    color: '#FF5722',
    desc: '说到做到，掌控自己的生活'
  },
  {
    id: 'skill',
    name: '技能',
    icon: '🛠',
    color: '#607D8B',
    desc: '掌握一门或多门实用技能'
  },
  {
    id: 'travel',
    name: '旅行',
    icon: '✈️',
    color: '#00BCD4',
    desc: '探索世界，体验不同的生活'
  }
];

// ==================== 行为库 ====================
// 按愿望分类的行为气泡，用于召唤灵感
const BEHAVIORS = {
  health: [
    { id: 'h1', name: '喝一杯水', seconds: 30, difficulty: 1, type: 'base' },
    { id: 'h2', name: '站起来伸展', seconds: 60, difficulty: 1, type: 'base' },
    { id: 'h3', name: '深呼吸三次', seconds: 30, difficulty: 1, type: 'base' },
    { id: 'h4', name: '做5个深蹲', seconds: 60, difficulty: 1, type: 'base' },
    { id: 'h5', name: '散步10分钟', seconds: 600, difficulty: 2, type: 'main' },
    { id: 'h6', name: '做一组俯卧撑', seconds: 120, difficulty: 2, type: 'main' },
    { id: 'h7', name: '跳绳50下', seconds: 180, difficulty: 2, type: 'main' },
    { id: 'h8', name: '对着镜子微笑', seconds: 20, difficulty: 1, type: 'bonus' }
  ],
  energy: [
    { id: 'e1', name: '早起晒太阳1分钟', seconds: 60, difficulty: 1, type: 'base' },
    { id: 'e2', name: '听一首提神的歌', seconds: 180, difficulty: 1, type: 'base' },
    { id: 'e3', name: '用冷水洗脸', seconds: 30, difficulty: 1, type: 'base' },
    { id: 'e4', name: '做3个开合跳', seconds: 30, difficulty: 1, type: 'base' },
    { id: 'e5', name: '午休闭眼5分钟', seconds: 300, difficulty: 2, type: 'main' },
    { id: 'e6', name: '快走到楼下再回来', seconds: 180, difficulty: 2, type: 'main' },
    { id: 'e7', name: '给自己倒杯热茶', seconds: 60, difficulty: 1, type: 'bonus' }
  ],
  wealth: [
    { id: 'w1', name: '记一笔今日开支', seconds: 60, difficulty: 1, type: 'base' },
    { id: 'w2', name: '看一条理财资讯', seconds: 120, difficulty: 1, type: 'base' },
    { id: 'w3', name: '把零钱存入储蓄', seconds: 30, difficulty: 1, type: 'base' },
    { id: 'w4', name: '列出明天必买清单', seconds: 120, difficulty: 1, type: 'base' },
    { id: 'w5', name: '学习一个理财概念', seconds: 300, difficulty: 2, type: 'main' },
    { id: 'w6', name: '检查一下订阅服务', seconds: 180, difficulty: 2, type: 'main' },
    { id: 'w7', name: '想象财务自由的样子', seconds: 60, difficulty: 1, type: 'bonus' }
  ],
  family: [
    { id: 'f1', name: '给家人发一条问候', seconds: 60, difficulty: 1, type: 'base' },
    { id: 'f2', name: '说一句感谢的话', seconds: 30, difficulty: 1, type: 'base' },
    { id: 'f3', name: '帮家人倒杯水', seconds: 30, difficulty: 1, type: 'base' },
    { id: 'f4', name: '分享今天的一件事', seconds: 120, difficulty: 1, type: 'base' },
    { id: 'f5', name: '和家人聊天5分钟', seconds: 300, difficulty: 2, type: 'main' },
    { id: 'f6', name: '一起吃顿饭', seconds: 1800, difficulty: 2, type: 'main' },
    { id: 'f7', name: '给家人一个拥抱', seconds: 20, difficulty: 1, type: 'bonus' }
  ],
  growth: [
    { id: 'g1', name: '读一页书', seconds: 60, difficulty: 1, type: 'base' },
    { id: 'g2', name: '学一个新单词', seconds: 60, difficulty: 1, type: 'base' },
    { id: 'g3', name: '写一句今日感悟', seconds: 60, difficulty: 1, type: 'base' },
    { id: 'g4', name: '听3分钟播客', seconds: 180, difficulty: 1, type: 'base' },
    { id: 'g5', name: '看一个教学视频', seconds: 300, difficulty: 2, type: 'main' },
    { id: 'g6', name: '做一道练习题', seconds: 300, difficulty: 2, type: 'main' },
    { id: 'g7', name: '教别人一个小知识', seconds: 120, difficulty: 1, type: 'bonus' }
  ],
  influence: [
    { id: 'i1', name: '给同事点个赞', seconds: 30, difficulty: 1, type: 'base' },
    { id: 'i2', name: '分享一条有价值的内容', seconds: 120, difficulty: 1, type: 'base' },
    { id: 'i3', name: '真诚地夸奖一个人', seconds: 60, difficulty: 1, type: 'base' },
    { id: 'i4', name: '回复一条消息', seconds: 60, difficulty: 1, type: 'base' },
    { id: 'i5', name: '写一段观点分享', seconds: 300, difficulty: 2, type: 'main' },
    { id: 'i6', name: '帮别人解答一个问题', seconds: 180, difficulty: 2, type: 'main' },
    { id: 'i7', name: '想象自己演讲的样子', seconds: 60, difficulty: 1, type: 'bonus' }
  ],
  freedom: [
    { id: 'fr1', name: '什么都不做1分钟', seconds: 60, difficulty: 1, type: 'base' },
    { id: 'fr2', name: '看看窗外的风景', seconds: 60, difficulty: 1, type: 'base' },
    { id: 'fr3', name: '放下手机1分钟', seconds: 60, difficulty: 1, type: 'base' },
    { id: 'fr4', name: '想象理想的一天', seconds: 120, difficulty: 1, type: 'base' },
    { id: 'fr5', name: '做一件"没用"的事', seconds: 300, difficulty: 2, type: 'main' },
    { id: 'fr6', name: '去一个没去过的地方', seconds: 600, difficulty: 2, type: 'main' },
    { id: 'fr7', name: '大声说"我自由了"', seconds: 10, difficulty: 1, type: 'bonus' }
  ],
  relationship: [
    { id: 'r1', name: '给朋友发一条消息', seconds: 60, difficulty: 1, type: 'base' },
    { id: 'r2', name: '认真听别人说完', seconds: 120, difficulty: 1, type: 'base' },
    { id: 'r3', name: '记住一个人的名字', seconds: 30, difficulty: 1, type: 'base' },
    { id: 'r4', name: '说一句"谢谢你"', seconds: 10, difficulty: 1, type: 'base' },
    { id: 'r5', name: '约朋友下次见面', seconds: 120, difficulty: 2, type: 'main' },
    { id: 'r6', name: '写一张小纸条给某人', seconds: 180, difficulty: 2, type: 'main' },
    { id: 'r7', name: '对陌生人微笑', seconds: 10, difficulty: 1, type: 'bonus' }
  ],
  focus: [
    { id: 'fo1', name: '关闭一个通知', seconds: 30, difficulty: 1, type: 'base' },
    { id: 'fo2', name: '清理桌面一个角落', seconds: 60, difficulty: 1, type: 'base' },
    { id: 'fo3', name: '写下现在要做的一件事', seconds: 30, difficulty: 1, type: 'base' },
    { id: 'fo4', name: '专注呼吸30秒', seconds: 30, difficulty: 1, type: 'base' },
    { id: 'fo5', name: '番茄钟工作5分钟', seconds: 300, difficulty: 2, type: 'main' },
    { id: 'fo6', name: '完成一个最小任务', seconds: 180, difficulty: 2, type: 'main' },
    { id: 'fo7', name: '想象任务完成的画面', seconds: 30, difficulty: 1, type: 'bonus' }
  ],
  discipline: [
    { id: 'd1', name: '按时起床那一刻', seconds: 10, difficulty: 1, type: 'base' },
    { id: 'd2', name: '整理床铺', seconds: 60, difficulty: 1, type: 'base' },
    { id: 'd3', name: '准时开始一件事', seconds: 30, difficulty: 1, type: 'base' },
    { id: 'd4', name: '拒绝一次诱惑', seconds: 30, difficulty: 1, type: 'base' },
    { id: 'd5', name: '完成今日计划的第一项', seconds: 300, difficulty: 2, type: 'main' },
    { id: 'd6', name: '复盘今天做得好的事', seconds: 180, difficulty: 2, type: 'main' },
    { id: 'd7', name: '给自己一个小奖励', seconds: 60, difficulty: 1, type: 'bonus' }
  ],
  skill: [
    { id: 's1', name: '练习技能1分钟', seconds: 60, difficulty: 1, type: 'base' },
    { id: 's2', name: '看一个教程开头', seconds: 120, difficulty: 1, type: 'base' },
    { id: 's3', name: '复习昨天学的内容', seconds: 60, difficulty: 1, type: 'base' },
    { id: 's4', name: '尝试一个新操作', seconds: 60, difficulty: 1, type: 'base' },
    { id: 's5', name: '完成一个小练习', seconds: 300, difficulty: 2, type: 'main' },
    { id: 's6', name: '记录学习笔记', seconds: 180, difficulty: 2, type: 'main' },
    { id: 's7', name: '想象自己精通的样子', seconds: 60, difficulty: 1, type: 'bonus' }
  ],
  travel: [
    { id: 't1', name: '看一张旅行照片', seconds: 60, difficulty: 1, type: 'base' },
    { id: 't2', name: '在地图上点一个地方', seconds: 30, difficulty: 1, type: 'base' },
    { id: 't3', name: '学一句当地语言', seconds: 60, difficulty: 1, type: 'base' },
    { id: 't4', name: '查一个景点信息', seconds: 120, difficulty: 1, type: 'base' },
    { id: 't5', name: '做一个旅行清单', seconds: 300, difficulty: 2, type: 'main' },
    { id: 't6', name: '规划下次出行路线', seconds: 300, difficulty: 2, type: 'main' },
    { id: 't7', name: '闭眼想象在旅途中', seconds: 60, difficulty: 1, type: 'bonus' }
  ]
};

// 通用行为（适用于所有愿望）
const UNIVERSAL_BEHAVIORS = [
  { id: 'u1', name: '深呼吸一次', seconds: 10, difficulty: 1, type: 'base' },
  { id: 'u2', name: '喝一口水', seconds: 10, difficulty: 1, type: 'base' },
  { id: 'u3', name: '站起来活动', seconds: 30, difficulty: 1, type: 'base' },
  { id: 'u4', name: '微笑一下', seconds: 5, difficulty: 1, type: 'bonus' }
];

// ==================== 裂变规则 ====================
// 将较大行为拆解为更小行为
const FISSION_RULES = {
  // 运动类裂变
  '散步10分钟': ['站起来', '走到门口', '下楼', '走100步'],
  '做一组俯卧撑': ['趴到地上', '做1个俯卧撑', '休息3秒', '再做1个'],
  '跳绳50下': ['拿起跳绳', '跳1下', '跳5下', '跳10下'],
  '做5个深蹲': ['站稳', '蹲下去', '站起来', '做1个深蹲'],

  // 学习类裂变
  '读一页书': ['拿起书', '打开书', '看第一行', '读完一段'],
  '看一个教学视频': ['打开App', '选一个视频', '看30秒', '看完开头'],
  '学一个新单词': ['打开词典', '看一眼单词', '读一遍', '写一遍'],
  '做一道练习题': ['打开题目', '读题', '想一想', '写第一步'],

  // 社交类裂变
  '和家人聊天5分钟': ['走到家人身边', '说一句话', '问一个问题', '听ta说'],
  '给朋友发一条消息': ['打开聊天', '想一句话', '打几个字', '发送'],
  '约朋友下次见面': ['想一个朋友', '发消息', '提一个时间', '等回复'],

  // 工作类裂变
  '番茄钟工作5分钟': ['设定计时器', '开始工作', '专注1分钟', '完成一小步'],
  '完成一个最小任务': ['看任务列表', '选最小的', '开始做', '做完第一步'],
  '完成今日计划的第一项': ['打开计划', '看第一项', '开始做', '做1分钟'],

  // 通用裂变
  'default': ['想一想', '准备好', '开始', '做一点点']
};

// ==================== 合成规则 ====================
// 两个行为合成新咒语的模板
const SYNTHESIS_TEMPLATES = [
  '{0}之后{1}',
  '先{0}再{1}',
  '{0}+{1}组合技',
  '微光·{0}{1}术'
];

// ==================== 角色天赋 ====================
const TALENTS = [
  {
    id: 'spark',
    name: '火花型',
    icon: '🔥',
    color: '#FF6B6B',
    desc: '灵感爆发，适合创意和突破',
    bonus: '每日彩蛋卡概率+10%'
  },
  {
    id: 'tide',
    name: '潮汐型',
    icon: '🌊',
    color: '#4ECDC4',
    desc: '稳定如潮，适合持续和节奏',
    bonus: '连续完成奖励+1天'
  },
  {
    id: 'mason',
    name: '石匠型',
    icon: '🏔',
    color: '#95A5A6',
    desc: '踏实稳健，适合基础和积累',
    bonus: '保底卡效果+20%'
  },
  {
    id: 'wind',
    name: '风行型',
    icon: '💨',
    color: '#A29BFE',
    desc: '快速行动，适合效率和执行',
    bonus: '任务时间减少10秒'
  }
];

// ==================== 7天主线台词 ====================
const STORY_DIALOGUES = {
  day1: {
    arc: '你不需要更努力，你需要更小一点。',
    mia: '欢迎来到行为工坊！让我们一起探索可能性吧~',
    rift: '你又要开始什么新计划？反正坚持不了几天。'
  },
  day2: {
    arc: '只施放一次咒语，就够了。',
    rift: '今天太忙了，算了吧。'
  },
  day3: {
    arc: '你做到了最难的一步：开始。',
    rift: '这种小事有什么意义？'
  },
  day4: {
    arc: '那就让它更小，小到无法拒绝。',
    rift: '这点做了也没用。'
  },
  day5: {
    arc: '裂变启动！把“宏大计划”拆成“一步就行”。',
    rift: '别人都在做大事，你在这玩什么？'
  },
  day6: {
    arc: '你正在形成自己的节奏，不需要完美。',
    rift: '快放弃吧，还差最后一天而已。'
  },
  day7: {
    arc: '第一座愿望城修复完成。微光会带你去下一座城。',
    rift: '哼...这次算你赢...'
  }
};

// ==================== 裂隙宣言（阻力池） ====================
const RIFT_DECLARATIONS = [
  '今天太忙了，明天再说吧。',
  '这么小的事，做了有什么用？',
  '反正也坚持不了几天。',
  '我太累了，没有精力。',
  '等我准备好了再开始。',
  '别人都不需要这样。',
  '这不适合我。',
  '先休息一下，待会再做。',
  '今天心情不好，算了。',
  '改天一定，今天除外。',
  '做这个浪费时间。',
  '等有时间再说。'
];

// ==================== 鼓励台词 ====================
const ENCOURAGEMENTS = [
  '击碎裂隙！你的微光正在变强。',
  '太棒了！每一次行动都在改变你。',
  '你证明了：再小的行动也有意义。',
  '裂隙消散，愿望城更近了一步。',
  '这就是微光法师的力量！',
  '你做到了！习惯正在生根发芽。',
  '每一次施放咒语，都是对自己的承诺。',
  '微小却坚定，这就是你的魔法。'
];

// ==================== 救援卡池 ====================
const RESCUE_CARDS = [
  { id: 'rescue1', name: '深呼吸三次', desc: '简单到无法拒绝', seconds: 30, difficulty: 1, type: 'base' },
  { id: 'rescue2', name: '喝一杯水', desc: '最基础的自我关怀', seconds: 30, difficulty: 1, type: 'base' },
  { id: 'rescue3', name: '站起来伸展', desc: '让身体动一动', seconds: 60, difficulty: 1, type: 'base' },
  { id: 'rescue4', name: '对自己说"没关系"', desc: '温柔地对待自己', seconds: 10, difficulty: 1, type: 'base' }
];

// ==================== 导出模块 ====================
module.exports = {
  WISHES,
  BEHAVIORS,
  UNIVERSAL_BEHAVIORS,
  FISSION_RULES,
  SYNTHESIS_TEMPLATES,
  TALENTS,
  STORY_DIALOGUES,
  RIFT_DECLARATIONS,
  ENCOURAGEMENTS,
  RESCUE_CARDS,

  // 辅助函数：根据愿望获取行为列表
  getBehaviorsByWish(wishId) {
    const wishBehaviors = BEHAVIORS[wishId] || [];
    return [...wishBehaviors, ...UNIVERSAL_BEHAVIORS];
  },

  // 辅助函数：随机获取N个行为
  getRandomBehaviors(wishId, count = 3) {
    const behaviors = this.getBehaviorsByWish(wishId);
    const shuffled = behaviors.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },

  // 辅助函数：获取裂变结果
  getFissionResult(behaviorName) {
    return FISSION_RULES[behaviorName] || FISSION_RULES['default'];
  },

  // 辅助函数：合成新咒语
  synthesize(behavior1, behavior2) {
    const template = SYNTHESIS_TEMPLATES[Math.floor(Math.random() * SYNTHESIS_TEMPLATES.length)];
    const name = template.replace('{0}', behavior1.name).replace('{1}', behavior2.name);
    return {
      id: 'syn_' + Date.now(),
      name: name,
      desc: `由「${behavior1.name}」和「${behavior2.name}」合成`,
      seconds: Math.max(behavior1.seconds, behavior2.seconds),
      difficulty: Math.max(behavior1.difficulty, behavior2.difficulty),
      type: 'main',
      isSynthesized: true
    };
  },

  // 辅助函数：获取当天台词
  getDayDialogue(day) {
    const key = 'day' + day;
    return STORY_DIALOGUES[key] || STORY_DIALOGUES['day1'];
  },

  // 辅助函数：随机裂隙宣言
  getRandomRiftDeclaration() {
    return RIFT_DECLARATIONS[Math.floor(Math.random() * RIFT_DECLARATIONS.length)];
  },

  // 辅助函数：随机鼓励语
  getRandomEncouragement() {
    return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
  },

  // 辅助函数：获取救援卡
  getRandomRescueCard() {
    return RESCUE_CARDS[Math.floor(Math.random() * RESCUE_CARDS.length)];
  }
};
