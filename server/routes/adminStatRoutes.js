const express = require('express');
const dashboardStat = require('../controllers/adminDashboardController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Remove the duplicate .get() and fix the route definition
router.get('/stats', protect, dashboardStat.getAdminDashboardStats);

module.exports = router;