global.config = require('./config');
require('newrelic');

if (process.env.NODE_ENV !== 'production') {
	global.config.locationID.regular_shifts = global.config.locationID.test;
}

var jobs = require('require-all')(__dirname + '/jobs');
