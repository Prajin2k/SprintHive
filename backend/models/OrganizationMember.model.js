const mongoose = require('mongoose');

/**
 * OrganizationMember — separate collection to represent membership
 * Fields:
 *  - organization: ObjectId -> Organization
 *  - user: ObjectId -> User
 *  - role: string (owner, manager, teamlead, developer, tester)
 *  - status: pending | active | removed
 *  - invitedBy: ObjectId -> User
 *  - joinedAt: Date
 */

const ORG_MEMBER_ROLES = ['owner', 'manager', 'teamlead', 'developer', 'tester'];

const organizationMemberSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ORG_MEMBER_ROLES,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'removed'],
      default: 'active',
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

organizationMemberSchema.index({ organization: 1, user: 1 }, { unique: true });

const OrganizationMember = mongoose.model('OrganizationMember', organizationMemberSchema);

module.exports = { OrganizationMember, ORG_MEMBER_ROLES };
