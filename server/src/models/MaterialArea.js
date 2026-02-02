const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MaterialArea = sequelize.define('MaterialArea', {
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
        materialId: {
            type: DataTypes.STRING(64),
            allowNull: false,
            field: 'material_id'
        },
        name: {
            type: DataTypes.STRING(128),
            allowNull: false
        },
        seconds: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0
        },
        difficulty: {
            type: DataTypes.TINYINT.UNSIGNED,
            defaultValue: 1
        },
        category: {
            type: DataTypes.STRING(64),
            allowNull: true
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
        isMerged: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_merged'
        },
        sourceA: {
            type: DataTypes.STRING(64),
            allowNull: true,
            field: 'source_a'
        },
        sourceB: {
            type: DataTypes.STRING(64),
            allowNull: true,
            field: 'source_b'
        }
    }, {
        tableName: 'material_area',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['game_state_id'] },
            { fields: ['category'] }
        ]
    });

    return MaterialArea;
};
