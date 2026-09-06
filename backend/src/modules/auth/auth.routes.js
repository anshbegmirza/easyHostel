const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../../config/db');
const { resolveHostel } = require('../../middleware/resolveHostel');
const { requireAuth } = require('../../middleware/requireAuth');
const { encodeId } = require('../../utils/publicId');
const { publicUser, publicHostel } = require('../../utils/publicModels');

const router = express.Router();

function signToken(userRow) {
  return jwt.sign(
    {
      userId: encodeId(userRow.id),
      role: userRow.role,
      hostelId: encodeId(userRow.hostel_id),
    },
    process.env.JWT_SECRET || 'change-me-in-production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function findLocalUser(hostelId, username) {
  const [rows] = await pool.query(
    `SELECT * FROM users
     WHERE hostel_id = ?
       AND auth_provider = 'local'
       AND (LOWER(username) = ? OR LOWER(email) = ?)
     LIMIT 1`,
    [hostelId, username, username]
  );
  return rows[0] || null;
}

async function findByEmail(hostelId, email) {
  const [rows] = await pool.query(
    `SELECT * FROM users WHERE hostel_id = ? AND LOWER(email) = ? LIMIT 1`,
    [hostelId, email]
  );
  return rows[0] || null;
}

async function findByGoogleSub(hostelId, googleSub) {
  const [rows] = await pool.query(
    `SELECT * FROM users WHERE hostel_id = ? AND google_sub = ? LIMIT 1`,
    [hostelId, googleSub]
  );
  return rows[0] || null;
}

router.post('/login', resolveHostel, async (req, res, next) => {
  try {
    const username = String(req.body?.username || req.body?.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || '');

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await findLocalUser(req.hostel.id, username);
    if (!user || !user.password_hash) {
      return res.status(401).json({ message: 'Incorrect username or password.' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect username or password.' });
    }

    return res.json({
      token: signToken(user),
      user: publicUser(user),
      hostel: publicHostel(req.hostel),
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/google', resolveHostel, async (req, res, next) => {
  try {
    const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
    const mode = process.env.APP_MODE === 'prod' ? 'prod' : 'test';

    let email = '';
    let name = '';
    let googleSub = null;

    if (req.body?.idToken && clientId) {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: String(req.body.idToken),
        audience: clientId,
      });
      const payload = ticket.getPayload();
      email = String(payload.email || '').toLowerCase();
      name = String(payload.name || payload.email || 'Google User');
      googleSub = payload.sub || null;
    } else if (mode === 'test') {
      email = String(req.body?.email || '').trim().toLowerCase();
      name = String(req.body?.name || 'Google User').trim();
      googleSub = email ? `test:${email}` : null;
    } else {
      return res.status(503).json({ message: 'Google sign-in is not configured.' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'A valid Google account email is required.' });
    }

    let user = googleSub ? await findByGoogleSub(req.hostel.id, googleSub) : null;
    if (!user) {
      user = await findByEmail(req.hostel.id, email);
    }

    if (!user) {
      const usernameBase = email.split('@')[0].slice(0, 60);
      const [result] = await pool.query(
        `INSERT INTO users
          (hostel_id, username, email, name, password_hash, role, auth_provider, google_sub)
         VALUES (?, ?, ?, ?, NULL, 'tenant', 'google', ?)`,
        [req.hostel.id, usernameBase, email, name, googleSub]
      );
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = rows[0];
    } else if (googleSub && !user.google_sub) {
      await pool.query('UPDATE users SET google_sub = ?, auth_provider = ? WHERE id = ?', [
        googleSub,
        user.auth_provider === 'local' ? user.auth_provider : 'google',
        user.id,
      ]);
      user.google_sub = googleSub;
    }

    return res.json({
      token: signToken(user),
      user: publicUser(user),
      hostel: publicHostel(req.hostel),
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/register', (_req, res) => {
  res.status(403).json({
    message:
      'Self-registration with password is disabled. Ask a superuser to create your account, or continue with Google.',
  });
});

router.get('/me', requireAuth, resolveHostel, async (req, res, next) => {
  try {
    if (req.user.hostelId !== req.hostel.id) {
      return res.status(403).json({
        message: 'Token hostel does not match X-Hostel-Partner.',
        code: 'HOSTEL_MISMATCH',
      });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ? AND hostel_id = ?', [
      req.user.id,
      req.hostel.id,
    ]);
    if (!rows.length) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json({
      user: publicUser(rows[0]),
      hostel: publicHostel(req.hostel),
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = { authRouter: router };
