const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const authorizeRoles = require('../middleware/authorizeRoles');
const requireResearchMode = require('../middleware/requireResearchMode');
const WorkloadProfileManager = require('../research/WorkloadProfileManager');
const researchController = require('../controllers/research.controller');

router.use(authenticateToken, requireResearchMode, authorizeRoles('admin'));

router.get('/workload-profiles', (req, res) => {
  res.json({ success: true, data: WorkloadProfileManager.getProfiles() });
});

router.get('/workload-profiles/:profileId', (req, res) => {
  const profile = WorkloadProfileManager.getProfile(req.params.profileId);
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Workload profile not found' });
  }
  res.json({ success: true, data: profile });
});

router.post('/workload-profiles/validate', (req, res) => {
  const result = WorkloadProfileManager.validateProfile(req.body?.profile);
  res.json({ success: true, data: result });
});

router.post('/workload-profiles/generate', (req, res, next) => {
  try {
    const workload = WorkloadProfileManager.generateWorkload(
      req.body?.profileId,
      req.body?.options || {}
    );
    res.json({ success: true, data: workload });
  } catch (err) {
    next(err);
  }
});

router.get('/scenarios', researchController.getScenarios);
router.post('/conditions/apply', researchController.applyConditions);
router.post('/conditions/clear', researchController.clearConditions);
router.post('/conditions/failure', researchController.injectFailure);
router.post('/conditions/restore', researchController.restoreNode);

router.get('/experiments', researchController.listExperiments);
router.post('/experiments/start', researchController.startExperiment);
router.get('/experiments/:runId/status', researchController.getExperimentStatus);
router.post('/experiments/:runId/abort', researchController.abortExperiment);
router.get('/experiments/:runId/export', researchController.exportExperiment);

module.exports = router;
