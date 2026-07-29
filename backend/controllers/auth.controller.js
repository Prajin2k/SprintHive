/**
 * Auth Controller — Sprint Hive
 * All authentication logic: register, verify, login, refresh, logout,
 * forgot/reset password, change password, profile CRUD, avatar upload.
 */

const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateRandomToken,
  hashToken,
  tokenExpiry,
  refreshTokenExpiry,
} = require('../utils/tokenUtils');
const emailService = require('../services/email.service');
const { uploadFile } = require('../services/upload.service');

// ── Cookie config ───────────────────────────────────────────────
const COOKIE_NAME = 'refreshToken';
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days ms
  path: '/api/auth',
});

const clearCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/api/auth',
});

// ── Safe user object (no sensitive fields) ─────────────────────
const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  isVerified: user.isVerified,
  timezone: user.timezone,
  theme: user.theme,
  language: user.language,
  createdAt: user.createdAt,
  initials: user.initials,
});

// ── Issue token pair helper ────────────────────────────────────
const issueTokens = async (user, req) => {
  const accessToken = generateAccessToken({ id: user._id, email: user.email });
  const rawRefresh = generateRefreshToken({ id: user._id });
  const hashedRefresh = hashToken(rawRefresh);
  const userAgent = req.headers['user-agent'] || '';

  // Prune expired tokens, then add new one
  user.pruneExpiredTokens();
  user.refreshTokens.push({
    token: hashedRefresh,
    expiresAt: refreshTokenExpiry(),
    userAgent,
  });
  await user.save({ validateBeforeSave: false });

  return { accessToken, rawRefresh };
};

// ─────────────────────────────────────────────────────────────────
// 1. REGISTER
// ─────────────────────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check for existing user
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    // Use same error for verified and unverified to avoid account enumeration
    throw new AppError('An account with this email already exists.', 409);
  }

  // Generate verification token (plain → sent in email, hashed → stored in DB)
  const verificationToken = generateRandomToken();
  const hashedVerificationToken = hashToken(verificationToken);

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    emailVerificationToken: hashedVerificationToken,
    emailVerificationExpires: tokenExpiry(24 * 60), // 24 hours
  });

  // Send verification email (non-blocking — don't fail registration if email fails)
  try {
    await emailService.sendVerificationEmail(user, verificationToken);
  } catch (emailErr) {
    console.error('⚠️ Verification email failed to send:', emailErr.message);
  }

  res.status(201).json({
    success: true,
    message: `Account created! We sent a verification link to ${user.email}. Please check your inbox (and spam folder).`,
  });
});

// ─────────────────────────────────────────────────────────────────
// 2. VERIFY EMAIL
// ─────────────────────────────────────────────────────────────────
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() },
    isVerified: false,
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw new AppError('Verification link is invalid or has expired.', 400);
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(user);
  } catch (_) {}

  res.status(200).json({
    success: true,
    message: 'Email verified successfully! You can now log in.',
  });
});

// ─────────────────────────────────────────────────────────────────
// 3. RESEND VERIFICATION EMAIL
// ─────────────────────────────────────────────────────────────────
exports.resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Generic response regardless — no account enumeration
  const genericResponse = {
    success: true,
    message: 'If an unverified account with that email exists, a new link has been sent.',
  };

  const user = await User.findOne({
    email: email?.toLowerCase().trim(),
    isVerified: false,
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) return res.status(200).json(genericResponse);

  // Rate limit: don't resend if a recent token still has > 23 hours remaining
  if (user.emailVerificationExpires && user.emailVerificationExpires > tokenExpiry(23 * 60)) {
    return res.status(200).json(genericResponse);
  }

  const verificationToken = generateRandomToken();
  user.emailVerificationToken = hashToken(verificationToken);
  user.emailVerificationExpires = tokenExpiry(24 * 60);
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendVerificationEmail(user, verificationToken);
  } catch (_) {}

  res.status(200).json(genericResponse);
});

// ─────────────────────────────────────────────────────────────────
// 4. LOGIN
// ─────────────────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log("Email received:", email);

  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select('+password +refreshTokens +emailVerificationToken');

  console.log("User found:", user);

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isVerified) {
    throw new AppError(
      'Please verify your email before logging in. Check your inbox or request a new link.',
      403,
      'EMAIL_NOT_VERIFIED'
    );
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact support.', 403);
  }

  const { accessToken, rawRefresh } = await issueTokens(user, req);

  res
    .status(200)
    .cookie(COOKIE_NAME, rawRefresh, cookieOptions())
    .json({
      success: true,
      message: 'Logged in successfully.',
      user: sanitizeUser(user),
      accessToken,
    });
});

