const crypto = require('crypto');
const {
  buildEncryptionInfo,
  getFileKey,
  getLegacyKey,
  encryptChunk,
  decryptChunk,
  sha256,
} = require('../src/utils/encryption');

describe('encryption utilities', () => {
  test('envelope encryption wraps a unique per-file key', () => {
    const first = buildEncryptionInfo();
    const second = buildEncryptionInfo();

    expect(first.encryptionInfo.keyVersion).toBe(2);
    expect(first.encryptionInfo.wrappedKey).toBeTruthy();
    expect(first.dataKey).toHaveLength(32);
    expect(first.dataKey.equals(second.dataKey)).toBe(false);
    expect(getFileKey({ encryptionInfo: first.encryptionInfo }).equals(first.dataKey)).toBe(true);
  });

  test('legacy files still decrypt with the legacy derived key', () => {
    const plaintext = Buffer.from('legacy chunk payload');
    const encrypted = encryptChunk(plaintext, getLegacyKey());

    expect(getFileKey({ encryptionInfo: { algorithm: 'AES-256-CBC' } }).equals(getLegacyKey())).toBe(true);
    expect(decryptChunk(encrypted, getFileKey({ encryptionInfo: {} }))).toEqual(plaintext);
  });

  test('encrypted chunk hash differs from plaintext chunk hash', () => {
    const plaintext = crypto.randomBytes(4096);
    const { dataKey } = buildEncryptionInfo();
    const encrypted = encryptChunk(plaintext, dataKey);

    expect(sha256(encrypted)).not.toBe(sha256(plaintext));
    expect(decryptChunk(encrypted, dataKey)).toEqual(plaintext);
  });
});
