const express = require('express');
const { pool } = require('../../config/db');
const { secured, staffRoles } = require('../../middleware/secured');

const router = express.Router();

async function linkedTenantIds(hostelId, parentUserId) {
  const [rows] = await pool.query(
    `SELECT tenant_user_id AS id FROM parent_tenant_links
     WHERE hostel_id = ? AND parent_user_id = ?`,
    [hostelId, parentUserId]
  );
  return rows.map((r) => r.id);
}

router.get('/', ...secured(), async (req, res, next) => {
  try {
    const hostelId = req.hostel.id;
    const isStaff = staffRoles.includes(req.user.role);
    const isParent = req.user.role === 'parent';
    const linkedIds = isParent ? await linkedTenantIds(hostelId, req.user.id) : [];

    const [[rooms]] = await pool.query(
      `SELECT
         COUNT(*) AS total_rooms,
         COALESCE(SUM(capacity), 0) AS total_beds,
         COALESCE(SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END), 0) AS maintenance_rooms
       FROM rooms WHERE hostel_id = ?`,
      [hostelId]
    );

    const [[occ]] = await pool.query(
      `SELECT COUNT(*) AS occupied_beds
       FROM allocations WHERE hostel_id = ? AND active = 1`,
      [hostelId]
    );

    let dues;
    let complaints;
    if (isStaff) {
      [[dues]] = await pool.query(
        `SELECT COUNT(*) AS pending_count, COALESCE(SUM(amount), 0) AS pending_amount
         FROM fees WHERE hostel_id = ? AND status = 'due'`,
        [hostelId]
      );
      [[complaints]] = await pool.query(
        `SELECT COUNT(*) AS open_count
         FROM complaints
         WHERE hostel_id = ? AND status IN ('open', 'in_progress')`,
        [hostelId]
      );
    } else if (isParent) {
      if (!linkedIds.length) {
        dues = { pending_count: 0, pending_amount: 0 };
        complaints = { open_count: 0 };
      } else {
        [[dues]] = await pool.query(
          `SELECT COUNT(*) AS pending_count, COALESCE(SUM(amount), 0) AS pending_amount
           FROM fees WHERE hostel_id = ? AND status = 'due' AND user_id IN (?)`,
          [hostelId, linkedIds]
        );
        [[complaints]] = await pool.query(
          `SELECT COUNT(*) AS open_count
           FROM complaints
           WHERE hostel_id = ? AND user_id IN (?) AND status IN ('open', 'in_progress')`,
          [hostelId, linkedIds]
        );
      }
    } else {
      [[dues]] = await pool.query(
        `SELECT COUNT(*) AS pending_count, COALESCE(SUM(amount), 0) AS pending_amount
         FROM fees WHERE hostel_id = ? AND status = 'due' AND user_id = ?`,
        [hostelId, req.user.id]
      );
      [[complaints]] = await pool.query(
        `SELECT COUNT(*) AS open_count
         FROM complaints
         WHERE hostel_id = ? AND user_id = ? AND status IN ('open', 'in_progress')`,
        [hostelId, req.user.id]
      );
    }

    let myRoom = null;
    if (!isStaff && !isParent) {
      const [alloc] = await pool.query(
        `SELECT r.code
         FROM allocations a
         JOIN rooms r ON r.id = a.room_id
         WHERE a.hostel_id = ? AND a.user_id = ? AND a.active = 1
         LIMIT 1`,
        [hostelId, req.user.id]
      );
      myRoom = alloc[0]?.code || null;
    }

    return res.json({
      occupancy: {
        total_rooms: Number(rooms.total_rooms),
        total_beds: Number(rooms.total_beds),
        occupied_beds: Number(occ.occupied_beds),
        maintenance_rooms: Number(rooms.maintenance_rooms),
      },
      dues: {
        pending_count: Number(dues.pending_count),
        pending_amount: Number(dues.pending_amount),
      },
      complaints: {
        open_count: Number(complaints.open_count),
      },
      my_room: myRoom,
      linked_tenant_count: isParent ? linkedIds.length : undefined,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = { dashboardRouter: router };
