const mongoose = require('mongoose');

/**
 * ExperimentRun Model
 *
 * Records metadata for each research experiment run.
 * Required for reproducibility — captures all parameters that could affect results.
 */
const experimentRunSchema = new mongoose.Schema({
  runId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  experimentId: {
    type: String,
    required: true,
    index: true,
  },
  scenarioId: {
    type: String,
    required: true,
  },
  strategy: {
    type: String,
    enum: ['ROUND_ROBIN', 'PERFORMANCE_AWARE', 'ADAPTIVE', 'PERFORMANCE_SECURITY'],
    required: true,
  },
  // Ablation study level: A0=RR, A1=PerfAware, A2=Perf+Security, A3=Proposed Adaptive
  ablationLevel: {
    type: String,
    enum: ['A0', 'A1', 'A2', 'A3'],
    default: null,
  },
  workloadProfile: {
    type: String,
    enum: ['WRITE_HEAVY', 'READ_HEAVY', 'MIXED', 'SMALL_FILE', 'LARGE_FILE'],
    required: true,
  },
  // Experiment parameters
  fileSize: { type: Number }, // bytes
  chunkSize: { type: Number }, // bytes
  replicationFactor: { type: Number },
  parallelism: { type: Number },

  // Node configuration snapshot at run start
  nodeConfiguration: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Injected condition profile (SIMULATED — not physical hardware)
  conditionProfile: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    note: { type: String, default: 'SIMULATED logical node conditions' },
  },

  status: {
    type: String,
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'ABORTED'],
    default: 'PENDING',
    index: true,
  },

  startTime: { type: Date },
  endTime: { type: Date },

  // Summary metrics (populated when run completes)
  summaryMetrics: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  notes: { type: String, default: '' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ExperimentRun', experimentRunSchema);
