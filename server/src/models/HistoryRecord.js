const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const HistoryRecord = sequelize.define('HistoryRecord', {
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
        date: {
            type: DataTypes.STRING(32),
            allowNull: false
        },
        cardName: {
            type: DataTypes.STRING(128),
            allowNull: false,
            field: 'card_name'
        },
        seconds: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0
        }
    }, {
        tableName: 'history_records',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['game_state_id'] },
            { fields: ['date'] }
        ]
    });

    return HistoryRecord;
};
