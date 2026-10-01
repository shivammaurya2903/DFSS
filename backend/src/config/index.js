require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/distributed_file_storage',
  mongoDatabase: process.env.MONGODB_DATABASE || 'distributed_file_storage',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'change_this_later',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  storageNodes: [
    process.env.STORAGE_NODE_1_URL,
    process.env.STORAGE_NODE_2_URL,
    process.env.STORAGE_NODE_3_URL,
    process.env.STORAGE_NODE_4_URL
  ].filter(Boolean)
};
