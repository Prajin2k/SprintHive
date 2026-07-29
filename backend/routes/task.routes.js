const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middlewares/auth.middleware');
const { requireProjectRole } = require('../middlewares/rbac.middleware');
const { createTask, getTasks, getTask, updateTask, deleteTask, bulkUpdateStatus } = require('../controllers/task.controller');

router.use(protect);

router.post('/', requireProjectRole(['owner', 'manager', 'teamlead']), createTask);
router.get('/', requireProjectRole(['owner', 'manager', 'teamlead', 'developer', 'tester']), getTasks);

router.patch('/bulk-status', requireProjectRole(['owner', 'manager', 'teamlead', 'developer', 'tester']), bulkUpdateStatus);

router.get('/:taskId', requireProjectRole(['owner', 'manager', 'teamlead', 'developer', 'tester']), getTask);
router.patch('/:taskId', requireProjectRole(['owner', 'manager', 'teamlead', 'developer', 'tester']), updateTask);
router.delete('/:taskId', requireProjectRole(['owner', 'manager', 'teamlead']), deleteTask);

module.exports = router;
