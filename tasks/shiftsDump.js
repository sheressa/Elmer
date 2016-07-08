'use strict';

const moment = require('moment');
const api = CONFIG.WhenIWork;
const fs = require('fs');
const stathat = require(CONFIG.root_dir + '/lib/stathat');

/* 
  To run this task: node console shiftsDump go
    Returns a csv (written to file) of all shifts data from Wiw.
*/

module.exports.go = function () {
  Promise.all(getShifts())
  .then(mergeResponses)
  .then(reformatForCSV)
  .then(exportCSV)
  .catch(function(err){
    CONSOLE_WITH_TIME(err);
  });
};

function getShifts () {
  const options = {};
  const promiseArray = [];

  const firstDayOfYear = moment(new Date(2016, 0, 1));
  let totalDaysBack = firstDayOfYear.diff(moment(), 'days'); 

  // When we request too many days at a time WiW times out
  // To fix we are breaking it up into seperate request for every 30 days
  while (totalDaysBack+30<CONFIG.time_interval.dumpShiftsDays) {
      options.start = `${totalDaysBack} days`;
      totalDaysBack+=30;
      options.end = totalDaysBack<0 ?
        `${totalDaysBack} days`:
        `+${totalDaysBack} days`;

      promiseArray.push(getShiftsPromise(options));
  }

  options.start = `+${totalDaysBack} days`;
  options.end = `+${CONFIG.time_interval.dumpShiftsDays} days`;
  promiseArray.push(getShiftsPromise(options));

  return promiseArray;
  
}

function getShiftsPromise (options) {
  const query = {
    location_id: [CONFIG.locationID.regular_shifts, CONFIG.locationID.makeup_and_extra_shifts],
    start: options.start,
    end: options.end
  };

  return new Promise(function(resolve, reject){
    api.get('shifts', query, function(response) {
      if (!response.shifts) reject(response);
      else resolve(response);
    });
  });
}

function mergeResponses (responses) {
  var allShifts = {};
  // merge the users and time off shifts from all responses
  responses.forEach(function(response){
    response.shifts.forEach(function(req){
      if (!allShifts[req.id]) {
        allShifts[req.id] = req;
      }
    });
  });

  return ({allShifts});
}

function reformatForCSV (response) {
  const shifts = response.allShifts;
  let CSVFormattedString = '';
  let values;
  let value;
  let shift;

  stathat.increment('Total Shift YTD', Object.keys(shifts));

  for (let keys in shifts) {
    shift = shifts[keys];
    // Start by adding the keys to the CSVFormattedString;
    if (!CSVFormattedString.length) {
      CSVFormattedString += 'wiwShiftId,wiwAccountId,wiwUserId,wiwLocationId,wiwPositionId,wiwSiteId';
      CSVFormattedString += Object.keys(shift).slice(5).join(',');
      CSVFormattedString += '\n';
    }
    
    // For each shift add the properties to the CSV string
    values = [];
    for (let k in shift) {
      if (shift.hasOwnProperty(k)) { 
        value = `${shift[k]}`;
        values.push(value.replace(/,/g, ''));
      }
    }
    CSVFormattedString += `${values.join(',')}\n`;

  }

  return CSVFormattedString;
}

function exportCSV (CSVString) {
  fs.writeFile('./allShifts.csv', CSVString, 'utf8', (err) => {
    if (err) CONSOLE_WITH_TIME('FS err:', err);
    else CONSOLE_WITH_TIME('It\'s saved!');
  });
}