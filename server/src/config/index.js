require('dotenv').config();

// 解析 MYSQL_ADDRESS（云托管格式: host:port）
function parseMysqlAddress() {
    const address = process.env.MYSQL_ADDRESS;
    if (address) {
        const [host, port] = address.split(':');
        return { host, port: parseInt(port, 10) || 3306 };
    }
    return {
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT, 10) || 3306
    };
}

const mysqlAddr = parseMysqlAddress();

// 启动时打印环境变量，帮助定位云托管配置问题
console.log('========== ENV DEBUG ==========');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MYSQL_ADDRESS:', process.env.MYSQL_ADDRESS || '(未设置)');
console.log('MYSQL_HOST (resolved):', mysqlAddr.host);
console.log('MYSQL_PORT (resolved):', mysqlAddr.port);
console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE || '(未设置, 将使用默认值 tinyhabits)');
console.log('MYSQL_USERNAME:', process.env.MYSQL_USERNAME || process.env.MYSQL_USER || '(未设置, 将使用默认值 root)');
console.log('MYSQL_PASSWORD:', process.env.MYSQL_PASSWORD ? '******(已设置)' : '(未设置, 将使用默认值)');
console.log('PORT:', process.env.PORT || '(未设置, 将使用默认值 3000)');
console.log('================================');

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,

    // MySQL
    mysql: {
        host: mysqlAddr.host,
        port: mysqlAddr.port,
        database: process.env.MYSQL_DATABASE || 'tinyhabits',
        username: process.env.MYSQL_USERNAME || process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'letsg0123'
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },

    // 微信小程序
    wechat: {
        appId: process.env.WECHAT_APP_ID || '',
        appSecret: process.env.WECHAT_APP_SECRET || ''
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
