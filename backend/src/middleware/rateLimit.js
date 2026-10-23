const buckets = new Map();

function cleanup(now) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Minimal in-memory fixed-window limiter. This protects a single backend
 * process; multi-instance deployments should use a shared store.
 */
function rateLimit({ windowMs, max, keyPrefix = 'rl', message = 'Too many requests' }) {
  return (req, res, next) => {
    const now = Date.now();
    if (buckets.size > 5000) cleanup(now);

    const identity = req.user?.id || req.body?.email?.toLowerCase() || req.ip || 'unknown';
    const key = `${keyPrefix}:${identity}`;
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message,
        retryAfter,
      });
    }

    next();
  };
}

rateLimit.reset = () => buckets.clear();

module.exports = rateLimit;
