const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { Project } = require('../models/Project.model');
const { Task } = require('../models/Task.model');
const { Activity } = require('../models/Activity.model');
const { Organization } = require('../models/Organization.model');

const createProject = asyncHandler(async (req, res) => {
  const { name, description, organizationId, deadline, startDate, priority, coverColor, tags } = req.body;
  if (!organizationId) throw new AppError('organizationId is required', 400);

  // Membership already verified by requireOrgRole; keep creator as manager + member
  const project = await Project.create({
    name,
    description,
    organization: organizationId,
    deadline,
    startDate,
    priority,
    coverColor,
    tags,
    manager: req.user.id,
    members: [req.user.id],
  });

  await Activity.create({
    organization: organizationId,
    user: req.user.id,
    action: 'project.created',
    entity: { type: 'Project', id: project._id, title: name },
    description: `Project ${name} created`,
  });

  res.status(201).json({ success: true, data: project });
});

const getProjects = asyncHandler(async (req, res) => {
  const { orgId } = req.query;
  if (!orgId) throw new AppError('orgId query is required', 400);

  // req.userOrgRole set by requireOrgRole
  const filter = { organization: orgId, isArchived: false };
  if (req.userOrgRole === 'developer') {
    filter.members = req.user.id;
  }

  const projects = await Project.find(filter)
    .populate('manager', 'name avatar initials')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: projects });
});

const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId)
    .populate('members', 'name email avatar initials')
    .populate('manager', 'name email avatar initials');

  if (!project) throw new AppError('Project not found', 404);

  const projectData = project.toJSON();
  projectData.userOrgRole = req.userOrgRole;

  res.status(200).json({ success: true, data: projectData });
});

const updateProject = asyncHandler(async (req, res) => {
  const allowed = [
    'name', 'description', 'deadline', 'startDate', 'priority',
    'coverColor', 'tags', 'status', 'progress',
  ];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const project = await Project.findByIdAndUpdate(req.params.projectId, updates, {
    new: true,
    runValidators: true,
  });
  if (!project) throw new AppError('Project not found', 404);

  res.status(200).json({ success: true, data: project });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndUpdate(
    req.params.projectId,
    { isArchived: true, archivedAt: new Date() },
    { new: true }
  );
  if (!project) throw new AppError('Project not found', 404);

  await Task.updateMany({ project: project._id }, { isArchived: true });

  res.status(200).json({ success: true, data: {} });
});

const addMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) throw new AppError('userId is required', 400);

  // Only org members can be added to a project
  const org = await Organization.findById(req.project.organization).select('members');
  const isOrgMember = org?.members.some((m) => m.user.toString() === userId.toString());
  if (!isOrgMember) {
    throw new AppError('User must be a member of the organization first.', 400);
  }

  const project = await Project.findByIdAndUpdate(
    req.params.projectId,
    { $addToSet: { members: userId } },
    { new: true }
  );
  res.status(200).json({ success: true, data: project });
});

const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const project = await Project.findByIdAndUpdate(
    req.params.projectId,
    { $pull: { members: userId } },
    { new: true }
  );
  res.status(200).json({ success: true, data: project });
});

const PDFDocument = require('pdfkit');

const getProjectReport = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId).populate('manager', 'name email');
  if (!project) throw new AppError('Project not found', 404);

  const totalTasks = await Task.countDocuments({ project: project._id, isArchived: false });
  const completedTasks = await Task.countDocuments({
    project: project._id,
    status: 'completed',
    isArchived: false,
  });

  if (req.headers.accept?.includes('application/pdf') || req.query.format === 'pdf' || req.headers['response-type'] === 'blob') {
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Project_${project.name}_Report.pdf`);

    doc.pipe(res);

    doc.fontSize(22).fillColor('#1e293b').text(`Sprint Hive — Project Report`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).fillColor('#0f172a').text(`Project: ${project.name}`);
    doc.fontSize(12).fillColor('#475569').text(`Status: ${project.status} | Priority: ${project.priority}`);
    if (project.manager?.name) {
      doc.text(`Manager: ${project.manager.name} (${project.manager.email})`);
    }
    doc.moveDown();
    doc.text(`Description: ${project.description || 'N/A'}`);
    doc.moveDown();

    doc.fontSize(14).fillColor('#0f172a').text('Summary Statistics');
    doc.fontSize(12).fillColor('#334155');
    doc.text(`- Total Tasks: ${totalTasks}`);
    doc.text(`- Completed Tasks: ${completedTasks}`);
    doc.text(`- Overall Progress: ${project.progress || 0}%`);
    doc.moveDown();
    doc.fontSize(10).fillColor('#94a3b8').text(`Generated on ${new Date().toLocaleString()}`, { align: 'right' });

    doc.end();
    return;
  }

  res.status(200).json({
    success: true,
    data: { totalTasks, completedTasks, progress: project.progress },
  });
});

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectReport,
};
