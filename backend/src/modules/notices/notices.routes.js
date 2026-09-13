const express = require('express');
const { pool } = require('../../config/db');
const { secured, staffRoles } = require('../../middleware/secured');
const { decodeId } = require('../../utils/publicId');
const { publicNotice } = require('../../utils/publicModels');

const router = express.Router();

router.get('/', ...secured(), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, u.name AS created_by_name
       FROM notices n
       LEFT JOIN users u ON u.id = n.created_by
       WHERE n.hostel_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.hostel.id]
    );
    return res.json({ notices: rows.map(publicNotice) });
  } catch (err) {
    return next(err);
  }
});

router.post('/', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const title = String(req.body?.title || '').trim();
    const body = String(req.body?.body || '').trim();

    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required.', code: 'VALIDATION' });
    }

    const [result] = await pool.query(
      `INSERT INTO notices (hostel_id, title, body, created_by) VALUES (?, ?, ?, ?)`,
      [req.hostel.id, title, body, req.user.id]
    );

    const [rows] = await pool.query(
      `SELECT n.*, u.name AS created_by_name
       FROM notices n
       LEFT JOIN users u ON u.id = n.created_by
       WHERE n.id = ? LIMIT 1`,
      [result.insertId]
    );
    return res.status(201).json({ notice: publicNotice(rows[0]) });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const noticeId = decodeId(req.params.id);
    if (noticeId == null) {
      return res.status(400).json({ message: 'Invalid notice id.', code: 'VALIDATION' });
    }

    const [result] = await pool.query(
      `DELETE FROM notices WHERE id = ? AND hostel_id = ?`,
      [noticeId, req.hostel.id]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Notice not found.', code: 'NOT_FOUND' });
    }
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = { noticesRouter: router };
