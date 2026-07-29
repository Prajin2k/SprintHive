const mongoose = require('mongoose');

const BUG_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const BUG_STATUSES = ['open', 'in-progress', 'fixed', 'verified', 'closed'];

const bugSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Bug title is required'],
      trim: true,
      minlength: [5, 'Bug title must be at least 5 characters'],
      maxlength: [200, 'Bug title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Bug description is required'],
      minlength: [10, 'Bug description must be at least 10 characters'],
      maxlength: [10000, 'Bug description cannot exceed 10000 characters'],
    },

    // ── Bug tracking details ──────────────────────────────
    stepsToReproduce: {
      type: String,
      maxlength: [5000, 'Steps to reproduce cannot exceed 5000 characters'],
      default: '',
    },
    expectedBehavior: {
      type: String,
      maxlength: [2000, 'Expected behavior cannot exceed 2000 characters'],
      default: '',
    },
    actualBehavior: {
      type: String,
      maxlength: [2000, 'Actual behavior cannot exceed 2000 characters'],
      default: '',
    },
    environment: {
      // e.g. "Chrome 118, macOS 14.0"
      type: String,
      maxlength: [200, 'Environment string cannot exceed 200 characters'],
      default: '',
    },

    // ── Enums ─────────────────────────────────────────────
    priority: {
      type: String,
      enum: {
        values: BUG_PRIORITIES,
        message: `Priority must be one of: ${BUG_PRIORITIES.join(', ')}`,
      },
      required: [true, 'Bug priority is required'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: {
        values: BUG_STATUSES,
        message: `Status must be one of: ${BUG_STATUSES.join(', ')}`,
      },
      default: 'open',
    },

    // ── Relationships ─────────────────────────────────────
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Bug must belong to a project'],
    },
    // Optional — link bug to a specific task
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    // Reporter (QA engineer who found it)
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Bug must have a reporter'],
    },
    // Developer assigned to fix it
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // QA who verified the fix
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Timestamps for status transitions ─────────────────
    fixedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },

    // ── Attachments (screenshots, logs) ───────────────────
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],

    labels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Label',
      },
    ],

    bugNumber: {
      type: Number, // e.g. BUG-7
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────
bugSchema.index({ project: 1, status: 1 });           // project bug board
bugSchema.index({ project: 1, priority: 1 });          // critical bugs first
bugSchema.index({ project: 1, bugNumber: 1 }, { unique: true, sparse: true });
bugSchema.index({ assignedTo: 1, status: 1 });         // assigned to me
bugSchema.index({ reportedBy: 1 });                    // bugs I reported
bugSchema.index({ task: 1 });                          // bugs linked to a task
bugSchema.index({ project: 1, createdAt: -1 });

// ── Pre-save: stamp status transition timestamps ───────────────
bugSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    const now = new Date();
    if (this.status === 'fixed' && !this.fixedAt) this.fixedAt = now;
    if (this.status === 'verified' && !this.verifiedAt) this.verifiedAt = now;
    if (this.status === 'closed' && !this.closedAt) this.closedAt = now;
  }
  next();
});

// ── Virtual: resolution time (hours) ─────────────────────────
bugSchema.virtual('resolutionTime').get(function () {
  if (!this.fixedAt || !this.createdAt) return null;
  return Math.round((this.fixedAt - this.createdAt) / (1000 * 60 * 60));
});

const Bug = mongoose.model('Bug', bugSchema);
module.exports = { Bug, BUG_PRIORITIES, BUG_STATUSES };
