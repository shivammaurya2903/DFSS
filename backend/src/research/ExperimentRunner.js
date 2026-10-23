const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const config = require('../config');
const ExperimentRun = require('../models/ExperimentRun');
const AuditLog = require('../models/AuditLog');
const PlacementDecision = require('../models/PlacementDecision');
const StorageNode = require('../models/StorageNode');
const File = require('../models/File');
const Chunk = require('../models/Chunk');
const User = require('../models/User');
const ShareToken = require('../models/ShareToken');
const UploadCoordinator = require('../services/UploadCoordinator');
const DownloadCoordinator = require('../services/DownloadCoordinator');
const StorageService = require('../services/StorageService');
const ConditionFaultInjector = require('./ConditionFaultInjector');
const WorkloadProfileManager = require('./WorkloadProfileManager');
const PlacementPolicyManager = require('../placement/PlacementPolicyManager');

const STRATEGY_BY_ABLATION = {
  A0: 'ROUND_ROBIN',
  A1: 'PERFORMANCE_AWARE',
  A2: 'PERFORMANCE_SECURITY',
  A3: 'ADAPTIVE',
};

const WORKLOAD_KIND = {
  W1: 'WRITE_HEAVY',
  W2: 'READ_HEAVY',
  W3: 'MIXED',
  W4: 'SMALL_FILE',
  W5: 'LARGE_FILE',
};

const SIZE_RANGES = {
  small: [512 * 1024, 1536 * 1024],
  mixed: [2 * 1024 * 1024, 8 * 1024 * 1024],
  large: [10 * 1024 * 1024, 24 * 1024 * 1024],
};

const activeRuns = new Map();

function researchError(message, code = 'RESEARCH_ERROR', statusCode = 400) {
  return Object.assign(new Error(message), { code, statusCode });
}

function percentile(values, p) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function latencySummary(values) {
  if (values.length === 0) {
    return { count: 0, min: null, max: null, average: null, p50: null, p95: null };
  }
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    average: Math.round((sum / values.length) * 100) / 100,
    p50: percentile(values, 50),
    p95: percentile(values, 95),
  };
}

