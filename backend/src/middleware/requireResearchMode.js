const config = require('../config');

function requireResearchMode(req, res, next) {
  if (!config.researchMode) {
    return res.status(403).json({
      success: false,
      code: 'RESEARCH_MODE_DISABLED',
      message: 'Research endpoints are disabled (RESEARCH_MODE=false)',
    });
  }
  next();
}

module.exports = requireResearchMode;
