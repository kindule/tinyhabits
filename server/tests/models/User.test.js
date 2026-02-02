const User = require('../../src/models/User');

describe('User Model', () => {
    it('should create a new user', async () => {
        const userData = {
            openId: 'test_openid_123',
            nickname: 'Test User'
        };

        const user = await User.create(userData);

        expect(user.openId).toBe(userData.openId);
        expect(user.nickname).toBe(userData.nickname);
        expect(user.createdAt).toBeDefined();
        expect(user.lastLoginAt).toBeDefined();
    });

    it('should fail when openId is missing', async () => {
        const userData = {
            nickname: 'Test User'
        };

        await expect(User.create(userData)).rejects.toThrow();
    });

    it('should find or create user by openId', async () => {
        const openId = 'test_find_create';

        // First time: Create
        const user1 = await User.findOrCreateByOpenId(openId, { nickname: 'New User' });
        expect(user1.openId).toBe(openId);
        expect(user1.nickname).toBe('New User');

        // Second time: Find
        const user2 = await User.findOrCreateByOpenId(openId);
        expect(user2._id).toEqual(user1._id);
        expect(user2.lastLoginAt.getTime()).toBeGreaterThanOrEqual(user1.lastLoginAt.getTime());
    });
});
