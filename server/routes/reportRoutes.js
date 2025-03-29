// routes/reportRoutes.js
const express = require('express');
const {
    createReport,
    getReports,
    getReportById,
    // deleteReport // Optional: Add if needed
} = require('../controllers/reportController');

// Import Authentication Middleware (verifies token, sets req.user)
const protect = require('../middlewares/authMiddleware'); // Assuming correct path and export

// Import NEW Authorization Middleware (checks req.user.role)
const authorize = require('../middlewares/roleMiddleware'); // Make sure path is correct

const router = express.Router();

// 1. Apply Authentication to ALL report routes first
router.use(protect);

// --- Define Routes ---

// 2. POST /api/reports - Create a new report
//    - 'protect' runs.
//    - THEN 'authorize' runs, checking against the specified roles.
//    - THEN 'createReport' runs if authorized.
router.post(
    '/',
    authorize('admin', 'contractor', 'consultant', 'project_manager'), // Use the new middleware
    createReport
);

// 3. GET /api/reports - Get reports (filtered)
//    - 'protect' runs.
//    - 'getReports' runs. (Authorization handled inside controller)
router.get('/', getReports);

// 4. GET /api/reports/:id - Get a single report by ID
//    - 'protect' runs.
//    - 'getReportById' runs. (Authorization handled inside controller)
router.get('/:id', getReportById);

// 5. DELETE /api/reports/:id - Delete a report (Optional - Uncomment if needed)
//    - 'protect' runs.
//    - THEN 'authorize' runs (e.g., only admin).
//    - THEN 'deleteReport' runs if authorized.
// router.delete(
//     '/:id',
//     authorize('admin'), // Example: only allow admin role
//     deleteReport
// );

module.exports = router;