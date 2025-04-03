// const express = require('express');
// const router = express.Router();
// const projectController = require('../controllers/projectController');
// const authMiddleware = require('../middlewares/authMiddleware')

// // Create new project
// router.post('/', projectController.createProject,);

// // Get all projects
// router.get('/', projectController.getProjects);

// // Get project by ID
// router.get('/:id', projectController.getProject);

// // Update project
// router.put('/:id',projectController.isAdminMiddleware, projectController.updateProject);

// // Delete project
// router.delete('/:id',projectController.isAdminMiddleware, projectController.deleteProject);
// router.get('/my-assignments', authMiddleware, projectController.getMyAssignedProjects);

// router.get('/consultant/:consultantId', authMiddleware, projectController.getProjectsByConsultantId);

// module.exports = router;

const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
// Assuming authMiddleware is your 'protect' middleware or similar
const authMiddleware = require('../middlewares/authMiddleware');
// Assuming isAdminMiddleware is correctly defined in projectController for now
// It might be better in its own middleware file, but leave as is for now if it works elsewhere

// --- Specific Routes First ---

// Get MY assigned projects
// Needs auth to know who "my" is
router.get('/my-assignments', authMiddleware, projectController.getMyAssignedProjects);

// Get projects for a specific consultant
// Needs auth to potentially restrict access
router.get('/consultant/:consultantId', authMiddleware, projectController.getProjectsByConsultantId);

// --- General Routes Later ---

// Get all projects (No ID)
router.get('/', projectController.getProjects);

// Create new project (No ID in path)
// Apply admin check middleware HERE if needed, not just inside controller logic
// router.post('/', authMiddleware, projectController.isAdminMiddleware, projectController.createProject);
// OR if createProject checks admin internally:
router.post('/', authMiddleware, projectController.createProject); // Assuming createProject internally checks role or uses isAdminMiddleware


// --- Parameterized Routes Last ---

// Get project by SPECIFIC ID
// Consider if this needs authMiddleware too for non-public projects
router.get('/:id', projectController.getProject);

// Update project by ID (Needs Admin)
// Apply middlewares before the controller
router.put('/:id', authMiddleware, projectController.isAdminMiddleware, projectController.updateProject);

// Delete project by ID (Needs Admin)
// Apply middlewares before the controller
router.delete('/:id', authMiddleware, projectController.isAdminMiddleware, projectController.deleteProject);


module.exports = router;