/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name: ['Elmer'],
  /**
   * Your New Relic license key.
   */
  license_key: global.config.new_relic_license_key,
  logging: {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level: 'trace'
  },
  // Enables the capture of request parameters with transaction traces and error traces.
  capture_params: true,

  // Collects error traces.
  error_collector: {
    enabled: true

  }
}
