const express = require('express');
const { generateAnchors } = require('../services/anchorService');
const { evaluateMAP } = require('../services/mapService');
const { generateDialogue } = require('../services/dialogueService');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// AI接口限流
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1分钟
    max: 10, // 最多10次
    message: { success: false, error: 'Too many requests' }
});

/**
 * 生成锚点建议
 * POST /api/ai/anchors
 */
router.post('/anchors', aiLimiter, async (req, res, next) => {
    try {
        const { behavior, context } = req.body;

        if (!behavior || !behavior.name) {
            return res.status(400).json({
                success: false,
                error: 'Behavior name is required'
            });
        }

        const anchors = await generateAnchors(behavior, context || {});

        res.json({
            success: true,
            anchors,
            source: 'ai'
        });

    } catch (error) {
        next(error);
    }
});

/**
 * MAP评估
 * POST /api/ai/map
 */
router.post('/map', aiLimiter, async (req, res, next) => {
    try {
        const { deck } = req.body;

        if (!deck || !Array.isArray(deck)) {
            return res.status(400).json({
                success: false,
                error: 'Deck array is required'
            });
        }

        const result = await evaluateMAP(deck);

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 生成角色对话
 * POST /api/ai/dialogue
 */
router.post('/dialogue', aiLimiter, async (req, res, next) => {
    try {
        const { character, scene, context } = req.body;

        if (!character || !scene) {
            return res.status(400).json({
                success: false,
                error: 'Character and scene are required'
            });
        }

        const dialogue = await generateDialogue(character, scene, context || {});

        res.json({
            success: true,
            dialogue,
            character,
            scene
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
