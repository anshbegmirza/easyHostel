const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { configRouter } = require('./modules/config/config.routes');
const { authRouter } = require('./modules/auth/auth.routes');
const { requireAuth } = require('./middleware/requireAuth');

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

// Protected sample: any authenticated caller
app.get('/api/v1/secure/ping', requireAuth, (req, res) => {
  const { encodeId } = require('./utils/publicId');
  res.json({
    ok: true,
    userId: encodeId(req.user.id),
    role: req.user.role,
    hostelId: encodeId(req.user.hostelId),
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
