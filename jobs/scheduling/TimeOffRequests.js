var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var moment = require('moment-timezone');
var fs = require('fs');
var returnColorizedShift = require(CONFIG.root_dir + '/lib/ColorizeShift').go;

var date_format = 'YYYY-MM-DD HH:mm:ss';

new CronJob(CONFIG.time_interval.time_off_requests_cron_job_string, function () {
    handleTimeOffRequests();
}, null, true);

handleTimeOffRequests();

function handleTimeOffRequests() {
  var timeOffSearchParams = createTimeOffSearchParams();

  //Get all time off requests within timeOffSearchParams
  WhenIWork.get('requests', timeOffSearchParams, function(response){
    filterRequestsAndHandleShifts(response.requests);
  });
}

function createTimeOffSearchParams () {
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

function filterRequestsAndHandleShifts (allRequests) {
  //Filter requests to pending requests only
  var newRequests = allRequests.filter(function(request) {
    return request.status === 0;
  });

  //For each pending request, look for any shifts that fall within the time off request
  newRequests.forEach(retrieveOverlappingShifts);

  return newRequests;
}

function retrieveOverlappingShifts (request) {
  var shiftSearchParams = createShiftSearchParams(request);

  WhenIWork.get('shifts', shiftSearchParams, function(response) {
    var batchPayload = createBatchPayload (response, request.id);
    //Send the time off request approval and all shift deletions/open shift creations to batch
    WhenIWork.post('batch', batchPayload, function(response) {
      CONSOLE_WITH_TIME(response);
    });
  });
}

function createShiftSearchParams (request) {
  var shiftSearchParams = {
    "start": request.start_time,
    "end": request.end_time,
    "user_id": request.user_id,
    "location_id": [CONFIG.locationID.regular_shifts, CONFIG.locationID.makeup_and_extra_shifts],
    "unpublished": true
  };

  return shiftSearchParams;
}

function createBatchPayload (response, requestId) {
  var batchPayload = [];

  batchPayload.push(createTimeOffApproval(requestId));

  if (!response.shifts || response.shifts.length === 0) {
    CONSOLE_WITH_TIME('No shifts found that fall within the range of that timeoff request, but we\'re still approving that request.');
  }
  else {
    //For each shift, create a delete request and an open shift to replace it
    response.shifts.forEach(function(shift) {
      var shiftDeleteRequest = {
        "method": "delete",
        "url": "/2/shifts/" + shift.id,
        "params": {},
      };

      batchPayload.push(shiftDeleteRequest);

      var params = {
        "start_time": shift.start_time,
        "end_time": shift.end_time,
        "notes": "SHIFT COVERAGE",
        "published": true,
        "location_id": CONFIG.locationID
                             .makeup_and_extra_shifts,
      };

      params = returnColorizedShift(params, shift.start_time, true);

      var newOpenShiftRequest = {
        "method": "post",
        "url": "/2/shifts",
        "params": params
      };
      batchPayload.push(newOpenShiftRequest);
    });
  }

  return batchPayload;
}

function createTimeOffApproval (requestId) {
    // Status code `2` represents approved requests.
  var timeOffApprovalRequest = {
    "method": "put",
    "url": "/2/requests/" + requestId,
    "params": {
      "status": 2
    }
  };

  return timeOffApprovalRequest;
}

module.exports = {
  filterRequestsAndHandleShifts: filterRequestsAndHandleShifts,
  createBatchPayload: createBatchPayload,
  createTimeOffSearchParams: createTimeOffSearchParams,
  createShiftSearchParams: createShiftSearchParams
};

