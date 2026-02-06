const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * JWT认证中间件
 * 从Authorization header中提取token，验证后将openId挂载到req.openId
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Missing or invalid token' });
    }

    const token = authHeader.slice(7);
    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.userId = decoded.userId;
        req.openId = decoded.openId;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
}

module.exports = authMiddleware;
