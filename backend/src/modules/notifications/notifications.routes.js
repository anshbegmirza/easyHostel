const express = require('express');
const { pool } = require('../../config/db');
const { secured } = require('../../middleware/secured');
const { decodeId } = require('../../utils/publicId');
const { publicNotification } = require('../../utils/publicModels');

const router = express.Router();

router.get('/', ...secured(), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM notifications
       WHERE hostel_id = ? AND user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.hostel.id, req.user.id]
    );
    const unread = rows.filter((r) => !r.read_at).length;
    return res.json({ notifications: rows.map(publicNotification), unread });
  } catch (err) {
    return next(err);
  }
});

router.post('/read-all', ...secured(), async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE notifications SET read_at = NOW()
       WHERE hostel_id = ? AND user_id = ? AND read_at IS NULL`,
      [req.hostel.id, req.user.id]
    );
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/read', ...secured(), async (req, res, next) => {
  try {
    const id = decodeId(req.params.id);
    if (id == null) {
      return res.status(400).json({ message: 'Invalid id.', code: 'VALIDATION' });
    }
    await pool.query(
      `UPDATE notifications SET read_at = NOW()
       WHERE hostel_id = ? AND user_id = ? AND id = ?`,
      [req.hostel.id, req.user.id, id]
    );
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = { notificationsRouter: router };
