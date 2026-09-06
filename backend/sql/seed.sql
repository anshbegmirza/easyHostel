-- easyHostel4 — Phase 1 seed (hostel hogwarts + local users)
-- Passwords are documented in docs/test-credentials.txt (hashes only here).

USE hostel_mgmt;

INSERT INTO hostels (id, name, partner, address)
VALUES (1, 'Hogwarts Hostel', 'hogwarts', 'City Campus')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  partner = VALUES(partner),
  address = VALUES(address);

INSERT INTO app_modules (code, name) VALUES
  ('dashboard', 'Dashboard'),
  ('rooms', 'Rooms'),
  ('fees', 'Fees'),
  ('complaints', 'Complaints'),
  ('users', 'Users'),
  ('settings', 'Settings')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- superuser / test@123
-- staff1 / staff@123
-- student1 / std@123
INSERT INTO users (
  hostel_id, username, email, name, password_hash, role, auth_provider
) VALUES
  (
    1,
    'superuser',
    'superuser@easyhostel4.local',
    'Super Admin',
    '$2b$10$GlkKAD64ZaMMVhw41iVQ7.swyE8YtJ7fQO0SCkWf4PPn05qAt5D0W',
    'superuser',
    'local'
  ),
  (
    1,
    'staff1',
    'staff1@easyhostel4.local',
    'Staff One',
    '$2b$10$QcQ9PdrmemQBMNoYEVErV.mBKGTa3eSxOEj37QBmjLQtThs0SUg/K',
    'staff',
    'local'
  ),
  (
    1,
    'student1',
    'student1@easyhostel4.local',
    'Student One',
    '$2b$10$.cSgnXQH8I6BRVv5jYnnZe.4FYwM3ShyCM0xvWWmAnw0NVK.l8x6q',
    'tenant',
    'local'
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  auth_provider = VALUES(auth_provider);
