-- easyHostel4 — seed (hostel hogwarts + rich demo data for local testing)
-- Passwords: docs/test-credentials.txt
-- Reload: cd backend && npm run db:setup

USE hostel_mgmt;

INSERT INTO hostels (id, name, partner, address)
VALUES (1, 'Hogwarts Hostel', 'hogwarts', '12 University Road, City Campus')
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

-- Password hashes (bcrypt cost 10):
--   superuser / test@123
--   admin*, staff* / staff@123
--   student*, parent* / std@123
INSERT INTO users (
  hostel_id, username, email, name, password_hash, role, status, auth_provider, phone
) VALUES
  (1, 'superuser', 'superuser@easyhostel4.local', 'Super Admin',
   '$2b$10$GlkKAD64ZaMMVhw41iVQ7.swyE8YtJ7fQO0SCkWf4PPn05qAt5D0W',
   'superuser', 'active', 'local', NULL),
  (1, 'admin1', 'admin1@easyhostel4.local', 'Meera Kapoor',
   '$2b$10$QcQ9PdrmemQBMNoYEVErV.mBKGTa3eSxOEj37QBmjLQtThs0SUg/K',
   'admin', 'active', 'local', '9876500001'),
  (1, 'admin2', 'admin2@easyhostel4.local', 'Rohan Desai',
   '$2b$10$QcQ9PdrmemQBMNoYEVErV.mBKGTa3eSxOEj37QBmjLQtThs0SUg/K',
   'admin', 'active', 'local', '9876500002'),
  (1, 'staff1', 'staff1@easyhostel4.local', 'Anil Verma',
   '$2b$10$QcQ9PdrmemQBMNoYEVErV.mBKGTa3eSxOEj37QBmjLQtThs0SUg/K',
   'staff', 'active', 'local', '9876500011'),
  (1, 'staff2', 'staff2@easyhostel4.local', 'Sneha Iyer',
   '$2b$10$QcQ9PdrmemQBMNoYEVErV.mBKGTa3eSxOEj37QBmjLQtThs0SUg/K',
   'staff', 'active', 'local', '9876500012'),
  (1, 'student1', 'student1@easyhostel4.local', 'Zaid Shaikh',
   '$2b$10$.cSgnXQH8I6BRVv5jYnnZe.4FYwM3ShyCM0xvWWmAnw0NVK.l8x6q',
   'tenant', 'active', 'local', '9876511001'),
  (1, 'student2', 'student2@easyhostel4.local', 'Anash Mirza',
   '$2b$10$.cSgnXQH8I6BRVv5jYnnZe.4FYwM3ShyCM0xvWWmAnw0NVK.l8x6q',
   'tenant', 'active', 'local', '9876511002'),
  (1, 'student3', 'student3@easyhostel4.local', 'Ahmedraza Jethva',
   '$2b$10$.cSgnXQH8I6BRVv5jYnnZe.4FYwM3ShyCM0xvWWmAnw0NVK.l8x6q',
   'tenant', 'active', 'local', '9876511003'),
  (1, 'student4', 'student4@easyhostel4.local', 'Mohammad Makrani',
   '$2b$10$.cSgnXQH8I6BRVv5jYnnZe.4FYwM3ShyCM0xvWWmAnw0NVK.l8x6q',
   'tenant', 'active', 'local', '9876511004'),
  (1, 'student5', 'student5@easyhostel4.local', 'Krish Patel',
   '$2b$10$.cSgnXQH8I6BRVv5jYnnZe.4FYwM3ShyCM0xvWWmAnw0NVK.l8x6q',
   'tenant', 'active', 'local', '9876511005'),
  (1, 'student6', 'student6@easyhostel4.local', 'Dhairya Mehta',
   '$2b$10$.cSgnXQH8I6BRVv5jYnnZe.4FYwM3ShyCM0xvWWmAnw0NVK.l8x6q',
   'tenant', 'active', 'local', '9876511006'),
  (1, 'student7', 'student7@easyhostel4.local', 'Capt Maverick',
   '$2b$10$.cSgnXQH8I6BRVv5jYnnZe.4FYwM3ShyCM0xvWWmAnw0NVK.l8x6q',
   'tenant', 'active', 'local', '9876511007'),
  (1, 'student8', 'student8@easyhostel4.local', 'Mirza Malik',
   '$2b$10$.cSgnXQH8I6BRVv5jYnnZe.4FYwM3ShyCM0xvWWmAnw0NVK.l8x6q',
   'tenant', 'active', 'local', '9876511008'),
  (1, 'pending1', 'pending1@easyhostel4.local', 'Rahul Mehta',
   '$2b$10$.cSgnXQH8I6BRVv5jYnnZe.4FYwM3ShyCM0xvWWmAnw0NVK.l8x6q',
   'tenant', 'pending', 'local', '9876511099'),
  (1, 'parent1', 'parent1@easyhostel4.local', 'Imran Shaikh',
   '$2b$10$.cSgnXQH8I6BRVv5jYnnZe.4FYwM3ShyCM0xvWWmAnw0NVK.l8x6q',
   'parent', 'active', 'local', '9876522001'),
  (1, 'parent2', 'parent2@easyhostel4.local', 'Farhan Mirza',
   '$2b$10$.cSgnXQH8I6BRVv5jYnnZe.4FYwM3ShyCM0xvWWmAnw0NVK.l8x6q',
   'parent', 'active', 'local', '9876522002'),
  (1, 'parent3', 'parent3@easyhostel4.local', 'Yusuf Jethva',
   '$2b$10$.cSgnXQH8I6BRVv5jYnnZe.4FYwM3ShyCM0xvWWmAnw0NVK.l8x6q',
   'parent', 'active', 'local', '9876522003')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  status = VALUES(status),
  auth_provider = VALUES(auth_provider),
  phone = VALUES(phone);

