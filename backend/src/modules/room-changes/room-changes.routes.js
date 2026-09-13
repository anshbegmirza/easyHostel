const express = require('express');
const { pool } = require('../../config/db');
const { secured, staffRoles } = require('../../middleware/secured');
const { decodeId } = require('../../utils/publicId');
const { publicRoomChange } = require('../../utils/publicModels');
const { notifyUser, notifyRoles } = require('../../utils/notify');

const router = express.Router();

async function loadRequest(hostelId, id) {
  const [rows] = await pool.query(
    `SELECT r.*,
            u.name AS tenant_name,
            fr.code AS from_room_code,
            tr.code AS to_room_code
     FROM room_change_requests r
     JOIN users u ON u.id = r.user_id
     LEFT JOIN rooms fr ON fr.id = r.from_room_id
     LEFT JOIN rooms tr ON tr.id = r.to_room_id
     WHERE r.hostel_id = ? AND r.id = ?
     LIMIT 1`,
    [hostelId, id]
  );
  return rows[0] || null;
}

router.get('/', ...secured(), async (req, res, next) => {
  try {
    const isStaff = staffRoles.includes(req.user.role);
    const params = [req.hostel.id];
    let sql = `SELECT r.*,
                      u.name AS tenant_name,
                      fr.code AS from_room_code,
                      tr.code AS to_room_code
               FROM room_change_requests r
               JOIN users u ON u.id = r.user_id
               LEFT JOIN rooms fr ON fr.id = r.from_room_id
               LEFT JOIN rooms tr ON tr.id = r.to_room_id
               WHERE r.hostel_id = ?`;

    if (!isStaff) {
      sql += ` AND r.user_id = ?`;
      params.push(req.user.id);
    }

    sql += ` ORDER BY FIELD(r.status, 'pending', 'approved', 'rejected'), r.created_at DESC`;
    const [rows] = await pool.query(sql, params);
    return res.json({ requests: rows.map(publicRoomChange) });
  } catch (err) {
    return next(err);
  }
});

router.post('/', ...secured('tenant'), async (req, res, next) => {
  try {
    const reason = String(req.body?.reason || '').trim();
    if (!reason) {
      return res.status(400).json({ message: 'Reason is required.', code: 'VALIDATION' });
    }

    const [pending] = await pool.query(
      `SELECT id FROM room_change_requests
       WHERE hostel_id = ? AND user_id = ? AND status = 'pending'
       LIMIT 1`,
      [req.hostel.id, req.user.id]
    );
    if (pending[0]) {
      return res.status(409).json({
        message: 'You already have a pending room-change request.',
        code: 'PENDING_EXISTS',
      });
    }

    const [alloc] = await pool.query(
      `SELECT room_id FROM allocations
       WHERE hostel_id = ? AND user_id = ? AND active = 1
       LIMIT 1`,
      [req.hostel.id, req.user.id]
    );
    if (!alloc[0]) {
      return res.status(400).json({
        message: 'You need an allocated room before requesting a change.',
        code: 'NO_ROOM',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO room_change_requests
        (hostel_id, user_id, from_room_id, reason, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [req.hostel.id, req.user.id, alloc[0].room_id, reason]
    );

    await notifyRoles(req.hostel.id, ['superuser', 'admin', 'staff'], {
      title: 'Room change requested',
      body: 'A tenant requested a room change.',
      type: 'rooms',
      link: '/room-changes',
    });

    const row = await loadRequest(req.hostel.id, result.insertId);
    return res.status(201).json({ request: publicRoomChange(row) });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/decide', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const id = decodeId(req.params.id);
    const decision = String(req.body?.status || '');
    const staffNote = String(req.body?.staff_note ?? req.body?.staffNote ?? '').trim();
    const toRoomRaw = req.body?.to_room_id ?? req.body?.toRoomId;
    const toRoomId = toRoomRaw ? decodeId(toRoomRaw) : null;

    if (id == null || !['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({
        message: 'status must be approved or rejected.',
        code: 'VALIDATION',
      });
    }

    const existing = await loadRequest(req.hostel.id, id);
    if (!existing) {
      return res.status(404).json({ message: 'Request not found.', code: 'NOT_FOUND' });
    }
    if (existing.status !== 'pending') {
      return res.status(409).json({ message: 'Request already decided.', code: 'ALREADY_DECIDED' });
    }

    if (decision === 'approved') {
      if (toRoomId == null) {
        return res.status(400).json({
          message: 'to_room_id is required when approving.',
          code: 'VALIDATION',
        });
      }

      const [rooms] = await pool.query(
        `SELECT r.*,
                (SELECT COUNT(*) FROM allocations a WHERE a.room_id = r.id AND a.active = 1) AS occupied
         FROM rooms r
         WHERE r.hostel_id = ? AND r.id = ?
         LIMIT 1`,
        [req.hostel.id, toRoomId]
      );
      const room = rooms[0];
      if (!room || room.status === 'maintenance') {
        return res.status(409).json({ message: 'Target room is not available.', code: 'ROOM_UNAVAILABLE' });
      }
      if (Number(room.occupied) >= room.capacity) {
        return res.status(409).json({ message: 'Target room is full.', code: 'ROOM_FULL' });
      }

      await pool.query(
        `UPDATE allocations
         SET active = 0, end_date = CURDATE()
         WHERE hostel_id = ? AND user_id = ? AND active = 1`,
        [req.hostel.id, existing.user_id]
      );
      await pool.query(
        `INSERT INTO allocations (hostel_id, room_id, user_id, start_date, active)
         VALUES (?, ?, ?, CURDATE(), 1)`,
        [req.hostel.id, toRoomId, existing.user_id]
      );

      // sync both rooms
      for (const roomId of [existing.from_room_id, toRoomId].filter(Boolean)) {
        const [rrows] = await pool.query(
          `SELECT id, capacity, status FROM rooms WHERE id = ? AND hostel_id = ?`,
          [roomId, req.hostel.id]
        );
        const r = rrows[0];
        if (r && r.status !== 'maintenance') {
          const [occ] = await pool.query(
            `SELECT COUNT(*) AS c FROM allocations WHERE room_id = ? AND active = 1`,
            [roomId]
          );
          const next = Number(occ[0].c) >= r.capacity ? 'occupied' : 'available';
          await pool.query(`UPDATE rooms SET status = ? WHERE id = ?`, [next, roomId]);
        }
      }
    }

    await pool.query(
      `UPDATE room_change_requests
       SET status = ?, staff_note = ?, to_room_id = ?, decided_by = ?
       WHERE id = ? AND hostel_id = ?`,
      [
        decision,
        staffNote || null,
        decision === 'approved' ? toRoomId : null,
        req.user.id,
        id,
        req.hostel.id,
      ]
    );

    await notifyUser(req.hostel.id, existing.user_id, {
      title: decision === 'approved' ? 'Room change approved' : 'Room change rejected',
      body: staffNote || (decision === 'approved' ? 'Your room has been updated.' : 'Please contact staff.'),
      type: 'rooms',
      link: '/my-room',
    });

    const row = await loadRequest(req.hostel.id, id);
    return res.json({ request: publicRoomChange(row) });
  } catch (err) {
    return next(err);
  }
});

module.exports = { roomChangesRouter: router };
