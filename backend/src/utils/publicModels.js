const { encodeId } = require('../utils/publicId');

function publicUser(row) {
  return {
    id: encodeId(row.id),
    username: row.username,
    email: row.email,
    name: row.name,
    role: row.role,
    hostelId: encodeId(row.hostel_id),
    authProvider: row.auth_provider,
  };
}

function publicHostel(hostel) {
  return {
    id: encodeId(hostel.id),
    name: hostel.name,
    partner: hostel.partner,
  };
}

module.exports = { publicUser, publicHostel };
