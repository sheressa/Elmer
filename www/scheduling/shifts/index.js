var express   = require('express')
  , WhenIWork = require('wheniwork-unofficial')
  , initWhenIWork = require('../initWhenIWorkAPI')
  , moment    = require('moment')
  , sha1      = require('sha1')
  , returnColorizedShift = require(global.config.root_dir + '/lib/ColorizeShift').go
  , helpers = require(global.config.root_dir + '/www/scheduling/helpers')
  ;

// @TODO: modularize route logic into controllers which can be tested without hitting these routes

var router = express.Router()
  , api = initWhenIWork()
  ;

var wiwDateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ'
  , chooseRegShiftToCancelPageStartDateFormat = 'dddd h:mm a' // Wednesday 4:00 p
  , chooseRegShiftToCancelPageEndDateFormat = 'h:mm a z' // 6:00 pm ES
  , chooseMakeupShiftToCancelPageStartDateFormat = 'dddd, MMM Do YYYY - h:mm a' // Wednesday, Mar 30th 2016 - 4:00 p
  , chooseMakeupShiftToCancelPageEndDateFormat = 'h:mm a z' // 6:00 pm ES
  , scheduleShiftsURL = '/scheduling/login?'
  ;

router.get('/', function(req, res) {
    var email = req.query.email;
    if (!helpers.validate(req.query.email, req.query.token)) {
        res.status(403).send('Access denied.');
    }

    var altEmail = email.replace(/\W+/g, '');
    altEmail = 'admin+'+altEmail+'@crisistextline.org';

    api.get('users', function (dataResponse) {
        var users = dataResponse.users
          , user
          , templateData
          ;

        for (var i = 0; i < users.length; i++) {
            user = users[i];
            if (user.email == email || user.email == altEmail) {
                var userName = user.first_name + ' ' + user.last_name;
                var userID = user.id;
                var fn = user.first_name;
                var ln = user.last_name;
                var query = {
                    user_id: userID,
                    start: '-1 day',
                    end: '+180 days',
                    location_id: [global.config.locationID.regular_shifts, global.config.locationID.makeup_and_extra_shifts]
                };

                api.get('shifts', query, function(response) {
                    var url = scheduleShiftsURL + 'email=' + encodeURIComponent(email) + '&token=' + req.query.token;
                    if (!response.shifts || !response.shifts.length) {
                        var error = "You don't seem to have booked any shifts to delete! If this message is sent in error, contact scheduling@crisistextline.org";
                        templateData = {
                            regularShifts: [],
                            makeupShifts: [],
                            userID: userID,
                            email: email,
                            token: req.query.token,
                            userName: userName,
                            error: error,
                            url: url
                        };
                        res.render('scheduling/chooseShiftToCancel', templateData);
                        return;
                    }
                    var shifts = response.shifts
                      , makeupShifts = []
                      , regularShifts = []
                      , targetShift
                      ;

                    // Filter makeup shifts from regular shifts
                    for (var i = 0 ; i < shifts.length; i++) {
                        targetShift = shifts[i];
                        if (targetShift.location_id === global.config.locationID.regular_shifts) {
                            regularShifts.push(targetShift);
                        }
                        else if (targetShift.location_id === global.config.locationID.makeup_and_extra_shifts) {
                            makeupShifts.push(targetShift);
                        }
                    }

                    /**
                        If the user creates a regular shift and it hasn't been recurred, we're going to direct the user
                        to refresh. (The rest of deleting recurring shifts relies on using the parent_shift property
                        stored in the shift.notes param.)
                    **/
                    regularShifts.forEach(function(shift) {
                        if (!shift.notes) {
                            var error = "Sorry! WhenIWork is loading slowly. Please wait 30 seconds, and then refresh and try again.";
                            res.render('scheduling/chooseShiftToCancel', { error: error , url: url});
                            return;
                        }
                    });

                    // Removes duplicate reg shifts--those that are in the same recurrence chain.
                    var i = regularShifts.length;
                    while (i--) {
                        if (!regularShifts[i]) {
                            continue;
                        }
                        regularShifts = regularShifts.filter(
                            function(shift, index) {
                                if (i === index) {
                                    return true;
                                }
                                return !helpers.areShiftsDuplicate(regularShifts[i], shift);
                            }
                        )
                    }

                    // Sorting regularShifts by when they occur on the weekly calendar
                    regularShifts.sort(function(shiftA, shiftB) {
                        return helpers.sortByDayAscAndTimeAsc(moment(shiftA.start_time, wiwDateFormat), moment(shiftB.start_time, wiwDateFormat));
                    });

                    // Formatting regularShift time display to be more user-readable
                    regularShifts.forEach(function(shift) {
                        shift.start_time = moment(shift.start_time, wiwDateFormat).tz('America/New_York').format(chooseRegShiftToCancelPageStartDateFormat);
                        shift.end_time = moment(shift.end_time, wiwDateFormat).tz('America/New_York').format(chooseRegShiftToCancelPageEndDateFormat);
                    });

                    // Sorting makeupShifts in order of when they occur
                    makeupShifts.sort(function(shiftA, shiftB) {
                        return helpers.dateSort(moment(shiftA.start_time, wiwDateFormat), moment(shiftB.start_time, wiwDateFormat));
                    });

                    makeupShifts.forEach(function(shift) {
                        shift.start_time = moment(shift.start_time, wiwDateFormat).tz('America/New_York').format(chooseMakeupShiftToCancelPageStartDateFormat);
                        shift.end_time = moment(shift.end_time, wiwDateFormat).tz('America/New_York').format(chooseMakeupShiftToCancelPageEndDateFormat);
                    });

                    templateData = {
                        regularShifts: regularShifts,
                        makeupShifts: makeupShifts,
                        userID: userID,
                        email: email,
                        token: req.query.token,
                        userName: userName
                    };

                    // Then, display them in the jade template.
                    res.render('scheduling/chooseShiftToCancel', templateData);
                    return;
                })
                break;
            }
        }
    })
});

