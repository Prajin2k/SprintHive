/**
 * Auth Routes — Sprint Hive
 * Mounted at: /api/auth
 */

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');

// ── Validation chains ───────────────────────────────────────────

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
  body('email')
    .isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('confirmPassword')
    .custom((val, { req }) => val === req.body.password)
    .withMessage('Passwords do not match'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
];

const resetPasswordValidation = [
  param('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain uppercase')
    .matches(/[a-z]/).withMessage('Must contain lowercase')
    .matches(/[0-9]/).withMessage('Must contain a number'),
  body('confirmPassword')
    .custom((val, { req }) => val === req.body.password)
    .withMessage('Passwords do not match'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain uppercase')
    .matches(/[a-z]/).withMessage('Must contain lowercase')
    .matches(/[0-9]/).withMessage('Must contain a number')
    .custom((val, { req }) => val !== req.body.currentPassword)
    .withMessage('New password must be different from current password'),
];

const updateMeValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
  body('timezone')
    .optional()
    .isString().withMessage('Timezone must be a string'),
  body('theme')
    .optional()
    .isIn(['dark', 'light', 'system']).withMessage('Theme must be dark, light, or system'),
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'ja', 'zh']).withMessage('Unsupported language'),
];

// Stricter rate limit for credential / token endpoints (defined on app in server.js)
const applyAuthLimiter = (req, res, next) => {
  const limiter = req.app.get('authLimiter');
  if (!limiter) return next();
  return limiter(req, res, next);
};

// ── Public routes ───────────────────────────────────────────────

// Register
router.post('/register', applyAuthLimiter, registerValidation, validate, authController.register);

// Email verification
router.get('/verify-email/:token', authController.verifyEmail);

// Resend verification email
router.post(
  '/resend-verification',
  applyAuthLimiter,
  [body('email').isEmail().normalizeEmail(), validate],
  authController.resendVerification
);

// Login
router.post('/login', applyAuthLimiter, loginValidation, validate, authController.login);

// Refresh token (reads httpOnly cookie)
router.post('/refresh', applyAuthLimiter, authController.refresh);

// Logout
router.post('/logout', authController.logout);

// Forgot password
router.post('/forgot-password', applyAuthLimiter, forgotPasswordValidation, validate, authController.forgotPassword);

// Reset password
router.post('/reset-password/:token', applyAuthLimiter, resetPasswordValidation, validate, authController.resetPassword);

// ── Protected routes (require valid access token) ───────────────

// Get current user profile
router.get('/me', protect, authController.getMe);

// Update profile (name, preferences)
router.patch('/me', protect, updateMeValidation, validate, authController.updateMe);

// Upload avatar
router.post(
  '/profile-picture',
  protect,
  upload.single('avatar'),
  authController.uploadAvatar
);

// Change password (while logged in)
router.post('/change-password', protect, changePasswordValidation, validate, authController.changePassword);

module.exports = router;
