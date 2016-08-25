'use strict';

const CronJob = require('cron').CronJob;
const WhenIWork = CONFIG.WhenIWork;
const moment = require('moment-timezone');
const colorizeShift = require('../../lib/ColorizeShift').go;

const WIWDateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
const shiftQueryDateFormat = 'YYYY-MM-DD HH:mm:ss';

new CronJob(CONFIG.time_interval.openShifts, recurOpenShifts, null, true);

// Recurs open shifts one and two weeks in the future.
function recurOpenShifts() {
  const now = checkTime();
  if (now) {
    const getShiftsPromises = createPromisesForAllTimes(now);
    Promise.all(getShiftsPromises)
    .then(responsesObjShiftsWithTimes => {
      responsesObjShiftsWithTimes.forEach(objShiftsWithTimes => {
        const incrementParams = calcCorrectShiftsAndLog(...tallyOccupiedAndOpenShifts(objShiftsWithTimes), objShiftsWithTimes);
        incrementFutureOpenShiftsUpOrDown(...incrementParams);
      });
    })
    .catch(err => CONSOLE_WITH_TIME(`ERROR in RecurOpenShifts ${err}`));
  }
}

function checkTime(now = moment().minute(0).second(0)) {
  if (now.hours() % 2 === 1) {
  // This should never happen because cron runs on 2 hour marks.
    CONSOLE_WITH_TIME('running at an odd hour. abort.');
    return false;
  }
  else {
    return now;
  }
}

function createPromisesForAllTimes(now) {
  const findShifts = [];

  // Each time this cron runs, we run this function over the previous four shift
  // times for failsafe redundancy.
  for (let i = 0; i < 5; i++) {
    // Because we're making async calls in a loop, we pass targetTime through callback
    // so that it's defined locally for each scope.
    const targetTime = now.clone().add(i * -2, 'hours');

    findShifts.push(getShiftsPromise(targetTime, 1, incrementFutureOpenShiftsUpOrDown));
    findShifts.push(getShiftsPromise(targetTime, 2, incrementFutureOpenShiftsUpOrDown));
  }  

  return findShifts;
}

function getShiftsPromise (targetTimeMomentObj, weeksFromNowToCheck) {
  /*
    Querying for shifts starting at 8pm produces weird, buggy behavior from the WIW API.
    Guess: 8pm is the dividing line between GMT days. So if we query for shifts starting a
    minute before 8pm, this strangely yields shifts starting at 10pm. Hence, our `start` time
    is precisely on the hour.
  */
  const filter = {
    start: targetTimeMomentObj.clone().add(weeksFromNowToCheck, 'week').format(shiftQueryDateFormat),
    end: targetTimeMomentObj.clone().add(1, 'minute').add(weeksFromNowToCheck, 'week').format(shiftQueryDateFormat),
    include_allopen: true,
    location_id: CONFIG.locationID.regular_shifts
  };

  return new Promise(function(resolve, reject){
    WhenIWork.get('shifts', filter, function(response) {
      if (!response.shifts) reject(response);
      else resolve({shifts: response.shifts, targetTimeMomentObj, weeksFromNowToCheck});
    });
  });
}

// Checks if open shifts are already present weeksFromNowToCheck number of weeks from the targetTime
function tallyOccupiedAndOpenShifts (objShifts) {
  const extraOpenShiftsToDelete = [];
  let countOfOccupiedShifts = 0;
  let countOfOpenShifts = 0;

  objShifts.shifts.forEach(shift => {
    if (JSON.parse(shift.is_open)) {
      if (!shift.instances) {
        countOfOpenShifts++;
      }
      else {
        countOfOpenShifts += JSON.parse(shift.instances);
      }
      extraOpenShiftsToDelete.push(shift.id);
    }
    else {
      countOfOccupiedShifts++;
    }
  });

  return [extraOpenShiftsToDelete, countOfOccupiedShifts, countOfOpenShifts];
}

function calcCorrectShiftsAndLog (extraOpenShiftsToDelete, countOfOccupiedShifts, countOfOpenShifts, objShifts) {
  const targetTimeMomentObj = objShifts.targetTimeMomentObj;
  const weeksFromNowToCheck = objShifts.weeksFromNowToCheck;

  const maxShiftsForTime = returnMaxOpenShiftCountForTime(targetTimeMomentObj.clone());
  const correctNumberOfShiftsToSet = maxShiftsForTime - countOfOccupiedShifts;

  logRetrieved(countOfOpenShifts, countOfOccupiedShifts, weeksFromNowToCheck, maxShiftsForTime, targetTimeMomentObj);

  return [extraOpenShiftsToDelete, correctNumberOfShiftsToSet, weeksFromNowToCheck, targetTimeMomentObj];
}

