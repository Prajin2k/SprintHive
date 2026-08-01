/**
 * RBAC Middleware — Role-Based Access Control
 *
 * Roles are stored on Organization.members[].role — NOT on the User model.
 * One user can be 'owner' in Org A and 'developer' in Org B.
 *
 * All middleware below:
 * 1. Resolves the target Organization from the request context
 * 2. Looks up the calling user's membership in that specific org
 * 3. Checks if their role is in the allowed list
 * 4. Attaches req.orgMembership and req.userOrgRole for downstream use
 *
 * Usage in routes:
 *   router.delete('/:orgId', protect, requireOrgRole(['owner']), deleteOrg);
 *   router.post('/:projectId/tasks', protect, requireProjectRole(['owner','manager','teamlead']), createTask);
 *   router.patch('/tasks/:taskId', protect, requireTaskRole(['owner','manager','teamlead','developer']), updateTask);
 */

const { Organization } = require('../models/Organization.model');
const { Project } = require('../models/Project.model');
const { Task } = require('../models/Task.model');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ── Role hierarchy (higher index = more privileged) ───────────
const ROLE_HIERARCHY = ['tester', 'developer', 'teamlead', 'manager', 'owner'];

/**
 * Internal: resolve org from request, populate membership.
 * Sets req.organization and req.userOrgRole on the request object.
 */
const resolveOrgMembership = async (orgId, userId) => {
  if (!orgId) {
    throw new AppError('Organization context is missing from this request.', 400);
  }

  // Load organization for basic context (owner, isActive)
  const org = await Organization.findById(orgId).select('members owner isActive');

  if (!org) {
    throw new AppError('Organization not found.', 404);
  }

  if (!org.isActive) {
    throw new AppError('This organization has been deactivated.', 403);
  }

  // Prefer OrganizationMember collection for membership resolution if available
  let membership = null;
  try {
    // Lazy-require so code remains compatible if model is not present
    const { OrganizationMember } = require('../models/OrganizationMember.model');
    const memberDoc = await OrganizationMember.findOne({ organization: orgId, user: userId });
    if (memberDoc && memberDoc.status === 'active') {
      membership = {
        user: memberDoc.user,
        role: memberDoc.role,
        joinedAt: memberDoc.joinedAt,
        _id: memberDoc._id,
      };
    }
  } catch (e) {
    // Model might not exist in older deployments — ignore and fallback
  }

  // Fallback to embedded Organization.members[] for backwards compatibility
  if (!membership) {
    const found = org.members.find((m) => m.user.toString() === userId.toString());
    if (!found) {
      throw new AppError('You are not a member of this organization.', 403);
    }
    membership = found;
  }

  return { org, membership, role: membership.role };
};

// ─────────────────────────────────────────────────────────────
// 1. requireOrgRole — for routes with :orgId param
// ─────────────────────────────────────────────────────────────
/**
 * @param {string[]} allowedRoles - e.g. ['owner', 'manager']
 */
const requireOrgRole = (allowedRoles) =>
  asyncHandler(async (req, res, next) => {
    const orgId = req.params.orgId || req.body.organizationId || req.query.orgId;

    const { org, membership, role } = await resolveOrgMembership(orgId, req.user.id);

    if (!allowedRoles.includes(role)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${role}.`,
          403
        )
      );
    }

    // Attach to req for downstream controller use
    req.organization = org;
    req.orgMembership = membership;
    req.userOrgRole = role;

    next();
  });

// ─────────────────────────────────────────────────────────────
// 2. requireProjectRole — for routes with :projectId param
//    Resolves org through the project
// ─────────────────────────────────────────────────────────────
/**
 * @param {string[]} allowedRoles
 * @param {Object} options
 * @param {boolean} options.mustBeProjectMember - also enforce project-level membership check
 */
const requireProjectRole = (allowedRoles, options = {}) =>
  asyncHandler(async (req, res, next) => {
    const projectId = req.params.projectId || req.body.projectId;

    if (!projectId) {
      return next(new AppError('Project context is missing from this request.', 400));
    }

    const project = await Project.findById(projectId).select('organization members isArchived');

    if (!project) {
      return next(new AppError('Project not found.', 404));
    }

    if (project.isArchived) {
      return next(new AppError('This project is archived and cannot be modified.', 403));
    }

    const { org, membership, role } = await resolveOrgMembership(
      project.organization,
      req.user.id
    );

    if (!allowedRoles.includes(role)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${role}.`,
          403
        )
      );
    }

    // Optional: also check the user is explicitly added to this project's member list
    if (options.mustBeProjectMember) {
      const isProjectMember = project.members.some(
        (m) => m.toString() === req.user.id.toString()
      );
      // Owners and managers bypass the project-member check
      if (!isProjectMember && !['owner', 'manager'].includes(role)) {
        return next(new AppError('You are not a member of this project.', 403));
      }
    }

    req.project = project;
    req.organization = org;
    req.orgMembership = membership;
    req.userOrgRole = role;

    next();
  });

