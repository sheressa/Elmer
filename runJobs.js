global.config = require('./config');
require('newrelic');

if (process.env.NODE_ENV !== 'production') {
	global.config.locationID.regular_shifts = global.config.locationID.test;
  global.config.locationID.makeup_and_extra_shifts = global.config.locationID.test2;
}

var jobs = require('require-all')(__dirname + '/jobs');
