const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const refreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries by default
    },
    avatar: {
      type: String,
      default: '', // URL — Cloudinary or local
    },

    // ── Email verification ────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // ── Password reset ────────────────────────────────────
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // ── Multi-device refresh tokens ───────────────────────
    refreshTokens: {
      type: [refreshTokenSchema],
      select: false,
      default: [],
    },

    // ── Preferences ───────────────────────────────────────
    timezone: {
      type: String,
      default: 'UTC',
    },
    theme: {
      type: String,
      enum: ['dark', 'light', 'system'],
      default: 'dark',
    },
    language: {
      type: String,
      enum: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
      default: 'en',
    },

    // ── Soft-delete ───────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────
// Note: email index is created automatically by `unique: true` on the field.
// Only declare additional compound indexes here.
userSchema.index({ isActive: 1, createdAt: -1 }); // admin user listing

// ── Pre-save hook: hash password ──────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance method: compare password ─────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  // password is select:false so we must explicitly select it before calling this
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: prune expired refresh tokens ─────────────
userSchema.methods.pruneExpiredTokens = function () {
  this.refreshTokens = this.refreshTokens.filter((t) => t.expiresAt > new Date());
};

// ── Virtual: initials (for avatar fallback) ───────────────────
userSchema.virtual('initials').get(function () {
  return this.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
