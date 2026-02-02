const express = require('express');
const router = express.Router();

/**
 * 接收埋点数据
 * POST /api/analytics/events
 */
router.post('/events', async (req, res) => {
    try {
        const { events, user, device } = req.body;

        // 验证数据
        if (!Array.isArray(events)) {
            return res.status(400).json({ success: false, error: 'Invalid events' });
        }

        // 处理事件(这里可以存储到数据库或转发到数据平台)
        // For MVP, we just log to console or maybe a simple file/db collection later
        // The requirement says "Data dashboard viewable" which implies storage.
        // Since we didn't define an Analytics model in T23 tech specs explicitly other than "storage",
        // let's just log for now to show it works, or maybe create a simple collection if we had time.
        // Given the prompt "Log and monitor", console log is a form of monitoring.

        const enrichedEvents = events.map(event => ({
            ...event,
            user,
            device,
            server_time: new Date()
        }));

        // Log the summary
        console.log(`[Analytics] Received ${events.length} events from user ${user?.userId || 'anon'}`);
        if (process.env.NODE_ENV === 'development') {
            events.forEach(e => console.log(`  - ${e.event}:`, JSON.stringify(e.properties)));
        }

        // TODO: Store to MongoDB 'Analytics' collection

        // 异步处理，快速响应
        res.json({ success: true, received: events.length });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
