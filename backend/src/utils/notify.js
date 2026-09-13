const { pool } = require('../config/db');

async function notifyUser(hostelId, userId, { title, body, type = 'info', link = null }) {
  await pool.query(
    `INSERT INTO notifications (hostel_id, user_id, title, body, type, link)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [hostelId, userId, title, body, type, link]
  );
}

async function notifyRoles(hostelId, roles, payload) {
  const [rows] = await pool.query(
    `SELECT id FROM users
     WHERE hostel_id = ? AND status = 'active' AND role IN (?)`,
    [hostelId, roles]
  );
  for (const row of rows) {
    await notifyUser(hostelId, row.id, payload);
  }
}

function slaDueAt(priority, from = new Date()) {
  const hours = priority === 'high' ? 24 : priority === 'low' ? 24 * 7 : 72;
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

module.exports = { notifyUser, notifyRoles, slaDueAt };
