const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { getNotifications, markRead, markAllRead, getUnreadCount } = require('../controllers/notification.controller');

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

module.exports = router;
