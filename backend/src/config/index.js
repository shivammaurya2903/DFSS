require('dotenv').config({ quiet: true });
const crypto = require('crypto');

/**
 * Central configuration module.
 * All values must come from environment variables.
 * No secrets are hardcoded.
 * Server will fail fast if required secrets are missing in production.
 */

const requiredInProduction = (name, value) => {
  if (process.env.NODE_ENV === 'production' && !value) {
    console.error(`FATAL: Required environment variable ${name} is not set in production mode.`);
    process.exit(1);
  }
  return value;
};

const jwtSecret = process.env.JWT_SECRET;
const encryptionKey = process.env.ENCRYPTION_KEY;
const internalApiSecret = process.env.INTERNAL_API_SECRET;

requiredInProduction('JWT_SECRET', jwtSecret);
requiredInProduction('ENCRYPTION_KEY', encryptionKey);
requiredInProduction('INTERNAL_API_SECRET', internalApiSecret);

module.exports = {
  // Server
  port: parseInt(process.env.PORT || process.env.BACKEND_PORT, 10) || 5000,
  host: process.env.BACKEND_HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/distributed_file_storage',
  mongoDatabase: process.env.MONGODB_DATABASE || 'distributed_file_storage',

  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173'],

  // JWT
  jwtSecret: jwtSecret || (process.env.NODE_ENV !== 'production' ? 'CHANGE_THIS_DEV_ONLY_SECRET' : undefined),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',

  // Bcrypt
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,

  // Encryption
  encryptionKey: encryptionKey || (process.env.NODE_ENV !== 'production' ? 'CHANGE_THIS_32_CHAR_DEV_KEY_0000' : undefined),

  // Storage nodes (URL registry)
  storageNodes: [
    process.env.STORAGE_NODE_1_URL,
    process.env.STORAGE_NODE_2_URL,
    process.env.STORAGE_NODE_3_URL,
    process.env.STORAGE_NODE_4_URL,
  ].filter(Boolean),

  // Storage
  storageRoot: process.env.STORAGE_ROOT || 'D:/DistributedStorage',

  // File processing
  chunkSizeBytes: parseInt(process.env.CHUNK_SIZE_MB || '10', 10) * 1024 * 1024,
  replicationFactor: parseInt(process.env.REPLICATION_FACTOR || '2', 10),
  parallelDownloads: parseInt(process.env.PARALLEL_DOWNLOADS || '2', 10),
  maxOriginalFileSize: parseInt(process.env.MAX_ORIGINAL_FILE_SIZE_MB || '500', 10) * 1024 * 1024,
  maxStoredFileSize: parseInt(process.env.MAX_STORED_FILE_SIZE_MB || process.env.MAX_ORIGINAL_FILE_SIZE_MB || '500', 10) * 1024 * 1024,
  defaultStorageQuota: parseInt(process.env.DEFAULT_STORAGE_QUOTA_MB || '1024', 10) * 1024 * 1024,

  // Heartbeat
  heartbeatIntervalMs: parseInt(process.env.HEARTBEAT_INTERVAL_MS || '5000', 10),
  heartbeatTimeoutMs: parseInt(process.env.HEARTBEAT_TIMEOUT_MS || '15000', 10),
  heartbeatMissedThreshold: parseInt(process.env.HEARTBEAT_MISSED_THRESHOLD || '2', 10),

  // Storage request timeouts
  storageRequestTimeoutMs: parseInt(process.env.STORAGE_REQUEST_TIMEOUT_MS || '10000', 10),
  storageUploadTimeoutMs: parseInt(process.env.STORAGE_UPLOAD_TIMEOUT_MS || '60000', 10),
  storageHealthTimeoutMs: parseInt(process.env.STORAGE_HEALTH_TIMEOUT_MS || '5000', 10),

  // Internal API security
  internalApiSecret: internalApiSecret || (process.env.NODE_ENV !== 'production' ? 'CHANGE_THIS_INTERNAL_SECRET' : undefined),

  // Share links: stable HMAC tokens let owners re-display links without
  // storing plaintext capabilities. Rotating this secret revokes all links.
  shareTokenSecret: process.env.SHARE_TOKEN_SECRET || crypto
    .createHmac('sha256', 'dfss-share-token-v1')
    .update(`${internalApiSecret || 'dev'}:${jwtSecret || 'dev'}`)
    .digest('hex'),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Research mode
  researchMode: process.env.RESEARCH_MODE === 'true',
  reevaluationCooldownMs: parseInt(process.env.REEVALUATION_COOLDOWN_MS || '60000', 10),
  loadThreshold: parseFloat(process.env.LOAD_THRESHOLD || '0.8'),
  latencyThresholdMs: parseInt(process.env.LATENCY_THRESHOLD_MS || '100', 10),
  capacityThresholdPercent: parseFloat(process.env.CAPACITY_THRESHOLD_PERCENT || '0.9'),
  minMigrationBenefitScore: parseFloat(process.env.MIN_MIGRATION_BENEFIT || '0.1'),

  // Workload Profiles (for research experiments)
  workloadProfiles: {
    W1: { name: 'Write-Heavy', description: 'High write throughput, large sequential writes', writeRatio: 0.8, readRatio: 0.2, fileSizeDistribution: 'large', concurrency: 10 },
    W2: { name: 'Read-Heavy', description: 'High read throughput, cached reads', writeRatio: 0.1, readRatio: 0.9, fileSizeDistribution: 'mixed', concurrency: 20 },
    W3: { name: 'Mixed', description: 'Balanced read/write workload', writeRatio: 0.5, readRatio: 0.5, fileSizeDistribution: 'mixed', concurrency: 15 },
    W4: { name: 'Small-File', description: 'Many small files (< 1MB)', writeRatio: 0.5, readRatio: 0.5, fileSizeDistribution: 'small', concurrency: 50 },
    W5: { name: 'Large-File', description: 'Few large files (> 100MB)', writeRatio: 0.5, readRatio: 0.5, fileSizeDistribution: 'large', concurrency: 5 },
  },

  // Placement weights (configurable for research)
  placementWeights: {
    performance: parseFloat(process.env.WEIGHT_PERFORMANCE || '0.3'),
    loadBalance: parseFloat(process.env.WEIGHT_LOAD_BALANCE || '0.25'),
    lowLatency: parseFloat(process.env.WEIGHT_LATENCY || '0.2'),
    reliability: parseFloat(process.env.WEIGHT_RELIABILITY || '0.15'),
    replicaDiversity: parseFloat(process.env.WEIGHT_REPLICA_DIVERSITY || '0.1'),
    adaptationCost: parseFloat(process.env.WEIGHT_ADAPTATION_COST || '0.3'),
  },
};
