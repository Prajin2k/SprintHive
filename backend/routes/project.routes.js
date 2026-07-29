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

// All project routes require authentication
router.use(protect);

// List + create — org membership enforced via query.orgId / body.organizationId
router.get('/', requireOrgRole(ALL_ROLES), getProjects);
router.post('/', requireOrgRole(OWNER_MANAGER), createProject);

// Single project routes — membership enforced by requireProjectRole
router.get('/:projectId', requireProjectRole(ALL_ROLES), getProject);
router.patch('/:projectId', requireProjectRole(OWNER_MANAGER), updateProject);
router.delete('/:projectId', requireProjectRole(['owner']), deleteProject);

router.post('/:projectId/members', requireProjectRole(OWNER_MANAGER), addMember);
router.delete('/:projectId/members/:userId', requireProjectRole(OWNER_MANAGER), removeMember);

router.get('/:projectId/report', requireProjectRole(['owner', 'manager', 'teamlead']), getProjectReport);

// Sprint subroutes — mounted with mergeParams so :projectId is accessible
router.use('/:projectId/sprints', require('./sprint.routes'));

module.exports = router;
