const jwt = require('jsonwebtoken');
const { Project } = require('../models/Project.model');
const { Task } = require('../models/Task.model');
const { Organization } = require('../models/Organization.model');
const { verifyAccessToken } = require('../utils/tokenUtils');

const isOrgMember = async (orgId, userId) => {
  if (!orgId || !userId) return false;
  const org = await Organization.findById(orgId).select('members isActive');
  if (!org || !org.isActive) return false;
  return org.members.some((m) => m.user.toString() === userId.toString());
};

const registerSocketHandlers = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      // Fallback without issuer for any tokens issued before issuer was enforced
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        socket.userId = decoded.id;
        next();
      } catch {
        next(new Error('Authentication error'));
      }
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} for user ${socket.userId}`);

    socket.join(`user:${socket.userId}`);

    // Org room — only if caller is a member
    if (socket.handshake.auth?.orgId) {
      isOrgMember(socket.handshake.auth.orgId, socket.userId)
        .then((ok) => {
          if (ok) socket.join(`org:${socket.handshake.auth.orgId}`);
        })
        .catch(() => {});
    }

    socket.on('join_workspace', async (workspaceId) => {
      try {
        if (await isOrgMember(workspaceId, socket.userId)) {
          socket.join(`workspace:${workspaceId}`);
        }
      } catch (_) {}
    });

    socket.on('leave_workspace', (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    socket.on('join_project', async (projectId) => {
      try {
        const project = await Project.findById(projectId).select('organization isArchived');
        if (!project || project.isArchived) return;
        if (await isOrgMember(project.organization, socket.userId)) {
          socket.join(`project:${projectId}`);
        }
      } catch (_) {}
    });

    socket.on('leave_project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('join:task', async (taskId) => {
      try {
        const task = await Task.findById(taskId).select('project');
        if (!task) return;
        const project = await Project.findById(task.project).select('organization isArchived');
        if (!project || project.isArchived) return;
        if (await isOrgMember(project.organization, socket.userId)) {
          socket.join(`task:${taskId}`);
        }
      } catch (_) {}
    });

    socket.on('leave:task', (taskId) => {
      socket.leave(`task:${taskId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });
};

module.exports = registerSocketHandlers;
