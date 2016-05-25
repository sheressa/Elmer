var helpers = require('../helpers.js');
global.config = require('../../../config.js');

function timezone(req) {

	if (!helpers.validate(req.query.email, req.query.token)) {
	  return 403;
	}

	var timezones = {
	  9: 'Eastern',
	  11: 'Central',
	  13: 'Mountain',
	  170: 'Arizona',
	  15: 'Pacific',
	  19: 'Hawaii',
	  167: 'Alaska'
	};

	var url = '/scheduling/login';

  return timezones;
}

module.exports = timezone;