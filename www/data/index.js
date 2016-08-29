'use strict';
const request = require('request-promise');
const express = require('express');
const router = express.Router();
const timeOffRequests = require(`${CONFIG.root_dir}/tasks/timeOffRequests.js`).timeOffRequests;
const helpers = require('./helpers.js');

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


router.get('/wiw/timeoff', function (req, res) {
  const options = {
    endTimeDate: req.query.endTimeDate,
    daysBack: req.query.daysBack,
  };
  timeOffRequests(options, (CSVString) => {
    res.send(CSVString);
  });
});

router.get('/platform/MIA2WeeksLastLogin', function (req, res) {
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
  .then(helpers.convertJsonToCSV)
  .then(CSVString => {
    res.send(CSVString);
  })
  .catch(err => {
    res.status(500).send(`There was an error retrieving MIA2WeeksLastLogin` +
      ` from platform: ${err}`);
  });
});

router.get('/MIA2WeeksWithoutTimeoff', function (req, res) {
  helpers.getUsersFilterRequestedTimeOff()
  .then(helpers.convertJsonToCSV)
  .then(CSVString => {
    res.send(CSVString);
  })
  .catch(err => {
    res.status(500).send(`There was an error retrieving MIA2WeeksWithoutTimeoff` +
      ` from platform and or WiW: ${err}`);
  });
});

router.post('/email/MIA2WeeksWithoutTimeoff', function (req, res) {
  // Array of 'users' objects that contain first_name, last_name, email 
  if (req.body.users){
    helpers.doNotContact()
    .then(doNotContactObj => {
      res.send(send2WeeksMissedEmail(req.body.users.filter(user => !doNotContactObj[user.email])));
    });
  } 
  else {
    res.status(500).send('No users array included');
    // TODO enable this when email copy and filter criteria are complete
    // helpers.filteredUsersToEmail()
    // .then(send2WeeksMissedEmail)
    // // This might be an oversized response
    // .then(emailsSent => {
    //   res.send(emailsSent);
    // })
    // .catch(err => {
    //   res.status(500).send(err);
    // });
  }
});

function send2WeeksMissedEmail (usersToEmail) {
  return usersToEmail.map(helpers.compose2WeekEmailAndSend);
}

module.exports = {router};