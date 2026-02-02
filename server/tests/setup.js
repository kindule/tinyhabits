const { Sequelize } = require('sequelize');

let sequelize;

beforeAll(async () => {
    // 使用 SQLite 内存数据库进行测试
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false
    });

    // 同步所有模型
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    if (sequelize) {
        await sequelize.close();
    }
});

afterEach(async () => {
    // 清理所有表数据
    const models = Object.values(sequelize.models);
    for (const model of models) {
        await model.destroy({ where: {}, truncate: true });
    }
});

module.exports = { sequelize };
