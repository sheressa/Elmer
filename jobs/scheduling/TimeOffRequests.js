var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var moment = require('moment');
var fs = require('fs');

var date_format = 'YYYY-MM-DD HH:mm:ss';

new CronJob(global.config.time_interval.time_off_requests_cron_job_string, function () {
    handleTimeOffRequests();
}, null, true);

handleTimeOffRequests();

function handleTimeOffRequests() {
    //Using moment.js to format time as WIW expects
    var startDateToRetrieveRequests = moment().format(date_format);
    var endDateToRetrieveRequests = moment()
        .add(global.config.time_interval.months_to_search_for_time_off_requests, 'months')
        .format(date_format);
    var timeOffSearchParams = {
        "start": startDateToRetrieveRequests,
        "end": endDateToRetrieveRequests,
    };

    //Get all time off requests within timeOffSearchParams
    WhenIWork.get('requests', timeOffSearchParams, function(response) {
        var allRequests = response.requests;

        //Filter requests to pending requests only
        var newRequests = allRequests.filter(function(request) {
            return request.status === 0;
        });

        //For each pending request, look for any shifts that fall within the time off request
        newRequests.forEach(function(request) {
            var shiftSearchParams = {
                "start": request.start_time,
                "end": request.end_time,
                "user_id": request.user_id,
                "location_id": global.config.locationID.regular_shifts,
                "unpublished": true
            };

            WhenIWork.get('shifts', shiftSearchParams, function(response) {

                if (!response.shifts || response.shifts.length === 0) {
                    console.log('No shifts found that fall within the range of timeoff request.');
                    return false;
                }

                console.log('shift responses which fall within ', request.start_time, '**', request.end_time, ' &&& number of shifts returned for that time off request', response.shifts.length);

                // Status code `2` represents approved requests.
                var timeOffApprovalRequest = {
                    "method": "put",
                    "url": "/2/requests/" + request.id,
                    "params": {
                        "status": 2
                    }
                };

                var batchPayload = [timeOffApprovalRequest];

                //For each shift, create a delete request and an open shift to replace it
                response.shifts.forEach(function(shift) {
                    var shiftDeleteRequest = {
                        "method": "delete",
                        "url": "/2/shifts/" + shift.id,
                        "params": {},
                    };

                    batchPayload.push(shiftDeleteRequest);

                    var newOpenShiftRequest = {
                        "method": "post",
                        "url": "/2/shifts",
                        "params": {
                            "start_time": shift.start_time,
                            "end_time": shift.end_time,
                            "notes": "SHIFT COVERAGE",
                            "published": true,
                            "location_id": global.config.locationID
                                                 .makeup_and_extra_shifts,
                        }
                    };

                    batchPayload.push(newOpenShiftRequest);
                });

                //Send the time off request approval and all shift deletions/open shift creations to batch
                WhenIWork.post('batch', batchPayload, function(response) {
                    console.log(response);
                });
            });
        });
    });
}
