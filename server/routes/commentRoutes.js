const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { createComment, getProjectComments } = require('../controllers/commentController');

router.post('/', authMiddleware, createComment);
router.get('/project/:projectId', authMiddleware, getProjectComments);

module.exports = router;