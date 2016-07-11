'use strict';

const CronJob = require('cron').CronJob;
const WhenIWork = CONFIG.WhenIWork;
const returnColorizedShift = require('../../lib/ColorizeShift').go;

new CronJob(CONFIG.time_interval.open_shifts, function () {
    mergeOpenShifts();
}, null, true);

mergeOpenShifts();

function mergeOpenShifts() {
  var query = {
    include_allopen: true,
    start: '-1 day',
    end: '+' + CONFIG.time_interval.days_of_open_shift_display + ' days',
    location_id: [ CONFIG.locationID.regular_shifts, CONFIG.locationID.makeup_and_extra_shifts ]
  };

  WhenIWork.get('shifts?include_objects=false', query, function (data) {
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
    if (shift.is_open && shift.location_id == CONFIG.locationID.regular_shifts) {
      if (typeof openRegShifts[shift.start_time] == 'undefined') {
        openRegShifts[shift.start_time] = [];
      }
      openRegShifts[shift.start_time].push(shift);
    }
    else if (shift.is_open && shift.location_id == CONFIG.locationID.makeup_and_extra_shifts) {
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
      //The response at this point doesn't include error status codes so we're looking for a message that indicates an error
      if (response && response.message && /error/.test(response.message)) CONSOLE_WITH_TIME("[ERROR 61] in Job MergeOpenShifts Batch Response: ", response);
      else (CONSOLE_WITH_TIME("Job MergeOpenShifts Batch Post Success"));
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
        var isMakeupShift = arrayOfShiftsForSameTimeInt[j].location_id === CONFIG.locationID.makeup_and_extra_shifts;
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
