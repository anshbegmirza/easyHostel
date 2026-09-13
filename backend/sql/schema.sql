-- easyHostel4 schema
-- Rule: every business table includes hostel_id for multi-hostel scale later.

CREATE DATABASE IF NOT EXISTS hostel_mgmt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hostel_mgmt;

CREATE TABLE IF NOT EXISTS hostels (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  partner VARCHAR(80) NOT NULL,
  address VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_hostels_partner (partner)
);

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT UNSIGNED NOT NULL,
  username VARCHAR(80) NULL,
  email VARCHAR(190) NOT NULL,
  name VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NULL,
  role ENUM('superuser', 'admin', 'staff', 'tenant', 'parent') NOT NULL DEFAULT 'tenant',
  status ENUM('pending', 'active', 'rejected') NOT NULL DEFAULT 'active',
  auth_provider ENUM('local', 'google') NOT NULL DEFAULT 'local',
  google_sub VARCHAR(255) NULL,
  phone VARCHAR(40) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_hostel FOREIGN KEY (hostel_id) REFERENCES hostels (id),
  UNIQUE KEY uq_users_hostel_email (hostel_id, email),
  UNIQUE KEY uq_users_hostel_username (hostel_id, username),
  UNIQUE KEY uq_users_hostel_google_sub (hostel_id, google_sub)
);

CREATE TABLE IF NOT EXISTS parent_tenant_links (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT UNSIGNED NOT NULL,
  parent_user_id INT UNSIGNED NOT NULL,
  tenant_user_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ptl_hostel FOREIGN KEY (hostel_id) REFERENCES hostels (id),
  CONSTRAINT fk_ptl_parent FOREIGN KEY (parent_user_id) REFERENCES users (id),
  CONSTRAINT fk_ptl_tenant FOREIGN KEY (tenant_user_id) REFERENCES users (id),
  UNIQUE KEY uq_ptl_parent_tenant (parent_user_id, tenant_user_id)
);

CREATE TABLE IF NOT EXISTS app_modules (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  UNIQUE KEY uq_app_modules_code (code)
);

CREATE TABLE IF NOT EXISTS admin_module_grants (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  module_id INT UNSIGNED NOT NULL,
  granted_by INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_amg_hostel FOREIGN KEY (hostel_id) REFERENCES hostels (id),
  CONSTRAINT fk_amg_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_amg_module FOREIGN KEY (module_id) REFERENCES app_modules (id),
  UNIQUE KEY uq_amg_user_module (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS module_templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(80) NOT NULL,
  role_key ENUM('superuser', 'admin', 'staff', 'tenant', 'parent') NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mt_hostel FOREIGN KEY (hostel_id) REFERENCES hostels (id),
  UNIQUE KEY uq_mt_hostel_code (hostel_id, code)
);

CREATE TABLE IF NOT EXISTS module_template_items (
  template_id INT UNSIGNED NOT NULL,
  module_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (template_id, module_id),
  CONSTRAINT fk_mti_template FOREIGN KEY (template_id) REFERENCES module_templates (id) ON DELETE CASCADE,
  CONSTRAINT fk_mti_module FOREIGN KEY (module_id) REFERENCES app_modules (id)
);

CREATE TABLE IF NOT EXISTS rooms (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL,
  capacity INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('available', 'occupied', 'maintenance') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rooms_hostel FOREIGN KEY (hostel_id) REFERENCES hostels (id),
  UNIQUE KEY uq_rooms_hostel_code (hostel_id, code)
);

CREATE TABLE IF NOT EXISTS allocations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT UNSIGNED NOT NULL,
  room_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alloc_hostel FOREIGN KEY (hostel_id) REFERENCES hostels (id),
  CONSTRAINT fk_alloc_room FOREIGN KEY (room_id) REFERENCES rooms (id),
  CONSTRAINT fk_alloc_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS room_change_requests (
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
  CONSTRAINT fk_rcr_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_rcr_from FOREIGN KEY (from_room_id) REFERENCES rooms (id),
  CONSTRAINT fk_rcr_to FOREIGN KEY (to_room_id) REFERENCES rooms (id)
);

CREATE TABLE IF NOT EXISTS fees (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  period_label VARCHAR(40) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status ENUM('due', 'paid', 'waived') NOT NULL DEFAULT 'due',
  due_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fees_hostel FOREIGN KEY (hostel_id) REFERENCES hostels (id),
  CONSTRAINT fk_fees_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT UNSIGNED NOT NULL,
  fee_id INT UNSIGNED NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  method VARCHAR(40) NULL,
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_hostel FOREIGN KEY (hostel_id) REFERENCES hostels (id),
  CONSTRAINT fk_payments_fee FOREIGN KEY (fee_id) REFERENCES fees (id)
);

CREATE TABLE IF NOT EXISTS complaints (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  status ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  sla_due_at DATETIME NULL,
  photo_path VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_complaints_hostel FOREIGN KEY (hostel_id) REFERENCES hostels (id),
  CONSTRAINT fk_complaints_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS complaint_events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT UNSIGNED NOT NULL,
  complaint_id INT UNSIGNED NOT NULL,
  actor_user_id INT UNSIGNED NULL,
  status VARCHAR(40) NOT NULL,
  note VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ce_hostel FOREIGN KEY (hostel_id) REFERENCES hostels (id),
  CONSTRAINT fk_ce_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (id)
);

CREATE TABLE IF NOT EXISTS notices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hostel_id INT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notices_hostel FOREIGN KEY (hostel_id) REFERENCES hostels (id),
  CONSTRAINT fk_notices_user FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS notifications (
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
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id),
  KEY idx_notif_user_unread (user_id, read_at)
);
