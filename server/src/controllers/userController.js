const gameStateService = require('../services/gameStateService');

exports.getGameState = async (req, res, next) => {
    try {
        const state = await gameStateService.getGameState(req.params.openId);
        res.json({ success: true, data: state });
    } catch (error) {
        // Treat 'User not found' as 404
        if (error.message === 'User not found') {
            error.statusCode = 404;
        }
        next(error);
    }
};

exports.updateGameState = async (req, res, next) => {
    try {
        const state = await gameStateService.updateGameState(req.params.openId, req.body);
        res.json({ success: true, data: state });
    } catch (error) {
        next(error);
    }
};

exports.completeDaily = async (req, res, next) => {
    try {
        const { cardName, seconds } = req.body;
        const result = await gameStateService.completeDaily(req.params.openId, cardName, seconds);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.resetCycle = async (req, res, next) => {
    try {
        const { keepWish } = req.body;
        const state = await gameStateService.resetCycle(req.params.openId, keepWish);
        res.json({ success: true, data: state });
    } catch (error) {
        next(error);
    }
};

exports.syncState = async (req, res, next) => {
    try {
        const state = await gameStateService.syncState(req.params.openId, req.body);
        res.json({ success: true, data: state });
    } catch (error) {
        next(error);
    }
};
