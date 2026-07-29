const mongoose = require('mongoose');

const FILE_TYPES = ['image', 'document', 'video', 'archive', 'other'];

const fileSchema = new mongoose.Schema(
  {
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'File must have an uploader'],
    },
    // Context: where the file lives
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    bug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bug',
      default: null,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    // For avatar/logo uploads, we store the organization or user ref
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },

    // ── File metadata ─────────────────────────────────────
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      maxlength: [255, 'File name cannot exceed 255 characters'],
    },
    filename: {
      type: String, // stored filename on disk or Cloudinary public_id
      required: [true, 'Stored filename is required'],
    },
    url: {
      type: String,
      required: [true, 'File URL is required'],
    },
    // Cloudinary public ID (null for local storage)
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    mimetype: {
      type: String,
      required: [true, 'File MIME type is required'],
    },
    type: {
      type: String,
      enum: FILE_TYPES,
      required: true,
    },
    size: {
      type: Number, // bytes
      required: [true, 'File size is required'],
      min: [1, 'File size must be at least 1 byte'],
      max: [10 * 1024 * 1024, 'File size cannot exceed 10MB'],
    },
    // Storage provider
    provider: {
      type: String,
      enum: ['cloudinary', 'local'],
      default: 'local',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────
fileSchema.index({ task: 1, createdAt: -1 });            // task attachments
fileSchema.index({ bug: 1, createdAt: -1 });             // bug attachments
fileSchema.index({ uploader: 1, createdAt: -1 });        // files I uploaded
fileSchema.index({ organization: 1, type: 1 });          // org file browser

// ── Virtual: sizeFormatted ────────────────────────────────────
fileSchema.virtual('sizeFormatted').get(function () {
  const bytes = this.size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
});

// ── Static: derive type from MIME ─────────────────────────────
fileSchema.statics.getTypeFromMime = function (mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (
    mimetype.includes('pdf') ||
    mimetype.includes('word') ||
    mimetype.includes('text') ||
    mimetype.includes('spreadsheet') ||
    mimetype.includes('presentation')
  )
    return 'document';
  if (mimetype.includes('zip') || mimetype.includes('tar') || mimetype.includes('gz'))
    return 'archive';
  return 'other';
};

const File = mongoose.model('File', fileSchema);
module.exports = { File, FILE_TYPES };
