const config = require('../config');

/**
 * Middleware to validate internal API calls from storage nodes.
 * Uses a shared secret (INTERNAL_API_SECRET) passed via x-internal-token header.
 * This prevents unauthorized parties from registering fake storage nodes
 * or spoofing heartbeats.
 */
const validateInternalToken = (req, res, next) => {
  const token = req.headers['x-internal-token'];

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'INTERNAL_AUTH_REQUIRED',
      message: 'Internal API token required',
    });
  }

  if (token !== config.internalApiSecret) {
    return res.status(403).json({
      success: false,
      code: 'INTERNAL_AUTH_INVALID',
      message: 'Invalid internal API token',
    });
  }

  next();
};

module.exports = validateInternalToken;
