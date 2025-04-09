
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

const reportUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'reports');
console.log('[Multer Destination] Upload directory:', reportUploadDir);
fs.mkdirSync(reportUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('[Multer Destination] Triggered for file:', file.originalname);
    cb(null, reportUploadDir);
  },
  filename: function (req, file, cb) {
    console.log('[Multer Filename] Generating name for:', file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  console.log('[Multer FileFilter] Checking file:', file.originalname, file.mimetype);
  if (file.mimetype.startsWith('image') || file.mimetype === 'application/pdf') {
    console.log('[Multer FileFilter] Allowing file:', file.originalname);
    cb(null, true);
  } else {
    console.log('[Multer FileFilter] Rejecting file:', file.originalname);
    cb(new AppError('Not an image or PDF! Please upload only images or PDFs.', 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit
}).array('attachments', 5);

exports.uploadReportAttachments = (req, res, next) => {
  console.log('[uploadReportAttachments] Middleware starting...');
  console.log('[uploadReportAttachments] Request Content-Type Header:', req.headers['content-type']);

  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.error('[uploadReportAttachments] Multer Error:', err);
      return next(new AppError(`File Upload Error: ${err.message}`, 400));
    } else if (err) {
      console.error('[uploadReportAttachments] Unknown Upload Error:', err);
      return next(err);
    }
    console.log('[uploadReportAttachments] Multer finished. req.files:', req.files ? `${req.files.length} files` : 'undefined');
    next();
  });
};
