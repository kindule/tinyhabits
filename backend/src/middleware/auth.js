const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 生成 JWT Token
exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// 验证 Token 中间件
exports.protect = async (req, res, next) => {
  let token;

  // 从 Authorization header 获取 token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未授权，请先登录'
    });
  }

  try {
    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 获取用户信息（不包含密码）
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token 无效或已过期'
    });
  }
};
