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

                    // Formatting shift time display to be more user-readable
                    shifts.forEach(function(shift) {
                        shift.start_time = moment(shift.start_time, wiw_date_format).tz('America/New_York').format(choose_shift_to_cancel_page_start_date_format);
                        shift.end_time = moment(shift.end_time, wiw_date_format).tz('America/New_York').format(choose_shift_to_cancel_page_end_date_format);
                    })

                    var templateData = { 
                        shifts: shifts, 
                        userID: userID, 
                        email: email, 
                        token: req.query.token, 
                        userName: userName
                    }
                    // Then, display them in the jade template. 
                    res.render('scheduling/chooseShiftToCancel', templateData);
                })
                break;
            }
        }
    })
})

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

// Route which allows individual deletion of shifts
router.post('/shifts', function(req, res) {
    if (!validate(req.body.email, req.body.token)) {
        res.status(403).send('Access denied.');
    }

    var parentShiftIDsOfShiftsToBeDeleted = [];
    for (key in req.body) {
        if (req.body[key] === 'on') {
            parentShiftIDsOfShiftsToBeDeleted.push(parseInt(key));
        }
    }
    
    var query = {
        user_id: req.body.userID,
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

        api.post('batch', batchPayload, function(response) {
            console.log('Shifts deleted response: \n', response);
            var templateData = { 
                deletedShiftInformation: deletedShiftInformation, 
                email: req.body.email, 
                token: req.body.token, 
                url: 'https://app.wheniwork.com/'
            }

            res.render('scheduling/someShiftsCancelled', templateData);
        })
    });
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

// Route to cancel all shifts
router.get('/cancel-shift', function(req, res) {
    if (!validate(req.query.email, req.query.token)) {
        res.status(403).send('Access denied.');
    }

    var email = req.query.email;
    var altEmail = email.replace(/\W+/g, '');
    altEmail = 'admin+'+altEmail+'@crisistextline.org';

    api.get('users', function (users) {
        users = users.users;
        for (var i in users) {
            if (users[i].email == email || users[i].email == altEmail) {
                var q = {
                    user_id: users[i].id,
                    start: moment().add(-1, 'day').format('YYYY-MM-DD 00:00:00'),
                    end: moment().add(50, 'years').format('YYYY-MM-DD HH:mm:ss'),
                    unpublished: true,
                    location_id: global.config.locationID.regular_shifts
                };

                // Works to delete the normal volume of shifts associated with one user (2 shifts), recurred
                // over 50 years. API will break if significantly larger volumes of shifts are attempted
                // to be deleted. 
                api.get('shifts', q, function (shifts) {
                    var shift
                      , batchPayload = []
                      ;

                    for (var i in shifts.shifts) {

                        shift = shifts.shifts[i];
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
                    }
                    api.post('batch', batchPayload, function(response) {
                        console.log(response);
                    })

                    var api2 = new WhenIWork(global.config.wheniwork.api_key, email, global.config.wheniwork.default_password, function (resp) {
                        res.render('scheduling/allShiftsCancelled', { url: 'https://app.wheniwork.com/' });
                    });

                    api2.post('users/autologin', function (data) {
                        res.render('scheduling/allShiftsCancelled', { url: 'https://app.wheniwork.com/myschedule?al=' + data.hash });
                    });
                });

                break;
            }
        }
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

module.exports = router;
