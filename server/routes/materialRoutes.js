const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
// const { protect } = require('../middleware/auth'); // Uncomment if authentication middleware is used

// GET /api/projects/:projectId/materials
router.get('/project/:projectId/materials', materialController.getMaterialsForProject);

// POST /api/projects/:projectId/materials
router.post('/project/:projectId/materials', materialController.createMaterial);

// PATCH /api/materials/:id
router.patch('/materials/:id', materialController.updateMaterial);

// DELETE /api/materials/:id
router.delete('/materials/:id', materialController.deleteMaterial);

module.exports = router;