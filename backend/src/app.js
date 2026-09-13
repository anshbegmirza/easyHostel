const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { configRouter } = require('./modules/config/config.routes');
const { authRouter } = require('./modules/auth/auth.routes');
const { roomsRouter } = require('./modules/rooms/rooms.routes');
const { feesRouter } = require('./modules/fees/fees.routes');
const { complaintsRouter } = require('./modules/complaints/complaints.routes');
const { dashboardRouter } = require('./modules/dashboard/dashboard.routes');
const { noticesRouter } = require('./modules/notices/notices.routes');
const { usersRouter } = require('./modules/users/users.routes');
const { roomChangesRouter } = require('./modules/room-changes/room-changes.routes');
const { notificationsRouter } = require('./modules/notifications/notifications.routes');
const { reportsRouter } = require('./modules/reports/reports.routes');
const { rolesRouter } = require('./modules/roles/roles.routes');
const { requireAuth } = require('./middleware/requireAuth');
const { encodeId } = require('./utils/publicId');

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'easyhostel4-api',
    mode: process.env.APP_MODE === 'prod' ? 'prod' : 'test',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'easyhostel4-api',
    version: 'v1',
    mode: process.env.APP_MODE === 'prod' ? 'prod' : 'test',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/config', configRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/rooms', roomsRouter);
app.use('/api/v1/fees', feesRouter);
app.use('/api/v1/complaints', complaintsRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/notices', noticesRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/room-changes', roomChangesRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/roles', rolesRouter);

app.get('/api/v1/secure/ping', requireAuth, (req, res) => {
  res.json({
    ok: true,
    user_id: encodeId(req.user.id),
    role: req.user.role,
    hostel_id: encodeId(req.user.hostel_id),
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

module.exports = app;
