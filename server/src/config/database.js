const mongoose = require('mongoose');
const config = require('./index');

async function connectDatabase() {
    try {
        await mongoose.connect(config.mongodb.uri);
        console.log(`MongoDB connected: ${config.mongodb.uri}`);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

module.exports = { connectDatabase };
