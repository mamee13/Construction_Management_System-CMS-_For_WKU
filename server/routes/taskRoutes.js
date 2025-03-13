const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Public routes
router.get('/project/:projectId/tasks', taskController.getTasksForProject);

// Protected routes
router.post('/project/:projectId/tasks', taskController.createTask);
router.patch('/tasks/:id', taskController.updateTask);
router.delete('/tasks/:id', taskController.deleteTask);

module.exports = router;