const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { Bug } = require('../models/Bug.model');
const { Activity } = require('../models/Activity.model');
const { Project } = require('../models/Project.model');
const { getNextSequence } = require('../utils/counters');

const BUG_WRITABLE_FIELDS = [
  'title', 'description', 'status', 'priority',
  'assignedTo', 'task', 'labels', 'stepsToReproduce',
  'expectedBehavior', 'actualBehavior', 'environment',
];

const pickBugFields = (body) => {
  const data = {};
  for (const key of BUG_WRITABLE_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
};

const reportBug = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId).select('organization');
  if (!project) throw new AppError('Project not found', 404);

  const bugNumber = await getNextSequence(`bug:${projectId}`);
  const fields = pickBugFields(req.body);

  const bug = await Bug.create({
    ...fields,
    project: projectId,
    reportedBy: req.user.id,
    bugNumber,
  });

  Activity.create({
    organization: project.organization,
    project: projectId,
    user: req.user.id,
    action: 'bug.reported',
    entity: { type: 'Bug', id: bug._id, title: bug.title },
    description: `Bug reported: ${bug.title}`,
  }).catch(() => {});

  res.status(201).json({ success: true, data: bug });
});

const getBugs = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status, priority, assignedTo } = req.query;

  const filter = { project: projectId };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;

  const bugs = await Bug.find(filter)
    .populate('reportedBy', 'name avatar initials')
    .populate('assignedTo', 'name avatar initials')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: bugs });
});

const getBug = asyncHandler(async (req, res) => {
  const bug = await Bug.findOne({ _id: req.params.bugId, project: req.params.projectId })
    .populate('reportedBy', 'name avatar initials')
    .populate('assignedTo', 'name avatar initials')
    .populate('verifiedBy', 'name avatar initials');

  if (!bug) throw new AppError('Bug not found', 404);
  res.status(200).json({ success: true, data: bug });
});

const updateBug = asyncHandler(async (req, res) => {
  const { projectId, bugId } = req.params;
  const bug = await Bug.findOne({ _id: bugId, project: projectId });
  if (!bug) throw new AppError('Bug not found', 404);

  const project = await Project.findById(projectId).select('organization');
  const role = req.userOrgRole;
  const isOwner = role === 'owner';
  const isManager = role === 'manager';
  const isTester = role === 'tester';
  const isDeveloper = role === 'developer';
  const isTeamLead = role === 'teamlead';
  const isReporter = String(bug.reportedBy) === String(req.user.id);

  if (isTester) {
    if (Object.keys(req.body).length !== 1 || req.body.status !== 'verified') {
      throw new AppError('Testers can only verify bugs.', 403);
    }
  }

  if (req.body.assignedTo !== undefined && !['owner', 'manager'].includes(role)) {
    throw new AppError('Only managers or owners can assign bugs.', 403);
  }

  if (req.body.status === 'verified' && !['tester', 'owner'].includes(role)) {
    throw new AppError('Only testers or owners can verify bugs.', 403);
  }

  if (req.body.status === 'closed' && role !== 'owner') {
    throw new AppError('Only the owner can close bugs.', 403);
  }

  if (isTeamLead) {
    const allowedFields = ['status'];
    const isOnlyStatusUpdate = Object.keys(req.body).every((key) => allowedFields.includes(key));
    if (!isOnlyStatusUpdate) {
      throw new AppError('Team leads are not authorized to update bugs.', 403);
    }
    if (req.body.status && ['verified', 'closed'].includes(req.body.status)) {
      throw new AppError('Team leads cannot verify or close bugs.', 403);
    }
  }

  if (isDeveloper && !isOwner && !isReporter) {
    throw new AppError('Developers can only update bugs they reported.', 403);
  }

  if (isDeveloper && req.body.assignedTo !== undefined) {
    throw new AppError('Developers cannot assign bugs.', 403);
  }

  if (isManager && Object.keys(req.body).some((key) => key !== 'assignedTo' && key !== 'status')) {
    throw new AppError('Managers may only assign bugs or update status.', 403);
  }

  if (isManager && req.body.status && ['verified', 'closed'].includes(req.body.status)) {
    throw new AppError('Managers cannot verify or close bugs.', 403);
  }

  if (!isOwner && isTester && req.body.status === 'verified') {
    bug.verifiedAt = new Date();
    bug.verifiedBy = req.user.id;
  }

  if (!isOwner && role === 'developer' && req.body.status === 'verified') {
    throw new AppError('Developers cannot verify bugs.', 403);
  }

  const originalStatus = bug.status;
  Object.assign(bug, pickBugFields(req.body));

  if (bug.status !== originalStatus) {
    const now = new Date();
    if (bug.status === 'fixed') bug.fixedAt = now;
    if (bug.status === 'verified') {
      if (!bug.verifiedAt) bug.verifiedAt = now;
      if (!bug.verifiedBy) bug.verifiedBy = req.user.id;
    }
    if (bug.status === 'closed') bug.closedAt = now;

    Activity.create({
      organization: project?.organization,
      project: projectId,
      user: req.user.id,
      action: 'bug.status_changed',
      entity: { type: 'Bug', id: bug._id, title: bug.title },
      description: `Bug "${bug.title}" moved to ${bug.status}`,
    }).catch(() => {});
  }

  await bug.save();
  res.status(200).json({ success: true, data: bug });
});

const deleteBug = asyncHandler(async (req, res) => {
  const bug = await Bug.findOneAndDelete({
    _id: req.params.bugId,
    project: req.params.projectId,
  });
  if (!bug) throw new AppError('Bug not found', 404);
  res.status(200).json({ success: true, data: {} });
});

module.exports = { reportBug, getBugs, getBug, updateBug, deleteBug };
