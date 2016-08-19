'use strict';
const moment = require('moment');
const request = require('request-promise');
const express = require('express');
const router = express.Router();
const getJSONTimeoff = require(`${CONFIG.root_dir}/api_wiw/WiWRequests`).getTimeoff;
// TODO create mail_templates/compose2WeekEmail!
const composeEmail = require(`${CONFIG.root_dir}/email_templates/compose2WeekMissedEmail`);

// TODO move this to a different file
var mandrill = require('mandrill-api/mandrill');
var mandrillClient = new mandrill.Mandrill(KEYS.mandrill.api_key);

router.use(function (req, res, next) {
    if (checkToken(req.query.token)) {
        return next();
    }
    else res.status(403).send('Access denied.');
});

function checkToken (token) {
  // added 'KEYS.dataRoute &&' to make sure that key has been set
  return (KEYS.dataRoute && token === KEYS.dataRoute);
}

const timeOffRequests = require(`${CONFIG.root_dir}/tasks/timeOffRequests.js`).timeOffRequests;

router.get('/wiw/timeoff', function (req, res) {
  const options = {
    endTimeDate: req.query.endTimeDate,
    daysBack: req.query.daysBack,
  };
  timeOffRequests(options, (CSVString) => {
    res.send(CSVString);
  });
});

router.get('/platform/Mia2WeeksLastLogin', function (req, res) {
  const options = {
    uri: 'https://app.crisistextline.org/ajax/stats/absentees',
    qs: {
        token: KEYS.platform_secret_key
    },
    headers: {
        'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
  };

  request(options)
  .then(convertJsonToCSV)
  .then(CSVString => {
    res.send(CSVString);
  })
  .catch(err => {
    res.status(500).send(err);
  });
});

router.get('/Mia2WeeksWithoutTimeoff', function (req, res) {
  getUsersFilterRequestedTimeOff()
  .then(convertJsonToCSV)
  .then(CSVString => {
    res.send(CSVString);
  })
  .catch(err => {
    res.status(500).send(err);
  });
});

router.post('/email/Mia2WeeksWithoutTimeoff', function (req, res) {
  // This will be an optional array of user objects that contain first_name, last_name, email 
  if (req.body.users){
    send2WeeksMissedEmail(req.body.users);
  } 
  else {
    getUsersFilterRequestedTimeOff()
    .then(usersWithNoExcuses => {
      return usersWithNoExcuses.filter(user => {
        return moment().diff(moment(user.last_login, 'MM/DD/YYYY'), 'days') < 30;
      });
    }).then(send2WeeksMissedEmail)
    // This might be a lot to send;
    .then(res.send)
    .catch(err => {
      res.status(500).send(err);
    });
  }
});

function send2WeeksMissedEmail (usersToEmail) {
  return usersToEmail.map(compose2WeekEmailAndSend);
}

function compose2WeekEmailAndSend (user) {
  var message = {
    subject: 'We miss you!',
    html: composeEmail(user),
    from_email: 'support@crisistextline.org',
    from_name: 'Crisis Text Line',
    to: [{
        email: user.email,
        name: user.first_name + ' ' + user.last_name,
        type: 'to'
    }],
    headers: {
        "Reply-To": "support@crisistextline.org",
    }
  };

  mandrillClient.messages.send({message: message}, CONSOLE_WITH_TIME);

  return {user, message};
}

function getUsersFilterRequestedTimeOff () {
  const dateFormat = 'YYYY-MM-DD HH:mm:ss';
  const options = {
    uri: 'https://app.crisistextline.org/ajax/stats/absentees',
    qs: {
        token: KEYS.platform_secret_key
    },
    headers: {
        'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
  };
  const now = moment();
  return Promise.all([
  getJSONTimeoff({
    end: now.format(dateFormat),
    start: now.subtract(14, 'days').format(dateFormat)
  }),
  request(options)])
  .then(responses => {
    const usersWhoRequestTimeOff = {};
    let user;
    for (let key in responses[0].allUsers) {
      user = responses[0].allUsers[key];
      const email = /canonicalEmail/.test(user.notes) ? 
        JSON.parse(user.notes).canonicalEmail : 
        user.email;
      usersWhoRequestTimeOff[email] = 1;
    }
    return responses[1].filter(user => {
      return !usersWhoRequestTimeOff[user.email];
    });
  });
}

function convertJsonToCSV(JSONarray) {
  let CSVFormattedString = '';
  let values;
  let value;
  let elem;

  for (let keys in JSONarray) {
    elem = JSONarray[keys];
    // Start by adding the keys to the CSVFormattedString;
    if (!CSVFormattedString.length) {
      CSVFormattedString += Object.keys(elem).join(',');
      CSVFormattedString += '\n';
    }
    
    // For each elem add the properties to the CSV string
    values = [];
    for (let k in elem) {
      if (elem.hasOwnProperty(k)) { 
        value = `${elem[k]}`;
        values.push(value.replace(/,/g, ''));
      }
    }
    CSVFormattedString += `${values.join(',')}\n`;
  }
  return CSVFormattedString;
}

module.exports = {router};