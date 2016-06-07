global.CONFIG = require('./config');
global.KEYS = require('./keys.js');
require('newrelic');

if (process.env.NODE_ENV !== 'production') {
	CONFIG.locationID.regular_shifts = CONFIG.locationID.test;
  CONFIG.locationID.makeup_and_extra_shifts = CONFIG.locationID.test2;
}

var jobs = require('require-all')(__dirname + '/jobs');