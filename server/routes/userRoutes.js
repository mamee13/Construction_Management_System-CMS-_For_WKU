const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController");

// Get all users (Admin only)
// router.get('/', userController.getAllUsers);
router.get('/', userController.getUsers)
// Get a single user by ID
router.get('/:id', userController.getUser);
// Update a user (Admin only)
router.put('/:id', userController.updateUser);
// Delete a user (Admin only)
router.delete('/:id', userController.deleteUser);


module.exports = router;