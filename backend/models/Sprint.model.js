const mongoose = require('mongoose');

const SPRINT_STATUSES = ['planned', 'active', 'completed'];

const sprintSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sprint name is required'],
      trim: true,
      minlength: [2, 'Sprint name must be at least 2 characters'],
      maxlength: [100, 'Sprint name cannot exceed 100 characters'],
    },
    goal: {
      type: String,
      maxlength: [500, 'Sprint goal cannot exceed 500 characters'],
      default: '',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Sprint must belong to a project'],
    },
    // Tasks refs — bidirectional with Task.sprint
    // NOTE: Task.sprint is the authoritative side for assignment.
    // Sprint.tasks is a convenience cache — always sync both in controllers.
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    status: {
      type: String,
      enum: {
        values: SPRINT_STATUSES,
        message: `Status must be one of: ${SPRINT_STATUSES.join(', ')}`,
      },
      default: 'planned',
    },
    startDate: {
      type: Date,
      required: [true, 'Sprint start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'Sprint end date is required'],
      validate: {
        validator: function (endDate) {
          return endDate > this.startDate;
        },
        message: 'Sprint end date must be after start date',
      },
    },
    // Who kicked off and closed the sprint
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    completedAt: {
      type: Date,
    },
    // Capacity in story points or hours (optional)
    capacity: {
      type: Number,
      min: [0, 'Capacity cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────
sprintSchema.index({ project: 1, status: 1 });                // active sprint for project
sprintSchema.index({ project: 1, startDate: -1 });            // sprint history
sprintSchema.index({ project: 1, endDate: 1 });               // upcoming sprints

// ── Virtuals ─────────────────────────────────────────────────
sprintSchema.virtual('duration').get(function () {
  if (!this.startDate || !this.endDate) return null;
  const ms = this.endDate - this.startDate;
  return Math.ceil(ms / (1000 * 60 * 60 * 24)); // days
});

sprintSchema.virtual('isOverdue').get(function () {
  return this.status !== 'completed' && this.endDate < new Date();
});

// ── Validation: only one ACTIVE sprint per project ───────────
// Enforced at the controller layer (can't do unique partial index on status='active'
// with Mongoose easily — enforce in business logic instead)

const Sprint = mongoose.model('Sprint', sprintSchema);
module.exports = { Sprint, SPRINT_STATUSES };
