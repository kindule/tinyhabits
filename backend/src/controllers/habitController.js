const Habit = require('../models/Habit');
const User = require('../models/User');

// 获取所有习惯
exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({
      user: req.user._id,
      isActive: true
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: habits.length,
      data: habits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '获取习惯列表失败'
    });
  }
};

// 创建习惯
exports.createHabit = async (req, res) => {
  try {
    const { anchor, behavior } = req.body;

    if (!anchor || !behavior) {
      return res.status(400).json({
        success: false,
        message: '请提供完整的习惯信息'
      });
    }

    const habit = await Habit.create({
      user: req.user._id,
      anchor,
      behavior
    });

    res.status(201).json({
      success: true,
      message: '习惯创建成功',
      data: habit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '创建习惯失败'
    });
  }
};

// 完成习惯
exports.completeHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: '习惯不存在'
      });
    }

    const today = new Date().toDateString();

    // 检查今天是否已完成
    if (habit.lastCompleted === today) {
      return res.status(400).json({
        success: false,
        message: '今天已经完成过这个习惯了'
      });
    }

    // 更新习惯完成记录
    habit.completedCount += 1;
    habit.lastCompleted = today;
    habit.completionHistory.push({ date: today });

    await habit.save();

    // 更新用户游戏数据
    const user = await User.findById(req.user._id);
    const gameData = user.gameData;

    // 计算奖励分数
    const points = 10 + gameData.streak * 2;
    gameData.score += points;
    gameData.totalCompleted += 1;

    // 更新连续天数
    if (!gameData.lastCompletedDate || gameData.lastCompletedDate === today) {
      // 今天已经完成过其他习惯
    } else {
      const lastDate = new Date(gameData.lastCompletedDate);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastDate.toDateString() === yesterday.toDateString()) {
        gameData.streak += 1;
      } else {
        gameData.streak = 1;
      }
    }

    gameData.lastCompletedDate = today;

    // 更新最佳连续天数
    if (gameData.streak > gameData.bestStreak) {
      gameData.bestStreak = gameData.streak;
    }

    // 更新等级
    const levels = [
      { threshold: 0, name: '新手' },
      { threshold: 50, name: '学徒' },
      { threshold: 150, name: '熟练者' },
      { threshold: 300, name: '专家' },
      { threshold: 500, name: '大师' },
      { threshold: 1000, name: '宗师' }
    ];

    for (let i = levels.length - 1; i >= 0; i--) {
      if (gameData.score >= levels[i].threshold) {
        gameData.level = levels[i].name;
        break;
      }
    }

    user.gameData = gameData;
    await user.save();

    res.status(200).json({
      success: true,
      message: '习惯完成！',
      data: {
        habit,
        points,
        gameData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '完成习惯失败'
    });
  }
};

// 删除习惯
exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: '习惯不存在'
      });
    }

    // 软删除
    habit.isActive = false;
    await habit.save();

    res.status(200).json({
      success: true,
      message: '习惯已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '删除习惯失败'
    });
  }
};

// 获取单个习惯详情
exports.getHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: '习惯不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: habit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '获取习惯详情失败'
    });
  }
};
