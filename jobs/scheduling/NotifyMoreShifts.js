var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var fs = require('fs');
var stathat = require(CONFIG.root_dir + '/lib/stathat');

new CronJob(CONFIG.time_interval.take_more_shifts_cron_job_string, function () {
  notifyMoreShifts();
});

function notifyMoreShifts() {
  var query = {
    location_id: CONFIG.locationID.regular_shifts,
    end: '+' + CONFIG.time_interval.days_of_open_shift_display + ' days'
  };

  WhenIWork.get('shifts', query, function (data) {
    var users = {};
    var shift;

    for (var i in data.shifts) {
      shift = data.shifts[i];

      if (typeof users[shift.user_id] == 'undefined') {
        users[shift.user_id] = 0;
      }

      users[shift.user_id]++;
    }

    processUsers(users);
  });
}

function processUsers(users) {
    var only_one = [];
    var only_two = [];

    for (var i in users) {
      if (users[i] == 1) {
        only_one.push(i);
      } else if (users[i] == 2) {
        only_two.push(i);
      }
    }

    stathat.log('Scheduling - One Shift', only_one.length);
    stathat.log('Scheduling - Two Shifts', only_two.length);

    // We're going to notify these people once a day.
    var one_shift_post = {
      ids: only_one,
      subject: 'Thanks for signing up for a shift',
      message: fs.readFileSync('./email_templates/one_shift.txt', {encoding: 'utf-8'})
    };

    WhenIWork.post('send', one_shift_post);

    // Now we're going to notify these people once. So the logic is more complicated.
    if (only_two.length > 0) {
      var req = {
        location_id: CONFIG.locationID.regular_shifts
      };

      WhenIWork.get('users', req, function (data) {
        var only_two_notify = [];
        var user_data;
        var update_queue = [];

        for (var i in data.users) {
        	/**
						Soooo apparently the {ids: 1,2,3} doesn't work in the WiW API...
          	Fuck. That.
          **/
          if (only_two.indexOf(''+data.users[i].id) < 0) {
            continue;
          }

          user_data = data.users[i].notes;

          if (user_data.indexOf('two_shift_notification') < 0) {
            user_data = JSON.parse(user_data);
            user_data.two_shift_notification = true;

            update_queue.push({
              method: 'PUT',
              url: '/2/users/'+data.users[i].id,
              params: {notes: JSON.stringify(user_data)}
            });

            only_two_notify.push(data.users[i].id);
          }
        }

        WhenIWork.post('batch', update_queue);

        if (only_two_notify.length > 0) {
          var two_shift_post = {
            ids: only_two_notify,
            subject: 'A little secret...',
            message: fs.readFileSync('./email_templates/two_shifts.txt', {encoding: 'utf-8'})
          };

          WhenIWork.post('send', two_shift_post);
        }
      });
    }
}

module.exports.go = notifyMoreShifts;
