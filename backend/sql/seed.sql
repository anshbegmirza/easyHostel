-- easyHostel4 — seed (hostel hogwarts + demo data for full v1 demo)
-- Passwords: docs/test-credentials.txt

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
  ('room-changes', 'Room changes'),
  ('my-room', 'My room'),
  ('fees', 'Fees'),
  ('complaints', 'Complaints'),
  ('notices', 'Notices'),
  ('users', 'Users'),
  ('reports', 'Reports'),
  ('settings', 'Settings'),
  ('user-roles', 'User roles'),
  ('templates', 'Template management')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- superuser / test@123
-- admin1 / staff@123
-- staff1 / staff@123
-- student1|student2|parent1 / std@123
INSERT INTO users (
  hostel_id, username, email, name, password_hash, role, status, auth_provider
) VALUES
  (
    1,
    'superuser',
    'superuser@easyhostel4.local',
    'Super Admin',
    '$2b$10$GlkKAD64ZaMMVhw41iVQ7.swyE8YtJ7fQO0SCkWf4PPn05qAt5D0W',
    'superuser',
    'active',
    'local'
  ),
  (
    1,
    'admin1',
    'admin1@easyhostel4.local',
    'Hostel Admin',
    '$2b$10$QcQ9PdrmemQBMNoYEVErV.mBKGTa3eSxOEj37QBmjLQtThs0SUg/K',
    'admin',
    'active',
    'local'
  ),
  (
    1,
    'staff1',
    'staff1@easyhostel4.local',
    'Staff One',
    '$2b$10$QcQ9PdrmemQBMNoYEVErV.mBKGTa3eSxOEj37QBmjLQtThs0SUg/K',
    'staff',
    'active',
    'local'
  ),
  (
    1,
    'student1',
    'student1@easyhostel4.local',
    'Student One',
    '$2b$10$.cSgnXQH8I6BRVv5jYnnZe.4FYwM3ShyCM0xvWWmAnw0NVK.l8x6q',
    'tenant',
    'active',
    'local'
  ),
  (
    1,
    'student2',
    'student2@easyhostel4.local',
    'Student Two',
    '$2b$10$.cSgnXQH8I6BRVv5jYnnZe.4FYwM3ShyCM0xvWWmAnw0NVK.l8x6q',
    'tenant',
    'active',
    'local'
  ),
  (
    1,
    'parent1',
    'parent1@easyhostel4.local',
    'Parent One',
    '$2b$10$.cSgnXQH8I6BRVv5jYnnZe.4FYwM3ShyCM0xvWWmAnw0NVK.l8x6q',
    'parent',
    'active',
    'local'
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  status = VALUES(status),
  auth_provider = VALUES(auth_provider);

-- parent1 → student1
INSERT INTO parent_tenant_links (hostel_id, parent_user_id, tenant_user_id)
SELECT 1, p.id, t.id
FROM users p
JOIN users t ON t.hostel_id = 1 AND t.username = 'student1'
WHERE p.hostel_id = 1 AND p.username = 'parent1'
  AND NOT EXISTS (
    SELECT 1 FROM parent_tenant_links l
    WHERE l.parent_user_id = p.id AND l.tenant_user_id = t.id
  );

-- Rooms
INSERT INTO rooms (hostel_id, code, capacity, status) VALUES
  (1, 'A101', 2, 'available'),
  (1, 'A102', 1, 'available'),
  (1, 'B201', 3, 'maintenance'),
  (1, 'C301', 2, 'available')
ON DUPLICATE KEY UPDATE
  capacity = VALUES(capacity),
  status = VALUES(status);

-- Allocate student1 → A101 (id resolved by code)
INSERT INTO allocations (hostel_id, room_id, user_id, start_date, active)
SELECT 1, r.id, u.id, CURDATE(), 1
FROM rooms r
JOIN users u ON u.hostel_id = 1 AND u.username = 'student1'
WHERE r.hostel_id = 1 AND r.code = 'A101'
  AND NOT EXISTS (
    SELECT 1 FROM allocations a
    WHERE a.hostel_id = 1 AND a.user_id = u.id AND a.active = 1
  );

UPDATE rooms r
SET status = 'available'
WHERE r.hostel_id = 1 AND r.code = 'A101' AND r.status <> 'maintenance';

UPDATE rooms r
SET status = IF(
  (SELECT COUNT(*) FROM allocations a WHERE a.room_id = r.id AND a.active = 1) >= r.capacity,
  'occupied',
  'available'
)
WHERE r.hostel_id = 1 AND r.status <> 'maintenance';

-- Fees: one due + one paid for student1
INSERT INTO fees (hostel_id, user_id, period_label, amount, status, due_date)
SELECT 1, u.id, 'Sep 2026', 8500.00, 'due', DATE_ADD(CURDATE(), INTERVAL 7 DAY)
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'student1'
  AND NOT EXISTS (
    SELECT 1 FROM fees f
    WHERE f.hostel_id = 1 AND f.user_id = u.id AND f.period_label = 'Sep 2026'
  );

INSERT INTO fees (hostel_id, user_id, period_label, amount, status, due_date)
SELECT 1, u.id, 'Aug 2026', 8500.00, 'paid', DATE_SUB(CURDATE(), INTERVAL 30 DAY)
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'student1'
  AND NOT EXISTS (
    SELECT 1 FROM fees f
    WHERE f.hostel_id = 1 AND f.user_id = u.id AND f.period_label = 'Aug 2026'
  );

INSERT INTO payments (hostel_id, fee_id, amount, method)
SELECT f.hostel_id, f.id, f.amount, 'mock'
FROM fees f
JOIN users u ON u.id = f.user_id
WHERE f.hostel_id = 1
  AND u.username = 'student1'
  AND f.period_label = 'Aug 2026'
  AND f.status = 'paid'
  AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.fee_id = f.id);

