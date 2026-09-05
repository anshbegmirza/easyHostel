-- Seed stub: one hostel for v1 (Phase 1 will add users/rooms/demo data)
USE hostel_mgmt;

INSERT INTO hostels (id, name, address)
VALUES (1, 'Demo Hostel', 'City Campus')
ON DUPLICATE KEY UPDATE name = VALUES(name);