router.delete('/', function(req, res) {
    if (!helpers.validate(req.query.email, req.query.token)) {
        res.status(403).send('Access denied.');
    }

    var parentShiftIDsOfRegularShiftsToBeDeleted = []
      , shiftIDsOfMakeupShiftsToBeDeleted = []
      , key
      ;

    for (key in req.query) {
        if (key.substr(0, 8) === 'regShift' && req.query[key] === 'on') {
            parentShiftIDsOfRegularShiftsToBeDeleted.push(parseInt(key.substr(8)));
        }
        else if (key.substr(0, 8) === 'makShift' && req.query[key] === 'on') {
            shiftIDsOfMakeupShiftsToBeDeleted.push(parseInt(key.substr(8)));
        }
    }

    var query = {
        user_id: req.query.userID,
        start: '-1 day',
        end: '+50 years',
        unpublished: true,
        location_id: [ global.config.locationID.regular_shifts, global.config.locationID.makeup_and_extra_shifts ]
    };

    api.get('shifts', query, function (data) {
        var parentShiftID
          , shift
          , batchPayload = []
          , deletedShiftInformation = {regShifts : {}, makShifts : {}}
          ;

        data.shifts.forEach(function(shift) {
            if (shift.location_id === global.config.locationID.regular_shifts) {
                try {
                    parentShiftID = JSON.parse(shift.notes).parent_shift;
                }
                catch (e) {
                    parentShiftID = null;
                    console.log('Error parsing JSON for shift: ', shift.id, ' error: ', e);
                }

                if (parentShiftIDsOfRegularShiftsToBeDeleted.indexOf(parentShiftID) != -1) {
                    // If the shift starts within a week, it's a shift that needs to be converted to an
                    // open shift because the open shift job has already run and passed that day.
                    if (Math.abs(moment().diff(moment(shift.start_time, wiwDateFormat), 'days')) < global.config.time_interval.days_in_interval_to_repeat_open_shifts) {
                        var updatedShiftParams = {
                            user_id: 0,
                            notes: ''
                        };
                        updatedShiftParams = returnColorizedShift(updatedShiftParams, shift.start_time);
                        var reassignShiftToOpenAndRemoveNotesRequest = {
                            "method": 'PUT',
                            "url": "/2/shifts/" + shift.id,
                            "params": updatedShiftParams
                        };
                        batchPayload.push(reassignShiftToOpenAndRemoveNotesRequest);
                    }
                    // Otherwise, we just delete the shift.
                    else {
                        var shiftDeleteRequest = {
                            "method": "delete",
                            "url": "/2/shifts/" + shift.id,
                            "params": {},
                        };
                        batchPayload.push(shiftDeleteRequest);
                    }

                    if (!deletedShiftInformation.regShifts[parentShiftID]) {
                        var formattedStartTime = moment(shift.start_time, wiwDateFormat).tz('America/New_York').format(chooseRegShiftToCancelPageStartDateFormat);
                        var formattedEndTime = moment(shift.end_time, wiwDateFormat).tz('America/New_York').format(chooseRegShiftToCancelPageEndDateFormat)
                        deletedShiftInformation.regShifts[parentShiftID] = { start_time: formattedStartTime, end_time: formattedEndTime };
                    }
                }
            }
            else if (shift.location_id === global.config.locationID.makeup_and_extra_shifts && shiftIDsOfMakeupShiftsToBeDeleted.indexOf(shift.id) != -1) {
                var params = {
                    user_id : 0
                };
                param = returnColorizedShift(params, shift.start_time, true);
                var openShiftRequest = {
                    method : 'PUT',
                    url : '/2/shifts/' + shift.id,
                    params : params
                };
                batchPayload.push(openShiftRequest);

                var formattedStartTime = moment(shift.start_time, wiwDateFormat).tz('America/New_York').format(chooseMakeupShiftToCancelPageStartDateFormat);
                var formattedEndTime = moment(shift.end_time, wiwDateFormat).tz('America/New_York').format(chooseMakeupShiftToCancelPageEndDateFormat);

                deletedShiftInformation.makShifts[shift.id] = { start_time: formattedStartTime, end_time: formattedEndTime };
            }
        });

        api.post('batch', batchPayload, function(response) {
            var templateData = {
                deletedShiftInformation: JSON.stringify(deletedShiftInformation),
                email: encodeURIComponent(req.query.email),
                token: req.query.token,
                url: 'https://app.wheniwork.com/'
            }

            var url = '/scheduling/shifts/delete-success?';
            for (var label in templateData) {
                url += label + '=' + templateData[label] + '&';
            }

            var response = {
                success: true,
                redirect: url
            };

            res.json(response);
        });
    });
});

