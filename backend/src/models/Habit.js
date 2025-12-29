const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  anchor: {
    type: String,
    required: [true, '请提供锚点'],
    trim: true,
    maxlength: [20, '锚点最多20个字符']
  },
  behavior: {
    type: String,
    required: [true, '请提供行为'],
    trim: true,
    maxlength: [30, '行为最多30个字符']
  },
  createdDate: {
    type: String,
    default: () => new Date().toLocaleDateString('zh-CN')
  },
  completedCount: {
    type: Number,
    default: 0
  },
  lastCompleted: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  completionHistory: [{
    date: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// 索引优化查询
habitSchema.index({ user: 1, isActive: 1 });
habitSchema.index({ user: 1, lastCompleted: 1 });

module.exports = mongoose.model('Habit', habitSchema);
