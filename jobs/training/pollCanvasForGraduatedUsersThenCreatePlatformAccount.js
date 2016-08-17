'use strict';
var fetch = require('node-fetch');
var crypto = require('crypto');
var internalRequest = require('request');
var moment = require('moment');
var throttler = require('throttled-request')(internalRequest);
var CronJob = require('cron').CronJob;
var SLACK_CHANNEL = '#graduates';
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
  notifySlack({message: 'If anyone graduated within the last 6 hours, their names will appear below!'});
  request('accounts/' + KEYS.canvas.accountID + '/courses', 'GET')
  .then(function (courses) {
    courses.forEach(function (course) {
    /**
      Excluding courses that we don’t need to parse for graduations, because they’re either test courses or not related to CTL training.
    **/
      if (KEYS.canvas.coursesWeDoNotParseForGraduatedUsers.indexOf(course.id) >= 0) return;
      request('/audit/grade_change/courses/'+course.id, 'GET')
      .then(function(gradebook){
          var assignments = gradebook.linked.assignments;
          var platformReadyId;
          var finalExamId;
        for(var i = 0; i<assignments.length; i++){
          if (assignments[i].name.indexOf(CONFIG.canvas.assignments.finalExam)>=0){
            finalExamId = assignments[i].quiz_id; 
          }
          if (assignments[i].name.indexOf(CONFIG.canvas.assignments.platformReady)>=0){
            platformReadyId = assignments[i].id; 
          }
          if(i===assignments.length-1 && finalExamId && platformReadyId){
            var ids = {courseId: assignments[i].course_id, finalExamId: finalExamId, platformReadyId: platformReadyId}
            platformReadyChecker(gradebook, ids);
            return;
          }
        }
      })
      .catch(function (error) {
        CONSOLE_WITH_TIME('Call to Canvas to get grade logs for course ' +course.id+' has failed, error: ', error);
        });
      });
  })
  .catch(function (error) {
    CONSOLE_WITH_TIME('Call to Canvas to get courses has failed, error: ', error);
  });  
}

//checks whether a student is platform ready
function platformReadyChecker(gradebook, ids){
  var events = gradebook.events;
  var startDate = moment().subtract(6, 'hours');
  var platformReady = {};
  //check if a user graduated within the last 6 hours 
  events.forEach(function(event){
    if (event.links.assignment==ids.platformReadyId && startDate.isBefore(event.created_at)){
      platformReady[event.links.student]='student';
    }
  });
  //check if the users got 85+ on final exam
  finalExamChecker(platformReady, ids.finalExamId, ids.courseId, gradebook.linked.users);
}

//checks whether a student got 85+ on final exam
function finalExamChecker(studentObj, finalExamId, courseId, users){
  request('courses/' +courseId+ '/quizzes/' + finalExamId+'/submissions', 'GET')
  .then(function (quizzes) {
    quizzes.quiz_submissions.forEach(function(quiz){
      if(studentObj[quiz.user_id] && quiz.score<85) {
          delete studentObj[quiz.user_id];
        }
    });
      return studentObj;
  })
  .then(function(students){
    users.forEach(function(user){
      if (students[user.id]) createEmail(user);
    });
  })
  .catch(function (error) {
    CONSOLE_WITH_TIME('Call to Canvas for quiz logs has failed, error: ', error);
  });
}

// creates the body of a platform post request
function createEmail(student) {
  CONSOLE_WITH_TIME('Graduating user ', student);
  var name = student.name.split(' ');
  var body = {
    firstName: name[0],
    lastName: name[1],
    email: student.login_id
  };
  updatePlatform(body);
    
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
  params.push('per_page=1000');

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
  };
  if (name.message) payload.text = name.message;
  else payload.text = 'I just graduated ' + name +'.';

  fetch(KEYS.slackAccountURL, {
    method: 'POST',
    body: JSON.stringify(payload)
  }).catch(function(error) {
    CONSOLE_WITH_TIME('Failed to post to the graduate slack channel: ',error);
  });
}