-- Parent ↔ tenant links
INSERT INTO parent_tenant_links (hostel_id, parent_user_id, tenant_user_id)
SELECT 1, p.id, t.id
FROM users p
JOIN users t ON t.hostel_id = 1 AND t.username = 'student1'
WHERE p.hostel_id = 1 AND p.username = 'parent1'
  AND NOT EXISTS (
    SELECT 1 FROM parent_tenant_links l
    WHERE l.parent_user_id = p.id AND l.tenant_user_id = t.id
  );

INSERT INTO parent_tenant_links (hostel_id, parent_user_id, tenant_user_id)
SELECT 1, p.id, t.id
FROM users p
JOIN users t ON t.hostel_id = 1 AND t.username = 'student2'
WHERE p.hostel_id = 1 AND p.username = 'parent2'
  AND NOT EXISTS (
    SELECT 1 FROM parent_tenant_links l
    WHERE l.parent_user_id = p.id AND l.tenant_user_id = t.id
  );

INSERT INTO parent_tenant_links (hostel_id, parent_user_id, tenant_user_id)
SELECT 1, p.id, t.id
FROM users p
JOIN users t ON t.hostel_id = 1 AND t.username = 'student3'
WHERE p.hostel_id = 1 AND p.username = 'parent3'
  AND NOT EXISTS (
    SELECT 1 FROM parent_tenant_links l
    WHERE l.parent_user_id = p.id AND l.tenant_user_id = t.id
  );

-- Rooms (Block A/B/C)
INSERT INTO rooms (hostel_id, code, capacity, status) VALUES
  (1, 'A101', 2, 'available'),
  (1, 'A102', 2, 'available'),
  (1, 'A103', 1, 'available'),
  (1, 'A104', 2, 'available'),
  (1, 'A105', 3, 'available'),
  (1, 'B201', 2, 'maintenance'),
  (1, 'B202', 2, 'available'),
  (1, 'B203', 1, 'available'),
  (1, 'B204', 3, 'available'),
  (1, 'C301', 2, 'available'),
  (1, 'C302', 2, 'available'),
  (1, 'C303', 1, 'available'),
  (1, 'C304', 2, 'available')
