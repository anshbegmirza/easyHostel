const express = require('express');
const { pool } = require('../../config/db');
const { secured, staffRoles } = require('../../middleware/secured');
const { decodeId } = require('../../utils/publicId');
const { publicFee, publicPayment } = require('../../utils/publicModels');
const { notifyUser } = require('../../utils/notify');

const router = express.Router();

const FEE_STATUSES = new Set(['due', 'paid', 'waived']);

async function linkedTenantIds(hostelId, parentUserId) {
  const [rows] = await pool.query(
    `SELECT tenant_user_id AS id FROM parent_tenant_links
     WHERE hostel_id = ? AND parent_user_id = ?`,
    [hostelId, parentUserId]
  );
  return rows.map((r) => r.id);
}

async function loadFee(hostelId, feeId) {
  const [rows] = await pool.query(
    `SELECT f.*, u.name AS tenant_name, u.email AS tenant_email
     FROM fees f
     JOIN users u ON u.id = f.user_id
     WHERE f.hostel_id = ? AND f.id = ?
     LIMIT 1`,
    [hostelId, feeId]
  );
  return rows[0] || null;
}

router.get('/', ...secured(), async (req, res, next) => {
  try {
    const isStaff = staffRoles.includes(req.user.role);
    const params = [req.hostel.id];
    let sql = `SELECT f.*, u.name AS tenant_name, u.email AS tenant_email
               FROM fees f
               JOIN users u ON u.id = f.user_id
               WHERE f.hostel_id = ?`;

    if (isStaff) {
      const rawUserId = req.query.user_id ?? req.query.userId;
      if (rawUserId) {
        const userId = decodeId(rawUserId);
        if (userId == null) {
          return res.status(400).json({ message: 'Invalid user_id.', code: 'VALIDATION' });
        }
        sql += ` AND f.user_id = ?`;
        params.push(userId);
      }
    } else if (req.user.role === 'parent') {
      const ids = await linkedTenantIds(req.hostel.id, req.user.id);
      if (!ids.length) {
        return res.json({ fees: [] });
      }
      sql += ` AND f.user_id IN (?)`;
      params.push(ids);
    } else if (req.user.role === 'tenant') {
      sql += ` AND f.user_id = ?`;
      params.push(req.user.id);
    } else {
      return res.status(403).json({ message: 'Forbidden.', code: 'FORBIDDEN' });
    }

    sql += ` ORDER BY f.due_date IS NULL, f.due_date DESC, f.created_at DESC`;
    const [rows] = await pool.query(sql, params);
    return res.json({ fees: rows.map(publicFee) });
  } catch (err) {
    return next(err);
  }
});

router.post('/', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const userId = decodeId(req.body?.user_id ?? req.body?.userId);
    const periodLabel = String(req.body?.period_label ?? req.body?.periodLabel ?? '').trim();
    const amount = Number(req.body?.amount);
    const dueDate = (req.body?.due_date ?? req.body?.dueDate)
      ? String(req.body?.due_date ?? req.body?.dueDate)
      : null;

    if (userId == null || !periodLabel || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        message: 'user_id, period_label, and a positive amount are required.',
        code: 'VALIDATION',
      });
    }

    const [tenants] = await pool.query(
      `SELECT id FROM users
       WHERE hostel_id = ? AND id = ? AND role = 'tenant' AND status = 'active'
       LIMIT 1`,
      [req.hostel.id, userId]
    );
    if (!tenants[0]) {
      return res.status(404).json({ message: 'Tenant not found.', code: 'NOT_FOUND' });
    }

    const [result] = await pool.query(
      `INSERT INTO fees (hostel_id, user_id, period_label, amount, status, due_date)
       VALUES (?, ?, ?, ?, 'due', ?)`,
      [req.hostel.id, userId, periodLabel, amount, dueDate]
    );

    await notifyUser(req.hostel.id, userId, {
      title: 'New fee due',
      body: `${periodLabel}: ₹${amount}`,
      type: 'fees',
      link: '/fees',
    });

    const fee = await loadFee(req.hostel.id, result.insertId);
    return res.status(201).json({ fee: publicFee(fee) });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/receipt', ...secured(), async (req, res, next) => {
  try {
    const feeId = decodeId(req.params.id);
    if (feeId == null) {
      return res.status(400).json({ message: 'Invalid fee id.', code: 'VALIDATION' });
    }

    const fee = await loadFee(req.hostel.id, feeId);
    if (!fee) {
      return res.status(404).json({ message: 'Fee not found.', code: 'NOT_FOUND' });
    }

    const isStaff = staffRoles.includes(req.user.role);
    let allowed = isStaff || (req.user.role === 'tenant' && fee.user_id === req.user.id);
    if (!allowed && req.user.role === 'parent') {
      const ids = await linkedTenantIds(req.hostel.id, req.user.id);
      allowed = ids.includes(fee.user_id);
    }
    if (!allowed) {
      return res.status(403).json({ message: 'Forbidden.', code: 'FORBIDDEN' });
    }
    if (fee.status !== 'paid') {
      return res.status(409).json({ message: 'Fee is not paid yet.', code: 'NOT_PAID' });
    }

    const [payments] = await pool.query(
      `SELECT p.*, f.period_label, u.name AS tenant_name
       FROM payments p
       JOIN fees f ON f.id = p.fee_id
       JOIN users u ON u.id = f.user_id
       WHERE p.hostel_id = ? AND p.fee_id = ?
       ORDER BY p.paid_at DESC
       LIMIT 1`,
      [req.hostel.id, feeId]
    );

    return res.json({
      fee: publicFee(fee),
      payment: payments[0] ? publicPayment(payments[0]) : null,
      hostel: {
        name: req.hostel.name,
        partner: req.hostel.partner,
        address: req.hostel.address,
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const feeId = decodeId(req.params.id);
    if (feeId == null) {
      return res.status(400).json({ message: 'Invalid fee id.', code: 'VALIDATION' });
    }

    const fee = await loadFee(req.hostel.id, feeId);
    if (!fee) {
      return res.status(404).json({ message: 'Fee not found.', code: 'NOT_FOUND' });
    }

    const status = req.body?.status != null ? String(req.body.status) : fee.status;
    if (!FEE_STATUSES.has(status)) {
      return res.status(400).json({ message: 'Invalid fee status.', code: 'VALIDATION' });
    }

    await pool.query(`UPDATE fees SET status = ? WHERE id = ? AND hostel_id = ?`, [
      status,
      feeId,
      req.hostel.id,
    ]);

    if (status === 'paid' && fee.status !== 'paid') {
      await pool.query(
        `INSERT INTO payments (hostel_id, fee_id, amount, method)
         VALUES (?, ?, ?, ?)`,
        [req.hostel.id, feeId, fee.amount, String(req.body?.method || 'manual')]
      );
    }

    await notifyUser(req.hostel.id, fee.user_id, {
      title: 'Fee status updated',
      body: `${fee.period_label} is now ${status}.`,
      type: 'fees',
      link: '/fees',
    });

    const updated = await loadFee(req.hostel.id, feeId);
    return res.json({ fee: publicFee(updated) });
  } catch (err) {
    return next(err);
  }
});

module.exports = { feesRouter: router };
