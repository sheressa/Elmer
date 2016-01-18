var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var moment = require('moment');
var fs = require('fs');
var async = require('async');
var wiw_date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
var stathat = require(global.config.root_dir + '/lib/stathat');

new CronJob(global.config.time_interval.recur_and_publish_shifts_cron_job_string, function () {
    recurNewlyCreatedShifts();
}, null, true);

recurNewlyCreatedShifts();

function recurNewlyCreatedShifts() {
    var batchPostRequestBody = [];
    // Only searching for newly created shifts one day prior and two weeks out since counselors
    // only can create a new shift in the next week. 
    var startDateToRetrieveShifts = moment().add(-1, 'days').format('YYYY-MM-DD HH:mm:ss');
    var endDateToRetrieveShifts = moment().add(global.config.time_interval.weeks_to_search_for_recurred_shifts, 'weeks').format('YYYY-MM-DD HH:mm:ss');
    var postData = {
                        "include_open": false, 
                        "location_id": global.config.locationID.regular_shifts, 
                        "start": startDateToRetrieveShifts, 
                        "end": endDateToRetrieveShifts
                    };

    WhenIWork.get('shifts', postData, function(response) {
        var allShifts = response.shifts;
        var newShifts = allShifts.filter(function(shift) {
            return !shift.notes;
        })

        stathat.increment('Scheduling - Shifts Recurred', newShifts.length);

        /**
            Assigning the original creator ID and the parent shift ID 
            to the notes field. When we delete all the shifts in a recurring shift, 
            we'll use the `parent_shift` property to find all the child shifts which
            also need to be deleted. 
        **/
        newShifts.forEach(function(shift) {
            shift.notes = '{"original_owner":' + shift.user_id + ', "parent_shift":' + shift.id + '}';
            var endDate = moment(shift.start_time, wiw_date_format).add(global.config.time_interval.max_shifts_in_chain - 1, 'weeks').format('L');

            /**
                WhenIWork uses the end of the shift to determine which day it falls on, therefore shifts ending at midnight
                are an edge case that we need to control for an extend the length of the chain to prevent a "skipped week" when recurring. 

                Additionally, WhenIWork's API will skip the final recurrence of a shift in a chain if it ends on 10pm. 
                (Tested with shifts which recur between 8-10pm.) Hence, we're also extending the end_time for that case.
            **/ 
            if (moment(shift.end_time, wiw_date_format).format('H') === '0' || moment(shift.end_time, wiw_date_format).format('H') === '22') {
                endDate = moment(endDate, 'L').add(global.config.time_interval.chain_buffer_days, 'days').format('L');
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
            //console.log('*************start time: ', workingShift.start_time, ' until: ', workingShift.chain.until, '\n');
            for (var i = 0; i < global.config.time_interval.years_to_recur_shift - 1; i++) {
                var newShift = {
                                    "method": "post", 
                                    "url": "/2/shifts", 
                                    "params":   {
                                                    "start_time": moment(workingShift.start_time, wiw_date_format).add(global.config.time_interval.max_shifts_in_chain, 'weeks').format('ddd, DD MMM YYYY HH:mm:ss ZZ'), 
                                                    "end_time": moment(workingShift.end_time, wiw_date_format).add(global.config.time_interval.max_shifts_in_chain, 'weeks').format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
                                                    "notes": workingShift.notes,
                                                    "acknowledged": workingShift.acknowledged,
                                                    "chain": {"week": "1", "until": moment(workingShift.chain.until, wiw_date_format).add(global.config.time_interval.max_shifts_in_chain, 'weeks').format('L')},
                                                    "location_id": workingShift.location_id,
                                                    "user_id": workingShift.user_id
                                                }
                                };

                batchPostRequestBody.push(newShift);
                workingShift = newShift.params;
                //console.log('*************start time: ', workingShift.start_time, ' until: ', workingShift.chain.until, '\n');
            }
        })

        //console.log('BATCH POST REQUEST BODY:\n', JSON.stringify(batchPostRequestBody));

        WhenIWork.post('batch', batchPostRequestBody, function(response) { 
            //console.log('response from batch-creating a shift: \n', response); 
            // After batch of shifts is created, we want to publish all shifts. (Note that passing in the `published` param
            // in the requests that are batched doesn't actually publish them; we need to make a separate request to another route.)
            
            var startDateToRetrieveUnpublishedShifts = moment().add(-12, 'hours').format('YYYY-MM-DD HH:mm:ss');
            var endDateToRetrieveUnpublishedShifts = moment().add(12, 'hours').format('YYYY-MM-DD HH:mm:ss');
            var requestTaskArray = [];
            for (var i = 0; i < global.config.time_interval.weeks_to_publish_recurred_shifts * 7; i++) {
                var firstTask = function(callback) {
                    var unpublishedShiftIDs = [];
                    var callback = callback;

                    // Note that we can’t query exclusively for unpublished shifts, we can only 
                    // throw in a flag `“unpublished": true` in order to include unpublished shifts in our search results. 
                    var postData = {
                                        "include_open": false, 
                                        "location_id": global.config.locationID.regular_shifts, 
                                        "start": startDateToRetrieveUnpublishedShifts, 
                                        "end": endDateToRetrieveUnpublishedShifts,
                                        "unpublished": true
                                    };

                    // Getting all shifts created in the timeframe defined above in 'postData' that are unpublished. 
                    WhenIWork.get('shifts', postData, function(response) {
                        //console.log('number of shifts retrieved within getAndPublishShifts: ', response.shifts.length);

                        var unpublishedShifts = response.shifts.filter(function(shift) {
                            return shift.notes && !shift.published;
                        })

                        // Shift publishing API takes an array of shift IDs. 
                        var newUnpublishedShiftIDs = unpublishedShifts.map(function(shift) {
                            return shift.id;
                        })
                        
                        unpublishedShiftIDs = unpublishedShiftIDs.concat(newUnpublishedShiftIDs);

                        callback(null, startDateToRetrieveUnpublishedShifts, endDateToRetrieveUnpublishedShifts, unpublishedShiftIDs);
                    })
                }

                var task = function(startDate, endDate, unpublishedShiftIDs, callback) {
                    var unpublishedShiftIDs = unpublishedShiftIDs;
                    var callback = callback;

                    //console.log('*** arguments to task function: ', arguments);

                    startDate = moment(startDate).add(1, 'days').format('YYYY-MM-DD HH:mm:ss');
                    endDate = moment(endDate).add(1, 'days').format('YYYY-MM-DD HH:mm:ss');

                    var postData = {
                                        "include_open": false, 
                                        "location_id": global.config.locationID.regular_shifts, 
                                        "start": startDate, 
                                        "end": endDate,
                                        "unpublished": true
                                    };

                    WhenIWork.get('shifts', postData, function(response) {
                        //console.log('response from GET-ing unpublished shift: \n', response);
                        //console.log('number of shifts retrieved within getAndPublishShifts: ', response.shifts.length);

                        var unpublishedShifts = response.shifts.filter(function(shift) {
                            return shift.notes && !shift.published;
                        })

                        // Shift publishing API takes an array of shift IDs. 
                        var newUnpublishedShiftIDs = unpublishedShifts.map(function(shift) {
                            return shift.id;
                        })
                        
                        unpublishedShiftIDs = unpublishedShiftIDs.concat(newUnpublishedShiftIDs);

                        callback(null, startDate, endDate, unpublishedShiftIDs);
                    })
                }

                if (i === 0) {
                    requestTaskArray.push(firstTask);
                } 
                else {
                    requestTaskArray.push(task);    
                }
            }

            async.waterfall(requestTaskArray, function(err, startDate, endDate, unpublishedShiftIDs) {

                //console.log('final arguments to waterfall: ', arguments);

                var publishPayload = {
                    'ids': unpublishedShiftIDs
                }

                WhenIWork.post('shifts/publish/', publishPayload, function(response) {
                    //console.log('Publish shift API call response: ', response);
                })
            })
        });
    });
}

module.exports = recurNewlyCreatedShifts;
