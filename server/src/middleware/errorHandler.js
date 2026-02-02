const config = require('../config');

function errorHandler(err, req, res, next) {
    console.error('Error:', err);

    // 默认错误
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Mongoose验证错误
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(e => e.message).join(', ');
    }

    // Mongoose重复键错误
    if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value';
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
