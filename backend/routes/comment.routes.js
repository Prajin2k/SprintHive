const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middlewares/auth.middleware');
const { requireTaskRole } = require('../middlewares/rbac.middleware');
const { addComment, getComments, deleteComment } = require('../controllers/comment.controller');

router.use(protect);

// Assuming task route middleware sets things up or we just allow task access
// According to request, use requireTaskRole for membership check.
router.post('/', requireTaskRole(['owner', 'manager', 'teamlead', 'developer', 'tester']), addComment);
router.get('/', requireTaskRole(['owner', 'manager', 'teamlead', 'developer', 'tester']), getComments);
router.delete('/:commentId', requireTaskRole(['owner', 'manager', 'teamlead', 'developer', 'tester']), deleteComment);

module.exports = router;
