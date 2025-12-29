const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// 注册
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户是否已存在
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已被使用'
      });
    }

    // 创建用户
    const user = await User.create({
      username,
      email,
      password
    });

    // 生成 token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          gameData: user.gameData
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '注册失败'
    });
  }
};

// 登录
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供邮箱和密码'
      });
    }

    // 查找用户（包含密码字段）
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    // 验证密码
    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    // 生成 token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          gameData: user.gameData
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '登录失败'
    });
  }
};

// 获取当前用户信息
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          gameData: user.gameData,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '获取用户信息失败'
    });
  }
};

// 更新游戏数据
exports.updateGameData = async (req, res) => {
  try {
    const { gameData } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { gameData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: '游戏数据更新成功',
      data: {
        gameData: user.gameData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '更新游戏数据失败'
    });
  }
};
