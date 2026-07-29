const mongoose = require('mongoose');

/**
 * Comment Model
 *
 * Design decision: Comments are a SEPARATE COLLECTION (not embedded in Task).
 *
 * Reasons:
 * 1. Pagination — we can cursor-paginate comments without loading the entire task document
 * 2. Queryability — find all comments by a user across all tasks; search comment content
 * 3. Real-time — emit comment events via Socket.io with the comment's own _id
 * 4. Avoiding document growth — MongoDB documents have a 16MB hard limit;
 *    tasks with heavy comment threads would balloon and slow array updates
 * 5. Edit/delete individual comments without $pull array ops on Task
 *
 * Tradeoff: requires an extra query/join to show task + comments, but for a
 * SaaS app with potential thousands of comments per task this is the right call.
 */

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment must have an author'],
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Comment must be linked to a task'],
    },
    // Optional — link to a Bug as well
    bug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bug',
      default: null,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [5000, 'Comment cannot exceed 5000 characters'],
      trim: true,
    },
    // Markdown supported — store raw markdown, render on client
    contentType: {
      type: String,
      enum: ['text', 'markdown'],
      default: 'markdown',
    },
    // Mentions — array of user refs extracted from @mentions in content
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Attachments in comments (inline images, etc.)
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    // Edit history
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    // Soft delete — keep for audit trail
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    // Thread reply support (one level deep)
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    // Emoji reactions { emoji: '👍', users: [userId, ...] }
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        _id: false,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────
commentSchema.index({ task: 1, createdAt: 1 });          // paginated comment thread
commentSchema.index({ bug: 1, createdAt: 1 });           // bug comments
commentSchema.index({ author: 1, createdAt: -1 });        // user's comment history
commentSchema.index({ parentComment: 1 });               // thread replies
commentSchema.index({ mentions: 1 });                    // @mention notifications

// ── Pre-save: stamp editedAt ──────────────────────────────────
commentSchema.pre('save', function (next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
