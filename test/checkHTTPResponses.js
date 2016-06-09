var moment = require('moment-timezone');
var fs = require('fs');

var wIW = require('wheniwork-unofficial');
var KEYS = require('../keys.js');
var CONFIG = require('../config.js');
var WhenIWork = new wIW(KEYS.wheniwork.api_key, KEYS.wheniwork.username, KEYS.wheniwork.password);

var date_format = 'YYYY-MM-DD HH:mm:ss';

timeOffRequests();

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

  //Get all time off requests within timeOffSearchParams
  WhenIWork.get('requests', timeOffSearchParams, function(response) {
    console.log('response: ', response);
    fs.writeFile('httpResponse.json', JSON.stringify(response), (err) => {
      if (err) throw err;
      console.log('It\'s saved!');
    });
  });
}