'use strict';

var request = require('request-promise');
var CronJob = require('cron').CronJob;
var WhenIWork = CONFIG.WhenIWork;
var updateCanvas = require('./helpers/updateCanvas.js');
var firstMeltInvoluntary = require('../../email_templates/firstMeltInvoluntary.js');
var firstMeltVoluntary = require('../../email_templates/firstMeltVoluntary.js');
var secondMeltInvoluntary = require('../../email_templates/secondMeltInvoluntary.js');
var secondMeltVoluntary = require('../../email_templates/secondMeltVoluntary.js');
var fs = require('fs');
var mandrill = require('mandrill-api/mandrill');
var mandrillClient = new mandrill.Mandrill(KEYS.mandrill.api_key);

new CronJob(CONFIG.time_interval.cron_twice_per_day, meltUsers, null, true);

function deleteWiWUserAndShifts(canvasUser) {
  var WiWUsers;
  return WhenIWork.get('users', CONFIG.locationID.regular_shifts, function(response) {
    WiWUsers = response.users.filter(function(user) {
      return user.email == canvasUser.login_id;
    }).map(function(user) {
      return user.id;
    });
    WiWUsers.forEach(function(user) {
      WhenIWork.delete('users/' + user, function(result) {
        if (result.error) CONSOLE_WITH_TIME('Could not delete user ' + user + ': ', result.error);
        else CONSOLE_WITH_TIME("Successfully deleted user " + user + ": ", result);
      });
    });
    return WiWUsers;
  });
}

function deferOrBlockInCTLOnline(userEmail) {
  var uid;
  var options = {
    'User-Agent': 'Request-Promise',
    url: 'https://online.crisistextline.org/api/v1/user?parameters[mail]=' + userEmail + '&api-key=g3otwVINxVbyeAbeYNaEBy8r4ozNuyHM'
  };

  //finds user ID in CTL Online
  return request(options)
  .then(function(response) {
    response = JSON.parse(response);
    uid = response[0].uid;
    //Adds 'Deferred' role to user's account in CTL Online if they are a first-time melt,
    //or marks them as dropout and blocks their CTL Online account if they are a second-time melt.
    request.post('https://online.crisistextline.org/api/v1/rules/rules_user_drop_out?api-key=' + KEYS.CTLOnline.api_key, {form:{uid: uid}});
  })
  .catch(function(err) {
    if (Object.keys(err).length) CONSOLE_WITH_TIME('Deferring or blocking the melted user with email ' + userEmail + ' in CTL Online failed: ', err);
  });
}

function emailMeltedUser(canvasUser, numberOfMelts, enrollmentState, courseID) {
  var text;
  var subject;
  var traineeName = canvasUser.name.split(' ')[0];
  //when we get to cohort 100 we will have to update the below.
  var trainerName = courseID[3].toUpperCase() + courseID.slice(4);

  if (numberOfMelts >= 2 && enrollmentState === 'completed') {
    text = secondMeltVoluntary(traineeName, trainerName);
    subject = 'I hope timing is better down the road.';
  } 
  else if (numberOfMelts >= 2 && enrollmentState === 'inactive') {
    text = secondMeltInvoluntary(traineeName, trainerName);
    subject = 'I hope you’ll join us again down the road.';
  }
  else if (numberOfMelts === 1 && enrollmentState === 'completed') {
    text = firstMeltVoluntary(traineeName, trainerName);
    subject = 'I hope to see you soon!';
  }
  else {
    text = firstMeltInvoluntary(traineeName, trainerName);
    subject = 'Will you join us in a future cohort?';
  }

  var message = {
    subject: subject,
    html: text,
    from_email: 'support@crisistextline.org',
    from_name: 'Crisis Text Line',
    to: [{
        email: canvasUser.login_id,
        name: canvasUser.name,
        type: 'to'
    }],
    headers: {
        "Reply-To": "support@crisistextline.org",
    }
  };

  mandrillClient.messages.send({message: message}, CONSOLE_WITH_TIME);

  //returned for testing purposes
  return message;
}

