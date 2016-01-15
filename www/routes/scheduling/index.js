var express   = require.main.require('express');
var WhenIWork = require.main.require('wheniwork-unofficial');
var moment    = require.main.require('moment');
var sha1      = require.main.require('sha1');

var router = express.Router();

var api = new WhenIWork(global.config.wheniwork.api_key, global.config.wheniwork.username, global.config.wheniwork.password);

var wiw_date_format = 'ddd, DD MMM YYYY HH:mm:ss ZZ';

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
                res.redirect('https://app.wheniwork.com/myschedule?al=' + data.hash);
            }
        });
    });
});

router.get('/cancel-shift', function(req, res) {
    if (!validate(req.query.email, req.query.token)) {
        res.status(403).send('Access denied.');
    }

    var email = req.query.email;

    api.get('users', function (users) {
        users = users.users;
        for (var i in users) {
            if (users[i].email == email) {
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
                    var batchPayload = [];
                    for (var i in shifts.shifts) {

                        var shift = shifts.shifts[i];
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

                    var api2 = new WhenIWork(global.config.wheniwork.api_key, email, global.config.wheniwork.default_password);

                    api2.post('users/autologin', function (data) {
                        res.render('scheduling/cancelShift', { token: data.hash });
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
