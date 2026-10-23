const config = require('../config');
const AuditLog = require('../models/AuditLog');
const ConditionFaultInjector = require('../research/ConditionFaultInjector');
const ExperimentRunner = require('../research/ExperimentRunner');

const applyConditions = async (req, res, next) => {
  try {
    const { scenarioId = 'UNKNOWN', profile } = req.body || {};
    const effectiveProfile = profile || ConditionFaultInjector.SCENARIOS[scenarioId];
    if (!Array.isArray(effectiveProfile)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_SCENARIO',
        message: `Unknown scenario or condition profile: ${scenarioId}`,
      });
    }

    if (req.body?.replaceExisting !== false) {
      await ConditionFaultInjector.clearAll();
    }
    await ConditionFaultInjector.applyProfile(effectiveProfile, scenarioId);

    await AuditLog.create({
      requestId: req.requestId,
      userId: req.user.id,
      action: 'CONDITION_INJECTED',
      status: 'SUCCESS',
      metadata: {
        scenarioId,
        simulated: true,
        profile: effectiveProfile,
      },
    }).catch(() => {});

    res.json({
      success: true,
      data: {
        scenarioId,
        simulated: true,
        profile: effectiveProfile,
        note: 'SIMULATED logical conditions; not physical hardware measurements.',
      },
    });
  } catch (err) {
    next(err);
  }
};

const clearConditions = async (req, res, next) => {
  try {
    await ConditionFaultInjector.clearAll();
    await AuditLog.create({
      requestId: req.requestId,
      userId: req.user.id,
      action: 'CONDITION_CLEARED',
      status: 'SUCCESS',
      metadata: { simulated: true },
    }).catch(() => {});
    res.json({ success: true, message: 'All simulated conditions cleared.' });
  } catch (err) {
    next(err);
  }
};

const injectFailure = async (req, res, next) => {
  try {
    const { nodeId, scenarioId = 'PRIMARY_FAILURE' } = req.body || {};
    if (!nodeId) {
      return res.status(400).json({ success: false, code: 'INVALID_NODE', message: 'nodeId is required' });
    }
    await ConditionFaultInjector.injectFailure(nodeId, scenarioId);
    await AuditLog.create({
      requestId: req.requestId,
      userId: req.user.id,
      action: 'CONDITION_INJECTED',
      status: 'SUCCESS',
      nodeId,
      metadata: { scenarioId, simulated: true, status: 'OFFLINE' },
    }).catch(() => {});
    res.json({ success: true, data: { nodeId, status: 'OFFLINE', simulated: true } });
  } catch (err) {
    next(err);
  }
};

const restoreNode = async (req, res, next) => {
  try {
    const { nodeId } = req.body || {};
    if (!nodeId) {
      return res.status(400).json({ success: false, code: 'INVALID_NODE', message: 'nodeId is required' });
    }
    await ConditionFaultInjector.restoreNode(nodeId);
    await AuditLog.create({
      requestId: req.requestId,
      userId: req.user.id,
      action: 'CONDITION_CLEARED',
      status: 'SUCCESS',
      nodeId,
      metadata: { simulated: true, status: 'HEALTHY' },
    }).catch(() => {});
    res.json({ success: true, data: { nodeId, status: 'HEALTHY', simulated: true } });
  } catch (err) {
    next(err);
  }
};

const getScenarios = async (req, res) => {
  res.json({
    success: true,
    data: {
      scenarios: Object.entries(ConditionFaultInjector.SCENARIOS).map(([id, profile]) => ({
        id,
        profile,
      })),
      strategies: ExperimentRunner.getAvailableStrategies(),
      simulated: true,
      note: 'All conditions are logical simulations on a single LOCAL-HDD failure domain.',
    },
  });
};

const startExperiment = async (req, res, next) => {
  try {
    if (!config.researchMode) {
      return res.status(403).json({
        success: false,
        code: 'RESEARCH_MODE_DISABLED',
        message: 'Research endpoints are disabled (RESEARCH_MODE=false)',
      });
    }
    const run = await ExperimentRunner.start(req.body, req.user);
    res.status(202).json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
};

const getExperimentStatus = async (req, res, next) => {
  try {
    const run = await ExperimentRunner.getStatus(req.params.runId);
    res.json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
};

const listExperiments = async (req, res, next) => {
  try {
    const runs = await ExperimentRunner.list(req.query.limit);
    res.json({ success: true, data: runs });
  } catch (err) {
    next(err);
  }
};

const abortExperiment = async (req, res, next) => {
  try {
    const run = await ExperimentRunner.abort(
      req.params.runId,
      req.body?.reason || 'Aborted by operator'
    );
    res.json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
};

const exportExperiment = async (req, res, next) => {
  try {
    const { csv } = await ExperimentRunner.exportCsv(req.params.runId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.runId}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  applyConditions,
  clearConditions,
  injectFailure,
  restoreNode,
  getScenarios,
  startExperiment,
  getExperimentStatus,
  listExperiments,
  abortExperiment,
  exportExperiment,
};
