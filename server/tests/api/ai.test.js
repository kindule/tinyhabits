/**
 * API测试 - AI接口
 */

const request = require('supertest');
const app = require('../../src/app');

describe('AI API Endpoints', () => {

    describe('POST /api/ai/anchors', () => {
        it('应返回锚点建议', async () => {
            const res = await request(app)
                .post('/api/ai/anchors')
                .send({
                    behavior: { name: '喝水', category: 'health' },
                    context: { currentWish: '健康' }
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.anchors.length).toBeGreaterThan(0);
        });

        it('缺少behavior应返回400', async () => {
            const res = await request(app)
                .post('/api/ai/anchors')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('缺少behavior.name应返回400', async () => {
            const res = await request(app)
                .post('/api/ai/anchors')
                .send({ behavior: { category: 'health' } });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/ai/map', () => {
        it('应返回MAP评估结果', async () => {
            const res = await request(app)
                .post('/api/ai/map')
                .send({
                    deck: [
                        { name: '喝水', type: 'base', seconds: 30, anchor: '起床后' },
                        { name: '伸展', type: 'main', seconds: 60, anchor: '午休后' },
                        { name: '深呼吸', type: 'bonus', seconds: 20, anchor: '睡前' }
                    ]
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(['Pass', 'Warning', 'Fail']).toContain(res.body.overall);
            expect(res.body.scores).toBeDefined();
        });

        it('空卡组应返回Fail', async () => {
            const res = await request(app)
                .post('/api/ai/map')
                .send({ deck: [] });

            expect(res.status).toBe(200);
            expect(res.body.overall).toBe('Fail');
        });

        it('缺少deck应返回400', async () => {
            const res = await request(app)
                .post('/api/ai/map')
                .send({});

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/ai/dialogue', () => {
        it('应返回角色对话', async () => {
            const res = await request(app)
                .post('/api/ai/dialogue')
                .send({
                    character: 'arc',
                    scene: 'welcome'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.dialogue).toBeDefined();
            expect(typeof res.body.dialogue).toBe('string');
        });

        it('缺少character应返回400', async () => {
            const res = await request(app)
                .post('/api/ai/dialogue')
                .send({ scene: 'welcome' });

            expect(res.status).toBe(400);
        });

        it('缺少scene应返回400', async () => {
            const res = await request(app)
                .post('/api/ai/dialogue')
                .send({ character: 'arc' });

            expect(res.status).toBe(400);
        });
    });
});
