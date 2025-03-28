// const express = require('express');
// const router = express.Router();
// const materialController = require('../controllers/materialController');
// // const { protect } = require('../middleware/auth'); // Uncomment if authentication middleware is used

// // GET /api/projects/:projectId/materials
// router.get('/project/:projectId/materials', materialController.getMaterialsForProject);

// // POST /api/projects/:projectId/materials
// router.post('/project/:projectId/materials', materialController.createMaterial);

// // PATCH /api/materials/:id
// router.patch('/materials/:id', materialController.updateMaterial);

// // DELETE /api/materials/:id
// router.delete('/materials/:id', materialController.deleteMaterial);

// module.exports = router;

const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const authMiddleware = require('../middlewares/authMiddleware')
// const { protect } = require('../middleware/auth'); // Add this back if/when you implement proper auth middleware

// --- Standard RESTful Material Routes ---

// GET /api/materials?project=:projectId - Get materials (filtered by project if query param exists)
// GET /api/materials - Get all materials (consider adding authorization)
router.get('/', materialController.getMaterials); // Renamed from getMaterialsForProject

// POST /api/materials - Create a new material (projectId must be in the body)
router.post('/', materialController.createMaterial);

// GET /api/materials/:id - Get a single material by its ID
router.get('/:id', materialController.getMaterialById); // Added this route

// PATCH /api/materials/:id - Update a material
router.patch('/:id', materialController.updateMaterial);

// DELETE /api/materials/:id - Delete a material
router.delete('/:id',authMiddleware, materialController.deleteMaterial);

module.exports = router;