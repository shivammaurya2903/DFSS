const crypto = require('crypto');
const config = require('../config');

const MASTER_KEY_SALT = 'dfss-master-key-v2';
const DATA_KEY_VERSION = 2;

let cachedMasterKey = null;
let cachedLegacyKey = null;

function getMasterKey() {
  if (!cachedMasterKey) {
    cachedMasterKey = crypto.scryptSync(String(config.encryptionKey), MASTER_KEY_SALT, 32);
  }
  return cachedMasterKey;
}

function getLegacyKey() {
  if (!cachedLegacyKey) {
    cachedLegacyKey = Buffer.from(String(config.encryptionKey).padEnd(32, '0').slice(0, 32));
  }
  return cachedLegacyKey;
}

function generateFileKey() {
  return crypto.randomBytes(32);
}

function wrapFileKey(dataKey, masterKey = getMasterKey()) {
  const wrapIv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, wrapIv);
  const wrappedKey = Buffer.concat([cipher.update(dataKey), cipher.final()]);
  return {
    keyVersion: DATA_KEY_VERSION,
    wrappedKey: wrappedKey.toString('base64'),
    wrapIv: wrapIv.toString('base64'),
    wrapTag: cipher.getAuthTag().toString('base64'),
  };
}

function unwrapFileKey(encryptionInfo, masterKey = getMasterKey()) {
  if (!encryptionInfo || encryptionInfo.keyVersion !== DATA_KEY_VERSION) {
    return getLegacyKey();
  }
  if (!encryptionInfo.wrappedKey || !encryptionInfo.wrapIv || !encryptionInfo.wrapTag) {
    throw Object.assign(new Error('File encryption metadata is incomplete'), {
      code: 'ENCRYPTION_METADATA_INVALID',
      statusCode: 500,
    });
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    masterKey,
    Buffer.from(encryptionInfo.wrapIv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(encryptionInfo.wrapTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptionInfo.wrappedKey, 'base64')),
    decipher.final(),
  ]);
}

function rewrapFileKey(encryptionInfo, oldMasterKey, newMasterKey) {
  const dataKey = unwrapFileKey(encryptionInfo, oldMasterKey);
  const newWrapped = wrapFileKey(dataKey, newMasterKey);
  return {
    ...encryptionInfo,
    ...newWrapped,
  };
}

function getFileKey(file) {
  return unwrapFileKey(file && file.encryptionInfo);
}

function buildEncryptionInfo() {
  const dataKey = generateFileKey();
  return {
    dataKey,
    encryptionInfo: {
      algorithm: 'AES-256-CBC',
      ...wrapFileKey(dataKey),
    },
  };
}

function encryptChunk(rawChunk, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([iv, cipher.update(rawChunk), cipher.final()]);
}

function decryptChunk(encryptedChunk, key) {
  if (!Buffer.isBuffer(encryptedChunk) || encryptedChunk.length < 32) {
    throw Object.assign(new Error('Encrypted chunk is too short'), {
      code: 'CHUNK_DATA_INVALID',
      statusCode: 500,
    });
  }
  const iv = encryptedChunk.slice(0, 16);
  const ciphertext = encryptedChunk.slice(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = {
  DATA_KEY_VERSION,
  getMasterKey,
  getLegacyKey,
  getFileKey,
  wrapFileKey,
  unwrapFileKey,
  rewrapFileKey,
  buildEncryptionInfo,
  encryptChunk,
  decryptChunk,
  sha256,
};
