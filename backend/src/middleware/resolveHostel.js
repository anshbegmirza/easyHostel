const { pool } = require('../config/db');

/**
 * Resolve hostel from X-Hostel-Partner (fallback DEFAULT_HOSTEL_PARTNER / hogwarts).
 */
async function resolveHostel(req, res, next) {
  try {
    const partner = String(
      req.headers['x-hostel-partner'] ||
        process.env.DEFAULT_HOSTEL_PARTNER ||
        'hogwarts'
    )
      .trim()
      .toLowerCase();

    const [rows] = await pool.query(
      'SELECT id, name, partner, address FROM hostels WHERE partner = ? LIMIT 1',
      [partner]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: `Hostel not found for partner "${partner}".`,
        code: 'HOSTEL_NOT_FOUND',
      });
    }

    req.hostel = rows[0];
    req.hostelPartner = rows[0].partner;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { resolveHostel };
