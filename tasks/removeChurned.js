'use strict';

const api = CONFIG.WhenIWork;
const churnedUserEmailList = require('../churnedUserEmailList');

/**
  To run this task, add a "churnedUserEmailList.js" file to the root directory exporting
  an array of email strings that need to be deleted. (Formatted like emails.example.js)

  Then run: node console removeChurned go.
**/

module.exports.go = function () {
  var userList = [];
  getUsersToClean().then(function (users) {
    CONSOLE_WITH_TIME('user ',users);
    deactivateUser(users);
    users.forEach(function (user, index) {
      if (typeof userList[index%10] !== 'object') {
        userList[index%10] = [];
      }

      userList[index%10].push(user);
    });

    var promises = [];
    userList.forEach(function (user) {
      promises.push(new Promise(function (resolve, reject) {
        getUserShifts(user).then(function (shifts) {
          resolve(shifts);
        });
      }));
    });

    Promise.all(promises).then(function (arrayOfArrays) {
      var shiftsToDelete = [];
      for (var i in arrayOfArrays) {
        shiftsToDelete = shiftsToDelete.concat(arrayOfArrays[i]);
      }

      deleteShifts(shiftsToDelete);
    });
  });
};

function deactivateUsers(users){
  users.forEach(function(user){
    api.update('users/'+user, {location:[CONFIG.locationID.inactive_users]} )
    .catch(function(error){
      CONSOLE_WITH_TIME('Call to deactivate WiW churned user has failed');
    });
  });
}

function getUsersToClean() {
  return new Promise(function (resolve, reject) {
    var users, email;
    var uidsToClean = [];
    api.get('users?include_objects=false', function (res) {
      users = res.users;
      users.forEach(function (user, index, arr) {
        if (user.notes){
          var y = JSON.parse(user.notes).canonicalEmail;
          console.log('y ', y)
        }

        if(y){
          email = JSON.parse(user.notes).canonicalEmail;
          if(user.last_name=='Bogorodova'){
           console.log(user)
           console.log(email)
          }
        } else {
          console.log('IN THE CORRECT ONE')
          email = user.email;
          console.log('emaillll ', email)
        }

        if (churnedUserEmailList.indexOf(email) >= 0) {
          console.log(user.first_name)
          uidsToClean.push(user.id);
        }
      });

      api.get('requests?include_objects=false', {start: '-3 months', end: '+3 months'}, function (res) {
        console.log('inside of api get requests')
        res.requests.forEach(function (req, index, arr) {
          var p = uidsToClean.indexOf(req.user_id);

          if (p >= 0) {
            uidsToClean.splice(p, 1);
          }
        });

        resolve(uidsToClean);
      });
    });
  });
}

function getUserShifts(users) {
  console.log('inside of getUserShifts')
  return new Promise(function (resolve, reject) {
    var shiftLists = [];
    var params = {
      unpublished: true,
      start: '-1 years',
      end: '+100 years',
      user_id: users.join(',')
    };

    var shifts = [];

    api.get('shifts?include_objects=false', params, function (res) {
      res.shifts.forEach(function(shift, index, arr) {
        shifts.push(shift.id);
      });

      resolve(shifts);
    });
  });
}

function deleteShifts(shiftsToDelete) {
  CONSOLE_WITH_TIME('Total number of shifts to delete for churned users: ', shiftsToDelete.length);
  var thisBatch = [],
      batches = [];
  for (var i = 0; i < shiftsToDelete.length; i++) {
    setTimeout(function (shift) {
      CONSOLE_WITH_TIME(shift);
      api.delete('shifts/' + shift);
    }.bind(null, shiftsToDelete[i]), 75*i);
  }
}
