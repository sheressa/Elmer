
var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');

var wiw_date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';

new CronJob(global.config.time_interval.open_shifts, function () {
    mergeOpenShifts();
});

mergeOpenShifts();

function mergeOpenShifts() {
    var query = {
        include_allopen: true,
        start: '-1 day',
        end: '+7 days',
        location_id: global.config.locationID.regular_shifts
    };

    WhenIWork.get('shifts', query, function (data) {
        var openShifts = {};

        for (var i in data.shifts) {
            if (data.shifts[i].is_open) {
                var shift = data.shifts[i];

                if (typeof openShifts[shift.start_time] == 'undefined') {
                    openShifts[shift.start_time] = [];
                }

                openShifts[shift.start_time].push(shift);
            }
        }

        for (var i in openShifts) {
            if (openShifts[i].length > 1) {
                var shift = openShifts[i];
                var max = -1;
                var instances = 0;
                var remainingShiftUpdated = false;

                for (var j in shift) {
                    if (shift[j].instances == undefined || shift[j].instances == 0) {
                        instances += 1;
                    } else {
                        instances += shift[j].instances;

                        if (shift[j].instances > max) {
                            max = shift[j].instances;
                        }
                    }
                }

                for (var j in shift) {
                    if (shift[j].instances !== undefined && shift[j].instances == max && !remainingShiftUpdated) {
                        WhenIWork.update('shifts/'+shift[j].id, {instances: instances});
                        remainingShiftUpdated = true;
                    } else {
                        WhenIWork.delete('shifts/'+shift[j].id);
                    }
                }
            }
        }
    });
}
