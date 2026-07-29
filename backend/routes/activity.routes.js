const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { requireOrgRole } = require('../middlewares/rbac.middleware');
const { getOrgActivities } = require('../controllers/activity.controller');

const ALL_ROLES = ['owner', 'manager', 'teamlead', 'developer', 'tester'];

router.use(protect);

// orgId comes from query — requireOrgRole resolves it
router.get('/', requireOrgRole(ALL_ROLES), getOrgActivities);

module.exports = router;
