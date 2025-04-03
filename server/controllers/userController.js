

// src/controllers/userController.js

const User = require('../models/User');
const catchAsync = require('../utils/CatchAsync');
const jwt = require('jsonwebtoken');

// Helper function to check if the requesting user is an admin (kept for reference, but direct check is used below)
// const isAdmin = (req) => { ... }; // Not strictly needed if checking roles directly

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin and Consultant) // --- MODIFIED ACCESS DESCRIPTION ---
exports.getUsers = catchAsync(async (req, res, next) => {
  // Verify token
  const token = req.header('Authorization')?.replace('Bearer ', ''); // Use optional chaining
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }

  const requestingUser = await User.findById(decoded.id);
  if (!requestingUser) {
    // This case might indicate a deleted user whose token is still valid briefly
    return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
  }

  // --- MODIFIED PERMISSION CHECK START ---
  // Allow both 'admin' and 'consultant' roles to fetch the list of users
  const allowedRoles = ['admin', 'consultant'];
  if (!allowedRoles.includes(requestingUser.role)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have permission to access this resource'
    });
  }
  // --- MODIFIED PERMISSION CHECK END ---

  const users = await User.find().select('-password'); // Exclude password field

  // --- MODIFIED RESPONSE STRUCTURE START ---
  // Ensure the structure matches frontend expectation (usersData.data.users)
  res.status(200).json({
    success: true,
    // data: users // Original structure
    data: { users: users } // Adjusted structure
  });
  // --- MODIFIED RESPONSE STRUCTURE END ---
});

// @desc    Get a single user by ID
// @route   GET /api/users/:id
// @access  Private (Needs auth, specific role check might be needed depending on use case)
exports.getUser = catchAsync(async (req, res, next) => {
  // Add auth check if needed, e.g., ensure user is logged in.
  // Potentially restrict further based on role if necessary.
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.'
    });
  }
  res.status(200).json({
    success: true,
    data: user // Structure is likely { success: true, data: { ...user data... } }
  });
});

// @desc    Update user by ID
// @route   PUT /api/users/:id
// @access  Private (Admin only - Kept as Admin Only) // --- KEPT ADMIN ONLY ---
exports.updateUser = catchAsync(async (req, res, next) => {
  // Verify token and check admin role
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized, no token' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }

  const requestingUser = await User.findById(decoded.id);
  if (!requestingUser) return res.status(401).json({ success: false, message: 'Not authorized, user not found' });

  // --- KEPT ADMIN ONLY CHECK ---
  // Only Admins can update arbitrary user accounts via this route
  if (requestingUser.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have permission to update this resource.'
    });
  }
  // --- END ADMIN ONLY CHECK ---

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    req.body, // Be cautious about what fields can be updated here
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
    data: updatedUser // Structure is likely { success: true, data: { ...updated user data... } }
  });
});

// @desc    Delete user by ID
// @route   DELETE /api/users/:id
// @access  Private (Admin only - Kept as Admin Only) // --- KEPT ADMIN ONLY ---
exports.deleteUser = catchAsync(async (req, res, next) => {
  // Verify token and check admin role
  const token = req.header('Authorization')?.replace('Bearer ', '');
   if (!token) return res.status(401).json({ success: false, message: 'Not authorized, no token' });

   let decoded;
   try {
     decoded = jwt.verify(token, process.env.JWT_SECRET);
   } catch (err) {
     return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
   }

   const requestingUser = await User.findById(decoded.id);
   if (!requestingUser) return res.status(401).json({ success: false, message: 'Not authorized, user not found' });

  // --- KEPT ADMIN ONLY CHECK ---
  // Only Admins can delete arbitrary user accounts via this route
  if (requestingUser.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have permission to delete this user.'
    });
  }
  // --- END ADMIN ONLY CHECK ---

  const deletedUser = await User.findByIdAndDelete(req.params.id);
  if (!deletedUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found.'
    });
  }

  res.status(200).json({
    success: true,
    message: 'User deleted successfully.',
    data: {} // Often good practice to return empty data object on delete
  });
});

// --- User Self-Update Function ---
// @desc    Update user details (logged-in user updates themselves)
// @route   PATCH /api/users/updateme
// @access  Private (User must be logged in)
exports.updateMe = catchAsync(async (req, res, next) => {
   // Assumes an authentication middleware (like 'protect') has added req.user
   if (!req.user || !req.user.id) {
       return res.status(401).json({ success: false, message: 'Not authorized, user information missing from request' });
   }
  console.log('User ID from request:', req.user.id);

  const allowedUpdates = { ...req.body };
  const forbiddenFields = ['role', 'password', 'isActive', '_id', 'associatedProjects', 'createdAt', 'updatedAt', 'passwordChangedAt', 'passwordResetToken', 'passwordResetExpires']; // Added more potentially sensitive fields
  forbiddenFields.forEach(field => delete allowedUpdates[field]);

  if (allowedUpdates.email) {
      const existingUser = await User.findOne({ email: allowedUpdates.email });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
           return res.status(400).json({ success: false, message: 'Email address is already in use by another account.' });
      }
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, allowedUpdates, {
      new: true,
      runValidators: true
  }).select('-password');

   if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found during update process.' }); // More specific error
  }

  res.status(200).json({
      success: true,
      // --- MODIFIED RESPONSE STRUCTURE CONSISTENCY ---
      // Return the user data nested under a 'user' key or directly under 'data'
      // Let's match the single getUser structure: data: updatedUser
      data: updatedUser
      // data: { user: updatedUser } // Alternative structure
      // --- END MODIFICATION ---
  });
});