-- Open complaint (SLA medium = 72h)
INSERT INTO complaints (hostel_id, user_id, title, description, priority, status, sla_due_at)
SELECT 1, u.id, 'Leaking tap in bathroom', 'Water dripping constantly in A101 bathroom.', 'medium', 'open',
       DATE_ADD(NOW(), INTERVAL 72 HOUR)
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'student1'
  AND NOT EXISTS (
    SELECT 1 FROM complaints c
    WHERE c.hostel_id = 1 AND c.user_id = u.id AND c.title = 'Leaking tap in bathroom'
  );

INSERT INTO complaint_events (hostel_id, complaint_id, actor_user_id, status, note)
SELECT c.hostel_id, c.id, c.user_id, 'open', 'Complaint created'
FROM complaints c
JOIN users u ON u.id = c.user_id
WHERE c.hostel_id = 1
  AND u.username = 'student1'
  AND c.title = 'Leaking tap in bathroom'
  AND NOT EXISTS (SELECT 1 FROM complaint_events e WHERE e.complaint_id = c.id);

-- Notice
INSERT INTO notices (hostel_id, title, body, created_by)
SELECT 1, 'Welcome to Hogwarts Hostel', 'Fee week starts on the 1st. Raise maintenance issues from the app.', u.id
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'superuser'
  AND NOT EXISTS (
    SELECT 1 FROM notices n
    WHERE n.hostel_id = 1 AND n.title = 'Welcome to Hogwarts Hostel'
  );

-- Named module templates (hostel 1) — one default pack per role
INSERT INTO module_templates (hostel_id, name, code, role_key)
SELECT 1, 'Superuser', 'role-superuser', 'superuser'
WHERE NOT EXISTS (SELECT 1 FROM module_templates WHERE hostel_id = 1 AND code = 'role-superuser');

