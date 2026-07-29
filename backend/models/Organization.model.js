const mongoose = require('mongoose');

// ── Role enum (single source of truth used by RBAC middleware) ──
const ORG_ROLES = ['owner', 'manager', 'teamlead', 'developer', 'tester'];

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: {
        values: ORG_ROLES,
        message: 'Role must be one of: owner, manager, teamlead, developer, tester',
      },
      required: [true, 'Member role is required'],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    // Invitation tracking
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled'],
      default: 'active',
    },
    // Stub — no real billing integration yet
    externalId: { type: String, default: '' }, // e.g. Stripe subscription ID
  },
  { _id: false }
);

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      minlength: [2, 'Organization name must be at least 2 characters'],
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    logo: {
      type: String,
      default: '', // URL
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organization must have an owner'],
    },
    // Roles are stored HERE — not on the User model
    members: {
      type: [memberSchema],
      default: [],
      validate: {
        validator: function (members) {
          // Must always have at least one member (the owner)
          return members.length >= 1;
        },
        message: 'Organization must have at least one member',
      },
    },
    subscription: {
      type: subscriptionSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      allowMemberInvites: { type: Boolean, default: false }, // only owner/manager by default
      defaultRole: {
        type: String,
        enum: ORG_ROLES,
        default: 'developer',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────
// Note: slug index is created automatically by `unique: true` on the field.
organizationSchema.index({ owner: 1 });               // owner's orgs
organizationSchema.index({ 'members.user': 1 });      // "find all orgs for user" query
organizationSchema.index({ isActive: 1, createdAt: -1 });

// ── Virtual: memberCount ──────────────────────────────────────
organizationSchema.virtual('memberCount').get(function () {
  return this.members?.length ?? 0;
});

// ── Helper: get a specific user's role in this org ───────────
organizationSchema.methods.getMemberRole = function (userId) {
  const member = this.members.find((m) => m.user.toString() === userId.toString());
  return member?.role ?? null;
};

organizationSchema.methods.isMember = function (userId) {
  return this.members.some((m) => m.user.toString() === userId.toString());
};

const crypto = require('crypto');

// ── Pre-validate: auto-generate slug from name ────────────────
organizationSchema.pre('validate', function (next) {
  if (!this.slug) {
    const base = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40);
    const suffix = crypto.randomBytes(3).toString('hex'); // 6-char hex
    this.slug = `${base}-${suffix}`;
  }
  next();
});

// Export role constants for use in middleware and controllers
organizationSchema.statics.ROLES = ORG_ROLES;

const Organization = mongoose.model('Organization', organizationSchema);
module.exports = { Organization, ORG_ROLES };
