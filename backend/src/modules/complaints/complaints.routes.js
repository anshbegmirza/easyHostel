const path = require('path');
const fs = require('fs');
const express = require('express');
const { pool } = require('../../config/db');
const { secured, staffRoles } = require('../../middleware/secured');
const { decodeId } = require('../../utils/publicId');
const { publicComplaint, publicComplaintEvent } = require('../../utils/publicModels');
const { notifyUser, notifyRoles, slaDueAt } = require('../../utils/notify');
const { complaintPhotoUpload } = require('../../utils/uploads');

const router = express.Router();

const PRIORITIES = new Set(['low', 'medium', 'high']);
const STATUSES = new Set(['open', 'in_progress', 'resolved', 'closed']);

async function linkedTenantIds(hostelId, parentUserId) {
  const [rows] = await pool.query(
    `SELECT tenant_user_id AS id FROM parent_tenant_links
     WHERE hostel_id = ? AND parent_user_id = ?`,
    [hostelId, parentUserId]
  );
  return rows.map((r) => r.id);
}

async function loadComplaint(hostelId, complaintId) {
  const [rows] = await pool.query(
    `SELECT c.*, u.name AS tenant_name
     FROM complaints c
     JOIN users u ON u.id = c.user_id
     WHERE c.hostel_id = ? AND c.id = ?
     LIMIT 1`,
    [hostelId, complaintId]
  );
  return rows[0] || null;
}

async function loadEvents(hostelId, complaintId) {
  const [rows] = await pool.query(
    `SELECT e.*, u.name AS actor_name
     FROM complaint_events e
     LEFT JOIN users u ON u.id = e.actor_user_id
     WHERE e.hostel_id = ? AND e.complaint_id = ?
     ORDER BY e.created_at ASC`,
    [hostelId, complaintId]
  );
  return rows.map(publicComplaintEvent);
}

async function appendEvent(hostelId, complaintId, actorUserId, status, note) {
  await pool.query(
    `INSERT INTO complaint_events (hostel_id, complaint_id, actor_user_id, status, note)
     VALUES (?, ?, ?, ?, ?)`,
    [hostelId, complaintId, actorUserId, status, note || null]
  );
}

async function canViewComplaint(req, complaint) {
  if (staffRoles.includes(req.user.role)) {
    return true;
  }
  if (req.user.role === 'tenant') {
    return complaint.user_id === req.user.id;
  }
  if (req.user.role === 'parent') {
    const ids = await linkedTenantIds(req.hostel.id, req.user.id);
    return ids.includes(complaint.user_id);
  }
  return false;
}

