var WhenIWork = require('wheniwork-unofficial');
var api = new WhenIWork(KEYS.wheniwork.api_key, KEYS.wheniwork.username, KEYS.wheniwork.password);
var moment = require('moment');
var date_format = 'YYYY-MM-DD HH:mm:ss';

var fs = require('fs');

/* 
  usersTimezones: Returns a csv (written to file) of users with their Timezones.
  Output CSV include user: Email, First Name, Last Name, Timezone, Timezone Offset from GMT
*/

module.exports.usersTimezones = function () {
  Promise.all([getUsersPromise(), getTimezones()])
  .then(reformatForCSV)
  .then(exportCSV)
  .catch(function(err){
    CONSOLE_WITH_TIME(err);
  });

  function getTimezones () {
    return new Promise(function(resolve, reject){
      api.get('timezones?include_objects=false', function(response) {
        if (!response) reject(response);
        else resolve(response);
      });
    });
  }

  function getUsersPromise () {
    return new Promise(function(resolve, reject){
      api.get('users?include_objects=false', {}, function(response) {
        if (!response.users) reject(response);
        else resolve(response);
      });
    });
  }

  function reformatForCSV (responses) {
    var users = responses[0].users;
    var timezones = {};

    // set timezone.id = it's offset from GMT for export
    timezones[0] = "n/a"; 
    responses[1].timezones.forEach(function(zone){
      timezones[zone.id] = zone.offset;
    });

    var keys = "Email,First,Last,Timezone,Offset";

    var CSVFormattedString = keys + "\n";

    users.forEach(function(user){
      // Mark which users have not set their timezone
      if (user.timezone_id === 0) user.timezone_name = "Not Set";
      // This order must match the keys described above.
      reqString = user.email.replace(/,/g, '') + "," + user.first_name.replace(/,/g, '') + "," + 
      user.last_name.replace(/,/g, '') + "," + user.timezone_name.replace(/,/g, '') +  "," + 
      timezones[user.timezone_id] + "\n";

      CSVFormattedString += reqString;
    });

    return CSVFormattedString;
  }

  function exportCSV (CSVString) {
    fs.writeFile('./usersTimezones.csv', CSVString, 'utf8', function (err) {
      if (err) CONSOLE_WITH_TIME('FS err:', err);
      else CONSOLE_WITH_TIME('It\'s saved!');
    });
  }
};