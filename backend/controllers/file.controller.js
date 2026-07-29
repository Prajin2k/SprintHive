const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { File: FileModel } = require('../models/File.model');
const { Task } = require('../models/Task.model');
const cloudinary = require('cloudinary').v2;

const uploadFile = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const file = req.file;
  if (!file) throw new AppError('No file uploaded', 400);

  const task = await Task.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);

  // Determine file type from MIME
  const type = FileModel.getTypeFromMime(file.mimetype);

  let fileUrl = '';
  let provider = 'local';
  let cloudinaryPublicId = null;

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: 'auto',
        folder: 'sprint-hive',
      });
      fileUrl = result.secure_url;
      cloudinaryPublicId = result.public_id;
      provider = 'cloudinary';
    } catch (err) {
      console.warn('Cloudinary upload failed, falling back to local:', err.message);
      fileUrl = `/uploads/${file.filename}`;
    }
  } else {
    fileUrl = `/uploads/${file.filename}`;
  }

  const fileDoc = await FileModel.create({
    uploader: req.user.id,
    task: taskId,
    organization: req.organization?._id || null,
    originalName: file.originalname,
    filename: file.filename || file.originalname,
    url: fileUrl,
    cloudinaryPublicId,
    mimetype: file.mimetype,
    type,
    size: file.size,
    provider,
  });

  // Link file to task
  await Task.findByIdAndUpdate(taskId, { $addToSet: { attachments: fileDoc._id } });

  res.status(201).json({ success: true, data: fileDoc });
});

const getFiles = asyncHandler(async (req, res) => {
  const files = await FileModel.find({ task: req.params.taskId, isDeleted: false })
    .populate('uploader', 'name avatar initials')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: files });
});

const deleteFile = asyncHandler(async (req, res) => {
  const file = await FileModel.findById(req.params.fileId);
  if (!file) throw new AppError('File not found', 404);

  // Permission: uploader OR owner/manager
  const isUploader = String(file.uploader) === String(req.user.id);
  const isManagerOrOwner = ['owner', 'manager'].includes(req.userOrgRole);

  if (!isUploader && !isManagerOrOwner) {
    throw new AppError('Not authorized to delete this file', 403);
  }

  // Delete from Cloudinary if applicable
  if (file.provider === 'cloudinary' && file.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(file.cloudinaryPublicId, {
      resource_type: file.type === 'image' ? 'image' : 'raw',
    }).catch(() => {});
  }

  // Soft delete
  file.isDeleted = true;
  file.deletedAt = new Date();
  await file.save();

  // Remove from task attachments
  await Task.findByIdAndUpdate(file.task, { $pull: { attachments: file._id } });

  res.status(200).json({ success: true, data: {} });
});

module.exports = { uploadFile, getFiles, deleteFile };
