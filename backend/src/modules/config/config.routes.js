const express = require('express');

const router = express.Router();

const ALLOWED_PALETTES = new Set(['purple', 'green', 'works4', 'amber']);

function resolveThemePalette(mode) {
  const raw = String(process.env.THEME_PALETTE || '').trim().toLowerCase();
  if (ALLOWED_PALETTES.has(raw)) {
    return raw;
  }
  // Default: test → purple, prod → green (original behaviour)
  return mode === 'prod' ? 'green' : 'purple';
}

router.get('/', (_req, res) => {
  const mode = process.env.APP_MODE === 'prod' ? 'prod' : 'test';
  const themePalette = resolveThemePalette(mode);
  // brand stays purple|green for older clients; map extras to nearest mode default
  const brand =
    themePalette === 'green'
      ? 'green'
      : themePalette === 'purple'
        ? 'purple'
        : mode === 'prod'
          ? 'green'
          : 'purple';
  const googleClientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  const defaultHostelPartner = process.env.DEFAULT_HOSTEL_PARTNER || 'hogwarts';

  res.json({
    appName: process.env.APP_NAME || 'easyHostel4',
    mode,
    brand,
    themePalette,
    version: process.env.APP_VERSION || '0.1.0',
    googleClientId,
    googleEnabled: Boolean(googleClientId) || mode === 'test',
    defaultHostelPartner,
    coverQuote:
      process.env.LOGIN_QUOTE ||
      'Clarity on fees, rooms, and complaints — so nobody has to chase updates.',
    coverQuoteAuthor: process.env.LOGIN_QUOTE_AUTHOR || 'easyHostel4',
    allowPasswordSignup: true,
    signupHint:
      'Register with email/password (pending admin approval), or continue with Google as a tenant.',
  });
});

module.exports = { configRouter: router };