INSERT INTO module_templates (hostel_id, name, code, role_key)
SELECT 1, 'Admin', 'role-admin', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM module_templates WHERE hostel_id = 1 AND code = 'role-admin');

INSERT INTO module_templates (hostel_id, name, code, role_key)
SELECT 1, 'Staff', 'role-staff', 'staff'
WHERE NOT EXISTS (SELECT 1 FROM module_templates WHERE hostel_id = 1 AND code = 'role-staff');

INSERT INTO module_templates (hostel_id, name, code, role_key)
SELECT 1, 'Tenant', 'role-tenant', 'tenant'
WHERE NOT EXISTS (SELECT 1 FROM module_templates WHERE hostel_id = 1 AND code = 'role-tenant');

INSERT INTO module_templates (hostel_id, name, code, role_key)
SELECT 1, 'Parent', 'role-parent', 'parent'
WHERE NOT EXISTS (SELECT 1 FROM module_templates WHERE hostel_id = 1 AND code = 'role-parent');

INSERT INTO module_template_items (template_id, module_id)
SELECT t.id, m.id
FROM module_templates t
CROSS JOIN app_modules m
WHERE t.hostel_id = 1 AND t.code = 'role-superuser'
  AND NOT EXISTS (
    SELECT 1 FROM module_template_items i WHERE i.template_id = t.id AND i.module_id = m.id
  );

INSERT INTO module_template_items (template_id, module_id)
SELECT t.id, m.id
FROM module_templates t
JOIN app_modules m ON m.code IN (
  'dashboard', 'rooms', 'room-changes', 'fees', 'complaints', 'notices',
  'users', 'reports', 'settings'
)
WHERE t.hostel_id = 1 AND t.code = 'role-admin'
  AND NOT EXISTS (
    SELECT 1 FROM module_template_items i WHERE i.template_id = t.id AND i.module_id = m.id
  );

INSERT INTO module_template_items (template_id, module_id)
SELECT t.id, m.id
FROM module_templates t
JOIN app_modules m ON m.code IN (
  'dashboard', 'rooms', 'room-changes', 'fees', 'complaints', 'notices', 'settings'
)
WHERE t.hostel_id = 1 AND t.code = 'role-staff'
  AND NOT EXISTS (
    SELECT 1 FROM module_template_items i WHERE i.template_id = t.id AND i.module_id = m.id
  );

INSERT INTO module_template_items (template_id, module_id)
SELECT t.id, m.id
FROM module_templates t
JOIN app_modules m ON m.code IN ('dashboard', 'my-room', 'fees', 'complaints', 'notices', 'settings')
WHERE t.hostel_id = 1 AND t.code = 'role-tenant'
  AND NOT EXISTS (
    SELECT 1 FROM module_template_items i WHERE i.template_id = t.id AND i.module_id = m.id
  );

INSERT INTO module_template_items (template_id, module_id)
SELECT t.id, m.id
FROM module_templates t
JOIN app_modules m ON m.code IN ('dashboard', 'fees', 'complaints', 'notices', 'settings')
WHERE t.hostel_id = 1 AND t.code = 'role-parent'
  AND NOT EXISTS (
    SELECT 1 FROM module_template_items i WHERE i.template_id = t.id AND i.module_id = m.id
  );

-- Apply each user's role-default template as module grants (idempotent per user+module)
INSERT INTO admin_module_grants (hostel_id, user_id, module_id, granted_by)
SELECT u.hostel_id, u.id, i.module_id, su.id
FROM users u
JOIN module_templates t ON t.hostel_id = u.hostel_id AND t.role_key = u.role
JOIN module_template_items i ON i.template_id = t.id
JOIN users su ON su.hostel_id = u.hostel_id AND su.username = 'superuser'
WHERE u.hostel_id = 1
  AND NOT EXISTS (
    SELECT 1 FROM admin_module_grants g
    WHERE g.user_id = u.id AND g.module_id = i.module_id
  );
