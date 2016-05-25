var express   = require('express')
  , WhenIWork = require('wheniwork-unofficial')
  , api = require('./initWhenIWorkAPI')
  , moment    = require('moment')
  , sha1      = require('sha1')
  , stathat   = require(global.config.root_dir + '/lib/stathat')
  , returnColorizedShift = require(global.config.root_dir + '/lib/ColorizeShift').go
  , querystring = require('querystring')
  , helpers = require(global.config.root_dir + '/www/scheduling/helpers')
  , shiftSchedulingRouter = require('./shifts')
  ;

var router = express.Router();

var wiwDateFormat = 'ddd, DD MMM YYYY HH:mm:ss ZZ'
  , chooseRegShiftToCancelPageStartDateFormat = 'dddd h:mm a' // Wednesday 4:00 p
  , chooseRegShiftToCancelPageEndDateFormat = 'h:mm a z' // 6:00 pm ES
  , chooseMakeupShiftToCancelPageStartDateFormat = 'dddd, MMM Do YYYY - h:mm a' // Wednesday, Mar 30th 2016 - 4:00 p
  , chooseMakeupShiftToCancelPageEndDateFormat = 'h:mm a z' // 6:00 pm ES
  , scheduleShiftsURL = '/scheduling/login?'
  ;

router.use('/shifts', shiftSchedulingRouter);

router.get('/login', function (req, res) {
  if (!helpers.validate(req.query.email, req.query.token)) {
    res.status(403).send('Access denied.');
    return;
  }

  var email = req.query.email;

  checkUser(req.query.email, req.query.fn, req.query.ln, function (user) {
    // If they have not yet set their timezone
    if ((user.notes.indexOf('timezoneSet') < 0) && req.query.timezone == undefined) {
      res.redirect('/scheduling/timezone?' + querystring.stringify(req.query));
      return;
    }
    // If they are coming via the timezone route (they've selected a timezone)
    // Note this is all done in the background
    else if (req.query.timezone !== undefined && req.query.timezone !== '') {
      // Parse notes
      var notes = {};
      try {
        notes = JSON.parse(user.notes);
      } catch (e) {
        if (user.notes !== undefined && user.notes.trim() !== '') {
            notes[user.notes.trim()] = true;
        }
      }
      notes['timezoneSet'] = true;

      // Update the profile to reflect that they set their timezone
      api.update('users/' + user.id, {notes: JSON.stringify(notes), timezone_id: req.query.timezone});
    }

    // Try to log in as the user using our global password.
    // If we can't, immediately redirect to When I Work and don't try to do anything else.
    var api2 = new WhenIWork(global.config.wheniwork.api_key, user.email, global.config.wheniwork.default_password, function (resp) {
        res.redirect('https://app.wheniwork.com/login/?redirect=myschedule');
    });

    // Try to generate an autologin token for a user
    api2.post('users/autologin', function (data) {
      // If we can't generate one for some reason, redirect immediately.
      if (typeof data.error !== 'undefined') {
        res.redirect('https://app.wheniwork.com');
      }
      // Once we have an autologin token...
      else {
        var destination = 'myschedule';
        if (req.query.destination != undefined && req.query.destination != '') {
          destination = req.query.destination;
        }

        res.redirect('https://app.wheniwork.com/'+destination+'?al=' + data.hash);
      }
    });
  });
});

router.get('/timezone', function (req, res) {
  if (!helpers.validate(req.query.email, req.query.token)) {
    res.status(403).send('Access denied.');
    return;
  }

  var timezones = {
    9: 'Eastern',
    11: 'Central',
    13: 'Mountain',
    170: 'Arizona',
    15: 'Pacific',
    19: 'Hawaii',
    167: 'Alaska'
  };

  var url = '/scheduling/login';

  res.render('scheduling/timezone', {url: url, params: req.query, timezones: timezones});
});


function checkUser(email, first, last, callback) {
  var altEmail = helpers.generateAltEmail(email);

  api.get('users', function (users) {
    users = users.users;
    for (var i in users) {
      if (users[i].email == email || users[i].email == altEmail) {
        callback(users[i]);
        return;
      }
    }
      
    stathat.increment('Scheduling - Accounts Created', 1);
    /**
      At this point, we didn't find the user so let's create it.

      When someone already has an email registered with WhenIWork, but it's
      attached to another organization's account, the account collides. Hence,
      We need to create a new account using a faked email.
    **/
    var newUser = {
      role: 3,
      email: altEmail,
      first_name: first,
      last_name: last,
      activated: true,
      locations: [global.config.locationID.regular_shifts, global.config.locationID.makeup_and_extra_shifts],
      password: global.config.wheniwork.default_password,
      notes: JSON.stringify({ canonicalEmail: email })
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

module.exports = router;
