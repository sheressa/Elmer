var express = require('express');
var router = express.Router();
var WhenIWork = require('wheniwork-unofficial');
var moment = require('moment');
var sha1 = require('sha1');

var api = new WhenIWork(global.config.wheniwork.api_key, global.config.wheniwork.username, global.config.wheniwork.password);

router.get('/login', function (req, res) {
    if (!validate(req.query.email, req.query.token)) {
        res.status(403).send('Access denied.');
    }

    var email = req.query.email;

    checkUser(req.query.email, req.query.fn, req.query.ln, function (user) {
        var api2 = new WhenIWork(global.config.wheniwork.api_key, email, global.config.wheniwork.default_password);

        api2.post('users/autologin', function (data) {
            res.redirect('https://app.wheniwork.com/myschedule?al=' + data.hash);
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
                    start: moment().format('YYYY-MM-DD 00:00:00'),
                    end: moment([2050]).format('YYYY-MM-DD HH:mm:ss'),
                    unpublished: true,
                    location_id: '959290,959293,959296,959299,959302'
                };

                api.get('shifts', q, function (shifts) {
                    for (var i in shifts.shifts) {
                        api.update('shifts/'+shifts.shifts[i].id, {user_id: 0});
                    }
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
    api.get('users', function (users) {
        users = users.users;
        for (var i in users) {
            if (users[i].email == email) {
                callback(users[i]);
                return;
            }
        }

        // At this point, we didn't find the user so let's create it.
        var tempEmail = 'admin+wiw'+new Date().getTime() + '@crisistextline.org';
        var newUser = {
            role: 3,
            email: tempEmail,
            first_name: first,
            last_name: last,
            activated: true,
            locations: [959290],
            password: global.config.wheniwork.default_password
        };

        api.post('users', newUser, function (data) {
            var api2 = new WhenIWork(global.config.wheniwork.api_key, tempEmail, global.config.wheniwork.default_password);

            var alert = {sms: false, email: false};
            var alerts = ['timeoff', 'swaps', 'schedule', 'reminders', 'availability', 'new_employee', 'attendance'];
            var postBody = {};

            for (var i in alerts) {
                postBody[alerts[i]] = alert;
            }

            api2.post('users/alerts', postBody, function () {});

            console.log(email);
            api2.post('users/profile', {email: email}, function (profile) {
                callback(profile);
            });
        });
    });
}

module.exports = router;