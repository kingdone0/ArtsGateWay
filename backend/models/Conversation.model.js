const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'blocked', 'deleted'],
    default: 'active'
  }
}, { timestamps: true });

ConversationSchema.pre('save', function(next) {
  if (this.participants && this.participants.length === 2) {
    this.participants.sort((a, b) => a.toString().localeCompare(b.toString()));
  }
  next();
});

ConversationSchema.index({ participants: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', ConversationSchema);