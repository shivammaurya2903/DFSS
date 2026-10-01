const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const filesRoutes = require('./files.routes');
const storageRoutes = require('./storage.routes');
const { getHealth } = require('../controllers/health.controller');

router.use('/auth', authRoutes);
router.use('/files', filesRoutes);
router.use('/storage', storageRoutes);

router.get('/health', getHealth);

module.exports = router;