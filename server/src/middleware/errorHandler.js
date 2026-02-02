const config = require('../config');

function errorHandler(err, req, res, next) {
    console.error('Error:', err);

    // 默认错误
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Sequelize 验证错误
    if (err.name === 'SequelizeValidationError') {
        statusCode = 400;
        message = err.errors.map(e => e.message).join(', ');
    }

    // Sequelize 唯一约束错误
    if (err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 400;
        message = 'Duplicate field value';
    }

    // Sequelize 数据库错误
    if (err.name === 'SequelizeDatabaseError') {
        statusCode = 500;
        message = 'Database error';
    }

    // JWT错误
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    const response = {
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    };

    // 开发环境返回堆栈
    if (config.env === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

module.exports = errorHandler;
