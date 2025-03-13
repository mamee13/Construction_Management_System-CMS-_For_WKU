const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// Public routes
router.get('/project/:projectId/schedules', scheduleController.getSchedulesForProject);

// Protected routes
router.post('/project/:projectId/schedules', scheduleController.createSchedule);
router.patch('/schedules/:id', scheduleController.updateSchedule);
router.delete('/schedules/:id', scheduleController.deleteSchedule);

module.exports = router;


 
 