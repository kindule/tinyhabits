const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DeckCard = sequelize.define('DeckCard', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        gameStateId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            field: 'game_state_id'
        },
        cardId: {
            type: DataTypes.STRING(64),
            allowNull: false,
            field: 'card_id'
        },
        name: {
            type: DataTypes.STRING(128),
            allowNull: false
        },
        desc: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        seconds: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0
        },
        difficulty: {
            type: DataTypes.TINYINT.UNSIGNED,
            defaultValue: 1,
            validate: { min: 1, max: 3 }
        },
        type: {
            type: DataTypes.ENUM('base', 'main', 'bonus'),
            allowNull: false
        },
        anchor: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        anchorEmoji: {
            type: DataTypes.STRING(32),
            allowNull: true,
            field: 'anchor_emoji'
        },
        wish: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    }, {
        tableName: 'deck_cards',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['game_state_id'] },
            { fields: ['type'] }
        ]
    });

    return DeckCard;
};
