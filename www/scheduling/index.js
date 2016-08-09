'use strict';

global.KEYS = require('../../keys.js');
global.CONFIG = require('../../config.js');

const express   = require('express');
const api = CONFIG.WhenIWork;
const createSecondAPI = CONFIG.WhenIWorkDynamic;
const stathat   = require(CONFIG.root_dir + '/lib/stathat');
const querystring = require('querystring');
const helpers = require(CONFIG.root_dir + '/www/scheduling/helpers');
const shiftSchedulingRouter = require('./shifts');
const router = express.Router();
const request = require('request');

router.use('/shifts', shiftSchedulingRouter);

router.get('/login', function (req, res) {
  if (!helpers.validate(req.query.email, req.query.token)) {
    res.status(403).send('Access denied.');
    return;
  }
  var email = req.query.email;
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
      notes['timezoneSet'] = true;
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
    newAPI.post('users/autologin', function (data) {
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

function reactivate(user){
  console.log('reactivate')
  return new Promise(function(resolve, reject){
    api.update('users/'+user.id, {reactivate:true}, function(res){
      console.log('RES ', res)
      if (res) resolve(res);
      else reject('User reactivation failed');
    });
  });
}

function allUsers(email, altEmail, callback){
  return new Promise (function(resolve, reject){

    var options = {
        method: 'get',
        url: 'https://api.wheniwork.com/2/users?include_objects=false&show_deleted=true',
        headers: {'W-Token': '62f81047e8c5e26cb0351f6fd883cbc436cb5a6f'},
    };

    request(options, function (error, response, body) {
        if (error) {
            console.log(error);
            callback(error);
        } else {
          var users = JSON.parse(body).users;
          for (var i in users) {
            if (users[i].email == email && !users[i].is_deleted || users[i].email == altEmail && !users[i].is_deleted) {

                if(users[i].locations.indexOf(CONFIG.locationID.inactive_users)>=0){
                  api.update('users/'+users[i].id, {location: [CONFIG.locationID.makeup_and_extra_shifts, CONFIG.locationID.regular_shifts]})
                  .catch(function(error){
                    CONSOLE_WITH_TIME('Update call to WiW reactivation failed ', error);
                  })
                }
                callback(users[i]);
                resolve(users[i]);

            } else if(users[i].is_deleted && users[i].email === email || users[i].is_deleted && users[i].email === altEmail){
                reactivate(users[i])
                .then(function(){
                  callback(user[i]);
                  resolve(user[i]);
                })
                .catch(function(error){
                  CONSOLE_WITH_TIME('User', user[i].login_id,'reactivation failed', error)
                })
            }
          }
        }
    });
  });
}

function createUser(newUser){

  return new Promise(function(resolve, reject){
    stathat.increment('Scheduling - Accounts Created', 1);

    api.post('users', newUser, function (data) {
      var secondAPI = createSecondAPI(KEYS.wheniwork.api_key, altEmail, KEYS.wheniwork.default_password, function (error) { CONSOLE_WITH_TIME('Error creating secondAPI within createUser: ', error)});

      var alert = {sms: false, email: false};
      var alerts = ['timeoff', 'swaps', 'schedule', 'reminders', 'availability', 'new_employee', 'attendance'];
      var postBody = {};

      for (var i in alerts) {
        postBody[alerts[i]] = alert;
      }

      secondAPI.post('users/alerts', postBody, function () {});
      secondAPI.post('users/profile', {email: email}, function (profile) {
        CONSOLE_WITH_TIME('User Successfully created', profile.user.email);
        callback(profile.user);
        resolve(profile.user);
      });

    })
    .catch(function(error){
      reject('User creation failed, error: ' +  error);
    });
  });
}

function checkUser(email, first, last, callback) {
  var altEmail = helpers.generateAltEmail(email);
  var newUser;

  allUsers(email, altEmail, callback)
  .then(function(data){
    if(data){return;}
    newUser = {
      role: 3,
      //i think we can create accounts with regular emails now
      email: altEmail,
      first_name: first,
      last_name: last,
      activated: true,
      locations: [CONFIG.locationID.regular_shifts, CONFIG.locationID.makeup_and_extra_shifts],
      password: KEYS.wheniwork.default_password,
      notes: JSON.stringify({ canonicalEmail: email })
    };
    return createUser(newUser)
  })
  .catch(function(err){
    CONSOLE_WITH_TIME('Promise chain failed')
  });
  //below is returned for testing purposes
  return newUser;
}
module.exports = {router: router, checkUser: checkUser, getTimezones: getTimezones};