ON DUPLICATE KEY UPDATE
  capacity = VALUES(capacity),
  status = VALUES(status);

-- Allocations (username → room)
INSERT INTO allocations (hostel_id, room_id, user_id, start_date, active)
SELECT 1, r.id, u.id, DATE_SUB(CURDATE(), INTERVAL 90 DAY), 1
FROM rooms r
JOIN users u ON u.hostel_id = 1 AND u.username = 'student1'
WHERE r.hostel_id = 1 AND r.code = 'A101'
  AND NOT EXISTS (
    SELECT 1 FROM allocations a
    WHERE a.hostel_id = 1 AND a.user_id = u.id AND a.active = 1
  );

INSERT INTO allocations (hostel_id, room_id, user_id, start_date, active)
SELECT 1, r.id, u.id, DATE_SUB(CURDATE(), INTERVAL 60 DAY), 1
FROM rooms r
JOIN users u ON u.hostel_id = 1 AND u.username = 'student2'
WHERE r.hostel_id = 1 AND r.code = 'A101'
  AND NOT EXISTS (
    SELECT 1 FROM allocations a
    WHERE a.hostel_id = 1 AND a.user_id = u.id AND a.active = 1
  );

INSERT INTO allocations (hostel_id, room_id, user_id, start_date, active)
SELECT 1, r.id, u.id, DATE_SUB(CURDATE(), INTERVAL 75 DAY), 1
FROM rooms r
JOIN users u ON u.hostel_id = 1 AND u.username = 'student3'
WHERE r.hostel_id = 1 AND r.code = 'A102'
  AND NOT EXISTS (
    SELECT 1 FROM allocations a
    WHERE a.hostel_id = 1 AND a.user_id = u.id AND a.active = 1
  );

INSERT INTO allocations (hostel_id, room_id, user_id, start_date, active)
SELECT 1, r.id, u.id, DATE_SUB(CURDATE(), INTERVAL 45 DAY), 1
FROM rooms r
JOIN users u ON u.hostel_id = 1 AND u.username = 'student4'
WHERE r.hostel_id = 1 AND r.code = 'A103'
  AND NOT EXISTS (
    SELECT 1 FROM allocations a
    WHERE a.hostel_id = 1 AND a.user_id = u.id AND a.active = 1
  );

INSERT INTO allocations (hostel_id, room_id, user_id, start_date, active)
SELECT 1, r.id, u.id, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 1
FROM rooms r
JOIN users u ON u.hostel_id = 1 AND u.username = 'student5'
WHERE r.hostel_id = 1 AND r.code = 'B202'
  AND NOT EXISTS (
    SELECT 1 FROM allocations a
    WHERE a.hostel_id = 1 AND a.user_id = u.id AND a.active = 1
  );

INSERT INTO allocations (hostel_id, room_id, user_id, start_date, active)
SELECT 1, r.id, u.id, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 1
FROM rooms r
JOIN users u ON u.hostel_id = 1 AND u.username = 'student6'
WHERE r.hostel_id = 1 AND r.code = 'B202'
  AND NOT EXISTS (
    SELECT 1 FROM allocations a
    WHERE a.hostel_id = 1 AND a.user_id = u.id AND a.active = 1
  );

INSERT INTO allocations (hostel_id, room_id, user_id, start_date, active)
SELECT 1, r.id, u.id, DATE_SUB(CURDATE(), INTERVAL 15 DAY), 1
FROM rooms r
JOIN users u ON u.hostel_id = 1 AND u.username = 'student7'
WHERE r.hostel_id = 1 AND r.code = 'C301'
  AND NOT EXISTS (
    SELECT 1 FROM allocations a
    WHERE a.hostel_id = 1 AND a.user_id = u.id AND a.active = 1
  );

-- student8 left unallocated on purpose (allocate / room-change demos)

UPDATE rooms r
SET status = 'available'
WHERE r.hostel_id = 1 AND r.status <> 'maintenance';

