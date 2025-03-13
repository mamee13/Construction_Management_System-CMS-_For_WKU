const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const catchAsync = require('../utils/CatchAsync');

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

  // 1. Check if email and password exist
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password.'
    });
  }

  // 2. Check if user exists & password is correct
  // Select password explicitly if it's excluded by default in the schema
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect email or password.'
    });
  }

  // 3. If everything is ok, sign token and send response
  const token = signToken(user._id);
  res.status(200).json({
    success: true,
    token,
    data: {
      user
    }
  });
});

// @desc    Register new user (Admin only)
// @route   POST /api/auth/register
// @access  Private (Admin only)
exports.register = catchAsync(async (req, res, next) => {
  // Check for JWT token in the Authorization header
  const token = req.header('Authorization').replace('Bearer ', '');

  // Verify the JWT token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Get the user and role from the decoded token
  const user = await User.findById(decoded.id);
  console.log(user);
  // Only an admin can create new user accounts
  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to create a new user account.'
    });
  }
 console.log("1")
  // Extract user data from the request body
  const { firstName, lastName, email, password, role, age ,phone } = req.body;

  const hashedPassword = await bcrypt.hash(password, 12);
console.log("2")

  // Create the new user
  await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role,
    age,
    phone
  }).then((newUser) => {
    console.log("3")
    res.status(201).json({
      success: true,
      data: {
        user: newUser
      }
    });
  }).catch((err) => {
    console.error(err)
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  });

  res.status(201).json({
    success: true,
    data: {
      user: newUser
    }
  });
});
