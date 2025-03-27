const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// Public routes
// router.get('/', scheduleController.getSchedulesForProject);
router.get('/', scheduleController.getAllSchedules)
// Protected routes
router.post('/', scheduleController.createSchedule);
router.patch('/:scheduleId', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);
router.get('/:scheduleId', scheduleController.getScheduleById);

module.exports = router;


 
 