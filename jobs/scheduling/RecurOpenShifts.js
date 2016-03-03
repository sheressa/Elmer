var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var moment = require('moment');
var colorizeShift = require('../../lib/ColorizeShift');

var WIWDateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
var shiftQueryDateFormat = 'YYYY-MM-DD HH:mm:ss';

new CronJob(global.config.time_interval.open_shifts, function () {
    var now = moment().minute(0).second(0);
    recurOpenShifts(now);
}, null, false);

function recurOpenShifts(now) {
    // Each time this cron runs, we run this function over the previous four shift times for failsafe redundancy.
    for (var i = 0; i < 5; i++) {
        // Because we're making async calls in a loop, we pass targetTime through callback
        // so that it's defined locally for each scope.
        var targetTime = now.clone().add(i * -2, 'hours');
        findIfOpenShiftsNeedToBeAddedAndOpenShiftIDsAndOccupiedShiftCount(targetTime, function(openShiftsNeedToBeAddedBOOL, openShiftIDs, correctNumberOfOpenShiftsToAdd, targetTime) {
            if (!openShiftsNeedToBeAddedBOOL) {
                return;
            }
            // If the correct number of open shifts haven't been added
            else {
                var batchPayload = [];
                // Add the correct number of open shifts
                var newOpenShiftParams = {
                    start_time: targetTime.clone().minute(0).second(0).add(1, 'week').format(WIWDateFormat),
                    end_time: targetTime.clone().minute(0).second(0).add(2, 'hour').add(1, 'week').format(WIWDateFormat),
                    location_id: global.config.locationID.regular_shifts,
                    instances: correctNumberOfOpenShiftsToAdd,
                    published: true
                };
                newOpenShiftParams = colorizeShift(newOpenShiftParams);

                var newOpenShiftRequest = {
                    method: "post",
                    url: "/2/shifts",
                    params: newOpenShiftParams
                };
                batchPayload.push(newOpenShiftRequest);

                openShiftIDs.forEach(function(shiftID) {
                    // Delete the invalid open shifts
                    var shiftDeleteRequest = {
                        method: "delete",
                        url: "/2/shifts/" + shift.id,
                        params: {}
                    };
                    batchPayload.push(shiftDeleteRequest);
                });

                WhenIWork.post('batch', batchPayload);
            }
        })
    }
}

// Checks if open shifts are already present a week from the targetTime
// Callback params: callback(openShiftsNeedToBeAddedBOOL, openShiftIDs, correctNumberOfOpenShiftsToAdd, targetTimeMomentObj);
function findIfOpenShiftsNeedToBeAddedAndOpenShiftIDsAndOccupiedShiftCount(targetTimeMomentObj, callback) {
    var openShiftIDs = []
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
                openShiftIDs.push(shift.id);
            }
            else {
                countOfOccupiedShifts++;
            }
        }

        var correctNumberOfOpenShiftsToAdd = returnMaxOpenShiftCountForTime(targetTimeMomentObj.clone()) - countOfOccupiedShifts;
        // If we have a negative or zero number of open shifts to add--the shift is overbooked--or the number of
        // open shifts present is equal to the correct count, we don't need to add any shifts.
        if (correctNumberOfOpenShiftsToAdd <= 0 || countOfOpenShifts === correctNumberOfOpenShiftsToAdd) {
            callback(false);
            return;
        }
        else {
            callback(true, openShiftIDs, correctNumberOfOpenShiftsToAdd, targetTimeMomentObj);
            return;
        }
    });
}

function returnMaxOpenShiftCountForTime(targetTimeMomentObj) {
    var dayStr = targetTimeMomentObj.format('ddd'); // a string like "Thu"
    var hourStr = targetTimeMomentObj.format('ha'); // a string like "4pm"
    return global.config.crisisCounselorsPerSupervisor * global.config.numberOfSupervisorsPerShift[dayStr][hourStr];
}

// Exporting modularized functions for testability
module.exports = {
    recurOpenShifts: recurOpenShifts,
    returnMaxOpenShiftCountForTime: returnMaxOpenShiftCountForTime,
    findIfOpenShiftsNeedToBeAddedAndOpenShiftIDsAndOccupiedShiftCount: findIfOpenShiftsNeedToBeAddedAndOpenShiftIDsAndOccupiedShiftCount,
};
