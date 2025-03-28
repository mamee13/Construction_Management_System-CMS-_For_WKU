const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define your authentication routes
router.post('/login', authController.login);

module.exports = router;