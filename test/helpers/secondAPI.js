'use strict';

const WhenIWork = require('./base.js');

const createDynamicApi = function(WiWApiKey, email, WiWPassword, companyName, failureCallback) {
	var WhenIWorkConst = WhenIWork.constructor;
  return new WhenIWorkConst(WiWApiKey, email, WiWPassword, companyName, failureCallback);
};

module.exports = createDynamicApi;
