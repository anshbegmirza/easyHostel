const { requireAuth, requireRoles } = require('./requireAuth');
const { resolveHostel } = require('./resolveHostel');
const { assertHostelMatch } = require('./assertHostelMatch');

/** Auth + hostel resolution + hostel match. Optional role gate. */
function secured(...roles) {
  const stack = [requireAuth, resolveHostel, assertHostelMatch];
  if (roles.length) {
    stack.push(requireRoles(...roles));
  }
  return stack;
}

const staffRoles = ['superuser', 'admin', 'staff'];

module.exports = { secured, staffRoles };
