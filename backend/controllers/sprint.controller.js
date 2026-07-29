const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { Sprint } = require('../models/Sprint.model');
const { Task } = require('../models/Task.model');

const SPRINT_WRITABLE_FIELDS = ['name', 'goal', 'status', 'startDate', 'endDate', 'capacity'];

const pickSprintFields = (body) => {
  const data = {};
  for (const key of SPRINT_WRITABLE_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
};

const createSprint = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const fields = pickSprintFields(req.body);

  if (fields.status === 'active') {
    const activeSprint = await Sprint.findOne({ project: projectId, status: 'active' });
    if (activeSprint) throw new AppError('An active sprint already exists for this project', 400);
  }

  const sprint = await Sprint.create({ ...fields, project: projectId, tasks: [] });
  res.status(201).json({ success: true, data: sprint });
});

const getSprints = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const sprints = await Sprint.find({ project: projectId }).sort({ startDate: 1 });

  const sprintCards = await Promise.all(
    sprints.map(async (sprint) => {
      const totalTasks = await Task.countDocuments({ sprint: sprint._id, isArchived: false });
      const completedTasks = await Task.countDocuments({
        sprint: sprint._id,
        status: 'completed',
        isArchived: false,
      });
      return { ...sprint.toJSON(), totalTasks, completedTasks };
    })
  );

  res.status(200).json({ success: true, data: sprintCards });
});

const getSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findOne({
    _id: req.params.sprintId,
    project: req.params.projectId,
  }).populate('tasks');
  if (!sprint) throw new AppError('Sprint not found', 404);
  res.status(200).json({ success: true, data: sprint });
});

const updateSprint = asyncHandler(async (req, res) => {
  const { projectId, sprintId } = req.params;
  const fields = pickSprintFields(req.body);

  if (fields.status === 'active') {
    const activeSprint = await Sprint.findOne({
      project: projectId,
      status: 'active',
      _id: { $ne: sprintId },
    });
    if (activeSprint) throw new AppError('Another active sprint already exists for this project', 400);
  }

  const sprint = await Sprint.findOneAndUpdate(
    { _id: sprintId, project: projectId },
    fields,
    { new: true, runValidators: true }
  );
  if (!sprint) throw new AppError('Sprint not found', 404);

  if (sprint.status === 'completed' && !sprint.completedAt) {
    sprint.completedAt = new Date();
    sprint.completedBy = req.user.id;
    await sprint.save();
  }

  res.status(200).json({ success: true, data: sprint });
});

const deleteSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findOneAndDelete({
    _id: req.params.sprintId,
    project: req.params.projectId,
  });
  if (!sprint) throw new AppError('Sprint not found', 404);

  await Task.updateMany({ sprint: sprint._id }, { sprint: null });

  res.status(200).json({ success: true, data: {} });
});

const addTaskToSprint = asyncHandler(async (req, res) => {
  const { sprintId, projectId } = req.params;
  const { taskId } = req.body;

  const sprint = await Sprint.findOne({ _id: sprintId, project: projectId });
  if (!sprint) throw new AppError('Sprint not found', 404);

  const task = await Task.findOne({ _id: taskId, project: projectId, isArchived: false });
  if (!task) throw new AppError('Task not found', 404);

  const previousSprint = task.sprint;
  task.sprint = sprintId;
  await task.save();

  // Sync Sprint.tasks cache both ways
  if (previousSprint && String(previousSprint) !== String(sprintId)) {
    await Sprint.findByIdAndUpdate(previousSprint, { $pull: { tasks: taskId } });
  }
  await Sprint.findByIdAndUpdate(sprintId, { $addToSet: { tasks: taskId } });

  res.status(200).json({ success: true, data: task });
});

const removeTaskFromSprint = asyncHandler(async (req, res) => {
  const { sprintId, projectId, taskId } = req.params;

  const task = await Task.findOneAndUpdate(
    { _id: taskId, project: projectId, sprint: sprintId },
    { sprint: null },
    { new: true }
  );
  if (!task) throw new AppError('Task not found in this sprint', 404);

  await Sprint.findByIdAndUpdate(sprintId, { $pull: { tasks: taskId } });

  res.status(200).json({ success: true, data: task });
});

module.exports = {
  createSprint,
  getSprints,
  getSprint,
  updateSprint,
  deleteSprint,
  addTaskToSprint,
  removeTaskFromSprint,
};
