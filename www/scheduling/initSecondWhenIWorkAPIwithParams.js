var WhenIWork = require.main.require('wheniwork-unofficial');

// Node will re-use a module once you import it once, so this API will not initialized twice.
var createSecondAPI = function(WiWApiKey, email, WiWPassword, failureCallback) {
  var api2;
  if (process.env.NODE_ENV === 'test') {
    api2 = require('../../test/helpers/base');
  } else {
    api2 = new WhenIWork(WiWApiKey, email, WiWPassword, failureCallback);
  }
  return api2;
};

module.exports = createSecondAPI;
