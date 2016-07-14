var fetch = require('node-fetch');
var fs = require('fs');
var crypto = require('crypto');
var internalRequest = require('request');
var moment = require('moment');
var throttler = require('throttled-request')(internalRequest);
var CronJob = require('cron').CronJob;

var SLACK_CHANNEL = '#graduates';
var timeout = 0;
var emailsDone = [];

// throttles requests so no more than 5 are made a second
throttler.configure({
  requests: 5,
  milliseconds: 1000
});

new CronJob(CONFIG.time_interval.graduate_users_cron_job_string, function () {
    pollCanvasForGraduatedUsersThenCreatePlatformAccount();
  }, null, true);
//invoking the function here runs the job every time the application starts
pollCanvasForGraduatedUsersThenCreatePlatformAccount();
// Polls Canvas for people who’ve passed the "Graduation" course
function pollCanvasForGraduatedUsersThenCreatePlatformAccount() {
  request('accounts/' + KEYS.canvas.accountID + '/courses', 'GET')
    .then(function (courses) {
      courses.forEach(function (course) {
        // var sD = moment().subtract(24, "hours").toJSON();
        /**
          Excluding courses that we don’t need to parse for graduations, because they’re either test courses or not related to CTL training.
        **/
        if (KEYS.canvas.coursesWeDoNotParseForGraduatedUsers.indexOf(course.id) >= 0) return;
<<<<<<< 25e9f2c35a1d8a1be42e942b9968948f87d55495
        request('courses/' + course.id + '/assignments', 'GET')
          .then(function (assignments) {
            return assignments.filter(function (assignment) {
              return assignment.name.indexOf(CONFIG.canvas.assignments.platformReady) >= 0;
            });
          })
          .then(function (assignments) {
            assignments.forEach(function (assignment) {
              setTimeout(getLogs.bind(this, assignment), timeout);
              timeout += 1000;
            });
          });
      });
    });
}

// gets grading logs for assignments from relevant courses
function getLogs(assignment) {
  CONSOLE_WITH_TIME('Graduating from assignment: ' + assignment.id);
  var startDate = moment().subtract(6, "hours").toJSON();
  request('audit/grade_change/assignments/' + assignment.id, 'GET', [
      'start_time=' + startDate
    ])
      .then(function (logs) {
        logs.events.forEach(function (log) {

            request('users/' + log.links.student + '/profile', 'GET').then(function (res) {
              if (res.primary_email) {
                var name = res.sortable_name.split(', ');
                var body = {
                  firstName: name[1],
                  lastName: name[0],
                  email: res.primary_email.toLowerCase()
                };
                updatePlatform(body);
=======
        request('/audit/grade_change/courses/'+course.id, 'GET')
        .then(function(gradebook){
          var assignments = gradebook.linked.assignments;
          var platformReadyId;
          var finalExamId;
          for(var i = 0; i<assignments.length; i++){
              if (assignments[i].name.indexOf(CONFIG.Canvas_final)>=0){
                finalExamId = assignments[i].id; 
              }
              if (assignments[i].name.indexOf(CONFIG.Canvas_graduation)>=0){
                platformReadyId = assignments[i].id; 
>>>>>>> added check for two assignments before platform creation functionality
              }
              if(i==assignments.length-1 && finalExamId && platformReadyId){
                checker(gradebook, finalExamId, platformReadyId)
                return;
              }
          }
        })
      })
    })  
};

//checks whether a student is eligible for profile creation
function checker(gradebook, finalID, platformID){
  console.log(finalID, platformID)
  //first, we get the id's of final exam and graduation assignments
  var events = gradebook.events;
  var users = gradebook.linked.users;
  var finalExamId = finalID;
  var platformReadyId = platformID;
  var students = {};
  var graduates = {};
  var gstudents = [];
  var startDate = moment().subtract(6, "hours");

  //second, we check if a user graduated within the last 6 hours and if the user received 85+ on their final exam
  for(var j=0; j<events.length; j++){
    if (events[j].links.assignment==finalExamId && events[j].grade_after>=85){
      if(!students[events[j].links.student]) {
        students[events[j].links.student] = {final:1};
      } else {
        students[events[j].links.student].final = 1;
      }
    }
    if (events[j].links.assignment==platformReadyId && startDate.isBefore(events[j].created_at)){
      if(!students[events[j].links.student]){
          students[events[j].links.student] = {grad:1};
      } 
      else {
          students[events[j].links.student].grad = 1;
      }
    }
    if (students[events[j].links.student]) {
      if(students[events[j].links.student].grad && students[events[j].links.student].final){
      graduates[events[j].links.student]=2;
      delete students[events[j].links.student];
      }
    }
  }
  //then, we prepare user objects to be updated
  for(var k=0; k<users.length; k++){
    if (graduates[users[k].id]){
        gstudents.push(users[k]);
    }
    if(k==users.length-1 && gstudents.length) createEmail(gstudents);
  }
};

// creates the body of a platform post request
function createEmail(graduates) {
  CONSOLE_WITH_TIME('Graduating users ', graduates)
  for(var i=0; i<graduates.length; i++){
      var name = graduates[i].name.split(' ');
      var body = {
        firstName: name[0],
        lastName: name[1],
        email: graduates[i].login_id
      };
      updatePlatform(body);
    }
}
// Creates a platform account for users who have passed the "Graduation" course
function updatePlatform(body) {
  //checks that we don't POST more than once to the platform w the same information
  if (emailsDone.indexOf(body.email) >= 0) return;
  emailsDone.push(body.email);

  body.signature = crypto.createHash('sha256').update(body.email + KEYS.platform_secret_key).digest('hex');
  CONSOLE_WITH_TIME('CREATING ACCOUNT FOR: ');
  CONSOLE_WITH_TIME(body);

  throttler({
    url: KEYS.platformUserCreationURL,
    method: 'POST',
    form: body
  }, function (error, res) {
    if (error) {
      CONSOLE_WITH_TIME('Failed to create a platform account: ',error);
    } else {
      CONSOLE_WITH_TIME(body.email + ': ' + res.body);
      notifySlack(body.firstName + ' ' + body.lastName[0]);
    }
  });
}

// HELPER FUNCTIONS

// allows our request function to return promises upon success
function convertIds(text) {
  var regex = /":(\d+),/g;
  var id;
  var ids = [];

  text = text.replace(regex, function (match, id) {
    return '":"' + id + '",';
  });

  return new Promise(function (resolve, reject) {
    resolve(JSON.parse(text));
  });
}

// sets up basic api call functionality
function request(url, method, params) {
  if (!params) {
    params = [];
  }
  params.push("per_page=1000");

  url = 'https://crisistextline.instructure.com/api/v1/' + url;

  if (method == 'GET' && params && params.length > 0) {
    url = url + '?' + params.join('&');
  }

  return fetch(url, {
    headers: {
      'Authorization': KEYS.canvas.api_key,
    },
    method: method,
    body: params
  })
  .then(function (res) { return res.text(); })
  .then(convertIds);
}

// notifies the slack graduation channel w the name of the new graduate
function notifySlack(name) {
  var payload = {
    channel: SLACK_CHANNEL,
    text: 'I just graduated ' + name + '.'
  };

  fetch(KEYS.slackAccountURL, {
    method: 'POST',
    body: JSON.stringify(payload)
  }).catch(function(error) {
    CONSOLE_WITH_TIME('Failed to post to the graduate slack channel: ',error);
  });
}