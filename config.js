'use strict';
const moment = require('moment-timezone');
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
  console.log('[' + moment().format('llll Z') + ']', message.slice(0, message.length-1));
};

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

const CONFIG = {};

CONFIG.emails = {
  mariya: 'mariya@crisistextline.org'
}

CONFIG.WhenIWork = process.env.NODE_ENV === 'test' ?
  require('./test/helpers/base') :
  require('./api_wiw/WiWCCApi');

CONFIG.WhenIWorkDynamic = process.env.NODE_ENV === 'test' ?
  require('./test/helpers/secondAPI') :
  require('./api_wiw/WiWDynamic');

CONFIG.WhenIWorkSuper = process.env.NODE_ENV === 'test' ?
  require('./test/helpers/mockWiWSupervisors') :
  require('./api_wiw/WiWSuperApi');

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

CONFIG.canvas = {
  // String represents the name of the assignment in Canvas gradebook.
  assignments: {
    attendedFirstShift: 'Attend First Shift',
    scheduledShifts: 'Schedule Your Shifts',
    platformReady: 'Platform Ready!',
    webinarAttended: 'Checkpoint #8: Attend an Observation',
    scheduleWebinar: 'Schedule Your Observation',
    finalExam: 'Final Exam',
  },
  passingScores: {
    final: 60
  }
};

//These are the cohorts, starting at 23, that we want to look at for melts.
CONFIG.cohort23AndLater = 100;

//used in AttendanceSync.js to check whether trainees attended a GTW webinar for a minimum of 90 minutes = 5400 seconds
CONFIG.GTW_attendance_minimum = 5400;
//used in AttendanceSync.js to set the hour range over which we query GTW sessions
CONFIG.GTW_time_range_query = 72;

CONFIG.WiWUserNotes = {
  shiftNotification: 'firstShiftNotification'
};

CONFIG.time_interval = {
  // runs every day at 5am
  gtw_attendance_sync_with_canvas:'0 15 23 * * *',
  // runs every 1 min.
  recur_and_publish_shifts_cron_job_string: '0 */1 * * * *',
  // runs every day
  pending_users: '* * * */1 * *',
  // runs every 20 mins.
  notify_first_shift_cron_job_string: '0 */20 * * * *',

  // runs every five mins.
  time_off_requests_cron_job_string: '0 */5 * * * *',

  // How often do we create new openshifts and merge duplicate openshifts
  openShifts: '0 0 */2 * * *', // every two hours

  // Runs twice a day / every twelve hours
  cron_twice_per_day: '0 0 */12 * * *',

  // How often do we notify users to take more shifts
  take_more_shifts_cron_job_string: '30 5 18 * * *', // Every day at 6:05:30 pm

  // How often we check for graduated users in canvas and create platform accounts for them.
  graduate_users_cron_job_string: '0 0 */1 * * *', // Every hour.

  //Outputs data on melted users and posts it to Slack
  melted_users_on_slack_cron_job_string: '0 0 10 * * 3', // Every Wednesday at 10:00 AM

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

  // How many days until we consider users no longer new--we use this in checking for new WiW users who have booked first shifts
  days_until_older_user: 21,

  // Number of days in a week
  one_week: 7,

  // Number of days in the future to dump shifts for
  dumpShiftsDays: 28,
};

CONFIG.numberOfCounselorsPerShift = {
  'Sun' : { '12am': 95, '2am': 69, '4am': 45, '6am': 29, '8am': 37, '10am': 39, '12pm': 58, '2pm': 55, '4pm': 56, '6pm': 74, '8pm': 84, '10pm': 113},

  'Mon' : { '12am': 110, '2am': 62, '4am': 43, '6am': 27, '8am': 32, '10am': 48, '12pm': 64, '2pm': 56, '4pm': 70, '6pm': 76, '8pm': 84, '10pm': 102},

  'Tue' : { '12am': 138, '2am': 61, '4am': 38, '6am': 29, '8am': 36, '10am': 41, '12pm': 51, '2pm': 60, '4pm': 60, '6pm': 60, '8pm': 83, '10pm': 111},

  'Wed' : { '12am': 116, '2am': 76, '4am': 43, '6am': 35, '8am': 32, '10am': 43, '12pm': 50, '2pm': 60, '4pm': 67, '6pm': 55, '8pm': 83, '10pm': 119},

  'Thu' : { '12am': 103, '2am': 73, '4am': 41, '6am': 30, '8am': 42, '10am': 50, '12pm': 55, '2pm': 64, '4pm': 58, '6pm': 64, '8pm': 83, '10pm': 107},

  'Fri' : { '12am': 95, '2am': 58, '4am': 40, '6am': 28, '8am': 29, '10am': 36, '12pm': 53, '2pm': 70, '4pm': 74, '6pm': 71, '8pm': 75, '10pm': 103},

  'Sat' : { '12am': 86, '2am': 59, '4am': 36, '6am': 30, '8am': 34, '10am': 43, '12pm': 49, '2pm': 55, '4pm': 60, '6pm': 71, '8pm': 86, '10pm': 99}
};

CONFIG.shiftColors = {
  'Sun': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'gray', '8am': 'gray', '10am': 'gray', '12pm': 'gray', '2pm': 'gray', '4pm': 'gray', '6pm': 'gray', '8pm': 'gray', '10pm': 'gray' },

  'Mon': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'red', '8am': 'gray', '10am': 'gray', '12pm': 'gray', '2pm': 'gray', '4pm': 'gray', '6pm': 'gray', '8pm': 'gray', '10pm': 'gray' },

  'Tue': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'gray', '8am': 'gray', '10am': 'gray', '12pm': 'gray', '2pm': 'gray', '4pm': 'gray', '6pm': 'gray', '8pm': 'gray', '10pm': 'gray' },

  'Wed': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'red', '8am': 'gray', '10am': 'gray', '12pm': 'gray', '2pm': 'gray', '4pm': 'gray', '6pm': 'gray', '8pm': 'gray', '10pm': 'gray' },

  'Thu': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'gray', '8am': 'gray', '10am': 'gray', '12pm': 'gray', '2pm': 'gray', '4pm': 'gray', '6pm': 'gray', '8pm': 'gray', '10pm': 'gray' },

  'Fri': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'gray', '8am': 'gray', '10am': 'gray', '12pm': 'red', '2pm': 'gray', '4pm': 'gray', '6pm': 'red', '8pm': 'gray', '10pm': 'gray' },

  'Sat': { '12am': 'red', '2am': 'red', '4am': 'red', '6am': 'red', '8am': 'gray', '10am': 'red', '12pm': 'gray', '2pm': 'gray', '4pm': 'red', '6pm': 'gray', '8pm': 'gray', '10pm': 'red' }
};

module.exports = CONFIG;
