/**
 * Token Utilities
 * Centralizes all JWT generation/verification and crypto token helpers.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ── JWT Tokens ─────────────────────────────────────────────────

/**
 * Generate a short-lived access token (15m default)
 * Payload: { id, email } — intentionally minimal; org roles are per-request from DB
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    issuer: 'sprint-hive',
  });
};

/**
 * Generate a long-lived refresh token (7d default)
 * Payload: { id } only — smallest possible surface
 */
const generateRefreshToken = (payload) => {
  return jwt.sign({ id: payload.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'sprint-hive',
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, { issuer: 'sprint-hive' });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, { issuer: 'sprint-hive' });
};

// ── Crypto Tokens (email verification, password reset) ─────────
// NOT using JWT here — reasons:
//   1. These must be stored server-side to support revocation
//   2. JWTs encode user info visible in URL if base64-decoded
//   3. Random crypto bytes are simpler and more appropriate

/**
 * Generate a plain random hex token (sent in emails/URLs)
 */
const generateRandomToken = () => crypto.randomBytes(32).toString('hex');

/**
 * Hash a token for safe DB storage (SHA-256, one-way)
 * Never store plain tokens in the database.
 */
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Get the expiry Date for a short-lived token
 * @param {number} minutes - minutes from now
 */
const tokenExpiry = (minutes) => new Date(Date.now() + minutes * 60 * 1000);

/**
 * Get refresh token expiry Date (7 days)
 */
const refreshTokenExpiry = () => {
  const days = parseInt(process.env.JWT_REFRESH_EXPIRES_IN) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateRandomToken,
  hashToken,
  tokenExpiry,
  refreshTokenExpiry,
};
