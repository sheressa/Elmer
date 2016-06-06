var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var returnColorizedShift = require('../../lib/ColorizeShift').go;

var wiw_date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';

new CronJob(config.time_interval.open_shifts, function () {
    mergeOpenShifts();
}, null, true);

mergeOpenShifts();

function mergeOpenShifts() {
  var query = {
    include_allopen: true,
    start: '-1 day',
    end: '+' + config.time_interval.days_of_open_shift_display + ' days',
    location_id: [ config.locationID.regular_shifts, config.locationID.makeup_and_extra_shifts ]
  };

  WhenIWork.get('shifts', query, function (data) {
    processDataAndMakeMergeAPICalls(data);
  });
}

function processDataAndMakeMergeAPICalls(data) {
  var openRegShifts = {};
  var openMakShifts = {};
  var shift;
  var batchPayload = [];

  for (var i in data.shifts) {
    shift = data.shifts[i];
    if (shift.is_open && shift.location_id == config.locationID.regular_shifts) {
      if (typeof openRegShifts[shift.start_time] == 'undefined') {
        openRegShifts[shift.start_time] = [];
      }
      openRegShifts[shift.start_time].push(shift);
    }
    else if (shift.is_open && shift.location_id == config.locationID.makeup_and_extra_shifts) {
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
  if (process.env.NODE_ENV === 'test') {
    return batchPayload;
  }
  else {
    WhenIWork.post('batch', batchPayload, function(response) {
      CONSOLE_WITH_TIME('Response from merge shift batch payload request: ', batchPayload);
    });      
  }
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
        var isMakeupShift = arrayOfShiftsForSameTimeInt[j].location_id === config.locationID.makeup_and_extra_shifts;
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

module.exports = { 
  mergeOpenShifts: mergeOpenShifts, 
  processDataAndMakeMergeAPICalls: processDataAndMakeMergeAPICalls
};
