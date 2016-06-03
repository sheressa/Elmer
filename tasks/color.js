var moment = require('moment');
var WhenIWork = require('wheniwork-unofficial');
var api = new WhenIWork(global.KEYS.wheniwork.api_key, global.KEYS.wheniwork.username, global.KEYS.wheniwork.password);
var colorize = require('../lib/ColorizeShift').go;

module.exports.go = function () {
  var filter = {
    start: '-1 day',
    end:   '+2 weeks',
    include_allopen: true,
    locationId: [global.config.locationID.regular_shifts, global.config.locationID.makeup_and_extra_shifts]
  };

  api.get('shifts', filter, function (results) {
    var openShifts = results.shifts.filter(function (e) {
	    return e.is_open;
    });

    var update
      , batchRequest = []
      ;

    openShifts.forEach(function (e, i, arr) {
      update = colorize({}, e.start_time, (e.location_id === global.config.locationID.makeup_and_extra_shifts));
      var shiftDeleteRequest = {
        "method": "PUT",
        "url": "/2/shifts/" + e.id,
        "params": update,
      };
      batchRequest.push(shiftDeleteRequest);
    });

    api.post('batch', batchRequest, function(response) {
      CONSOLE_WITH_TIME(response);
    })

  });
};
