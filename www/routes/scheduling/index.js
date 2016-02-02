var express   = require.main.require('express');
var WhenIWork = require.main.require('wheniwork-unofficial');
var moment    = require.main.require('moment');
var sha1      = require.main.require('sha1');
var stathat   = require(global.config.root_dir + '/lib/stathat');

var router = express.Router();

var api = new WhenIWork(global.config.wheniwork.api_key, global.config.wheniwork.username, global.config.wheniwork.password);

var wiw_date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';
var choose_shift_to_cancel_page_start_date_format = 'dddd h:mm a';
var choose_shift_to_cancel_page_end_date_format = 'h:mm a z'
var schedule_shifts_url = 'https://app.wheniwork.com/login/?redirect=myschedule'

router.get('/shifts', function(req, res) {
    var email = req.query.email;
    if (!validate(req.query.email, req.query.token)) {
        res.status(403).send('Access denied.');
    }

    var altEmail = email.replace(/\W+/g, '');
    altEmail = 'admin+'+altEmail+'@crisistextline.org';

    api.get('users', function (dataResponse) {
        var users = dataResponse.users;
        for (var i in users) {
            if (users[i].email == email || users[i].email == altEmail) {
                var userName = users[i].first_name + ' ' + users[i].last_name;
                var userID = users[i].id;
                var query = {
                    user_id: userID,
                    start: '-1 day',
                    end: '+8 days',
                    location_id: global.config.locationID.regular_shifts
                };

                api.get('shifts', query, function(response) {
                    if (!response.shifts || !response.shifts.length) {
                        var error = "You don't seem to have booked any shifts to delete! If this message is sent in error, contact scheduling@crisistextline.org";
                        res.render('scheduling/chooseShiftToCancel', { error: error , url: schedule_shifts_url });
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
                            res.render('scheduling/chooseShiftToCancel', { error: error , url: schedule_shifts_url});
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
                        return sortByDayAscAndTimeAsc(moment(shiftA.start_time, wiw_date_format), moment(shiftB.start_time, wiw_date_format));
                    })

                    // Formatting shift time display to be more user-readable
                    shifts.forEach(function(shift) {
                        shift.start_time = moment(shift.start_time, wiw_date_format).tz('America/New_York').format(choose_shift_to_cancel_page_start_date_format);
                        shift.end_time = moment(shift.end_time, wiw_date_format).tz('America/New_York').format(choose_shift_to_cancel_page_end_date_format);
                    })

                    var templateData = {
                        shifts: shifts, // stringify this somehow Tue 3|Mon 6
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
    console.log(req.query, req.query.token, req.query.email);
    if (!validate(req.query.email, req.query.token)) {
        res.status(403).send('Access denied.');
    }

    var parentShiftIDsOfShiftsToBeDeleted = [];
    for (key in req.query) {
        if (req.query[key] === 'on') {
            parentShiftIDsOfShiftsToBeDeleted.push(parseInt(key));
        }
    }

    var query = {
        user_id: req.query.userID,
        start: '-1 day',
        end: '+8 days',
        unpublished: true,
        location_id: global.config.locationID.regular_shifts
    };

    api.get('shifts', query, function (shifts) {
        var parentShiftID
          , shift
          , batchPayload = []
          , deletedShiftInformation = {}
          , finalDeletedShiftArray = []
          ;

        shifts.shifts.forEach(function(shift) {
            parentShiftID = JSON.parse(shift.notes).parent_shift;

            if (parentShiftIDsOfShiftsToBeDeleted.indexOf(parentShiftID) >= 0) {
                // If the shift starts within a week, it's a shift that needs to be converted to an
                // open shift because the open shift job has already run and passed that day.
                if (Math.abs(moment().diff(moment(shift.start_time, wiw_date_format), 'days')) < global.config.time_interval.days_in_interval_to_repeat_open_shifts) {
                    var reassignShiftToOpenAndRemoveNotesRequest = {
                        "method": 'PUT',
                        "url": "/2/shifts/" + shift.id,
                        "params": {
                            user_id: 0,
                            notes: ''
                        }
                    }
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
                    var formattedStartTime = moment(shift.start_time, wiw_date_format).tz('America/New_York').format(choose_shift_to_cancel_page_start_date_format);
                    var formattedEndTime = moment(shift.end_time, wiw_date_format).tz('America/New_York').format(choose_shift_to_cancel_page_end_date_format)
                    deletedShiftInformation[parentShiftID] = { start_time: formattedStartTime, end_time: formattedEndTime };
                }
            }
        })

        for (key in deletedShiftInformation) {
            finalDeletedShiftArray.push(deletedShiftInformation[key]);
        }

        api.post('batch', batchPayload, function(response) {
            console.log('Shifts deleted response: \n', response);
            var templateData = {
                deletedShiftInformation: JSON.stringify(finalDeletedShiftArray),
                email: req.query.email,
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
        })
    });
})

router.get('/shifts/delete-success', function(req, res) {
    var templateData = {
        email: req.query.email,
        token: req.query.token,
        userName: req.query.userName,
        url: 'https://app.wheniwork.com/',
        deletedShiftInformation: req.query.deletedShiftInformation
    };

    console.log('within delete-success, templateData: ', templateData)

    res.render('scheduling/someShiftsCancelled', templateData);
})

router.get('/login', function (req, res) {
    if (!validate(req.query.email, req.query.token)) {
        res.status(403).send('Access denied.');
    }

    var email = req.query.email;

    checkUser(req.query.email, req.query.fn, req.query.ln, function (user) {
        var api2 = new WhenIWork(global.config.wheniwork.api_key, email, global.config.wheniwork.default_password, function (resp) {
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
            locations: [global.config.locationID.regular_shifts],
            password: global.config.wheniwork.default_password
        };

        api.post('users', newUser, function (data) {
            var api2 = new WhenIWork(global.config.wheniwork.api_key, altEmail, global.config.wheniwork.default_password);

            var alert = {sms: false, email: false};
            var alerts = ['timeoff', 'swaps', 'schedule', 'reminders', 'availability', 'new_employee', 'attendance'];
            var postBody = {};

            for (var i in alerts) {
                postBody[alerts[i]] = alert;
            }

            api2.post('users/alerts', postBody, function () {});

            api2.post('users/profile', {email: email}, function (profile) {
                callback(profile);
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
