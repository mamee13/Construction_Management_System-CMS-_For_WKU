// server/models/ChatRoom.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatRoomSchema = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true, // Each project should have only one chat room
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }]
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index members for faster lookup of user's rooms
chatRoomSchema.index({ members: 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);