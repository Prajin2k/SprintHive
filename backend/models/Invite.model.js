/**
 * Invite Model
 *
 * Design: Separate collection (not embedded in Organization) for these reasons:
 * 1. Keeps the Organization document lean — pending invites can pile up
 * 2. Allows querying all pending invites by email after a new user registers
 *    (so we can auto-accept or surface them on first login)
 * 3. Supports individual revocation, resend, and TTL-based expiry via index
 * 4. Avoids polluting Organization.members[] with "ghost" entries for non-users
 *
 * Flow for invited existing users: added to org directly, no Invite record needed
 * Flow for invited new users:
 *   1. Invite record created (token hashed, email stored)
 *   2. Email sent with {CLIENT_URL}/accept-invite/:rawToken
 *   3. They register (or log in), then visit the link → POST /api/organizations/invites/:token/accept
 *   4. Invite validated, user added to org members, invite marked 'accepted'
 */

const mongoose = require('mongoose');

// Cannot invite someone as 'owner' — ownership transfer is out of scope
const INVITE_ROLES = ['manager', 'teamlead', 'developer', 'tester'];
const INVITE_STATUSES = ['pending', 'accepted', 'revoked'];

const inviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Invite email is required'],
      lowercase: true,
      trim: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Invite must be linked to an organization'],
    },
    role: {
      type: String,
      enum: { values: INVITE_ROLES, message: `Role must be one of: ${INVITE_ROLES.join(', ')}` },
      required: [true, 'Invite role is required'],
      default: 'developer',
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Stored hashed (SHA-256) — raw token is sent in the email URL
    token: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: INVITE_STATUSES,
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────
inviteSchema.index({ token: 1 });                             // token lookup on accept
inviteSchema.index({ email: 1, organization: 1 });            // "is this email already invited here?"
inviteSchema.index({ email: 1, status: 1 });                  // "what pending invites exist for this email?"
inviteSchema.index({ organization: 1, status: 1 });           // list pending invites for an org
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB auto-removes expired docs

const Invite = mongoose.model('Invite', inviteSchema);
module.exports = { Invite, INVITE_ROLES, INVITE_STATUSES };