function logRetrieved (countOfOpenShifts, countOfOccupiedShifts, weeksFromNowToCheck, maxShiftsForTime, targetTimeMomentObj) {
  const time = `${targetTimeMomentObj.hours().toString()}:00:00`;
  const outputString = `Found ${countOfOpenShifts} open shifts, ` +
    `${countOfOccupiedShifts} occupied shifts found for a time ${weeksFromNowToCheck} weeks from ` +
    `now where we expect ${maxShiftsForTime} open shifts. Time: ${time}`;
  CONSOLE_WITH_TIME(outputString);
}

/**
  This function adds open shifts or delete open shifts to match the proper number.
**/
function incrementFutureOpenShiftsUpOrDown(extraOpenShiftsToDelete, correctNumberOfShiftsToSet, weeksFromNowToCheck, targetTime) {
  const batchPayload = [];

  // If we don't need to add any new open shifts, we return.
  if (correctNumberOfShiftsToSet === 0) {
    CONSOLE_WITH_TIME(`No open shifts need to be added for time: ${targetTime.toString()}`);
    return;
  }
  // If we need to add open shifts
  else if (correctNumberOfShiftsToSet > 0) {
    batchPayload.push(createOpenShift(correctNumberOfShiftsToSet, targetTime, weeksFromNowToCheck));
  }

  /**
    Batch remove the invalid open shifts in two cases: 1) correctNumberOfShiftsToSet > 0; we need to add open shifts
    and 2) correctNumberOfShiftsToSet < 0; the number of occupied shifts is currently greater than the total number
    of open shifts for that block. In BOTH cases, we need to delete all old open shifts. ???
  **/
  batchPayload.push(...removeOpenShifts(extraOpenShiftsToDelete));

  if (correctNumberOfShiftsToSet < 0) { correctNumberOfShiftsToSet = 'no'; }
  logBatched (correctNumberOfShiftsToSet, targetTime, extraOpenShiftsToDelete);
  WhenIWork.post('batch', batchPayload);
  //the below is returned for test purposes
  return batchPayload;
}

function logBatched (correctNumberOfShiftsToSet, targetTime, extraOpenShiftsToDelete) {
  let outputString = `Adding ${correctNumberOfShiftsToSet} open shifts to the time: ${targetTime.toString()}.`;
  if (extraOpenShiftsToDelete.length) outputString += ` Deleting incorrect count of open shifts--their shift IDs: ${extraOpenShiftsToDelete}`;
  CONSOLE_WITH_TIME(outputString);
}

function createOpenShift (correctNumberOfShiftsToSet, targetTime, weeksFromNowToCheck) {
  let newOpenShiftParams = {
      start_time: targetTime.clone().minute(0).second(0).add(weeksFromNowToCheck, 'weeks').format(WIWDateFormat),
      end_time: targetTime.clone().minute(0).second(0).add(2, 'hour').add(weeksFromNowToCheck, 'weeks').format(WIWDateFormat),
      location_id: CONFIG.locationID.regular_shifts,
      instances: correctNumberOfShiftsToSet,
      published: true
    };

  newOpenShiftParams = colorizeShift(newOpenShiftParams);

  const newOpenShiftRequest = {
    method: `post`,
    url: `/shifts`,
    params: newOpenShiftParams
  };

  return newOpenShiftRequest;
}

function removeOpenShifts(shifts) {
  return shifts.map(function(shiftID) {
    const shiftDeleteRequest = {
      method: `delete`,
      url: `/shifts/` + shiftID,
      params: {}
    };
    return shiftDeleteRequest;
  });
}

function returnMaxOpenShiftCountForTime(targetTimeMomentObj) {
  const dayStr = targetTimeMomentObj.format('ddd'); // a string like "Thu"
  const hourStr = targetTimeMomentObj.format('ha'); // a string like "4pm"
  return CONFIG.numberOfCounselorsPerShift[dayStr][hourStr];
}

// Exporting modularized functions for testability
module.exports = {
  checkTime,
  returnMaxOpenShiftCountForTime,
  incrementFutureOpenShiftsUpOrDown,
  tallyOccupiedAndOpenShifts,
};