function findMostRecent(objArr) {
  var mostRecent = objArr[0];
  for (var i=1; i<objArr.length; i++) {
    if (objArr[i].id > mostRecent.id) mostRecent = objArr[i];
  }
  return mostRecent;
}

function meltUsers() {

  //First, we get all Canvas users.
  updateCanvas.canvas.scrapeAllCanvasUsers()
  .then(function(response) {
    var users = response;
    users.forEach(function(user) {
      let userEnrollments = [];
      let numberOfMelts;
      let assignmentID;
      let grade;
      //Then we check if the user has 'inactive' enrollments (force melts)
      updateCanvas.canvas.scrapeCanvasEnrollment(user.id, 'inactive')
      .then(function(result) {
        if (result) userEnrollments = result;
      })
      //Then we check if the user has 'completed' enrollments (voluntary melts)
      .then(function() {
        return updateCanvas.canvas.scrapeCanvasEnrollment(user.id, 'completed');
      })
      .then(function(result) {
        if (result) userEnrollments = userEnrollments.concat(result);
      })
      //Then we look up the user's final exam assignment
      .then(function() {
        numberOfMelts = userEnrollments.length;
        return updateCanvas.canvas.scrapeCanvasAssignments(userEnrollments[userEnrollments.length-1].course_id, CONFIG.canvas.assignments.finalExam);
      })
      .then(function(assignments) {
        assignmentID = assignments[0].id;
        return updateCanvas.canvas.getUserGrade(userEnrollments[userEnrollments.length-1].user_id, userEnrollments[userEnrollments.length-1].course_id, assignmentID);
      })
      /*
      If the final exam grade is 0, we know we have already performed melt-related actions for the user.
      If it's not, we know we need to perform the actions, namely: deleting them and their shifts from WiW,
      emailing them, changing their status in CTL Online, and grading their final exam 0 to signify
      that we have done all these things.
      */
      .then(function(response) {
        grade = response;
        if (numberOfMelts >= 1 && grade !== '0') {
          let mostRecentEnrollment = findMostRecent(userEnrollments);
          //have to reactivate user to grade them, then deactivate; need to save enrollment type
          let enrollmentStatus = userEnrollments[userEnrollments.length-1].enrollment_state;
          updateCanvas.canvas.activateOrDeactivateEnrollment(userEnrollments[userEnrollments.length-1].course_id, userEnrollments[userEnrollments.length-1].id, 'reactivate', user.id)
          .then(function() {
            setTimeout(function(){}, 1000);
            updateCanvas.canvas.updateUserGrade(user.id, userEnrollments[userEnrollments.length-1].course_id, assignmentID, 0);
          })
          .then(function() {
            updateCanvas.canvas.activateOrDeactivateEnrollment(userEnrollments[userEnrollments.length-1].course_id, userEnrollments[userEnrollments.length-1].id, enrollmentStatus);
          })
          .catch(function(error) {
            CONSOLE_WITH_TIME('Error in the melt process: ', error);
          });
          deleteWiWUserAndShifts(mostRecentEnrollment.user);
          emailMeltedUser(mostRecentEnrollment.user, numberOfMelts, mostRecentEnrollment.enrollment_state, mostRecentEnrollment.sis_course_id);
          deferOrBlockInCTLOnline(mostRecentEnrollment.user.login_id);
        }

        if (numberOfMelts >= 2) {
          //deletes the user from Canvas. This must be done LAST because otherwise we lose the Canvas info we need to run the other functions.
          updateCanvas.canvas.deleteCanvasUser(user.id);
        }
      })
      .catch(function(error) {
        CONSOLE_WITH_TIME('Error in the melt process: ', error);
      });
    });
  })
  .catch(function(error) {
    CONSOLE_WITH_TIME('Error in the melt process: ', error);
  });
}

module.exports = {
  deleteWiWUserAndShifts: deleteWiWUserAndShifts, 
  meltUsers: meltUsers,
  emailMeltedUser: emailMeltedUser
};
