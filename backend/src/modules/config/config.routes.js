const express = require('express');

const router = express.Router();

router.get('/', (_req, res) => {
  const mode = process.env.APP_MODE === 'prod' ? 'prod' : 'test';
  const brand = mode === 'prod' ? 'green' : 'purple';
  const googleClientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  const defaultHostelPartner = process.env.DEFAULT_HOSTEL_PARTNER || 'hogwarts';

  res.json({
    appName: process.env.APP_NAME || 'easyHostel4',
    mode,
    brand,
    version: process.env.APP_VERSION || '0.1.0',
    googleClientId,
    googleEnabled: Boolean(googleClientId) || mode === 'test',
    defaultHostelPartner,
    coverQuote:
      process.env.LOGIN_QUOTE ||
      'Clarity on fees, rooms, and complaints — so nobody has to chase updates.',
    coverQuoteAuthor: process.env.LOGIN_QUOTE_AUTHOR || 'easyHostel4',
    allowPasswordSignup: false,
    signupHint:
      'Accounts are created by a superuser, or you can sign up with Google as a tenant.',
  });
});

module.exports = { configRouter: router };
