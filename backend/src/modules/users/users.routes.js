const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../../config/db');
const { secured, staffRoles } = require('../../middleware/secured');
const { decodeId } = require('../../utils/publicId');
const { publicUser } = require('../../utils/publicModels');
const { notifyUser } = require('../../utils/notify');

async function applyRoleTemplate(hostelId, userId, role, grantedBy) {
  const [mods] = await pool.query(
    `SELECT i.module_id
     FROM module_templates t
     JOIN module_template_items i ON i.template_id = t.id
     WHERE t.hostel_id = ? AND t.role_key = ?
       AND t.id = (
         SELECT MIN(id) FROM module_templates
         WHERE hostel_id = ? AND role_key = ?
       )`,
    [hostelId, role, hostelId, role]
  );
  for (const row of mods) {
    await pool.query(
      `INSERT IGNORE INTO admin_module_grants (hostel_id, user_id, module_id, granted_by)
       VALUES (?, ?, ?, ?)`,
      [hostelId, userId, row.module_id, grantedBy]
    );
  }
}

const router = express.Router();

router.get('/', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const role = req.query.role ? String(req.query.role) : null;
    const status = req.query.status ? String(req.query.status) : null;
    const params = [req.hostel.id];
    let sql = `SELECT * FROM users WHERE hostel_id = ?`;

    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY FIELD(status, 'pending', 'active', 'rejected'), name`;
    const [rows] = await pool.query(sql, params);
    return res.json({ users: rows.map(publicUser) });
  } catch (err) {
    return next(err);
  }
});

router.post('/tenants', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const username = String(req.body?.username || email.split('@')[0] || '')
      .trim()
      .toLowerCase()
      .slice(0, 80);
    const password = String(req.body?.password || 'changeme');
    const phone = req.body?.phone ? String(req.body.phone).trim() : null;

    if (!name || !email || !email.includes('@')) {
      return res.status(400).json({ message: 'Name and valid email are required.', code: 'VALIDATION' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users
        (hostel_id, username, email, name, password_hash, role, status, auth_provider, phone)
       VALUES (?, ?, ?, ?, ?, 'tenant', 'active', 'local', ?)`,
      [req.hostel.id, username || null, email, name, hash, phone]
    );
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    await applyRoleTemplate(req.hostel.id, result.insertId, 'tenant', req.user.id);
    return res.status(201).json({ user: publicUser(rows[0]), temp_password: password });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username or email already exists.', code: 'DUPLICATE' });
    }
    return next(err);
  }
});

