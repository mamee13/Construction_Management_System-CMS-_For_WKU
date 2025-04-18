// // server/controllers/chatController.js
// const ChatRoom = require('../models/ChatRoom');
// const ChatMessage = require('../models/ChatMessage');
// const catchAsync = require('../utils/CatchAsync');
// const AppError = require('../utils/AppError');
// const mongoose = require('mongoose');

// // Get all chat rooms the logged-in user is a member of
// exports.getMyChatRooms = catchAsync(async (req, res, next) => {
//   const userId = req.user._id; // From authMiddleware
//   console.log('User ID:', userId);
//   const chatRooms = await ChatRoom.find({ members: userId })
//     .populate('projectId', 'projectName status') // Populate project name/status
//     // .populate('members', 'firstName lastName email') // Optional: Populate member details if needed for display
//     .sort({ updatedAt: -1 }); // Sort by last activity (approximated by updatedAt)

//   res.status(200).json({
//     status: 'success',
//     results: chatRooms.length,
//     data: {
//       chatRooms
//     }
//   });
// });

// // Get messages for a specific chat room (with pagination)
// exports.getMessagesForRoom = catchAsync(async (req, res, next) => {
//   const { roomId } = req.params;
//   const userId = req.user._id;

//   if (!mongoose.Types.ObjectId.isValid(roomId)) {
//     return next(new AppError('Invalid chat room ID', 400));
//   }

//   // 1. Verify the user is a member of the room
//   const room = await ChatRoom.findOne({ _id: roomId, members: userId });
//   if (!room) {
//     return next(new AppError('Chat room not found or you are not a member', 404));
//   }

//   // 2. Fetch messages (implement pagination)
//   const page = parseInt(req.query.page, 10) || 1;
//   const limit = parseInt(req.query.limit, 10) || 50; // Default 50 messages per page
//   const skip = (page - 1) * limit;

//   const messages = await ChatMessage.find({ chatRoomId: roomId })
//     .populate('sender', 'firstName lastName email role _id') // Populate sender details
//     .sort({ createdAt: -1 }) // Fetch newest messages first (for typical chat display)
//     .skip(skip)
//     .limit(limit);

//   // Optional: Get total message count for pagination headers/info
//   const totalMessages = await ChatMessage.countDocuments({ chatRoomId: roomId });

//   res.status(200).json({
//     status: 'success',
//     results: messages.length,
//     totalMessages, // Optional total count
//     page,          // Optional current page
//     limit,         // Optional limit used
//     data: {
//       // Reverse messages for typical UI display (oldest at top, newest at bottom)
//       messages: messages.reverse()
//     }
//   });
// });

// // Note: Saving messages will be handled directly via Socket.IO listener for real-time

// server/controllers/chatController.js
const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const catchAsync = require('../utils/CatchAsync');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// Get all chat rooms the logged-in user is a member of (Existing)
exports.getMyChatRooms = catchAsync(async (req, res, next) => {
  const userId = req.user._id; // From authMiddleware
  const chatRooms = await ChatRoom.find({ members: userId })
    .populate('projectId', 'projectName status')
    .sort({ updatedAt: -1 });

  res.status(200).json({
    status: 'success',
    results: chatRooms.length,
    data: {
      chatRooms
    }
  });
});

// Get messages for a specific chat room (with pagination) (Existing)
exports.getMessagesForRoom = catchAsync(async (req, res, next) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    return next(new AppError('Invalid chat room ID', 400));
  }

  const room = await ChatRoom.findOne({ _id: roomId, members: userId });
  if (!room) {
    return next(new AppError('Chat room not found or you are not a member', 404));
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const messages = await ChatMessage.find({ chatRoomId: roomId })
    .populate('sender', 'firstName lastName email role _id')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalMessages = await ChatMessage.countDocuments({ chatRoomId: roomId });

  res.status(200).json({
    status: 'success',
    results: messages.length,
    totalMessages,
    page,
    limit,
    data: {
      messages: messages.reverse()
    }
  });
});

