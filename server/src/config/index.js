require('dotenv').config();

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,

    // MySQL
    mysql: {
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
        database: process.env.MYSQL_DATABASE || 'tinyhabits',
        username: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'letsg0123'
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
