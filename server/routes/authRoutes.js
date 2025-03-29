const express = require('express');
const { login, register, updateMyPassword } = require('../controllers/authController');
const protect = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/login', login);

router.post('/register', register);

router.patch('/updatepassword',protect,  updateMyPassword);

module.exports = router;
