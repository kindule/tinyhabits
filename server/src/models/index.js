const { Sequelize } = require('sequelize');
const config = require('../config');

// Initialize Sequelize
const sequelize = new Sequelize(
    config.mysql.database,
    config.mysql.username,
    config.mysql.password,
    {
        host: config.mysql.host,
        port: config.mysql.port,
        dialect: 'mysql',
        logging: config.env === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true
        }
    }
);

// Import model definitions
const UserModel = require('./User');
const GameStateModel = require('./GameState');
const DeckCardModel = require('./DeckCard');
const HistoryRecordModel = require('./HistoryRecord');
const WishRankResultModel = require('./WishRankResult');
const MaterialAreaModel = require('./MaterialArea');
const SpellBookModel = require('./SpellBook');

// Initialize models
const User = UserModel(sequelize);
const GameState = GameStateModel(sequelize);
const DeckCard = DeckCardModel(sequelize);
const HistoryRecord = HistoryRecordModel(sequelize);
const WishRankResult = WishRankResultModel(sequelize);
const MaterialArea = MaterialAreaModel(sequelize);
const SpellBook = SpellBookModel(sequelize);

// Define associations
User.hasOne(GameState, { foreignKey: 'userId', as: 'gameState', onDelete: 'CASCADE' });
GameState.belongsTo(User, { foreignKey: 'userId' });

GameState.hasMany(DeckCard, { foreignKey: 'gameStateId', as: 'deck', onDelete: 'CASCADE' });
DeckCard.belongsTo(GameState, { foreignKey: 'gameStateId' });

GameState.hasMany(HistoryRecord, { foreignKey: 'gameStateId', as: 'history', onDelete: 'CASCADE' });
HistoryRecord.belongsTo(GameState, { foreignKey: 'gameStateId' });

GameState.hasMany(WishRankResult, { foreignKey: 'gameStateId', as: 'wishRankResult', onDelete: 'CASCADE' });
WishRankResult.belongsTo(GameState, { foreignKey: 'gameStateId' });

GameState.hasMany(MaterialArea, { foreignKey: 'gameStateId', as: 'materialArea', onDelete: 'CASCADE' });
MaterialArea.belongsTo(GameState, { foreignKey: 'gameStateId' });

GameState.hasMany(SpellBook, { foreignKey: 'gameStateId', as: 'spellBook', onDelete: 'CASCADE' });
SpellBook.belongsTo(GameState, { foreignKey: 'gameStateId' });

module.exports = {
    sequelize,
    User,
    GameState,
    DeckCard,
    HistoryRecord,
    WishRankResult,
    MaterialArea,
    SpellBook
};
