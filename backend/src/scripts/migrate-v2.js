/**
 * Incremental migrations for existing hostel_mgmt DBs (CREATE IF NOT EXISTS won't alter enums).
 */
async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 AS ok FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = 'hostel_mgmt' AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 AS ok FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = 'hostel_mgmt' AND TABLE_NAME = ?
     LIMIT 1`,
    [table]
  );
  return rows.length > 0;
}

async function migrateProductV2(conn) {
  await conn.query('USE hostel_mgmt');

  await conn.query(`
    ALTER TABLE users
    MODIFY role ENUM('superuser', 'admin', 'staff', 'tenant', 'parent')
      NOT NULL DEFAULT 'tenant'
  `);

  if (!(await columnExists(conn, 'users', 'status'))) {
    await conn.query(`
      ALTER TABLE users
      ADD COLUMN status ENUM('pending', 'active', 'rejected') NOT NULL DEFAULT 'active'
      AFTER role
    `);
  }

  if (!(await columnExists(conn, 'users', 'phone'))) {
    await conn.query(`ALTER TABLE users ADD COLUMN phone VARCHAR(40) NULL AFTER google_sub`);
  }

  if (!(await columnExists(conn, 'complaints', 'sla_due_at'))) {
    await conn.query(`ALTER TABLE complaints ADD COLUMN sla_due_at DATETIME NULL AFTER status`);
  }

  if (!(await columnExists(conn, 'complaints', 'photo_path'))) {
    await conn.query(`ALTER TABLE complaints ADD COLUMN photo_path VARCHAR(500) NULL AFTER sla_due_at`);
  }

  // Tables are created by schema.sql on fresh installs; re-run CREATE IF NOT EXISTS via schema is enough.
  // Extra safety if schema was an older file:
  if (!(await tableExists(conn, 'parent_tenant_links'))) {
    await conn.query(`
      CREATE TABLE parent_tenant_links (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        hostel_id INT UNSIGNED NOT NULL,
        parent_user_id INT UNSIGNED NOT NULL,
        tenant_user_id INT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_ptl_hostel FOREIGN KEY (hostel_id) REFERENCES hostels (id),
        CONSTRAINT fk_ptl_parent FOREIGN KEY (parent_user_id) REFERENCES users (id),
        CONSTRAINT fk_ptl_tenant FOREIGN KEY (tenant_user_id) REFERENCES users (id),
        UNIQUE KEY uq_ptl_parent_tenant (parent_user_id, tenant_user_id)
      )
    `);
  }

  if (!(await tableExists(conn, 'room_change_requests'))) {
    await conn.query(`
      CREATE TABLE room_change_requests (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        hostel_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NOT NULL,
        from_room_id INT UNSIGNED NULL,
        reason VARCHAR(500) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        staff_note VARCHAR(500) NULL,
        to_room_id INT UNSIGNED NULL,
        decided_by INT UNSIGNED NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_rcr_hostel FOREIGN KEY (hostel_id) REFERENCES hostels (id),
        CONSTRAINT fk_rcr_user FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
  }

  if (!(await tableExists(conn, 'notifications'))) {
    await conn.query(`
      CREATE TABLE notifications (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        hostel_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NOT NULL,
        title VARCHAR(200) NOT NULL,
        body VARCHAR(500) NOT NULL,
        type VARCHAR(40) NOT NULL DEFAULT 'info',
        link VARCHAR(200) NULL,
        read_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_notif_hostel FOREIGN KEY (hostel_id) REFERENCES hostels (id),
        CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
  }

  if (!(await tableExists(conn, 'role_module_templates'))) {
    await conn.query(`
      CREATE TABLE role_module_templates (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        hostel_id INT UNSIGNED NOT NULL,
        role ENUM('superuser', 'admin', 'staff', 'tenant', 'parent') NOT NULL,
        module_id INT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_rmt_hostel FOREIGN KEY (hostel_id) REFERENCES hostels (id),
        CONSTRAINT fk_rmt_module FOREIGN KEY (module_id) REFERENCES app_modules (id),
        UNIQUE KEY uq_rmt_hostel_role_module (hostel_id, role, module_id)
      )
    `);
  }

  if (!(await tableExists(conn, 'module_templates'))) {
    await conn.query(`
      CREATE TABLE module_templates (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        hostel_id INT UNSIGNED NOT NULL,
        name VARCHAR(120) NOT NULL,
        code VARCHAR(80) NOT NULL,
        role_key ENUM('superuser', 'admin', 'staff', 'tenant', 'parent') NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_mt_hostel FOREIGN KEY (hostel_id) REFERENCES hostels (id),
        UNIQUE KEY uq_mt_hostel_code (hostel_id, code)
      )
    `);
  }

  if (!(await tableExists(conn, 'module_template_items'))) {
    await conn.query(`
      CREATE TABLE module_template_items (
        template_id INT UNSIGNED NOT NULL,
        module_id INT UNSIGNED NOT NULL,
        PRIMARY KEY (template_id, module_id),
        CONSTRAINT fk_mti_template FOREIGN KEY (template_id) REFERENCES module_templates (id) ON DELETE CASCADE,
        CONSTRAINT fk_mti_module FOREIGN KEY (module_id) REFERENCES app_modules (id)
      )
    `);
  }

  // One-time copy from legacy role_module_templates → named module_templates
  if (await tableExists(conn, 'role_module_templates')) {
    const [legacyRoles] = await conn.query(
      `SELECT DISTINCT hostel_id, role FROM role_module_templates`
    );
    for (const row of legacyRoles) {
      const code = `role-${row.role}`;
      const [existing] = await conn.query(
        `SELECT id FROM module_templates WHERE hostel_id = ? AND code = ? LIMIT 1`,
        [row.hostel_id, code]
      );
      let templateId = existing[0]?.id;
      if (!templateId) {
        const label =
          row.role === 'tenant'
            ? 'Tenant'
            : row.role.charAt(0).toUpperCase() + row.role.slice(1);
        const [ins] = await conn.query(
          `INSERT INTO module_templates (hostel_id, name, code, role_key) VALUES (?, ?, ?, ?)`,
          [row.hostel_id, label, code, row.role]
        );
        templateId = ins.insertId;
      }
      await conn.query(
        `INSERT IGNORE INTO module_template_items (template_id, module_id)
         SELECT ?, module_id FROM role_module_templates
         WHERE hostel_id = ? AND role = ?`,
        [templateId, row.hostel_id, row.role]
      );
    }
  }

  console.log('Applied product v2 migrations (roles/status/SLA/photos/parents/…).');
}

module.exports = { migrateProductV2 };
