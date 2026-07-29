/**
 * Sprint Hive — Backend Server
 * Entry point for the Express + Socket.io server
 */

require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
// Register ALL Mongoose schemas before any route handlers run
require('./models/index');
const registerSocketHandlers = require('./socket');

// ──────────────────────────────────────────────
// App & HTTP Server Setup
// ──────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ──────────────────────────────────────────────
// Socket.io Setup
// ──────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);
registerSocketHandlers(io);

// ──────────────────────────────────────────────
// Security Middleware
// ──────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS must run BEFORE rate limiters so 429 responses still include CORS headers
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // required for httpOnly cookie exchange
  })
);

// Global API rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', globalLimiter);

// Stricter auth rate limiter (applied in auth routes for login/register/forgot-pw)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});
app.set('authLimiter', authLimiter);

// ──────────────────────────────────────────────
// General Middleware
// ──────────────────────────────────────────────
app.use(cookieParser()); // must come before routes that read cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded files (local fallback storage)
app.use('/uploads', express.static('uploads'));

// ──────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🐝 Sprint Hive API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
app.use('/api/auth', require('./routes/auth.routes'));

// Organization routes
app.use('/api/organizations', require('./routes/organization.routes'));

// Feature routes
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api/projects/:projectId/tasks', require('./routes/task.routes'));
app.use('/api/projects/:projectId/bugs', require('./routes/bug.routes'));
app.use('/api/tasks/:taskId/comments', require('./routes/comment.routes'));
app.use('/api/tasks/:taskId/files', require('./routes/file.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/search', require('./routes/search.routes'));
app.use('/api/activities', require('./routes/activity.routes'));

// ──────────────────────────────────────────────
// Cron Jobs
// ──────────────────────────────────────────────
const cron = require('node-cron');
const { Task } = require('./models/Task.model');
const { createAndEmitNotification } = require('./services/notification.service');

cron.schedule('0 8 * * *', async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    const tasks = await Task.find({
      deadline: { $gte: startOfTomorrow, $lte: endOfTomorrow },
      status: { $ne: 'completed' },
      isArchived: false,
      assignedTo: { $exists: true, $ne: null },
    });

    for (const task of tasks) {
      try {
        await createAndEmitNotification(app.get('io'), {
          recipient: task.assignedTo,
          actor: task.createdBy || null,
          type: 'deadline_approaching',
          message: `Reminder: Task "${task.title}" is due tomorrow!`,
          link: `/projects/${task.project}/tasks/${task._id}`,
          meta: { project: task.project, task: task._id },
        });
      } catch (itemErr) {
        console.error(`Cron reminder failed for task ${task._id}:`, itemErr.message);
      }
    }
  } catch (err) {
    console.error('Cron job error:', err);
  }
});

// ──────────────────────────────────────────────
// 404 Handler
// ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ──────────────────────────────────────────────
// Global Error Handler
// ──────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error('🔥 Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errorCode && { errorCode: err.errorCode }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ──────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`\n🐝 Sprint Hive API Server`);
    console.log(`🚀 Running on: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📡 Socket.io: active`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
  });
};

startServer();
