// // // // backend/server.js
// // // const mongoose = require('mongoose');
// // // const dotenv = require('dotenv');
// // // const http = require('http'); // Import http
// // // const { Server } = require('socket.io'); // Import Server from socket.io
// // // const app = require('./app');


// // // dotenv.config({ path: './.env' });

// // // // Connect to MongoDB
// // // mongoose.connect(process.env.MONGODB_URI)
// // //   .then(() => console.log("MongoDB connected"))
// // //   .catch(err => console.error(err));



// // //   // --- Socket.IO Integration START ---

// // // const server = http.createServer(app); // Create HTTP server from Express app

// // // const io = new Server(server, {
// // //   cors: {
// // //     origin: process.env.FRONTEND_URL || "http://localhost:3000", // Use env variable or default
// // //     methods: ["GET", "POST"]
// // //   }
// // // });

// // // // Make io accessible in controllers (important!)
// // // app.set('socketio', io);

// // // // --- Socket.IO Integration END ---


// // // // Start the server
// // // const PORT = process.env.PORT || 5000;

// // // // app.listen(PORT, () => {
// // // //   console.log(`Server running on port ${PORT}`);
// // // // });
// // // server.listen(PORT, () => {
// // //   console.log(`Server running on port ${PORT}`);
// // // });

// // // // --- Socket.IO Connection Logic START ---
// // // io.on('connection', (socket) => {
// // //   console.log(`New client connected: ${socket.id}`);

// // //   // Get userId passed from frontend during connection
// // //   const userId = socket.handshake.query.userId;

// // //   if (userId) {
// // //     console.log(`User ${userId} associated with socket ${socket.id}`);
// // //     socket.join(`user_${userId}`); // Join room specific to the user
// // //   } else {
// // //     console.warn(`Socket ${socket.id} connected without userId`);
// // //   }

// // //   socket.on('disconnect', () => {
// // //     console.log(`Client disconnected: ${socket.id}`);
// // //     // No need to manually leave rooms, Socket.IO handles it on disconnect
// // //   });

// // //   // Optional: Listener to mark notifications as read
// // //   // socket.on('mark_notification_read', async (notificationId) => {
// // //   //   try {
// // //   //      const notification = await Notification.findByIdAndUpdate(notificationId, { isRead: true });
// // //   //      if (notification) {
// // //   //         console.log(`Notification ${notificationId} marked as read for user ${userId}`);
// // //   //         // Optionally emit back confirmation or updated unread count
// // //   //      }
// // //   //   } catch(err) {
// // //   //       console.error(`Error marking notification ${notificationId} as read:`, err);
// // //   //   }
// // //   // });

// // // });
// // // // --- Socket.IO Connection Logic END --

// // // backend/server.js
// // const mongoose = require('mongoose');
// // const dotenv = require('dotenv');
// // const http = require('http');
// // const { Server } = require('socket.io');
// // const cron = require('node-cron'); // Import node-cron
// // const app = require('./app');
// // const { checkAndNotifyUpcomingProjectEndDates } = require('./jobs/projectNotifierJob'); // Import the job function

// // dotenv.config({ path: './.env' });

// // // Connect to MongoDB (keep as is)
// // mongoose.connect(process.env.MONGODB_URI)
// //     .then(() => console.log("MongoDB connected"))
// //     .catch(err => console.error(err));

// // // --- Socket.IO Integration START (Keep as is) ---
// // const server = http.createServer(app);
// // const io = new Server(server, {
// //     cors: {
// //         origin: process.env.FRONTEND_URL || "http://localhost:5173", // Ensure this matches your frontend URL!
// //         methods: ["GET", "POST"]
// //     }
// // });
// // app.set('socketio', io);
// // // --- Socket.IO Integration END ---

// // // Start the server (Keep as is)
// // const PORT = process.env.PORT || 5000;
// // server.listen(PORT, () => {
// //     console.log(`Server running on port ${PORT}`);

