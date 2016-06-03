var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var moment = require('moment-timezone');
var colorizeShift = require('../../lib/ColorizeShift').go;

var WIWDateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
var shiftQueryDateFormat = 'YYYY-MM-DD HH:mm:ss';

var cronJob = new CronJob(global.CONFIG.time_interval.open_shifts, function () {
  runJob();
}, null, true);

function runJob() {
  var now = moment().minute(0).second(0);
  recurOpenShifts(now);
}

// run it once on boot
runJob();

// Recurs open shifts one and two weeks in the future.
function recurOpenShifts(now) {
  if (now.hours() % 2 == 1) {
    CONSOLE_WITH_TIME('running at an odd hour. abort.');
    return;
  }
  // Each time this cron runs, we run this function over the previous four shift times for failsafe redundancy.
  for (var i = 0; i < 5; i++) {
    // Because we're making async calls in a loop, we pass targetTime through callback
    // so that it's defined locally for each scope.
    var targetTime = now.clone().add(i * -2, 'hours');
<<<<<<< HEAD
    findExtraOpenShiftsToDeleteAndOccupiedShiftCount(targetTime, function(extraOpenShiftsToDelete, correctNumberOfShiftsToSet, targetTime) {
      var batchPayload = [];

      // If we don't need to add any new open shifts, we return.
      if (correctNumberOfShiftsToSet === 0) {
        CONSOLE_WITH_TIME('No open shifts need to be added for time: ', targetTime.toString());
        return;
      }
      // If we need to add open shifts
      else if (correctNumberOfShiftsToSet > 0) {
        var newOpenShiftParams = {
          start_time: targetTime.clone().minute(0).second(0).add(1, 'week').format(WIWDateFormat),
          end_time: targetTime.clone().minute(0).second(0).add(2, 'hour').add(1, 'week').format(WIWDateFormat),
          location_id: global.CONFIG.locationID.regular_shifts,
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
      CONSOLE_WITH_TIME('Adding ', correctNumberOfShiftsToSet, ' open shifts to the time: ', targetTime.toString(), '. Deleting incorrect count of open shifts--their shift IDs: ', extraOpenShiftsToDelete);
      WhenIWork.post('batch', batchPayload);
    })
=======
    findExtraOpenShiftsToDeleteAndOccupiedShiftCount(targetTime, 1, incrementFutureOpenShiftsUpOrDown);
    findExtraOpenShiftsToDeleteAndOccupiedShiftCount(targetTime, 2, incrementFutureOpenShiftsUpOrDown);
>>>>>>> master
  }
}

/**
  Checks if open shifts are already present weeksFromNowToCheck number of weeks from the targetTime
  Callback params: callback(extraOpenShiftsToDelete, correctNumberOfShiftsToSet, targetTimeMomentObj);
**/
function findExtraOpenShiftsToDeleteAndOccupiedShiftCount(targetTimeMomentObj, weeksFromNowToCheck, callback) {
  var extraOpenShiftsToDelete = [];
  var countOfOccupiedShifts = 0;
  var countOfOpenShifts = 0;
  var shift;

  targetTimeMomentObj = targetTimeMomentObj;
  /*
    Querying for shifts starting at 8pm produces weird, buggy behavior from the WIW API.
    Guess: 8pm is the dividing line between GMT days. So if we query for shifts starting a
    minute before 8pm, this strangely yields shifts starting at 10pm. Hence, our `start` time
    is precisely on the hour.
  */
  var filter = {
    start: targetTimeMomentObj.clone().add(weeksFromNowToCheck, 'week').format(shiftQueryDateFormat),
    end: targetTimeMomentObj.clone().add(1, 'minute').add(weeksFromNowToCheck, 'week').format(shiftQueryDateFormat),
    include_allopen: true,
    location_id: global.CONFIG.locationID.regular_shifts
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
    CONSOLE_WITH_TIME('Found ', countOfOpenShifts, ' open shifts, ', countOfOccupiedShifts, ' occupied shifts found for a time ', weeksFromNowToCheck, 'weeks from now where we expect ', returnMaxOpenShiftCountForTime(targetTimeMomentObj.clone()), ' open shifts. Time: ', targetTimeMomentObj.toString());
    callback(extraOpenShiftsToDelete, correctNumberOfShiftsToSet, weeksFromNowToCheck, targetTimeMomentObj);
    return;
  });
}

/**
  Based on the shift information passed to this function by findExtraOpenShiftsToDeleteAndOccupiedShiftCount,
  this function adds open shifts or delete open shifts to match the proper number.
**/
function incrementFutureOpenShiftsUpOrDown(extraOpenShiftsToDelete, correctNumberOfShiftsToSet, weeksFromNowToCheck, targetTime) {
  var batchPayload = [];

  // If we don't need to add any new open shifts, we return.
  if (correctNumberOfShiftsToSet === 0) {
    CONSOLE_WITH_TIME('No open shifts need to be added for time: ', targetTime.toString());
    return;
  }
  // If we need to add open shifts
  else if (correctNumberOfShiftsToSet > 0) {
    var newOpenShiftParams = {
      start_time: targetTime.clone().minute(0).second(0).add(weeksFromNowToCheck, 'weeks').format(WIWDateFormat),
      end_time: targetTime.clone().minute(0).second(0).add(2, 'hour').add(weeksFromNowToCheck, 'weeks').format(WIWDateFormat),
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
  CONSOLE_WITH_TIME('Adding ', correctNumberOfShiftsToSet, ' open shifts to the time: ', targetTime.toString(), ' . Deleting incorrect count of open shifts--their shift IDs: ', extraOpenShiftsToDelete);
  WhenIWork.post('batch', batchPayload);
}

function returnMaxOpenShiftCountForTime(targetTimeMomentObj) {
  var dayStr = targetTimeMomentObj.format('ddd'); // a string like "Thu"
  var hourStr = targetTimeMomentObj.format('ha'); // a string like "4pm"
  return global.CONFIG.numberOfCounselorsPerShift[dayStr][hourStr];
}

// Exporting modularized functions for testability
module.exports = {
  recurOpenShifts: recurOpenShifts,
  returnMaxOpenShiftCountForTime: returnMaxOpenShiftCountForTime,
  findExtraOpenShiftsToDeleteAndOccupiedShiftCount: findExtraOpenShiftsToDeleteAndOccupiedShiftCount,
  incrementFutureOpenShiftsUpOrDown: incrementFutureOpenShiftsUpOrDown,
  cronJob: cronJob
};
