const { validationResult } = require('express-validator');

/**
 * Middleware to validate request inputs.
 * Checks for errors in the request as set by express-validator.
 * If errors are found, returns a 422 response with details.
 * Otherwise, proceeds to the next middleware.
 */
const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation Error',
      errors: errors.array()
    });
  }
  
  next();
};

module.exports = validationMiddleware;
