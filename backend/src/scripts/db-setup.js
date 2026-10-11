/**
 * Apply schema.sql + seed.sql using mysql2 (no mysql CLI required).
 * Usage: npm run db:setup
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { migrateProductV2 } = require('./migrate-v2');
const { mysqlSsl } = require('../config/db');

async function migrateSlugToPartner(conn) {
  await conn.query('USE hostel_mgmt');
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME AS name
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'hostel_mgmt'
       AND TABLE_NAME = 'hostels'
       AND COLUMN_NAME IN ('slug', 'partner')`
  );
  const names = cols.map((c) => c.name);
  if (names.includes('slug') && !names.includes('partner')) {
    await conn.query('ALTER TABLE hostels RENAME COLUMN slug TO partner');
    try {
      await conn.query(
        'ALTER TABLE hostels RENAME INDEX uq_hostels_slug TO uq_hostels_partner'
      );
    } catch {
      // index name may already differ
    }
    console.log('Migrated hostels.slug → hostels.partner');
  }
}

async function run() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  const schemaPath = path.join(__dirname, '../../sql/schema.sql');
  const seedPath = path.join(__dirname, '../../sql/seed.sql');

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
    ...mysqlSsl(),
  });

  try {
    console.log('Resetting database hostel_mgmt...');
    await conn.query('DROP DATABASE IF EXISTS hostel_mgmt');

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Applying schema.sql...');
    await conn.query(schemaSql);

    await migrateSlugToPartner(conn);
    await migrateProductV2(conn);

    const seedSql = fs.readFileSync(seedPath, 'utf8');
    console.log('Applying seed.sql...');
    await conn.query(seedSql);

    console.log('Database setup complete: hostel_mgmt (partner: hogwarts).');
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error('db:setup failed:', err.message);
  console.error(
    'Ensure MySQL is running and DB_USER/DB_PASSWORD in backend/.env are correct.'
  );
  process.exit(1);
});
