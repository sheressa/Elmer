var moment = require('moment');
var WhenIWork = require('wheniwork-unofficial');
var api = new WhenIWork(KEYS.wheniwork.api_key, KEYS.wheniwork.username, KEYS.wheniwork.password);
var colorize = require('../lib/ColorizeShift').go;

module.exports.go = function () {
  var filter = {
    start: '-1 day',
    end:   '+2 weeks',
    include_allopen: true,
    locationId: [CONFIG.locationID.regular_shifts, CONFIG.locationID.makeup_and_extra_shifts]
  };

  api.get('shifts', filter, function (results) {
    var openShifts = results.shifts.filter(function (e) {
	    return e.is_open;
    });

    var update
      , batchRequest = []
      ;

    openShifts.forEach(function (e, i, arr) {
      update = colorize({}, e.start_time, (e.location_id === CONFIG.locationID.makeup_and_extra_shifts));
      var shiftDeleteRequest = {
        "method": "PUT",
        "url": "/2/shifts/" + e.id,
        "params": update,
      };
      batchRequest.push(shiftDeleteRequest);
    });

    api.post('batch', batchRequest, function(response) {
      //The response at this point doesn't include error status codes so we're looking for a message that indicates an error
      if (response && response.message && /error/.test(response.message)) CONSOLE_WITH_TIME("Error in Task Color Batch Response: ", response);
      else (CONSOLE_WITH_TIME("Task Color Batch Post Success"));
    });

  });
};
