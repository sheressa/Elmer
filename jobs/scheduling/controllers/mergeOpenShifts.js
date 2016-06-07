var CronJob = require('cron').CronJob;
var WhenIWork = require('../base');
var returnColorizedShift = require('../../../lib/ColorizeShift').go;
var sampleData = require('../../../test/sampleData.js')
var wiw_date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';

new CronJob(CONFIG.time_interval.open_shifts, function () {
    mergeOpenShifts();
}, null, true);

mergeOpenShifts();

function mergeOpenShifts(options) {
  var query = {
    include_allopen: true,
    start: '-1 day',
    end: '+7 days',
    location_id: [ CONFIG.locationID.regular_shifts, CONFIG.locationID.makeup_and_extra_shifts ]
  };

  if (options === 'regShifts') {
    var data = sampleData.shifts.shifts.slice(6, 8);
  } else {
    var data = sampleData.shifts.shifts.slice(8);
  }

  function processData (data) {
    var openRegShifts = {}
      , openMakShifts = {}
      , shift
      , batchPayload = []
      ;

    for (var i in data) {
      //instead of var i in data.shifts, it should be var i in data.shifts[0].shifts,
      //due to how we're exporting the data from sampleData.js
      shift = data[i];
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

    WhenIWork.post('batch', batchPayload, function(response) {
      console.log('Response from merge shift batch payload request: ', batchPayload);
    });

    return batchPayload;

  }

  return processData(data);

}

function makeBatchPayloadRequestsToMergeOpenShifts(arrayOfShiftsForSameTimeInt, batchPayload) {

  if (arrayOfShiftsForSameTimeInt && arrayOfShiftsForSameTimeInt.length > 1) {
    var max = -1
      , instances = 0
      , remainingShiftUpdated = false
      ;

    for (var j in arrayOfShiftsForSameTimeInt) {
      if (arrayOfShiftsForSameTimeInt[j].instances == undefined || arrayOfShiftsForSameTimeInt[j].instances == 0) {
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
        }

        batchPayload.push(shiftUpdateRequest);
        remainingShiftUpdated = true;
      } else {
        var shiftDeleteRequest = {
          'method': 'delete',
          'url': '/2/shifts/' + arrayOfShiftsForSameTimeInt[j].id,
          'params': {}
        }
        batchPayload.push(shiftDeleteRequest);
      }
    }
  }

  return batchPayload;
}

module.exports = {mergeOpenShifts: mergeOpenShifts, makeBatchPayloadRequestsToMergeOpenShifts: makeBatchPayloadRequestsToMergeOpenShifts};

