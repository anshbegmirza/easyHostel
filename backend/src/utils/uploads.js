const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadsRoot = path.join(__dirname, '../../uploads');
const complaintDir = path.join(uploadsRoot, 'complaints');

fs.mkdirSync(complaintDir, { recursive: true });

const complaintPhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, complaintDir),
    filename: (_req, file, cb) => {
      const safe = String(file.originalname || 'photo')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 80);
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!String(file.mimetype || '').startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed.'));
    }
    return cb(null, true);
  },
});

module.exports = { uploadsRoot, complaintDir, complaintPhotoUpload };
