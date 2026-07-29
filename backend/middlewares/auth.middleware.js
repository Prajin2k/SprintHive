/**
 * Middleware: protect
 * Verifies the JWT access token from the Authorization header.
 * Attaches the decoded user payload to req.user.
 */

const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/tokenUtils');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  try {
    // verifyAccessToken enforces issuer: 'sprint-hive'
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired. Please refresh your session.', 401));
    }
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
});

/**
 * Middleware: restrictTo
 * Restricts access to specific roles.
 * Usage: router.delete('/...', protect, restrictTo('admin', 'owner'), handler)
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

module.exports = { protect, restrictTo };