// ─────────────────────────────────────────────────────────────────
// 5. REFRESH TOKEN (with rotation + reuse detection)
// ─────────────────────────────────────────────────────────────────
exports.refresh = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.[COOKIE_NAME];

  if (!incomingToken) {
    throw new AppError('No refresh token provided.', 401);
  }

  // 1. Verify JWT signature first (fast, no DB hit)
  let decoded;
  try {
    decoded = verifyRefreshToken(incomingToken);
  } catch (err) {
    // JWT is invalid or tampered — clear cookie
    res.clearCookie(COOKIE_NAME, clearCookieOptions());
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  // 2. Find user + their stored refresh tokens
  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user) {
    res.clearCookie(COOKIE_NAME, clearCookieOptions());
    throw new AppError('User not found.', 401);
  }

  const hashedIncoming = hashToken(incomingToken);
  const storedToken = user.refreshTokens.find((t) => t.token === hashedIncoming);

  // 3. REUSE DETECTION — token not in DB but JWT was valid
  if (!storedToken) {
    // Possible stolen token reuse — nuke all refresh tokens for this user
    console.warn(`⚠️  Refresh token reuse detected for user ${user._id}. Clearing all tokens.`);
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });
    res.clearCookie(COOKIE_NAME, clearCookieOptions());
    throw new AppError('Refresh token reuse detected. Please log in again.', 401);
  }

  // 4. Check if stored token is expired
  if (storedToken.expiresAt < new Date()) {
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== hashedIncoming);
    await user.save({ validateBeforeSave: false });
    res.clearCookie(COOKIE_NAME, clearCookieOptions());
    throw new AppError('Refresh token has expired. Please log in again.', 401);
  }

  // 5. ROTATE — remove old token, issue new pair
  user.refreshTokens = user.refreshTokens.filter((t) => t.token !== hashedIncoming);
  user.pruneExpiredTokens();

  const newAccessToken = generateAccessToken({ id: user._id, email: user.email });
  const newRawRefresh = generateRefreshToken({ id: user._id });
  const newHashedRefresh = hashToken(newRawRefresh);

  user.refreshTokens.push({
    token: newHashedRefresh,
    expiresAt: refreshTokenExpiry(),
    userAgent: req.headers['user-agent'] || '',
  });
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .cookie(COOKIE_NAME, newRawRefresh, cookieOptions())
    .json({
      success: true,
      accessToken: newAccessToken,
      user: sanitizeUser(user),
    });
});

// ─────────────────────────────────────────────────────────────────
// 6. LOGOUT
// ─────────────────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.[COOKIE_NAME];

  if (incomingToken) {
    // Best-effort remove from DB (don't fail if user not found)
    try {
      const decoded = verifyRefreshToken(incomingToken);
      const hashedIncoming = hashToken(incomingToken);
      await User.findByIdAndUpdate(decoded.id, {
        $pull: { refreshTokens: { token: hashedIncoming } },
      });
    } catch (_) {}
  }

  res
    .clearCookie(COOKIE_NAME, clearCookieOptions())
    .status(200)
    .json({ success: true, message: 'Logged out successfully.' });
});

// ─────────────────────────────────────────────────────────────────
// 7. FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Generic response regardless — prevent account enumeration
  const genericResponse = {
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
  };

  const user = await User.findOne({
    email: email?.toLowerCase().trim(),
    isActive: true,
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) return res.status(200).json(genericResponse);

  const resetToken = generateRandomToken();
  user.passwordResetToken = hashToken(resetToken);
  user.passwordResetExpires = tokenExpiry(60); // 1 hour
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendPasswordResetEmail(user, resetToken);
  } catch (err) {
    // Rollback token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError('Failed to send reset email. Please try again.', 500);
  }

  res.status(200).json(genericResponse);
});

// ─────────────────────────────────────────────────────────────────
// 8. RESET PASSWORD
// ─────────────────────────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires +refreshTokens');

  if (!user) {
    throw new AppError('Password reset link is invalid or has expired.', 400);
  }

  user.password = password; // pre-save hook hashes it
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // Invalidate ALL refresh tokens — force re-login everywhere
  user.refreshTokens = [];
  await user.save();

  // Clear refresh cookie if set
  res.clearCookie(COOKIE_NAME, clearCookieOptions());

  // Notify user
  try {
    await emailService.sendPasswordChangedEmail(user);
  } catch (_) {}

  res.status(200).json({
    success: true,
    message: 'Password reset successfully. Please log in with your new password.',
  });
});

// ─────────────────────────────────────────────────────────────────
// 9. CHANGE PASSWORD (authenticated)
// ─────────────────────────────────────────────────────────────────
// Decision: invalidate ALL refresh tokens and force full re-login.
// Cleaner than partial invalidation — security > convenience here.
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password +refreshTokens');

  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect.', 401);
  }

  user.password = newPassword; // pre-save hook hashes
  user.refreshTokens = [];     // invalidate all sessions
  await user.save();

  res.clearCookie(COOKIE_NAME, clearCookieOptions());

  try {
    await emailService.sendPasswordChangedEmail(user);
  } catch (_) {}

  res.status(200).json({
    success: true,
    message: 'Password changed. Please log in again with your new password.',
  });
});

// ─────────────────────────────────────────────────────────────────
// 10. GET ME (protected)
// ─────────────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || !user.isActive) throw new AppError('User not found.', 404);

  res.status(200).json({ success: true, user: sanitizeUser(user) });
});

// ─────────────────────────────────────────────────────────────────
// 11. UPDATE ME (protected)
// ─────────────────────────────────────────────────────────────────
exports.updateMe = asyncHandler(async (req, res) => {
  // Whitelist updatable fields — email and password have dedicated routes
  const allowed = ['name', 'timezone', 'theme', 'language'];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  if (req.body.name) updates.name = req.body.name.trim();

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) throw new AppError('User not found.', 404);

  res.status(200).json({
    success: true,
    message: 'Profile updated.',
    user: sanitizeUser(user),
  });
});

// ─────────────────────────────────────────────────────────────────
// 12. UPLOAD AVATAR (protected)
// ─────────────────────────────────────────────────────────────────
exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded.', 400);

  const { url } = await uploadFile(req.file.path, 'avatars');

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: url },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Avatar updated.',
    avatar: url,
    user: sanitizeUser(user),
  });
});
