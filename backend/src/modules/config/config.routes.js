const express = require('express');

const router = express.Router();

router.get('/', (_req, res) => {
  const mode = process.env.APP_MODE === 'prod' ? 'prod' : 'test';
  const brand = mode === 'prod' ? 'green' : 'purple';

  res.json({
    appName: process.env.APP_NAME || 'Hostel Management',
    mode,
    brand,
    version: process.env.APP_VERSION || '0.1.0',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID) || mode === 'test',
    coverQuote:
      process.env.LOGIN_QUOTE ||
      'Clarity on fees, rooms, and complaints — so nobody has to chase updates.',
    coverQuoteAuthor: process.env.LOGIN_QUOTE_AUTHOR || 'Hostel Management',
    allowPasswordSignup: false,
    signupHint:
      'Accounts are created by a superuser, or you can sign up with Google.',
  });
});

module.exports = { configRouter: router };
