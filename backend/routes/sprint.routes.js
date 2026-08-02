const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middlewares/auth.middleware');
const { requireProjectRole } = require('../middlewares/rbac.middleware');
const { createSprint, getSprints, getSprint, updateSprint, deleteSprint, addTaskToSprint, removeTaskFromSprint } = require('../controllers/sprint.controller');

router.use(protect);

router.post('/', requireProjectRole(['owner', 'manager', 'teamlead'], { mustBeProjectMember: true }), createSprint);
router.get('/', requireProjectRole(['owner', 'manager', 'teamlead', 'developer', 'tester'], { mustBeProjectMember: true }), getSprints);
router.get('/:sprintId', requireProjectRole(['owner', 'manager', 'teamlead', 'developer', 'tester'], { mustBeProjectMember: true }), getSprint);
router.patch('/:sprintId', requireProjectRole(['owner', 'manager', 'teamlead'], { mustBeProjectMember: true }), updateSprint);
router.delete('/:sprintId', requireProjectRole(['owner', 'manager', 'teamlead'], { mustBeProjectMember: true }), deleteSprint);
router.post('/:sprintId/tasks', requireProjectRole(['owner', 'manager', 'teamlead'], { mustBeProjectMember: true }), addTaskToSprint);
router.delete('/:sprintId/tasks/:taskId', requireProjectRole(['owner', 'manager', 'teamlead'], { mustBeProjectMember: true }), removeTaskFromSprint);
module.exports = router;