// ─────────────────────────────────────────────────────────────
// 3. requireTaskRole — for task-level routes (:taskId param)
//    Resolves org through task → project → org
// ─────────────────────────────────────────────────────────────
const requireTaskRole = (allowedRoles) =>
  asyncHandler(async (req, res, next) => {
    const taskId = req.params.taskId || req.body.taskId;

    if (!taskId) {
      return next(new AppError('Task context is missing from this request.', 400));
    }

    const task = await Task.findById(taskId).select('project assignedTo createdBy');

    if (!task) {
      return next(new AppError('Task not found.', 404));
    }

    const project = await Project.findById(task.project).select('organization isArchived');

    if (!project || project.isArchived) {
      return next(new AppError('Associated project not found or archived.', 404));
    }

    const { org, membership, role } = await resolveOrgMembership(
      project.organization,
      req.user.id
    );

    if (!allowedRoles.includes(role)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${role}.`,
          403
        )
      );
    }

    req.task = task;
    req.project = project;
    req.organization = org;
    req.orgMembership = membership;
    req.userOrgRole = role;

    next();
  });

// ─────────────────────────────────────────────────────────────
// 4. requireMinRole — role-hierarchy based (e.g. "at least teamlead")
//    Use when you want "teamlead or above" without listing every role
// ─────────────────────────────────────────────────────────────
/**
 * @param {string} minRole - minimum role required (inclusive)
 * orgId is resolved from req.params.orgId
 */
const requireMinOrgRole = (minRole) =>
  asyncHandler(async (req, res, next) => {
    const orgId = req.params.orgId || req.body.organizationId;
    const { membership, role } = await resolveOrgMembership(orgId, req.user.id);

    const minIndex = ROLE_HIERARCHY.indexOf(minRole);
    const userIndex = ROLE_HIERARCHY.indexOf(role);

    if (minIndex === -1) {
      return next(new AppError(`Invalid role specified: ${minRole}`, 500));
    }

    if (userIndex < minIndex) {
      return next(
        new AppError(
          `Access denied. Minimum required role: ${minRole}. Your role: ${role}.`,
          403
        )
      );
    }

    req.orgMembership = membership;
    req.userOrgRole = role;
    next();
  });

// ─────────────────────────────────────────────────────────────
// 5. isSelfOrRole — allow if user is acting on themselves OR has role
//    e.g. update your own profile, OR be an admin
// ─────────────────────────────────────────────────────────────
const isSelfOrOrgRole = (paramUserId, allowedRoles, orgIdParam = 'orgId') =>
  asyncHandler(async (req, res, next) => {
    const targetUserId = req.params[paramUserId];

    // Allow if acting on self
    if (targetUserId && targetUserId.toString() === req.user.id.toString()) {
      return next();
    }

    // Otherwise require org role
    return requireOrgRole(allowedRoles)(req, res, next);
  });

module.exports = {
  requireOrgRole,
  requireProjectRole,
  requireTaskRole,
  requireMinOrgRole,
  isSelfOrOrgRole,
  ROLE_HIERARCHY,
};
