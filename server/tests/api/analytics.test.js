/**
 * API测试 - 埋点接口
 */

const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/analytics/events', () => {
    it('应成功接收事件', async () => {
        const res = await request(app)
            .post('/api/analytics/events')
            .send({
                events: [
                    { event: 'page_view', properties: { page_path: '/pages/daily/index' } },
                    { event: 'button_click', properties: { button_id: 'start' } }
                ],
                user: { userId: 'test123' },
                device: { platform: 'ios' }
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.received).toBe(2);
    });

    it('空事件数组应成功', async () => {
        const res = await request(app)
            .post('/api/analytics/events')
            .send({
                events: [],
                user: {},
                device: {}
            });

        expect(res.status).toBe(200);
        expect(res.body.received).toBe(0);
    });

    it('无效events格式应返回400', async () => {
        const res = await request(app)
            .post('/api/analytics/events')
            .send({
                events: 'not_an_array'
            });

        expect(res.status).toBe(400);
    });
});