// //     // --- Schedule Notification Job START ---
// //     // Schedule the job to run once daily (e.g., at 8:00 AM server time)
// //     // Cron syntax: second minute hour day-of-month month day-of-week
// //     // '0 8 * * *' means at minute 0 of hour 8, every day, every month, every day of the week
// //     cron.schedule('0 8 * * *', () => {
// //         console.log('Running scheduled job: Check Project End Dates');
// //         // Pass the io instance to the job function
// //         checkAndNotifyUpcomingProjectEndDates(io);
// //     }, {
// //         scheduled: true,
// //         timezone: "Africa/Addis_Ababa" // Set to your server's timezone (EAT for Ethiopia)
// //         // Find your timezone string from: https://momentjs.com/timezone/
// //     });
// //     console.log('Scheduled job "Check Project End Dates" is set to run daily at 8:00 AM EAT.');
// //     // --- Schedule Notification Job END ---

// // });

// // // --- Socket.IO Connection Logic START (Keep as is) ---
// // io.on('connection', (socket) => {
// //     console.log(`New client connected: ${socket.id}`);
// //     const userId = socket.handshake.query.userId;
// //     if (userId) {
// //         console.log(`User ${userId} associated with socket ${socket.id}`);
// //         socket.join(`user_${userId}`);
// //     } else {
// //         console.warn(`Socket ${socket.id} connected without userId`);
// //     }
// //     socket.on('disconnect', () => {
// //         console.log(`Client disconnected: ${socket.id}`);
// //     });
// //     // Optional mark as read listener...
// // });
// // // --- Socket.IO Connection Logic END ---

// // // Add unhandled rejection/exception handlers if they are here (keep as is)
// // process.on('unhandledRejection', err => {
// //   console.log('UNHANDLED REJECTION! 💥 Shutting down...');
// //   console.log(err.name, err.message);
// //   server.close(() => { process.exit(1); });
// // });
// // process.on('uncaughtException', err => {
// //   console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
// //   console.log(err.name, err.message);
// //   server.close(() => { process.exit(1); }); // Ensure server.close() is used
// // });

// // server.js
// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// const http = require('http');
// const { Server } = require('socket.io');
// const cron = require('node-cron');
// const app = require('./app');
// const { checkAndNotifyUpcomingProjectEndDates } = require('./jobs/projectNotifierJob');
// // --- ADD Chat Models and User Model ---
// const ChatRoom = require('./models/ChatRoom');       // Adjust path
// const ChatMessage = require('./models/ChatMessage'); // Adjust path
// const User = require('./models/User');               // Adjust path
// const jwt = require('jsonwebtoken');                 // For decoding token if needed

// dotenv.config({ path: './.env' });

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI)
//     .then(() => console.log("MongoDB connected"))
//     .catch(err => console.error(err));

// // --- Socket.IO Integration ---
// const server = http.createServer(app);
// const io = new Server(server, {
//     cors: {
//         origin: process.env.FRONTEND_URL || "http://localhost:5173",
//         methods: ["GET", "POST"]
//     }
// });
// app.set('socketio', io);

// // --- Socket.IO Authentication Middleware (Example) ---
// // This middleware runs for every connecting socket BEFORE the 'connection' event
// io.use(async (socket, next) => {
//   const token = socket.handshake.auth?.token; // Look for token in handshake auth
//   const userIdFromQuery = socket.handshake.query?.userId; // Keep query param for backward compatibility?

