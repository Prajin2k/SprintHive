const mongoose = require('mongoose');

/**
 * Label Model — Organization-scoped
 *
 * Design decision: Labels are scoped to the ORGANIZATION, not individual projects.
 *
 * Rationale:
 * - Labels like "bug", "feature", "urgent", "needs-design" are team conventions
 *   that naturally apply across all projects within an org.
 * - Project-level scoping forces every project to re-create the same labels
 *   (e.g. every project needs its own "bug" label) — a UX anti-pattern.
 * - Org-level labels can be filtered by project at query time (e.g. "show only
 *   labels used in project X") without duplicating the label documents.
 * - This mirrors how GitHub organizations and Linear handle labels.
 *
 * If a project needs truly isolated labels in the future, add an optional
 * `project` field to narrow the scope — but the default remains org-wide.
 */

// Curated palette — maps to CSS color tokens on the frontend
const LABEL_COLORS = [
  '#ef4444', // red
  '#f97316', // orange (brand)
  '#f59e0b', // amber
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#64748b', // slate
  '#84cc16', // lime
];

const labelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Label name is required'],
      trim: true,
      minlength: [1, 'Label name must be at least 1 character'],
      maxlength: [50, 'Label name cannot exceed 50 characters'],
    },
    color: {
      type: String,
      required: [true, 'Label color is required'],
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g. #f97316)'],
      default: '#3b82f6',
    },
    description: {
      type: String,
      maxlength: [200, 'Label description cannot exceed 200 characters'],
      default: '',
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Label must belong to an organization'],
    },
    // Optional: restrict label to a specific project (future enhancement)
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
// Compound unique: same label name cannot exist twice in the same org
labelSchema.index({ organization: 1, name: 1 }, { unique: true });
labelSchema.index({ organization: 1, project: 1 });   // project-filtered labels
labelSchema.index({ organization: 1, isArchived: 1 }); // active labels

// Export colors for frontend validation
labelSchema.statics.PALETTE = LABEL_COLORS;

const Label = mongoose.model('Label', labelSchema);
module.exports = { Label, LABEL_COLORS };
