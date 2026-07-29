/**
 * Organization Controller — Sprint Hive
 * 8 operations: create, list, get, invite, remove-member, update-role, delete, accept-invite
 */

const { Organization } = require('../models/Organization.model');
const User = require('../models/User.model');
const { Project } = require('../models/Project.model');
const { Notification } = require('../models/Notification.model');
const { Activity } = require('../models/Activity.model');
const { Invite, INVITE_ROLES } = require('../models/Invite.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { generateRandomToken, hashToken, tokenExpiry } = require('../utils/tokenUtils');
const emailService = require('../services/email.service');

// ── Helpers ────────────────────────────────────────────────────

/** Sanitize org output — strip sensitive fields */
const sanitizeOrg = (org, userRole = null) => ({
  _id: org._id,
  name: org.name,
  slug: org.slug,
  description: org.description,
  avatar: org.avatar,
  owner: org.owner,
  members: org.members,
  subscription: org.subscription,
  isActive: org.isActive,
  createdAt: org.createdAt,
  ...(userRole && { userRole }),
});

/** Get the requesting user's role in an org document */
const getUserRole = (org, userId) => {
  const m = org.members.find((m) => m.user.toString() === userId.toString());
  return m?.role || null;
};

// ─────────────────────────────────────────────────────────────────
// 1. CREATE ORGANIZATION
// ─────────────────────────────────────────────────────────────────
exports.createOrganization = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  const org = await Organization.create({
    name: name.trim(),
    description: description?.trim() || '',
    owner: userId,
    // Creator is automatically owner in members[]
    members: [{ user: userId, role: 'owner', joinedAt: new Date() }],
  });

  // Log activity
  await Activity.create({
    organization: org._id,
    user: userId,
    action: 'project.created', // closest match — org creation
    description: `Created organization "${org.name}"`,
    entity: { type: 'Project', id: org._id, title: org.name },
  }).catch(() => {}); // non-blocking

  res.status(201).json({
    success: true,
    message: `Organization "${org.name}" created successfully.`,
    organization: sanitizeOrg(org, 'owner'),
  });
});

// ─────────────────────────────────────────────────────────────────
// 2. LIST MY ORGANIZATIONS
// ─────────────────────────────────────────────────────────────────
exports.getMyOrganizations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  console.log("========== GET MY ORGANIZATIONS ==========");
  console.log("Logged in user ID:", userId);

  const orgs = await Organization.find({
    'members.user': userId,
    isActive: true,
  })
    .populate('owner', 'name email avatar')
    .sort({ createdAt: -1 });

  console.log("Organizations found:", orgs);

  const result = orgs.map((org) => sanitizeOrg(org, getUserRole(org, userId)));

  res.status(200).json({
    success: true,
    count: result.length,
    organizations: result,
  });
});

// ─────────────────────────────────────────────────────────────────
// 3. GET SINGLE ORGANIZATION
// ─────────────────────────────────────────────────────────────────
exports.getOrganization = asyncHandler(async (req, res) => {
  // Org + role already verified and attached by requireOrgRole middleware
  const orgId = req.params.orgId;

  const org = await Organization.findById(orgId)
    .populate('owner', 'name email avatar initials')
    .populate('members.user', 'name email avatar initials isActive');

  if (!org) throw new AppError('Organization not found.', 404);

  res.status(200).json({
    success: true,
    organization: sanitizeOrg(org, req.userOrgRole),
  });
});

