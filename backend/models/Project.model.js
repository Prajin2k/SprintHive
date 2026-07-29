const mongoose = require('mongoose');

const PROJECT_STATUSES = ['planning', 'active', 'on-hold', 'completed', 'archived'];
const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'critical'];

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters'],
      maxlength: [120, 'Project name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Project must belong to an organization'],
    },
    // Project-level members are a subset of the org members
    // Stored as refs to User (role is still resolved from org membership)
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // The Project Manager assigned to this project
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: {
        values: PROJECT_STATUSES,
        message: `Status must be one of: ${PROJECT_STATUSES.join(', ')}`,
      },
      default: 'planning',
    },
    priority: {
      type: String,
      enum: {
        values: PROJECT_PRIORITIES,
        message: `Priority must be one of: ${PROJECT_PRIORITIES.join(', ')}`,
      },
      default: 'medium',
    },
    // Computed or manually managed — will be recalculated when tasks complete
    progress: {
      type: Number,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100'],
      default: 0,
    },
    deadline: {
      type: Date,
    },
    startDate: {
      type: Date,
    },
    // Cover image / icon for the project card
    coverColor: {
      type: String,
      default: '#f97316', // brand orange fallback
      match: [/^#[0-9A-Fa-f]{6}$/, 'Cover color must be a valid hex color'],
    },
    // Tech stack tags (freeform strings, not a separate model — low enough cardinality)
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'A project can have at most 10 tags',
      },
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────
projectSchema.index({ organization: 1, status: 1 });           // org's active projects
projectSchema.index({ organization: 1, priority: 1 });         // org's priority board
projectSchema.index({ organization: 1, createdAt: -1 });       // org's project list (sorted)
projectSchema.index({ members: 1 });                           // "projects I'm in"
projectSchema.index({ manager: 1 });                           // PM's project list
projectSchema.index({ isArchived: 1, organization: 1 });       // archive filter

// ── Virtual: isOverdue ────────────────────────────────────────
projectSchema.virtual('isOverdue').get(function () {
  return this.deadline && this.deadline < new Date() && this.status !== 'completed';
});

// ── Pre-save: set archivedAt when isArchived flips ────────────
projectSchema.pre('save', function (next) {
  if (this.isModified('isArchived') && this.isArchived) {
    this.archivedAt = new Date();
  }
  next();
});

const Project = mongoose.model('Project', projectSchema);
module.exports = { Project, PROJECT_STATUSES, PROJECT_PRIORITIES };
