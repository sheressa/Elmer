'use strict';

const api = CONFIG.WhenIWork;

module.exports.go = function() {
	for (var i = 0; i < 365; i+=7) {
		var postData = {
			"include_open": true,
			"location_id": CONFIG.locationID.regular_shifts,
			"start": '+' + i + ' days',
			"end": '+' + (i+7) + ' days',
			"unpublished": true,
			"include_objects": false
		};
		var batchRequest = [];
		api.get('shifts', postData, function(response) {
			response.shifts.forEach(function(shift) {
				if (shift.is_open && !shift.published) {
					var shiftDeleteRequest = {
						"method": "delete",
						"url": "/shifts/" + shift.id,
						"params": {},
					};
					batchRequest.push(shiftDeleteRequest);
				}
			});

			api.post('batch', batchRequest, function(response) {
				//The response at this point doesn't include error status codes so we're looking for a message that indicates an error
				if (response && response.message && /error/.test(response.message)) CONSOLE_WITH_TIME("Error in Task deleteOpenUnpubShifts Batch Response: ", response);
				else (CONSOLE_WITH_TIME("Task deleteOpenUnpubShifts Batch Post Success"));
			});
		});
	}
};