// ─────────────────────────────────────────────────────────────────
// 4. INVITE MEMBER
// ─────────────────────────────────────────────────────────────────
exports.inviteMember = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const org = req.organization; // attached by requireOrgRole
  const inviterId = req.user.id;

  // Validate role — owners cannot be added via invite
  if (!INVITE_ROLES.includes(role)) {
    throw new AppError(
      `Invalid role. Must be one of: ${INVITE_ROLES.join(', ')}. Ownership must be transferred separately.`,
      400
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // ── CASE A: Existing user ────────────────────────────────────
  const existingUser = await User.findOne({ email: normalizedEmail, isActive: true });

  if (existingUser) {
    // Already a member?
    const isMember = org.members.some(
      (m) => m.user.toString() === existingUser._id.toString()
    );
    if (isMember) {
      throw new AppError('This user is already a member of this organization.', 409);
    }

    // Add to org
    org.members.push({ user: existingUser._id, role, joinedAt: new Date() });
    await org.save();

    // Create in-app notification
    const inviter = await User.findById(inviterId).select('name');
    await Notification.create({
      recipient: existingUser._id,
      actor: inviterId,
      type: 'member_invited',
      message: `${inviter?.name || 'Someone'} added you to "${org.name}" as ${role}`,
      link: `/app`,
      meta: { organization: org._id },
    }).catch(() => {});

    // Log activity
    await Activity.create({
      organization: org._id,
      user: inviterId,
      action: 'member.invited',
      description: `Added ${existingUser.name} as ${role}`,
      entity: { type: 'Member', id: existingUser._id, title: existingUser.name },
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: `${existingUser.name} has been added to ${org.name} as ${role}.`,
      addedUser: {
        _id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        avatar: existingUser.avatar,
        role,
      },
    });
  }

  // ── CASE B: New user — create invite record ──────────────────

  // Already has a pending invite?
  const existingInvite = await Invite.findOne({
    email: normalizedEmail,
    organization: org._id,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  });
  if (existingInvite) {
    throw new AppError(
      'An invitation has already been sent to this email address. It expires in 7 days.',
      409
    );
  }

  const rawToken = generateRandomToken();
  const hashedToken = hashToken(rawToken);

  const invite = await Invite.create({
    email: normalizedEmail,
    organization: org._id,
    role,
    invitedBy: inviterId,
    token: hashedToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Send invite email
  const inviter = await User.findById(inviterId).select('name');
  try {
    await emailService.sendOrgInviteEmail({
      to: normalizedEmail,
      orgName: org.name,
      role,
      inviterName: inviter?.name || 'A team member',
      token: rawToken,
    });
  } catch (emailErr) {
    console.error('⚠️ Invite email failed:', emailErr.message);
  }

  // Log activity
  await Activity.create({
    organization: org._id,
    user: inviterId,
    action: 'member.invited',
    description: `Sent invite to ${normalizedEmail} as ${role}`,
    entity: { type: 'Member', id: invite._id, title: normalizedEmail },
  }).catch(() => {});

  res.status(200).json({
    success: true,
    message: `Invitation sent to ${normalizedEmail}. It expires in 7 days.`,
  });
});

// ─────────────────────────────────────────────────────────────────
// 5. ACCEPT INVITE (called after user registers/logs in)
// ─────────────────────────────────────────────────────────────────
exports.acceptInvite = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const userId = req.user.id;

  const hashedToken = hashToken(token);
  const invite = await Invite.findOne({
    token: hashedToken,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  }).populate('organization', 'name members isActive');

  if (!invite) {
    throw new AppError('Invite link is invalid or has expired.', 400);
  }

  // Verify logged-in user's email matches the invite
  const user = await User.findById(userId).select('email name');
  if (user.email !== invite.email) {
    throw new AppError(
      `This invite was sent to ${invite.email}. Please log in with that email to accept.`,
      403
    );
  }

  const org = invite.organization;

  if (!org || !org.isActive) {
    throw new AppError('The organization no longer exists.', 404);
  }

  // Already a member?
  const isMember = org.members.some((m) => m.user.toString() === userId.toString());
  if (isMember) {
    invite.status = 'accepted';
    invite.acceptedAt = new Date();
    await invite.save();
    return res.status(200).json({
      success: true,
      message: "You're already a member of this organization.",
      organization: { _id: org._id, name: org.name },
    });
  }

  // Add to org
  await Organization.findByIdAndUpdate(org._id, {
    $push: { members: { user: userId, role: invite.role, joinedAt: new Date() } },
  });

  // Mark invite accepted
  invite.status = 'accepted';
  invite.acceptedAt = new Date();
  await invite.save();

  // Notification from the system
  await Notification.create({
    recipient: userId,
    actor: invite.invitedBy,
    type: 'member_joined',
    message: `You joined "${org.name}" as ${invite.role}`,
    link: `/app`,
    meta: { organization: org._id },
  }).catch(() => {});

  res.status(200).json({
    success: true,
    message: `Welcome to ${org.name}! You joined as ${invite.role}.`,
    organization: { _id: org._id, name: org.name, role: invite.role },
  });
});

// ─────────────────────────────────────────────────────────────────
// 6. GET INVITE INFO (public — to show details before accepting)
// ─────────────────────────────────────────────────────────────────
exports.getInviteInfo = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const hashedToken = hashToken(token);

  const invite = await Invite.findOne({
    token: hashedToken,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  })
    .populate('organization', 'name description avatar')
    .populate('invitedBy', 'name avatar');

  if (!invite) {
    throw new AppError('This invite link is invalid or has expired.', 404);
  }

  // Return safe subset — no email, no token hash
  res.status(200).json({
    success: true,
    invite: {
      role: invite.role,
      expiresAt: invite.expiresAt,
      organization: invite.organization,
      invitedBy: invite.invitedBy,
    },
  });
});

