const mongoose = require('mongoose');

/**
 * Activity Model — Audit Log / Timeline
 *
 * Powers:
 * - Per-project activity feed ("John moved task SH-42 to In Progress")
 * - Org-wide audit log for owners
 * - Analytics data (who's been active, what changed when)
 *
 * Design: append-only. Never update activity records — only insert.
 * Use TTL index to auto-purge old entries if needed.
 */

const ACTIVITY_ACTIONS = [
  // Tasks
  'task.created',
  'task.updated',
  'task.status_changed',
  'task.assigned',
  'task.completed',
  'task.deleted',
  'task.moved_to_sprint',
  'task.removed_from_sprint',
  // Sprints
  'sprint.created',
  'sprint.started',
  'sprint.completed',
  'sprint.deleted',
  // Projects
  'project.created',
  'project.updated',
  'project.archived',
  'project.deleted',
  // Bugs
  'bug.reported',
  'bug.assigned',
  'bug.status_changed',
  'bug.closed',
  // Members
  'member.invited',
  'member.joined',
  'member.removed',
  'member.role_changed',
  // Comments
  'comment.added',
  'comment.deleted',
  // Files
  'file.uploaded',
  'file.deleted',
];

const activitySchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Activity must belong to an organization'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null, // null for org-level actions (e.g. member invited)
    },
    // The user who performed the action
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Activity must have a user'],
    },
    action: {
      type: String,
      enum: {
        values: ACTIVITY_ACTIONS,
        message: 'Unknown activity action',
      },
      required: [true, 'Activity action is required'],
    },
    // Human-readable description: "John moved 'Fix login bug' to In Progress"
    description: {
      type: String,
      required: [true, 'Activity description is required'],
      maxlength: [500, 'Activity description cannot exceed 500 characters'],
    },
    // Structured payload for programmatic use (diffs, before/after values, etc.)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Entity refs — what was acted upon
    entity: {
      type: {
        type: String,
        enum: ['Task', 'Bug', 'Sprint', 'Project', 'Comment', 'File', 'Member'],
      },
      id: { type: mongoose.Schema.Types.ObjectId },
      title: { type: String }, // snapshot of entity name at time of action
    },
  },
  {
    // Use a single timestamp field named 'timestamp' for clarity
    timestamps: { createdAt: 'timestamp', updatedAt: false },
  }
);

// ── Indexes ───────────────────────────────────────────────────
activitySchema.index({ organization: 1, timestamp: -1 });         // org audit log
activitySchema.index({ project: 1, timestamp: -1 });              // project timeline
activitySchema.index({ user: 1, timestamp: -1 });                 // user activity
activitySchema.index({ organization: 1, action: 1, timestamp: -1 }); // filter by action type
// Optional TTL — purge activities older than 1 year (uncomment to enable)
// activitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const Activity = mongoose.model('Activity', activitySchema);
module.exports = { Activity, ACTIVITY_ACTIONS };
