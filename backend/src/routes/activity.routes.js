const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const authenticateToken = require('../middleware/authenticateToken');
const authorizeRoles = require('../middleware/authorizeRoles');

// ─────────────────────────────────────────
// ACTIVITY LOG — current user's events
// ─────────────────────────────────────────
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const page  = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip  = (page - 1) * limit;

    const filter = { userId: req.user.id };
    if (req.query.action) filter.action = req.query.action;

    const [events, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// ADMIN: ALL ACTIVITY
// ─────────────────────────────────────────
router.get('/admin', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const page  = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.nodeId) filter.nodeId = req.query.nodeId;

    const [events, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
