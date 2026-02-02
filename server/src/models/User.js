const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // 微信OpenID(唯一标识)
    openId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // 微信UnionID(可选,用于多平台)
    unionId: {
        type: String,
        sparse: true
    },

    // 昵称(可选展示)
    nickname: {
        type: String,
        trim: true,
        maxlength: 32
    },

    // 头像URL
    avatarUrl: {
        type: String
    },

    // 游戏状态(内嵌文档)
    gameState: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GameState'
    },

    // 元数据
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLoginAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 索引
userSchema.index({ createdAt: -1 });

// 静态方法: 通过OpenID查找或创建
userSchema.statics.findOrCreateByOpenId = async function (openId, additionalData = {}) {
    let user = await this.findOne({ openId });

    if (!user) {
        user = await this.create({
            openId,
            ...additionalData
        });
    } else {
        // 更新最后登录时间
        user.lastLoginAt = new Date();
        await user.save();
    }

    return user;
};

module.exports = mongoose.model('User', userSchema);