UPDATE rooms r
SET status = IF(
  (SELECT COUNT(*) FROM allocations a WHERE a.room_id = r.id AND a.active = 1) >= r.capacity,
  'occupied',
  'available'
)
WHERE r.hostel_id = 1 AND r.status <> 'maintenance';

-- Fees helper pattern: per student × period
-- Jul paid, Aug paid, Sep due (current), one waived for student5

INSERT INTO fees (hostel_id, user_id, period_label, amount, status, due_date)
SELECT 1, u.id, 'Jul 2026', 8500.00, 'paid', DATE_SUB(CURDATE(), INTERVAL 80 DAY)
FROM users u
WHERE u.hostel_id = 1 AND u.username IN ('student1','student2','student3','student4','student5','student6','student7')
  AND NOT EXISTS (
    SELECT 1 FROM fees f
    WHERE f.hostel_id = 1 AND f.user_id = u.id AND f.period_label = 'Jul 2026'
  );

INSERT INTO fees (hostel_id, user_id, period_label, amount, status, due_date)
SELECT 1, u.id, 'Aug 2026', 8500.00, 'paid', DATE_SUB(CURDATE(), INTERVAL 45 DAY)
FROM users u
WHERE u.hostel_id = 1 AND u.username IN ('student1','student2','student3','student4','student5','student6','student7')
  AND NOT EXISTS (
    SELECT 1 FROM fees f
    WHERE f.hostel_id = 1 AND f.user_id = u.id AND f.period_label = 'Aug 2026'
  );

INSERT INTO fees (hostel_id, user_id, period_label, amount, status, due_date)
SELECT 1, u.id, 'Sep 2026', 8500.00, 'due', DATE_ADD(CURDATE(), INTERVAL 7 DAY)
FROM users u
WHERE u.hostel_id = 1 AND u.username IN ('student1','student2','student3','student4','student6','student7')
  AND NOT EXISTS (
    SELECT 1 FROM fees f
    WHERE f.hostel_id = 1 AND f.user_id = u.id AND f.period_label = 'Sep 2026'
  );

-- Overdue fee for student5 (mess fine)
INSERT INTO fees (hostel_id, user_id, period_label, amount, status, due_date)
SELECT 1, u.id, 'Sep 2026', 8500.00, 'due', DATE_SUB(CURDATE(), INTERVAL 5 DAY)
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'student5'
  AND NOT EXISTS (
    SELECT 1 FROM fees f
    WHERE f.hostel_id = 1 AND f.user_id = u.id AND f.period_label = 'Sep 2026'
  );

INSERT INTO fees (hostel_id, user_id, period_label, amount, status, due_date)
SELECT 1, u.id, 'Mess fine Aug', 500.00, 'waived', DATE_SUB(CURDATE(), INTERVAL 20 DAY)
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'student5'
  AND NOT EXISTS (
    SELECT 1 FROM fees f
    WHERE f.hostel_id = 1 AND f.user_id = u.id AND f.period_label = 'Mess fine Aug'
  );

-- Late fee for student3 still due (pending dues target: 7×8500 + 3500 = 63000)
INSERT INTO fees (hostel_id, user_id, period_label, amount, status, due_date)
SELECT 1, u.id, 'Late fee Aug', 3500.00, 'due', DATE_SUB(CURDATE(), INTERVAL 10 DAY)
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'student3'
  AND NOT EXISTS (
    SELECT 1 FROM fees f
    WHERE f.hostel_id = 1 AND f.user_id = u.id AND f.period_label = 'Late fee Aug'
  );

UPDATE fees f
JOIN users u ON u.id = f.user_id AND u.hostel_id = f.hostel_id
SET f.amount = 3500.00, f.status = 'due'
WHERE f.hostel_id = 1
  AND f.period_label = 'Late fee Aug'
  AND u.username = 'student3';

