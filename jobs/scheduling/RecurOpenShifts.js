var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var moment = require('moment-timezone');
var colorizeShift = require('../../lib/ColorizeShift').go;

var WIWDateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
var shiftQueryDateFormat = 'YYYY-MM-DD HH:mm:ss';

var cronJob = new CronJob(global.config.time_interval.open_shifts, function () {
  runJob();
}, null, true);

function runJob() {
  var now = moment().minute(0).second(0);
  recurOpenShifts(now);
}

// run it once on boot
runJob();

function recurOpenShifts(now) {
  if (now.hours() % 2 == 1) {
    consoleWithTime('running at an odd hour. abort.');
    return;
  }
  // Each time this cron runs, we run this function over the previous four shift times for failsafe redundancy.
  for (var i = 0; i < 5; i++) {
    // Because we're making async calls in a loop, we pass targetTime through callback
    // so that it's defined locally for each scope.
    var targetTime = now.clone().add(i * -2, 'hours');
    findExtraOpenShiftsToDeleteAndOccupiedShiftCount(targetTime, function(extraOpenShiftsToDelete, correctNumberOfShiftsToSet, targetTime) {
      var batchPayload = [];

      // If we don't need to add any new open shifts, we return.
      if (correctNumberOfShiftsToSet === 0) {
        consoleWithTime('No open shifts need to be added for time: ', targetTime.toString());
        return;
      }
      // If we need to add open shifts
      else if (correctNumberOfShiftsToSet > 0) {
        var newOpenShiftParams = {
          start_time: targetTime.clone().minute(0).second(0).add(1, 'week').format(WIWDateFormat),
          end_time: targetTime.clone().minute(0).second(0).add(2, 'hour').add(1, 'week').format(WIWDateFormat),
          location_id: global.config.locationID.regular_shifts,
          instances: correctNumberOfShiftsToSet,
          published: true
        };
        newOpenShiftParams = colorizeShift(newOpenShiftParams);

        var newOpenShiftRequest = {
          method: "post",
          url: "/2/shifts",
          params: newOpenShiftParams
        };
        batchPayload.push(newOpenShiftRequest);
      }
      /**
        Batch delete the invalid open shifts in two cases: 1) correctNumberOfShiftsToSet > 0; we need to add open shifts
        and 2) correctNumberOfShiftsToSet < 0; the number of occupied shifts is currently greater than the total number
        of open shifts for that block. In BOTH cases, we need to delete all old open shifts.
      **/

      extraOpenShiftsToDelete.forEach(function(shiftID) {
        var shiftDeleteRequest = {
            method: "delete",
            url: "/2/shifts/" + shiftID,
            params: {}
        };
        batchPayload.push(shiftDeleteRequest);
      });

      if (correctNumberOfShiftsToSet < 0) { correctNumberOfShiftsToSet = 'no'; }
      consoleWithTime('Adding ', correctNumberOfShiftsToSet, ' open shifts to the time: ', targetTime.toString(), '. Deleting incorrect count of open shifts--their shift IDs: ', extraOpenShiftsToDelete);
      WhenIWork.post('batch', batchPayload);
    })
  }
}
/**
  Checks if open shifts are already present a week from the targetTime
  Callback params: callback(extraOpenShiftsToDelete, correctNumberOfShiftsToSet, targetTimeMomentObj);
**/
function findExtraOpenShiftsToDeleteAndOccupiedShiftCount(targetTimeMomentObj, callback) {
  var extraOpenShiftsToDelete = []
    , countOfOccupiedShifts = 0
    , countOfOpenShifts = 0
    , targetTimeMomentObj = targetTimeMomentObj
    , shift
    ;
  /*
    Querying for shifts starting at 8pm produces weird, buggy behavior from the WIW API.
    Guess: 8pm is the dividing line between GMT days. So if we query for shifts starting a
    minute before 8pm, this strangely yields shifts starting at 10pm. Hence, our `start` time
    is precisely on the hour.
  */
  var filter = {
    start: targetTimeMomentObj.clone().add(1, 'week').format(shiftQueryDateFormat),
    end: targetTimeMomentObj.clone().add(1, 'minute').add(1, 'week').format(shiftQueryDateFormat),
    include_allopen: true,
    location_id: global.config.locationID.regular_shifts
  };

  WhenIWork.get('shifts', filter, function(data) {
    for (var i = 0; i < data.shifts.length; i++) {
      shift = data.shifts[i];
      if (JSON.parse(shift.is_open)) {
        if (!shift.instances) {
          countOfOpenShifts++;
        }
        else {
          countOfOpenShifts += JSON.parse(shift.instances);
        }
        extraOpenShiftsToDelete.push(shift.id);
      }
      else {
        countOfOccupiedShifts++;
      }
    }

    var correctNumberOfShiftsToSet = returnMaxOpenShiftCountForTime(targetTimeMomentObj.clone()) - countOfOccupiedShifts;
    consoleWithTime('Found ', countOfOpenShifts, ' open shifts, ', countOfOccupiedShifts, ' occupied shifts found for a time where we expect ', returnMaxOpenShiftCountForTime(targetTimeMomentObj.clone()), ' open shifts. Time: ', targetTimeMomentObj.toString());
    callback(extraOpenShiftsToDelete, correctNumberOfShiftsToSet, targetTimeMomentObj);
    return;
  });
}

function returnMaxOpenShiftCountForTime(targetTimeMomentObj) {
  var dayStr = targetTimeMomentObj.format('ddd'); // a string like "Thu"
  var hourStr = targetTimeMomentObj.format('ha'); // a string like "4pm"
  return global.config.numberOfCounselorsPerShift[dayStr][hourStr];
}

// Exporting modularized functions for testability
module.exports = {
  recurOpenShifts: recurOpenShifts,
  returnMaxOpenShiftCountForTime: returnMaxOpenShiftCountForTime,
  findExtraOpenShiftsToDeleteAndOccupiedShiftCount: findExtraOpenShiftsToDeleteAndOccupiedShiftCount,
  cronJob: cronJob
};
