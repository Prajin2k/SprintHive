const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { requireOrgRole } = require('../middlewares/rbac.middleware');
const { getOrgAnalytics } = require('../controllers/analytics.controller');

const ALL_ROLES = ['owner', 'manager', 'teamlead', 'developer', 'tester'];

router.use(protect);

router.get('/', requireOrgRole(ALL_ROLES), getOrgAnalytics);

module.exports = router;
