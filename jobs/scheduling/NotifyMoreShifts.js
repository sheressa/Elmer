var CronJob = require('cron').CronJob;
var wIWUserAPI = CONFIG.WhenIWork;
var wIWSupervisorsAPI = CONFIG.WhenIWorkSuper;

var updateCanvas = require('./helpers/updateCanvas.js');
var stathat = require(CONFIG.root_dir + '/lib/stathat');
var moment = require('moment');
var retrieveAndSortSupervisorsByShift = require('./helpers/sortUsersByShift');
var composeEmail = require('../../email_templates/composeNotifyMoreShifts');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill(KEYS.mandrill.api_key);

new CronJob(CONFIG.time_interval.cron_twice_per_day, notifyMoreShifts);

notifyMoreShifts();

function notifyMoreShifts() {
  var result;
  var query = {
    end: '+' + CONFIG.time_interval.days_of_open_shift_display + ' days',
    location_id: CONFIG.locationID.regular_shifts
  };

  wIWUserAPI.get('shifts', query, function (response) {
    var usersTally = tallyUserShifts(response.shifts);
    var usersWithTwoOrMore = listUsersWithTwoOrMoreShifts(usersTally);

    if (objectHasOwnKeys(usersWithTwoOrMore)) {
      var filteredUsers = removeOlderUsers(response.users);
      var twoShiftNotificationResult = twoShiftNotification(filteredUsers, usersWithTwoOrMore);
      // Assigning this result for testing
      result = twoShiftNotificationResult;

      if (objectHasOwnKeys(twoShiftNotificationResult.usersBeingNotified)) {

        batchPost(twoShiftNotificationResult.updateUserNotes);

        retrieveAndSortSupervisorsByShift(wIWSupervisorsAPI, CONFIG.locationID.supervisor_on_platform, CONFIG.wiwAccountID.supervisors)
        .then(function(shiftsToSup){
          mandrillEachUser(twoShiftNotificationResult.usersBeingNotified, shiftsToSup);  
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

function parseShiftStartTime(shiftStartTime) {
  //slicing the shift time for just the day of week and start time;
  //we want to match those rather than date to see if a shift is recurring
  return shiftStartTime.slice(0,3) + shiftStartTime.slice(16);
}

function tallyUserShifts(shifts) {
  var users = {};

  shifts.forEach(function(shift){
    if (typeof users[shift.user_id] == 'undefined') {
      users[shift.user_id] = [];
    }
    //filter here to ensure that we're not counting one weekly shift 
    //that recurs twice during the 15 day window as two weekly shifts
    if (users[shift.user_id].every(function(shiftTime) {
      return parseShiftStartTime(shiftTime) !== parseShiftStartTime(shift.start_time);
    })) {
      users[shift.user_id].push(shift.start_time);
    }
  });
  return users; 
}

function listUsersWithTwoOrMoreShifts(users) {
  var usersWithTwoOrMoreShifts = {};

  for (var i in users) {
    if (users[i].length >= 2) usersWithTwoOrMoreShifts[i] = users[i];
  }

  stathat.log('Scheduling - Two Shifts', objectHasOwnKeys(usersWithTwoOrMoreShifts));
  return usersWithTwoOrMoreShifts;
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

function twoShiftNotification(users, usersToNotify) {
  // users is an array of user objects, usersToNotify is hash from userID: [shift start times]
  var usersBeingNotified = {};
  var updateUserNotes = [];
  var user_data;

  users.forEach(function(user){

    if (usersToNotify[user.id]) {

      user_data = parseUserNotes(user.notes);

      if (user_data.two_shift_notification === undefined) {
        user_data.two_shift_notification = true;
        updateUserNotes.push({
          method: 'PUT',
          url: '/2/users/' + user.id,
          params: {notes: JSON.stringify(user_data)}
        });

        var email = user_data.canonicalEmail ? user_data.canonicalEmail : user.email;

        usersBeingNotified[user.id] = {
          firstName: user.first_name,
          lastName: user.last_name,
          email: email,
          shifts: usersToNotify[user.id]
        };
        
        updateCanvas.findWiWUserInCanvas(email);
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

module.exports = {
  notifyMoreShifts: notifyMoreShifts,
  mandrillEachUser: mandrillEachUser
};