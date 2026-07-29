const { Project } = require('../models/Project.model');
const { Task } = require('../models/Task.model');
const AppError = require('../utils/AppError');

const recalculateProgress = async (projectId) => {
  const totalTasks = await Task.countDocuments({ project: projectId, isArchived: false });
  const completedTasks = await Task.countDocuments({ project: projectId, status: 'completed', isArchived: false });

  let progress = 0;
  if (totalTasks > 0) {
    progress = Math.round((completedTasks / totalTasks) * 100);
  }

  const project = await Project.findByIdAndUpdate(
    projectId,
    { progress },
    { new: true }
  );

  return progress;
};

module.exports = { recalculateProgress };
