const Habit = require('../models/Habit');
const User = require('../models/User');

// 成就定义
const achievementDefinitions = [
  { id: 'first_habit', icon: '🌱', name: '破冰者', desc: '创建第一个习惯' },
  { id: 'three_habits', icon: '🎯', name: '多面手', desc: '创建3个习惯' },
  { id: 'first_complete', icon: '✨', name: '首战告捷', desc: '完成第一个习惯' },
  { id: 'ten_complete', icon: '💪', name: '坚持不懈', desc: '累计完成10次' },
  { id: 'streak_3', icon: '🔥', name: '三日之约', desc: '连续3天' },
  { id: 'streak_7', icon: '⭐', name: '一周达人', desc: '连续7天' },
  { id: 'streak_30', icon: '👑', name: '月度冠军', desc: '连续30天' },
  { id: 'score_100', icon: '🏅', name: '百分成就', desc: '总分达到100' },
  { id: 'score_500', icon: '💎', name: '五百强者', desc: '总分达到500' }
];

// 检查成就
const checkAchievements = (user, habitCount) => {
  const newAchievements = [];
  const gameData = user.gameData;
  const currentAchievements = gameData.achievements || [];

  // 检查各项成就
  const checks = [
    { id: 'first_habit', condition: habitCount >= 1 },
    { id: 'three_habits', condition: habitCount >= 3 },
    { id: 'first_complete', condition: gameData.totalCompleted >= 1 },
    { id: 'ten_complete', condition: gameData.totalCompleted >= 10 },
    { id: 'streak_3', condition: gameData.streak >= 3 },
    { id: 'streak_7', condition: gameData.streak >= 7 },
    { id: 'streak_30', condition: gameData.streak >= 30 },
    { id: 'score_100', condition: gameData.score >= 100 },
    { id: 'score_500', condition: gameData.score >= 500 }
  ];

  checks.forEach(check => {
    if (check.condition && !currentAchievements.includes(check.id)) {
      currentAchievements.push(check.id);
      const achievement = achievementDefinitions.find(a => a.id === check.id);
      if (achievement) {
        newAchievements.push(achievement);
      }
    }
  });

  gameData.achievements = currentAchievements;
  return { gameData, newAchievements };
};

// 获取统计数据
exports.getStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const habitCount = await Habit.countDocuments({
      user: req.user._id,
      isActive: true
    });

    // 检查并更新成就
    const { gameData, newAchievements } = checkAchievements(user, habitCount);

    if (newAchievements.length > 0) {
      user.gameData = gameData;
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: {
        gameData: user.gameData,
        habitCount,
        newAchievements
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '获取统计数据失败'
    });
  }
};

// 获取成就列表
exports.getAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const unlockedAchievements = user.gameData.achievements || [];

    const achievements = achievementDefinitions.map(achievement => ({
      ...achievement,
      unlocked: unlockedAchievements.includes(achievement.id)
    }));

    res.status(200).json({
      success: true,
      data: achievements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '获取成就列表失败'
    });
  }
};

// 获取完成历史
exports.getCompletionHistory = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const habits = await Habit.find({
      user: req.user._id,
      isActive: true
    });

    // 汇总最近N天的完成记录
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const history = {};
    habits.forEach(habit => {
      habit.completionHistory.forEach(record => {
        if (new Date(record.timestamp) >= cutoffDate) {
          if (!history[record.date]) {
            history[record.date] = [];
          }
          history[record.date].push({
            habitId: habit._id,
            anchor: habit.anchor,
            behavior: habit.behavior
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '获取完成历史失败'
    });
  }
};

// 获取排行榜（可选功能）
exports.getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find()
      .select('username gameData.score gameData.streak gameData.level')
      .sort({ 'gameData.score': -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: topUsers.map((user, index) => ({
        rank: index + 1,
        username: user.username,
        score: user.gameData.score,
        streak: user.gameData.streak,
        level: user.gameData.level
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '获取排行榜失败'
    });
  }
};
