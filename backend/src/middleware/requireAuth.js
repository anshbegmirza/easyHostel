const jwt = require('jsonwebtoken');
const { decodeId } = require('../utils/publicId');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authentication required.', code: 'UNAUTHORIZED' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-me-in-production');
    const userId = decodeId(payload.userId);
    const hostelId = decodeId(payload.hostelId);

    if (userId == null || hostelId == null) {
      return res.status(401).json({ message: 'Invalid or expired token.', code: 'UNAUTHORIZED' });
    }

    req.user = {
      id: userId,
      role: payload.role,
      hostelId,
    };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.', code: 'UNAUTHORIZED' });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden.', code: 'FORBIDDEN' });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRoles };
