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

// --- NEW User Self-Update Function ---

// @desc    Update user details (logged-in user updates themselves)
// @route   PATCH /api/users/updateme
// @access  Private (User must be logged in)
exports.updateMe = catchAsync(async (req, res, next) => {
  // req.user should be populated by your authentication middleware (e.g., 'protect')
   if (!req.user || !req.user.id) {
       return res.status(401).json({ success: false, message: 'Not authorized, user not found in request' });
       // return next(new ErrorResponse('Not authorized', 401));
   }
  console.log('User ID from request:', req.user.id); // Debugging line
  // 1. Filter out fields that users should NOT be allowed to update themselves
  const allowedUpdates = { ...req.body };
  const forbiddenFields = ['role', 'password', 'isActive', '_id', 'associatedProjects', 'createdAt', 'updatedAt'];
  forbiddenFields.forEach(field => delete allowedUpdates[field]);
    console.log('2')
  // Check if email is being updated and if it's already taken by another user
  if (allowedUpdates.email) {
      const existingUser = await User.findOne({ email: allowedUpdates.email });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
           return res.status(400).json({ success: false, message: 'Email address is already in use by another account.' });
          // return next(new ErrorResponse('Email address already in use', 400));
      }
  }

  // 2. Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, allowedUpdates, {
      new: true, // Return the updated document
      runValidators: true // Ensure schema validations run
  }).select('-password'); // Exclude password
   console.log('3')
   if (!updatedUser) {
      // This shouldn't happen if the token was valid, but good to check
      return res.status(404).json({ success: false, message: 'User not found.' });
  }
console.log('4')
  res.status(200).json({
      success: true,
      data: { user: updatedUser } // Return updated user data (excluding password)
  });
  console.log('5')
});