const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authenticateToken');
const { getFiles, getShared, getFavorites, getRecent, getExpired } = require('../controllers/filesController');

router.use(authenticateToken);
router.get('/', getFiles);
router.get('/shared', getShared);
router.get('/favorites', getFavorites);
router.get('/recent', getRecent);
router.get('/expired', getExpired);

module.exports = router;
