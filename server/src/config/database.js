const { sequelize } = require('../models');

async function connectDatabase() {
    try {
        await sequelize.authenticate();
        console.log('MySQL connected successfully');

        // Sync models (create tables if not exist)
        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: true });
            console.log('Database synchronized');
        }
    } catch (error) {
        console.error('MySQL connection error:', error);
        throw error;
    }
}

async function closeDatabaseConnection() {
    await sequelize.close();
}

module.exports = { connectDatabase, closeDatabaseConnection };
