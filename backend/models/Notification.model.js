const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'task_assigned',
  'task_unassigned',
  'task_completed',
  'task_status_changed',
  'comment_added',
  'comment_mention',
  'deadline_approaching',
  'deadline_overdue',
  'sprint_started',
  'sprint_completed',
  'bug_reported',
  'bug_assigned',
  'bug_fixed',
  'member_invited',
  'member_joined',
  'member_removed',
  'member_role_changed',
  'project_created',
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have a recipient'],
    },
    // Actor who triggered the notification (null for system notifications)
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPES,
        message: `Type must be one of the defined notification types`,
      },
      required: [true, 'Notification type is required'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      maxlength: [500, 'Notification message cannot exceed 500 characters'],
    },
    // Deep link into the app (e.g. /app/workspace/abc/tasks/def)
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // Context refs for grouping/display (optional — not all types need all)
    meta: {
      organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
      project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
      task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
      bug: { type: mongoose.Schema.Types.ObjectId, ref: 'Bug' },
      sprint: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint' },
      comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 }); // notification feed
notificationSchema.index({ recipient: 1, createdAt: -1 });             // all notifications
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // TTL: 90 days auto-purge

// ── Pre-save: stamp readAt when isRead flips ──────────────────
notificationSchema.pre('save', function (next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = { Notification, NOTIFICATION_TYPES };
