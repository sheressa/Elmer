var fetch = require('node-fetch');
var fs = require('fs');

var internalRequest = require('request');
var moment = require('moment');
var throttler = require('throttled-request')(internalRequest);
throttler.configure({
  requests: 5,
  milliseconds: 1000
});

var crypto = require('crypto');
var config = require('./config');

var lastRun = lastRunLog();

var SLACK_CHANNEL = '#graduates';

var t = 0;

// Polls Canvas for people who’ve passed the "Graduation" course
request('accounts/' + config.canvas.accountID + '/courses', 'GET')
  .then(function (courses) {
    courses.forEach(function (course) {
      /**
        Excluding courses that we don’t need to parse for graduations, because they’re either test courses or not related to CTL training.
      **/
      if (config.canvas.coursesWeDoNotParseForGraduatedUsers.indexOf(course.id) >= 0) return;
      request('courses/' + course.id + '/assignments', 'GET')
        .then(function (assignments) {
          return assignments.filter(function (e) {
            return e.name.indexOf('Graduation') >= 0;
          });
        })
        .then(function (assignments) {
          lastRunLog(moment());
          assignments.forEach(function (assignment) {
            setTimeout(getLogs.bind(this, assignment), t);
            t += 1000;
          })
        });
    });
  });

emailsDone = [];

function getLogs(assignment) {
  consoleWithTime('Graduating from assignment: ' + assignment.id);
  request('audit/grade_change/assignments/' + assignment.id, 'GET', [
      'start_time=' + lastRun.format('YYYY-MM-DD[T]HH:mm:ss[Z]')
    ])
      .then(function (logs) {
        logs.events.forEach(function (log) {
          var m = moment(log.created_at, moment.ISO_8601);

          if (m.diff(lastRun) >= 0) {
            request('users/' + log.links.student + '/profile', 'GET').then(function (res) {
              if (res.primary_email) {
                var name = res.sortable_name.split(', ');

                var body = {
                  firstName: name[1],
                  lastName: name[0],
                  email: res.primary_email.toLowerCase()
                };

                updatePlatform(body);
              }
            });
          }
        });
      }).catch(function (e) {
        if (e.toString().indexOf('TypeError') >= 0) {
          consoleWithTime('Throttled, retrying in 1 second: ' + assignment.id);
          setTimeout(getLogs.bind(this, assignment), 1000);
        }
      });
}

// Creates a platform account for users who have passed "Graduation" course
function updatePlatform(body) {
  if (emailsDone.indexOf(body.email) >= 0) return;
  emailsDone.push(body.email);

  body.signature = crypto.createHash('sha256').update(body.email + config.platform_secret_key).digest('hex');
  consoleWithTime('CREATING ACCOUNT FOR: ');
  consoleWithTime(body);

//  return;
  throttler({
    url: config.platformUserCreationURL,
    method: 'POST',
    form: body
  }, function (err, res) {
    if (err) {
      consoleWithTime(err);
    } else {
      consoleWithTime(body.email + ': ' + res.body);
      notifySlack(body.firstName + ' ' + body.lastName[0]);
    }
  });
}

function lastRunLog(date) {
  if (!date) {
    return moment(fs.readFileSync('./last-run.txt', {encoding: 'UTF8'}), 'x');
  } else {
    fs.writeFileSync('./last-run.txt', date.format('x'));
  }
}

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
      'Authorization': 'Bearer ' + config.canvas.accountToken,
    },
    method: method,
    body: params
  })
  .then(function (res) { return res.text(); })
  .then(convertIds);
}

function notifySlack(name) {
  var payload = {
    channel: SLACK_CHANNEL,
    text: 'I just graduated ' + name + '.'
  };

  fetch(config.slackAccountURL, {
    method: 'POST',
    body: JSON.stringify(payload)
  }).catch(e => {
    consoleWithTime(e);
  });
}
