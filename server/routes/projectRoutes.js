const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middlewares/authMiddleware')

// Create new project
router.post('/', projectController.createProject,);

// Get all projects
router.get('/', projectController.getProjects);

// Get project by ID
router.get('/:id', projectController.getProject);

// Update project
router.put('/:id', projectController.updateProject);

// Delete project
router.delete('/:id',authMiddleware, projectController.deleteProject);



module.exports = router;