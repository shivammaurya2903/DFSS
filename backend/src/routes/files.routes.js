const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const os = require('os');
const authenticateToken = require('../middleware/authenticateToken');
const {
  getFiles,
  getShared,
  getFavorites,
  getRecent,
  getExpired,
  uploadFile,
  getFileDetails,
  downloadFile,
  deleteFile,
} = require('../controllers/filesController');

// Use disk storage so large files don't exhaust memory
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) => cb(null, `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`),
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10 GB
  },
});

router.use(authenticateToken);

// File CRUD
router.get('/', getFiles);
router.post('/upload', upload.single('file'), uploadFile);
router.get('/shared', getShared);
router.get('/favorites', getFavorites);
router.get('/recent', getRecent);
router.get('/expired', getExpired);
router.get('/:fileId', getFileDetails);
router.get('/:fileId/download', downloadFile);
router.delete('/:fileId', deleteFile);

module.exports = router;
