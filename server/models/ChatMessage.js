// server/models/ChatMessage.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatMessageSchema = new Schema({
  chatRoomId: {
    type: Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
    index: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  editedAt: {
    type: Date // Timestamp for when the message was last edited
  }
  // timestamp is handled by timestamps: true
}, 
{
  timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);