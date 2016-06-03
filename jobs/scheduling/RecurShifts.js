var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var moment = require('moment-timezone');
var fs = require('fs');
var async = require('async');
var wiw_date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
<<<<<<< HEAD
var stathat = require(global.CONFIG.root_dir + '/lib/stathat');

new CronJob(global.CONFIG.time_interval.recur_and_publish_shifts_cron_job_string, function () {
=======
var stathat = require(config.root_dir + '/lib/stathat');

new CronJob(config.time_interval.recur_and_publish_shifts_cron_job_string, function () {
>>>>>>> master
  recurNewlyCreatedShifts();
}, null, true);

recurNewlyCreatedShifts();

function recurNewlyCreatedShifts() {
  var batchPostRequestBody = [];
  /**
    Only searching for newly created shifts one day prior and three weeks out since counselors
    only can create a new shift in the next two weeks.
  **/
  var startDateToRetrieveShifts = moment().add(-1, 'days').format('YYYY-MM-DD HH:mm:ss');
<<<<<<< HEAD
  var endDateToRetrieveShifts = moment().add(global.CONFIG.time_interval.weeks_to_search_for_recurred_shifts, 'weeks').format('YYYY-MM-DD HH:mm:ss');
  var postData = {
                    "include_open": false,
                    "location_id": global.CONFIG.locationID.regular_shifts,
=======
  var endDateToRetrieveShifts = moment().add(config.time_interval.weeks_to_search_for_recurred_shifts, 'weeks').format('YYYY-MM-DD HH:mm:ss');
  var postData = {
                    "include_open": false,
                    "location_id": config.locationID.regular_shifts,
>>>>>>> master
                    "start": startDateToRetrieveShifts,
                    "end": endDateToRetrieveShifts
                  };

  WhenIWork.get('shifts', postData, function(response) {
    var allShifts = response.shifts;
    if (typeof allShifts !== 'object') {
      CONSOLE_WITH_TIME('NO SHIFTS RETURNED.');
      CONSOLE_WITH_TIME('===================');
      CONSOLE_WITH_TIME('RESPONSE: ' + response);
      CONSOLE_WITH_TIME('POST: ' + postData);
      return;
    }

    /**
      If a shift has just been taken from the open shifts pool, then it won't have
      any notes attached to it. We're only recurring shifts without notes.
      Important to note this, in case we ever assign notes to an open shift.
    **/
    var newShifts = allShifts.filter(function(shift) {
      return !shift.notes;
    });

    stathat.increment('Scheduling - Shifts Recurred', newShifts.length);

    /**
      Assigning the original creator ID and the parent shift ID
      to the notes field. When we delete all the shifts in a recurring shift,
      we'll use the `parent_shift` property to find all the child shifts which
      also need to be deleted.
    **/
    newShifts.forEach(function(shift) {
      /**
        Reduces open shift count by 1 for previous week's and next week's open shifts
        at same time slot. Note that this is happening asynchronously--nothing else in this
        job relies on this completing at a specific time.
      **/
      decrementPrevWeeksAndNextWeeksOpenShiftsByOne(shift);

      shift.notes = '{"original_owner":' + shift.user_id + ', "parent_shift":' + shift.id + '}';
<<<<<<< HEAD
      var endDate = moment(shift.start_time, wiw_date_format).add(global.CONFIG.time_interval.max_shifts_in_chain - 1, 'weeks').format('L');
=======
      var endDate = moment(shift.start_time, wiw_date_format).add(config.time_interval.max_shifts_in_chain - 1, 'weeks').format('L');
>>>>>>> master

      /**
        WhenIWork uses the end of the shift to determine which day it falls on, therefore shifts ending at midnight
        are an edge case that we need to control for an extend the length of the chain to prevent a "skipped week" when recurring.

        Additionally, WhenIWork's API will skip the final recurrence of a shift in a chain if it ends on 10pm.
        (Tested with shifts which recur between 8-10pm.) Hence, we're also extending the end_time for that case.
      **/
      if (moment(shift.end_time, wiw_date_format).format('H') === '0' || moment(shift.end_time, wiw_date_format).format('H') === '22') {
<<<<<<< HEAD
          endDate = moment(endDate, 'L').add(global.CONFIG.time_interval.chain_buffer_days, 'days').format('L');
=======
          endDate = moment(endDate, 'L').add(config.time_interval.chain_buffer_days, 'days').format('L');
>>>>>>> master
      }

      shift.chain = {"week":"1","until":endDate};
      shift.acknowledged = 1;
      var urlIDRoute = "/2/shifts/" + shift.id;
      shift = {"method": "put", "url": urlIDRoute, "params": shift};

      batchPostRequestBody.push(shift);

      var workingShift = shift.params;
      /**
          Because the WhyIWork API doesn't allow us to create a recurring chain
          shift with a duration longer than a year, we need to create X number of chains
          with X being the number of years we want the shift to recur.
          In order to associate all the shifts in all the chains together (i.e., if we wanted to delete
          all the recurring shifts), we are giving each shift a `parent_shift` property in the notes
          section. This property points to the original shift created by the user.
      **/
<<<<<<< HEAD
      for (var i = 0; i < global.CONFIG.time_interval.years_to_recur_shift - 1; i++) {
          var newShift = {
            "method": "post",
            "url": "/2/shifts",
            "params": {
              "start_time": moment(workingShift.start_time, wiw_date_format).add(global.CONFIG.time_interval.max_shifts_in_chain, 'weeks').format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
              "end_time": moment(workingShift.end_time, wiw_date_format).add(global.CONFIG.time_interval.max_shifts_in_chain, 'weeks').format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
              "notes": workingShift.notes,
              "acknowledged": workingShift.acknowledged,
              "chain": {"week": "1", "until": moment(workingShift.chain.until, wiw_date_format).add(global.CONFIG.time_interval.max_shifts_in_chain, 'weeks').format('L')},
              "location_id": workingShift.location_id,
              "user_id": workingShift.user_id
            }
          };

          batchPostRequestBody.push(newShift);
          workingShift = newShift.params;
=======
      for (var i = 0; i < config.time_interval.years_to_recur_shift - 1; i++) {
        var newShift = {
          "method": "post",
          "url": "/2/shifts",
          "params": {
            "start_time": moment(workingShift.start_time, wiw_date_format).add(config.time_interval.max_shifts_in_chain, 'weeks').format(wiw_date_format),
            "end_time": moment(workingShift.end_time, wiw_date_format).add(config.time_interval.max_shifts_in_chain, 'weeks').format(wiw_date_format),
            "notes": workingShift.notes,
            "acknowledged": workingShift.acknowledged,
            "chain": {"week": "1", "until": moment(workingShift.chain.until, wiw_date_format).add(config.time_interval.max_shifts_in_chain, 'weeks').format('L')},
            "location_id": workingShift.location_id,
            "user_id": workingShift.user_id
          }
        };
        batchPostRequestBody.push(newShift);
        workingShift = newShift.params;
>>>>>>> master
      }
    });

    WhenIWork.post('batch', batchPostRequestBody, function(response) {
      /**
        After batch of shifts is created, we want to publish all shifts. (Note that passing in the `published` param
        in the requests that are batched doesn't actually publish them; we need to make a separate request to another route.)
      **/

      var startDateToRetrieveUnpublishedShifts = moment().add(-12, 'hours').format('YYYY-MM-DD HH:mm:ss');
      var endDateToRetrieveUnpublishedShifts = moment().add(12, 'hours').format('YYYY-MM-DD HH:mm:ss');
      var requestTaskArray = [];
<<<<<<< HEAD
      for (var i = 0; i < global.CONFIG.time_interval.weeks_to_publish_recurred_shifts * 7; i++) {
=======
      for (var i = 0; i < config.time_interval.weeks_to_publish_recurred_shifts * 7; i++) {
>>>>>>> master
        var firstTask = function(callback) {
          var unpublishedShiftIDs = [];
          callback = callback;

          /**
            Note that we can’t query exclusively for unpublished shifts, we can only
            throw in a flag `“unpublished": true` in order to include unpublished shifts in our search results.
          **/
          var postData = {
            "include_open": false,
<<<<<<< HEAD
            "location_id": global.CONFIG.locationID.regular_shifts,
=======
            "location_id": config.locationID.regular_shifts,
>>>>>>> master
            "start": startDateToRetrieveUnpublishedShifts,
            "end": endDateToRetrieveUnpublishedShifts,
            "unpublished": true
          };

          // Getting all shifts created in the timeframe defined above in 'postData' that are unpublished.
          WhenIWork.get('shifts', postData, function(response) {
            var unpublishedShifts = response.shifts.filter(function(shift) {
              return shift.notes && !shift.published;
            });

            // Shift publishing API takes an array of shift IDs.
            var newUnpublishedShiftIDs = unpublishedShifts.map(function(shift) {
              return shift.id;
            });

            unpublishedShiftIDs = unpublishedShiftIDs.concat(newUnpublishedShiftIDs);

            callback(null, startDateToRetrieveUnpublishedShifts, endDateToRetrieveUnpublishedShifts, unpublishedShiftIDs);
          });
        };

        var task = function(startDate, endDate, unpublishedShiftIDs, callback) {
          unpublishedShiftIDs = unpublishedShiftIDs;
          callback = callback;

          startDate = moment(startDate).add(1, 'days').format('YYYY-MM-DD HH:mm:ss');
          endDate = moment(endDate).add(1, 'days').format('YYYY-MM-DD HH:mm:ss');

          var postData = {
            "include_open": false,
<<<<<<< HEAD
            "location_id": global.CONFIG.locationID.regular_shifts,
=======
            "location_id": config.locationID.regular_shifts,
>>>>>>> master
            "start": startDate,
            "end": endDate,
            "unpublished": true
          };

          WhenIWork.get('shifts', postData, function(response) {
            var unpublishedShifts = response.shifts.filter(function(shift) {
              return shift.notes && !shift.published;
            });

            // Shift publishing API takes an array of shift IDs.
            var newUnpublishedShiftIDs = unpublishedShifts.map(function(shift) {
              return shift.id;
            });

            unpublishedShiftIDs = unpublishedShiftIDs.concat(newUnpublishedShiftIDs);

            callback(null, startDate, endDate, unpublishedShiftIDs);
          });
        };

        if (i === 0) {
          requestTaskArray.push(firstTask);
        }
        else {
          requestTaskArray.push(task);
        }
      }

      async.waterfall(requestTaskArray, function(err, startDate, endDate, unpublishedShiftIDs) {
        var publishPayload = {
          'ids': unpublishedShiftIDs
        };

        WhenIWork.post('shifts/publish/', publishPayload);
      });
    });
  });
}

function decrementPrevWeeksAndNextWeeksOpenShiftsByOne(shift) {
  shift.start_time = MAKE_WIW_TIME_STRING_MOMENT_PARSEABLE(shift.start_time);
  var prevWeekShiftStartTime =  moment(shift.start_time, wiw_date_format, true).add(-1, 'weeks').format(wiw_date_format);
  var nextWeekShiftStartTime = moment(shift.start_time, wiw_date_format, true).add(1, 'weeks').format(wiw_date_format);
  var nextWeekShiftEndTime = moment(shift.start_time, wiw_date_format, true).add(1, 'weeks').add(2, 'hours').format(wiw_date_format);
  var prevWeekOpenShiftDecremented = false;
  var nextWeekOpenShiftDecremented = false;

  var openShiftQuery = {
    include_open: true,
    include_allopen: true,
    location_id: config.locationID.regular_shifts,
    start: prevWeekShiftStartTime,
    end: nextWeekShiftEndTime
  };

  WhenIWork.get('shifts', openShiftQuery, function(response) {
    var batchPayload = [];
    var openShifts = response.shifts;
    if (typeof response !== 'object') {
      CONSOLE_WITH_TIME('NO OPEN SHIFTS RETURNED TO DECREMENT.');
      CONSOLE_WITH_TIME('===================');
      CONSOLE_WITH_TIME('RESPONSE: ' + response);
      CONSOLE_WITH_TIME('POST: ' + postData);
      return;
    }

    openShifts.forEach(function(shift) {
      /**
        If the shift is indeed an open shift, and it's the shift that occurs exactly one week
        or after the shift that was just taken, we decrement its instances by one.
      **/
      if (shift.is_open && (shift.start_time === prevWeekShiftStartTime || shift.start_time === nextWeekShiftStartTime)) {
        var instances = parseInt(shift.instances);
        if (instances === 1) {
          var shiftDeleteRequest = {
            'method': 'delete',
            'url': '/2/shifts/' + shift.id,
            'params': {}
          };
          batchPayload.push(shiftDeleteRequest);
        }
        else {
          instances = instances - 1;
          var shiftUpdateRequest = {
            'method': 'PUT',
            'url': '/2/shifts/' + shift.id,
            'params': {instances: instances}
          };
          batchPayload.push(shiftUpdateRequest);
        }
      }
    });

    WhenIWork.post('batch', batchPayload, function(response) {
      CONSOLE_WITH_TIME('Response from decrementing week prior\'s shifts by one, and week after\'s open shifts by one: ', response);
    });
  });
}

module.exports = {
  recurNewlyCreatedShifts: recurNewlyCreatedShifts,
  decrementPrevWeeksAndNextWeeksOpenShiftsByOne: decrementPrevWeeksAndNextWeeksOpenShiftsByOne
};
