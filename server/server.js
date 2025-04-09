// // backend/server.js
// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// const http = require('http'); // Import http
// const { Server } = require('socket.io'); // Import Server from socket.io
// const app = require('./app');


// dotenv.config({ path: './.env' });

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log("MongoDB connected"))
//   .catch(err => console.error(err));



//   // --- Socket.IO Integration START ---

// const server = http.createServer(app); // Create HTTP server from Express app

// const io = new Server(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || "http://localhost:3000", // Use env variable or default
//     methods: ["GET", "POST"]
//   }
// });

// // Make io accessible in controllers (important!)
// app.set('socketio', io);

// // --- Socket.IO Integration END ---


// // Start the server
// const PORT = process.env.PORT || 5000;

// // app.listen(PORT, () => {
// //   console.log(`Server running on port ${PORT}`);
// // });
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// // --- Socket.IO Connection Logic START ---
// io.on('connection', (socket) => {
//   console.log(`New client connected: ${socket.id}`);

//   // Get userId passed from frontend during connection
//   const userId = socket.handshake.query.userId;

//   if (userId) {
//     console.log(`User ${userId} associated with socket ${socket.id}`);
//     socket.join(`user_${userId}`); // Join room specific to the user
//   } else {
//     console.warn(`Socket ${socket.id} connected without userId`);
//   }

//   socket.on('disconnect', () => {
//     console.log(`Client disconnected: ${socket.id}`);
//     // No need to manually leave rooms, Socket.IO handles it on disconnect
//   });

//   // Optional: Listener to mark notifications as read
//   // socket.on('mark_notification_read', async (notificationId) => {
//   //   try {
//   //      const notification = await Notification.findByIdAndUpdate(notificationId, { isRead: true });
//   //      if (notification) {
//   //         console.log(`Notification ${notificationId} marked as read for user ${userId}`);
//   //         // Optionally emit back confirmation or updated unread count
//   //      }
//   //   } catch(err) {
//   //       console.error(`Error marking notification ${notificationId} as read:`, err);
//   //   }
//   // });

// });
// // --- Socket.IO Connection Logic END --

// backend/server.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron'); // Import node-cron
const app = require('./app');
const { checkAndNotifyUpcomingProjectEndDates } = require('./jobs/projectNotifierJob'); // Import the job function

dotenv.config({ path: './.env' });

// Connect to MongoDB (keep as is)
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error(err));

// --- Socket.IO Integration START (Keep as is) ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173", // Ensure this matches your frontend URL!
        methods: ["GET", "POST"]
    }
});
app.set('socketio', io);
// --- Socket.IO Integration END ---

// Start the server (Keep as is)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // --- Schedule Notification Job START ---
    // Schedule the job to run once daily (e.g., at 8:00 AM server time)
    // Cron syntax: second minute hour day-of-month month day-of-week
    // '0 8 * * *' means at minute 0 of hour 8, every day, every month, every day of the week
    cron.schedule('0 8 * * *', () => {
        console.log('Running scheduled job: Check Project End Dates');
        // Pass the io instance to the job function
        checkAndNotifyUpcomingProjectEndDates(io);
    }, {
        scheduled: true,
        timezone: "Africa/Addis_Ababa" // Set to your server's timezone (EAT for Ethiopia)
        // Find your timezone string from: https://momentjs.com/timezone/
    });
    console.log('Scheduled job "Check Project End Dates" is set to run daily at 8:00 AM EAT.');
    // --- Schedule Notification Job END ---

});

// --- Socket.IO Connection Logic START (Keep as is) ---
io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    const userId = socket.handshake.query.userId;
    if (userId) {
        console.log(`User ${userId} associated with socket ${socket.id}`);
        socket.join(`user_${userId}`);
    } else {
        console.warn(`Socket ${socket.id} connected without userId`);
    }
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
    // Optional mark as read listener...
});
// --- Socket.IO Connection Logic END ---

// Add unhandled rejection/exception handlers if they are here (keep as is)
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => { process.exit(1); });
});
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => { process.exit(1); }); // Ensure server.close() is used
});