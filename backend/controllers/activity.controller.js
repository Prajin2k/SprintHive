const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { Activity } = require('../models/Activity.model');
const { Project } = require('../models/Project.model');

/**
 * GET /api/activities?orgId=
 * Org members see activities for projects they can access.
 * Owners/managers see the full org audit log.
 */
const getOrgActivities = asyncHandler(async (req, res) => {
  const { orgId } = req.query;
  if (!orgId) throw new AppError('orgId is required', 400);

  const isManagerOrOwner = ['owner', 'manager'].includes(req.userOrgRole);

  let filter = { organization: orgId };

  if (!isManagerOrOwner) {
    const projects = await Project.find({
      organization: orgId,
      members: req.user.id,
    }).select('_id');
    const projectIds = projects.map((p) => p._id);
    filter.$or = [
      { project: { $in: projectIds } },
      { project: null, user: req.user.id },
    ];
  }

  const activities = await Activity.find(filter)
    .populate('user', 'name avatar initials')
    .sort({ timestamp: -1 })
    .limit(100);

  res.status(200).json({ success: true, data: activities });
});

module.exports = { getOrgActivities };
