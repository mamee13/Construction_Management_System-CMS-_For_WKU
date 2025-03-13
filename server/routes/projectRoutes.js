const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// Create new project
router.post('/', projectController.createProject,);

// Get all projects
router.get('/', projectController.getProjects);

// Get project by ID
router.get('/:id', projectController.getProject);

// Delete project
router.delete('/:id', projectController.deleteProject);

module.exports = router;