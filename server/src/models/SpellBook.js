const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SpellBook = sequelize.define('SpellBook', {
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
        spellName: {
            type: DataTypes.STRING(128),
            allowNull: false,
            field: 'spell_name'
        }
    }, {
        tableName: 'spell_book',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['game_state_id'] },
            {
                fields: ['game_state_id', 'spell_name'],
                unique: true
            }
        ]
    });

    return SpellBook;
};
