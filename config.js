var moment = require('moment-timezone');
moment.tz.setDefault("America/New_York");

global.CONSOLE_WITH_TIME = function(){
  var message = '';

  for(var key in arguments){
    if(typeof arguments[key]==='object'){
      message+=JSON.stringify(arguments[key])+ " ";
    } else{
      message+=arguments[key]+ " ";
    }
  }
  console.log('[' + new Date() + ']', message.slice(0, message.length-1));
};

var CONFIG = {};
/**
  Accepts a string returned from WIW formatted like this:
  "Wed, 01 Jun 2016, 12:00:00 -500"
  And converts it to a string with the time zone formatted like this:
  "Wed, 01 Jun 2016, 12:00:00 -0500"

  So that it's Moment() parseable. Otherwise, Moment() fails to parse it,
  and it defaults to creating a date based on the current time. Not good.
  Moment wants this format:
  "ddd, DD MMM YYYY HH:mm:ss ZZ"
**/
global.MAKE_WIW_TIME_STRING_MOMENT_PARSEABLE = function(timestring) {
  // Wed, 01 Jun 2016 12:00:00
  var firstPart = timestring.slice(0, 25).trim();
  // -500
  var timeZonePart =  timestring.slice(-5).trim();
  if (moment(firstPart, 'ddd, DD MMM YYYY HH:mm:ss', true).format() === 'Invalid date') {
    CONSOLE_WITH_TIME('[ERROR] invalid date being parsed with MAKE_WIW_TIME_STRING_MOMENT_PARSEABLE');
    return false;
  }
  if (timeZonePart.length === 4) {
    timeZonePart = timeZonePart.substr(0, 1) + '0' + timeZonePart.substr(1);
  }
  return firstPart + ' ' + timeZonePart;
};

CONFIG.root_dir = __dirname;

CONFIG.locationID = {
  new_graduate: 959290,
  makeup_and_extra_shifts: 1003762,
  regular_shifts: 1003765,
  test: 990385,
  test2: 1007104,
  supervisors: 884473,
  crisis_counselors_demo: 1004215
};

CONFIG.time_interval = {
  // runs every 1 min.
  recur_and_publish_shifts_cron_job_string: '0 */1 * * * *',

  // runs every 20 mins.
  notify_first_shift_cron_job_string: '0 */20 * * * *',

  // runs every five mins.
  time_off_requests_cron_job_string: '0 */5 * * * *',

  // How often do we create new openshifts and merge duplicate openshifts
  open_shifts: '0 0 */2 * * *', // every two hours

  // How often do we notify users to take more shifts
  take_more_shifts_cron_job_string: '30 5 18 * * *', // Every day at 6:05:30 pm

  // Each recurrence chain is 1 year long.
  max_shifts_in_chain: 52,

  // Buffer added to end of chain to ensure that edge cases don't result in skipped weeks.
  chain_buffer_days: 1,

  // Each shift is recurred for 5 years.
  years_to_recur_shift: 5,

  // In looking for newly created shifts to recur, we search 3 weeks from the present.
  weeks_to_search_for_recurred_shifts: 3,

  // While we recur shifts for much longer, they're only published (viewable to the employee) 4 weeks from present.
  weeks_to_publish_recurred_shifts: 4,

  // Used to search for requests to be auto-approved.
  months_to_search_for_time_off_requests: 6,

  // How many days in advance we show open shifts
  days_of_open_shift_display: 15
};

CONFIG.numberOfCounselorsPerShift = {
  'Sun' : { '12am': 64, '2am': 42, '4am': 22, '6am': 10, '8am': 14, '10am': 22, '12pm': 35, '2pm': 34, '4pm': 44, '6pm': 53, '8pm': 74, '10pm': 96},

  'Mon' : { '12am': 84, '2am': 32, '4am': 16, '6am': 11, '8am': 20, '10am': 37, '12pm': 42, '2pm': 45, '4pm': 48, '6pm': 59, '8pm': 96, '10pm': 103},

  'Tue' : { '12am': 95, '2am': 63, '4am': 30, '6am': 16, '8am': 32, '10am': 39, '12pm': 52, '2pm': 56, '4pm': 44, '6pm': 49, '8pm': 68, '10pm': 82},

  'Wed' : { '12am': 57, '2am': 29, '4am': 11, '6am': 9, '8am': 12, '10am': 22, '12pm': 30, '2pm': 38, '4pm': 39, '6pm': 48, '8pm': 67, '10pm': 82},

  'Thu' : { '12am': 28, '2am': 12, '4am': 12, '6am': 8, '8am': 16, '10am': 24, '12pm': 26, '2pm': 37, '4pm': 37, '6pm': 44, '8pm': 60, '10pm': 69},

  'Fri' : { '12am': 49, '2am': 29, '4am': 13, '6am': 8, '8am': 12, '10am': 26, '12pm': 30, '2pm': 35, '4pm': 39, '6pm': 44, '8pm': 64, '10pm': 70},

  'Sat' : { '12am': 58, '2am': 37, '4am': 17, '6am': 8, '8am': 12, '10am': 25, '12pm': 29, '2pm': 33, '4pm': 42, '6pm': 44, '8pm': 61, '10pm': 80}
};

CONFIG.shiftColors = {
  'Sun': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'gray', '8am': 'red', '10am': 'gray', '12pm': 'red', '2pm': 'red', '4pm': 'gray', '6pm': 'gray', '8pm': 'red', '10pm': 'red' },

  'Mon': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'red', '8am': 'gray', '10am': 'gray', '12pm': 'gray', '2pm': 'red', '4pm': 'red', '6pm': 'red', '8pm': 'red', '10pm': 'red' },

  'Tue': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'red', '8am': 'red', '10am': 'red', '12pm': 'red', '2pm': 'red', '4pm': 'gray', '6pm': 'gray', '8pm': 'gray', '10pm': 'gray' },

  'Wed': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'red', '8am': 'gray', '10am': 'gray', '12pm': 'gray', '2pm': 'gray', '4pm': 'red', '6pm': 'gray', '8pm': 'gray', '10pm': 'gray' },

  'Thu': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'gray', '8am': 'gray', '10am': 'gray', '12pm': 'gray', '2pm': 'gray', '4pm': 'gray', '6pm': 'gray', '8pm': 'gray', '10pm': 'gray' },

  'Fri': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'gray', '8am': 'gray', '10am': 'red', '12pm': 'red', '2pm': 'gray', '4pm': 'red', '6pm': 'red', '8pm': 'red', '10pm': 'red' },

  'Sat': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'red', '8am': 'gray', '10am': 'gray', '12pm': 'red', '2pm': 'red', '4pm': 'red', '6pm': 'red', '8pm': 'red', '10pm': 'red' }
};

module.exports = CONFIG;