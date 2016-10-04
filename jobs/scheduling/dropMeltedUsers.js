'use strict';

var Request = require('request-promise');
var CronJob = require('cron').CronJob;
var WhenIWork = CONFIG.WhenIWork;
var updateCanvas = require('./helpers/updateCanvas.js');
var fs = require('fs');
var options = {
  headers: {
    Authorization: KEYS.canvas.api_key,
    'User-Agent': 'Request-Promise'
  }
};

new CronJob(CONFIG.time_interval.cron_twice_per_day, findMeltedCanvasUsersAndDeleteThemInWiW, null, true);

function deleteWiWUserAndShifts(canvasUser, WiWUsers) {
  var usersForTest;
  WiWUsers = WiWUsers.users.filter(function(user) {
    return user.email == canvasUser.login_id;
  });
  WiWUsers = WiWUsers.map(function(user) {
    return user.id;
  });
  for (var i=0; i<WiWUsers.length; i++) {
    WhenIWork.delete('users/' + WiWUsers[i], function(result) {
      CONSOLE_WITH_TIME("Successfully deleted user " + WiWUsers[i] + ": ", result);
    });
  }
  usersForTest = WiWUsers;
  return usersForTest;
}

function findMeltedCanvasUsersAndDeleteThemInWiW() {
  var users = global.cache.filter(function(user){
    return user.locations.indexOf(CONFIG.locationID.regular_shifts) > -1;
  });  
    updateCanvas.canvas.retrieveCourses()
    .then(function(response) {
      var result = response.map(function(course) {
        return course.id;
      });
      return result;
    })
    .then(function(courseIDs) {
      courseIDs.forEach(function(courseID) {
        return updateCanvas.canvas.retrieveEnrollment(courseID, 'inactive')
        .then(function(enrollments) {
          if (!enrollments) throw 'No inactive enrollments found.';
          enrollments.forEach(function(enrollment) {
            //take user object here and delete user's WiW shifts + account
            deleteWiWUserAndShifts(enrollment.user, users);
          });
        })
        .catch(function(error) {
          console.log('Error finding Canvas users or deleting them in WiW', error);
        });
      });
    })
    .catch(function(err) {
      console.log('Error finding Canvas users or deleting them in WiW', err);
    });
}

module.exports = {deleteWiWUserAndShifts: deleteWiWUserAndShifts, findMeltedCanvasUsersAndDeleteThemInWiW: findMeltedCanvasUsersAndDeleteThemInWiW};
