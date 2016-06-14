/**
  This file was created in order to attain sample data from WiW for use 
  with testing. Modify the get request below as desired and retrieved data will 
  be written to httpResonse.json. 
**/

var moment = require('moment-timezone');
var fs = require('fs');

var wIW = require('wheniwork-unofficial');
var KEYS = require('../../keys.js');
var CONFIG = require('../../config.js');
var WhenIWork = new wIW(KEYS.wheniwork.api_key, KEYS.wheniwork.username, KEYS.wheniwork.password);

var date_format = 'YYYY-MM-DD HH:mm:ss';

// sendRequest('request', timeOffRequests());
// sendRequest('users', usersRequests());
sendRequest('shifts', shiftsRequests());


function timeOffRequests() {
  //Using moment.js to format time as WIW expects
  var startDateToRetrieveRequests = moment().format(date_format);
  var endDateToRetrieveRequests = moment()
    .add(CONFIG.time_interval.months_to_search_for_time_off_requests, 'months')
    .format(date_format);
  var timeOffSearchParams = {
    "start": startDateToRetrieveRequests,
    "end": endDateToRetrieveRequests,
  };

  return timeOffSearchParams;
}

function usersRequests() {
  var usersSearchParams = {
    location_id: CONFIG.locationID.test
  };

  return usersSearchParams;
}

function shiftsRequests() {
  var query = {
    location_id: CONFIG.locationID.regular_shifts,
    end: '+' + CONFIG.time_interval.days_of_open_shift_display + ' days'
  };

  return query;
}

function sendRequest (term, params) {
  //Get all time off requests within timeOffSearchParams
  WhenIWork.get(term, params, function(response) {
    console.log(`${term} returns ${response}`);
    fs.writeFile('httpResponse.json', JSON.stringify(response), (err) => {
      if (err) throw err;
      console.log('It\'s saved!');
    });
  });


}