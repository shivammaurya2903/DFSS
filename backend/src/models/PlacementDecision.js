const mongoose = require('mongoose');

/**
 * PlacementDecision Model
 *
 * Records every placement decision made by the proposed adaptive strategy.
 * Required for research reproducibility and explainability.
 * Also records baseline strategy decisions for comparison.
 */
const placementDecisionSchema = new mongoose.Schema({
  decisionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  // Research run identifier (null if not in a formal experiment run)
  runId: {
    type: String,
    default: null,
    index: true,
  },
  scenarioId: {
    type: String,
    default: null,
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true,
    index: true,
  },
  chunkId: {
    type: String,
    required: true,
    index: true,
  },
  strategy: {
    type: String,
    enum: ['ROUND_ROBIN', 'PERFORMANCE_AWARE', 'ADAPTIVE'],
    required: true,
    index: true,
  },

  // All healthy candidate nodes before filtering
  candidateNodes: [{
    type: String,
  }],
  // Nodes removed by hard constraints (with reason)
  filteredNodes: [{
    nodeId: String,
    reason: String,
  }],
  // All valid primary/replica pairs evaluated (adaptive only)
  candidatePairs: [{
    primary: String,
    replica: String,
    score: Number,
  }],

  // Final decision
  selectedPrimary: {
    type: String,
    required: true,
  },
  selectedReplica: {
    type: String,
    default: null,
  },

  // Failure domain info at decision time
  failureDomainInfo: {
    primaryDomain: String,
    replicaDomain: String,
    sameDomain: Boolean,
  },

  // Snapshot of node metrics at decision time
  nodeMetricsSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Final pair score (adaptive only)
  score: {
    type: Number,
    default: null,
  },

  // Adaptation cost (adaptive only — for re-placement decisions)
  adaptationCost: {
    decisionTimeMs: { type: Number, default: 0 },
    migrationTimeMs: { type: Number, default: 0 },
    migrationBytes: { type: Number, default: 0 },
    extraIO: { type: Number, default: 0 },
    metadataUpdateCost: { type: Number, default: 0 },
  },

  // Total time to make this placement decision (ms)
  decisionTimeMs: {
    type: Number,
    required: true,
  },

  reason: {
    type: String,
    default: null,
  },

  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  strict: true,
  timestamps: false,
});

placementDecisionSchema.index({ runId: 1, strategy: 1 });
placementDecisionSchema.index({ fileId: 1, chunkId: 1 });

module.exports = mongoose.model('PlacementDecision', placementDecisionSchema);
