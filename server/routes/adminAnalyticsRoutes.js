// server/routes/adminAnalyticsRoutes.js
const express = require('express');
const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware'); // Correctly import the function

const router = express.Router();

// Apply authentication
//router.use(authMiddleware);

// --- CORRECTED USAGE ---
// Call the imported roleMiddleware function directly with the required role
//router.use(roleMiddleware('admin'));
// --- END CORRECTION ---

// Define the route for dashboard overview stats
router.get('/',authMiddleware,roleMiddleware('admin'), adminAnalyticsController.getDashboardStats);
router.get('/overview',authMiddleware,roleMiddleware('admin'), adminAnalyticsController.getDashboardOverviewStats);

// ... other routes

module.exports = router;