//   if (token) {
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const user = await User.findById(decoded.id).select('firstName lastName email role _id'); // Fetch needed user details
//       if (user) {
//         socket.user = user; // Attach user object to the socket instance
//          console.log(`Socket Auth Success: User ${user._id} connected to socket ${socket.id}`);
//         return next();
//       } else {
//          console.log(`Socket Auth Failed: User ${decoded.id} not found.`);
//          return next(new Error('Authentication error: User not found'));
//       }
//     } catch (err) {
//       console.log(`Socket Auth Failed: Invalid token. Error: ${err.message}`);
//       return next(new Error('Authentication error: Invalid token'));
//     }
//   } else if (userIdFromQuery) {
//        // Fallback or alternate auth method using query param (less secure)
//        console.warn(`Socket ${socket.id} connected using query param userId (less secure): ${userIdFromQuery}`);
//        const user = await User.findById(userIdFromQuery).select('firstName lastName email role _id');
//        if (user) {
//            socket.user = user;
//            return next();
//        } else {
//             console.warn(`Socket Auth Failed (Query): User ${userIdFromQuery} not found.`);
//             return next(new Error('Authentication error: User not found'));
//        }
//   } else {
//     console.log(`Socket Auth Failed: No token or userId provided.`);
//     return next(new Error('Authentication error: No token provided'));
//   }
// });


// // --- Socket.IO Connection Logic ---
// io.on('connection', (socket) => {
//     // User is now authenticated via io.use() middleware and attached as socket.user
//     if (!socket.user) {
//         console.error(`CRITICAL: Socket ${socket.id} reached connection handler without socket.user object! Disconnecting.`);
//         socket.disconnect(true);
//         return;
//     }

//     // console.log(`User <span class="math-inline">\{socket\.user\.\_id\} \(</span>{socket.user.email}) connected with socket ${socket.id}`);
//       console.log(`User ${socket.user._id} (${socket.user.email}) connected with socket ${socket.id}`);
//     // Join a personal room for potential direct notifications (like in notificationHelper)
//     socket.join(`user_${socket.user._id}`);
//     console.log(`User ${socket.user._id} joined personal room: user_${socket.user._id}`);

//     // console.log(`User <span class="math-inline">\{socket\.user\.\_id\} joined personal room\: user\_</span>${socket.user._id}`);


//     // --- CHAT EVENT LISTENERS ---

//     // Listen for client joining a specific project chat room
//     socket.on('joinRoom', async (roomId) => {
//         try {
//             if (!mongoose.Types.ObjectId.isValid(roomId)) {
//                  console.log(`User ${socket.user._id} attempted to join invalid room ID: ${roomId}`);
//                 // Optionally emit an error back to the client
//                 // socket.emit('chatError', { message: 'Invalid room ID format.' });
//                 return;
//             }

//             // Verify user is a member of this room before joining
//             const room = await ChatRoom.findOne({ _id: roomId, members: socket.user._id }).lean(); // Use lean for read-only check
//             if (room) {
//                 socket.join(roomId);
//                 console.log(`User ${socket.user._id} joined chat room: ${roomId}`);
//                 // Optionally emit a confirmation or room details back to the client
//                 // socket.emit('joinedRoom', { roomId: roomId, name: room.name });
//             } else {
//                 console.warn(`User ${socket.user._id} failed to join room ${roomId}: Not a member.`);
//                  // Optionally emit an error back to the client
//                 // socket.emit('chatError', { message: `You are not a member of room ${roomId}.` });
//             }
//         } catch (error) {
//             console.error(`Error joining room ${roomId} for user ${socket.user._id}:`, error);
//              // Optionally emit an error back to the client
//             // socket.emit('chatError', { message: 'Server error joining room.' });
//         }
//     });

//     // Listen for client leaving a room
//     socket.on('leaveRoom', (roomId) => {
//          if (!mongoose.Types.ObjectId.isValid(roomId)) return; // Ignore invalid IDs
//         socket.leave(roomId);
//         console.log(`User ${socket.user._id} left chat room: ${roomId}`);
//     });

//     // Listen for incoming chat messages
//     socket.on('chatMessage', async (data) => {
//         const { roomId, content } = data;

//         // Validate input
//         if (!roomId || !content || !mongoose.Types.ObjectId.isValid(roomId)) {
//             console.log(`User ${socket.user._id} sent invalid message data:`, data);
//             // socket.emit('chatError', { message: 'Invalid message data (roomId and content required).' });
//             return;
//         }

