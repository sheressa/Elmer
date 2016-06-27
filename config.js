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

CONFIG.WhenIWork = process.env.NODE_ENV === 'test' ? require('./test/helpers/base') : require('./jobs/scheduling/base');

CONFIG.root_dir = __dirname;

CONFIG.locationID = {
  new_graduate: 959290,
  makeup_and_extra_shifts: 1003762,
  regular_shifts: 1003765,
  test: 990385,
  test2: 1007104,
  supervisors: 884473,
  supervisor_on_platform: 995815
};

CONFIG.wiwAccountID = {
  CCs: 549781,
  supervisors: 622060,
};

//used in AttendanceSync.js to check whether trainees attended a GTW webinar for a minimum of 90 minutes = 5400 seconds
CONFIG.GTW_attendance_minimum = 5400;
//used in AttendanceSync.js to set the hour range over which we query GTW sessions
CONFIG.GTW_time_range_query = 72;

CONFIG.time_interval = {
  // runs every day at 5am
  gtw_attendance_sync_with_canvas:'0 0 5 * * *',
  // runs every 1 min.
  recur_and_publish_shifts_cron_job_string: '0 */1 * * * *',

  // runs every 20 mins.
  notify_first_shift_cron_job_string: '0 */20 * * * *',

  // runs every five mins.
  time_off_requests_cron_job_string: '0 */5 * * * *',

  // How often do we create new openshifts and merge duplicate openshifts
  open_shifts: '0 0 */2 * * *', // every two hours

  // Runs twice a day / every twelve hours
  cron_twice_per_day: '0 0 */12 * * *',

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
  days_of_open_shift_display: 15,

  // Number of days in a week
  one_week: 7
};

CONFIG.numberOfCounselorsPerShift = {
  'Sun' : { '12am': 66, '2am': 41, '4am': 24, '6am': 10, '8am': 14, '10am': 25, '12pm': 38, '2pm': 49, '4pm': 43, '6pm': 55, '8pm': 76, '10pm': 101},

  'Mon' : { '12am': 81, '2am': 43, '4am': 16, '6am': 11, '8am': 19, '10am': 29, '12pm': 42, '2pm': 45, '4pm': 50, '6pm': 68, '8pm': 111, '10pm': 171},

  'Tue' : { '12am': 172, '2am': 64, '4am': 30, '6am': 18, '8am': 49, '10am': 40, '12pm': 52, '2pm': 58, '4pm': 47, '6pm': 55, '8pm': 66, '10pm': 81},

  'Wed' : { '12am': 70, '2am': 31, '4am': 9, '6am': 10, '8am': 16, '10am': 28, '12pm': 29, '2pm': 48, '4pm': 49, '6pm': 58, '8pm': 76, '10pm': 99},

  'Thu' : { '12am': 65, '2am': 35, '4am': 18, '6am': 9, '8am': 19, '10am': 28, '12pm': 28, '2pm': 42, '4pm': 41, '6pm': 43, '8pm': 65, '10pm': 71},

  'Fri' : { '12am': 55, '2am': 30, '4am': 12, '6am': 8, '8am': 13, '10am': 28, '12pm': 32, '2pm': 36, '4pm': 43, '6pm': 47, '8pm': 68, '10pm': 76},

  'Sat' : { '12am': 66, '2am': 39, '4am': 16, '6am': 10, '8am': 14, '10am': 23, '12pm': 29, '2pm': 35, '4pm': 40, '6pm': 51, '8pm': 66, '10pm': 79}
};

CONFIG.shiftColors = {
  'Sun': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'red', '8am': 'gray', '10am': 'red', '12pm': 'red', '2pm': 'red', '4pm': 'gray', '6pm': 'gray', '8pm': 'red', '10pm': 'red' },

  'Mon': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'red', '8am': 'gray', '10am': 'gray', '12pm': 'red', '2pm': 'red', '4pm': 'gray', '6pm': 'gray', '8pm': 'red', '10pm': 'gray' },

  'Tue': { '12am': 'red', '2am': 'red', '4am': 'gray', '6am': 'gray', '8am': 'red', '10am': 'gray', '12pm': 'red', '2pm': 'red', '4pm': 'gray', '6pm': 'gray', '8pm': 'red', '10pm': 'red' },

  'Wed': { '12am': 'red', '2am': 'red', '4am': 'gray', '6am': 'red', '8am': 'red', '10am': 'red', '12pm': 'gray', '2pm': 'gray', '4pm': 'red', '6pm': 'gray', '8pm': 'gray', '10pm': 'gray' },

  'Thu': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'gray', '8am': 'gray', '10am': 'gray', '12pm': 'gray', '2pm': 'gray', '4pm': 'gray', '6pm': 'gray', '8pm': 'gray', '10pm': 'gray' },

  'Fri': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'gray', '8am': 'gray', '10am': 'red', '12pm': 'red', '2pm': 'gray', '4pm': 'red', '6pm': 'red', '8pm': 'red', '10pm': 'red' },

  'Sat': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'red', '8am': 'gray', '10am': 'gray', '12pm': 'red', '2pm': 'red', '4pm': 'red', '6pm': 'red', '8pm': 'red', '10pm': 'red' }
};

module.exports = CONFIG;
