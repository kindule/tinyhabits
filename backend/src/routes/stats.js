const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getStats,
  getAchievements,
  getCompletionHistory,
  getLeaderboard
} = require('../controllers/statsController');

// 所有路由都需要认证
router.use(protect);

router.get('/', getStats);
router.get('/achievements', getAchievements);
router.get('/history', getCompletionHistory);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
