const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '请提供用户名'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符']
  },
  email: {
    type: String,
    required: [true, '请提供邮箱'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, '请提供有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '请提供密码'],
    minlength: [6, '密码至少6个字符'],
    select: false
  },
  gameData: {
    score: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    level: { type: String, default: '新手' },
    totalCompleted: { type: Number, default: 0 },
    lastCompletedDate: { type: String, default: null },
    achievements: [{ type: String }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 验证密码方法
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
