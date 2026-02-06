const { sequelize } = require('../models');

async function connectDatabase() {
    try {
        console.log('Attempting MySQL connection to:',
            `${sequelize.config.host}:${sequelize.config.port}/${sequelize.config.database} as ${sequelize.config.username}`);
        await sequelize.authenticate();
        console.log('MySQL connected successfully');

        // Sync models (create tables if not exist)
        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: true });
            console.log('Database synchronized');
        } else {
            console.log('Production mode: skipping sync, running sync({ force: false }) for table creation only');
            await sequelize.sync({ force: false });
            console.log('Database tables ensured');
        }
    } catch (error) {
        console.error('MySQL connection error:', error.message);
        console.error('Connection config:', {
            host: sequelize.config.host,
            port: sequelize.config.port,
            database: sequelize.config.database,
            username: sequelize.config.username
        });
        throw error;
    }
}

async function closeDatabaseConnection() {
    await sequelize.close();
}

module.exports = { connectDatabase, closeDatabaseConnection };
