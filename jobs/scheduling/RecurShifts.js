// global.config = require('./../../config');

var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var moment = require('moment');
var fs = require('fs');
var async = require('async');

const CRON_JOB_INTERVAL = 20;
// The number of shifts, spaced by a week, in the chain.
const MAX_SHIFTS_IN_CHAIN = 52;
/***
    The chain.until param passed in order to create a chain is inclusive of that day. 
    But if the scheduled shift ends on midnight or after midnight, that shift is not included in that day. 
    So an “until” statement that falls on a day will not include those shifts beginning on that day but ending on midnight or later. 
    The CHAIN_BUFFER_DAYS constant will make sure that the chain_until parameter includes shifts ending on a
    new day, or for edge cases like leap years.
***/ 
const CHAIN_BUFFER_DAYS = 1;
const YEARS_TO_RECUR_SHIFT = 5;
const WEEKS_TO_SEARCH_FOR_RECURRED_SHIFTS = 2;
const WEEKS_TO_PUBLISH_RECURRED_SHIFTS = 4;
// @TODO: we'll later want to filter for more than one location
const LOCATION_ID = 990385;

function recurNewlyCreatedShifts() {
    var batchPostRequestBody = [];
    // Only searching for newly created shifts one day prior and two weeks out since counselors
    // only can create a new shift in the next week. 
    var startDateToRetrieveShifts = moment().add(-1, 'days').format('YYYY-MM-DD HH:mm:ss');
    var endDateToRetrieveShifts = moment().add(WEEKS_TO_SEARCH_FOR_RECURRED_SHIFTS, 'weeks').format('YYYY-MM-DD HH:mm:ss');
    var postData = {
                        "include_open": false, 
                        "location_id": LOCATION_ID, 
                        "start": startDateToRetrieveShifts, 
                        "end": endDateToRetrieveShifts
                    };

    WhenIWork.get('shifts', postData, function(response) {
        var allShifts = response.shifts;
        var newShifts = allShifts.filter(function(shift) {
            return !shift.notes;
        })
        /**
            Assigning the original creator ID and the parent shift ID 
            to the notes field. When we delete all the shifts in a recurring shift, 
            we'll use the `parent_shift` property to find all the child shifts which
            also need to be deleted. 
        **/
        newShifts.forEach(function(shift) {
            shift.notes = '{"original_owner":' + shift.user_id + ', "parent_shift":' + shift.id + '}';
            var endDate = moment(shift.start_time).add(MAX_SHIFTS_IN_CHAIN - 1, 'weeks').format('L');

            // WhenIWork uses the end of the shift to determine which day it falls on, therefore shifts ending at midnight
            // are an edge case that we need to control for an extend the length of the chain to prevent a "skipped week" when recurring
            if (moment(shift.end_time).format('H') === '0') {
                endDate = moment(endDate).add(1, 'days').format('L');
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
            console.log('*************start time: ', workingShift.start_time, ' until: ', workingShift.chain.until, '\n');
            for (var i = 0; i < YEARS_TO_RECUR_SHIFT - 1; i++) {
                var newShift = {
                                    "method": "post", 
                                    "url": "/2/shifts", 
                                    "params":   {
                                                    "start_time": moment(workingShift.start_time).add(MAX_SHIFTS_IN_CHAIN, 'weeks').format('ddd, DD MMM YYYY HH:mm:ss ZZ'), 
                                                    "end_time": moment(workingShift.end_time).add(MAX_SHIFTS_IN_CHAIN, 'weeks').format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
                                                    "notes": workingShift.notes,
                                                    "acknowledged": workingShift.acknowledged,
                                                    "chain": {"week": "1", "until": moment(workingShift.chain.until).add(MAX_SHIFTS_IN_CHAIN, 'weeks').format('L')},
                                                    "location_id": workingShift.location_id,
                                                    "user_id": workingShift.user_id
                                                }
                                };

                batchPostRequestBody.push(newShift);
                workingShift = newShift.params;
                console.log('*************start time: ', workingShift.start_time, ' until: ', workingShift.chain.until, '\n');
            }
        })

        console.log('BATCH POST REQUEST BODY:\n', JSON.stringify(batchPostRequestBody));

        WhenIWork.post('batch', batchPostRequestBody, function(response) { 
            console.log('response from batch-creating a shift: \n', response); 
            // After batch of shifts is created, we want to publish all shifts. (Note that passing in the `published` param
            // in the requests that are batched doesn't actually publish them; we need to make a separate request to another route.)
            
            var startDateToRetrieveUnpublishedShifts = moment().add(-12, 'hours').format('YYYY-MM-DD HH:mm:ss');
            var endDateToRetrieveUnpublishedShifts = moment().add(12, 'hours').format('YYYY-MM-DD HH:mm:ss');
            var requestTaskArray = [];
            for (var i = 0; i < WEEKS_TO_PUBLISH_RECURRED_SHIFTS * 7; i++) {
                var firstTask = function(callback) {
                    var unpublishedShiftIDs = [];
                    var callback = callback;

                    // Note that we can’t query exclusively for unpublished shifts, we can only 
                    // throw in a flag `“unpublished": true` in order to include unpublished shifts in our search results. 
                    var postData = {
                                        "include_open": false, 
                                        "location_id": LOCATION_ID, 
                                        "start": startDateToRetrieveUnpublishedShifts, 
                                        "end": endDateToRetrieveUnpublishedShifts,
                                        "unpublished": true
                                    };

                    // Getting all shifts created in the timeframe defined above in 'postData' that are unpublished. 
                    WhenIWork.get('shifts', postData, function(response) {
                        console.log('number of shifts retrieved within getAndPublishShifts: ', response.shifts.length);

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

                    console.log('*** arguments to task function: ', arguments);

                    startDate = moment(startDate).add(1, 'days').format('YYYY-MM-DD HH:mm:ss');
                    endDate = moment(endDate).add(1, 'days').format('YYYY-MM-DD HH:mm:ss');

                    var postData = {
                                        "include_open": false, 
                                        "location_id": LOCATION_ID, 
                                        "start": startDate, 
                                        "end": endDate,
                                        "unpublished": true
                                    };

                    WhenIWork.get('shifts', postData, function(response) {
                        console.log('response from GET-ing unpublished shift: \n', response);
                        console.log('number of shifts retrieved within getAndPublishShifts: ', response.shifts.length);

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

                console.log('final arguments to waterfall: ', arguments);

                var publishPayload = {
                    'ids': unpublishedShiftIDs
                }

                WhenIWork.post('shifts/publish/', publishPayload, function(response) {
                    console.log('Publish shift API call response: ', response);
                })
            })
        });
    });
}

module.exports = recurNewlyCreatedShifts;