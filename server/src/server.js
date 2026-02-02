const app = require('./app');
const config = require('./config');
const { connectDatabase } = require('./config/database');

const PORT = config.port || 3000;

async function startServer() {
    try {
        // 连接数据库
        await connectDatabase();
        console.log('✅ Database connected');

        // 启动服务
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Environment: ${config.env}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
