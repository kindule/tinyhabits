/**
 * API测试 - 健康检查
 */

const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/health', () => {
    it('应返回健康状态', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    it('应包含时间戳', async () => {
        const res = await request(app).get('/api/health');
        expect(res.body.timestamp).toBeDefined();
    });
});
