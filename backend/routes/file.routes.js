const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middlewares/auth.middleware');
const { requireTaskRole } = require('../middlewares/rbac.middleware');
const upload = require('../middlewares/upload.middleware');
const { uploadFile, getFiles, deleteFile } = require('../controllers/file.controller');

router.use(protect);

router.post('/', requireTaskRole(['owner', 'manager', 'teamlead', 'developer', 'tester']), upload.single('file'), uploadFile);
router.get('/', requireTaskRole(['owner', 'manager', 'teamlead', 'developer', 'tester']), getFiles);
router.delete('/:fileId', requireTaskRole(['owner', 'manager', 'teamlead', 'developer', 'tester']), deleteFile);

module.exports = router;
