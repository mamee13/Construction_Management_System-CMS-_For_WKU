const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Create task
router.post('/', taskController.createTask);

// Get all tasks
router.get('/', taskController.getTasks);

// Get a single task by ID
router.get('/:id', taskController.getTaskById);

// Update task
router.patch('/:id', taskController.updateTask);

// Delete task
router.delete('/:id', taskController.deleteTask);

module.exports = router;