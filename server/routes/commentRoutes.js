const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
// const { protect } = require('../middleware/auth');

// GET /api/projects/:projectId/comments
router.get('/project/:projectId/comments', commentController.getCommentsForProject);

// POST /api/projects/:projectId/comments
router.post('/project/:projectId/comments', commentController.createComment);

// PATCH /api/comments/:id
router.patch('/comments/:id', commentController.updateComment);

// DELETE /api/comments/:id
router.delete('/comments/:id', commentController.deleteComment);

module.exports = router;