// --- NEW: Edit a specific message (REST endpoint) ---
exports.editMessage = catchAsync(async (req, res, next) => {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id; // From authMiddleware

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return next(new AppError('Invalid message ID', 400));
    }
    if (!content || content.trim().length === 0) {
        return next(new AppError('Message content cannot be empty', 400));
    }

    const message = await ChatMessage.findById(messageId);

    if (!message) {
        return next(new AppError('Message not found', 404));
    }

    // Authorization: Only the sender can edit their message
    if (!message.sender.equals(userId)) {
        return next(new AppError('You are not authorized to edit this message', 403));
    }

    // Prevent editing very old messages? (Optional business rule)
    // const maxEditAge = 15 * 60 * 1000; // 15 minutes
    // if (Date.now() - message.createdAt.getTime() > maxEditAge) {
    //     return next(new AppError('Messages can only be edited for a short period', 403));
    // }

    message.content = content.trim();
    message.editedAt = new Date(); // Mark as edited
    await message.save();

    // Note: Real-time update should be handled via Socket.IO emission
    // This REST response is mainly for confirmation or non-realtime scenarios

    const populatedMessage = await ChatMessage.findById(message._id)
                                    .populate('sender', 'firstName lastName email _id')
                                    .lean();

    res.status(200).json({
        status: 'success',
        message: 'Message updated successfully',
        data: {
            message: populatedMessage
        }
    });
});

// --- NEW: Delete a specific message (REST endpoint) ---
exports.deleteMessage = catchAsync(async (req, res, next) => {
    const { messageId } = req.params;
    const userId = req.user._id; // From authMiddleware

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return next(new AppError('Invalid message ID', 400));
    }

    const message = await ChatMessage.findById(messageId);

    if (!message) {
        // Idempotency: If already deleted, return success or 404?
        // Let's return 404 for clarity if not found initially.
        return next(new AppError('Message not found', 404));
    }

    // Authorization: Only the sender can delete their message
    // (Expand later for Admin/Moderator deletion if needed)
    if (!message.sender.equals(userId)) {
        return next(new AppError('You are not authorized to delete this message', 403));
    }

    // Perform the deletion
    await ChatMessage.findByIdAndDelete(messageId);

    // Note: Real-time update should be handled via Socket.IO emission

    res.status(204).json({ // 204 No Content is standard for successful DELETE
        status: 'success',
        data: null
    });
});


exports.sendMessage = catchAsync(async (req, res, next) => {
  const { roomId } = req.params;
  const { content } = req.body;
  const userId = req.user._id; // From authMiddleware

  // --- Validation ---
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    return next(new AppError('Invalid chat room ID', 400));
  }
  if (!content || content.trim().length === 0) {
    return next(new AppError('Message content cannot be empty', 400));
  }
  if (content.length > 2000) { // Optional: Limit message length
    return next(new AppError('Message content is too long (max 2000 characters)', 400));
  }

  // --- Authorization: Verify user is a member of the room ---
  // We need to check this BEFORE saving the message
  const room = await ChatRoom.findOne({ _id: roomId, members: userId });
  if (!room) {
    // User is not found OR not a member of this room
    return next(new AppError('Cannot send message: Chat room not found or you are not a member', 403)); // 403 Forbidden is appropriate here
  }

  // --- Create and Save Message ---
  const newMessage = await ChatMessage.create({
    chatRoomId: roomId,
    sender: userId,
    content: content.trim(), // Save trimmed content
  });

  // --- Update Room's Last Activity Time ---
  // This helps in sorting rooms by recent activity
  await ChatRoom.findByIdAndUpdate(roomId, { updatedAt: new Date() });

  // --- Populate Sender Info for Response ---
  // We need to populate the sender details before sending back to the frontend
  const populatedMessage = await ChatMessage.findById(newMessage._id)
                                    .populate('sender', 'firstName lastName email _id') // Select fields needed by frontend
                                    .lean(); // Use lean for plain JS object

  // --- TODO: Emit message via Socket.IO to other room members ---
  // Example: req.io.to(roomId).emit('newMessage', populatedMessage);
  // This requires Socket.IO setup integrated with Express

  // --- Respond to the sender ---
  res.status(201).json({ // 201 Created is standard for successful POST
    status: 'success',
    data: {
      message: populatedMessage
    }
  });
});