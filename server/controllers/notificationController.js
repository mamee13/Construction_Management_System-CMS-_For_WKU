// server/controllers/notificationController.js
const Notification = require('../models/Notification');
const catchAsync = require('../utils/CatchAsync');
const AppError = require('../utils/AppError');

exports.getUserNotifications = catchAsync(async (req, res, next) => {
    // Get notifications for the logged-in user, sorted newest first
    // Optionally add filters like isRead: false
    const notifications = await Notification.find({ recipientUser: req.user._id }) // Use req.user._id or req.user.id
        .sort({ createdAt: -1 }) // Sort newest first
        .limit(50); // Limit the number fetched initially if desired

    // Optionally calculate unread count separately
    const unreadCount = await Notification.countDocuments({
        recipientUser: req.user._id, // Use req.user._id or req.user.id
        isRead: false
    });

    res.status(200).json({
        status: 'success',
        unreadCount: unreadCount, // Send unread count
        results: notifications.length,
        data: {
            notifications: notifications
        }
    });
});

// Optional: Mark single notification as read
exports.markNotificationAsRead = catchAsync(async (req, res, next) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipientUser: req.user._id }, // Ensure user owns the notification
        { isRead: true },
        { new: true } // Return the updated document
    );

    if (!notification) {
        return next(new AppError('Notification not found or user unauthorized', 404));
    }

    // You could emit an event back via SocketIO to update counts across tabs if needed
    // const io = req.app.get('socketio');
    // if(io) { io.to(`user_${req.user._id}`).emit('notification_read_update', { unreadCount: newCount }); }

    res.status(200).json({
        status: 'success',
        data: {
            notification: notification
        }
    });
});

// Optional: Mark all notifications as read
exports.markAllNotificationsAsRead = catchAsync(async (req, res, next) => {
    await Notification.updateMany(
        { recipientUser: req.user._id, isRead: false }, // Find unread notifications for the user
        { isRead: true }
    );

    // You could emit an event back via SocketIO to update counts across tabs if needed
    // const io = req.app.get('socketio');
    // if(io) { io.to(`user_${req.user._id}`).emit('notification_read_update', { unreadCount: 0 }); }


    res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read.'
    });
});