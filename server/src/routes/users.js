const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 获取游戏状态
router.get('/:openId/state', userController.getGameState);

// 更新游戏状态
router.put('/:openId/state', userController.updateGameState);

// 完成每日任务
router.post('/:openId/complete', userController.completeDaily);

// 重置周期
router.post('/:openId/reset', userController.resetCycle);

// 同步状态
router.post('/:openId/sync', userController.syncState);

module.exports = router;
