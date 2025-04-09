// // const express = require('express');
// // const router = express.Router();
// // const materialController = require('../controllers/materialController');
// // // const { protect } = require('../middleware/auth'); // Uncomment if authentication middleware is used

// // // GET /api/projects/:projectId/materials
// // router.get('/project/:projectId/materials', materialController.getMaterialsForProject);

// // // POST /api/projects/:projectId/materials
// // router.post('/project/:projectId/materials', materialController.createMaterial);

// // // PATCH /api/materials/:id
// // router.patch('/materials/:id', materialController.updateMaterial);

// // // DELETE /api/materials/:id
// // router.delete('/materials/:id', materialController.deleteMaterial);

// // module.exports = router;

// const express = require('express');
// const router = express.Router();
// const materialController = require('../controllers/materialController');
// const authMiddleware = require('../middlewares/authMiddleware')
// // const { protect } = require('../middleware/auth'); // Add this back if/when you implement proper auth middleware

// // --- Standard RESTful Material Routes ---

// // GET /api/materials?project=:projectId - Get materials (filtered by project if query param exists)
// // GET /api/materials - Get all materials (consider adding authorization)
// router.get('/',authMiddleware, materialController.getMaterials); // Renamed from getMaterialsForProject

// // POST /api/materials - Create a new material (projectId must be in the body)
// router.post('/', materialController.createMaterial);

// // GET /api/materials/:id - Get a single material by its ID
// router.get('/:id', materialController.getMaterialById); // Added this route

// // PATCH /api/materials/:id - Update a material
// router.patch('/:id', materialController.updateMaterial);

// // DELETE /api/materials/:id - Delete a material
// router.delete('/:id',authMiddleware, materialController.deleteMaterial);

// module.exports = router;

const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const authMiddleware = require('../middlewares/authMiddleware'); // Ensure path is correct

// --- Apply Authentication Middleware to ALL Material Routes ---

// GET /api/materials?project=:projectId - Get materials (filtered by role/project)
// Requires authentication to know the user's role and assigned projects.
router.get('/', authMiddleware, materialController.getMaterials);

// POST /api/materials - Create a new material
// Requires authentication to know who is creating and check permissions.
router.post('/', authMiddleware, materialController.createMaterial);

// GET /api/materials/:id - Get a single material by its ID
// Requires authentication to check if the user is authorized (e.g., admin or contractor for assigned project).
router.get('/:id', authMiddleware, materialController.getMaterialById);

// PATCH /api/materials/:id - Update a material
// Requires authentication to check if the user is the owner or an admin.
router.patch('/:id', authMiddleware, materialController.updateMaterial);

// DELETE /api/materials/:id - Delete a material
// Requires authentication to check if the user is the owner or an admin.
router.delete('/:id', authMiddleware, materialController.deleteMaterial);

module.exports = router;