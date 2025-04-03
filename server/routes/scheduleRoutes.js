const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const protect = require('../middlewares/authMiddleware'); // Assuming correct path and export


// Simple role checking middleware
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
      // Assumes authMiddleware ran successfully and attached req.user
      if (!req.user || !req.user.role) {
           // Should be caught by authMiddleware, but defensive check
           return res.status(401).json({ success: false, message: 'Authentication required.' });
      }
  
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ // 403 Forbidden
          success: false,
          message: `Forbidden: Role '${req.user.role}' is not authorized for this resource.`
        });
      }
      next(); // Role is allowed
    };
  };
  
// Public routes
// router.get('/', scheduleController.getSchedulesForProject);
router.get('/', scheduleController.getAllSchedules)
// Protected routes
router.post('/',protect,checkRole('admin', 'consultant'), scheduleController.createSchedule);
router.patch('/:scheduleId',protect,checkRole('admin', 'consultant'), scheduleController.updateSchedule);
router.delete('/:id',protect,checkRole('admin', 'consultant'), scheduleController.deleteSchedule);
router.get('/:scheduleId',protect,checkRole('admin', 'consultant'), scheduleController.getScheduleById);

module.exports = router;


 
 