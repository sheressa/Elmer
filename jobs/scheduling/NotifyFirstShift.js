var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var moment = require('moment');
var fs = require('fs');

var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(global.config.mandrill.api_key);

var date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';

new CronJob(global.config.time_interval.notify_first_shift_cron_job_string, function () {
  checkNewShifts();
}, null, true);

checkNewShifts();

function checkNewShifts() {
  // TODO: Re-enable this.
  return;

  WhenIWork.get('users', {location_id: global.config.locationID.new_graduate}, function (users) {
    var now = moment();
    var template = fs.readFileSync('./email_templates/shift_welcome.txt', {encoding: 'utf-8'});

    for (var i in users.users) {
      var u = users.users[i];
      var created = moment(u.created_at, date_format);

      if (u.notes.indexOf('first_shift_notified') < 0 && now.diff(created, 'days') < global.config.days_to_search_for_new_users_who_have_scheduled_their_first_shift) {
        var q = {
          user_id: u.id,
          start: moment().format(date_format),
          end: moment().add(global.config.days_to_search_for_new_users_who_have_scheduled_their_first_shift, 'days').format(date_format)
        };

        WhenIWork.get('shifts', q, function (shifts) {
          var sent = false;

          for (var i in shifts.shifts) {
            var s = shifts.shifts[i];
            var created = moment(s.created_at, date_format);

            if (now.diff(created, 'minutes') <= interval && !sent) {
              var sent = true;
              var shift_start = moment(s.start_time, date_format).format('MMM D, YYYY HH:mm');

              var content = template.replace('%name', shifts.users[0].first_name).replace('%date', shift_start);

              var message = {
                  subject: 'Welcome aboard!',
                  text: content,
                  from_email: 'support@crisistextline.org',
                  from_name: 'Crisis Text Line',
                  to: [{
                      email: shifts.users[0].email,
                      name: shifts.users[0].first_name + ' ' + shifts.users[0].last_name,
                      type: 'to'
                  }],
                  headers: {
                      "Reply-To": "shannon@crisistextline.org",
                  }
              };

              mandrill_client.messages.send({message: message, key: 'first_shift_scheduled'}, function (res) {
                  console.log(res);
              });

              WhenIWork.update('users/'+shifts.users[0].id, {notes: shifts.users[0].notes + 'first_shift_notified' + "\n"});
            }
          }
        });
      }
    }
  });
}
