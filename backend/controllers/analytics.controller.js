const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { Task } = require('../models/Task.model');
const { Bug } = require('../models/Bug.model');
const { Project } = require('../models/Project.model');

const getOrgAnalytics = asyncHandler(async (req, res) => {
  const { orgId } = req.query;
  if (!orgId) throw new AppError('orgId is required', 400);

  const isManagerOrOwner = ['owner', 'manager'].includes(req.userOrgRole);
  
  let projectFilter = { organization: orgId };
  if (!isManagerOrOwner) {
    projectFilter.members = req.user.id;
  }
  const projects = await Project.find(projectFilter);
  const projectIds = projects.map(p => p._id);

  // tasks by status
  const tasks = await Task.find({ project: { $in: projectIds }, isArchived: false });
  const tasksByStatus = { backlog: 0, todo: 0, 'in-progress': 0, 'code-review': 0, testing: 0, completed: 0 };
  tasks.forEach(t => { if (tasksByStatus[t.status] !== undefined) tasksByStatus[t.status]++; });

  // bugs by status
  const bugs = await Bug.find({ project: { $in: projectIds } });
  const bugsByStatus = { open: 0, 'in-progress': 0, fixed: 0, verified: 0, closed: 0 };
  bugs.forEach(b => { if (bugsByStatus[b.status] !== undefined) bugsByStatus[b.status]++; });

  // project progress
  const projectProgress = await Promise.all(projects.map(async p => {
    const total = await Task.countDocuments({ project: p._id, isArchived: false });
    const comp = await Task.countDocuments({ project: p._id, status: 'completed', isArchived: false });
    return { projectId: p._id, name: p.name, progress: p.progress, totalTasks: total, completedTasks: comp };
  }));

  // team performance
  // group tasks by assignee where status is completed
  const completedTasksData = await Task.aggregate([
    { $match: { project: { $in: projectIds }, status: 'completed', isArchived: false, assignedTo: { $exists: true, $ne: null } } },
    { $group: {
      _id: '$assignedTo',
      completedTasks: { $sum: 1 },
      totalDuration: { $sum: { $subtract: ['$completedAt', '$createdAt'] } }
    }}
  ]);

  const openBugsData = await Bug.aggregate([
    { $match: { project: { $in: projectIds }, status: { $ne: 'closed' }, assignedTo: { $exists: true, $ne: null } } },
    { $group: { _id: '$assignedTo', openBugs: { $sum: 1 } } }
  ]);

  const teamMap = {};
  completedTasksData.forEach(d => {
    teamMap[d._id] = { completedTasks: d.completedTasks, avgCompletionDays: d.totalDuration / (1000 * 60 * 60 * 24 * d.completedTasks), openBugs: 0 };
  });
  openBugsData.forEach(d => {
    if (!teamMap[d._id]) teamMap[d._id] = { completedTasks: 0, avgCompletionDays: 0, openBugs: 0 };
    teamMap[d._id].openBugs = d.openBugs;
  });

  const teamPerformance = [];
  // fetch user data could be done if needed, but returning just stats for now or populate
  // Skipping populate for brevity, can be done frontend with user context or populate if needed
  for (const userId of Object.keys(teamMap)) {
    const stats = teamMap[userId];
    const productivity = stats.completedTasks / (stats.completedTasks + stats.openBugs || 1) * 100;
    teamPerformance.push({ userId, ...stats, productivity: Math.min(productivity, 100) });
  }

  res.status(200).json({ success: true, data: { tasksByStatus, bugsByStatus, projectProgress, teamPerformance } });
});

module.exports = { getOrgAnalytics };
