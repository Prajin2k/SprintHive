const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { Task } = require('../models/Task.model');
const { Sprint } = require('../models/Sprint.model');
const { Activity } = require('../models/Activity.model');
const { recalculateProgress } = require('../services/progress.service');
const { createAndEmitNotification } = require('../services/notification.service');
const { getNextSequence } = require('../utils/counters');

const TASK_WRITABLE_FIELDS = [
  'title', 'description', 'status', 'priority', 'assignedTo', 'sprint',
  'labels', 'deadline', 'estimatedTime', 'actualTime', 'position', 'parentTask', 'reporter',
];

const pickTaskFields = (body) => {
  const data = {};
  for (const key of TASK_WRITABLE_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
};

/** Keep Sprint.tasks cache in sync with Task.sprint (authoritative). */
const syncSprintTaskMembership = async (taskId, previousSprintId, nextSprintId) => {
  const prev = previousSprintId ? String(previousSprintId) : null;
  const next = nextSprintId ? String(nextSprintId) : null;
  if (prev === next) return;

  if (prev) {
    await Sprint.findByIdAndUpdate(prev, { $pull: { tasks: taskId } });
  }
  if (next) {
    await Sprint.findByIdAndUpdate(next, { $addToSet: { tasks: taskId } });
  }
};

const createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const io = req.app.get('io');

  const taskNumber = await getNextSequence(`task:${projectId}`);
  const fields = pickTaskFields(req.body);

  const task = await Task.create({
    ...fields,
    project: projectId,
    taskNumber,
    createdBy: req.user.id,
  });

  if (task.sprint) {
    await syncSprintTaskMembership(task._id, null, task.sprint);
  }

  Activity.create({
    organization: req.organization?._id,
    project: projectId,
    user: req.user.id,
    action: 'task.created',
    entity: { type: 'Task', id: task._id, title: task.title },
    description: `Task created: ${task.title}`,
  }).catch(() => {});

  if (task.assignedTo) {
    await createAndEmitNotification(io, {
      recipient: task.assignedTo,
      actor: req.user.id,
      type: 'task_assigned',
      message: `You were assigned to task: ${task.title}`,
      link: `/projects/${projectId}/tasks/${task._id}`,
      meta: { project: projectId, task: task._id },
    });
  }

  if (task.status !== 'backlog') await recalculateProgress(projectId);

  res.status(201).json({ success: true, data: task });
});

const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status, sprint, assignee, priority } = req.query;

  const filter = { project: projectId, isArchived: false };
  if (status) filter.status = status;
  if (sprint) filter.sprint = sprint === 'null' ? null : sprint;
  if (assignee) filter.assignedTo = assignee;
  if (priority) filter.priority = priority;

  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email avatar initials')
    .populate('labels')
    .populate('createdBy', 'name')
    .sort({ status: 1, position: 1 });

  res.status(200).json({ success: true, data: tasks });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, project: req.params.projectId })
    .populate('assignedTo')
    .populate('createdBy')
    .populate('labels')
    .populate('sprint');

  if (!task) throw new AppError('Task not found', 404);
  res.status(200).json({ success: true, data: task });
});

const updateTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const io = req.app.get('io');

  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) throw new AppError('Task not found', 404);

  const isDeveloper = req.userOrgRole === 'developer';
  if (isDeveloper && task.assignedTo && String(task.assignedTo) !== String(req.user.id)) {
    throw new AppError('Developers can only update their own assigned tasks', 403);
  }

  const originalStatus = task.status;
  const originalAssignee = task.assignedTo;
  const previousSprint = task.sprint;

  if (isDeveloper) {
    if (req.body.status) task.status = req.body.status;
    if (req.body.actualTime !== undefined) task.actualTime = req.body.actualTime;
    if (req.body.position !== undefined) task.position = req.body.position;
  } else {
    Object.assign(task, pickTaskFields(req.body));
  }

  if (task.status === 'completed' && originalStatus !== 'completed') {
    task.completedAt = new Date();
  } else if (task.status !== 'completed') {
    task.completedAt = undefined;
  }

  await task.save();

  await syncSprintTaskMembership(task._id, previousSprint, task.sprint);

  if (task.status !== originalStatus) {
    Activity.create({
      organization: req.organization?._id,
      project: projectId,
      user: req.user.id,
      action: 'task.status_changed',
      entity: { type: 'Task', id: task._id, title: task.title },
      description: `Task "${task.title}" moved to ${task.status}`,
    }).catch(() => {});
    if (io) io.to(`task:${task._id}`).emit('task:updated', task);
  }

  if (task.assignedTo && String(task.assignedTo) !== String(originalAssignee)) {
    await createAndEmitNotification(io, {
      recipient: task.assignedTo,
      actor: req.user.id,
      type: 'task_assigned',
      message: `You were assigned to task: ${task.title}`,
      link: `/projects/${projectId}/tasks/${task._id}`,
      meta: { project: projectId, task: task._id },
    });
  }

  if (
    originalStatus === 'completed' ||
    task.status === 'completed' ||
    originalStatus === 'backlog' ||
    task.status === 'backlog'
  ) {
    await recalculateProgress(projectId);
  }

  res.status(200).json({ success: true, data: task });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.taskId, project: req.params.projectId },
    { isArchived: true },
    { new: true }
  );
  if (!task) throw new AppError('Task not found', 404);

  if (task.sprint) {
    await Sprint.findByIdAndUpdate(task.sprint, { $pull: { tasks: task._id } });
  }

  await recalculateProgress(req.params.projectId);
  res.status(200).json({ success: true, data: {} });
});

const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { taskIds, status } = req.body;
  const { projectId } = req.params;

  if (!taskIds || !Array.isArray(taskIds) || !status) {
    throw new AppError('Invalid payload', 400);
  }

  const filter = { _id: { $in: taskIds }, project: projectId, isArchived: false };

  // Developers/testers may only bulk-update their own assigned tasks
  if (['developer', 'tester'].includes(req.userOrgRole)) {
    filter.assignedTo = req.user.id;
  }

  await Task.updateMany(filter, { status });
  await recalculateProgress(projectId);

  res.status(200).json({ success: true, data: {} });
});

module.exports = { createTask, getTasks, getTask, updateTask, deleteTask, bulkUpdateStatus };
