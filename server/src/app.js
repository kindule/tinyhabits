const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config');

const app = express();

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
    origin: config.cors.origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求解析
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// 日志
if (config.env !== 'test') {
    app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
}

// API路由
app.use('/api', routes);

// 404处理
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`
    });
});

// 错误处理
app.use(errorHandler);

module.exports = app;
