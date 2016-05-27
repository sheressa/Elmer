var WhenIWork = require('wheniwork-unofficial');
var api = new WhenIWork(global.config.wheniwork.api_key, global.config.wheniwork.username, global.config.wheniwork.password);

module.exports.go = function() {
	for (var i = 0; i < 365; i+=7) {
		var postData = {
			"include_open": true,
			"location_id": global.config.locationID.regular_shifts,
			"start": '+' + i + ' days',
			"end": '+' + (i+7) + ' days',
			"unpublished": true
		};
		var batchRequest = [];
		api.get('shifts', postData, function(response) {
			response.shifts.forEach(function(shift) {
				if (shift.is_open && !shift.published) {
					var shiftDeleteRequest = {
						"method": "delete",
						"url": "/2/shifts/" + shift.id,
						"params": {},
					};
					batchRequest.push(shiftDeleteRequest);
				}
			})

			api.post('batch', batchRequest, function(response) {
				consoleWithTime(response);
			})
		})
	}
}