router.post('/parents', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const username = String(req.body?.username || email.split('@')[0] || '')
      .trim()
      .toLowerCase()
      .slice(0, 80);
    const password = String(req.body?.password || 'changeme');
    const tenantIds = Array.isArray(req.body?.tenant_ids ?? req.body?.tenantIds)
      ? req.body?.tenant_ids ?? req.body?.tenantIds
      : [];

    if (!name || !email || !email.includes('@') || !tenantIds.length) {
      return res.status(400).json({
        message: 'Name, email, and at least one tenant_id are required.',
        code: 'VALIDATION',
      });
    }

    const decodedTenants = tenantIds.map((id) => decodeId(id)).filter((id) => id != null);
    if (!decodedTenants.length) {
      return res.status(400).json({ message: 'Invalid tenant_ids.', code: 'VALIDATION' });
    }

    const [tenants] = await pool.query(
      `SELECT id FROM users
       WHERE hostel_id = ? AND role = 'tenant' AND status = 'active' AND id IN (?)`,
      [req.hostel.id, decodedTenants]
    );
    if (tenants.length !== decodedTenants.length) {
      return res.status(400).json({ message: 'One or more tenants are invalid.', code: 'VALIDATION' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users
        (hostel_id, username, email, name, password_hash, role, status, auth_provider)
       VALUES (?, ?, ?, ?, ?, 'parent', 'active', 'local')`,
      [req.hostel.id, username || null, email, name, hash]
    );

    for (const tenantId of decodedTenants) {
      await pool.query(
        `INSERT INTO parent_tenant_links (hostel_id, parent_user_id, tenant_user_id)
         VALUES (?, ?, ?)`,
        [req.hostel.id, result.insertId, tenantId]
      );
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    await applyRoleTemplate(req.hostel.id, result.insertId, 'parent', req.user.id);
    return res.status(201).json({ user: publicUser(rows[0]), temp_password: password });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username or email already exists.', code: 'DUPLICATE' });
    }
    return next(err);
  }
});

router.post('/:id/approve', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const userId = decodeId(req.params.id);
    if (userId == null) {
      return res.status(400).json({ message: 'Invalid user id.', code: 'VALIDATION' });
    }

    const [rows] = await pool.query(
      `SELECT * FROM users WHERE hostel_id = ? AND id = ? AND role = 'tenant' LIMIT 1`,
      [req.hostel.id, userId]
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: 'Tenant not found.', code: 'NOT_FOUND' });
    }

    await pool.query(`UPDATE users SET status = 'active' WHERE id = ? AND hostel_id = ?`, [
      userId,
      req.hostel.id,
    ]);
    await applyRoleTemplate(req.hostel.id, userId, 'tenant', req.user.id);
    await notifyUser(req.hostel.id, userId, {
      title: 'Account approved',
      body: 'You can now sign in to easyHostel4.',
      type: 'users',
      link: '/',
    });

    const [updated] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    return res.json({ user: publicUser(updated[0]) });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/reject', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const userId = decodeId(req.params.id);
    if (userId == null) {
      return res.status(400).json({ message: 'Invalid user id.', code: 'VALIDATION' });
    }

    const [result] = await pool.query(
      `UPDATE users SET status = 'rejected'
       WHERE hostel_id = ? AND id = ? AND role = 'tenant' AND status = 'pending'`,
      [req.hostel.id, userId]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Pending tenant not found.', code: 'NOT_FOUND' });
    }

    await notifyUser(req.hostel.id, userId, {
      title: 'Registration rejected',
      body: 'Please contact the hostel office for help.',
      type: 'users',
      link: '/login',
    });

    const [updated] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    return res.json({ user: publicUser(updated[0]) });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/links', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const parentId = decodeId(req.params.id);
    if (parentId == null) {
      return res.status(400).json({ message: 'Invalid user id.', code: 'VALIDATION' });
    }
    const [rows] = await pool.query(
      `SELECT u.*
       FROM parent_tenant_links l
       JOIN users u ON u.id = l.tenant_user_id
       WHERE l.hostel_id = ? AND l.parent_user_id = ?`,
      [req.hostel.id, parentId]
    );
    return res.json({ tenants: rows.map(publicUser) });
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const userId = decodeId(req.params.id);
    if (userId == null) {
      return res.status(400).json({ message: 'Invalid user id.', code: 'VALIDATION' });
    }

    const [rows] = await pool.query(`SELECT * FROM users WHERE hostel_id = ? AND id = ? LIMIT 1`, [
      req.hostel.id,
      userId,
    ]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found.', code: 'NOT_FOUND' });
    }

    const name = req.body?.name != null ? String(req.body.name).trim() : user.name;
    const email =
      req.body?.email != null ? String(req.body.email).trim().toLowerCase() : user.email;
    const username =
      req.body?.username != null
        ? String(req.body.username).trim().toLowerCase().slice(0, 80) || null
        : user.username;
    const phone =
      req.body?.phone !== undefined
        ? req.body.phone
          ? String(req.body.phone).trim()
          : null
        : user.phone;
    const status = req.body?.status != null ? String(req.body.status) : user.status;
    const password = req.body?.password != null ? String(req.body.password) : '';

    if (!name || !email || !email.includes('@')) {
      return res.status(400).json({ message: 'Name and valid email are required.', code: 'VALIDATION' });
    }
    if (!['pending', 'active', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.', code: 'VALIDATION' });
    }

    let passwordHash = user.password_hash;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          message: 'Password must be at least 6 characters.',
          code: 'VALIDATION',
        });
      }
      passwordHash = await bcrypt.hash(password, 10);
    }

    await pool.query(
      `UPDATE users
       SET name = ?, email = ?, username = ?, phone = ?, status = ?, password_hash = ?
       WHERE id = ? AND hostel_id = ?`,
      [name, email, username, phone, status, passwordHash, userId, req.hostel.id]
    );

    if (user.role === 'parent' && Array.isArray(req.body?.tenant_ids ?? req.body?.tenantIds)) {
      const tenantIds = req.body?.tenant_ids ?? req.body?.tenantIds;
      const decodedTenants = tenantIds.map((id) => decodeId(id)).filter((id) => id != null);
      if (!decodedTenants.length) {
        return res.status(400).json({
          message: 'At least one linked tenant is required for parents.',
          code: 'VALIDATION',
        });
      }
      const [tenants] = await pool.query(
        `SELECT id FROM users
         WHERE hostel_id = ? AND role = 'tenant' AND status = 'active' AND id IN (?)`,
        [req.hostel.id, decodedTenants]
      );
      if (tenants.length !== decodedTenants.length) {
        return res.status(400).json({ message: 'One or more tenants are invalid.', code: 'VALIDATION' });
      }
      await pool.query(`DELETE FROM parent_tenant_links WHERE hostel_id = ? AND parent_user_id = ?`, [
        req.hostel.id,
        userId,
      ]);
      for (const tenantId of decodedTenants) {
        await pool.query(
          `INSERT INTO parent_tenant_links (hostel_id, parent_user_id, tenant_user_id)
           VALUES (?, ?, ?)`,
          [req.hostel.id, userId, tenantId]
        );
      }
    }

    const [updated] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    return res.json({ user: publicUser(updated[0]) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username or email already exists.', code: 'DUPLICATE' });
    }
    return next(err);
  }
});

module.exports = { usersRouter: router };
