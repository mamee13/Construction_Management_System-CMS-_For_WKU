// server/middlewares/roleMiddleware.js

/**
 * Middleware to check if a user has the required role to access a route.
 * @param {...string} allowedRoles - The roles allowed to access the route.
 * @returns {Function} Middleware function for role-based access control.
 */
const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to access this resource'
        });
      }
      next();
    };
  };
  
  module.exports = roleMiddleware;
  