var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var moment = require('moment');

var WIWDateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
var shiftQueryDateFormat = 'YYYY-MM-DD HH:mm:ss';

new CronJob(global.config.time_interval.open_shifts, function () {
    var now = moment().minute(0).second(0);
    recurOpenShifts(now);
}, null, false);

function recurOpenShifts(now) {
    // Each time this cron runs, we run this function over the previous four shift times for failsafe redundancy.
    for (var i = 0; i < 5; i++) {
        var targetTime = now.clone().add(i * -2, 'hours');
        getCountOfOccupiedShiftsForTime(targetTime, function(occupiedShiftCount, targetTime) {
            // Because we're making async calls in a loop, we pass targetTime through callbacks
            // so that it's defined locally for each scope.
            var numberOfOpenShiftsToAdd = returnMaxOpenShiftCountForTime(targetTime) - occupiedShiftCount;
            if (numberOfOpenShiftsToAdd <= 0) {
                return;
            }
            // @TODO: refactor, so that this check is the first API call we do--will cut down on calls.
            checkIfOpenShiftsHaveAlreadyBeenAdded(targetTime, function(shiftsHaveBeenAdded, targetTime) {
                if (!shiftsHaveBeenAdded) {
                    addOpenShifts(numberOfOpenShiftsToAdd, targetTime);
                }
            });
        });
    }
}

function getCountOfOccupiedShiftsForTime(targetTimeMomentObj, callback) {
    // We're determining the open shift count twelve weeks out, further out than
    // how far counselors can see their shifts. This will make it less likely that
    // time taken off (and a shift removed from the normal schedule) will artificially
    // increase the number of open shifts we add.
    var filter = {
        start: targetTimeMomentObj.clone().add(12, 'weeks').format(shiftQueryDateFormat),
        end: targetTimeMomentObj.clone().add(12, 'weeks').add(1, 'minute').format(shiftQueryDateFormat),
        include_allopen: true,
        location_id: global.config.locationID.regular_shifts
    };

    WhenIWork.get('shifts', filter, function(response) {
        var allShifts = response.shifts
          , occupiedShiftCount = 0
          , shift
          ;
        for (var i = 0; i < allShifts.length; i++) {
            shift = allShifts[i];
            if (!JSON.parse(shift.is_open)) {
                occupiedShiftCount++;
            }
        }
        callback(occupiedShiftCount, targetTimeMomentObj);
        return;
    })
}

function returnMaxOpenShiftCountForTime(targetTimeMomentObj) {
    var dayStr = targetTimeMomentObj.format('ddd'); // a string like "Thu"
    var hourStr = targetTimeMomentObj.format('ha'); // a string like "4pm"
    return global.config.crisisCounselorsPerSupervisor * global.config.numberOfSupervisorsPerShift[dayStr][hourStr];
}

// Checks if open shifts are already present a week from the targetTime
function checkIfOpenShiftsHaveAlreadyBeenAdded(targetTimeMomentObj, callback) {
    // Querying for shifts starting at 8pm produces weird, buggy behavior from the WIW API.
    // Guess: 8pm is the dividing line between GMT days. So if we query for shifts starting a
    // minute before 8pm, this strangely yields shifts starting at 10pm. Hence, our `start` time
    // is precisely on the hour.
    var filter = {
        start: targetTimeMomentObj.clone().add(1, 'week').format(shiftQueryDateFormat),
        end: targetTimeMomentObj.clone().add(1, 'minute').add(1, 'week').format(shiftQueryDateFormat),
        include_allopen: true,
        location_id: global.config.locationID.regular_shifts
    };
    WhenIWork.get('shifts', filter, function(data) {
        for (var i = 0; i < data.shifts.length; i++) {
            // If the shift is open, and begins at the same hour as when we're running this job.
            if (JSON.parse(data.shifts[i].is_open)) {
                callback(true, targetTimeMomentObj);
                return;
            }
        }
        callback(false, targetTimeMomentObj);
        return;
    });
}

// Adds a specified number of shifts at exactly a week ahead of the targetTimeMomentObj
function addOpenShifts(numberOfOpenShiftsToAdd, targetTimeMomentObj) {
    var newShiftParams = {
        start_time: targetTimeMomentObj.clone().minute(0).second(0).add(1, 'week').format(WIWDateFormat),
        end_time: targetTimeMomentObj.clone().minute(0).second(0).add(2, 'hour').add(1, 'week').format(WIWDateFormat),
        location_id: global.config.locationID.regular_shifts,
        instances: numberOfOpenShiftsToAdd,
        published: true
    };
    WhenIWork.create('shifts/', newShiftParams);
}

// Exporting modularized functions for testability
module.exports = {
    recurOpenShifts: recurOpenShifts,
    getCountOfOccupiedShiftsForTime: getCountOfOccupiedShiftsForTime,
    returnMaxOpenShiftCountForTime: returnMaxOpenShiftCountForTime,
    checkIfOpenShiftsHaveAlreadyBeenAdded: checkIfOpenShiftsHaveAlreadyBeenAdded,
    addOpenShifts: addOpenShifts
};