router.get('/delete-success', function(req, res) {
    var deletedShiftInformation
      , regShifts = []
      , makShifts = []
      ;

    try {
        deletedShiftInformation = JSON.parse(req.query.deletedShiftInformation);
    }
    catch (e) {
        console.log('Unable to parse deleted shift information, error: ', e);
    }

    for (key in deletedShiftInformation.regShifts) {
        regShifts.push(deletedShiftInformation.regShifts[key]);
    }
    for (key in deletedShiftInformation.makShifts) {
        makShifts.push(deletedShiftInformation.makShifts[key]);
    }

    var templateData = {
        email: req.query.email,
        token: req.query.token,
        userName: req.query.userName,
        url: scheduleShiftsURL,
        regShifts: regShifts,
        makShifts: makShifts
    };

    res.render('scheduling/someShiftsCancelled', templateData);
});

/**
    Retrieves the shifts and owners' email addresses which fall within a requested
    time interval.

    @request params
        - start {string} the start time to retrieve shifts, in UNIX epoch secs (not millisecs)
        - end {string} the end time to retrieve shifts
    @response
        Returns array of user email (key) user's shift array (value) objects.
    @notes
        WhenIWork API retrieves shifts that START between the start and end times. Note that the end time is not inclusive of itself--i.e., querying for shift times
        with epoch stamps corresponding to start=2pm and end=4pm will only retrieve shifts
        which begin at a time between 2pm and 3:59pm. It will not retrieve shifts which begin at 4pm.
**/
router.get('/time-interval', function(req, res) {
    var startTime = req.query.start
      , endTime = req.query.end
      , token = req.query.token
      ;

    if (req.query.token !== sha1(global.config.platform_secret_key)) {
        res.status(403).send('Access denied.');
        return;
    }

    var query = {
        start: moment.unix(startTime).format(wiwDateFormat),
        end: moment.unix(endTime).format(wiwDateFormat),
        location_id: [ global.config.locationID.regular_shifts, global.config.locationID.makeup_and_extra_shifts ]
    };

    api.get('shifts', query, function(response) {
        var shifts = response.shifts
          , shift
          , userShiftData = {}
          , getUserEmailRequest
          , batchPayload = []
          ;
        if (!shifts || shifts.length === 0) {
            res.status(204).send('No shifts found.');
            return;
        }
        // We've found shifts. Now let's find the emails of their owners via batch req.
        for (var i = 0; i < shifts.length; i++) {
            shift = shifts[i];
            if (!shift.is_open) {
                if (!userShiftData[shift.user_id]) {
                    userShiftData[shift.user_id] = [shift];
                    getUserEmailRequest = {
                        "method": "GET",
                        "url": "/2/users/" + shift.user_id
                    };
                    batchPayload.push(getUserEmailRequest);
                }
                else {
                    userShiftData[shift.user_id].push(shift);
                }
            }
        }

        api.post('batch', batchPayload, function(response) {
            var user
              , email
              , returnArray = []
              , placeholder
              ;
            for (var i = 0; i < response.length; i ++) {
                user = response[i].user;
                if (userShiftData[user.id]) {
                    email = user.email;
                    if (user.notes) {
                        /**
                            Retrieving email from user notes, where we've stored
                            the non-transformed email (i.e., txiang@ctl.org, not
                            admin+txiangctlorg@crisistextline.org)
                        **/
                        try {
                            email = JSON.parse(user.notes).canonicalEmail;
                        }
                        catch(e) {
                            console.log('JSON.parse failed for examining user notes for user: ' + user.id + ', error: ', e);
                        }
                    }
                    userShiftData[email] = { 'shiftData' : userShiftData[user.id], 'userData': user };
                    delete userShiftData[user.id];
                }
            }
            // Transforming object of keys and values into array.
            for (key in userShiftData) {
                var key = key;
                placeholder = {};
                placeholder[key] = userShiftData[key];
                returnArray.push(placeholder);
            }
            res.json(returnArray);
        })
    })
});

module.exports = router;
