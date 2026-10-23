const mongoose = require('mongoose');
const ShareToken = require('../src/models/ShareToken');

function makeShare(overrides = {}) {
  const share = new ShareToken({
    fileId: new mongoose.Types.ObjectId(),
    ownerId: new mongoose.Types.ObjectId(),
    tokenHash: 'placeholder',
    ...overrides,
  });
  return share;
}

describe('ShareToken stable link derivation', () => {
  test('derives the same token for the same share id', () => {
    const share = makeShare();
    const tokenA = ShareToken.deriveToken(share._id);
    const tokenB = ShareToken.deriveToken(String(share._id));
    expect(tokenA).toBe(tokenB);
    expect(tokenA).not.toContain('placeholder');
  });

  test('recovers the token only when the stored hash matches the derivation', () => {
    const share = makeShare();
    const token = ShareToken.deriveToken(share._id);
    share.tokenHash = ShareToken.hashToken(token);

    expect(ShareToken.getTokenForShare(share)).toBe(token);

    share.tokenHash = ShareToken.hashToken('legacy-random-token');
    expect(ShareToken.getTokenForShare(share)).toBeNull();
  });

  test('validity respects revocation and expiry, including never-expiring links', () => {
    const share = makeShare({ expiresAt: null });
    expect(share.isValid()).toBe(true);

    share.expiresAt = new Date(Date.now() + 60_000);
    expect(share.isValid()).toBe(true);

    share.expiresAt = new Date(Date.now() - 60_000);
    expect(share.isValid()).toBe(false);

    share.expiresAt = null;
    share.revokedAt = new Date();
    expect(share.isValid()).toBe(false);
  });
});
