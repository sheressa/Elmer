var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var moment = require('moment');

var wiw_date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
var copy_fields = [
    'is_open',
    'instances', // for now, we're direct copying the # of available instances assuming this week is source of truth
    'location_id',
    'position_id',
    'site_id',
    'user_id',
    'break_time',
    'alerted',
    'published'
];    

new CronJob(global.config.time_interval.open_shifts, function () {
    openShifts();
}, null, true);

function openShifts() {
    // Example time filter: 1:59:00 pm - 2:01:00 pm
    var filter = {
        // start time = the top of the current hour -1 minute
        start: '-1 minute',
        // end time = the top of the current hour +1 minute
        end: '+1 minute',
        location_id: global.config.locationID.regular_shifts,
        include_allopen: true // include_onlyopen doesn't work. no idea why
    };

    WhenIWork.get('shifts', filter, function (data) {
        for (var i in data.shifts) {
            // Make sure that we're only copying open shifts and that we're only
            // copying if we're within the same hour as the open shift.
            if (data.shifts[i].is_open && hourMatches(data.shifts[i].start_time)) {
                var shift = data.shifts[i];
                var new_shift = {};

                for (var j in copy_fields) {
                    new_shift[copy_fields[j]] = shift[copy_fields[j]];
                }

                new_shift.start_time = moment(shift.start_time, wiw_date_format);
                new_shift.end_time = moment(shift.end_time, wiw_date_format);

                new_shift.start_time = new_shift.start_time.add(7, 'day').format(wiw_date_format);
                new_shift.end_time = new_shift.end_time.add(7, 'day').format(wiw_date_format);

                WhenIWork.post('shifts', new_shift, function (data) {
                    // do something?
                });
            }
        }
    });
}

function hourMatches(time) {
    var now = moment().minute(0).second(0).format(wiw_date_format);

    return now == time;
}

module.exports.openShifts = openShifts;
