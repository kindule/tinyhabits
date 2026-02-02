const gameStateService = require('../../src/services/gameStateService');
const User = require('../../src/models/User');
const GameState = require('../../src/models/GameState');

describe('GameState Service', () => {
    const openId = 'service_test_user';

    beforeEach(async () => {
        await User.create({ openId });
        // Ensure GameState exists for tests that depend on it
        await gameStateService.getGameState(openId);
    });

    it('should get game state for valid user', async () => {
        const state = await gameStateService.getGameState(openId);
        expect(state).toBeDefined();
        expect(state.day).toBe(1);
    });

    it('should throw error for invalid user', async () => {
        await expect(gameStateService.getGameState('invalid_id'))
            .rejects.toThrow('User not found');
    });

    it('should complete daily task', async () => {
        const result = await gameStateService.completeDaily(openId, 'Test Task', 60);

        expect(result.success).toBe(true);
        expect(result.streak).toBe(1);

        const state = await gameStateService.getGameState(openId);
        expect(state.todayDone).toBe(true);
    });

    it('should not complete daily task twice', async () => {
        await gameStateService.completeDaily(openId, 'Task 1', 60);
        const result = await gameStateService.completeDaily(openId, 'Task 2', 60);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Already completed');
    });

    it('should sync state', async () => {
        const localState = {
            bestStreak: 10,
            totalScore: 500,
            spellBook: ['Fire', 'Ice']
        };

        const synced = await gameStateService.syncState(openId, localState);

        expect(synced.bestStreak).toBe(10);
        expect(synced.totalScore).toBe(500);
        expect(synced.spellBook).toContain('Fire');
        expect(synced.spellBook).toContain('Ice');
    });
});
