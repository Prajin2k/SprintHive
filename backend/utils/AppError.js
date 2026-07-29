/**
 * Custom API Error class
 * Extend native Error to include an HTTP status code and optional machine-readable code.
 * Usage:
 *   throw new AppError('Not found', 404);
 *   throw new AppError('Email not verified', 403, 'EMAIL_NOT_VERIFIED');
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;   // machine-readable code for frontend branching
    this.isOperational = true;    // distinguish from unexpected errors
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
