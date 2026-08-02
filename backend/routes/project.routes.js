const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { requireProjectRole, requireOrgRole } = require('../middlewares/rbac.middleware');
const {
  createProject, getProjects, getProject, updateProject,
  deleteProject, addMember, removeMember, getProjectReport
} = require('../controllers/project.controller');

const ALL_ROLES = ['owner', 'manager', 'teamlead', 'developer', 'tester'];
const OWNER_MANAGER = ['owner', 'manager'];
const PROJECT_ADMINS = ['owner', 'manager', 'teamlead'];

// All project routes require authentication
router.use(protect);

// List + create — org membership enforced via query.orgId / body.organizationId
router.get('/', requireOrgRole(ALL_ROLES), getProjects);
router.post('/', requireOrgRole(PROJECT_ADMINS), createProject);

// Single project routes — membership enforced by requireProjectRole
router.get('/:projectId', requireProjectRole(ALL_ROLES, { mustBeProjectMember: true }), getProject);
router.patch('/:projectId', requireProjectRole(PROJECT_ADMINS, { mustBeProjectMember: true }), updateProject);
router.delete('/:projectId', requireProjectRole(['owner'], { mustBeProjectMember: true }), deleteProject);

router.post('/:projectId/members', requireProjectRole(OWNER_MANAGER, { mustBeProjectMember: true }), addMember);
router.delete('/:projectId/members/:userId', requireProjectRole(OWNER_MANAGER, { mustBeProjectMember: true }), removeMember);

router.get('/:projectId/report', requireProjectRole(['owner', 'manager', 'teamlead'], { mustBeProjectMember: true }), getProjectReport);

// Sprint subroutes — mounted with mergeParams so :projectId is accessible
router.use('/:projectId/sprints', require('./sprint.routes'));

module.exports = router;
