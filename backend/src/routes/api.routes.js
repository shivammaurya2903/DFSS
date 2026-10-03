const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const filesRoutes = require('./files.routes');
const storageRoutes = require('./storage.routes');
const activityRoutes = require('./activity.routes');
const usersRoutes = require('./users.routes');
const { getHealth } = require('../controllers/health.controller');

// ─────────────────────────────────────────
// Health check (public)
// ─────────────────────────────────────────
router.get('/health', getHealth);

// ─────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────
router.use('/auth', authRoutes);

// ─────────────────────────────────────────
// Files (protected by JWT in sub-router)
// ─────────────────────────────────────────
router.use('/files', filesRoutes);

// ─────────────────────────────────────────
// Storage nodes + admin metrics
// ─────────────────────────────────────────
router.use('/storage', storageRoutes);

// ─────────────────────────────────────────
// Activity / Audit log
// ─────────────────────────────────────────
router.use('/activity', activityRoutes);

router.use('/users', usersRoutes);

module.exports = router;