const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { Project } = require('../models/Project.model');
const { Task } = require('../models/Task.model');
const Comment = require('../models/Comment.model');
const User = require('../models/User.model');
const { Organization } = require('../models/Organization.model');

/** Escape user input before building a RegExp (ReDoS / injection). */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const globalSearch = asyncHandler(async (req, res) => {
  const { q, orgId } = req.query;
  if (!q || !orgId) throw new AppError('Query q and orgId are required', 400);
  if (q.trim().length < 2) throw new AppError('Query must be at least 2 characters', 400);

  const regex = new RegExp(escapeRegex(q.trim()), 'i');
  const isManagerOrOwner = ['owner', 'manager'].includes(req.userOrgRole);

  let projectFilter = { organization: orgId, isArchived: false };
  if (!isManagerOrOwner) {
    projectFilter.members = req.user.id;
  }

  const userProjects = await Project.find(projectFilter).select('_id');
  const projectIds = userProjects.map((p) => p._id);

  const org = await Organization.findById(orgId).select('members');
  const memberIds = org ? org.members.map((m) => m.user) : [];

  // Comments belong to tasks — resolve task IDs in accessible projects first
  const accessibleTaskIds = projectIds.length
    ? (await Task.find({ project: { $in: projectIds }, isArchived: false }).select('_id')).map(
        (t) => t._id
      )
    : [];

  const [projects, tasks, users, comments] = await Promise.all([
    Project.find({ ...projectFilter, $or: [{ name: regex }, { description: regex }] })
      .select('name description status priority progress')
      .limit(5),

    Task.find({
      project: { $in: projectIds },
      isArchived: false,
      $or: [{ title: regex }, { description: regex }],
    })
      .select('title status priority project taskNumber')
      .populate('project', 'name')
      .limit(5),

    User.find({
      _id: { $in: memberIds },
      $or: [{ name: regex }, { email: regex }],
    })
      .select('name email avatar initials')
      .limit(5),

    Comment.find({
      task: { $in: accessibleTaskIds },
      isDeleted: false,
      content: regex,
    })
      .populate({ path: 'task', select: 'title project' })
      .populate('author', 'name avatar')
      .limit(5),
  ]);

  res.status(200).json({
    success: true,
    data: { projects, tasks, users, comments },
  });
});

module.exports = { globalSearch };