//         try {
//             // Verify user is a member of the room they are sending to
//             const room = await ChatRoom.findOne({ _id: roomId, members: socket.user._id }).lean();
//             if (!room) {
//                 console.warn(`User ${socket.user._id} attempted to send message to room ${roomId} they are not in.`);
//                  // socket.emit('chatError', { message: 'You cannot send messages to this room.' });
//                 return;
//             }

//             // Save the message to the database
//             const newMessage = await ChatMessage.create({
//                 chatRoomId: roomId,
//                 sender: socket.user._id,
//                 content: content.trim() // Trim whitespace
//             });

//             // Populate sender details for broadcasting
//             const populatedMessage = await ChatMessage.findById(newMessage._id)
//                                                     .populate('sender', 'firstName lastName email _id')
//                                                     .lean(); // Use lean

//             // Broadcast the new message to ALL users in that specific room
//             io.to(roomId).emit('newMessage', populatedMessage);
//             console.log(`User ${socket.user._id} sent message to room <span class="math-inline">\{roomId\}\: "</span>{content.substring(0, 30)}..."`);

//         } catch (error) {
//             console.error(`Error handling chatMessage from user ${socket.user._id} for room ${roomId}:`, error);
//             // Optionally emit an error back to the sender
//             // socket.emit('chatError', { message: 'Error sending message.' });
//         }
//     });

//     // --- END CHAT LISTENERS ---

//     socket.on('disconnect', () => {
//         console.log(`User ${socket.user?._id || 'Unknown'} disconnected from socket ${socket.id}`);
//         // Socket.IO automatically handles leaving rooms on disconnect
//     });
// });

// // Start the server and schedule jobs
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//     // Schedule Notification Job (existing)
//     cron.schedule('0 8 * * *', () => {
//          console.log('Running scheduled job: Check Project End Dates');
//          checkAndNotifyUpcomingProjectEndDates(io);
//     }, { scheduled: true, timezone: "Africa/Addis_Ababa" });
//      console.log('Scheduled job "Check Project End Dates" is set to run daily at 8:00 AM EAT.');
// });

// // Unhandled Rejection/Exception handlers (existing)
// process.on('unhandledRejection', err => {
//   // ... (existing handler) ...
//    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
//     console.log(err.name, err.message);
//     server.close(() => { process.exit(1); });
// });
// process.on('uncaughtException', err => {
//   // ... (existing handler) ...
//   console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
//     console.log(err.name, err.message);
//     server.close(() => { process.exit(1); });
// });

// server.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const app = require('./app');
const { checkAndNotifyUpcomingProjectEndDates } = require('./jobs/projectNotifierJob');
const ChatRoom = require('./models/ChatRoom');
const ChatMessage = require('./models/ChatMessage');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

