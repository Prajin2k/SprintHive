const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middlewares/auth.middleware');
const { requireProjectRole } = require('../middlewares/rbac.middleware');
const { reportBug, getBugs, getBug, updateBug, deleteBug } = require('../controllers/bug.controller');

router.use(protect);

router.post('/', requireProjectRole(['owner', 'developer', 'tester'], { mustBeProjectMember: true }), reportBug);
router.get('/', requireProjectRole(['owner', 'manager', 'teamlead', 'developer', 'tester'], { mustBeProjectMember: true }), getBugs);
router.get('/:bugId', requireProjectRole(['owner', 'manager', 'teamlead', 'developer', 'tester'], { mustBeProjectMember: true }), getBug);
router.patch('/:bugId', requireProjectRole(['owner', 'manager', 'teamlead', 'developer', 'tester'], { mustBeProjectMember: true }), updateBug);
router.delete('/:bugId', requireProjectRole(['owner'], { mustBeProjectMember: true }), deleteBug);

module.exports = router;
