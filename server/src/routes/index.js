const express = require('express');
const healthRoutes = require('./health');
const aiRoutes = require('./ai');
const userRoutes = require('./users');
const authRoutes = require('./auth');
const analyticsRoutes = require('./analytics');

const router = express.Router();

// 健康检查
router.use('/health', healthRoutes);

// AI接口
router.use('/ai', aiRoutes);

// 用户接口
router.use('/users', userRoutes);

// 认证接口
router.use('/auth', authRoutes);

// 埋点接口
router.use('/analytics', analyticsRoutes);

module.exports = router;
