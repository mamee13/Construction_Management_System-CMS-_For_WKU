const User = require('../models/User');
const catchAsync = require('../utils/CatchAsync');
const jwt = require('jsonwebtoken');

// Helper function to check if the requesting user is an admin
const isAdmin = (req) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.role === 'admin';
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
exports.getUsers = catchAsync(async (req, res, next) => {
  // Verify token and check admin role
  const token = req.header('Authorization').replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const requestingUser = await User.findById(decoded.id);
  if (requestingUser.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have permission to access this resource'
    });
  }

  const users = await User.find().select('-password'); // Exclude password field
  res.status(200).json({
    success: true,
    data: users
  });
});

// @desc    Get a single user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.'
    });
  }
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user by ID
// @route   PUT /api/users/:id
// @access  Private (Admin only)
exports.updateUser = catchAsync(async (req, res, next) => {
  // Verify token and check admin role
  const token = req.header('Authorization').replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const requestingUser = await User.findById(decoded.id);
  if (requestingUser.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have permission to update this resource.'
    });
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).select('-password');

  if (!updatedUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found.'
    });
  }

  res.status(200).json({
    success: true,
    data: updatedUser
  });
});

// @desc    Delete user by ID
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = catchAsync(async (req, res, next) => {
  // Verify token and check admin role
  const token = req.header('Authorization').replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const requestingUser = await User.findById(decoded.id);
  if (requestingUser.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have permission to delete this user.'
    });
  }

  const deletedUser = await User.findByIdAndDelete(req.params.id);
  if (!deletedUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found.'
    });
  }

  res.status(200).json({
    success: true,
    message: 'User deleted successfully.'
  });
});
