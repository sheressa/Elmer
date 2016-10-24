'use strict';

var CronJob = require('cron').CronJob;
var wIWUserAPI = CONFIG.WhenIWork;
var wIWSupervisorsAPI = CONFIG.WhenIWorkSuper;

var canvas = require('../../canvas.js');
var stathat = require(CONFIG.root_dir + '/lib/stathat');
var moment = require('moment');
var retrieveAndSortSupervisorsByShift = require('./helpers/sortUsersByShift');
var composeEmail = require('../../email_templates/composeNotifyMoreShifts');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(KEYS.mandrill.api_key);

new CronJob(CONFIG.time_interval.cron_twice_per_day, notifyMoreShifts, null, true);

notifyMoreShifts();

function notifyMoreShifts() {
  var result;
  var query = {
    end: '+' + CONFIG.time_interval.days_of_open_shift_display + ' days',
    location_id: CONFIG.locationID.regular_shifts + ", " + CONFIG.locationID.makeup_and_extra_shifts
  };

  wIWUserAPI.get('shifts', query, function (response) {
    var usersTally = tallyUserShifts(response.shifts);

    if (objectHasOwnKeys(usersTally)) {
      var filteredUsers = removeOlderUsers(response.users);
      var shiftNotificationResult = shiftNotification(filteredUsers, usersTally);
      // Assigning this result for testing
      result = shiftNotificationResult;

      if (objectHasOwnKeys(shiftNotificationResult.usersBeingNotified)) {

        batchPost(shiftNotificationResult.updateUserNotes);

        retrieveAndSortSupervisorsByShift(wIWSupervisorsAPI, CONFIG.locationID.supervisor_on_platform, CONFIG.wiwAccountID.supervisors)
        .then(function(shiftsToSup){
          mandrillEachUser(shiftNotificationResult.usersBeingNotified, shiftsToSup);
        })
        .catch(function(err){
          CONSOLE_WITH_TIME(err);
        });
      }

    }

  });
  // returned for testing;
  return result;
}

function objectHasOwnKeys(obj) {
  var numberOfKeys = 0;
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) numberOfKeys++;
  }
  return numberOfKeys;
}

function tallyUserShifts(shifts) {
  var users = {};

  shifts.forEach(function(shift){
    if (typeof users[shift.user_id] === 'undefined') {
      users[shift.user_id] = [];
    }
    users[shift.user_id].push(shift.start_time);
  });
  return users;
}

function removeOlderUsers (users) {
  return users.filter(function(user) {
    var created = moment(new Date(user.created_at));
    return moment().diff(created, 'days') < CONFIG.time_interval.days_until_older_user;
  });
}

function parseUserNotes(notes) {
  var user_data = notes;
  if (typeof user_data !== 'string') {
    user_data = '{}';
  }
  else {
    try {
      user_data = JSON.parse(user_data);
    }
    catch(e) {
      CONSOLE_WITH_TIME("Error parsing JSON in notifyMoreShifts: ", e, "\nNotes: ", notes);
      user_data = {};
    }
  }
  return user_data;
}

function shiftNotification(users, usersToNotify) {
  // users is an array of user objects, usersToNotify is hash from userID: [shift start times]
  var usersBeingNotified = {};
  var updateUserNotes = [];
  var user_data;

  users.forEach(function(user){

    if (usersToNotify[user.id]) {

      user_data = parseUserNotes(user.notes);

      if (user_data[CONFIG.WiWUserNotes.shiftNotification] === undefined) {
        user_data[CONFIG.WiWUserNotes.shiftNotification] = true;
        updateUserNotes.push({
          method: 'PUT',
          url: '/users/' + user.id,
          params: {notes: JSON.stringify(user_data)}
        });

        var email = user_data.canonicalEmail ? user_data.canonicalEmail : user.email;

        usersBeingNotified[user.id] = {
          firstName: user.first_name,
          lastName: user.last_name,
          email: email,
          shifts: usersToNotify[user.id]
        };

        markCanvasScheduledShiftAssignmentBasedOnWiWEmail(email);
      }
    }

  });

  return {updateUserNotes: updateUserNotes, usersBeingNotified: usersBeingNotified};
}

function batchPost(updateUserNotes) {
  wIWUserAPI.post('batch', updateUserNotes);
}

function mandrillEachUser(userWithAllInfo, shiftToSup) {
  var results = [];
  var contents;
  var user;

  for (var i in userWithAllInfo) {
    user = userWithAllInfo[i];
    contents = composeEmail(user, shiftToSup);

    var message = {
      subject: 'Thank you for booking!',
      html: contents,
      from_email: 'support@crisistextline.org',
      from_name: 'Crisis Text Line',
      to: [{
          email: user.email,
          name: user.firstName + ' ' + user.lastName,
          type: 'to'
      }],
      headers: {
          "Reply-To": "support@crisistextline.org",
      }
    };

    results.push(message);

    mandrill_client.messages.send({message: message}, CONSOLE_WITH_TIME);
  }

  // returned for testing;
  return results;
}
function markCanvasScheduledShiftAssignmentBasedOnWiWEmail(email) {
  //collects canvas user ID, courseID, and assignment ID based on the WiW
  //user ID, then calls the update grade function, which needs all three.
  var userID;
  var courseID;
  var name;

  canvas.scrapeCanvasUsers(email)
  .then(function(users) {
    if (users.length === 0) throw 'That email was not found in Canvas.';
    userID = users[0].id;
    name = users[0].name;
    email = users[0].login_id;
    return users[0].id;
  })
  .then(function(userID) {
    return canvas.scrapeCanvasEnrollment(userID);
  })
  .then(function(courses) {
    courses = courses.filter(function(course) {
      return course.enrollment_state == 'active';
    });
    if (courses.length === 0) throw 'No active courses for that user were found in Canvas.';
    courseID = courses[0].course_id;
    return courses[0].course_id;
  })
  .then(function(courseID) {
    return canvas.scrapeCanvasAssignments(courseID, CONFIG.canvas.assignments.scheduledShifts);
  })
  .then(function(assignment) {
    if (assignment.length === 0) throw "No 'Schedule Your Shifts' assignment for that user was found in Canvas.";
    return canvas.updateUserGrade(userID, courseID, assignment[0].id, 'pass');
  })
  .catch(function(err) {
    CONSOLE_WITH_TIME(`Finding the user with the email ${email} in Canvas failed: ${err}`);
  });

};

module.exports = {
  notifyMoreShifts: notifyMoreShifts,
  mandrillEachUser: mandrillEachUser
};
