'use strict';

const api = CONFIG.WhenIWork;
const moment = require('moment');

// Sat, 16 Jan 2016 14:00:00 -0500
const wiw_date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
const out_format = 'ddd h:mm A';

module.exports.dumpSchedules = function () {
  // We want to see shifts 8 days out from now.
  let params = {
    location_id: CONFIG.locationID.regular_shifts,
    end: '+8 days',
    include_objects: false
  };

  api.get('shifts', params, function (data) {
    var user_shifts = {};
    var shift;

    // Loop through each shift and put them into an object
    // indexed by user id. Ex:
    // { 123: [MomentObject, MomentObject, MomentObject] }
    for (var i in data.shifts) {
      shift = data.shifts[i];

      // Create the entry in the object if no exist
      if (typeof user_shifts[shift.user_id] == 'undefined') {
        user_shifts[shift.user_id] = [];
      }

      user_shifts[shift.user_id].push(moment(shift.start_time, wiw_date_format));
    }

    // Now we need to get the email addresses
    let params = {
      include_objects: false
    };
    api.get('users', params, function (data) {
      var user;
      for (var i in data.users) {
        user = data.users[i];

        if (typeof user_shifts[user.id] !== 'undefined') {
          // Switch to email-indexed array
          user_shifts[user.email] = user_shifts[user.id];
          // and delete the old value
          delete user_shifts[user.id];
        }
      }

      // Done state: wrap up here.
      var line, shift;
      for (var i in user_shifts) {
        line = i.toLowerCase();
        for (var j in user_shifts[i]) {
          shift = user_shifts[i][j].format(out_format);
          if (line.indexOf(shift) < 0) {
            line = line + "\t" + shift;
          }
        }

        // print the shit
        console.log(line);
      }
    });
  });
};

module.exports.clearProd = function() {
  CONSOLE_WITH_TIME('This function must first be enabled before it will run.');
  return false;
  for (var year = -1; year < 50; year++) {
    var start_time = moment().add(year, 'year').format(wiw_date_format);
    var end_time = moment().add(year+1, 'year').format(wiw_date_format);

    var query = {
      start: start_time,
      end: end_time,
      location_id: CONFIG.locationID.test,
      unpublished: true,
      include_allopen: true,
      include_objects: false
    };

    api.get('shifts', query, function (data) {
      var shifts_to_delete = [];
      for (var i in data.shifts) {
        shifts_to_delete.push(data.shifts[i].id);
      }

      var subsections = Math.ceil(shifts_to_delete.length / 500);
      for (var i = 0; i < subsections; i++) {
        api.delete('shifts', {ids: shifts_to_delete.slice(i*500, (i*500) + 500).join(',')}, function (resp) {
          CONSOLE_WITH_TIME(resp);
        });
      }
    });
  }
};