INSERT INTO payments (hostel_id, fee_id, amount, method)
SELECT f.hostel_id, f.id, f.amount,
  CASE
    WHEN u.username IN ('student1','student4') THEN 'upi'
    WHEN u.username IN ('student2','student6') THEN 'card'
    ELSE 'cash'
  END
FROM fees f
JOIN users u ON u.id = f.user_id
WHERE f.hostel_id = 1
  AND f.status = 'paid'
  AND f.period_label IN ('Jul 2026', 'Aug 2026')
  AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.fee_id = f.id);

-- Complaints (varied status / priority)
INSERT INTO complaints (hostel_id, user_id, title, description, priority, status, sla_due_at)
SELECT 1, u.id, 'Leaking tap in bathroom', 'Water dripping constantly in A101 bathroom sink.', 'medium', 'open',
       DATE_ADD(NOW(), INTERVAL 72 HOUR)
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'student1'
  AND NOT EXISTS (
    SELECT 1 FROM complaints c
    WHERE c.hostel_id = 1 AND c.user_id = u.id AND c.title = 'Leaking tap in bathroom'
  );

INSERT INTO complaints (hostel_id, user_id, title, description, priority, status, sla_due_at)
SELECT 1, u.id, 'Wi-Fi down on floor A', 'No internet since morning on wing A first floor.', 'high', 'in_progress',
       DATE_ADD(NOW(), INTERVAL 24 HOUR)
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'student2'
  AND NOT EXISTS (
    SELECT 1 FROM complaints c
    WHERE c.hostel_id = 1 AND c.user_id = u.id AND c.title = 'Wi-Fi down on floor A'
  );

INSERT INTO complaints (hostel_id, user_id, title, description, priority, status, sla_due_at)
SELECT 1, u.id, 'Broken study lamp', 'Desk lamp in A102 stopped working yesterday.', 'low', 'resolved',
       DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'student3'
  AND NOT EXISTS (
    SELECT 1 FROM complaints c
    WHERE c.hostel_id = 1 AND c.user_id = u.id AND c.title = 'Broken study lamp'
  );

INSERT INTO complaints (hostel_id, user_id, title, description, priority, status, sla_due_at)
SELECT 1, u.id, 'AC not cooling', 'B202 AC runs but room stays warm.', 'high', 'open',
       DATE_ADD(NOW(), INTERVAL 24 HOUR)
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'student5'
  AND NOT EXISTS (
    SELECT 1 FROM complaints c
    WHERE c.hostel_id = 1 AND c.user_id = u.id AND c.title = 'AC not cooling'
  );

INSERT INTO complaints (hostel_id, user_id, title, description, priority, status, sla_due_at)
SELECT 1, u.id, 'Mess hall food quality', 'Dinner portion was cold and undercooked twice this week.', 'medium', 'closed',
       DATE_SUB(NOW(), INTERVAL 5 DAY)
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'student6'
  AND NOT EXISTS (
    SELECT 1 FROM complaints c
    WHERE c.hostel_id = 1 AND c.user_id = u.id AND c.title = 'Mess hall food quality'
  );

INSERT INTO complaints (hostel_id, user_id, title, description, priority, status, sla_due_at)
SELECT 1, u.id, 'Door lock sticky', 'C301 main door lock needs oil / repair.', 'low', 'in_progress',
       DATE_ADD(NOW(), INTERVAL 72 HOUR)
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'student7'
  AND NOT EXISTS (
    SELECT 1 FROM complaints c
    WHERE c.hostel_id = 1 AND c.user_id = u.id AND c.title = 'Door lock sticky'
  );

INSERT INTO complaint_events (hostel_id, complaint_id, actor_user_id, status, note)
SELECT c.hostel_id, c.id, c.user_id, 'open', 'Complaint created'
FROM complaints c
JOIN users u ON u.id = c.user_id
WHERE c.hostel_id = 1
  AND NOT EXISTS (SELECT 1 FROM complaint_events e WHERE e.complaint_id = c.id AND e.status = 'open');

