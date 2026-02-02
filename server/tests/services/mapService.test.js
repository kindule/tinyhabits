const mapService = require('../../src/services/mapService');

// Mock ChatOpenAI for AI evaluation
jest.mock('@langchain/openai', () => {
    return {
        ChatOpenAI: jest.fn().mockImplementation(() => ({
            invoke: jest.fn().mockResolvedValue({
                content: JSON.stringify({
                    scores: { motivation: 5, ability: 5, prompt: 5 },
                    overall: 'Pass',
                    feedback: 'Great deck!',
                    suggestions: []
                })
            })
        }))
    };
});

describe('MAP Service', () => {
    const goodDeck = [
        { name: 'Drink water', type: 'base', seconds: 30, anchor: 'After waking up' },
        { name: 'Stretch', type: 'main', seconds: 120, anchor: 'After coffee' },
        { name: 'Smile', type: 'bonus', seconds: 5, anchor: 'Before mirror' }
    ];

    const badDeck = [];

    it('should pass local evaluation for good deck', async () => {
        const result = mapService.localEvaluate(goodDeck);

        // We expect ability score to be decent around 3 or more if no penalties
        expect(result.overall).not.toBe('Fail');
        expect(result.issues).toHaveLength(0);
    });

    it('should fail local evaluation for empty deck', async () => {
        const result = mapService.localEvaluate(badDeck);
        expect(result.overall).toBe('Fail');
        expect(result.scores.motivation).toBe(0);
    });

    it('should detect missing base card', async () => {
        const noBaseDeck = [
            { name: 'Stretch', type: 'main', seconds: 120, anchor: 'After coffee' }
        ];
        const result = mapService.localEvaluate(noBaseDeck);
        expect(result.issues).toContain('缺少保底卡');
    });

    it('should detect missing anchors', async () => {
        const noAnchorDeck = [
            { name: 'Drink water', type: 'base', seconds: 30, anchor: '' }
        ];
        const result = mapService.localEvaluate(noAnchorDeck);
        expect(result.scores.prompt).toBeLessThan(3);
    });

    it('should evaluate MAP using AI (or fallback)', async () => {
        // Similar to anchor service, we mostly check if it returns a valid structure
        const result = await mapService.evaluateMAP(goodDeck);
        expect(result).toHaveProperty('overall');
        expect(result).toHaveProperty('scores');
        expect(result.scores).toHaveProperty('motivation');
    });
});
