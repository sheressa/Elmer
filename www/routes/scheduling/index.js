var express   = require.main.require('express');
var WhenIWork = require.main.require('wheniwork-unofficial');
var moment    = require.main.require('moment');
var sha1      = require.main.require('sha1');
var stathat   = require(global.config.root_dir + '/lib/stathat');
var colorizeShift = require(global.config.root_dir + '/lib/ColorizeShift');

var router = express.Router();

var api = new WhenIWork(global.config.wheniwork.api_key, global.config.wheniwork.username, global.config.wheniwork.password);

var wiwDateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
var chooseShiftToCancelPageStartDateFormat = 'dddd h:mm a';
var chooseShiftToCancelPageEndDateFormat = 'h:mm a z';
var scheduleShiftsURL = '/scheduling/login?';

router.get('/shifts', function(req, res) {
    var email = req.query.email;
    if (!validate(req.query.email, req.query.token)) {
        res.status(403).send('Access denied.');
    }

    var altEmail = email.replace(/\W+/g, '');
    altEmail = 'admin+'+altEmail+'@crisistextline.org';

    api.get('users', function (dataResponse) {
        var users = dataResponse.users
          , user
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
                    end: '+8 days',
                    location_id: global.config.locationID.regular_shifts
                };

                api.get('shifts', query, function(response) {
                    var url = scheduleShiftsURL + 'email=' + encodeURIComponent(email) + '&token=' + req.query.token;
                    if (!response.shifts || !response.shifts.length) {
                        var error = "You don't seem to have booked any shifts to delete! If this message is sent in error, contact scheduling@crisistextline.org";
                        res.render('scheduling/chooseShiftToCancel', { error: error , url: url });
                        return;
                    }
                    var shifts = response.shifts;
                    /**
                        If the user creates a shift and it hasn't been recurred, we're going to direct the user
                        to refresh. (The rest of deleting recurring shifts relies on using the parent_shift property
                        stored in the shift.notes param.)
                    **/
                    shifts.forEach(function(shift) {
                        if (!shift.notes) {
                            var error = "Sorry! WhenIWork is loading slowly. Please wait 30 seconds, and then refresh and try again.";
                            res.render('scheduling/chooseShiftToCancel', { error: error , url: url});
                            return;
                        }
                    })

                    var i = shifts.length;
                    while (i--) {
                        shifts = shifts.filter(
                            function(shift, index) {
                                if (i === index) {
                                    return true;
                                }
                                return !areShiftsDuplicate(shifts[i], shift);
                            }
                        )
                    }

                    // Sorting shifts by when they occur on the weekly calendar
                    shifts.sort(function(shiftA, shiftB) {
                        return sortByDayAscAndTimeAsc(moment(shiftA.start_time, wiwDateFormat), moment(shiftB.start_time, wiwDateFormat));
                    });

                    // Formatting shift time display to be more user-readable
                    shifts.forEach(function(shift) {
                        shift.start_time = moment(shift.start_time, wiwDateFormat).tz('America/New_York').format(chooseShiftToCancelPageStartDateFormat);
                        shift.end_time = moment(shift.end_time, wiwDateFormat).tz('America/New_York').format(chooseShiftToCancelPageEndDateFormat);
                    });

                    var templateData = {
                        shifts: shifts,
                        userID: userID,
                        email: email,
                        token: req.query.token,
                        userName: userName
                    };

                    // Then, display them in the jade template.
                    res.render('scheduling/chooseShiftToCancel', templateData);
                })
                break;
            }
        }
    })
})

