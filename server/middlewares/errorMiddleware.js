// server/middlewares/errorMiddleware.js

/**
 * Global error handling middleware for the Express app.
 * Logs the error and sends a JSON response with the error message.
 *
 * @param {Error} err - The error object.
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * @param {Function} next - The next middleware function.
 */
function errorMiddleware(err, req, res, next) {
    // Log error stack for debugging (can be enhanced with a logging library)
    console.error(err.stack);
  
    // Set status code to error's status if provided, or default to 500 (Internal Server Error)
    const statusCode = err.status || 500;
    
    // Return a JSON response with error details
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal Server Error',
      // Optionally include stack trace in development mode only:
      //stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
    return next();
  }
  
  module.exports = errorMiddleware;
  