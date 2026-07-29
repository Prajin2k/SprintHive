const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middlewares/auth.middleware');
const { requireProjectRole } = require('../middlewares/rbac.middleware');
const { createSprint, getSprints, getSprint, updateSprint, deleteSprint, addTaskToSprint, removeTaskFromSprint } = require('../controllers/sprint.controller');

router.use(protect);

router.post('/', requireProjectRole(['owner', 'manager']), createSprint);
router.get('/', requireProjectRole(['owner', 'manager', 'teamlead', 'developer', 'tester']), getSprints);
router.get('/:sprintId', requireProjectRole(['owner', 'manager', 'teamlead', 'developer', 'tester']), getSprint);
router.patch('/:sprintId', requireProjectRole(['owner', 'manager']), updateSprint);
router.delete('/:sprintId', requireProjectRole(['owner', 'manager']), deleteSprint);

router.post('/:sprintId/tasks', requireProjectRole(['owner', 'manager', 'teamlead']), addTaskToSprint);
router.delete('/:sprintId/tasks/:taskId', requireProjectRole(['owner', 'manager', 'teamlead']), removeTaskFromSprint);

module.exports = router;
