/**
 * Model index — single import point for all Mongoose models.
 * Importing this file ensures all schemas are registered with Mongoose
 * before any queries run.
 *
 * Usage in controllers:
 *   const { User, Organization, Project, Task } = require('../models');
 */

const User = require('./User.model');
const { Organization, ORG_ROLES } = require('./Organization.model');
const { Project, PROJECT_STATUSES, PROJECT_PRIORITIES } = require('./Project.model');
const { Task, TASK_STATUSES, TASK_PRIORITIES } = require('./Task.model');
const { Sprint, SPRINT_STATUSES } = require('./Sprint.model');
const { Bug, BUG_PRIORITIES, BUG_STATUSES } = require('./Bug.model');
const Comment = require('./Comment.model');
const { Notification, NOTIFICATION_TYPES } = require('./Notification.model');
const { Activity, ACTIVITY_ACTIONS } = require('./Activity.model');
const { File, FILE_TYPES } = require('./File.model');
const { Label, LABEL_COLORS } = require('./Label.model');
const { Invite, INVITE_ROLES, INVITE_STATUSES } = require('./Invite.model');

module.exports = {
  // Models
  User,
  Organization,
  Project,
  Task,
  Sprint,
  Bug,
  Comment,
  Notification,
  Activity,
  File,
  Label,
  Invite,

  // Enums & constants (useful for validation in controllers)
  ORG_ROLES,
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  SPRINT_STATUSES,
  BUG_PRIORITIES,
  BUG_STATUSES,
  NOTIFICATION_TYPES,
  ACTIVITY_ACTIONS,
  FILE_TYPES,
  LABEL_COLORS,
  INVITE_ROLES,
  INVITE_STATUSES,
};
