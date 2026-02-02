const express = require('express');
const { sequelize } = require('../models');
const router = express.Router();

router.get('/', async (req, res) => {
    let dbStatus = 'disconnected';

    try {
        await sequelize.authenticate();
        dbStatus = 'connected';
    } catch (error) {
        dbStatus = 'disconnected';
    }

    const healthcheck = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        services: {
            database: dbStatus
        }
    };

    try {
        res.status(200).json(healthcheck);
    } catch (error) {
        healthcheck.status = 'error';
        healthcheck.error = error.message;
        res.status(503).json(healthcheck);
    }
});

module.exports = router;
