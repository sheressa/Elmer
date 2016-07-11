'use strict';

const WhenIWork = require('wheniwork-unofficial');

const createDynamicApi = function(WiWApiKey, email, WiWPassword, companyName, failureCallback) {
  return new WhenIWork(WiWApiKey, email, WiWPassword, companyName, failureCallback);
};

module.exports = createDynamicApi;
