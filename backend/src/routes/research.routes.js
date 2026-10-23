const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const authorizeRoles = require('../middleware/authorizeRoles');
const WorkloadProfileManager = require('../research/WorkloadProfileManager');

/**
 * GET /api/research/workload-profiles
 * Get all available workload profiles
 */
router.get('/workload-profiles', authenticateToken, (req, res) => {
  try {
    const profiles = WorkloadProfileManager.getProfiles();
    res.json({ success: true, data: profiles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/research/workload-profiles/:profileId
 * Get a specific workload profile
 */
router.get('/workload-profiles/:profileId', authenticateToken, (req, res) => {
  try {
    const profile = WorkloadProfileManager.getProfile(req.params.profileId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Workload profile not found' });
    }
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/research/workload-profiles/validate
 * Validate a workload profile configuration
 */
router.post('/workload-profiles/validate', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const { profile } = req.body;
    const result = WorkloadProfileManager.validateProfile(profile);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/research/workload-profiles/generate
 * Generate a workload configuration from a profile
 */
router.post('/workload-profiles/generate', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const { profileId, options = {} } = req.body;
    const workload = WorkloadProfileManager.generateWorkload(profileId, options);
    res.json({ success: true, data: workload });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;