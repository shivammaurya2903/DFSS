const config = require('../config');

/**
 * WorkloadProfileManager
 * 
 * Manages workload profiles for research experiments.
 * Profiles define the characteristics of synthetic workloads used in experiments.
 */
const WorkloadProfileManager = {
  /**
   * Get all available workload profiles.
   * @returns {Object} - Map of profileId -> profile config
   */
  getProfiles() {
    return config.workloadProfiles;
  },

  /**
   * Get a specific workload profile by ID.
   * @param {string} profileId - Profile ID (W1, W2, W3, W4, W5)
   * @returns {Object|null} - Profile config or null if not found
   */
  getProfile(profileId) {
    return config.workloadProfiles[profileId] || null;
  },

  /**
   * Get the default workload profile.
   * @returns {Object} - Default profile (W3 - Mixed)
   */
  getDefaultProfile() {
    return config.workloadProfiles.W3;
  },

  /**
   * Validate a workload profile configuration.
   * @param {Object} profile - Profile to validate
   * @returns {Object} - { valid: boolean, errors: string[] }
   */
  validateProfile(profile) {
    const errors = [];
    if (!profile) {
      errors.push('Profile is required');
      return { valid: false, errors };
    }
    if (typeof profile.writeRatio !== 'number' || profile.writeRatio < 0 || profile.writeRatio > 1) {
      errors.push('writeRatio must be a number between 0 and 1');
    }
    if (typeof profile.readRatio !== 'number' || profile.readRatio < 0 || profile.readRatio > 1) {
      errors.push('readRatio must be a number between 0 and 1');
    }
    if (Math.abs(profile.writeRatio + profile.readRatio - 1.0) > 0.01) {
      errors.push('writeRatio + readRatio must equal 1.0');
    }
    if (!['small', 'mixed', 'large'].includes(profile.fileSizeDistribution)) {
      errors.push('fileSizeDistribution must be one of: small, mixed, large');
    }
    if (typeof profile.concurrency !== 'number' || profile.concurrency < 1) {
      errors.push('concurrency must be a positive integer');
    }
    return { valid: errors.length === 0, errors };
  },

  /**
   * Generate a synthetic workload based on a profile.
   * Used for research experiment orchestration.
   * @param {string} profileId - Profile ID
   * @param {Object} options - Override options
   * @returns {Object} - Workload configuration
   */
  generateWorkload(profileId, options = {}) {
    const profile = this.getProfile(profileId);
    if (!profile) {
      throw new Error(`Unknown workload profile: ${profileId}`);
    }
    return {
      ...profile,
      ...options,
      profileId,
    };
  },
};

module.exports = WorkloadProfileManager;