function assertHostelMatch(req, res, next) {
  if (req.user.hostel_id !== req.hostel.id) {
    return res.status(403).json({
      message: 'Token hostel does not match X-Hostel-Partner.',
      code: 'HOSTEL_MISMATCH',
    });
  }
  return next();
}

module.exports = { assertHostelMatch };
