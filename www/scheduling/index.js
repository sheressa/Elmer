'use strict';
const express   = require('express');
const api = CONFIG.WhenIWork;
const createSecondAPI = CONFIG.WhenIWorkDynamic;
const stathat   = require(CONFIG.root_dir + '/lib/stathat');
const querystring = require('querystring');
const helpers = require(CONFIG.root_dir + '/www/scheduling/helpers');
const shiftSchedulingRouter = require('./shifts');
const router = express.Router();

router.use('/shifts', shiftSchedulingRouter);

router.get('/login', function (req, res) {
  if (!helpers.validate(req.query.email, req.query.token)) {
    res.status(403).send('Access denied.');
    return;
  }
  checkUser(req.query.email, req.query.fn, req.query.ln, function (user) {
    // If they are coming via the timezone route (they've selected a timezone)
    // Note this is all done in the background
    if (req.query.timezone) {
      // Parse notes
      var notes = {};
      try {
        notes = JSON.parse(user.notes);
      } catch (e) {
        if (user.notes !== undefined && user.notes.trim() !== '') {
          notes[user.notes.trim()] = true;
        }
      }
      notes.timezoneSet = true;
      // Update the profile to reflect that they set their timezone
      api.update('users/' + user.id, {notes: JSON.stringify(notes), timezone_id: req.query.timezone});
    }
    // If they have not yet set their timezone
    else if (typeof user.notes === "undefined" || user.notes.indexOf('timezoneSet') < 0 ) {
      res.redirect('/scheduling/timezone?' + querystring.stringify(req.query));
      return;
    }
    // Try to log in as the user using our global password.
    // If we can't, immediately redirect to When I Work and don't try to do anything else.
    var newAPI = createSecondAPI(KEYS.wheniwork.api_key, user.email, KEYS.wheniwork.default_password, function (resp) {
        res.redirect('https://app.wheniwork.com/login/?redirect=myschedule');
    });
    // Try to generate an autologin token for a user
    newAPI.post('users/autologin', function (response) {
      // If we can't generate one for some reason, redirect immediately.
      if (typeof response.error !== 'undefined') {
        res.redirect('https://app.wheniwork.com');
      }
      // Once we have an autologin token...
      else {
        var destination = 'myschedule';
        if (req.query.destination != undefined && req.query.destination != '') {
          destination = req.query.destination;
        }
        res.redirect('https://app.wheniwork.com/'+destination+'?al=' + response.hash);
      }
    });
  });
});

router.get('/timezone', function (req, res) {
  getTimezones(req, res);
});

function getTimezones(req, res) {
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
}

// reactivating a deleted user
function reactivate(user){
  return new Promise(function(resolve, reject){
    api.update(`users/${user.id}`, {reactivate:true}, function(res){
      if (res.message) reject('User reactivation failed:', res.message);
      else resolve(res);
    });
  });
}

// retrieves all WiW users and checks for a particular user
function allUsers(email, altEmail, callback){
  var match = false;
  return new Promise (function(resolve, reject){
        var users = global.USERS_CACHE;
        for (var i in users) {
          // existing users
          if (users[i].email === email && !users[i].is_deleted || users[i].email === altEmail && !users[i].is_deleted) {
              match=true;
              callback(users[i]);
              resolve(users[i]);
          // existing deleted users; reactivation sequence
          } else if (users[i].is_deleted && users[i].email === email){
            match=true;
              reactivate(users[i])
              .then(function(user){
                callback(user);
                resolve(user);
              })
              .catch(function(error){
                CONSOLE_WITH_TIME('User', users[i].login_id,'reactivation failed', error)
              });
        // we didn't find the user in WiW records, we need to create a newUser
          } else if (i==users.length-1 && !match) resolve();
        }
      })
}

// creates a new user
function createUser(newUser, callback){
  return new Promise(function(resolve, reject){
    stathat.increment('Scheduling - Accounts Created', 1);
    api.post('users', newUser, function (response) {
      global.USERS_CACHE.push(response.user);
      var secondAPI = createSecondAPI(KEYS.wheniwork.api_key, newUser.email, KEYS.wheniwork.default_password, function (error) { CONSOLE_WITH_TIME('Error creating secondAPI within createUser: ', error)});

      var alert = {sms: false, email: false};
      var alerts = ['timeoff', 'swaps', 'schedule', 'reminders', 'availability', 'new_employee', 'attendance'];
      var postBody = {};

      for (var i in alerts) {
        postBody[alerts[i]] = alert;
      }

      secondAPI.post('users/alerts', postBody, function () {});
      secondAPI.post('users/profile', {email: newUser.email}, function (profile) {
        CONSOLE_WITH_TIME('User Successfully created', profile.user.email);
        callback(profile.user);
      });

    })
    .catch(function(error){
      reject('User creation failed, error: ' +  error);
    });
  });
}

// checks the status of the user: active, deleted,or newUser
function checkUser(email, first, last, callback) {
  var altEmail = helpers.generateAltEmail(email);
  var newUser;

  allUsers(email, altEmail, callback)
  .then(function(response){
    if(!response){
      // At this point, we didn't find the user so let's create it.
      newUser = {
        role: 3,
        email: email,
        first_name: first,
        last_name: last,
        activated: true,
        locations: [CONFIG.locationID.regular_shifts, CONFIG.locationID.makeup_and_extra_shifts],
        password: KEYS.wheniwork.default_password
      };
      createUser(newUser, callback);
    }
  })
  .catch(function(err){
    CONSOLE_WITH_TIME('Promise chain failed ', err)
  });
}

module.exports = {router: router, checkUser: checkUser, getTimezones: getTimezones};
