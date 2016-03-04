var moment = require('moment');
var WhenIWork = require('wheniwork-unofficial');
var api = new WhenIWork(global.config.wheniwork.api_key, global.config.wheniwork.username, global.config.wheniwork.password);
var colorize = require('../lib/ColorizeShift');

module.exports.go = function () {
  var filter = {
    start: '-2 weeks',
    end:   '+2 weeks',
    include_allopen: true,
    locationId: global.config.locationID.regular_shifts
  };

  api.get('shifts', filter, function (results) {
    var openShifts = results.shifts.filter(function (e) {
	    return e.is_open;
    });

    var update;
    openShifts.forEach(function (e, i, arr) {
      update = colorize({}, e.start_time);
      api.update('shifts/'+e.id, update);
    });
  });
};
