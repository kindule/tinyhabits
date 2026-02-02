const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const GameState = sequelize.define('GameState', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        userId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            unique: true,
            field: 'user_id'
        },
        // Flow status
        day: {
            type: DataTypes.TINYINT.UNSIGNED,
            defaultValue: 1,
            validate: { min: 1, max: 7 }
        },
        hasRole: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'has_role'
        },
        hasWishRank: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'has_wish_rank'
        },
        hasDeck: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'has_deck'
        },
        todayDone: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'today_done'
        },
        lastDoneDate: {
            type: DataTypes.STRING(32),
            allowNull: true,
            field: 'last_done_date'
        },
        // Role data
        roleTalent: {
            type: DataTypes.ENUM('fire', 'tide', 'mason', 'wind'),
            allowNull: true,
            field: 'role_talent'
        },
        // Wish data
        currentWish: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'current_wish'
        },
        currentWishId: {
            type: DataTypes.STRING(64),
            allowNull: true,
            field: 'current_wish_id'
        },
        // Game stats
        streak: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0
        },
        bestStreak: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0,
            field: 'best_streak'
        },
        totalScore: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0,
            field: 'total_score'
        },
        // Metadata
        version: {
            type: DataTypes.STRING(16),
            defaultValue: '1.0'
        }
    }, {
        tableName: 'game_states',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['user_id'], unique: true },
            { fields: ['updated_at'] }
        ]
    });

    // Static method: get or create game state
    GameState.getOrCreate = async function (userId, include = []) {
        let state = await this.findOne({
            where: { userId },
            include
        });

        if (!state) {
            state = await this.create({ userId });
            // Initialize empty arrays for associations
            state.deck = [];
            state.history = [];
            state.wishRankResult = [];
            state.materialArea = [];
            state.spellBook = [];
        }

        return state;
    };

    return GameState;
};
