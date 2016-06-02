global.config = require('../../../config.js');
var api = require('../../scheduling/initWhenIWorkAPI'),
helpers = require(global.config.root_dir + '/www/scheduling/helpers');
var stathat = require(global.config.root_dir + '/lib/stathat.js');
var WhenIWork = require('wheniwork-unofficial');
var data = require('../../../test/sampleData.js');

var checkUser2 = function(email, first, last, callback) {
  var altEmail = helpers.generateAltEmail(email);
  api.get('users', function (users) {
    for (var i in users.users) {
      if (users.users[i].email == email || users.users[i].email == altEmail) {
        callback(users.users[i]);
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
      password: keys.wheniwork.default_password,
      notes: JSON.stringify({ canonicalEmail: email })
    };
    api.post('users', newUser, function (data) {
      var api2 = new WhenIWork(keys.wheniwork.api_key, altEmail, keys.wheniwork.default_password, function (data) {
      });

      var alert = {sms: false, email: false};
      var alerts = ['timeoff', 'swaps', 'schedule', 'reminders', 'availability', 'new_employee', 'attendance'];
      var postBody = {};

      for (var i in alerts) {
        postBody[alerts[i]] = alert;
      }

      callback(data);
      api2.post('users/alerts', postBody, function () {});
      api2.post('users/profile', {email: email}, function (profile) {
        callback(profile.user);
      });
    });
  });
};

module.exports = checkUser2;