dotenv.config({ path: './.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error(err));

// Socket.IO Integration
const server = http.createServer(app);
const io = new Server(server, { /* ... cors options ... */
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});
app.set('socketio', io);

// Socket.IO Authentication Middleware (Existing - IMPORTANT!)
io.use(async (socket, next) => {
    // ... (Keep your existing io.use auth logic here) ...
     const token = socket.handshake.auth?.token;
    const userIdFromQuery = socket.handshake.query?.userId;

    if (token) {
        try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('firstName lastName email role _id');
        if (user) {
            socket.user = user;
            console.log(`Socket Auth Success: User ${user._id} connected to socket ${socket.id}`);
            return next();
        } else {
            console.log(`Socket Auth Failed: User ${decoded.id} not found.`);
            return next(new Error('Authentication error: User not found'));
        }
        } catch (err) {
        console.log(`Socket Auth Failed: Invalid token. Error: ${err.message}`);
        return next(new Error('Authentication error: Invalid token'));
        }
    } else if (userIdFromQuery) {
        console.warn(`Socket ${socket.id} connected using query param userId (less secure): ${userIdFromQuery}`);
        const user = await User.findById(userIdFromQuery).select('firstName lastName email role _id');
        if (user) {
            socket.user = user;
            return next();
        } else {
            console.warn(`Socket Auth Failed (Query): User ${userIdFromQuery} not found.`);
            return next(new Error('Authentication error: User not found'));
        }
    } else {
        console.log(`Socket Auth Failed: No token or userId provided.`);
        return next(new Error('Authentication error: No token provided'));
    }
});


// Socket.IO Connection Logic
io.on('connection', (socket) => {
    if (!socket.user) {
        socket.disconnect(true);
        return;
    }
    const socketUserId = socket.user._id; // Convenience variable

    // console.log(`User <span class="math-inline">\{socketUserId\} \(</span>{socket.user.email}) connected with socket ${socket.id}`);
    // socket.join(`user_${socketUserId}`);
    // console.log(`User <span class="math-inline">\{socketUserId\} joined personal room\: user\_</span>{socketUserId}`);
        console.log(`User ${socket.user._id} (${socket.user.email}) connected with socket ${socket.id}`);
        // Join a personal room for potential direct notifications (like in notificationHelper)
        socket.join(`user_${socket.user._id}`);
        console.log(`User ${socket.user._id} joined personal room: user_${socket.user._id}`);
    // --- CHAT EVENT LISTENERS ---

    // Join Room (Existing)
    socket.on('joinRoom', async (roomId) => {
         // ... (Existing join room logic) ...
        try {
            if (!mongoose.Types.ObjectId.isValid(roomId)) {
                console.log(`User ${socketUserId} attempted to join invalid room ID: ${roomId}`);
                return;
            }
            const room = await ChatRoom.findOne({ _id: roomId, members: socketUserId }).lean();
            if (room) {
                socket.join(roomId);
                console.log(`User ${socketUserId} joined chat room: ${roomId}`);
            } else {
                console.warn(`User ${socketUserId} failed to join room ${roomId}: Not a member.`);
            }
        } catch (error) {
            console.error(`Error joining room ${roomId} for user ${socketUserId}:`, error);
        }
    });

    // Leave Room (Existing)
    socket.on('leaveRoom', (roomId) => {
         if (!mongoose.Types.ObjectId.isValid(roomId)) return;
        socket.leave(roomId);
        console.log(`User ${socketUserId} left chat room: ${roomId}`);
    });

    // Handle Incoming Messages (Existing - This is for SENDING)
    socket.on('chatMessage', async (data) => {
         // ... (Existing message saving and broadcasting logic) ...
           const { roomId, content } = data;
        if (!roomId || !content || !mongoose.Types.ObjectId.isValid(roomId)) {
            console.log(`User ${socketUserId} sent invalid message data:`, data);
            return;
        }
        try {
            const room = await ChatRoom.findOne({ _id: roomId, members: socketUserId }).lean();
            if (!room) {
                console.warn(`User ${socketUserId} attempted to send message to room ${roomId} they are not in.`);
                return;
            }
            const newMessage = await ChatMessage.create({
                chatRoomId: roomId,
                sender: socketUserId,
                content: content.trim()
            });
            const populatedMessage = await ChatMessage.findById(newMessage._id)
                                                    .populate('sender', 'firstName lastName email _id')
                                                    .lean();
            io.to(roomId).emit('newMessage', populatedMessage);
            console.log(`User ${socketUserId} sent message to room <span class="math-inline">\{roomId\}\: "</span>{content.substring(0, 30)}..."`);
        } catch (error) {
            console.error(`Error handling chatMessage from user ${socketUserId} for room ${roomId}:`, error);
        }
    });

    // --- NEW: Handle Message Edit ---
    socket.on('editMessage', async (data) => {
        const { messageId, newContent } = data;

        // Validate
        if (!messageId || !newContent || !mongoose.Types.ObjectId.isValid(messageId) || newContent.trim().length === 0) {
            console.log(`User ${socketUserId} sent invalid edit data:`, data);
            socket.emit('chatError', { message: 'Invalid data for editing message.' }); // Inform sender
            return;
        }

        try {
            // Find the message to ensure it exists and get room ID
            const message = await ChatMessage.findById(messageId);
            if (!message) {
                console.warn(`User ${socketUserId} tried to edit non-existent message ${messageId}`);
                socket.emit('chatError', { message: 'Cannot edit message: Not found.' });
                return;
            }

            // Authorization: Only sender can edit
            if (!message.sender.equals(socketUserId)) {
                console.warn(`User ${socketUserId} tried to edit message ${messageId} they didn't send.`);
                socket.emit('chatError', { message: 'You cannot edit this message.' });
                return;
            }

            // Perform the update
            message.content = newContent.trim();
            message.editedAt = new Date();
            await message.save();

            // Fetch necessary details for broadcast (or construct payload)
            const updatePayload = {
                _id: message._id.toString(), // Or messageId
                chatRoomId: message.chatRoomId.toString(),
                content: message.content,
                editedAt: message.editedAt,
                // Optionally include sender ID if needed by frontend logic
                sender: message.sender.toString()
            };


            // Broadcast the update to everyone in the room
            io.to(message.chatRoomId.toString()).emit('messageUpdated', updatePayload);
            console.log(`User ${socketUserId} edited message ${messageId} in room ${message.chatRoomId}`);

        } catch (error) {
            console.error(`Error editing message ${messageId} by user ${socketUserId}:`, error);
            socket.emit('chatError', { message: 'Error editing message.' });
        }
    });

    // --- NEW: Handle Message Delete ---
    socket.on('deleteMessage', async (data) => {
         const { messageId } = data;

         // Validate
         if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
            console.log(`User ${socketUserId} sent invalid delete data:`, data);
            socket.emit('chatError', { message: 'Invalid message ID for deletion.' });
            return;
        }

        try {
             // Find the message to verify ownership and get room ID
            const message = await ChatMessage.findById(messageId);
            if (!message) {
                console.warn(`User ${socketUserId} tried to delete non-existent message ${messageId}`);
                // Don't necessarily error back, maybe it was already deleted
                return;
            }

             // Authorization: Only sender can delete (or admins later)
            if (!message.sender.equals(socketUserId)) {
                console.warn(`User ${socketUserId} tried to delete message ${messageId} they didn't send.`);
                socket.emit('chatError', { message: 'You cannot delete this message.' });
                return;
            }

            const chatRoomId = message.chatRoomId.toString(); // Get room ID before deleting

            // Perform deletion
            await ChatMessage.findByIdAndDelete(messageId);

             // Broadcast the deletion event to everyone in the room
            const deletePayload = {
                messageId: messageId, // Send the ID of the deleted message
                chatRoomId: chatRoomId
             };
            io.to(chatRoomId).emit('messageDeleted', deletePayload);
            console.log(`User ${socketUserId} deleted message ${messageId} from room ${chatRoomId}`);

        } catch (error) {
             console.error(`Error deleting message ${messageId} by user ${socketUserId}:`, error);
             socket.emit('chatError', { message: 'Error deleting message.' });
        }
    });

    // --- END CHAT LISTENERS ---

    socket.on('disconnect', () => {
        // ... (Existing disconnect logic) ...
        console.log(`User ${socketUserId || 'Unknown'} disconnected from socket ${socket.id}`);
    });
});

// Start Server & Jobs (Existing)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    // ... (Existing startup logs and cron job scheduling) ...
       console.log(`Server running on port ${PORT}`);
        cron.schedule('0 8 * * *', () => {
            console.log('Running scheduled job: Check Project End Dates');
            checkAndNotifyUpcomingProjectEndDates(io);
        }, { scheduled: true, timezone: "Africa/Addis_Ababa" });
        console.log('Scheduled job "Check Project End Dates" is set to run daily at 8:00 AM EAT.');
});

// // Unhandled Rejection/Exception handlers (existing)
process.on('unhandledRejection', err => {
  // ... (existing handler) ...
   console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => { process.exit(1); });
});
process.on('uncaughtException', err => {
  // ... (existing handler) ...
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => { process.exit(1); });
});