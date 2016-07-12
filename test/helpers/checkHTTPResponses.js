/**
  This file was created in order to attain sample data from WiW for use 
  with testing. Modify the get request below as desired and retrieved data will 
  be written to sampleResponse. 
**/
'use strict';

const moment = require('moment-timezone');
const fs = require('fs');

global.KEYS = require('../../keys.js');
global.CONFIG = require('../../config.js');
const WhenIWork = CONFIG.WhenIWork;
const dateFormat = 'YYYY-MM-DD HH:mm:ss';

sendRequest('requests', timeOffRequests());
sendRequest('users', usersRequests());
sendRequest('shifts', shiftsRequests());

function timeOffRequests() {
  //Using moment.js to format time as WIW expects
  const startDateToRetrieveRequests = moment().format(dateFormat);
  const endDateToRetrieveRequests = moment()
    .add(CONFIG.time_interval.months_to_search_for_time_off_requests, 'months')
    .format(dateFormat);
  const timeOffSearchParams = {
    start: startDateToRetrieveRequests,
    end: endDateToRetrieveRequests,
  };

  return timeOffSearchParams;
}

function usersRequests() {
  const usersSearchParams = {
    location_id: CONFIG.locationID.regular_shifts
  };

  return usersSearchParams;
}

function shiftsRequests() {
  const query = {
    location_id: CONFIG.locationID.regular_shifts,
    end: '+' + CONFIG.time_interval.days_of_open_shift_display + ' days'
  };

  return query;
}

function sendRequest (term, params) {
  //Get all time off requests within timeOffSearchParams
  WhenIWork.get(term, params, function(response) {
    console.log(`${term} returns ${response}`);
    fs.writeFile(`sampleResponse/httpResponse1${capitalizeFirstLetter(term)}.json`, 
                 JSON.stringify(response), (err) => {
      if (err) console.log(err);
      console.log('It\'s saved!');
    });
  });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/** Started working on creating new users for Kaley 
// var newUser = {
//   role: 3,
//   email: "admin+wheeliecj@gmail.com@crisistextline.org",
//   first_name: "Carlie",
//   last_name: "Wheeler",
//   activated: true,
//   locations: [CONFIG.locationID.regular_shifts, CONFIG.locationID.makeup_and_extra_shifts],
//   password: KEYS.wheniwork.default_password,
//   notes: JSON.stringify({ canonicalEmail: 'wheeliecj@gmail.com'})
// };
// api.post('users', newUser, function (data) {
//   var api2 = new WhenIWork(KEYS.wheniwork.api_key, altEmail, KEYS.wheniwork.default_password, function (data) {
//   });

//   var alert = {sms: false, email: false};
//   var alerts = ['timeoff', 'swaps', 'schedule', 'reminders', 'availability', 'new_employee', 'attendance'];
//   var postBody = {};

//   for (var i in alerts) {
//     postBody[alerts[i]] = alert;
//   }

//   callback(data);
//   api2.post('users/alerts', postBody, function () {});
//   api2.post('users/profile', {email: email}, function (profile) {
//     callback(profile.user);
//   });
// });
**/