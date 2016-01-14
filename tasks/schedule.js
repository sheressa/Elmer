var moment = require('moment');
var WhenIWork = require('wheniwork-unofficial');
var api = new WhenIWork(global.config.wheniwork.api_key, global.config.wheniwork.username, global.config.wheniwork.password);
// Sat, 16 Jan 2016 14:00:00 -0500
var wiw_date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
var out_format = 'ddd h:mm A';

module.exports.dumpSchedules = function () {
    // We want to see shifts 8 days out from now.
    var end = moment().add(8, 'days').format('YYYY-MM-DD HH:mm:ss');

    api.get('shifts', {end_time: end}, function (data) {
        var user_shifts = {};
        var shift;

        // Loop through each shift and put them into an object
        // indexed by user id. Ex:
        // { 123: [MomentObject, MomentObject, MomentObject] }
        for (var i in data['shifts']) {
            shift = data['shifts'][i];

            // Create the entry in the object if no exist
            if (typeof user_shifts[shift.user_id] == 'undefined') {
                user_shifts[shift.user_id] = [];
            }

            user_shifts[shift.user_id].push(moment(shift.start_time, wiw_date_format));
        }

        // Now we need to get the email addresses
        api.get('users', {ids: Object.keys(user_shifts)}, function (data) {
            var user;
            for (var i in data['users']) {
                user = data['users'][i];

                if (typeof user_shifts[user.id] !== 'undefined') {
                    // Switch to email-indexed array
                    user_shifts[user.email] = user_shifts[user.id];
                    // and delete the old value
                    delete user_shifts[user.id];
                }
            }

            // Done state: wrap up here.
            var line;
            for (var i in user_shifts) {
                line = i.toLowerCase();
                for (var j in user_shifts[i]) {
                    line = line + "\t" + user_shifts[i][j].format(out_format);
                }

                // print the shit
                console.log(line);
            }
        });
    });
};
