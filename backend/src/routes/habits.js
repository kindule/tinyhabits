const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getHabits,
  createHabit,
  getHabit,
  completeHabit,
  deleteHabit
} = require('../controllers/habitController');

// 所有路由都需要认证
router.use(protect);

// 习惯 CRUD
router.route('/')
  .get(getHabits)
  .post(createHabit);

router.route('/:id')
  .get(getHabit)
  .delete(deleteHabit);

// 完成习惯
router.post('/:id/complete', completeHabit);

module.exports = router;
