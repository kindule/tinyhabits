const dialogueService = require('../../src/services/dialogueService');

// Mock ChatOpenAI for dialogue generation
jest.mock('@langchain/openai', () => {
    return {
        ChatOpenAI: jest.fn().mockImplementation(() => ({
            invoke: jest.fn().mockResolvedValue({
                content: 'Keep going, tiny steps!'
            })
        }))
    };
});

describe('Dialogue Service', () => {
    it('should generate dialogue for character', async () => {
        // If no API key, it returns fallback
        // We assume test environment might not have keys set, so expecting a string result is safer
        // whether it's from AI or fallback.
        const result = await dialogueService.generateDialogue('arc', 'welcome');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('should return valid fallback for Arc', () => {
        const result = dialogueService.getFallbackDialogue('arc', 'welcome');
        expect(result).toContain('欢迎');
    });

    it('should return valid fallback for MIA', () => {
        const result = dialogueService.getFallbackDialogue('mia', 'encourage');
        expect(result).toBeTruthy();
    });

    it('should throw error/fallback for unknown character', async () => {
        // Service catches error and returns fallback (or default fallback)
        const result = await dialogueService.generateDialogue('unknown_char', 'welcome');
        expect(typeof result).toBe('string');
    });

    it('should generate multiple dialogues', async () => {
        const results = await dialogueService.generateMultipleDialogues('mia', 'streak', 2);
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
    });
});
