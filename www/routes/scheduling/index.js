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

    api.get('users', function (users) {
        users = users.users;
        for (var i in users) {
            if (users[i].email == email) {
                var api2 = new WhenIWork(global.config.wheniwork.api_key, email, global.config.wheniwork.default_password);

                api2.post('users/autologin', function (data) {
                    res.redirect('https://app.wheniwork.com/scheduler?al=' + data.hash);
                });

                break;
            }
        }
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
                    location_id: 959293
                };

                api.get('shifts', q, function (shifts) {
                    var del = {ids: []};
                    for (var i in shifts.shifts) {
                        del.ids.push(shifts.shifts[i].id);
                    }
                    api.delete('shifts', del, function (resp) {
                        var api2 = new WhenIWork(global.config.wheniwork.api_key, email, global.config.wheniwork.default_password);

                        api2.post('users/autologin', function (data) {
                            res.render('scheduling/cancelShift', { token: data.hash });
                        });
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

module.exports = router;
