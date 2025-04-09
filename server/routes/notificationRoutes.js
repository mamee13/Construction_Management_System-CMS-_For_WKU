// server/routes/notificationRoutes.js
const express = require('express');
const notificationController = require('../controllers/notificationController'); // Create this controller
const authMiddleware = require('../middlewares/authMiddleware'); // Assuming protect is your auth middleware

const router = express.Router();

// Protect all routes after this middleware
router.use(authMiddleware); // Use your actual authentication middleware function

router.route('/')
    .get(notificationController.getUserNotifications); // GET endpoint to fetch notifications

// Optional: Route to mark notifications as read
router.route('/:id/read')
    .patch(notificationController.markNotificationAsRead);

// Optional: Route to mark ALL as read
router.route('/readall')
    .patch(notificationController.markAllNotificationsAsRead);


module.exports = router;