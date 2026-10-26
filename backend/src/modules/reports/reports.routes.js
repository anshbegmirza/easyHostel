const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { pool } = require('../../config/db');
const { secured, staffRoles } = require('../../middleware/secured');

const router = express.Router();

const BANNER = 'FF212121';
const CREAM = 'FFE8F5E9';
const MUTED_ARGB = 'FF666666';
const RULE_ARGB = 'FFD0D0D0';
const TEXT_ARGB = 'FF212121';
const CREAM_HEX = '#E8F5E9';
const MUTED_HEX = '#666666';
const RULE_HEX = '#D0D0D0';
const TEXT_HEX = '#212121';

const thinBorder = {
  top: { style: 'thin', color: { argb: RULE_ARGB } },
  left: { style: 'thin', color: { argb: RULE_ARGB } },
  bottom: { style: 'thin', color: { argb: RULE_ARGB } },
  right: { style: 'thin', color: { argb: RULE_ARGB } },
};

function exportDateLabel() {
  return new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' });
}

function fmtDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' });
}

function cellValue(row, key) {
  const v = row[key];
  return v == null ? '' : v;
}

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
  return rows.map((r) => ({
    tenant_name: r.tenant_name,
    tenant_email: r.tenant_email,
    period_label: r.period_label,
    amount: `₹${r.amount}`,
    status: r.status,
    due_date: fmtDate(r.due_date),
  }));
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
  return rows.map((r) => ({
    tenant_name: r.tenant_name,
    title: r.title,
    priority: r.priority,
    status: r.status,
    sla_due_at: fmtDate(r.sla_due_at),
    created_at: fmtDate(r.created_at),
  }));
}

function sendExcel(res, filename, sheetName, hostelName, reportTitle, columns, rows) {
  return (async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = hostelName;
    const sheet = workbook.addWorksheet(sheetName);
    const colCount = columns.length;
    const lastCol = String.fromCharCode(64 + colCount);

    sheet.mergeCells(`A1:${lastCol}1`);
    const title = sheet.getCell('A1');
    title.value = hostelName;
    title.font = { bold: true, size: 14, color: { argb: CREAM } };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BANNER } };
    title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet.getRow(1).height = 28;

    sheet.getCell('A2').value = `Export date: ${exportDateLabel()}`;
    sheet.getCell('A2').font = { size: 11, color: { argb: MUTED_ARGB } };

    sheet.getCell('A3').value = reportTitle;
    sheet.getCell('A3').font = { bold: true, size: 12, color: { argb: TEXT_ARGB } };

    const headerRow = sheet.getRow(5);
    columns.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = col.header;
      cell.font = { bold: true, color: { argb: TEXT_ARGB } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CREAM } };
      cell.border = thinBorder;
    });

    rows.forEach((row, idx) => {
      const excelRow = sheet.getRow(6 + idx);
      columns.forEach((col, i) => {
        const cell = excelRow.getCell(i + 1);
        cell.value = cellValue(row, col.key);
        cell.border = thinBorder;
      });
    });

    sheet.columns = columns.map((c) => ({ key: c.key, width: c.width }));
    sheet.views = [{ state: 'frozen', ySplit: 5 }];

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  })();
}

