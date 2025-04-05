// server/models/Notification.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  recipientUser: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Confirmed 'User' model name from models/User.js
    required: true,
    index: true
  },
  senderUser: { // Optional: User who triggered the notification
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: [ // Add more types as needed
      'USER_ADDED_TO_PROJECT',
      'REPORT_SUBMITTED',
      'REPORT_APPROVED',
       'REPORT_UPDATED',
      'NEW_PROJECT_CREATED' // Example: For notifying admins/managers
    ]
  },
  message: {
    type: String,
    required: true
  },
  link: { // Optional: Frontend link to the relevant item
    type: String
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  projectId: { // Optional reference
    type: Schema.Types.ObjectId,
    ref: 'Project' // Confirmed 'Project' model name
  },
  reportId: { // Optional reference
    type: Schema.Types.ObjectId,
    ref: 'Report' // Confirmed 'Report' model name
  }
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

module.exports = mongoose.model('Notification', notificationSchema);