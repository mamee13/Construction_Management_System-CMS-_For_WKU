const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const catchAsync = require('../utils/CatchAsync');
const OTP = require('../models/OTP');
const { sendOTPEmail } = require('../utils/emailService');
const rateLimit = require('express-rate-limit');

console.log('bcrypt version:', bcrypt.VERSION || bcrypt.version || 'bcryptjs');
console.log('bcrypt hash function:', bcrypt.hash.toString());
console.log('bcrypt compare function:', bcrypt.compare.toString());

// Helper function to sign JWT tokens
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email, password }); // Don't log passwords
  // 1. Check if email and password exist
  if (!email || !password) {
    console.log('Email or password not provided');
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password.'
    });
  }

  // 2. Check if user exists & password is correct
  console.log('Checking if user exists');
  const user = await User.findOne({ email }).select('+password');
  console.log('User found:', user);
  if (!user) {
    console.log('User not found');
    return res.status(401).json({
      success: false,
      message: 'Incorrect email or password.'
    });
  }

  console.log('Entered password:', password);
  console.log('Stored hashed password:', user.password);

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  console.log('Password comparison result:', isPasswordCorrect);

  if (!isPasswordCorrect) {
    console.log('Incorrect email or password');
    return res.status(401).json({
      success: false,
      message: 'Incorrect email or password.'
    });
  }
  console.log('Password matched');

  // 3. If everything is ok, sign token and send response
  try {
    const token = signToken(user._id);
    console.log('Token generated:', token);
    res.status(200).json({
      success: true,
      token,
      data: {
        user
      }
    });
    console.log('Response sent');
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating token'
    });
  }
  console.log('End of login');
});

// @desc    Register new user (Admin only)
// @route   POST /api/auth/register
// @access  Private (Admin only)
exports.register = catchAsync(async (req, res, next) => {
  // Check for JWT token in the Authorization header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided. Please log in as an admin.',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
    });
  }

  // Get the user from the decoded token
  const adminUser = await User.findById(decoded.id);
  if (!adminUser || adminUser.role !== 'admin') {
    console.log('User is not an admin');
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to create a new user account.',
    });
  }

  // Extract user data from the request body
  const { firstName, lastName, email, password, role, age, phone } = req.body;
  
  // Optional: Validate required fields
  if (!firstName || !lastName || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields. Please provide first name, last name, email, password, and role.',
    });
  }

  // Create the new user without manually hashing the password
  // The pre-save hook in the User model will handle password hashing.
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password, // pre-save hook hashes this automatically
    role,
    age,
    phone,
  });

  res.status(201).json({
    success: true,
    data: {
      user: newUser,
    },
  });
});

// @desc    Update user password (logged-in user)
// @route   PATCH /api/auth/updatepassword
// @access  Private (User must be logged in)
exports.updateMyPassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // 1. Get user from the collection (including password)
  // req.user should be populated by your authentication middleware (e.g., 'protect')
  if (!req.user || !req.user.id) {
       return res.status(401).json({ success: false, message: 'Not authorized, user not found in request' });
      // return next(new ErrorResponse('Not authorized', 401));
  }

  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
      // return next(new ErrorResponse('User not found', 401)); // Should ideally not happen if token is valid
  }

  // 2. Check if posted current password is correct
  if (!currentPassword || !(await user.comparePassword(currentPassword))) {
       return res.status(401).json({ success: false, message: 'Incorrect current password' });
      // return next(new ErrorResponse('Incorrect current password', 401));
  }

  // 3. If so, update password
  // The 'pre-save' hook in the User model will handle hashing
  user.password = newPassword;
  await user.save(); // This triggers the pre-save hook

  // 4. Log user in, send JWT back (optional, but good practice)
  // Or just send success message if frontend doesn't need a new token immediately
  // const token = user.generateAuthToken(); // Assuming this method exists

  res.status(200).json({
      success: true,
      message: 'Password updated successfully'
      // token: token // Optionally send a new token
  });
});

// Rate limiter for forgot password requests
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many password reset attempts. Please try again later.',
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Send OTP for password reset
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found with this email',
    });
  }

  // Generate OTP
  const otp = generateOTP();

  // Save OTP to database
  await OTP.create({
    email,
    otp: await bcrypt.hash(otp, 12),
  });

  // Send OTP via email
  try {
    await sendOTPEmail(email, otp);
    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    await OTP.deleteOne({ email }); // Clean up OTP if email fails
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP email',
    });
  }
});

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = catchAsync(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Validate password
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long',
    });
  }

  // Find the latest OTP for this email
  const otpDoc = await OTP.findOne({ email }).sort({ createdAt: -1 });
  if (!otpDoc) {
    return res.status(400).json({
      success: false,
      message: 'OTP expired or invalid',
    });
  }

  // Verify OTP
  const isValidOTP = await bcrypt.compare(otp, otpDoc.otp);
  if (!isValidOTP) {
    return res.status(400).json({
      success: false,
      message: 'Invalid OTP',
    });
  }

  // Update password
  const user = await User.findOne({ email });
  user.password = newPassword;
  await user.save();

  // Delete used OTP
  await OTP.deleteOne({ _id: otpDoc._id });

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
  });
})
