const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Comment = require('../models/Comment.model');  // default export
const { Task } = require('../models/Task.model');
const { createAndEmitNotification } = require('../services/notification.service');

const addComment = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { content, contentType, mentions, attachments } = req.body;
  const io = req.app.get('io');

  const task = await Task.findById(taskId);
  if (!task) throw new AppError('Task not found', 404);

  const comment = await Comment.create({
    content, contentType, mentions, attachments,
    task: taskId, author: req.user.id
  });

  const populatedComment = await comment.populate('author', 'name email avatar initials');

  if (io) io.to(`task:${taskId}`).emit('comment:new', populatedComment);

  if (task.assignedTo && String(task.assignedTo) !== String(req.user.id)) {
    await createAndEmitNotification(io, {
      recipient: task.assignedTo,
      actor: req.user.id,
      type: 'comment_added',
      message: `${req.user.name || 'Someone'} commented on your task`,
      link: `/projects/${task.project}/tasks/${taskId}`,
      meta: { project: task.project, task: taskId, comment: comment._id },
    });
  }

  // Notify explicitly mentioned users
  if (Array.isArray(mentions) && mentions.length > 0) {
    for (const mentionUserId of mentions) {
      if (String(mentionUserId) === String(req.user.id)) continue;
      try {
        await createAndEmitNotification(io, {
          recipient: mentionUserId,
          actor: req.user.id,
          type: 'comment_mention',
          message: `${req.user.name || 'Someone'} mentioned you in a comment`,
          link: `/projects/${task.project}/tasks/${taskId}`,
          meta: { project: task.project, task: taskId, comment: comment._id },
        });
      } catch (err) {
        console.error(`Mention notification failed for ${mentionUserId}:`, err.message);
      }
    }
  }

  res.status(201).json({ success: true, data: populatedComment });
});

const getComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ task: req.params.taskId, isDeleted: false })
    .populate('author', 'name email avatar initials')
    .sort({ createdAt: 1 });
    
  res.status(200).json({ success: true, data: comments });
});

const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw new AppError('Comment not found', 404);

  const isAuthor = String(comment.author) === String(req.user.id);
  const isManagerOrOwner = ['owner', 'manager'].includes(req.userOrgRole);

  if (!isAuthor && !isManagerOrOwner) {
    throw new AppError('Not authorized to delete this comment', 403);
  }

  comment.isDeleted = true;
  comment.deletedAt = new Date();
  await comment.save();

  res.status(200).json({ success: true, data: {} });
});

module.exports = { addComment, getComments, deleteComment };
