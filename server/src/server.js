const app = require('./app');
const config = require('./config');
const { connectDatabase } = require('./config/database');

const PORT = config.port || 3000;

async function startServer() {
    console.log('========== SERVER STARTING ==========');
    console.log('Node version:', process.version);
    console.log('Working directory:', process.cwd());
    console.log('Config port:', PORT);
    console.log('Config env:', config.env);
    console.log('MySQL config:', JSON.stringify({
        host: config.mysql.host,
        port: config.mysql.port,
        database: config.mysql.database,
        username: config.mysql.username,
        password: config.mysql.password ? '***' : '(empty)'
    }));
    console.log('=====================================');

    try {
        // 连接数据库
        console.log('Connecting to database...');
        await connectDatabase();
        console.log('Database connected');

        // 启动服务
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on 0.0.0.0:${PORT}`);
            console.log(`Environment: ${config.env}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

// 捕获未处理的异常
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

startServer();
