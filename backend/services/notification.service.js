const { Notification } = require('../models/Notification.model');

/**
 * Persist a notification and emit over Socket.io.
 * Failures are logged and swallowed so callers (task create, cron, etc.)
 * are not aborted by notification issues.
 */
const createAndEmitNotification = async (io, { recipient, actor, type, message, link, meta }) => {
  try {
    if (!recipient) return null;

    const notificationDoc = await Notification.create({
      recipient,
      actor,
      type,
      message,
      link,
      meta,
    });

    if (io) {
      const populated = await notificationDoc.populate('actor', 'name avatar initials');
      io.to(`user:${recipient}`).emit('notification', populated);
    }

    return notificationDoc;
  } catch (err) {
    console.error('Notification create/emit failed:', err.message);
    return null;
  }
};

module.exports = { createAndEmitNotification };
