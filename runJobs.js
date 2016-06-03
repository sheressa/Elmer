global.CONFIG = require('./config');
global.KEYS = require('./keys.js');
require('newrelic');

if (process.env.NODE_ENV !== 'production') {
	global.CONFIG.locationID.regular_shifts = global.CONFIG.locationID.test;
  global.CONFIG.locationID.makeup_and_extra_shifts = global.CONFIG.locationID.test2;
}

var jobs = require('require-all')(__dirname + '/jobs');