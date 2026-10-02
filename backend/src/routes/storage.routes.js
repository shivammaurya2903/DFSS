const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const authorizeRoles = require('../middleware/authorizeRoles');
const validateInternalToken = require('../middleware/validateInternalToken');
const {
  getNodes,
  getNodeDetails,
  heartbeat,
  registerNode,
  getSystemMetrics,
} = require('../controllers/storageController');

// ─────────────────────────────────────────
// INTERNAL endpoints (storage nodes → backend)
// Protected by INTERNAL_API_SECRET
// ─────────────────────────────────────────
router.post('/register', validateInternalToken, registerNode);
router.post('/heartbeat', validateInternalToken, heartbeat);

// ─────────────────────────────────────────
// USER endpoints (frontend → backend)
// Protected by JWT
// ─────────────────────────────────────────
router.get('/nodes', authenticateToken, getNodes);
router.get('/nodes/:nodeId', authenticateToken, getNodeDetails);

// ─────────────────────────────────────────
// ADMIN endpoints
// Protected by JWT + admin role
// ─────────────────────────────────────────
router.get('/admin/metrics', authenticateToken, authorizeRoles('admin'), getSystemMetrics);

module.exports = router;
