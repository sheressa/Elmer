'use strict';

const wIWSupervisorsAPI = CONFIG.WhenIWorkSuper;
const moment = require('moment');
const retrieveAndSortSupervisorsByShift = require('./sortUsersByShift');
const composeEmail = require(CONFIG.root_dir + '/email_templates/composeNotifyBookedShift');
const mandrill = require('mandrill-api/mandrill');
const mandrill_client = new mandrill.Mandrill(KEYS.mandrill.api_key);

function notifyUserBookedShift (shifts, users) {
  var userIdToInfo = filterUsersToObject(users);
  retrieveAndSortSupervisorsByShift(wIWSupervisorsAPI, CONFIG.locationID.supervisor_on_platform, CONFIG.wiwAccountID.supervisors)
  .then(function(shiftsToSup){
    mandrillEachUser(shifts, userIdToInfo, shiftsToSup);  
  })
  .catch(function(err){
    CONSOLE_WITH_TIME(err);
  });
}

function filterUsersToObject (users){
  var usersObj = {};
  users.forEach(function(user){
    var created = moment(new Date(user.created_at));
    // Only includes users who have already received the two_shift_notification note
    // or are at least 'days_of_open_shift_display' old and will never get that user note
    var shiftNotification = new RegExp(CONFIG.WiWUserNotes.shiftNotification,`g`);
    //the first part of the or statement will be unncessary below once we go through and change all user notes
    if (/two_shift_notification/.test(user.notes) || shiftNotification.test(user.notes) || moment().diff(created, 'days') >= CONFIG.time_interval.days_until_older_user) usersObj[user.id] = user;
  });
  return usersObj;
}

function mandrillEachUser (shifts, userIdToInfo, shiftsToSup){
  var results = [];
  var contents;
  
  shifts.forEach(function(shift){
    var user = userIdToInfo[shift.user_id];
    user.shift = shift.start_time;

    contents = composeEmail(user, shiftsToSup);
    results.push(contents);

    // if the user has canonicalEmail in their notes use that, otherwise use user.email.
    var email = /canonicalEmail/.test(user.notes) ? JSON.parse(user.notes).canonicalEmail : user.email;

    var message = {
      subject: "You're signed up for a new CTL shift!",
      html: contents,
      from_email: 'support@crisistextline.org',
      from_name: 'Crisis Text Line',
      to: [{
          email: email,
          name: user.first_name + ' ' + user.last_name,
          type: 'to'
      }],
      headers: {
          "Reply-To": "support@crisistextline.org",
      }
    };

    mandrill_client.messages.send({message: message}, CONSOLE_WITH_TIME);
  });

  // results are returned for testing.
  return results;
}

module.exports = {notifyUserBookedShift: notifyUserBookedShift};