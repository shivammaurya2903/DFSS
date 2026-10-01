const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticateToken = require('../middleware/authenticateToken');
const { getFiles, getShared, getFavorites, getRecent, getExpired, uploadFile, getFileDetails, downloadFile, deleteFile } = require('../controllers/filesController');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);
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
