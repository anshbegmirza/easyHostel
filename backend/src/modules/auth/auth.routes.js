const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

/** ponytail: in-memory users until MySQL auth lands; ceiling = restart loses new Google users */
const users = [
  {
    id: 1,
    hostelId: 1,
    username: 'superuser',
    email: 'superuser@hostel.local',
    name: 'Super Admin',
    role: 'superuser',
    // password: test@123
    passwordHash: bcrypt.hashSync('test@123', 8),
    authProvider: 'local',
  },
];

function publicUser(u) {
  return {
    id: u.id,
    username: u.username || null,
    email: u.email,
    name: u.name,
    role: u.role,
    hostelId: u.hostelId,
    authProvider: u.authProvider,
  };
}

function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      hostelId: user.hostelId,
    },
    process.env.JWT_SECRET || 'change-me-in-production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/** Username/password login — only for accounts created by superuser (local). */
router.post('/login', async (req, res) => {
  const username = String(req.body?.username || req.body?.email || '')
    .trim()
    .toLowerCase();
  const password = String(req.body?.password || '');

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const user = users.find(
    (u) =>
      u.authProvider === 'local' &&
      (u.username === username || u.email === username)
  );
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Incorrect username or password.' });
  }

  return res.json({
    token: signToken(user),
    user: publicUser(user),
  });
});

/**
 * Google sign-in / sign-up.
 * Test (no GOOGLE_CLIENT_ID): accept { email, name } from the client test button.
 * Prod: send { idToken } — verification wired when client id is configured.
 */
router.post('/google', async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  let email = '';
  let name = '';

  if (clientId && req.body?.idToken) {
    // ponytail: real token verify deferred; require email claim shape until google-auth-library added
    return res.status(501).json({
      message:
        'Google token verification not configured yet. Unset GOOGLE_CLIENT_ID to use test Google login.',
    });
  }

  if (process.env.APP_MODE !== 'test' && !clientId) {
    return res.status(503).json({ message: 'Google sign-in is not configured.' });
  }

  email = String(req.body?.email || '').trim().toLowerCase();
  name = String(req.body?.name || 'Google User').trim();

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'A valid Google account email is required.' });
  }

  let user = users.find((u) => u.email === email);
  if (!user) {
    user = {
      id: users.length + 1,
      hostelId: 1,
      username: email.split('@')[0],
      email,
      name,
      role: 'tenant',
      passwordHash: null,
      authProvider: 'google',
    };
    users.push(user);
  }

  return res.json({
    token: signToken(user),
    user: publicUser(user),
  });
});

/** Public signup with password is not allowed. */
router.post('/register', (_req, res) => {
  res.status(403).json({
    message:
      'Self-registration with password is disabled. Ask a superuser to create your account, or continue with Google.',
  });
});

module.exports = { authRouter: router, users };
