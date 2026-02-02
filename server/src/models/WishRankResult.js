const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const WishRankResult = sequelize.define('WishRankResult', {
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
        wishId: {
            type: DataTypes.STRING(64),
            allowNull: false,
            field: 'wish_id'
        },
        name: {
            type: DataTypes.STRING(128),
            allowNull: false
        },
        wins: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0
        },
        rank: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0
        }
    }, {
        tableName: 'wish_rank_results',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['game_state_id'] },
            {
                fields: ['game_state_id', 'wish_id'],
                unique: true
            }
        ]
    });

    return WishRankResult;
};
