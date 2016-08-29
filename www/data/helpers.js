'use strict';
const moment = require('moment');
const request = require('request-promise');
const getJSONTimeoff = require(`${CONFIG.root_dir}/api_wiw/WiWRequests`).getTimeoff;
const gSheets = require(`${CONFIG.root_dir}/www/data/googleSheets.js`);
const mandrill = require('mandrill-api/mandrill');
const mandrillClient = new mandrill.Mandrill(KEYS.mandrill.api_key);
// TODO compose mail_templates/compose2WeekMissedEmail!
const composeEmail = require(`${CONFIG.root_dir}/email_templates/compose2WeekMissedEmail`);

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

function doNotContact () {
  return gSheets.getGsheetRange(KEYS.gSheets.sheetIds.babyCRM, 'No Contact List', 'A2:A')
  .then(res => {
    const doNotContactObject = {};
    res.values.forEach(row => {
      doNotContactObject[row[0]] = 'NoContact';
    });
    return doNotContactObject;
  })
  .catch(err => CONSOLE_WITH_TIME(`There was an error retrieving No Contact List!A2:A from` + 
                                  ` sheet ${KEYS.gSheets.sheetIds.babyCRM}: ${err}`));
}

function compose2WeekEmailAndSend (user) {
  const message = {
    subject: 'We miss you!',
    html: composeEmail(user) + user.email,
    from_email: 'support@crisistextline.org',
    from_name: 'Crisis Text Line',
    to: [{
        email: 'apackin@gmail.com',
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

function filteredUsersToEmail () {
  return Promise.all([
      getUsersFilterRequestedTimeOff(),
      doNotContact()
    ]).then(res => {
      const usersWithNoExcuses = res[0];
      const doNotContactObj = res[1];
      return usersWithNoExcuses.filter(user => {
        // TODO determine how far back we want to go with these emails (30 is for draft)
        return moment().diff(moment(user.last_login, 'MM/DD/YYYY'), 'days') < 30 &&
          !doNotContactObj[user.email];
      });
    });
}

module.exports = {
  convertJsonToCSV, 
  getUsersFilterRequestedTimeOff, 
  doNotContact, 
  compose2WeekEmailAndSend,
  filteredUsersToEmail
};