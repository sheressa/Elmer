
var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');

var wiw_date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';

new CronJob('0 0 * * * *', function () {
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
        var open_shifts = {};

        for (var i in data.shifts) {
            if (data.shifts[i].is_open) {
                var shift = data.shifts[i];

                if (typeof open_shifts[shift.start_time] == 'undefined') {
                    open_shifts[shift.start_time] = [];
                }

                open_shifts[shift.start_time].push(shift);
            }
        }

        for (var i in open_shifts) {
            if (open_shifts[i].length > 1) {
                var shift = open_shifts[i];
                var max = -1;
                var instances = 0;

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
                    if (shift[j].instances !== undefined && shift[j].instances == max) {
                        WhenIWork.update('shifts/'+shift[j].id, {instances: instances});
                    } else {
                        WhenIWork.delete('shifts/'+shift[j].id);
                    }
                }
            }
        }
    });
}
