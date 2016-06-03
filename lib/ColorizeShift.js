var moment = require('moment')
  , shiftColors = require('../config').shiftColors;

var WIWDateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ'
  , red  = 'D61F27'
  , lightGray = 'cccccc'
  , darkGray = '5e5e5e'
  ;

/**
 * If start_time is undefined, this function will search the
 * shiftToColorize for start_time. Otherwise, for the case where
 * we're doing a shift update and therefore not passing in an
 * entire shift, we will check the second parameter.
 */
function go(shiftToColorize, startTime, isMakeup) {
  var gray = (isMakeup) ? lightGray : darkGray
    , colors = {
        red : red,
        gray : gray
      };

  if (typeof startTime == 'undefined' || startTime == null) {
    startTime = moment(shiftToColorize.start_time, WIWDateFormat);
  } else {
    startTime = moment(startTime, WIWDateFormat);
  }

  var day = startTime.format('ddd');
  var time = startTime.format('ha');

  if (shiftColors[day] && shiftColors[day][time]) {
    shiftToColorize.color = colors[shiftColors[day][time]];
  }

  return shiftToColorize;
};

module.exports = {
  'go' : go,
  'red' : 'D61F27',
  'lightGray' : 'cccccc',
  'darkGray' : '5e5e5e'
};