const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middlewares/auth.middleware');
const { requireProjectRole } = require('../middlewares/rbac.middleware');
const { reportBug, getBugs, getBug, updateBug, deleteBug } = require('../controllers/bug.controller');

router.use(protect);

router.post('/', requireProjectRole(['owner', 'manager', 'teamlead', 'developer', 'tester']), reportBug);
router.get('/', requireProjectRole(['owner', 'manager', 'teamlead', 'developer', 'tester']), getBugs);
router.get('/:bugId', requireProjectRole(['owner', 'manager', 'teamlead', 'developer', 'tester']), getBug);
router.patch('/:bugId', requireProjectRole(['owner', 'manager', 'teamlead', 'developer', 'tester']), updateBug);
router.delete('/:bugId', requireProjectRole(['owner', 'manager']), deleteBug);

module.exports = router;
