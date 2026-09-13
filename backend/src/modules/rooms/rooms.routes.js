const express = require('express');
const { pool } = require('../../config/db');
const { secured, staffRoles } = require('../../middleware/secured');
const { encodeId, decodeId } = require('../../utils/publicId');
const { publicRoom, publicAllocation, publicUser } = require('../../utils/publicModels');

const router = express.Router();

const ROOM_STATUSES = new Set(['available', 'occupied', 'maintenance']);

async function occupancyByRoom(hostelId, roomId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS occupied
     FROM allocations
     WHERE hostel_id = ? AND room_id = ? AND active = 1`,
    [hostelId, roomId]
  );
  return Number(rows[0].occupied);
}

async function syncRoomStatus(hostelId, roomId) {
  const [rooms] = await pool.query(
    `SELECT id, capacity, status FROM rooms WHERE hostel_id = ? AND id = ? LIMIT 1`,
    [hostelId, roomId]
  );
  const room = rooms[0];
  if (!room || room.status === 'maintenance') {
    return room;
  }

  const occupied = await occupancyByRoom(hostelId, roomId);
  const nextStatus = occupied >= room.capacity ? 'occupied' : 'available';
  if (nextStatus !== room.status) {
    await pool.query(`UPDATE rooms SET status = ? WHERE id = ? AND hostel_id = ?`, [
      nextStatus,
      roomId,
      hostelId,
    ]);
    room.status = nextStatus;
  }
  room.occupied = occupied;
  return room;
}

async function loadRoom(hostelId, roomId) {
  const [rows] = await pool.query(
    `SELECT r.*,
            (SELECT COUNT(*) FROM allocations a
             WHERE a.room_id = r.id AND a.active = 1) AS occupied
     FROM rooms r
     WHERE r.hostel_id = ? AND r.id = ?
     LIMIT 1`,
    [hostelId, roomId]
  );
  return rows[0] || null;
}

router.get('/', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*,
              (SELECT COUNT(*) FROM allocations a
               WHERE a.room_id = r.id AND a.active = 1) AS occupied
       FROM rooms r
       WHERE r.hostel_id = ?
       ORDER BY r.code`,
      [req.hostel.id]
    );
    return res.json({ rooms: rows.map(publicRoom) });
  } catch (err) {
    return next(err);
  }
});

