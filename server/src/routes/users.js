const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// === Token-based routes (openId from JWT) ===
// 将req.openId映射到req.params.openId，复用已有controller
function injectOpenId(req, res, next) {
    req.params.openId = req.openId;
    next();
}

router.get('/state', authMiddleware, injectOpenId, userController.getGameState);
router.put('/state', authMiddleware, injectOpenId, userController.updateGameState);
router.post('/complete', authMiddleware, injectOpenId, userController.completeDaily);
router.post('/reset', authMiddleware, injectOpenId, userController.resetCycle);
router.post('/sync', authMiddleware, injectOpenId, userController.syncState);

// === Legacy routes (openId in URL) ===
router.get('/:openId/state', userController.getGameState);
router.put('/:openId/state', userController.updateGameState);
router.post('/:openId/complete', userController.completeDaily);
router.post('/:openId/reset', userController.resetCycle);
router.post('/:openId/sync', userController.syncState);

module.exports = router;
