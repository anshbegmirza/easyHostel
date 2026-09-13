const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../../config/db');
const { resolveHostel } = require('../../middleware/resolveHostel');
const { requireAuth } = require('../../middleware/requireAuth');
const { rateLimitLogin } = require('../../middleware/rateLimitLogin');
const { encodeId } = require('../../utils/publicId');
const { publicUser, publicHostel } = require('../../utils/publicModels');
const { notifyRoles } = require('../../utils/notify');
const { moduleCodesForUser } = require('../roles/roles.routes');

const router = express.Router();
const loginLimiter = rateLimitLogin();

function signToken(userRow) {
  return jwt.sign(
    {
      user_id: encodeId(userRow.id),
      role: userRow.role,
      hostel_id: encodeId(userRow.hostel_id),
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

async function linkedTenants(hostelId, parentUserId) {
  const [rows] = await pool.query(
    `SELECT u.*
     FROM parent_tenant_links l
     JOIN users u ON u.id = l.tenant_user_id
     WHERE l.hostel_id = ? AND l.parent_user_id = ?
     ORDER BY u.name`,
    [hostelId, parentUserId]
  );
  return rows.map(publicUser);
}

function assertActive(user, res) {
  if (user.status === 'pending') {
    res.status(403).json({
      message: 'Your account is pending admin approval.',
      code: 'PENDING_APPROVAL',
    });
    return false;
  }
  if (user.status === 'rejected') {
    res.status(403).json({
      message: 'Your registration was rejected. Contact hostel admin.',
      code: 'REJECTED',
    });
    return false;
  }
  return true;
}

router.post('/login', loginLimiter, resolveHostel, async (req, res, next) => {
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

    if (!assertActive(user, res)) {
      return undefined;
    }

    return res.json({
      token: signToken(user),
      user: publicUser(user),
      hostel: publicHostel(req.hostel),
      modules: await moduleCodesForUser(req.hostel.id, user),
      linked_tenants: user.role === 'parent' ? await linkedTenants(req.hostel.id, user.id) : [],
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

    const idToken = req.body?.id_token ?? req.body?.idToken;
    if (idToken && clientId) {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: String(idToken),
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
          (hostel_id, username, email, name, password_hash, role, status, auth_provider, google_sub)
         VALUES (?, ?, ?, ?, NULL, 'tenant', 'pending', 'google', ?)`,
        [req.hostel.id, usernameBase, email, name, googleSub]
      );
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = rows[0];
      await notifyRoles(req.hostel.id, ['superuser', 'admin', 'staff'], {
        title: 'New registration pending',
        body: `${name} signed up with Google and awaits approval.`,
        type: 'users',
        link: '/users',
      });
    } else if (googleSub && !user.google_sub) {
      await pool.query('UPDATE users SET google_sub = ? WHERE id = ?', [googleSub, user.id]);
      user.google_sub = googleSub;
    }

    if (!assertActive(user, res)) {
      return undefined;
    }

    return res.json({
      token: signToken(user),
      user: publicUser(user),
      hostel: publicHostel(req.hostel),
      modules: await moduleCodesForUser(req.hostel.id, user),
      linked_tenants: [],
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/register', resolveHostel, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const username = String(req.body?.username || email.split('@')[0] || '')
      .trim()
      .toLowerCase()
      .slice(0, 80);
    const password = String(req.body?.password || '');

    if (!name || !email || !email.includes('@') || password.length < 6) {
      return res.status(400).json({
        message: 'Name, valid email, and password (min 6 chars) are required.',
        code: 'VALIDATION',
      });
    }

    const existing = await findByEmail(req.hostel.id, email);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.', code: 'DUPLICATE' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users
        (hostel_id, username, email, name, password_hash, role, status, auth_provider)
       VALUES (?, ?, ?, ?, ?, 'tenant', 'pending', 'local')`,
      [req.hostel.id, username || null, email, name, hash]
    );

    await notifyRoles(req.hostel.id, ['superuser', 'admin', 'staff'], {
      title: 'New registration pending',
      body: `${name} registered and awaits approval.`,
      type: 'users',
      link: '/users',
    });

    return res.status(201).json({
      message: 'Registration submitted. An admin will approve your account.',
      user_id: encodeId(result.insertId),
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username or email already exists.', code: 'DUPLICATE' });
    }
    return next(err);
  }
});

router.get('/me', requireAuth, resolveHostel, async (req, res, next) => {
  try {
    if (req.user.hostel_id !== req.hostel.id) {
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
    const user = rows[0];
    return res.json({
      user: publicUser(user),
      hostel: publicHostel(req.hostel),
      modules: await moduleCodesForUser(req.hostel.id, user),
      linked_tenants: user.role === 'parent' ? await linkedTenants(req.hostel.id, user.id) : [],
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = { authRouter: router };
