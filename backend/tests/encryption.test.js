const crypto = require('crypto');
const {
  buildEncryptionInfo,
  getFileKey,
  getLegacyKey,
  getMasterKey,
  unwrapFileKey,
  rewrapFileKey,
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

  test('fails decryption when wrapped key auth tag is tampered', () => {
    const { encryptionInfo } = buildEncryptionInfo();
    const tamperedTag = Buffer.from(encryptionInfo.wrapTag, 'base64');
    tamperedTag[0] ^= 0xff; // corrupt tag
    const tampered = { ...encryptionInfo, wrapTag: tamperedTag.toString('base64') };

    expect(() => getFileKey({ encryptionInfo: tampered })).toThrow();
  });

  test('supports key rotation / re-wrapping with a new master key without modifying chunk ciphertext', () => {
    const plaintext = Buffer.from('chunk data before rotation');
    const oldMaster = getMasterKey();
    const newMaster = crypto.randomBytes(32);

    const { dataKey, encryptionInfo } = buildEncryptionInfo();
    const encryptedChunk = encryptChunk(plaintext, dataKey);

    // Re-wrap with new master key
    const rotatedInfo = rewrapFileKey(encryptionInfo, oldMaster, newMaster);
    expect(rotatedInfo.wrappedKey).not.toBe(encryptionInfo.wrappedKey);

    // Unwrap using new master key yields original dataKey
    const unwrappedDataKey = unwrapFileKey(rotatedInfo, newMaster);
    expect(unwrappedDataKey.equals(dataKey)).toBe(true);

    // The existing encryptedChunk is still decrypted by the unwrapped data key
    expect(decryptChunk(encryptedChunk, unwrappedDataKey)).toEqual(plaintext);
  });
});
