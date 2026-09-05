-- Hostel Management System — schema stub (Phase 1 will expand)
-- Rule: every business table includes hostel_id for multi-hostel scale later.

CREATE DATABASE IF NOT EXISTS hostel_mgmt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hostel_mgmt;

CREATE TABLE IF NOT EXISTS hostels (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  address VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phase 1: users, rooms, allocations, fees, payments, complaints
-- (all with hostel_id FK → hostels.id)
