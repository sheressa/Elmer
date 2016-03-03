var moment = require('moment');
var colors = require('../config').shiftColors;
var WIWDateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ';

/**
 * If start_time is undefined, this function will search the
 * shiftToColorize for start_time. Otherwise, for the case where
 * we're doing a shift update and therefore not passing in an
 * entire shift, we will check the second parameter.
 */
module.exports = function(shiftToColorize, startTime) {
    if (typeof startTime == 'undefined') {
        startTime = moment(shiftToColorize.start_time, WIWDateFormat);
    } else {
        startTime = moment(startTime, WIWDateFormat);
    }

    var day = startTime.format('ddd');
    var time = startTime.format('ha');

    if (colors[day] && colors[day][time]) {
        shiftToColorize.color = colors[day][time];
    }

    return shiftToColorize;
};
