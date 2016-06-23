/**
Purpose: Get shifts from When I Work and sort users by which shift they are signed up for
Input should be the WiW API to call (user or supervisor) and callback for how to use the output
Data is hashed by shift start time: [users scheduled];

Example for using supervisor API:
var wIW = require('wheniwork-unofficial');
var apiSup = wIW.apiWithOptons({
  key: KEYS.wheniwork.api_key, 
  email: KEYS.wheniwork.username, 
  password: KEYS.wheniwork.password,
  companyName: "Crisis Text Line Supervisors"
});
var fs = require('fs');

// sortUsersByShift(apiSup, 995815)
// .then(writeToFile);

function writeToFile (text) {
  fs.writeFile('../../../test/helpers/sampleResponse/testingSupervisorsResponse.json', JSON.stringify(text), (err) => {
    if (err) throw err;
    console.log('It\'s saved!');
  });
}

**/

var gravatar = require('gravatar');

function sortUsersByShift(apiToCall, locationId, correctAccountID) {
  var shiftSearchParams = {
    end: '+' + CONFIG.time_interval.one_week  + ' days',
    location_id: locationId
  };
  return new Promise(function(resolve, reject) {
    apiToCall.get('shifts', shiftSearchParams, function(response) {
      try {
        var userIdToInfo = matchUserIdToInfo(response.users, correctAccountID);
        var shiftToUserObj = matchShiftToUserId(response.shifts, userIdToInfo);
        resolve(shiftToUserObj);
      }
      catch(err) {
        reject(err);
      }
    });
  });
}

function matchUserIdToInfo (users, correctAccountID) {
  var supsById = {};

  users.forEach(function(user) {
    // This if statement insures that the users are from the appropriate 'company' in case WiW sends back the wrong ones
    if (user.account_id === correctAccountID){
      supsById[user.id] = {
        first: user.first_name,
        last: user.last_name,
        email: user.email,
        imgURL: gravatar.url(user.email, {protocol: 'https',  s: '200'}),
      };
    }
  });

  return supsById;
}

function matchShiftToUserId(shifts, supsById) {
  var shiftStartToUsers = {};

  shifts.forEach(function(shift){
    // Each shift start time will key to an array of supervisor objects
    if (!shiftStartToUsers[shift.start_time]) shiftStartToUsers[shift.start_time] = [];
    shiftStartToUsers[shift.start_time].push(supsById[shift.user_id]);
  });

  return shiftStartToUsers;
}

module.exports = sortUsersByShift;