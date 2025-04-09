// // routes/reportRoutes.js
// const express = require('express');
// const {
//     createReport,
//     getReports,
//     getReportById,
//     updateReport,
//     deleteReport,
//     getMyReports
//     // deleteReport // Optional: Add if needed
// } = require('../controllers/reportController');
// const { uploadReportAttachments } = require('../middlewares/uploadMiddleware');


// // Import Authentication Middleware (verifies token, sets req.user)
// const protect = require('../middlewares/authMiddleware'); // Assuming correct path and export

// // Import NEW Authorization Middleware (checks req.user.role)
// const authorize = require('../middlewares/roleMiddleware'); // Make sure path is correct

// const router = express.Router();

// // 1. Apply Authentication to ALL report routes first
// router.use(protect);

// // --- Define Routes ---



// // 2. POST /api/reports - Create a new report
// //    - 'protect' runs.
// //    - THEN 'authorize' runs, checking against the specified roles.
// //    - THEN 'createReport' runs if authorized.
// router.post(
//     '/',
//     authorize('admin', 'contractor', 'consultant', 'project_manager'), // Use the new middleware
//     uploadReportAttachments,
//     createReport
// );
//   // Place it before '/:id' routes to avoid conflicts
// router.get('/my-reports', protect, getMyReports);
// // 3. GET /api/reports - Get reports (filtered)
// //    - 'protect' runs.
// //    - 'getReports' runs. (Authorization handled inside controller)
// router.get('/', getReports);

// // 4. GET /api/reports/:id - Get a single report by ID
// //    - 'protect' runs.
// //    - 'getReportById' runs. (Authorization handled inside controller)
// router.get('/:id',protect, getReportById);


// router.put('/:id', authorize('admin'),updateReport)
// // 5. DELETE /api/reports/:id - Delete a report (Optional - Uncomment if needed)
// //    - 'protect' runs.
// //    - THEN 'authorize' runs (e.g., only admin).
// //    - THEN 'deleteReport' runs if authorized.
// // router.delete(
// //     '/:id',
// //     authorize('admin'), // Example: only allow admin role
// //     deleteReport
// // );
// router.delete('/:id', authorize('admin'), deleteReport);

// module.exports = router;

const express = require('express');
const {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  getMyReports
} = require('../controllers/reportController');
const { uploadReportAttachments } = require('../middlewares/uploadMiddleware');

// Authentication Middleware (verifies token, sets req.user)
const protect = require('../middlewares/authMiddleware');

// Authorization Middleware (checks req.user.role)
const authorize = require('../middlewares/roleMiddleware');

const router = express.Router();

// Apply authentication to all report routes
router.use(protect);

// POST /api/reports - Create a new report with authorization, file upload, and creation
router.post(
  '/',
  authorize('admin', 'contractor', 'consultant', 'project_manager'),
  uploadReportAttachments,
  createReport
);

// GET /api/reports/my-reports - Get authenticated user's reports
router.get('/my-reports', getMyReports);

// GET /api/reports - Get reports
router.get('/', getReports);

// GET /api/reports/:id - Get a single report by ID
router.get('/:id', getReportById);

// PUT /api/reports/:id - Update a report (admin only)
router.put('/:id', authorize('admin'), updateReport);

// DELETE /api/reports/:id - Delete a report (admin only)
router.delete('/:id', authorize('admin'), deleteReport);

module.exports = router;
