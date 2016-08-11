'use strict';
const moment = require('moment');
const request = require('request-promise');
const express = require('express');
const router = express.Router();
const getJSONTimeoff = require(CONFIG.root_dir + '/api_wiw/WiWRequests').getTimeoff;

const timeOffRequests = require(`${CONFIG.root_dir}/tasks/timeOffRequests.js`).timeOffRequests;
router.get('/wiw/timeoff', function (req, res) {
  const options = {
    endTimeDate: req.query.endTimeDate,
    daysBack: req.query.daysBack,
  };
  if (KEYS.dataRoute && req.query.token === KEYS.dataRoute) {
    timeOffRequests(options, (CSVString) => {
      res.send(CSVString);
    });
  }
  else res.status(403).send('Access denied.');
});

router.get('/wiw/Mia2WeeksLastLogin', function (req, res) {
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

  if (KEYS.dataRoute && req.query.token === KEYS.dataRoute) {
    request(options)
    .then(response => {
      return convertJsonToCSV(response);
    })
    .then(CSVString => {
      res.send(CSVString);
    })
    .catch(err => {
      res.status(500).send(err);
    });
  }
  else res.status(403).send('Access denied.');
});

router.get('/wiw/Mia2WeeksWithoutTimeoff', function (req, res) {
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

  if (KEYS.dataRoute && req.query.token === KEYS.dataRoute) {
    const now = moment();
    Promise.all([
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
      const usersWithNoExcuse = responses[1].filter(user => {
        return !usersWhoRequestTimeOff[user.email];
      });

      return convertJsonToCSV(usersWithNoExcuse);
    })
    .then(CSVString => {
      res.send(CSVString);
    })
    .catch(err => {
      console.log('err', err);
      res.status(500).send(err);
    });
  }
  else res.status(403).send('Access denied.');
});

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