function createPrng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function csvEscape(value) {
  if (value === undefined || value === null) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const ExperimentRunner = {
  getScenarioIds() {
    return Object.keys(ConditionFaultInjector.SCENARIOS);
  },

  getAvailableStrategies() {
    return PlacementPolicyManager.getAvailableStrategies();
  },

  async start(params, actor) {
    if (!config.researchMode) {
      throw researchError('Research endpoints are disabled (RESEARCH_MODE=false)', 'RESEARCH_MODE_DISABLED', 403);
    }
    if (!actor || !actor.id) {
      throw researchError('An authenticated research user is required', 'AUTH_REQUIRED', 401);
    }

    const {
      experimentId = `EXP-${Date.now()}`,
      scenarioId = 'BALANCED',
      profileId = 'W3',
      strategy,
      ablationLevel,
      repetitions = 1,
      operationsPerRepetition = 6,
      fileSizeBytes = null,
      sensitivity = 'PUBLIC',
      concurrency = null,
      seed = Date.now(),
      conditionProfile = null,
      applyConditions = true,
      cleanup = true,
      notes = '',
    } = params || {};

    const resolvedStrategy = strategy
      || STRATEGY_BY_ABLATION[ablationLevel]
      || 'ADAPTIVE';
    if (!PlacementPolicyManager.getAvailableStrategies().includes(resolvedStrategy)) {
      throw researchError(`Unknown placement strategy: ${resolvedStrategy}`, 'INVALID_STRATEGY');
    }

    const profile = WorkloadProfileManager.getProfile(profileId);
    if (!profile) {
      throw researchError(`Unknown workload profile: ${profileId}`, 'INVALID_PROFILE');
    }

    const repCount = Math.max(1, Math.min(20, parseInt(repetitions, 10) || 1));
    const opCount = Math.max(1, Math.min(100, parseInt(operationsPerRepetition, 10) || 6));
    const maxConcurrency = Math.max(1, Math.min(8, parseInt(concurrency, 10) || Math.min(profile.concurrency, 4)));

    let profileToApply = null;
    const scenario = ConditionFaultInjector.SCENARIOS[scenarioId];
    if (applyConditions) {
      if (Array.isArray(conditionProfile)) {
        profileToApply = conditionProfile;
      } else if (scenario) {
        profileToApply = scenario;
      } else if (conditionProfile && typeof conditionProfile === 'object') {
        profileToApply = Object.values(ConditionFaultInjector.SCENARIOS).includes(conditionProfile)
          ? conditionProfile
          : [conditionProfile];
      } else if (conditionProfile) {
        throw researchError(`Unknown scenario or condition profile: ${scenarioId}`, 'INVALID_SCENARIO');
      }
    }

    if (profileToApply) {
      await ConditionFaultInjector.applyProfile(profileToApply, scenarioId);
    }

    const nodeConfiguration = await StorageNode.find({}).lean();
    const runId = params?.runId || `RUN-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    if (await ExperimentRun.findOne({ runId })) {
      throw researchError(`Experiment run ${runId} already exists`, 'RUN_ALREADY_EXISTS', 409);
    }

    const run = await ExperimentRun.create({
      runId,
      experimentId,
      scenarioId,
      strategy: resolvedStrategy,
      ablationLevel: ablationLevel || Object.keys(STRATEGY_BY_ABLATION).find(k => STRATEGY_BY_ABLATION[k] === resolvedStrategy) || null,
      workloadProfile: WORKLOAD_KIND[profileId] || 'MIXED',
      fileSize: fileSizeBytes || null,
      chunkSize: config.chunkSizeBytes,
      replicationFactor: config.replicationFactor,
      parallelism: maxConcurrency,
      nodeConfiguration,
      conditionProfile: profileToApply
        ? { simulated: true, scenarioId, profile: profileToApply }
        : { simulated: false, scenarioId },
      status: 'RUNNING',
      startTime: new Date(),
      notes,
    });

    const context = {
      runId,
      experimentId,
      scenarioId,
      profileId,
      strategy: resolvedStrategy,
      sensitivity,
      repetitions: repCount,
      operationsPerRepetition: opCount,
      fileSizeBytes: fileSizeBytes ? Math.max(1024, parseInt(fileSizeBytes, 10)) : null,
      concurrency: maxConcurrency,
      seed: parseInt(seed, 10) || Date.now(),
      userId: actor.id,
      cleanup,
      conditionsApplied: Boolean(profileToApply),
      aborted: false,
      createdFiles: new Map(),
    };

    activeRuns.set(runId, context);
    setImmediate(() => {
      this._execute(context).catch((err) => {
        console.error(`[ExperimentRunner] Unhandled run error ${runId}:`, err.message);
      });
    });

    return this.getStatus(runId);
  },

  async _execute(context) {
    const startTime = Date.now();
    try {
      for (let repetition = 0; repetition < context.repetitions; repetition++) {
        if (context.aborted) throw researchError('Experiment aborted by operator', 'EXPERIMENT_ABORTED');

        const plan = this._buildOperationPlan(context, repetition);
        if (plan.length > 0) {
          await this._executeOperation(context, plan[0], repetition, 0);
        }
        for (let offset = 1; offset < plan.length; offset += context.concurrency) {
          if (context.aborted) throw researchError('Experiment aborted by operator', 'EXPERIMENT_ABORTED');
          const batch = plan.slice(offset, offset + context.concurrency);
          await Promise.all(batch.map((operation, batchIndex) =>
            this._executeOperation(context, operation, repetition, offset + batchIndex)
          ));
        }

        if (context.cleanup) {
          await this._cleanupFiles(context);
        }
      }

      const summaryMetrics = await this._collectSummary(context, startTime);
      await ExperimentRun.findOneAndUpdate(
        { runId: context.runId },
        {
          status: 'COMPLETED',
          endTime: new Date(),
          summaryMetrics,
        }
      );
    } catch (err) {
      const summaryMetrics = await this._collectSummary(context, startTime);
      summaryMetrics.error = err.message;
      await ExperimentRun.findOneAndUpdate(
        { runId: context.runId },
        {
          status: err.code === 'EXPERIMENT_ABORTED' || context.aborted ? 'ABORTED' : 'FAILED',
          endTime: new Date(),
          summaryMetrics,
        }
      );
    } finally {
      activeRuns.delete(context.runId);
      if (context.conditionsApplied) {
        try {
          await ConditionFaultInjector.clearAll();
        } catch (err) {
          console.error(`[ExperimentRunner] Failed to clear conditions: ${err.message}`);
        }
      }
      if (context.cleanup) {
        await this._cleanupFiles(context).catch(() => {});
      }
    }
  },

  _buildOperationPlan(context, repetition) {
    const profile = WorkloadProfileManager.getProfile(context.profileId);
    const rng = createPrng(context.seed + repetition * 1009);
    const total = context.operationsPerRepetition;
    const writes = Math.max(1, Math.min(total, Math.round(total * profile.writeRatio)));
    const operations = [];

    for (let i = 0; i < total; i++) {
      operations.push({ type: i < writes ? 'write' : 'read', index: i });
    }

    for (let i = operations.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [operations[i], operations[j]] = [operations[j], operations[i]];
    }
    if (operations[0].type !== 'write') {
      const firstWrite = operations.findIndex(op => op.type === 'write');
      [operations[0], operations[firstWrite]] = [operations[firstWrite], operations[0]];
    }

    return operations;
  },

  _chooseFileSize(context) {
    if (context.fileSizeBytes) {
      return context.fileSizeBytes;
    }
    const profile = WorkloadProfileManager.getProfile(context.profileId);
    const [min, max] = SIZE_RANGES[profile.fileSizeDistribution] || SIZE_RANGES.mixed;
    const rng = createPrng(context.seed + context.createdFiles.size + 17);
    return Math.floor(min + rng() * (max - min));
  },

  async _executeOperation(context, operation, repetition, sequence) {
    if (context.aborted) {
      throw researchError('Experiment aborted by operator', 'EXPERIMENT_ABORTED');
    }
    const requestId = `${context.runId}-r${repetition}-op${sequence}-${crypto.randomUUID()}`;

    if (operation.type === 'write') {
      const size = this._chooseFileSize(context);
      const tempPath = path.join(os.tmpdir(), `dfss-exp-${context.runId}-${repetition}-${sequence}.bin`);
      fs.writeFileSync(tempPath, crypto.randomBytes(size));
      try {
        const result = await UploadCoordinator.upload({
          fileData: {
            path: tempPath,
            size,
            originalname: `synthetic-${context.runId}-r${repetition}-op${sequence}.bin`,
            mimetype: 'application/octet-stream',
          },
          userId: context.userId,
          requestId,
          sensitivity: context.sensitivity,
          securityClass: 'MEDIUM',
          placementPolicy: context.strategy,
          runId: context.runId,
          scenarioId: context.scenarioId,
        });
        context.createdFiles.set(String(result.file._id), {
          fileId: result.file._id,
          storedSize: result.file.storedSize || size,
        });
      } finally {
        try { fs.unlinkSync(tempPath); } catch (_) { /* ignore */ }
      }
      return;
    }

    const fileIds = [...context.createdFiles.keys()];
    if (fileIds.length === 0) {
      return;
    }
    const fileId = fileIds[sequence % fileIds.length];
    try {
      await DownloadCoordinator.download({
        fileId,
        userId: context.userId,
        requestId,
        runId: context.runId,
      });
    } catch (err) {
      await AuditLog.create({
        requestId,
        userId: context.userId,
        runId: context.runId,
        scenarioId: context.scenarioId,
        action: 'DOWNLOAD',
        status: 'FAILURE',
        fileId,
        reason: err.message,
        metadata: { operation: 'experiment-read' },
      }).catch(() => {});
      throw err;
    }
  },

  async _cleanupFiles(context) {
    const NodeModels = { File, Chunk, ShareToken, User };
    for (const entry of context.createdFiles.values()) {
      try {
        const chunks = await Chunk.find({ fileId: entry.fileId });
        for (const chunk of chunks) {
          const nodeIds = [chunk.primaryNode, ...(chunk.replicaNodes || [])].filter(Boolean);
          for (const nodeId of nodeIds) {
            const url = StorageService.getNodeUrl(nodeId)
              || await StorageService.getNodeUrlFromDB(nodeId);
            if (url) {
              try {
                await StorageService.deleteChunk(url, chunk.chunkId);
              } catch (err) {
                // A node may be intentionally offline during a failure scenario.
              }
            }
          }
          await NodeModels.Chunk.findByIdAndDelete(chunk._id);
        }
        await NodeModels.File.findByIdAndDelete(entry.fileId);
        await NodeModels.ShareToken.deleteMany({ fileId: entry.fileId });
        await NodeModels.User.findByIdAndUpdate(context.userId, {
          $inc: { usedStorage: -entry.storedSize },
        });
      } catch (err) {
        console.warn(`[ExperimentRunner] Cleanup failed for ${entry.fileId}: ${err.message}`);
      }
    }
    context.createdFiles.clear();
  },

  async _collectSummary(context, startTime) {
    const logs = await AuditLog.find({
      runId: context.runId,
      action: { $in: ['UPLOAD', 'DOWNLOAD'] },
    }).lean();

    const uploads = logs.filter(log => log.action === 'UPLOAD');
    const downloads = logs.filter(log => log.action === 'DOWNLOAD');
    const successes = logs.filter(log => log.status === 'SUCCESS');
    const failures = logs.filter(log => log.status !== 'SUCCESS');

    const decisions = await PlacementDecision.find({ runId: context.runId }).lean();
    const decisionTimes = decisions.map(d => d.decisionTimeMs).filter(Number.isFinite);

    return {
      simulated: true,
      note: 'All injected conditions are simulated; nodes share the LOCAL-HDD failure domain.',
      wallClockMs: Date.now() - startTime,
      operations: {
        total: logs.length,
        uploads: uploads.length,
        downloads: downloads.length,
        success: successes.length,
        failure: failures.length,
        successRate: logs.length > 0 ? successes.length / logs.length : 0,
      },
      latencyMs: {
        upload: latencySummary(uploads.filter(l => l.status === 'SUCCESS').map(l => l.latencyMs).filter(Number.isFinite)),
        download: latencySummary(downloads.filter(l => l.status === 'SUCCESS').map(l => l.latencyMs).filter(Number.isFinite)),
      },
      placement: {
        decisions: decisions.length,
        byStrategy: decisions.reduce((acc, decision) => {
          acc[decision.strategy] = (acc[decision.strategy] || 0) + 1;
          return acc;
        }, {}),
        decisionTimeMs: latencySummary(decisionTimes),
      },
      repetitions: context.repetitions,
      operationsPerRepetition: context.operationsPerRepetition,
      concurrency: context.concurrency,
      seed: context.seed,
    };
  },

  async getStatus(runId) {
    const run = await ExperimentRun.findOne({ runId }).lean();
    if (!run) {
      throw researchError(`Experiment run ${runId} not found`, 'RUN_NOT_FOUND', 404);
    }
    const operationCount = await AuditLog.countDocuments({
      runId,
      action: { $in: ['UPLOAD', 'DOWNLOAD'] },
    });
    return {
      ...run,
      active: activeRuns.has(runId),
      progress: {
        operationsRecorded: operationCount,
      },
    };
  },

  async list(limit = 20) {
    return ExperimentRun.find({})
      .sort({ createdAt: -1 })
      .limit(Math.max(1, Math.min(100, parseInt(limit, 10) || 20)))
      .lean();
  },

  async abort(runId, reason = 'Aborted by operator') {
    if (!config.researchMode) {
      throw researchError('Research endpoints are disabled (RESEARCH_MODE=false)', 'RESEARCH_MODE_DISABLED', 403);
    }
    const run = await ExperimentRun.findOne({ runId });
    if (!run) {
      throw researchError(`Experiment run ${runId} not found`, 'RUN_NOT_FOUND', 404);
    }
    if (['COMPLETED', 'FAILED', 'ABORTED'].includes(run.status)) {
      throw researchError(`Experiment run ${runId} is already ${run.status}`, 'RUN_TERMINAL', 409);
    }
    const active = activeRuns.get(runId);
    if (active) {
      active.aborted = true;
    }
    run.status = 'ABORTED';
    run.endTime = new Date();
    run.notes = [run.notes, reason].filter(Boolean).join('\n');
    await run.save();
    await ConditionFaultInjector.clearAll().catch(() => {});
    return this.getStatus(runId);
  },

  async exportCsv(runId) {
    const run = await ExperimentRun.findOne({ runId }).lean();
    if (!run) {
      throw researchError(`Experiment run ${runId} not found`, 'RUN_NOT_FOUND', 404);
    }
    const logs = await AuditLog.find({
      runId,
      action: { $in: ['UPLOAD', 'DOWNLOAD'] },
    }).sort({ timestamp: 1 }).lean();

    const header = [
      'runId', 'experimentId', 'scenarioId', 'strategy', 'ablationLevel',
      'workloadProfile', 'action', 'status', 'latencyMs', 'fileId',
      'chunkCount', 'reason', 'timestamp',
    ];
    const rows = logs.map(log => [
      run.runId,
      run.experimentId,
      run.scenarioId,
      run.strategy,
      run.ablationLevel || '',
      run.workloadProfile,
      log.action,
      log.status,
      log.latencyMs || '',
      log.fileId || '',
      log.metadata?.chunkCount || '',
      log.reason || '',
      log.timestamp ? new Date(log.timestamp).toISOString() : '',
    ].map(csvEscape).join(','));

    if (rows.length === 0) {
      rows.push([
        run.runId, run.experimentId, run.scenarioId, run.strategy,
        run.ablationLevel || '', run.workloadProfile, 'SUMMARY', run.status,
        run.summaryMetrics?.latencyMs?.upload?.average || '',
        '', '', run.summaryMetrics?.error || '',
        run.startTime ? new Date(run.startTime).toISOString() : '',
      ].map(csvEscape).join(','));
    }

    return { run, csv: `${header.join(',')}\n${rows.join('\n')}\n` };
  },
};

module.exports = ExperimentRunner;
module.exports.STRATEGY_BY_ABLATION = STRATEGY_BY_ABLATION;
module.exports.WORKLOAD_KIND = WORKLOAD_KIND;
