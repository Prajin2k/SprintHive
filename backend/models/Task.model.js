const mongoose = require('mongoose');

const TASK_STATUSES = ['backlog', 'todo', 'in-progress', 'code-review', 'testing', 'completed'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Task title must be at least 3 characters'],
      maxlength: [200, 'Task title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [10000, 'Description cannot exceed 10000 characters'],
      default: '',
    },
    // Unique human-readable identifier within a project (e.g. "SH-42")
    // Set by controller on creation; stored for display and search
    taskNumber: {
      type: Number,
    },

    // ── Relationships ─────────────────────────────────────
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Task must belong to a project'],
    },
    sprint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      default: null, // null = backlog
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Task creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Reporter (may differ from creator in large orgs)
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Org-scoped Label refs
    labels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Label',
      },
    ],
    // File attachment refs (separate File documents)
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],

    // ── Status & Priority ─────────────────────────────────
    status: {
      type: String,
      enum: {
        values: TASK_STATUSES,
        message: `Status must be one of: ${TASK_STATUSES.join(', ')}`,
      },
      default: 'backlog',
    },
    priority: {
      type: String,
      enum: {
        values: TASK_PRIORITIES,
        message: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}`,
      },
      default: 'medium',
    },

    // ── Time tracking ─────────────────────────────────────
    estimatedTime: {
      type: Number, // hours
      min: [0, 'Estimated time cannot be negative'],
      max: [9999, 'Estimated time cannot exceed 9999 hours'],
      default: null,
    },
    actualTime: {
      type: Number, // hours — manually logged or computed from time entries
      min: [0, 'Actual time cannot be negative'],
      default: 0,
    },

    // ── Dates ─────────────────────────────────────────────
    deadline: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },

    // ── Sorting & ordering on Kanban column ───────────────
    // Lexorank / float position within its status column
    position: {
      type: Number,
      default: 0,
    },

    // ── Parent/child (sub-tasks) ──────────────────────────
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────
taskSchema.index({ project: 1, status: 1, position: 1 });    // Kanban column fetch
taskSchema.index({ project: 1, sprint: 1 });                  // sprint board
taskSchema.index({ project: 1, taskNumber: 1 }, { unique: true, sparse: true }); // SH-42 style refs
taskSchema.index({ assignedTo: 1, status: 1 });               // "my tasks" page
taskSchema.index({ sprint: 1, status: 1 });                   // sprint progress view
taskSchema.index({ labels: 1 });                              // label filter
taskSchema.index({ project: 1, createdAt: -1 });              // project task history
taskSchema.index({ parentTask: 1 });                          // sub-task lookup
taskSchema.index({ deadline: 1, status: 1 });                 // upcoming deadlines

// ── Virtuals ─────────────────────────────────────────────────
taskSchema.virtual('isOverdue').get(function () {
  return (
    this.deadline &&
    this.deadline < new Date() &&
    this.status !== 'completed'
  );
});

taskSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'task',
});

// ── Pre-save: stamp completedAt when status flips ─────────────
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed') {
      this.completedAt = null;
    }
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);
module.exports = { Task, TASK_STATUSES, TASK_PRIORITIES };
