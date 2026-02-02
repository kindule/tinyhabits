const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        openId: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true,
            field: 'open_id'
        },
        unionId: {
            type: DataTypes.STRING(64),
            allowNull: true,
            field: 'union_id'
        },
        nickname: {
            type: DataTypes.STRING(32),
            allowNull: true
        },
        avatarUrl: {
            type: DataTypes.STRING(512),
            allowNull: true,
            field: 'avatar_url'
        },
        lastLoginAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'last_login_at'
        }
    }, {
        tableName: 'users',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['open_id'] },
            { fields: ['union_id'] },
            { fields: ['created_at'] }
        ]
    });

    // Static method: find or create by OpenID
    User.findOrCreateByOpenId = async function (openId, additionalData = {}) {
        const [user, created] = await this.findOrCreate({
            where: { openId },
            defaults: { openId, ...additionalData }
        });

        if (!created) {
            await user.update({ lastLoginAt: new Date() });
        }

        return user;
    };

    return User;
};
