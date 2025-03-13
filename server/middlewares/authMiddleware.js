const jwt = require('jsonwebtoken');
const User = require('../models/User');


/**
 * Middleware to authenticate users using JWT.
 * Verifies the token and attaches the user object to req.user.
 */
const authMiddleware = async (req, res, next) => {
  // Get token from request headers
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);

    // Attach user information to the request
    req.user = await User.findById(decoded.id).select('-password'); // Exclude password for security

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Authentication failed.'
      });
    }

    next(); // Move to the next middleware/controller
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Authentication failed.'
    });
  }
};

module.exports = authMiddleware;