function sendPdf(res, filename, hostelName, reportTitle, columns, rows) {
  const doc = new PDFDocument({ margin: 48, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const cols = columns.map((c) => ({
    key: c.key,
    label: c.header,
    w: pageW * c.widthFrac,
  }));

  const drawHeaderBlock = () => {
    doc.fillColor(TEXT_HEX).font('Helvetica-Bold').fontSize(20).text(hostelName, { continued: false });
    doc.moveDown(0.35);
    doc.fillColor(MUTED_HEX).font('Helvetica').fontSize(10).text(`Export date: ${exportDateLabel()}`);
    doc.moveDown(0.25);
    doc.fillColor(TEXT_HEX).font('Helvetica-Bold').fontSize(16).text(reportTitle);
    doc.moveDown(0.8);
  };

  const drawTableHeader = () => {
    const y = doc.y;
    const h = 22;
    doc.save();
    doc.rect(doc.page.margins.left, y, pageW, h).fill(CREAM_HEX);
    doc.restore();
    let x = doc.page.margins.left;
    doc.fillColor(TEXT_HEX).font('Helvetica-Bold').fontSize(10);
    for (const c of cols) {
      doc.text(c.label, x + 4, y + 6, { width: c.w - 8, lineBreak: false });
      x += c.w;
    }
    doc.y = y + h + 4;
  };

  drawHeaderBlock();
  drawTableHeader();

  doc.font('Helvetica').fontSize(10).fillColor(TEXT_HEX);
  for (const row of rows) {
    const rowH = 20;
    if (doc.y + rowH > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      drawHeaderBlock();
      drawTableHeader();
      doc.font('Helvetica').fontSize(10).fillColor(TEXT_HEX);
    }
    const y = doc.y;
    let x = doc.page.margins.left;
    cols.forEach((c) => {
      doc.fillColor(TEXT_HEX).text(String(cellValue(row, c.key)), x + 4, y + 4, {
        width: c.w - 8,
        lineBreak: false,
      });
      x += c.w;
    });
    doc
      .moveTo(doc.page.margins.left, y + rowH)
      .lineTo(doc.page.margins.left + pageW, y + rowH)
      .strokeColor(RULE_HEX)
      .lineWidth(0.5)
      .stroke();
    doc.y = y + rowH;
  }

  doc.end();
}

function countsByStatus(rows, keys) {
  const out = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const row of rows) {
    if (Object.prototype.hasOwnProperty.call(out, row.status)) {
      out[row.status] = Number(row.cnt);
    }
  }
  return out;
}

const OCCUPANCY_COLS = [
  { header: 'Code', key: 'code', width: 12, widthFrac: 0.2 },
  { header: 'Capacity', key: 'capacity', width: 12, widthFrac: 0.2 },
  { header: 'Occupied', key: 'occupied', width: 12, widthFrac: 0.2 },
  { header: 'Status', key: 'status', width: 14, widthFrac: 0.4 },
];

const FEE_COLS = [
  { header: 'Tenant', key: 'tenant_name', width: 22, widthFrac: 0.18 },
  { header: 'Email', key: 'tenant_email', width: 28, widthFrac: 0.24 },
  { header: 'Period', key: 'period_label', width: 14, widthFrac: 0.14 },
  { header: 'Amount', key: 'amount', width: 12, widthFrac: 0.12 },
  { header: 'Status', key: 'status', width: 10, widthFrac: 0.12 },
  { header: 'Due date', key: 'due_date', width: 14, widthFrac: 0.2 },
];

const COMPLAINT_COLS = [
  { header: 'Tenant', key: 'tenant_name', width: 22, widthFrac: 0.16 },
  { header: 'Title', key: 'title', width: 32, widthFrac: 0.28 },
  { header: 'Priority', key: 'priority', width: 10, widthFrac: 0.12 },
  { header: 'Status', key: 'status', width: 12, widthFrac: 0.14 },
  { header: 'SLA due', key: 'sla_due_at', width: 20, widthFrac: 0.15 },
  { header: 'Created', key: 'created_at', width: 20, widthFrac: 0.15 },
];

router.get('/summary', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const hostelId = req.hostel.id;

    const [[beds]] = await pool.query(
      `SELECT COALESCE(SUM(capacity), 0) AS total_beds
       FROM rooms WHERE hostel_id = ?`,
      [hostelId]
    );
    const [[occ]] = await pool.query(
      `SELECT COUNT(*) AS occupied_beds
       FROM allocations WHERE hostel_id = ? AND active = 1`,
      [hostelId]
    );
    const occupied = Number(occ.occupied_beds);
    const totalBeds = Number(beds.total_beds);
    const free = Math.max(0, totalBeds - occupied);

    const [feeRowsAgg] = await pool.query(
      `SELECT status, COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS amount
       FROM fees WHERE hostel_id = ? GROUP BY status`,
      [hostelId]
    );
    const [complaintRowsAgg] = await pool.query(
      `SELECT status, COUNT(*) AS cnt FROM complaints WHERE hostel_id = ? GROUP BY status`,
      [hostelId]
    );

    const fees = countsByStatus(feeRowsAgg, ['due', 'paid', 'waived']);
    const dueRow = feeRowsAgg.find((r) => r.status === 'due');
    fees.due_amount = dueRow ? Number(dueRow.amount) : 0;

    return res.json({
      occupancy: { occupied, free },
      fees,
      complaints: countsByStatus(complaintRowsAgg, [
        'open',
        'in_progress',
        'resolved',
        'closed',
      ]),
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/occupancy.xlsx', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const rows = await occupancyRows(req.hostel.id);
    await sendExcel(
      res,
      'occupancy.xlsx',
      'Occupancy',
      req.hostel.name,
      'Occupancy Report',
      OCCUPANCY_COLS,
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
      req.hostel.name,
      'Occupancy Report',
      OCCUPANCY_COLS,
      rows
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
      req.hostel.name,
      'Fees Report',
      FEE_COLS,
      rows
    );
  } catch (err) {
    return next(err);
  }
});

router.get('/fees.pdf', ...secured(...staffRoles), async (req, res, next) => {
  try {
    const rows = await feeRows(req.hostel.id);
    sendPdf(res, 'fees.pdf', req.hostel.name, 'Fees Report', FEE_COLS, rows);
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
      req.hostel.name,
      'Complaints Report',
      COMPLAINT_COLS,
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
      req.hostel.name,
      'Complaints Report',
      COMPLAINT_COLS,
      rows
    );
  } catch (err) {
    return next(err);
  }
});

module.exports = { reportsRouter: router };
