const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateGameData
} = require('../controllers/authController');

// 公开路由
router.post('/register', register);
router.post('/login', login);

// 受保护路由（需要认证）
router.get('/me', protect, getMe);
router.put('/gamedata', protect, updateGameData);

module.exports = router;
