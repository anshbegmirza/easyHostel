const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { pool } = require('../../config/db');
const { secured, staffRoles } = require('../../middleware/secured');

const router = express.Router();

async function occupancyRows(hostelId) {
  const [rows] = await pool.query(
    `SELECT r.code, r.capacity, r.status,
            (SELECT COUNT(*) FROM allocations a WHERE a.room_id = r.id AND a.active = 1) AS occupied
     FROM rooms r
     WHERE r.hostel_id = ?
     ORDER BY r.code`,
    [hostelId]
  );
  return rows;
}

async function feeRows(hostelId) {
  const [rows] = await pool.query(
    `SELECT f.period_label, f.amount, f.status, f.due_date, u.name AS tenant_name, u.email AS tenant_email
     FROM fees f
     JOIN users u ON u.id = f.user_id
     WHERE f.hostel_id = ?
     ORDER BY f.created_at DESC`,
    [hostelId]
  );
  return rows;
}

async function complaintRows(hostelId) {
  const [rows] = await pool.query(
    `SELECT c.title, c.priority, c.status, c.sla_due_at, c.created_at, u.name AS tenant_name
     FROM complaints c
     JOIN users u ON u.id = c.user_id
     WHERE c.hostel_id = ?
     ORDER BY c.created_at DESC`,
    [hostelId]
  );
  return rows;
}

function sendExcel(res, filename, sheetName, columns, rows) {
  return (async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = columns;
    rows.forEach((row) => sheet.addRow(row));
    sheet.getRow(1).font = { bold: true };
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  })();
}

function sendPdf(res, filename, title, lines) {
  const doc = new PDFDocument({ margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  doc.fontSize(16).text(title, { underline: true });
  doc.moveDown();
  doc.fontSize(10);
  for (const line of lines) {
    doc.text(line);
  }
  doc.end();
}

router.get('/occupancy.xlsx', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const rows = await occupancyRows(req.hostel.id);
    await sendExcel(
      res,
      'occupancy.xlsx',
      'Occupancy',
      [
        { header: 'Code', key: 'code', width: 12 },
        { header: 'Capacity', key: 'capacity', width: 12 },
        { header: 'Occupied', key: 'occupied', width: 12 },
        { header: 'Status', key: 'status', width: 14 },
      ],
      rows
    );
  } catch (err) {
    return next(err);
  }
});

router.get('/occupancy.pdf', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const rows = await occupancyRows(req.hostel.id);
    sendPdf(
      res,
      'occupancy.pdf',
      `${req.hostel.name} — Occupancy`,
      rows.map((r) => `${r.code}: ${r.occupied}/${r.capacity} (${r.status})`)
    );
  } catch (err) {
    return next(err);
  }
});

router.get('/fees.xlsx', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const rows = await feeRows(req.hostel.id);
    await sendExcel(
      res,
      'fees.xlsx',
      'Fees',
      [
        { header: 'Tenant', key: 'tenant_name', width: 22 },
        { header: 'Email', key: 'tenant_email', width: 28 },
        { header: 'Period', key: 'period_label', width: 14 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Due date', key: 'due_date', width: 14 },
      ],
      rows
    );
  } catch (err) {
    return next(err);
  }
});

router.get('/fees.pdf', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const rows = await feeRows(req.hostel.id);
    sendPdf(
      res,
      'fees.pdf',
      `${req.hostel.name} — Fees`,
      rows.map(
        (r) =>
          `${r.tenant_name} | ${r.period_label} | ₹${r.amount} | ${r.status}`
      )
    );
  } catch (err) {
    return next(err);
  }
});

router.get('/complaints.xlsx', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const rows = await complaintRows(req.hostel.id);
    await sendExcel(
      res,
      'complaints.xlsx',
      'Complaints',
      [
        { header: 'Tenant', key: 'tenant_name', width: 22 },
        { header: 'Title', key: 'title', width: 32 },
        { header: 'Priority', key: 'priority', width: 10 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'SLA due', key: 'sla_due_at', width: 20 },
        { header: 'Created', key: 'created_at', width: 20 },
      ],
      rows
    );
  } catch (err) {
    return next(err);
  }
});

router.get('/complaints.pdf', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const rows = await complaintRows(req.hostel.id);
    sendPdf(
      res,
      'complaints.pdf',
      `${req.hostel.name} — Complaints`,
      rows.map(
        (r) => `${r.tenant_name} | ${r.title} | ${r.priority}/${r.status}`
      )
    );
  } catch (err) {
    return next(err);
  }
});

module.exports = { reportsRouter: router };