router.get('/', ...secured(), async (req, res, next) => {
  try {
    const isStaff = staffRoles.includes(req.user.role);
    const params = [req.hostel.id];
    let sql = `SELECT c.*, u.name AS tenant_name
               FROM complaints c
               JOIN users u ON u.id = c.user_id
               WHERE c.hostel_id = ?`;

    if (isStaff) {
      // all
    } else if (req.user.role === 'parent') {
      const ids = await linkedTenantIds(req.hostel.id, req.user.id);
      if (!ids.length) {
        return res.json({ complaints: [] });
      }
      sql += ` AND c.user_id IN (?)`;
      params.push(ids);
    } else if (req.user.role === 'tenant') {
      sql += ` AND c.user_id = ?`;
      params.push(req.user.id);
    } else {
      return res.status(403).json({ message: 'Forbidden.', code: 'FORBIDDEN' });
    }

    sql += ` ORDER BY FIELD(c.status, 'open', 'in_progress', 'resolved', 'closed'), c.updated_at DESC`;
    const [rows] = await pool.query(sql, params);
    return res.json({ complaints: rows.map(publicComplaint) });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/photo', ...secured(), async (req, res, next) => {
  try {
    const complaintId = decodeId(req.params.id);
    if (complaintId == null) {
      return res.status(400).json({ message: 'Invalid complaint id.', code: 'VALIDATION' });
    }
    const complaint = await loadComplaint(req.hostel.id, complaintId);
    if (!complaint || !(await canViewComplaint(req, complaint))) {
      return res.status(404).json({ message: 'Photo not found.', code: 'NOT_FOUND' });
    }
    if (!complaint.photo_path || !fs.existsSync(complaint.photo_path)) {
      return res.status(404).json({ message: 'Photo not found.', code: 'NOT_FOUND' });
    }
    return res.sendFile(path.resolve(complaint.photo_path));
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', ...secured(), async (req, res, next) => {
  try {
    const complaintId = decodeId(req.params.id);
    if (complaintId == null) {
      return res.status(400).json({ message: 'Invalid complaint id.', code: 'VALIDATION' });
    }

    const complaint = await loadComplaint(req.hostel.id, complaintId);
    if (!complaint || !(await canViewComplaint(req, complaint))) {
      return res.status(404).json({ message: 'Complaint not found.', code: 'NOT_FOUND' });
    }

    const events = await loadEvents(req.hostel.id, complaintId);
    return res.json({ complaint: publicComplaint(complaint), events });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/',
  ...secured('tenant'),
  (req, res, next) => {
    complaintPhotoUpload.single('photo')(req, res, (err) => {
      if (err) {
        err.status = 400;
        return next(err);
      }
      return next();
    });
  },
  async (req, res, next) => {
    try {
      const title = String(req.body?.title || '').trim();
      const description = String(req.body?.description || '').trim();
      const priority = String(req.body?.priority || 'medium');

      if (!title) {
        return res.status(400).json({ message: 'Title is required.', code: 'VALIDATION' });
      }
      if (!PRIORITIES.has(priority)) {
        return res.status(400).json({ message: 'Invalid priority.', code: 'VALIDATION' });
      }

      const due = slaDueAt(priority);
      const photoPath = req.file ? req.file.path : null;

      const [result] = await pool.query(
        `INSERT INTO complaints
          (hostel_id, user_id, title, description, priority, status, sla_due_at, photo_path)
         VALUES (?, ?, ?, ?, ?, 'open', ?, ?)`,
        [req.hostel.id, req.user.id, title, description || null, priority, due, photoPath]
      );
      await appendEvent(req.hostel.id, result.insertId, req.user.id, 'open', 'Complaint created');

      await notifyRoles(req.hostel.id, ['superuser', 'admin', 'staff'], {
        title: 'New complaint',
        body: title,
        type: 'complaints',
        link: `/complaints/${require('../../utils/publicId').encodeId(result.insertId)}`,
      });

      const complaint = await loadComplaint(req.hostel.id, result.insertId);
      const events = await loadEvents(req.hostel.id, result.insertId);
      return res.status(201).json({ complaint: publicComplaint(complaint), events });
    } catch (err) {
      return next(err);
    }
  }
);

router.patch('/:id/status', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const complaintId = decodeId(req.params.id);
    if (complaintId == null) {
      return res.status(400).json({ message: 'Invalid complaint id.', code: 'VALIDATION' });
    }

    const status = String(req.body?.status || '');
    const note = String(req.body?.note || '').trim();

    if (!STATUSES.has(status)) {
      return res.status(400).json({ message: 'Invalid status.', code: 'VALIDATION' });
    }

    const complaint = await loadComplaint(req.hostel.id, complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.', code: 'NOT_FOUND' });
    }

    await pool.query(`UPDATE complaints SET status = ? WHERE id = ? AND hostel_id = ?`, [
      status,
      complaintId,
      req.hostel.id,
    ]);
    await appendEvent(req.hostel.id, complaintId, req.user.id, status, note || `Status → ${status}`);

    await notifyUser(req.hostel.id, complaint.user_id, {
      title: 'Complaint updated',
      body: `${complaint.title} → ${status}`,
      type: 'complaints',
      link: `/complaints/${require('../../utils/publicId').encodeId(complaintId)}`,
    });

    const updated = await loadComplaint(req.hostel.id, complaintId);
    const events = await loadEvents(req.hostel.id, complaintId);
    return res.json({ complaint: publicComplaint(updated), events });
  } catch (err) {
    return next(err);
  }
});

module.exports = { complaintsRouter: router };
