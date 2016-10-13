'use strict';
var CronJob = require('cron').CronJob;
var WhenIWork = CONFIG.WhenIWork;
var canvas = require('../../canvas.js');

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
  WhenIWork.get('users', CONFIG.locationID.regular_shifts, function(users) {
    canvas.getAllCourses()
    .then(function(response) {
      var result = response.map(function(course) {
        return course.id;
      });
      return result;
    })
    .then(function(courseIDs) {
      courseIDs.forEach(function(courseID) {
        return canvas.retrieveCourseEnrollment(courseID, 'inactive')
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
  });
}

module.exports = {deleteWiWUserAndShifts: deleteWiWUserAndShifts, findMeltedCanvasUsersAndDeleteThemInWiW: findMeltedCanvasUsersAndDeleteThemInWiW};
