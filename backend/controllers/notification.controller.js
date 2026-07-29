const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { Notification } = require('../models/Notification.model');

const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const notifications = await Notification.find({ recipient: req.user.id })
    .sort({ isRead: 1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('actor', 'name avatar initials');

  res.status(200).json({ success: true, data: notifications });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { isRead: true },
    { new: true }
  );

  if (!notification) throw new AppError('Notification not found', 404);

  res.status(200).json({ success: true, data: notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user.id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({ success: true, data: {} });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
  res.status(200).json({ success: true, data: { count } });
});

module.exports = { getNotifications, markRead, markAllRead, getUnreadCount };
