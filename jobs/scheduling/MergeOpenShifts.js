var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var returnColorizedShift = require('../../lib/ColorizeShift').go;

var wiw_date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';

<<<<<<< HEAD
new CronJob(global.CONFIG.time_interval.open_shifts, function () {
=======
new CronJob(config.time_interval.open_shifts, function () {
>>>>>>> master
    mergeOpenShifts();
}, null, true);

mergeOpenShifts();

function mergeOpenShifts() {
  var query = {
    include_allopen: true,
    start: '-1 day',
<<<<<<< HEAD
    end: '+7 days',
    location_id: [ global.CONFIG.locationID.regular_shifts, global.CONFIG.locationID.makeup_and_extra_shifts ]
=======
    end: '+' + config.time_interval.days_of_open_shift_display + ' days',
    location_id: [ config.locationID.regular_shifts, config.locationID.makeup_and_extra_shifts ]
>>>>>>> master
  };

  WhenIWork.get('shifts', query, function (data) {
    var openRegShifts = {};
    var openMakShifts = {};
    var shift;
    var batchPayload = [];

    for (var i in data.shifts) {
      shift = data.shifts[i];
<<<<<<< HEAD
      if (shift.is_open && shift.location_id == global.CONFIG.locationID.regular_shifts) {
=======
      if (shift.is_open && shift.location_id == config.locationID.regular_shifts) {
>>>>>>> master
        if (typeof openRegShifts[shift.start_time] == 'undefined') {
          openRegShifts[shift.start_time] = [];
        }
        openRegShifts[shift.start_time].push(shift);
      }
<<<<<<< HEAD
      else if (shift.is_open && shift.location_id == global.CONFIG.locationID.makeup_and_extra_shifts) {
=======
      else if (shift.is_open && shift.location_id == config.locationID.makeup_and_extra_shifts) {
>>>>>>> master
        if (typeof openMakShifts[shift.start_time] == 'undefined') {
          openMakShifts[shift.start_time] = [];
        }
        openMakShifts[shift.start_time].push(shift);
      }
    }

    for (var key in openRegShifts) {
      batchPayload = makeBatchPayloadRequestsToMergeOpenShifts(openRegShifts[key], batchPayload);
    }

    for (var key in openMakShifts) {
      batchPayload = makeBatchPayloadRequestsToMergeOpenShifts(openMakShifts[key], batchPayload);
    }

    WhenIWork.post('batch', batchPayload, function(response) {
      CONSOLE_WITH_TIME('Response from merge shift batch payload request: ', batchPayload);
    });
  });
}

function makeBatchPayloadRequestsToMergeOpenShifts(arrayOfShiftsForSameTimeInt, batchPayload) {
  if (arrayOfShiftsForSameTimeInt && arrayOfShiftsForSameTimeInt.length > 1) {
    var max = -1;
    var instances = 0;
    var remainingShiftUpdated = false;

    for (var j in arrayOfShiftsForSameTimeInt) {
      if (arrayOfShiftsForSameTimeInt[j].instances === undefined || arrayOfShiftsForSameTimeInt[j].instances === 0) {
        instances += 1;
      } else {
        instances += arrayOfShiftsForSameTimeInt[j].instances;

        if (arrayOfShiftsForSameTimeInt[j].instances > max) {
          max = arrayOfShiftsForSameTimeInt[j].instances;
        }
      }
    }

    for (var j in arrayOfShiftsForSameTimeInt) {
      if (arrayOfShiftsForSameTimeInt[j].instances !== undefined && arrayOfShiftsForSameTimeInt[j].instances == max && !remainingShiftUpdated) {
        var update = {instances: instances};
<<<<<<< HEAD
        var isMakeupShift = arrayOfShiftsForSameTimeInt[j].location_id === global.CONFIG.locationID.makeup_and_extra_shifts;
=======
        var isMakeupShift = arrayOfShiftsForSameTimeInt[j].location_id === config.locationID.makeup_and_extra_shifts;
>>>>>>> master
        update = returnColorizedShift(update, arrayOfShiftsForSameTimeInt[j].start_time, isMakeupShift);


        var shiftUpdateRequest = {
          'method': 'PUT',
          'url': '/2/shifts/' + arrayOfShiftsForSameTimeInt[j].id,
          'params': update
        };

        batchPayload.push(shiftUpdateRequest);
        remainingShiftUpdated = true;
      } else {
        var shiftDeleteRequest = {
          'method': 'delete',
          'url': '/2/shifts/' + arrayOfShiftsForSameTimeInt[j].id,
          'params': {}
        };
        batchPayload.push(shiftDeleteRequest);
      }
    }
  }
  return batchPayload;
}

module.exports = mergeOpenShifts;
