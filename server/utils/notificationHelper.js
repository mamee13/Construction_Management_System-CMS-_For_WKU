// server/utils/notificationHelper.js
const Notification = require('../models/Notification');

/**
 * Creates a notification document in the DB and emits a socket event.
 * @param {object} io - The Socket.IO server instance.
 * @param {string} recipientUserId - The ID of the user to notify.
 * @param {object} notificationData - Data for the notification document.
 * @param {string} [notificationData.senderUser] - ID of the user triggering the event.
 * @param {string} notificationData.type - The notification type (enum value).
 * @param {string} notificationData.message - The notification message.
 * S@param {string} [notificationData.link] - Optional frontend link.
 * @param {string} [notificationData.projectId] - Optional related project ID.
 * @param {string} [notificationData.reportId] - Optional related report ID.
 */
async function createAndEmitNotification(io, recipientUserId, notificationData) {
  try {
    // Ensure recipientUserId is provided
    if (!recipientUserId) {
      console.warn('Attempted to send notification without recipientUserId:', notificationData);
      return;
    }

    const notification = new Notification({
      recipientUser: recipientUserId,
      ...notificationData // Spread the rest of the data
    });
    await notification.save();

    // Populate senderUser if needed before emitting (optional, good for frontend display)
    // const populatedNotification = await Notification.findById(notification._id).populate('senderUser', 'name'); // Example
    // io.to(`user_${recipientUserId}`).emit('new_notification', populatedNotification);

    // Emit only to the specific user's room
    io.to(`user_${recipientUserId}`).emit('new_notification', notification);

    console.log(`Notification sent to user ${recipientUserId} (Type: ${notificationData.type})`);

  } catch (error) {
    console.error(`Error creating/emitting notification for user ${recipientUserId}:`, error);
    // Decide if you need more robust error handling here
  }
}

module.exports = { createAndEmitNotification };