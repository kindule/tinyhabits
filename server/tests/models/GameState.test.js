const GameState = require('../../src/models/GameState');
const User = require('../../src/models/User');

describe('GameState Model', () => {
    let user;

    beforeEach(async () => {
        user = await User.create({ openId: 'gamestate_test_user' });
    });

    it('should create a game state for user', async () => {
        const state = await GameState.create({ userId: user._id });

        expect(state.userId).toEqual(user._id);
        expect(state.day).toBe(1);
        expect(state.streak).toBe(0);
    });

    it('should complete today task and update stats', async () => {
        const state = await GameState.create({ userId: user._id });

        state.completeToday('Drink Water', 30);

        expect(state.todayDone).toBe(true);
        expect(state.streak).toBe(1);
        expect(state.totalScore).toBe(10);
        expect(state.history).toHaveLength(1);
        expect(state.spellBook).toContain('Drink Water');
    });

    it('should increment streak correctly', async () => {
        const state = await GameState.create({ userId: user._id });

        // Day 1
        state.completeToday('Task 1', 30);
        expect(state.streak).toBe(1);

        // Simulate yesterday
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        state.lastDoneDate = yesterday.toDateString();

        // Day 2 (today)
        state.todayDone = false; // Reset for new day
        state.completeToday('Task 2', 30);
        expect(state.streak).toBe(2);
    });

    it('should reset streak if missed a day', async () => {
        const state = await GameState.create({ userId: user._id });

        // Simulate 2 days ago
        const now = new Date();
        const twoDaysAgo = new Date(now);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        state.lastDoneDate = twoDaysAgo.toDateString();
        state.streak = 5;

        state.completeToday('Task', 30);
        expect(state.streak).toBe(1);
    });

    it('should get or create game state', async () => {
        const state1 = await GameState.getOrCreate(user._id);
        expect(state1.userId).toEqual(user._id);

        const state2 = await GameState.getOrCreate(user._id);
        expect(state2._id).toEqual(state1._id);
    });
});
