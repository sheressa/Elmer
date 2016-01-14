var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var moment = require('moment');

var wiw_date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';

new CronJob(global.config.time_interval.open_shifts, function () {
    openShifts();
}, null, true);

function openShifts() {
    var current_hour = moment().minute(0).second(0);
    var next_time = current_hour.clone().add(7, 'days');

    var filter = {
        start: current_hour.clone().add(-3, 'day').format(wiw_date_format),
        end: current_hour.clone().add(3, 'day').format(wiw_date_format),
        location_id: global.config.locationID.test,
        include_open: true
    };

    WhenIWork.get('shifts', filter, function (data) {
        console.log(data);
    });

    WhenIWork.get('shifts/274126183', function(data) {
//        console.log(data);
    });
}

module.exports.openShifts = openShifts;
