const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { configRouter } = require('./modules/config/config.routes');
const { authRouter } = require('./modules/auth/auth.routes');

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'hostel-management-api',
    mode: process.env.APP_MODE === 'prod' ? 'prod' : 'test',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/config', configRouter);
app.use('/api/auth', authRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
