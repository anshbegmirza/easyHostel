const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

/** Aiven / cloud MySQL: set DB_SSL=true in .env */
function mysqlSsl() {
  if (process.env.DB_SSL !== 'true' && process.env.DB_SSL !== '1') {
    return {};
  }
  if (process.env.DB_SSL_CA) {
    return {
      ssl: {
        ca: fs.readFileSync(process.env.DB_SSL_CA),
        rejectUnauthorized: true,
      },
    };
  }
  // ponytail: works for Aiven without their CA file; set DB_SSL_CA=path/to/ca.pem for strict verify
  return { ssl: { rejectUnauthorized: false } };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hostel_mgmt',
  waitForConnections: true,
  connectionLimit: 10,
  ...mysqlSsl(),
});

async function pingDb() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

module.exports = { pool, pingDb, mysqlSsl };
