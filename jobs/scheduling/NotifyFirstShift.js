var CronJob = require('cron').CronJob;
var WhenIWork = CONFIG.WhenIWork;
var moment = require('moment');
var fs = require('fs');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(KEYS.mandrill.api_key);
var date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';

new CronJob(CONFIG.time_interval.notify_first_shift_cron_job_string, function () {
  checkNewShifts();
}, null, true);

function checkNewShifts() {
  // TODO: Re-enable this.
  if (process.env.NODE_ENV !== 'test') {
    return;
  }

  WhenIWork.get('users', {location_id: CONFIG.locationID.new_graduate}, function(response) {
    processUsers(response.users);
  });

}

function processUsers(users) {
  var result = [];
  var now = moment();
  users.forEach(function(user, index) {
    var created = moment(user.created_at, date_format);
    if (user.notes.indexOf('first_shift_notified') < 0 && now.diff(created, 'days') < CONFIG.time_interval.days_of_open_shift_display) {
      var q = {
        user_id: user.id
      };
      WhenIWork.get('shifts', q, function (response) {
        //THIS PUSH COMMAND IS FOR TESTING.
        result.push(getShifts(response.shifts, now, user));
      });
    }
  });
  return result;
}

function getShifts(shifts, now, user) {
  var template = fs.readFileSync('./email_templates/shift_welcome.txt', {encoding: 'utf-8'});
  var sent = false;
  for (var j in shifts) {
    var s = shifts[j];
    if (!sent) {
      sent = true;
      var shift_start = moment(s.start_time, date_format).format("dddd, MMMM Do YYYY, h:mm a");

      var content = template.replace('%name', user.first_name).replace('%date', shift_start);

      var email = user.email;
      if (user.notes) {
        var parsedNotes = JSON.parse(user.notes);
        if (parsedNotes.canonicalEmail) email = parsedNotes.canonicalEmail;
      }

      var message = {
          subject: 'Welcome aboard!',
          text: content,
          from_email: 'support@crisistextline.org',
          from_name: 'Crisis Text Line',
          to: [{
              email: email,
              name: user.first_name + ' ' + user.last_name,
              type: 'to'
          }],
          headers: {
              "Reply-To": "shannon@crisistextline.org",
          }
      };
      mandrill_client.messages.send({message: message, key: 'first_shift_scheduled'}, function (res) {
          CONSOLE_WITH_TIME(res);
      });

      WhenIWork.update('users/' + user.id, {notes: user.notes + 'first_shift_notified' + "\n"});
      return ({user: user.id, email: user.email, name: user.first_name + " " + user.last_name, notes: user.notes, message: message});
    }
  }
}

module.exports = processUsers;

