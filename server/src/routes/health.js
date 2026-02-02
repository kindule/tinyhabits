const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/', async (req, res) => {
    const healthcheck = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        services: {
            database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
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