router.get('/mine', ...secured('tenant'), async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, r.code AS room_code, r.capacity, r.status AS room_status
       FROM allocations a
       JOIN rooms r ON r.id = a.room_id
       WHERE a.hostel_id = ? AND a.user_id = ? AND a.active = 1
       LIMIT 1`,
      [req.hostel.id, req.user.id]
    );
    if (!rows[0]) {
      return res.json({ allocation: null, room: null });
    }
    return res.json({
      allocation: publicAllocation(rows[0]),
      room: {
        id: encodeId(rows[0].room_id),
        code: rows[0].room_code,
        capacity: rows[0].capacity,
        status: rows[0].room_status,
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/tenants', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const availableOnly = String(req.query.available || '') === '1';
    let sql = `SELECT u.* FROM users u
               WHERE u.hostel_id = ? AND u.role = 'tenant' AND u.status = 'active'`;
    const params = [req.hostel.id];

    if (availableOnly) {
      sql += ` AND u.id NOT IN (
        SELECT user_id FROM allocations WHERE hostel_id = ? AND active = 1
      )`;
      params.push(req.hostel.id);
    }

    sql += ` ORDER BY u.name`;
    const [rows] = await pool.query(sql, params);
    return res.json({ tenants: rows.map(publicUser) });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/allocations', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const roomId = decodeId(req.params.id);
    if (roomId == null) {
      return res.status(400).json({ message: 'Invalid room id.', code: 'VALIDATION' });
    }

    const [rows] = await pool.query(
      `SELECT a.*, r.code AS room_code, u.name AS tenant_name, u.email AS tenant_email
       FROM allocations a
       JOIN rooms r ON r.id = a.room_id
       JOIN users u ON u.id = a.user_id
       WHERE a.hostel_id = ? AND a.room_id = ? AND a.active = 1
       ORDER BY a.created_at`,
      [req.hostel.id, roomId]
    );
    return res.json({ allocations: rows.map(publicAllocation) });
  } catch (err) {
    return next(err);
  }
});

router.post('/', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const code = String(req.body?.code || '').trim().toUpperCase();
    const capacity = Number(req.body?.capacity || 1);
    const status = String(req.body?.status || 'available');

    if (!code) {
      return res.status(400).json({ message: 'Room code is required.', code: 'VALIDATION' });
    }
    if (!Number.isInteger(capacity) || capacity < 1) {
      return res.status(400).json({ message: 'Capacity must be a positive integer.', code: 'VALIDATION' });
    }
    if (!ROOM_STATUSES.has(status)) {
      return res.status(400).json({ message: 'Invalid room status.', code: 'VALIDATION' });
    }

    const [result] = await pool.query(
      `INSERT INTO rooms (hostel_id, code, capacity, status) VALUES (?, ?, ?, ?)`,
      [req.hostel.id, code, capacity, status]
    );
    const room = await loadRoom(req.hostel.id, result.insertId);
    return res.status(201).json({ room: publicRoom(room) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Room code already exists.', code: 'DUPLICATE' });
    }
    return next(err);
  }
});

router.patch('/:id', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const roomId = decodeId(req.params.id);
    if (roomId == null) {
      return res.status(400).json({ message: 'Invalid room id.', code: 'VALIDATION' });
    }

    const existing = await loadRoom(req.hostel.id, roomId);
    if (!existing) {
      return res.status(404).json({ message: 'Room not found.', code: 'NOT_FOUND' });
    }

    const code =
      req.body?.code != null ? String(req.body.code).trim().toUpperCase() : existing.code;
    const capacity =
      req.body?.capacity != null ? Number(req.body.capacity) : existing.capacity;
    const status = req.body?.status != null ? String(req.body.status) : existing.status;

    if (!code) {
      return res.status(400).json({ message: 'Room code is required.', code: 'VALIDATION' });
    }
    if (!Number.isInteger(capacity) || capacity < 1) {
      return res.status(400).json({ message: 'Capacity must be a positive integer.', code: 'VALIDATION' });
    }
    if (!ROOM_STATUSES.has(status)) {
      return res.status(400).json({ message: 'Invalid room status.', code: 'VALIDATION' });
    }
    if (capacity < Number(existing.occupied)) {
      return res.status(400).json({
        message: 'Capacity cannot be less than current occupancy.',
        code: 'VALIDATION',
      });
    }

    await pool.query(
      `UPDATE rooms SET code = ?, capacity = ?, status = ? WHERE id = ? AND hostel_id = ?`,
      [code, capacity, status, roomId, req.hostel.id]
    );

    if (status !== 'maintenance') {
      await syncRoomStatus(req.hostel.id, roomId);
    }

    const room = await loadRoom(req.hostel.id, roomId);
    return res.json({ room: publicRoom(room) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Room code already exists.', code: 'DUPLICATE' });
    }
    return next(err);
  }
});

router.post('/allocate', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const roomId = decodeId(req.body?.room_id ?? req.body?.roomId);
    const userId = decodeId(req.body?.user_id ?? req.body?.userId);
    const startDate = String(
      req.body?.start_date ?? req.body?.startDate ?? new Date().toISOString().slice(0, 10)
    );

    if (roomId == null || userId == null) {
      return res.status(400).json({ message: 'room_id and user_id are required.', code: 'VALIDATION' });
    }

    const room = await loadRoom(req.hostel.id, roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.', code: 'NOT_FOUND' });
    }
    if (room.status === 'maintenance') {
      return res.status(409).json({ message: 'Room is under maintenance.', code: 'ROOM_MAINTENANCE' });
    }
    if (Number(room.occupied) >= room.capacity) {
      return res.status(409).json({ message: 'Room is full.', code: 'ROOM_FULL' });
    }

    const [tenants] = await pool.query(
      `SELECT * FROM users WHERE hostel_id = ? AND id = ? AND role = 'tenant' LIMIT 1`,
      [req.hostel.id, userId]
    );
    if (!tenants[0]) {
      return res.status(404).json({ message: 'Tenant not found.', code: 'NOT_FOUND' });
    }

    const [existing] = await pool.query(
      `SELECT id FROM allocations WHERE hostel_id = ? AND user_id = ? AND active = 1 LIMIT 1`,
      [req.hostel.id, userId]
    );
    if (existing[0]) {
      return res.status(409).json({
        message: 'Tenant already has an active room.',
        code: 'ALREADY_ALLOCATED',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO allocations (hostel_id, room_id, user_id, start_date, active)
       VALUES (?, ?, ?, ?, 1)`,
      [req.hostel.id, roomId, userId, startDate]
    );
    await syncRoomStatus(req.hostel.id, roomId);

    const [rows] = await pool.query(
      `SELECT a.*, r.code AS room_code, u.name AS tenant_name, u.email AS tenant_email
       FROM allocations a
       JOIN rooms r ON r.id = a.room_id
       JOIN users u ON u.id = a.user_id
       WHERE a.id = ? LIMIT 1`,
      [result.insertId]
    );
    return res.status(201).json({ allocation: publicAllocation(rows[0]) });
  } catch (err) {
    return next(err);
  }
});

router.post('/release', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const allocationId = decodeId(req.body?.allocation_id ?? req.body?.allocationId);
    if (allocationId == null) {
      return res.status(400).json({ message: 'allocation_id is required.', code: 'VALIDATION' });
    }

    const [rows] = await pool.query(
      `SELECT * FROM allocations WHERE hostel_id = ? AND id = ? AND active = 1 LIMIT 1`,
      [req.hostel.id, allocationId]
    );
    const allocation = rows[0];
    if (!allocation) {
      return res.status(404).json({ message: 'Active allocation not found.', code: 'NOT_FOUND' });
    }

    await pool.query(
      `UPDATE allocations
       SET active = 0, end_date = CURDATE()
       WHERE id = ? AND hostel_id = ?`,
      [allocationId, req.hostel.id]
    );
    await syncRoomStatus(req.hostel.id, allocation.room_id);

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = { roomsRouter: router };
