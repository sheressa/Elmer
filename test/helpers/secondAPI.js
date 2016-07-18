'use strict';

const WhenIWork = require('./base.js');

const createDynamicApi = function(WiWApiKey, email, WiWPassword, companyName, failureCallback) {
	var W = WhenIWork.constructor
  return new W(WiWApiKey, email, WiWPassword, companyName, failureCallback);
};

module.exports = createDynamicApi;
