'use strict';

const api = CONFIG.WhenIWork;
const churnedUserEmailList = require('../churnedUserEmailList');

/**
  To run this task, add a "churnedUserList.js" file to the root directory exporting
  an array of email strings that need to be deleted. (Formatted like emails.example.js)

  Then run: node console removeChurned go.
**/

module.exports.go = function () {
  var userList = [];
  getUsersToClean().then(function (users) {
    CONSOLE_WITH_TIME(users);
    users.forEach(function (e, i) {
      if (typeof userList[i%10] !== 'object') {
        userList[i%10] = [];
      }

      userList[i%10].push(e);
    });

    var promises = [];
    userList.forEach(function (e) {
      promises.push(new Promise(function (resolve, reject) {
        getUserShifts(e).then(function (shifts) {
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

function getUsersToClean() {
  return new Promise(function (resolve, reject) {
    var users, email;
    var uidsToClean = [];
    api.get('users?include_objects=false', function (res) {
      users = res.users;

      users.forEach(function (e, i, arr) {
        try {
          email = JSON.parse(e.notes).canonicalEmail;
        } catch (e) {
          email = e.email;
        }

        if (churnedUserEmailList.indexOf(email) >= 0) {
          uidsToClean.push(e.id);
        }
      });

      api.get('requests?include_objects=false', {start: '-3 months', end: '+3 months'}, function (res) {
        res.requests.forEach(function (e, i, arr) {
          var p = uidsToClean.indexOf(e.user_id);

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
      res.shifts.forEach(function(e, i, arr) {
        shifts.push(e.id);
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
