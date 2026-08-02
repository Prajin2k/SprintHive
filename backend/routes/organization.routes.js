/**
 * Organization Routes
 * Mounted at: /api/organizations
 */

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const orgController = require('../controllers/organization.controller');
const { protect } = require('../middlewares/auth.middleware');
const { requireOrgRole } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');

// ── Validation chains ───────────────────────────────────────────

const createOrgValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Organization name is required')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
];

const inviteValidation = [
  body('email')
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),
  body('role')
    .isIn(['manager', 'teamlead', 'developer', 'tester'])
    .withMessage('Role must be: manager, teamlead, developer, or tester'),
];

const updateRoleValidation = [
  body('role')
    .isIn(['manager', 'teamlead', 'developer', 'tester'])
    .withMessage('Role must be: manager, teamlead, developer, or tester'),
];

// All roles shorthand (any member can access)
const ALL_ROLES = ['owner', 'manager', 'teamlead', 'developer', 'tester'];
const OWNER_MANAGER = ['owner', 'manager'];

// ── Public routes ───────────────────────────────────────────────

// Get invite details (to show info before user logs in / accepts)
router.get('/invites/:token', orgController.getInviteInfo);

// Accept invite (authenticated — must be logged in with matching email)
router.post('/invites/:token/accept', protect, orgController.acceptInvite);

// ── Authenticated routes ────────────────────────────────────────

// Create org (any authenticated user can create an org)
router.post('/', protect, createOrgValidation, validate, orgController.createOrganization);

// List orgs the logged-in user belongs to
router.get('/', protect, orgController.getMyOrganizations);

// ── Org-scoped routes (require membership) ──────────────────────

// Get single org details (any member)
router.get(
  '/:orgId',
  protect,
  requireOrgRole(ALL_ROLES),
  orgController.getOrganization
);

// List pending invites (owner or manager)
router.get(
  '/:orgId/invites',
  protect,
  requireOrgRole(OWNER_MANAGER),
  orgController.getPendingInvites
);

// Invite a member (owner or manager)
router.post(
  '/:orgId/invite',
  protect,
  requireOrgRole(OWNER_MANAGER),
  inviteValidation,
  validate,
  orgController.inviteMember
);

// Revoke a pending invite (owner or manager)
router.delete(
  '/:orgId/invites/:inviteId',
  protect,
  requireOrgRole(OWNER_MANAGER),
  orgController.revokeInvite
);

// Remove a member (owner or manager)
router.delete(
  '/:orgId/members/:userId',
  protect,
  requireOrgRole(OWNER_MANAGER),
  orgController.removeMember
);

// Update member role (owner or manager)
router.patch(
  '/:orgId/members/:userId',
  protect,
  requireOrgRole(OWNER_MANAGER),
  updateRoleValidation,
  validate,
  orgController.updateMemberRole
);

// Delete organization (owner only)
router.delete(
  '/:orgId',
  protect,
  requireOrgRole(['owner']),
  orgController.deleteOrganization
);

module.exports = router;
