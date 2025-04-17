const express = require('express');
const cors = require('cors'); // Add this import
const app = express();
const path = require('path');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const commentRoutes = require('./routes/commentRoutes');
const materialRoutes = require('./routes/materialRoutes');
const taskRoutes = require('./routes/taskRoutes');

const scheduleRoutes = require('./routes/scheduleRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRouter = require('./routes/notificationRoutes'); // Import the new router
// const adminAnalyticsRouter = require('./routes/adminAnalyticsRoutes'); // Adjust path
const adminAnalyticsRouter = require('./routes/adminAnalyticsRoutes')
const chatRouter = require('./routes/chatRoutes'); // Adjust path if needed
// CORS middleware - MUST come BEFORE routes
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Your frontend URL
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'], // Include OPTIONS explicitly
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Add explicit OPTIONS handler for preflight requests
app.options('*', cors());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON bodies
app.use(express.json());



app.get('/', (req, res) => {
  res.send('API is running');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', commentRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRouter); // Mount the notification router
app.use('/api/admin-analytics/overview', adminAnalyticsRouter); // Mount the admin analytics router
// --- MOUNT CHAT ROUTER ---
app.use('/api/chats', chatRouter);
// 404 handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;