INSERT INTO complaint_events (hostel_id, complaint_id, actor_user_id, status, note)
SELECT c.hostel_id, c.id, s.id, 'in_progress', 'Assigned to maintenance desk'
FROM complaints c
JOIN users u ON u.id = c.user_id AND u.username IN ('student2', 'student7')
JOIN users s ON s.hostel_id = 1 AND s.username = 'staff1'
WHERE c.hostel_id = 1 AND c.status = 'in_progress'
  AND NOT EXISTS (
    SELECT 1 FROM complaint_events e
    WHERE e.complaint_id = c.id AND e.status = 'in_progress'
  );

INSERT INTO complaint_events (hostel_id, complaint_id, actor_user_id, status, note)
SELECT c.hostel_id, c.id, s.id, 'resolved', 'Lamp replaced with spare stock'
FROM complaints c
JOIN users u ON u.id = c.user_id AND u.username = 'student3'
JOIN users s ON s.hostel_id = 1 AND s.username = 'staff2'
WHERE c.hostel_id = 1 AND c.title = 'Broken study lamp'
  AND NOT EXISTS (
    SELECT 1 FROM complaint_events e
    WHERE e.complaint_id = c.id AND e.status = 'resolved'
  );

INSERT INTO complaint_events (hostel_id, complaint_id, actor_user_id, status, note)
SELECT c.hostel_id, c.id, s.id, 'closed', 'Mess vendor warned; closed after follow-up'
FROM complaints c
JOIN users u ON u.id = c.user_id AND u.username = 'student6'
JOIN users s ON s.hostel_id = 1 AND s.username = 'admin1'
WHERE c.hostel_id = 1 AND c.title = 'Mess hall food quality'
  AND NOT EXISTS (
    SELECT 1 FROM complaint_events e
    WHERE e.complaint_id = c.id AND e.status = 'closed'
  );

-- Room change requests
INSERT INTO room_change_requests (
  hostel_id, user_id, from_room_id, reason, status, staff_note, to_room_id, decided_by
)
SELECT 1, u.id, fr.id,
  'Roommate schedule conflict — prefer quieter single if possible.',
  'pending', NULL, NULL, NULL
FROM users u
JOIN rooms fr ON fr.hostel_id = 1 AND fr.code = 'A101'
WHERE u.hostel_id = 1 AND u.username = 'student1'
  AND NOT EXISTS (
    SELECT 1 FROM room_change_requests r
    WHERE r.user_id = u.id AND r.reason LIKE 'Roommate schedule conflict%'
  );

INSERT INTO room_change_requests (
  hostel_id, user_id, from_room_id, reason, status, staff_note, to_room_id, decided_by
)
SELECT 1, u.id, fr.id,
  'Want to move closer to library wing (Block C).',
  'approved', 'Approved — moved to C302.', tr.id, d.id
FROM users u
JOIN rooms fr ON fr.hostel_id = 1 AND fr.code = 'A102'
JOIN rooms tr ON tr.hostel_id = 1 AND tr.code = 'C302'
JOIN users d ON d.hostel_id = 1 AND d.username = 'staff1'
WHERE u.hostel_id = 1 AND u.username = 'student3'
  AND NOT EXISTS (
    SELECT 1 FROM room_change_requests r
    WHERE r.user_id = u.id AND r.reason LIKE 'Want to move closer to library%'
  );

INSERT INTO room_change_requests (
  hostel_id, user_id, from_room_id, reason, status, staff_note, to_room_id, decided_by
)
SELECT 1, u.id, fr.id,
  'Request ground-floor room for medical reasons.',
  'rejected', 'No vacant medical-priority room this term.', NULL, d.id
FROM users u
JOIN rooms fr ON fr.hostel_id = 1 AND fr.code = 'B202'
JOIN users d ON d.hostel_id = 1 AND d.username = 'admin1'
WHERE u.hostel_id = 1 AND u.username = 'student5'
  AND NOT EXISTS (
    SELECT 1 FROM room_change_requests r
    WHERE r.user_id = u.id AND r.reason LIKE 'Request ground-floor room%'
  );