// ─────────────────────────────────────────────────────────────────
// 7. REMOVE MEMBER
// ─────────────────────────────────────────────────────────────────
exports.removeMember = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.params;
  const org = req.organization;
  const requesterId = req.user.id;

  // Owner cannot remove themselves
  if (userId === org.owner.toString()) {
    throw new AppError(
      'The organization owner cannot be removed. Transfer ownership first, or delete the organization.',
      400
    );
  }

  const memberIndex = org.members.findIndex((m) => m.user.toString() === userId);
  if (memberIndex === -1) {
    throw new AppError('User is not a member of this organization.', 404);
  }

  const removedMember = org.members[memberIndex];

  org.members.splice(memberIndex, 1);
  await org.save();

  // Notify the removed user
  await Notification.create({
    recipient: userId,
    actor: requesterId,
    type: 'member_removed',
    message: `You were removed from "${org.name}"`,
    meta: { organization: org._id },
  }).catch(() => {});

  await Activity.create({
    organization: org._id,
    user: requesterId,
    action: 'member.removed',
    description: `Removed member (ID: ${userId}) from org`,
    entity: { type: 'Member', id: userId },
  }).catch(() => {});

  res.status(200).json({
    success: true,
    message: 'Member removed from organization.',
  });
});

// ─────────────────────────────────────────────────────────────────
// 8. UPDATE MEMBER ROLE
// ─────────────────────────────────────────────────────────────────
exports.updateMemberRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const org = req.organization;

  // Cannot change owner's role
  if (userId === org.owner.toString()) {
    throw new AppError(
      "The owner's role cannot be changed. Use an ownership transfer feature instead.",
      400
    );
  }

  if (!INVITE_ROLES.includes(role)) {
    throw new AppError(
      `Invalid role. Must be one of: ${INVITE_ROLES.join(', ')}`,
      400
    );
  }

  const member = org.members.find((m) => m.user.toString() === userId);
  if (!member) throw new AppError('User is not a member of this organization.', 404);

  const previousRole = member.role;
  member.role = role;
  await org.save();

  await Notification.create({
    recipient: userId,
    actor: req.user.id,
    type: 'member_role_changed',
    message: `Your role in "${org.name}" was changed to ${role}`,
    meta: { organization: org._id },
  }).catch(() => {});

  await Activity.create({
    organization: org._id,
    user: req.user.id,
    action: 'member.role_changed',
    description: `Changed member role from ${previousRole} to ${role}`,
    metadata: { from: previousRole, to: role },
    entity: { type: 'Member', id: userId },
  }).catch(() => {});

  res.status(200).json({
    success: true,
    message: `Member role updated to ${role}.`,
  });
});

// ─────────────────────────────────────────────────────────────────
// 9. DELETE ORGANIZATION (soft delete)
//
// Approach: SOFT DELETE via isActive = false
//   - Organization.isActive → false (all RBAC checks block further ops)
//   - All active projects → isArchived = true (data preserved)
//   - Notifications sent to all members
//
// Rationale:
//   - Hard delete would cascade-destroy Projects/Tasks/Bugs/Sprints/Files —
//     that's irreversible and dangerous without a "recycle bin"
//   - Soft delete preserves audit trail and enables a future "restore org" feature
//   - Projects being archived (not deleted) means their data is safe
// ─────────────────────────────────────────────────────────────────
exports.deleteOrganization = asyncHandler(async (req, res) => {
  const org = req.organization;
  const orgId = org._id;

  // Soft delete the org
  await Organization.findByIdAndUpdate(orgId, { isActive: false });

  // Cascade: archive all projects under this org
  const { modifiedCount } = await Project.updateMany(
    { organization: orgId, isArchived: false },
    { isArchived: true, archivedAt: new Date() }
  );

  // Notify all (other) members
  const memberIds = org.members
    .filter((m) => m.user.toString() !== req.user.id)
    .map((m) => m.user);

  if (memberIds.length > 0) {
    await Notification.insertMany(
      memberIds.map((uid) => ({
        recipient: uid,
        actor: req.user.id,
        type: 'member_removed',
        message: `The organization "${org.name}" was deleted by its owner`,
        meta: { organization: orgId },
      }))
    ).catch(() => {});
  }

  res.status(200).json({
    success: true,
    message: `Organization "${org.name}" has been deleted. ${modifiedCount} project(s) were archived.`,
  });
});

// ─────────────────────────────────────────────────────────────────
// 10. LIST PENDING INVITES FOR AN ORG
// ─────────────────────────────────────────────────────────────────
exports.getPendingInvites = asyncHandler(async (req, res) => {
  const { orgId } = req.params;

  const invites = await Invite.find({
    organization: orgId,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  })
    .populate('invitedBy', 'name email avatar')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: invites.length, invites });
});

// ─────────────────────────────────────────────────────────────────
// 11. REVOKE PENDING INVITE
// ─────────────────────────────────────────────────────────────────
exports.revokeInvite = asyncHandler(async (req, res) => {
  const { orgId, inviteId } = req.params;

  const invite = await Invite.findOne({ _id: inviteId, organization: orgId, status: 'pending' });
  if (!invite) throw new AppError('Invite not found or already processed.', 404);

  invite.status = 'revoked';
  await invite.save();

  res.status(200).json({ success: true, message: 'Invite revoked.' });
});
