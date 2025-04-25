const express = require('express');
const { login, register, updateMyPassword, forgotPassword, resetPassword } = require('../controllers/authController');
const protect = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.patch('/updatepassword', protect, updateMyPassword);

// Add these two routes for password reset functionality
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;