// global.config = require('./../../config');

var CronJob = require('cron').CronJob;
var WhenIWork = require('./base');
var moment = require('moment');
var fs = require('fs');

const CRON_JOB_INTERVAL = 20;
const MAX_WEEKS_IN_CHAIN = 3;
const YEARS_TO_RECUR_SHIFT = 5;
const YEARS_TO_SEARCH = 50;
// @TODO: we'll later want to filter for more than one location
const LOCATION_ID = 990385;

function recurNewlyCreatedShifts() {
    var batchPostRequestBody = [];
    // we can also filter for location id, and the `is_open` param 
    var startDateToRetrieveShifts = moment().add(-1, 'days').format('YYYY-MM-DD HH:mm:ss');
    var endDateToRetrieveShifts = moment().add(YEARS_TO_SEARCH, 'years').format('YYYY-MM-DD HH:mm:ss');
    var postData = {
                        "include_open": false, 
                        "location_id": LOCATION_ID, 
                        "start": startDateToRetrieveShifts, 
                        "end": endDateToRetrieveShifts
                    };

    WhenIWork.get('shifts', postData, function(response) {
        console.log('ALL SHIFTS RESPONSE:\n', response.shifts.length);
        var allShifts = response.shifts;
        var newShifts = allShifts.filter(function(shift) {
            return !shift.notes;
        })
        // Assigning the original creator ID to the notes field. If the 
        // user_id of the shift changes (i.e. the shift is swapped), we know that 
        // if user_id doesn't match the original_owner in the notes field, we 
        // don't recur that shift. 
        newShifts.forEach(function(shift) {
            shift.notes = '{"original_owner":' + shift.user_id + ', "parent_shift":' + shift.id + '}';
            var endDate = moment(shift.start_time).add(MAX_WEEKS_IN_CHAIN, 'weeks').format('L');
            console.log('***endDate: ', endDate);
            shift.chain = {"week":"1","until":endDate};
            shift.acknowledged = 1;
            var urlIDRoute = "/2/shifts/" + shift.id;
            shift = {"method": "put", "url": urlIDRoute, "params": shift};
            
            batchPostRequestBody.push(shift);

            var workingShift = shift.params;

            // Because the WhyIWork API doesn't allow us to create a recurring chain
            // shift with a duration longer than a year, we need to create X number of chains
            // with X being the number of years we want the shift to recur. 
            // In order to associate all the shifts in all the chains together (i.e., if we wanted to delete
            // all the recurring shifts), we are giving each shift a `parent_shift` property in the notes
            // section. This property points to the original shift created by the user. 
            for (var i = 0; i < YEARS_TO_RECUR_SHIFT; i++) {
                var newShift = {
                                    "method": "post", 
                                    "url": "/2/shifts", 
                                    "params":   {
                                                    "start_time": moment(workingShift.start_time).add(MAX_WEEKS_IN_CHAIN + 1, 'weeks').format('ddd, DD MMM YYYY HH:mm:ss ZZ'), 
                                                    "end_time": moment(workingShift.end_time).add(MAX_WEEKS_IN_CHAIN + 1, 'weeks').format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
                                                    "notes": workingShift.notes,
                                                    "acknowledged": workingShift.acknowledged,
                                                    "chain": {"week": "1", "until": moment(workingShift.chain.until).add(MAX_WEEKS_IN_CHAIN, 'weeks').format('L')},
                                                    "location_id": workingShift.location_id
                                                }
                                };
                batchPostRequestBody.push(newShift);
                workingShift = newShift.params;
            }
        })

        console.log('BATCH POST REQUEST BODY:\n', JSON.stringify(batchPostRequestBody));

        WhenIWork.post('batch', batchPostRequestBody, function(response) { console.log('response from batch-creating a shift: \n', response); });
    });
}

module.exports = recurNewlyCreatedShifts;