router.delete('/shifts', function(req, res) {
    if (!validate(req.query.email, req.query.token)) {
        res.status(403).send('Access denied.');
    }

    var parentShiftIDsOfShiftsToBeDeleted = [];
    for (var key in req.query) {
        if (req.query[key] === 'on') {
            parentShiftIDsOfShiftsToBeDeleted.push(parseInt(key));
        }
    }

    var query = {
        user_id: req.query.userID,
        start: '-1 day',
        end: '+50 years',
        unpublished: true,
        location_id: global.config.locationID.regular_shifts
    };

    api.get('shifts', query, function (data) {
        var parentShiftID
          , shift
          , batchPayload = []
          , deletedShiftInformation = {}
          , finalDeletedShiftArray = []
          ;

        data.shifts.forEach(function(shift) {
            parentShiftID = JSON.parse(shift.notes).parent_shift;

            if (parentShiftIDsOfShiftsToBeDeleted.indexOf(parentShiftID) != -1) {
                // If the shift starts within a week, it's a shift that needs to be converted to an
                // open shift because the open shift job has already run and passed that day.
                if (Math.abs(moment().diff(moment(shift.start_time, wiwDateFormat), 'days')) < global.config.time_interval.days_in_interval_to_repeat_open_shifts) {
                    var updatedShiftParams = {
                        user_id: 0,
                        notes: ''
                    };
                    updatedShiftParams = colorizeShift(updatedShiftParams, shift.start_time);
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

                if (!deletedShiftInformation[parentShiftID]) {
                    var formattedStartTime = moment(shift.start_time, wiwDateFormat).tz('America/New_York').format(chooseShiftToCancelPageStartDateFormat);
                    var formattedEndTime = moment(shift.end_time, wiwDateFormat).tz('America/New_York').format(chooseShiftToCancelPageEndDateFormat)
                    deletedShiftInformation[parentShiftID] = { start_time: formattedStartTime, end_time: formattedEndTime };
                }
            }
        });

        for (key in deletedShiftInformation) {
            finalDeletedShiftArray.push(deletedShiftInformation[key]);
        }

        api.post('batch', batchPayload, function(response) {
            var templateData = {
                deletedShiftInformation: JSON.stringify(finalDeletedShiftArray),
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
})

router.get('/shifts/delete-success', function(req, res) {
    var templateData = {
        email: req.query.email,
        token: req.query.token,
        userName: req.query.userName,
        url: scheduleShiftsURL,
        deletedShiftInformation: req.query.deletedShiftInformation
    };

    res.render('scheduling/someShiftsCancelled', templateData);
})

router.get('/login', function (req, res) {
    if (!validate(req.query.email, req.query.token)) {
        res.status(403).send('Access denied.');
    }

    var email = req.query.email;

    checkUser(req.query.email, req.query.fn, req.query.ln, function (user) {
        var api2 = new WhenIWork(global.config.wheniwork.api_key, user.email, global.config.wheniwork.default_password, function (resp) {
            res.redirect('https://app.wheniwork.com/login/?redirect=myschedule');
        });

        api2.post('users/autologin', function (data) {
            if (typeof data.error !== 'undefined') {
                res.redirect('https://app.wheniwork.com');
            } else {
                var destination = 'myschedule';
                if (req.query.destination != undefined && req.query.destination != '') {
                    destination = req.query.destination;
                }

                res.redirect('https://app.wheniwork.com/'+destination+'?al=' + data.hash);
            }
        });
    });
});

router.get('/shifts/time-interval', function(req, res) {
    var startTime = req.query.start
      , endTime = req.query.end
      , token = req.query.token
      ;

    // @TODO: some kind of auth needs to happen here
    var query = {
        start: moment.unix(startTime).subtract(1, 'minute').format(wiwDateFormat),
        end: moment.unix(startTime).add(1, 'minute').format(wiwDateFormat),
        location_id: [ global.config.locationID.regular_shifts, global.config.locationID.makeup_and_extra_shifts ]
    };

    console.log('query: ', query);

    api.get('shifts', query, function(response) {
        // console.log('get shifts response: ', response);
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

        console.log('batch payload: ', batchPayload);

        console.log('user shift data: ', userShiftData)

        api.post('batch', batchPayload, function(response) {
            var user
              , email
              , returnArray
              , placeholder
              ;
            for (var i = 0; i < response.length; i ++) {
                user = response[i];
                if (userShiftData[user.id]) {
                    email = user.email;

                    // @TODO: find some way to denormalize the user's email address so that we get rid of the admin+ and @crisistextline.org

                    userShiftData[user.email] = userShiftData[user.id];
                    delete userShiftData[user.id];
                }
            }

            // Transforming object of keys and values into array.
            for (key in userShiftData) {
                placeholder = {key : userShiftData[key]}
                returnArray.push(placeholder);
            }
            res.json(returnArray);
        })
    })
})

function validate(email, hash) {
    var check = email + global.config.secret_key;
    return sha1(check) == hash;
}

function checkUser(email, first, last, callback) {
    var altEmail = email.replace(/\W+/g, '');
    altEmail = 'admin+'+altEmail+'@crisistextline.org';

    api.get('users', function (users) {
        users = users.users;
        for (var i in users) {
            if (users[i].email == email || users[i].email == altEmail) {
                callback(users[i]);
                return;
            }
        }

        stathat.increment('Scheduling - Accounts Created', 1);

        // At this point, we didn't find the user so let's create it.
        var newUser = {
            role: 3,
            email: altEmail,
            first_name: first,
            last_name: last,
            activated: true,
            locations: [global.config.locationID.regular_shifts, global.config.locationID.makeup_and_extra_shifts],
            password: global.config.wheniwork.default_password
        };

        api.post('users', newUser, function (data) {
            var api2 = new WhenIWork(global.config.wheniwork.api_key, altEmail, global.config.wheniwork.default_password, function (data) {
            });

            var alert = {sms: false, email: false};
            var alerts = ['timeoff', 'swaps', 'schedule', 'reminders', 'availability', 'new_employee', 'attendance'];
            var postBody = {};

            for (var i in alerts) {
                postBody[alerts[i]] = alert;
            }

            api2.post('users/alerts', postBody, function () {});

            api2.post('users/profile', {email: email}, function (profile) {
                console.log(profile);
                callback(profile.user);
            });
        });
    });
}

/**
    Returns true if two shifts are duplicate, false if otherwise.
    Our working definition of duplicate? If two shifts were created
    from the same parent shift, and thus have the same parent_shift ID
    in its notes section.
**/
function areShiftsDuplicate(shiftA, shiftB) {
    var shiftsAreDuplicate = false;
    try {
        shiftsAreDuplicate = JSON.parse(shiftA.notes).parent_shift === JSON.parse(shiftB.notes).parent_shift;
    }
    catch (err) {
        console.log('JSON.parse failed to parse ' + shiftA + ' or ' + shiftB);
    }
    return shiftsAreDuplicate;
}

/**
    Returns 1 if firstMomentObject occurs after secondMomentObject in the
    weekly calendar, returns -1 if firstMomentObject occurs before
    secondMomentObject.
**/
function sortByDayAscAndTimeAsc(firstMomentObject, secondMomentObject) {
    if (firstMomentObject.day() !== secondMomentObject.day()) {
        return firstMomentObject.day() > secondMomentObject.day() ? 1 : -1;
    }
    else if (firstMomentObject.hours() !== secondMomentObject.hours()) {
        return firstMomentObject.hours() > secondMomentObject.hours() ? 1 : -1;
    }
    else if (firstMomentObject.minutes() !== secondMomentObject.minutes()) {
        return firstMomentObject.minutes() > secondMomentObject.minutes() ? 1 : -1;
    }
    else if (firstMomentObject.seconds() !== secondMomentObject.seconds()) {
        return firstMomentObject.seconds() > secondMomentObject.seconds() ? 1 : -1;
    }
    return 0;
}

module.exports = router;