-- Notices
INSERT INTO notices (hostel_id, title, body, created_by)
SELECT 1, 'Welcome to Hogwarts Hostel',
  'Fee week starts on the 1st. Raise maintenance issues from the app. Quiet hours 11pm–6am.',
  u.id
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'superuser'
  AND NOT EXISTS (
    SELECT 1 FROM notices n
    WHERE n.hostel_id = 1 AND n.title = 'Welcome to Hogwarts Hostel'
  );

INSERT INTO notices (hostel_id, title, body, created_by)
SELECT 1, 'September fee reminder',
  'Sep 2026 hostel fees are due within 7 days. Pay via UPI/card in the Fees module or at the office.',
  u.id
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'admin1'
  AND NOT EXISTS (
    SELECT 1 FROM notices n
    WHERE n.hostel_id = 1 AND n.title = 'September fee reminder'
  );

INSERT INTO notices (hostel_id, title, body, created_by)
SELECT 1, 'Block B201 under maintenance',
  'B201 is closed for plumbing work until further notice. Please avoid the corridor after 6pm.',
  u.id
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'staff1'
  AND NOT EXISTS (
    SELECT 1 FROM notices n
    WHERE n.hostel_id = 1 AND n.title = 'Block B201 under maintenance'
  );

INSERT INTO notices (hostel_id, title, body, created_by)
SELECT 1, 'Mess menu update',
  'Sunday special: veg biryani. Guest meal coupons available at the front desk (₹80).',
  u.id
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'admin1'
  AND NOT EXISTS (
    SELECT 1 FROM notices n
    WHERE n.hostel_id = 1 AND n.title = 'Mess menu update'
  );

INSERT INTO notices (hostel_id, title, body, created_by)
SELECT 1, 'Fire drill next Friday',
  'Mandatory fire drill at 4:30pm. Assemble at the main courtyard. Bring your ID card.',
  u.id
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'admin2'
  AND NOT EXISTS (
    SELECT 1 FROM notices n
    WHERE n.hostel_id = 1 AND n.title = 'Fire drill next Friday'
  );

-- In-app notifications (mix of read / unread)
INSERT INTO notifications (hostel_id, user_id, title, body, type, link, read_at)
SELECT 1, u.id, 'Fee due: Sep 2026', 'Your Sep 2026 fee of ₹8500 is due soon.', 'fees', '/fees', NULL
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'student1'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = u.id AND n.title = 'Fee due: Sep 2026'
  );

INSERT INTO notifications (hostel_id, user_id, title, body, type, link, read_at)
SELECT 1, u.id, 'Complaint update', 'Wi-Fi down on floor A is now in progress.', 'complaints', '/complaints', NULL
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'student2'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = u.id AND n.title = 'Complaint update'
  );

INSERT INTO notifications (hostel_id, user_id, title, body, type, link, read_at)
SELECT 1, u.id, 'Room change approved', 'Your move to C302 was approved.', 'rooms', '/room-changes', NOW()
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'student3'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = u.id AND n.title = 'Room change approved'
  );

INSERT INTO notifications (hostel_id, user_id, title, body, type, link, read_at)
SELECT 1, u.id, 'New registration pending', 'Rahul Mehta (pending1) awaits approval.', 'users', '/users', NULL
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'admin1'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = u.id AND n.title = 'New registration pending'
  );

INSERT INTO notifications (hostel_id, user_id, title, body, type, link, read_at)
SELECT 1, u.id, 'Child fee reminder', 'Zaid Shaikh has a Sep 2026 fee due.', 'fees', '/fees', NULL
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'parent1'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = u.id AND n.title = 'Child fee reminder'
  );

INSERT INTO notifications (hostel_id, user_id, title, body, type, link, read_at)
SELECT 1, u.id, 'High-priority complaint', 'AC not cooling reported in B202.', 'complaints', '/complaints', NULL
FROM users u
WHERE u.hostel_id = 1 AND u.username = 'staff1'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = u.id AND n.title = 'High-priority complaint'
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
