require('dotenv').config();

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,

    // MongoDB
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tinyhabits'
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },

    // AI服务
    ai: {
        deepseekApiKey: process.env.DEEPSEEK_API_KEY,
        doubaoApiKey: process.env.DOUBAO_API_KEY,
        timeout: parseInt(process.env.AI_TIMEOUT, 10) || 10000
    },

    // CORS
    cors: {
        origins: process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',')
            : ['http://localhost:*']
    },

    // Rate Limit
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 60000,
        max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100
    }
};
